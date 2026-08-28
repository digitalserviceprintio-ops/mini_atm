import {
  Account,
  AgentProfile,
  CustomerMember,
  MemberPointHistory,
  MemberRewardItem,
  MemberVoucherClaim,
  PointExchangeSettings,
  PosSale,
  PrinterSettings,
  Product,
  StockAdjustmentLog,
  Transaction,
  CashMutation,
  UserRole,
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_AGENT_PROFILE,
  INITIAL_MEMBERS,
  INITIAL_MEMBER_POINTS,
  INITIAL_MEMBER_REWARDS,
  INITIAL_MEMBER_VOUCHERS,
  INITIAL_POINT_SETTINGS,
  INITIAL_POS_SALES,
  INITIAL_PRINTER_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_STOCK_LOGS,
  INITIAL_TRANSACTIONS,
} from '../data/initialData';

export interface IsolatedUserData {
  profile: AgentProfile;
  accounts: Account[];
  transactions: Transaction[];
  products: Product[];
  posSales: PosSale[];
  stockLogs: StockAdjustmentLog[];
  mutations: CashMutation[];
  members: CustomerMember[];
  memberPoints: MemberPointHistory[];
  memberRewards: MemberRewardItem[];
  voucherClaims: MemberVoucherClaim[];
  pointSettings: PointExchangeSettings;
  printerSettings: PrinterSettings;
}

/**
 * Generate a user-specific storage key to isolate each user's database.
 */
export function getUserStorageKey(username: string, keyName: string): string {
  const safeUser = (username || 'guest').trim().toLowerCase();
  return `miniatm_u_${safeUser}_${keyName}`;
}

/**
 * Creates fresh default starter data for a newly registered user.
 */
export function createFreshUserData(user: {
  name: string;
  username: string;
  role?: UserRole;
  phone?: string;
}): IsolatedUserData {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const cleanPhone = user.phone || '0812-3456-7890';
  const ownerName = user.name || 'Pengguna Baru';

  const freshProfile: AgentProfile = {
    storeName: `MINI ATM ${ownerName.toUpperCase()}`,
    ownerName: ownerName,
    phone: cleanPhone,
    idAgent: `AGT-${randomSuffix}-${Math.floor(100 + Math.random() * 900)}`,
    address: 'Jl. Sentosa Niaga No. 01, Outlet Kasir',
    receiptHeader: `Agen Link & Multi Payment - ${ownerName}`,
    receiptFooter: 'Terima Kasih Atas Kunjungan Anda\nSimpan Struk Ini Sebagai Bukti Transaksi Sah',
    logoUrl: null,
    paperWidth: '58mm',
  };

  const freshAccounts: Account[] = [
    {
      id: `acc_kas_${user.username}_1`,
      name: 'Kas Fisik Laci (Kas)',
      type: 'Kas',
      balance: 1000000,
      accountNumber: 'KAS-01',
    },
    {
      id: `acc_bri_${user.username}_1`,
      name: 'BRI Operasional (Bank)',
      type: 'Bank',
      balance: 2000000,
      accountNumber: `020101${randomSuffix}`,
      bankName: 'BRI',
    },
    {
      id: `acc_bca_${user.username}_1`,
      name: 'BCA Transfer (Bank)',
      type: 'Bank',
      balance: 1500000,
      accountNumber: `8830${randomSuffix}`,
      bankName: 'BCA',
    },
    {
      id: `acc_mandiri_${user.username}_1`,
      name: 'Mandiri / BNI Agen (Bank)',
      type: 'Bank',
      balance: 500000,
      accountNumber: `13200${randomSuffix}`,
      bankName: 'Mandiri',
    },
  ];

  return {
    profile: freshProfile,
    accounts: freshAccounts,
    transactions: [], // Fresh empty transactions for new user
    products: INITIAL_PRODUCTS, // Starter product catalog ready for POS cashier
    posSales: [], // Fresh empty POS sales
    stockLogs: [], // Fresh empty stock adjustments
    mutations: [], // Fresh empty cash mutations
    members: [], // Fresh empty customer members
    memberPoints: [], // Fresh empty points history
    memberRewards: INITIAL_MEMBER_REWARDS, // Standard reward catalog
    voucherClaims: [], // Fresh empty vouchers
    pointSettings: INITIAL_POINT_SETTINGS,
    printerSettings: INITIAL_PRINTER_SETTINGS,
  };
}

/**
 * Load isolated workspace data for a specific user from localStorage.
 */
export function loadUserIsolatedData(user: {
  username: string;
  name?: string;
  role?: UserRole;
  phone?: string;
}): IsolatedUserData {
  const username = (user.username || 'admin').trim().toLowerCase();

  const getStorageItem = <T>(keyName: string, legacyFallbackKey?: string): T | null => {
    try {
      const userKey = getUserStorageKey(username, keyName);
      const userVal = localStorage.getItem(userKey);
      if (userVal) {
        return JSON.parse(userVal);
      }

      // If user is 'admin' or legacy fallback is available and user is admin
      if (username === 'admin' && legacyFallbackKey) {
        const legacyVal = localStorage.getItem(legacyFallbackKey);
        if (legacyVal) {
          return JSON.parse(legacyVal);
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const storedProfile = getStorageItem<AgentProfile>('profile', 'miniatm_profile');
  const storedAccounts = getStorageItem<Account[]>('accounts', 'miniatm_accounts');
  const storedTransactions = getStorageItem<Transaction[]>('transactions', 'miniatm_transactions');
  const storedProducts = getStorageItem<Product[]>('products', 'miniatm_products');
  const storedPosSales = getStorageItem<PosSale[]>('pos_sales', 'miniatm_pos_sales');
  const storedStockLogs = getStorageItem<StockAdjustmentLog[]>('stock_logs', 'miniatm_stock_logs');
  const storedMutations = getStorageItem<CashMutation[]>('mutations', 'miniatm_mutations');
  const storedMembers = getStorageItem<CustomerMember[]>('members', 'miniatm_members');
  const storedMemberPoints = getStorageItem<MemberPointHistory[]>('member_points', 'miniatm_member_points');
  const storedMemberRewards = getStorageItem<MemberRewardItem[]>('member_rewards', 'miniatm_member_rewards');
  const storedVoucherClaims = getStorageItem<MemberVoucherClaim[]>('member_vouchers', 'miniatm_member_vouchers');
  const storedPointSettings = getStorageItem<PointExchangeSettings>('point_settings', 'miniatm_point_settings');
  const storedPrinterSettings = getStorageItem<PrinterSettings>('printer_settings', 'miniatm_printer_settings');

  // If user is admin and has existing initial/legacy data
  if (username === 'admin') {
    return {
      profile: storedProfile || INITIAL_AGENT_PROFILE,
      accounts: storedAccounts || INITIAL_ACCOUNTS,
      transactions: storedTransactions || INITIAL_TRANSACTIONS,
      products: storedProducts || INITIAL_PRODUCTS,
      posSales: storedPosSales || INITIAL_POS_SALES,
      stockLogs: storedStockLogs || INITIAL_STOCK_LOGS,
      mutations: storedMutations || [],
      members: storedMembers || INITIAL_MEMBERS,
      memberPoints: storedMemberPoints || INITIAL_MEMBER_POINTS,
      memberRewards: storedMemberRewards || INITIAL_MEMBER_REWARDS,
      voucherClaims: storedVoucherClaims || INITIAL_MEMBER_VOUCHERS,
      pointSettings: storedPointSettings
        ? { ...INITIAL_POINT_SETTINGS, ...storedPointSettings }
        : INITIAL_POINT_SETTINGS,
      printerSettings: storedPrinterSettings || INITIAL_PRINTER_SETTINGS,
    };
  }

  // If any custom data is already saved for this specific user
  const isExistingUserWorkspace =
    storedProfile !== null ||
    storedAccounts !== null ||
    storedTransactions !== null ||
    storedProducts !== null ||
    storedMembers !== null;

  if (isExistingUserWorkspace) {
    const defaultFresh = createFreshUserData({
      name: user.name || username,
      username: username,
      role: user.role,
      phone: user.phone,
    });

    return {
      profile: storedProfile || defaultFresh.profile,
      accounts: storedAccounts || defaultFresh.accounts,
      transactions: storedTransactions || [],
      products: storedProducts || defaultFresh.products,
      posSales: storedPosSales || [],
      stockLogs: storedStockLogs || [],
      mutations: storedMutations || [],
      members: storedMembers || [],
      memberPoints: storedMemberPoints || [],
      memberRewards: storedMemberRewards || INITIAL_MEMBER_REWARDS,
      voucherClaims: storedVoucherClaims || [],
      pointSettings: storedPointSettings
        ? { ...INITIAL_POINT_SETTINGS, ...storedPointSettings }
        : INITIAL_POINT_SETTINGS,
      printerSettings: storedPrinterSettings || INITIAL_PRINTER_SETTINGS,
    };
  }

  // Brand new user: create fresh dedicated workspace
  const fresh = createFreshUserData({
    name: user.name || username,
    username: username,
    role: user.role,
    phone: user.phone,
  });

  // Automatically persist the fresh data for this user
  saveUserStorageItem(username, 'profile', fresh.profile);
  saveUserStorageItem(username, 'accounts', fresh.accounts);
  saveUserStorageItem(username, 'transactions', fresh.transactions);
  saveUserStorageItem(username, 'products', fresh.products);
  saveUserStorageItem(username, 'pos_sales', fresh.posSales);
  saveUserStorageItem(username, 'stock_logs', fresh.stockLogs);
  saveUserStorageItem(username, 'mutations', fresh.mutations);
  saveUserStorageItem(username, 'members', fresh.members);
  saveUserStorageItem(username, 'member_points', fresh.memberPoints);
  saveUserStorageItem(username, 'member_rewards', fresh.memberRewards);
  saveUserStorageItem(username, 'member_vouchers', fresh.voucherClaims);
  saveUserStorageItem(username, 'point_settings', fresh.pointSettings);
  saveUserStorageItem(username, 'printer_settings', fresh.printerSettings);

  return fresh;
}

/**
 * Save an item to user's isolated storage
 */
export function saveUserStorageItem(username: string, keyName: string, data: any): void {
  try {
    const key = getUserStorageKey(username, keyName);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save ${keyName} for user ${username}`, e);
  }
}
