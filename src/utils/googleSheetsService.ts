import {
  Account,
  AgentProfile,
  AppUser,
  CashMutation,
  PosSale,
  PrinterSettings,
  Product,
  StockAdjustmentLog,
  Transaction,
} from '../types';

export interface AppSyncData {
  transactions: Transaction[];
  accounts: Account[];
  mutations: CashMutation[];
  products: Product[];
  posSales?: PosSale[];
  stockLogs?: StockAdjustmentLog[];
  users?: AppUser[];
  profile: AgentProfile | null;
  printerSettings: PrinterSettings | null;
}

export type SyncStatusType = 'unconfigured' | 'synced' | 'syncing' | 'error';

export interface SyncState {
  status: SyncStatusType;
  lastSyncedAt: string | null;
  spreadsheetName: string | null;
  spreadsheetUrl: string | null;
  errorMessage: string | null;
  pendingCount: number;
}

const STORAGE_GAS_URL_KEY = 'miniatm_gas_backend_url';
const STORAGE_GAS_SHEET_NAME_KEY = 'miniatm_gas_sheet_name';
const STORAGE_GAS_SHEET_URL_KEY = 'miniatm_gas_sheet_url';
const STORAGE_GAS_LAST_SYNC_KEY = 'miniatm_gas_last_sync';

// Global state
let currentSyncState: SyncState = {
  status: 'unconfigured',
  lastSyncedAt: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_GAS_LAST_SYNC_KEY) : null,
  spreadsheetName: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_GAS_SHEET_NAME_KEY) : null,
  spreadsheetUrl: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_GAS_SHEET_URL_KEY) : null,
  errorMessage: null,
  pendingCount: 0,
};

// Listeners for React subscribers
type SyncStateListener = (state: SyncState) => void;
const listeners: Set<SyncStateListener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener({ ...currentSyncState });
    } catch (e) {
      console.warn('Listener error', e);
    }
  });
}

export function subscribeSyncState(listener: SyncStateListener): () => void {
  listeners.add(listener);
  listener({ ...currentSyncState });
  return () => {
    listeners.delete(listener);
  };
}

export function getGasUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_GAS_URL_KEY) || '';
}

export function setGasUrl(url: string, sheetName?: string, sheetUrl?: string): void {
  const cleanUrl = url.trim();
  if (cleanUrl) {
    localStorage.setItem(STORAGE_GAS_URL_KEY, cleanUrl);
    if (sheetName) {
      localStorage.setItem(STORAGE_GAS_SHEET_NAME_KEY, sheetName);
      currentSyncState.spreadsheetName = sheetName;
    }
    if (sheetUrl) {
      localStorage.setItem(STORAGE_GAS_SHEET_URL_KEY, sheetUrl);
      currentSyncState.spreadsheetUrl = sheetUrl;
    }
    currentSyncState.status = 'synced';
  } else {
    localStorage.removeItem(STORAGE_GAS_URL_KEY);
    localStorage.removeItem(STORAGE_GAS_SHEET_NAME_KEY);
    localStorage.removeItem(STORAGE_GAS_SHEET_URL_KEY);
    currentSyncState.status = 'unconfigured';
    currentSyncState.spreadsheetName = null;
    currentSyncState.spreadsheetUrl = null;
  }
  notifyListeners();
}

/**
 * Update internal sync status
 */
function updateSyncState(updates: Partial<SyncState>) {
  currentSyncState = { ...currentSyncState, ...updates };
  if (updates.lastSyncedAt) {
    localStorage.setItem(STORAGE_GAS_LAST_SYNC_KEY, updates.lastSyncedAt);
  }
  notifyListeners();
}

/**
 * Send POST / GET request to Google Apps Script Web App
 * Handles CORS and redirect patterns natively for Apps Script
 */
async function sendToGas(
  action: string,
  payload: Record<string, unknown> = {},
  customUrl?: string
): Promise<{ success: boolean; data?: unknown; message?: string; raw?: unknown }> {
  const url = (customUrl || getGasUrl()).trim();
  if (!url) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
  }

  updateSyncState({
    status: 'syncing',
    errorMessage: null,
    pendingCount: currentSyncState.pendingCount + 1,
  });

  try {
    const bodyData = {
      action,
      ...payload,
      timestamp: new Date().toISOString(),
    };

    // Use standard POST with text/plain to avoid preflight CORS blockage in GAS Web Apps
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    if (json.status === 'success') {
      const nowStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      updateSyncState({
        status: 'synced',
        lastSyncedAt: nowStr,
        errorMessage: null,
        pendingCount: Math.max(0, currentSyncState.pendingCount - 1),
      });
      return { success: true, data: json.data, raw: json };
    } else {
      throw new Error(json.message || 'Respons error dari Google Apps Script.');
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('GAS Sync Error:', errMsg);

    updateSyncState({
      status: 'error',
      errorMessage: errMsg,
      pendingCount: Math.max(0, currentSyncState.pendingCount - 1),
    });

    return {
      success: false,
      message: errMsg.includes('Failed to fetch')
        ? 'Gagal terhubung ke Google Apps Script. Pastikan Web App di-deploy dengan opsi "Who has access: Anyone".'
        : errMsg,
    };
  }
}

/**
 * Ping test Google Apps Script Web App connection
 */
export async function testGasConnection(
  url: string
): Promise<{ success: boolean; message: string; sheetName?: string; sheetUrl?: string }> {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('https://script.google.com/')) {
      return {
        success: false,
        message: 'URL harus berawal dari https://script.google.com/macros/s/.../exec',
      };
    }

    // Try GET ping first
    const getRes = await fetch(`${cleanUrl}?action=ping`, {
      method: 'GET',
    });

    if (!getRes.ok) {
      throw new Error(`HTTP ${getRes.status}: ${getRes.statusText}`);
    }

    const data = await getRes.json();
    if (data.status === 'success') {
      return {
        success: true,
        message: 'Berhasil terhubung ke Google Apps Script!',
        sheetName: data.spreadsheetName,
        sheetUrl: data.spreadsheetUrl,
      };
    }

    // Fallback try POST ping
    const postRes = await sendToGas('ping', {}, cleanUrl);
    if (postRes.success) {
      return {
        success: true,
        message: 'Berhasil terhubung ke Google Apps Script (via POST)!',
      };
    }

    return {
      success: false,
      message: data.message || 'Tidak menerima respon sukses dari script.',
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: errMsg.includes('Failed to fetch')
        ? 'Koneksi ditolak/CORS. Pastikan script sudah di-Deploy ulang sebagai Web App dengan izin "Anyone".'
        : `Gagal menguji koneksi: ${errMsg}`,
    };
  }
}

/**
 * Fetch all initial application data from Google Sheets
 */
export async function fetchInitialDataFromSheets(): Promise<{
  success: boolean;
  data?: AppSyncData;
  message?: string;
}> {
  const url = getGasUrl();
  if (!url) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
  }

  updateSyncState({ status: 'syncing', errorMessage: null });

  try {
    let resultData: AppSyncData | undefined;

    // Strategy 1: Fast GET request
    try {
      const getResponse = await fetch(`${url}?action=getData`, { method: 'GET' });
      if (getResponse.ok) {
        const json = await getResponse.json();
        if (json.status === 'success' && json.data) {
          resultData = json.data as AppSyncData;
          if (json.spreadsheetName) {
            localStorage.setItem(STORAGE_GAS_SHEET_NAME_KEY, json.spreadsheetName);
            currentSyncState.spreadsheetName = json.spreadsheetName;
          }
          if (json.spreadsheetUrl) {
            localStorage.setItem(STORAGE_GAS_SHEET_URL_KEY, json.spreadsheetUrl);
            currentSyncState.spreadsheetUrl = json.spreadsheetUrl;
          }
        }
      }
    } catch {
      // Continue to POST fallback
    }

    // Strategy 2: POST fallback if GET was blocked
    if (!resultData) {
      const postRes = await sendToGas('getData');
      if (postRes.success && postRes.data) {
        resultData = postRes.data as AppSyncData;
      }
    }

    if (resultData) {
      const nowStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      updateSyncState({
        status: 'synced',
        lastSyncedAt: nowStr,
        errorMessage: null,
      });
      return { success: true, data: resultData };
    } else {
      throw new Error('Tidak ada data yang diterima dari Google Sheets.');
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    updateSyncState({
      status: 'error',
      errorMessage: errMsg,
    });
    return { success: false, message: `Gagal mengambil data: ${errMsg}` };
  }
}

/**
 * Real-time Dispatchers: Otomatis tersimpan ke Google Sheets
 */

// 1. Simpan / Update Transaksi (sekaligus sinkron Akun Kas & Mutasi Arus Kas)
export async function syncTransactionToSheets(
  transaction: Transaction,
  accounts?: Account[],
  mutation?: CashMutation
): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('saveTransaction', {
    transaction,
    accounts,
    mutation,
  });
  return res.success;
}

// 2. Void Transaksi (sekaligus sinkron Akun Kas & Mutasi Arus Kas)
export async function syncVoidToSheets(
  transactionId: string,
  accounts?: Account[],
  mutation?: CashMutation
): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('voidTransaction', {
    transactionId,
    accounts,
    mutation,
  });
  return res.success;
}

// 3. Simpan Mutasi Kas
export async function syncMutationToSheets(
  mutation: CashMutation,
  accounts?: Account[]
): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('saveMutation', {
    mutation,
    accounts,
  });
  return res.success;
}

// 4. Simpan / Update Akun Kas
export async function syncAccountToSheets(account: Account): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('saveAccount', { account });
  return res.success;
}

// 5. Hapus Akun Kas
export async function syncDeleteAccountToSheets(accountId: string): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('deleteAccount', { accountId });
  return res.success;
}

// 6. Simpan / Update Produk
export async function syncProductToSheets(product: Product): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('saveProduct', { product });
  return res.success;
}

// 7. Hapus Produk
export async function syncDeleteProductToSheets(productId: string): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('deleteProduct', { productId });
  return res.success;
}

// 8. Simpan Log Penyesuaian / Restock Stok
export async function syncStockLogToSheets(stockLog: StockAdjustmentLog): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('saveStockLog', { stockLog });
  return res.success;
}

// 9. Checkout Kasir POS Fisik (Sinkron Produk, Penjualan POS, Log Stok, Transaksi, Akun Kas, dan Mutasi Kas)
export async function syncCheckoutPOSToSheets(
  products: Product[],
  transaction?: Transaction,
  accounts?: Account[],
  mutation?: CashMutation,
  posSale?: PosSale,
  stockLogs?: StockAdjustmentLog[]
): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('checkoutPOS', {
    products,
    transaction,
    accounts,
    mutation,
    posSale,
    stockLogs,
  });
  return res.success;
}

// 10. Simpan / Void Penjualan POS
export async function syncPosSaleToSheets(posSale: PosSale): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('savePosSale', { posSale });
  return res.success;
}

export async function syncVoidPosSaleToSheets(saleId: string): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('voidPosSale', { saleId });
  return res.success;
}

// 11. Simpan Profil Agen
export async function syncProfileToSheets(profile: AgentProfile): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('saveProfile', { profile });
  return res.success;
}

// 12. Simpan Setting Printer
export async function syncPrinterSettingsToSheets(
  printerSettings: PrinterSettings
): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('savePrinterSettings', { printerSettings });
  return res.success;
}

// 13. Simpan / Update Akun Pengguna (Admin & Kasir)
export async function syncUserToSheets(user: AppUser): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('saveUser', { user });
  return res.success;
}

// 14. Hapus Akun Pengguna
export async function syncDeleteUserToSheets(userId: string): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('deleteUser', { userId });
  return res.success;
}

// 15. Batch Synchronize All Application State to Spreadsheet
export async function syncAllToSheets(payload: {
  transactions: Transaction[];
  accounts: Account[];
  mutations: CashMutation[];
  products: Product[];
  posSales?: PosSale[];
  stockLogs?: StockAdjustmentLog[];
  users?: AppUser[];
  profile: AgentProfile;
  printerSettings: PrinterSettings;
}): Promise<{ success: boolean; message: string }> {
  if (!getGasUrl()) {
    return { success: false, message: 'URL Google Apps Script belum diisi.' };
  }
  const res = await sendToGas('syncAll', payload);
  return {
    success: res.success,
    message: res.success ? 'Seluruh data berhasil disinkronkan ke Spreadsheet!' : (res.message || 'Gagal sinkronisasi.'),
  };
}
