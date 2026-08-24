import {
  Account,
  AgentProfile,
  AppUser,
  CashMutation,
  PrinterSettings,
  Product,
  Transaction,
} from '../types';

export interface AppSyncData {
  transactions: Transaction[];
  accounts: Account[];
  mutations: CashMutation[];
  products: Product[];
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
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const nowStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (json.status === 'success' || !json.status) {
      updateSyncState({
        status: 'synced',
        lastSyncedAt: nowStr,
        errorMessage: null,
        pendingCount: Math.max(0, currentSyncState.pendingCount - 1),
        spreadsheetName: json.spreadsheetName || currentSyncState.spreadsheetName,
        spreadsheetUrl: json.spreadsheetUrl || currentSyncState.spreadsheetUrl,
      });
      return { success: true, data: json.data || json, raw: json };
    } else {
      throw new Error(json.message || 'Respons error dari Google Apps Script');
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[GAS Sync Error] (${action}):`, errMsg);

    updateSyncState({
      status: 'error',
      errorMessage: errMsg,
      pendingCount: Math.max(0, currentSyncState.pendingCount - 1),
    });
    return { success: false, message: errMsg };
  }
}

/**
 * Ping / Test Google Apps Script Endpoint
 */
export async function testGasConnection(targetUrl?: string): Promise<{
  success: boolean;
  message: string;
  spreadsheetName?: string;
  spreadsheetUrl?: string;
}> {
  const url = (targetUrl || getGasUrl()).trim();
  if (!url) {
    return { success: false, message: 'Silakan masukkan URL Google Apps Script Web App terlebih dahulu.' };
  }

  try {
    const pingRes = await sendToGas('ping', {}, url);
    if (pingRes.success && pingRes.raw) {
      const rawObj = pingRes.raw as { spreadsheetName?: string; spreadsheetUrl?: string };
      if (rawObj.spreadsheetName) {
        localStorage.setItem(STORAGE_GAS_SHEET_NAME_KEY, rawObj.spreadsheetName);
      }
      if (rawObj.spreadsheetUrl) {
        localStorage.setItem(STORAGE_GAS_SHEET_URL_KEY, rawObj.spreadsheetUrl);
      }
      return {
        success: true,
        message: 'Koneksi ke Google Sheets Backend Berhasil!',
        spreadsheetName: rawObj.spreadsheetName,
        spreadsheetUrl: rawObj.spreadsheetUrl,
      };
    }
    return { success: false, message: pingRes.message || 'Gagal tersambung ke spreadsheet.' };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Koneksi gagal: ${errMsg}` };
  }
}

/**
 * Fetch Initial Application Data from Google Sheets
 * Digunakan saat inisialisasi menu dan aplikasi pertama kali dibuka
 */
export async function fetchInitialDataFromSheets(customUrl?: string): Promise<{
  success: boolean;
  data?: AppSyncData;
  message?: string;
  spreadsheetName?: string;
  spreadsheetUrl?: string;
}> {
  const url = (customUrl || getGasUrl()).trim();
  if (!url) {
    return { success: false, message: 'URL Apps Script belum diisi.' };
  }

  try {
    // Attempt GET first (fastest for initialization)
    let json: {
      status?: string;
      data?: AppSyncData;
      spreadsheetName?: string;
      spreadsheetUrl?: string;
      message?: string;
    } | null = null;

    try {
      const getRes = await fetch(`${url}${url.includes('?') ? '&' : '?'}action=init`, {
        method: 'GET',
      });
      if (getRes.ok) {
        json = await getRes.json();
      }
    } catch {
      // Fallback to POST
      const postRes = await sendToGas('init', {}, url);
      if (postRes.success && postRes.raw) {
        json = postRes.raw as typeof json;
      }
    }

    if (json && (json.status === 'success' || json.data)) {
      const appData = json.data as AppSyncData;
      const nowStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      if (json.spreadsheetName) {
        localStorage.setItem(STORAGE_GAS_SHEET_NAME_KEY, json.spreadsheetName);
      }
      if (json.spreadsheetUrl) {
        localStorage.setItem(STORAGE_GAS_SHEET_URL_KEY, json.spreadsheetUrl);
      }

      updateSyncState({
        status: 'synced',
        lastSyncedAt: nowStr,
        spreadsheetName: json.spreadsheetName || currentSyncState.spreadsheetName,
        spreadsheetUrl: json.spreadsheetUrl || currentSyncState.spreadsheetUrl,
        errorMessage: null,
      });

      return {
        success: true,
        data: appData,
        spreadsheetName: json.spreadsheetName,
        spreadsheetUrl: json.spreadsheetUrl,
      };
    }

    return {
      success: false,
      message: json?.message || 'Data tidak ditemukan di Spreadsheet.',
    };
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

// 7. Checkout Kasir POS Fisik (Sinkron Produk, Transaksi, Akun Kas, dan Mutasi Kas)
export async function syncCheckoutPOSToSheets(
  products: Product[],
  transaction: Transaction,
  accounts: Account[],
  mutation?: CashMutation
): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('checkoutPOS', {
    products,
    transaction,
    accounts,
    mutation,
  });
  return res.success;
}

// 8. Simpan Profil Agen
export async function syncProfileToSheets(profile: AgentProfile): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('saveProfile', { profile });
  return res.success;
}

// 9. Simpan Setting Printer
export async function syncPrinterSettingsToSheets(
  printerSettings: PrinterSettings
): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('savePrinterSettings', { printerSettings });
  return res.success;
}

// 10. Simpan / Update Akun Pengguna (Admin & Kasir)
export async function syncUserToSheets(user: AppUser): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('saveUser', { user });
  return res.success;
}

// 11. Hapus Akun Pengguna
export async function syncDeleteUserToSheets(userId: string): Promise<boolean> {
  if (!getGasUrl()) return false;
  const res = await sendToGas('deleteUser', { userId });
  return res.success;
}

// 12. Batch Synchronize All Application State to Spreadsheet
export async function syncAllToSheets(payload: {
  transactions: Transaction[];
  accounts: Account[];
  mutations: CashMutation[];
  products: Product[];
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
