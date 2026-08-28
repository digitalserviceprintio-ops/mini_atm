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
  memberId?: string;
  memberNumber?: string;
  pointsRedeemed?: number;
  discountFromPoints?: number;
  voucherClaimId?: string;
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
  buyPrice?: number;
  stock: number;
  minStock?: number;
  category?: string;
  barcode?: string;
  unit?: string;
  lastRestockDate?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  buyPrice?: number;
  qty: number;
  maxStock: number;
  category?: string;
  unit?: string;
  discountType?: 'percent' | 'nominal';
  discountValue?: number;
  discountAmount?: number;
}

export interface PosSaleItem {
  productId: string;
  productName: string;
  category?: string;
  price: number;
  buyPrice: number;
  qty: number;
  unit?: string;
  discountType?: 'percent' | 'nominal';
  discountValue?: number;
  discountAmount?: number;
  subtotal: number;
  totalCost: number;
  profit: number;
}

export interface PosSale {
  id: string;
  invoiceNumber: string;
  time: string;
  cashierName: string;
  cashierRole?: UserRole;
  items: PosSaleItem[];
  totalQty: number;
  totalBeforeDiscount?: number;
  totalDiscount?: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  paymentMethod: string;
  accountId: string;
  customerName?: string;
  customerPhone?: string;
  memberId?: string;
  memberNumber?: string;
  pointsRedeemed?: number;
  discountFromPoints?: number;
  voucherClaimId?: string;
  notes?: string;
  relatedTrxId?: string;
  status?: 'SUCCESS' | 'VOID';
}

export type MemberTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'VIP' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type RewardCategory =
  | 'DISCOUNT_TRX'
  | 'DISCOUNT_POS'
  | 'FREE_ADMIN'
  | 'PHYSICAL_GIFT'
  | 'CASHBACK'
  | 'VOUCHER_BELANJA';

export interface MemberRewardItem {
  id: string;
  name: string;
  category: RewardCategory;
  pointsRequired: number; // Minimal 50 poin
  discountValue?: number; // Nilai potongan dlm Rupiah jika jenis diskon
  stock?: number; // Kuota / stok hadiah
  description: string;
  status?: 'ACTIVE' | 'INACTIVE';
  isActive?: boolean;
  minTier?: MemberTier;
  icon?: string;
  createdAt?: string;
}

export interface MemberVoucherClaim {
  id: string;
  voucherCode: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  rewardId: string;
  rewardName: string;
  category: RewardCategory;
  pointsUsed: number;
  discountValue: number;
  claimDate: string;
  usedDate?: string;
  relatedRefNumber?: string;
  usedRefNumber?: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  notes?: string;
  operatorName?: string;
}

export interface PointExchangeSettings {
  minPointsRedeem: number; // Minimal poin bisa ditukarkan, default 50
  pointsPerStep: number; // Kelipatan penukaran poin, default 50
  rupiahPerStep: number; // Nilai Rupiah per kelipatan poin, default 5000 (50 poin = Rp 5.000)
  enableDirectDiscounts: boolean;
}

export interface CustomerMember {
  id: string;
  memberNumber: string;
  cardNumber?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  points: number;
  tier: MemberTier;
  joinDate?: string;
  joinedDate?: string;
  totalTransactions?: number;
  totalTrxCount?: number;
  totalSpent?: number;
  barcode?: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export type PointChangeType =
  | 'EARN_TRX'
  | 'EARN_POS'
  | 'EARN_TRX_MINI_ATM'
  | 'EARN_TRX_POS'
  | 'REDEEM'
  | 'REDEEM_POINT'
  | 'REDEEM_TRX_DISCOUNT'
  | 'REDEEM_POS_DISCOUNT'
  | 'BONUS'
  | 'BONUS_MANUAL'
  | 'ADJUSTMENT'
  | 'EXPIRED_POINT';

export interface MemberPointHistory {
  id: string;
  memberId: string;
  time: string;
  points?: number;
  pointsChange?: number;
  balanceAfter?: number;
  type: PointChangeType;
  refNumber?: string;
  referenceId?: string;
  description: string;
  operatorName?: string;
}

export type StockLogType =
  | 'RESTOCK'
  | 'PENYESUAIAN_KURANG'
  | 'KOREKSI_MANUAL'
  | 'PENJUALAN_POS'
  | 'RESTOCK_MASUK'
  | 'KOREKSI_RUSAK'
  | 'KOREKSI_HILANG'
  | 'KOREKSI_KADALUARSA'
  | 'PENYESUAIAN_KOREKSI';

export interface StockAdjustmentLog {
  id: string;
  time: string;
  productId: string;
  productName: string;
  type: StockLogType;
  qtyChange: number;
  stockBefore: number;
  stockAfter: number;
  costPerUnit?: number;
  reason?: string;
  operatorName: string;
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
  | 'laporan-penjualan-fisik'
  | 'stok-barang'
  | 'dashboard'
  | 'arus-kas'
  | 'akun-kas'
  | 'kasir-fisik'
  | 'member-pelanggan'
  | 'hak-akses'
  | 'profil-agen'
  | 'setting-printer'
  | 'database-spreadsheet'
  | 'backup-reset';
