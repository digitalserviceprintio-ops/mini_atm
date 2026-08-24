export type TransactionType = 'TARIK TUNAI' | 'SETOR TUNAI' | 'TRANSFER' | 'PEMBAYARAN';

export type TransactionStatus = 'SUCCESS' | 'VOID';

export interface Transaction {
  id: string;
  time: string;
  type: TransactionType;
  cust: string;
  target: string;
  nominal: number;
  feeCust: number;
  feeAdmin: number;
  status: TransactionStatus;
  accountId: string;
  phoneCust?: string;
  notes?: string;
  refNumber?: string;
}

export type AccountType = 'Kas' | 'Bank' | 'E-Wallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  accountNumber?: string;
  bankName?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  barcode?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  maxStock: number;
}

export interface AgentProfile {
  storeName: string;
  ownerName: string;
  phone: string;
  idAgent: string;
  address: string;
  receiptHeader: string;
  receiptFooter: string;
  logoUrl: string | null;
  paperWidth: '58mm' | '80mm';
}

export type PrinterConnectionType = 'browser' | 'bluetooth' | 'serial' | 'rawbt';
export type ThermalPaperWidth = '58mm' | '80mm';

export interface PrinterSettings {
  connectionType: PrinterConnectionType;
  paperWidth: ThermalPaperWidth;
  autoPrintOnSuccess: boolean;
  printCopies: 1 | 2;
  autoCut: boolean;
  showLogo: boolean;
  showIdAgent: boolean;
  showRefNumber: boolean;
  showNotes: boolean;
  showFooter: boolean;
  customFooterNote: string;
  bluetoothDeviceName: string | null;
  serialPortName: string | null;
  printerDensity: 'normal' | 'dark';
}

export type MutationType = 'MASUK' | 'KELUAR' | 'TRANSFER_INTERNAL';

export interface CashMutation {
  id: string;
  time: string;
  accountId: string;
  toAccountId?: string;
  type: MutationType;
  amount: number;
  feeMargin: number;
  description: string;
  relatedTrxId?: string;
}

export type UserRole = 'Admin' | 'Kasir';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  password: string;
  role: UserRole;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  notes?: string;
  lastLogin?: string;
}

export type ActiveTab =
  | 'transaksi'
  | 'laporan-detail'
  | 'dashboard'
  | 'arus-kas'
  | 'akun-kas'
  | 'kasir-fisik'
  | 'hak-akses'
  | 'profil-agen'
  | 'setting-printer'
  | 'database-spreadsheet'
  | 'backup-reset';
