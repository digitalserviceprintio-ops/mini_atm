import {
  Account,
  AgentProfile,
  AppUser,
  CashMutation,
  CustomerMember,
  MemberPointHistory,
  MemberRewardItem,
  MemberVoucherClaim,
  PointExchangeSettings,
  PrinterSettings,
  Product,
  Transaction,
} from '../types';
import { formatDateTime } from './formatters';

export interface AppBackupPayload {
  app: string;
  version: string;
  backupTimestamp: string;
  backupDate: string;
  profile: AgentProfile;
  printerSettings: PrinterSettings;
  accounts: Account[];
  transactions: Transaction[];
  mutations: CashMutation[];
  products: Product[];
  users: AppUser[];
  members?: CustomerMember[];
  memberPoints?: MemberPointHistory[];
  memberRewards?: MemberRewardItem[];
  voucherClaims?: MemberVoucherClaim[];
  pointSettings?: PointExchangeSettings;
  summary: {
    totalTransactions: number;
    totalMutations: number;
    totalAccounts: number;
    totalProducts: number;
    totalUsers: number;
    totalMembers?: number;
    totalRewards?: number;
    totalVouchers?: number;
    totalCashBalance: number;
  };
}

/**
 * Generate full JSON backup file and trigger instant browser download
 */
export function downloadBackupJSON(data: {
  transactions: Transaction[];
  mutations: CashMutation[];
  accounts: Account[];
  products: Product[];
  users: AppUser[];
  profile: AgentProfile;
  printerSettings: PrinterSettings;
  members?: CustomerMember[];
  memberPoints?: MemberPointHistory[];
  memberRewards?: MemberRewardItem[];
  voucherClaims?: MemberVoucherClaim[];
  pointSettings?: PointExchangeSettings;
}): void {
  const totalBalance = data.accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const now = new Date();

  const payload: AppBackupPayload = {
    app: 'Mini ATM Agent & Kasir POS',
    version: '2.6.0',
    backupTimestamp: now.toISOString(),
    backupDate: formatDateTime(now),
    profile: data.profile,
    printerSettings: data.printerSettings,
    accounts: data.accounts,
    transactions: data.transactions,
    mutations: data.mutations,
    products: data.products,
    users: data.users,
    members: data.members || [],
    memberPoints: data.memberPoints || [],
    memberRewards: data.memberRewards || [],
    voucherClaims: data.voucherClaims || [],
    pointSettings: data.pointSettings,
    summary: {
      totalTransactions: data.transactions.length,
      totalMutations: data.mutations.length,
      totalAccounts: data.accounts.length,
      totalProducts: data.products.length,
      totalUsers: data.users.length,
      totalMembers: data.members?.length || 0,
      totalRewards: data.memberRewards?.length || 0,
      totalVouchers: data.voucherClaims?.length || 0,
      totalCashBalance: totalBalance,
    },
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateSlug = now.toISOString().slice(0, 10);
  const storeSlug = (data.profile.storeName || 'MiniATM').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `BACKUP_MINIATM_${storeSlug}_${dateSlug}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read and validate uploaded JSON backup file
 */
export async function parseBackupFile(
  file: File
): Promise<{ success: boolean; data?: AppBackupPayload; error?: string }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    // Basic structure validation
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Format file JSON tidak valid.' };
    }

    if (
      !Array.isArray(parsed.transactions) &&
      !Array.isArray(parsed.accounts) &&
      !Array.isArray(parsed.users)
    ) {
      return {
        success: false,
        error: 'File bukan berkas backup database Mini ATM yang sah (tidak ditemukan data transaksi/akun).',
      };
    }

    return { success: true, data: parsed as AppBackupPayload };
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal membaca berkas: ${err?.message || 'Format JSON rusak.'}`,
    };
  }
}
