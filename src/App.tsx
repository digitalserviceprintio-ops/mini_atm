import React, { useState, useEffect, useMemo } from 'react';
import {
  ActiveTab,
  AgentProfile,
  Account,
  AppUser,
  Product,
  Transaction,
  UserRole,
  CashMutation,
  CartItem,
  PrinterSettings,
  PosSale,
  PosSaleItem,
  StockAdjustmentLog,
  CustomerMember,
  MemberPointHistory,
  MemberTier,
  PointChangeType,
  MemberRewardItem,
  MemberVoucherClaim,
  PointExchangeSettings,
} from './types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_AGENT_PROFILE,
  INITIAL_PRINTER_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_TRANSACTIONS,
  INITIAL_USERS,
  INITIAL_POS_SALES,
  INITIAL_STOCK_LOGS,
  INITIAL_MEMBERS,
  INITIAL_MEMBER_POINTS,
  INITIAL_MEMBER_REWARDS,
  INITIAL_MEMBER_VOUCHERS,
  INITIAL_POINT_SETTINGS,
} from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginView, AuthUser } from './components/views/LoginView';
import { TransaksiView } from './components/views/TransaksiView';
import { LaporanDetailView } from './components/views/LaporanDetailView';
import { DashboardView } from './components/views/DashboardView';
import { ArusKasView } from './components/views/ArusKasView';
import { AkunKasView } from './components/views/AkunKasView';
import { MemberPelangganView } from './components/views/MemberPelangganView';
import { KasirFisikView } from './components/views/KasirFisikView';
import { StokBarangView } from './components/views/StokBarangView';
import { LaporanPenjualanFisikView } from './components/views/LaporanPenjualanFisikView';
import { RiwayatTransaksiAgenView } from './components/views/RiwayatTransaksiAgenView';
import { RiwayatTransaksiPosView } from './components/views/RiwayatTransaksiPosView';
import { HakAksesView } from './components/views/HakAksesView';
import { ProfilAgenView } from './components/views/ProfilAgenView';
import { SettingPrinterView } from './components/views/SettingPrinterView';
import { DatabaseSpreadsheetView } from './components/views/DatabaseSpreadsheetView';
import { BackupResetView } from './components/views/BackupResetView';
import { TentangSistemView } from './components/views/TentangSistemView';
import { SecurityAlertBanner } from './components/common/SecurityAlertBanner';
import { SecurityThreatItem } from './types';
import { subscribeToThreats, dismissActiveAlert, recordThreat } from './utils/threatDetector';
import { sanitizeText } from './utils/securityCrypto';
import { ModalTrx } from './components/modals/ModalTrx';
import { ModalReceipt } from './components/modals/ModalReceipt';
import { ModalConfirmVoid } from './components/modals/ModalConfirmVoid';
import { ModalAccount } from './components/modals/ModalAccount';
import { ModalProduct } from './components/modals/ModalProduct';
import { ModalRestock } from './components/modals/ModalRestock';
import { ModalAdjustStock } from './components/modals/ModalAdjustStock';
import { ModalMutation } from './components/modals/ModalMutation';
import { ModalUserAccount } from './components/modals/ModalUserAccount';
import { ModalMemberCard } from './components/modals/ModalMemberCard';
import { ModalMemberForm } from './components/modals/ModalMemberForm';
import { ModalMemberDetail } from './components/modals/ModalMemberDetail';
import { ModalRewardForm } from './components/modals/ModalRewardForm';
import { ModalPointSettings } from './components/modals/ModalPointSettings';
import { ModalClaimReward } from './components/modals/ModalClaimReward';
import { ModalVoucherReceipt } from './components/modals/ModalVoucherReceipt';
import { ModalLogout } from './components/modals/ModalLogout';
import { ModalResetData, ResetScope } from './components/modals/ModalResetData';
import { exportToCSV, formatDateTime } from './utils/formatters';
import { downloadBackupJSON, AppBackupPayload } from './utils/backupService';
import {
  getGasUrl,
  fetchInitialDataFromSheets,
  syncTransactionToSheets,
  syncVoidToSheets,
  syncMutationToSheets,
  syncAccountToSheets,
  syncDeleteAccountToSheets,
  syncProductToSheets,
  syncDeleteProductToSheets,
  syncStockLogToSheets,
  syncCheckoutPOSToSheets,
  syncPosSaleToSheets,
  syncVoidPosSaleToSheets,
  syncUserToSheets,
  syncDeleteUserToSheets,
  syncProfileToSheets,
  syncPrinterSettingsToSheets,
  AppSyncData,
} from './utils/googleSheetsService';
import { recordVersionChange } from './utils/versionManager';
import {
  IsolatedUserData,
  loadUserIsolatedData,
  saveUserStorageItem,
  createFreshUserData,
} from './utils/userStorage';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem('miniatm_current_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Load initial workspace data based on the authenticated user (or default admin)
  const initialWorkspace = useMemo(() => {
    return loadUserIsolatedData(
      currentUser || { username: 'admin', name: 'Bpk. Andriawan Delva (Owner)', role: 'Admin' }
    );
  }, []);

  // Isolated workspace persistence state with LocalStorage
  const [profile, setProfile] = useState<AgentProfile>(() => initialWorkspace.profile);
  const [accounts, setAccounts] = useState<Account[]>(() => initialWorkspace.accounts);
  const [transactions, setTransactions] = useState<Transaction[]>(() => initialWorkspace.transactions);
  const [products, setProducts] = useState<Product[]>(() => initialWorkspace.products);
  const [posSales, setPosSales] = useState<PosSale[]>(() => initialWorkspace.posSales);
  const [stockLogs, setStockLogs] = useState<StockAdjustmentLog[]>(() => initialWorkspace.stockLogs);
  const [mutations, setMutations] = useState<CashMutation[]>(() => initialWorkspace.mutations);
  const [members, setMembers] = useState<CustomerMember[]>(() => initialWorkspace.members);
  const [memberPoints, setMemberPoints] = useState<MemberPointHistory[]>(() => initialWorkspace.memberPoints);
  const [memberRewards, setMemberRewards] = useState<MemberRewardItem[]>(() => initialWorkspace.memberRewards);
  const [voucherClaims, setVoucherClaims] = useState<MemberVoucherClaim[]>(() => initialWorkspace.voucherClaims);
  const [pointSettings, setPointSettings] = useState<PointExchangeSettings>(() => initialWorkspace.pointSettings);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(() => initialWorkspace.printerSettings);

  // Global user accounts across the system portal
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem('miniatm_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    if (currentUser) return currentUser.role;
    const saved = localStorage.getItem('miniatm_role');
    return (saved as UserRole) || 'Admin';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('transaksi');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Modals state
  const [isTrxModalOpen, setIsTrxModalOpen] = useState<boolean>(false);
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [receiptTrx, setReceiptTrx] = useState<Transaction | null>(null);
  const [receiptPosSale, setReceiptPosSale] = useState<PosSale | null>(null);

  const [isVoidModalOpen, setIsVoidModalOpen] = useState<boolean>(false);
  const [voidTrx, setVoidTrx] = useState<Transaction | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [initialProductBarcode, setInitialProductBarcode] = useState<string>('');

  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [selectedRestockProduct, setSelectedRestockProduct] = useState<Product | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [selectedAdjustProduct, setSelectedAdjustProduct] = useState<Product | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const [isMemberFormOpen, setIsMemberFormOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<CustomerMember | null>(null);

  const [isMemberCardOpen, setIsMemberCardOpen] = useState<boolean>(false);
  const [selectedCardMember, setSelectedCardMember] = useState<CustomerMember | null>(null);

  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState<boolean>(false);
  const [selectedDetailMember, setSelectedDetailMember] = useState<CustomerMember | null>(null);

  // Rewards & Point Settings Modals
  const [isRewardModalOpen, setIsRewardModalOpen] = useState<boolean>(false);
  const [editingReward, setEditingReward] = useState<MemberRewardItem | null>(null);

  const [isPointSettingsModalOpen, setIsPointSettingsModalOpen] = useState<boolean>(false);

  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [selectedClaimMember, setSelectedClaimMember] = useState<CustomerMember | undefined>(undefined);
  const [selectedClaimReward, setSelectedClaimReward] = useState<MemberRewardItem | undefined>(undefined);

  const [isVoucherReceiptOpen, setIsVoucherReceiptOpen] = useState<boolean>(false);
  const [selectedVoucherClaim, setSelectedVoucherClaim] = useState<MemberVoucherClaim | null>(null);

  const [isMutationModalOpen, setIsMutationModalOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  // Real-Time Intrusion & Threat Alert Listener
  const [activeThreatAlert, setActiveThreatAlert] = useState<SecurityThreatItem | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToThreats((_logs, latest) => {
      setActiveThreatAlert(latest);
    });
    return unsubscribe;
  }, []);

  // Calculate member tier helper
  const calculateTier = (points: number): MemberTier => {
    if (points >= 300) return 'PLATINUM';
    if (points >= 150) return 'GOLD';
    if (points >= 50) return 'SILVER';
    return 'BRONZE';
  };

  // Apply loaded data from Google Sheets to application state
  const handleApplyDataFromSheets = (data: AppSyncData) => {
    if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
      setTransactions(data.transactions);
    }
    if (data.accounts && Array.isArray(data.accounts) && data.accounts.length > 0) {
      setAccounts(data.accounts);
    }
    if (data.mutations && Array.isArray(data.mutations)) {
      setMutations(data.mutations);
    }
    if (data.products && Array.isArray(data.products) && data.products.length > 0) {
      setProducts(data.products);
    }
    if (data.posSales && Array.isArray(data.posSales) && data.posSales.length > 0) {
      setPosSales(data.posSales);
    }
    if (data.stockLogs && Array.isArray(data.stockLogs) && data.stockLogs.length > 0) {
      setStockLogs(data.stockLogs);
    }
    if (data.users && Array.isArray(data.users) && data.users.length > 0) {
      setUsers(data.users);
    }
    if (data.profile) {
      setProfile(data.profile);
    }
    if (data.printerSettings) {
      setPrinterSettings(data.printerSettings);
    }
  };

  // Restore backup payload handler
  const handleRestoreData = (payload: AppBackupPayload) => {
    if (payload.transactions && Array.isArray(payload.transactions)) {
      setTransactions(payload.transactions);
    }
    if (payload.accounts && Array.isArray(payload.accounts)) {
      setAccounts(payload.accounts);
    }
    if (payload.mutations && Array.isArray(payload.mutations)) {
      setMutations(payload.mutations);
    }
    if (payload.products && Array.isArray(payload.products)) {
      setProducts(payload.products);
    }
    if (payload.users && Array.isArray(payload.users)) {
      setUsers(payload.users);
    }
    if (payload.members && Array.isArray(payload.members)) {
      setMembers(payload.members);
    }
    if (payload.memberPoints && Array.isArray(payload.memberPoints)) {
      setMemberPoints(payload.memberPoints);
    }
    if (payload.memberRewards && Array.isArray(payload.memberRewards)) {
      setMemberRewards(payload.memberRewards);
    }
    if (payload.voucherClaims && Array.isArray(payload.voucherClaims)) {
      setVoucherClaims(payload.voucherClaims);
    }
    if (payload.pointSettings) {
      setPointSettings(payload.pointSettings);
    }
    if (payload.profile) {
      setProfile(payload.profile);
    }
    if (payload.printerSettings) {
      setPrinterSettings(payload.printerSettings);
    }
  };

  // Download backup handler
  const handleDownloadBackup = () => {
    downloadBackupJSON({
      profile,
      printerSettings,
      accounts,
      transactions,
      mutations,
      products,
      users,
      members,
      memberPoints,
      memberRewards,
      voucherClaims,
      pointSettings,
    });
  };

  // Execute database reset handler
  const handleConfirmReset = (scope: ResetScope) => {
    if (scope === 'transactions_only') {
      setTransactions([]);
      setMutations([]);
    } else if (scope === 'factory_default') {
      setTransactions(INITIAL_TRANSACTIONS);
      setMutations([]);
      setAccounts(INITIAL_ACCOUNTS);
      setProducts(INITIAL_PRODUCTS);
      setMembers(INITIAL_MEMBERS);
      setMemberPoints(INITIAL_MEMBER_POINTS);
      setMemberRewards(INITIAL_MEMBER_REWARDS);
      setVoucherClaims(INITIAL_MEMBER_VOUCHERS);
      setPointSettings(INITIAL_POINT_SETTINGS);
      setProfile(INITIAL_AGENT_PROFILE);
      setPrinterSettings(INITIAL_PRINTER_SETTINGS);
    } else if (scope === 'clear_all') {
      setTransactions([]);
      setMutations([]);
      setProducts([]);
      setMembers([]);
      setMemberPoints([]);
      setVoucherClaims([]);
      setAccounts(INITIAL_ACCOUNTS.map((a) => ({ ...a, balance: 0 })));
    }
    setIsResetModalOpen(false);
  };

  // Auto-initialize data from Google Sheets on boot if GAS URL configured
  useEffect(() => {
    if (getGasUrl()) {
      fetchInitialDataFromSheets().then((res) => {
        if (res.success && res.data) {
          handleApplyDataFromSheets(res.data);
        }
      });
    }
  }, []);

  // Active username scope for multi-user isolated storage
  const activeUsername = (currentUser?.username || 'admin').trim().toLowerCase();

  // Helper to load and apply complete isolated workspace state for a user
  const applyUserData = (data: IsolatedUserData) => {
    setProfile(data.profile);
    setAccounts(data.accounts);
    setTransactions(data.transactions);
    setProducts(data.products);
    setPosSales(data.posSales);
    setStockLogs(data.stockLogs);
    setMutations(data.mutations);
    setMembers(data.members);
    setMemberPoints(data.memberPoints);
    setMemberRewards(data.memberRewards);
    setVoucherClaims(data.voucherClaims);
    setPointSettings(data.pointSettings);
    setPrinterSettings(data.printerSettings);
  };

  // Sync authentication & data to LocalStorage (Isolated per-user)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('miniatm_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('miniatm_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    saveUserStorageItem(activeUsername, 'profile', profile);
    if (activeUsername === 'admin') {
      localStorage.setItem('miniatm_profile', JSON.stringify(profile));
    }
  }, [profile, activeUsername]);

  useEffect(() => {
    saveUserStorageItem(activeUsername, 'accounts', accounts);
    if (activeUsername === 'admin') {
      localStorage.setItem('miniatm_accounts', JSON.stringify(accounts));
    }
  }, [accounts, activeUsername]);

  useEffect(() => {
    saveUserStorageItem(activeUsername, 'transactions', transactions);
    if (activeUsername === 'admin') {
      localStorage.setItem('miniatm_transactions', JSON.stringify(transactions));
    }
  }, [transactions, activeUsername]);

  useEffect(() => {
    saveUserStorageItem(activeUsername, 'products', products);
    if (activeUsername === 'admin') {
      localStorage.setItem('miniatm_products', JSON.stringify(products));
    }
  }, [products, activeUsername]);

  useEffect(() => {
    saveUserStorageItem(activeUsername, 'pos_sales', posSales);
    if (activeUsername === 'admin') {
      localStorage.setItem('miniatm_pos_sales', JSON.stringify(posSales));
    }
  }, [posSales, activeUsername]);

  useEffect(() => {
    saveUserStorageItem(activeUsername, 'stock_logs', stockLogs);
    if (activeUsername === 'admin') {
      localStorage.setItem('miniatm_stock_logs', JSON.stringify(stockLogs));
    }
  }, [stockLogs, activeUsername]);

  useEffect(() => {
    saveUserStorageItem(activeUsername, 'mutations', mutations);
    if (activeUsername === 'admin') {
      localStorage.setItem('miniatm_mutations', JSON.stringify(mutations));
    }
  }, [mutations, activeUsername]);

  useEffect(() => {
    localStorage.setItem('miniatm_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    saveUserStorageItem(activeUsername, 'members', members);
    if (activeUsername === 'admin') {
      localStorage.setItem('miniatm_members', JSON.stringify(members));
    }
  }, [members, activeUsername]);

  useEffect(() => {
    saveUserStorageItem(activeUsername, 'member_points', memberPoints);
    if (activeUsername === 'admin') {
      localStorage.setItem('miniatm_member_points', JSON.stringify(memberPoints));
    }
  }, [memberPoints, activeUsername]);

  useEffect(() => {
    saveUserStorageItem(activeUsername, 'member_rewards', memberRewards);
    if (activeUsername === 'admin') {
      localStorage.setItem('miniatm_member_rewards', JSON.stringify(memberRewards));
    }
  }, [memberRewards, activeUsername]);

  useEffect(() => {
    saveUserStorageItem(activeUsername, 'member_vouchers', voucherClaims);
    if (activeUsername === 'admin') {
      localStorage.setItem('miniatm_member_vouchers', JSON.stringify(voucherClaims));
    }
  }, [voucherClaims, activeUsername]);

  useEffect(() => {
    saveUserStorageItem(activeUsername, 'point_settings', pointSettings);
    if (activeUsername === 'admin') {
      localStorage.setItem('miniatm_point_settings', JSON.stringify(pointSettings));
    }
  }, [pointSettings, activeUsername]);

  useEffect(() => {
    saveUserStorageItem(activeUsername, 'printer_settings', printerSettings);
    if (activeUsername === 'admin') {
      localStorage.setItem('miniatm_printer_settings', JSON.stringify(printerSettings));
    }
  }, [printerSettings, activeUsername]);

  useEffect(() => {
    localStorage.setItem('miniatm_role', currentRole);
  }, [currentRole]);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    const workspace = loadUserIsolatedData(user);
    applyUserData(workspace);
    if (user.role === 'Kasir') {
      setActiveTab('transaksi');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    setCurrentUser(null);
    localStorage.removeItem('miniatm_current_user');
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (currentUser) {
      const updatedUser: AuthUser = { ...currentUser, role };
      setCurrentUser(updatedUser);
    }
  };

  // User Management Handlers (Admin & Kasir)
  const handleSaveUser = (userData: Partial<AppUser>) => {
    if (userData.id) {
      let updatedUser: AppUser | null = null;
      setUsers((prev) => {
        const next = prev.map((u) => {
          if (u.id === userData.id) {
            updatedUser = { ...u, ...userData } as AppUser;
            return updatedUser;
          }
          return u;
        });
        return next;
      });
      if (updatedUser) {
        syncUserToSheets(updatedUser);
        recordVersionChange(`Pembaruan data pengguna ${(updatedUser as AppUser).name}`, 'USER');
        if (
          currentUser?.id === (updatedUser as AppUser).id ||
          currentUser?.username === (updatedUser as AppUser).username
        ) {
          setCurrentUser((prev) =>
            prev
              ? {
                  ...prev,
                  name: (updatedUser as AppUser).name,
                  role: (updatedUser as AppUser).role,
                }
              : null
          );
          setCurrentRole((updatedUser as AppUser).role);
        }
      }
    } else {
      const cleanUsername = (userData.username || '').trim().toLowerCase();
      const newUser: AppUser = {
        id: `usr_${cleanUsername}_${Date.now()}`,
        username: cleanUsername,
        name: (userData.name || '').trim(),
        password: userData.password || '123456',
        role: userData.role || 'Kasir',
        phone: userData.phone || '',
        status: userData.status || 'ACTIVE',
        createdAt: formatDateTime(),
        notes: userData.notes || '',
        lastLogin: '-',
      };

      // Provision isolated workspace for this newly created account
      const freshWorkspace = createFreshUserData(newUser);
      saveUserStorageItem(cleanUsername, 'profile', freshWorkspace.profile);
      saveUserStorageItem(cleanUsername, 'accounts', freshWorkspace.accounts);
      saveUserStorageItem(cleanUsername, 'transactions', freshWorkspace.transactions);
      saveUserStorageItem(cleanUsername, 'products', freshWorkspace.products);
      saveUserStorageItem(cleanUsername, 'pos_sales', freshWorkspace.posSales);
      saveUserStorageItem(cleanUsername, 'stock_logs', freshWorkspace.stockLogs);
      saveUserStorageItem(cleanUsername, 'mutations', freshWorkspace.mutations);
      saveUserStorageItem(cleanUsername, 'members', freshWorkspace.members);
      saveUserStorageItem(cleanUsername, 'member_points', freshWorkspace.memberPoints);
      saveUserStorageItem(cleanUsername, 'member_rewards', freshWorkspace.memberRewards);
      saveUserStorageItem(cleanUsername, 'member_vouchers', freshWorkspace.voucherClaims);
      saveUserStorageItem(cleanUsername, 'point_settings', freshWorkspace.pointSettings);
      saveUserStorageItem(cleanUsername, 'printer_settings', freshWorkspace.printerSettings);

      setUsers((prev) => [...prev, newUser]);
      syncUserToSheets(newUser);
      recordVersionChange(`Penambahan akun & alokasi database baru: ${newUser.name} (${newUser.role})`, 'USER');
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    syncDeleteUserToSheets(userId);
    recordVersionChange(`Hapus akun pengguna ${target?.name || userId}`, 'USER');
  };

  const handleToggleUserStatus = (userId: string) => {
    let changedUser: AppUser | null = null;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          changedUser = { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' };
          return changedUser;
        }
        return u;
      })
    );
    if (changedUser) {
      syncUserToSheets(changedUser);
    }
  };

  const handleSwitchActiveUser = (user: AppUser) => {
    const initials = user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    const auth: AuthUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      avatarInitials: initials || (user.role === 'Admin' ? 'AD' : 'KS'),
    };
    setCurrentUser(auth);
    setCurrentRole(user.role);
    const workspace = loadUserIsolatedData(user);
    applyUserData(workspace);
    if (user.role === 'Kasir') {
      setActiveTab('transaksi');
    }
  };

  // Member Pelanggan Management Handlers
  const handleSaveMember = (memberData: Partial<CustomerMember>) => {
    if (memberData.id) {
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id === memberData.id) {
            const updated = { ...m, ...memberData } as CustomerMember;
            updated.tier = calculateTier(updated.points);
            return updated;
          }
          return m;
        })
      );
      recordVersionChange(`Pembaruan member ${memberData.name}`, 'USER');
    } else {
      const now = new Date();
      const randomCardSeq = Array.from({ length: 3 }, () =>
        Math.floor(1000 + Math.random() * 9000).toString()
      ).join(' ');
      const cardNumber = `6011 ${randomCardSeq}`;
      const memberNumber = `MBR-${Date.now().toString().slice(-6)}`;
      const newMember: CustomerMember = {
        id: `MEM-${Date.now().toString().slice(-6)}`,
        memberNumber,
        cardNumber,
        name: (memberData.name || 'Member Baru').trim(),
        phone: (memberData.phone || '').trim(),
        email: memberData.email?.trim() || undefined,
        address: memberData.address?.trim() || undefined,
        points: memberData.points || 0,
        tier: calculateTier(memberData.points || 0),
        status: memberData.status || 'ACTIVE',
        joinedDate: now.toISOString().split('T')[0],
        totalSpent: 0,
        totalTrxCount: 0,
        notes: memberData.notes?.trim() || undefined,
      };

      setMembers((prev) => [newMember, ...prev]);

      if (newMember.points > 0) {
        const welcomeLog: MemberPointHistory = {
          id: `LOG-PTS-${Date.now()}`,
          memberId: newMember.id,
          type: 'BONUS_MANUAL',
          points: newMember.points,
          balanceAfter: newMember.points,
          description: 'Bonus poin pendaftaran perdana member baru',
          time: formatDateTime(),
          operatorName: currentUser?.name || 'Admin',
        };
        setMemberPoints((prev) => [welcomeLog, ...prev]);
      }

      recordVersionChange(`Pendaftaran Member Baru ${newMember.name} (${newMember.memberNumber})`, 'USER');
    }
    setIsMemberFormOpen(false);
    setEditingMember(null);
  };

  const handleDeleteMember = (memberId: string) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    if (window.confirm(`Hapus data member "${target.name}" (${target.memberNumber})? Riwayat poin akan ikut terhapus.`)) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setMemberPoints((prev) => prev.filter((p) => p.memberId !== memberId));
      recordVersionChange(`Hapus member ${target.name}`, 'USER');
      if (selectedDetailMember?.id === memberId) {
        setIsMemberDetailOpen(false);
        setSelectedDetailMember(null);
      }
      if (selectedCardMember?.id === memberId) {
        setIsMemberCardOpen(false);
        setSelectedCardMember(null);
      }
    }
  };

  const handleAdjustMemberPoints = (
    memberId: string,
    amount: number,
    type: PointChangeType,
    description: string
  ) => {
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) return;

    const isDeduction = type === 'REDEEM_POINT' || type === 'EXPIRED_POINT';
    const pointDelta = isDeduction ? -Math.abs(amount) : Math.abs(amount);
    const newPoints = Math.max(0, (targetMember.points || 0) + pointDelta);
    const newTier = calculateTier(newPoints);

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, points: newPoints, tier: newTier } : m))
    );

    const log: MemberPointHistory = {
      id: `LOG-PTS-${Date.now()}`,
      memberId,
      type,
      points: Math.abs(amount),
      balanceAfter: newPoints,
      description,
      time: formatDateTime(),
      operatorName: currentUser?.name || 'Operator',
    };

    setMemberPoints((prev) => [log, ...prev]);

    // Keep selected detail member state updated if open
    if (selectedDetailMember?.id === memberId) {
      setSelectedDetailMember({
        ...selectedDetailMember,
        points: newPoints,
        tier: newTier,
      });
    }

    recordVersionChange(
      `Penyesuaian poin member ${targetMember.name}: ${pointDelta > 0 ? `+${pointDelta}` : pointDelta} Poin (${type})`,
      'USER'
    );
  };

  // Member Reward & Voucher Handlers
  const handleSaveReward = (rewardData: Partial<MemberRewardItem>) => {
    if (rewardData.id) {
      setMemberRewards((prev) =>
        prev.map((r) => (r.id === rewardData.id ? ({ ...r, ...rewardData } as MemberRewardItem) : r))
      );
      recordVersionChange(`Pembaruan hadiah/kupon: ${rewardData.name}`, 'USER');
    } else {
      const newReward: MemberRewardItem = {
        id: `RWD-${Date.now()}`,
        name: rewardData.name || 'Reward Baru',
        category: rewardData.category || 'VOUCHER_BELANJA',
        pointsRequired: Math.max(50, rewardData.pointsRequired || 50),
        description: rewardData.description || '',
        stock: rewardData.stock,
        discountValue: rewardData.discountValue,
        minTier: rewardData.minTier,
        isActive: rewardData.isActive !== false,
      };
      setMemberRewards((prev) => [newReward, ...prev]);
      recordVersionChange(`Tambah katalog reward: ${newReward.name} (${newReward.pointsRequired} Poin)`, 'USER');
    }
    setIsRewardModalOpen(false);
    setEditingReward(null);
  };

  const handleDeleteReward = (rewardId: string) => {
    const target = memberRewards.find((r) => r.id === rewardId);
    if (!target) return;
    if (window.confirm(`Hapus hadiah/voucher "${target.name}" dari katalog?`)) {
      setMemberRewards((prev) => prev.filter((r) => r.id !== rewardId));
      recordVersionChange(`Hapus reward ${target.name}`, 'USER');
    }
  };

  const handleSavePointSettings = (newSettings: PointExchangeSettings) => {
    setPointSettings(newSettings);
    setIsPointSettingsModalOpen(false);
    recordVersionChange(
      `Pengaturan poin diperbarui (Min tukar: ${newSettings.minPointsRedeem} poin = Rp ${newSettings.rupiahPerStep.toLocaleString('id-ID')})`,
      'USER'
    );
  };

  const handleConfirmDirectClaim = (memberId: string, rewardId: string, notes?: string) => {
    const member = members.find((m) => m.id === memberId);
    const reward = memberRewards.find((r) => r.id === rewardId);
    if (!member || !reward) return;

    const minPoints = pointSettings?.minPointsRedeem ?? 50;
    const pointsRequired = reward.pointsRequired || 50;

    if ((member.points || 0) < pointsRequired || (member.points || 0) < minPoints) {
      alert(`Poin member tidak mencukupi! Poin saat ini: ${member.points}, dibutuhkan: ${pointsRequired} poin (minimal penukaran ${minPoints} poin).`);
      return;
    }

    if (reward.stock !== undefined && reward.stock <= 0) {
      alert('Stok hadiah/kupon ini sudah habis.');
      return;
    }

    const newPoints = Math.max(0, (member.points || 0) - pointsRequired);
    const newTier = calculateTier(newPoints);
    const claimTime = formatDateTime();
    const voucherCode = `VCH-${Date.now().toString().slice(-6)}`;

    // 1. Deduct points from member
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, points: newPoints, tier: newTier } : m))
    );

    // 2. Reduce stock if finite
    if (reward.stock !== undefined) {
      setMemberRewards((prev) =>
        prev.map((r) => (r.id === rewardId ? { ...r, stock: Math.max(0, r.stock - 1) } : r))
      );
    }

    // 3. Create active voucher claim record
    const newClaim: MemberVoucherClaim = {
      id: `CLM-${Date.now()}`,
      voucherCode,
      memberId: member.id,
      memberName: member.name,
      memberNumber: member.memberNumber,
      rewardId: reward.id,
      rewardName: reward.name,
      category: reward.category,
      pointsUsed: pointsRequired,
      discountValue: reward.discountValue || 0,
      claimDate: claimTime,
      status: 'ACTIVE',
      operatorName: currentUser?.name || 'Operator',
      notes,
    };
    setVoucherClaims((prev) => [newClaim, ...prev]);

    // 4. Log point history
    const pointLog: MemberPointHistory = {
      id: `LOG-PTS-${Date.now()}`,
      memberId: member.id,
      type: 'REDEEM_POINT',
      points: -pointsRequired,
      balanceAfter: newPoints,
      refNumber: voucherCode,
      description: `Klaim Reward: ${reward.name} (-${pointsRequired} Poin)`,
      time: claimTime,
      operatorName: currentUser?.name || 'Operator',
    };
    setMemberPoints((prev) => [pointLog, ...prev]);

    recordVersionChange(`Klaim reward ${reward.name} (${voucherCode}) oleh ${member.name}`, 'USER');

    // 5. Open voucher receipt dialog
    setSelectedVoucherClaim(newClaim);
    setIsVoucherReceiptOpen(true);
  };

  const handleToggleVoucherUsed = (claimId: string) => {
    setVoucherClaims((prev) =>
      prev.map((v) => {
        if (v.id === claimId) {
          const isCurrentlyActive = v.status === 'ACTIVE';
          return {
            ...v,
            status: isCurrentlyActive ? 'USED' : 'ACTIVE',
            usedDate: isCurrentlyActive ? formatDateTime() : undefined,
          };
        }
        return v;
      })
    );
  };

  // Transaction Handlers
  const handleSaveTrx = (trxData: Partial<Transaction>) => {
    if (trxData.id) {
      // Edit existing transaction
      let updatedTrx: Transaction | null = null;
      setTransactions((prev) => {
        const next = prev.map((t) => {
          if (t.id === trxData.id) {
            updatedTrx = { ...t, ...trxData } as Transaction;
            return updatedTrx;
          }
          return t;
        });
        if (updatedTrx) {
          syncTransactionToSheets(updatedTrx, accounts);
          recordVersionChange(`Pembaruan transaksi #${trxData.id}`, 'TRANSACTION');
        }
        return next;
      });
    } else {
      // Create new transaction
      const nextNum = transactions.length + 101;
      const newTrx: Transaction = {
        id: `TRX-${nextNum}`,
        time: trxData.time || formatDateTime(),
        type: trxData.type || 'SETOR TUNAI',
        cust: trxData.cust || 'Pelanggan',
        target: trxData.target || 'Tujuan',
        nominal: trxData.nominal || 0,
        feeCust: trxData.feeCust || 0,
        feeAdmin: trxData.feeAdmin || 0,
        status: 'SUCCESS',
        accountId: trxData.accountId || accounts[0]?.id || 'acc1',
        phoneCust: trxData.phoneCust,
        notes: trxData.notes,
        refNumber: `REF-${Date.now().toString().slice(-8)}`,
        memberId: trxData.memberId,
        memberNumber: trxData.memberNumber,
      };

      setTransactions((prev) => [newTrx, ...prev]);

      // Handle Member Points: +1 point earned and points redeemed if any
      if (newTrx.memberId) {
        const member = members.find((m) => m.id === newTrx.memberId);
        if (member) {
          const pointsEarned = 1;
          const pointsRedeemed = trxData.pointsRedeemed || 0;
          const newPoints = Math.max(0, (member.points || 0) + pointsEarned - pointsRedeemed);
          const newTier = calculateTier(newPoints);

          setMembers((prev) =>
            prev.map((m) =>
              m.id === newTrx.memberId
                ? {
                    ...m,
                    points: newPoints,
                    tier: newTier,
                    totalSpent: (m.totalSpent || 0) + newTrx.nominal + newTrx.feeCust,
                    totalTrxCount: (m.totalTrxCount || 0) + 1,
                  }
                : m
            )
          );

          const pointLogEarn: MemberPointHistory = {
            id: `LOG-PTS-${Date.now()}-1`,
            memberId: newTrx.memberId,
            type: 'EARN_TRX_MINI_ATM',
            points: 1,
            balanceAfter: (member.points || 0) + 1,
            refNumber: newTrx.id,
            description: `Reward +1 Poin Transaksi Mini ATM #${newTrx.id} (${newTrx.type})`,
            time: newTrx.time,
            operatorName: currentUser?.name || 'Operator',
          };

          const newLogs: MemberPointHistory[] = [pointLogEarn];

          if (pointsRedeemed > 0) {
            const pointLogRedeem: MemberPointHistory = {
              id: `LOG-PTS-${Date.now()}-2`,
              memberId: newTrx.memberId,
              type: 'REDEEM_TRX_DISCOUNT',
              points: -pointsRedeemed,
              balanceAfter: newPoints,
              refNumber: newTrx.id,
              description: `Tukar ${pointsRedeemed} Poin untuk Diskon Transaksi #${newTrx.id} (Hemat Rp ${(trxData.discountFromPoints || 0).toLocaleString('id-ID')})`,
              time: newTrx.time,
              operatorName: currentUser?.name || 'Operator',
            };
            newLogs.unshift(pointLogRedeem);
          }

          setMemberPoints((prev) => [...newLogs, ...prev]);

          // Mark voucher as USED if applied
          if (trxData.voucherClaimId) {
            setVoucherClaims((prev) =>
              prev.map((v) =>
                v.id === trxData.voucherClaimId
                  ? {
                      ...v,
                      status: 'USED',
                      usedDate: newTrx.time,
                      usedRefNumber: newTrx.id,
                    }
                  : v
              )
            );
          }
        }
      }

      // Adjust account balance accordingly
      const profit = newTrx.feeCust - newTrx.feeAdmin;
      const updatedAccounts = accounts.map((acc) => {
        if (acc.id === newTrx.accountId) {
          if (newTrx.type === 'SETOR TUNAI' || newTrx.type === 'PEMBAYARAN') {
            return { ...acc, balance: acc.balance + newTrx.nominal + profit };
          }
          if (newTrx.type === 'TARIK TUNAI') {
            return { ...acc, balance: acc.balance - newTrx.nominal + profit };
          }
          return { ...acc, balance: acc.balance + profit };
        }
        return acc;
      });

      setAccounts(updatedAccounts);

      // Create automatic cash flow mutation entry
      let autoMutType: 'MASUK' | 'KELUAR' = 'MASUK';
      let autoMutAmount = profit;
      if (newTrx.type === 'SETOR TUNAI' || newTrx.type === 'PEMBAYARAN') {
        autoMutType = 'MASUK';
        autoMutAmount = newTrx.nominal + profit;
      } else if (newTrx.type === 'TARIK TUNAI') {
        autoMutType = 'KELUAR';
        autoMutAmount = Math.max(0, newTrx.nominal - profit);
      }

      const autoMut: CashMutation = {
        id: `MUT-${Date.now()}`,
        time: newTrx.time,
        accountId: newTrx.accountId,
        type: autoMutType,
        amount: autoMutAmount,
        feeMargin: profit,
        description: `Trx ${newTrx.type} #${newTrx.id} - ${newTrx.cust} (${newTrx.target})`,
        relatedTrxId: newTrx.id,
      };

      setMutations((prev) => [autoMut, ...prev]);

      // Auto-sync real-time to Google Sheets (Transactions, Accounts, and Mutations)
      syncTransactionToSheets(newTrx, updatedAccounts, autoMut);
      recordVersionChange(`Transaksi baru #${newTrx.id} (${newTrx.type}) Rp ${newTrx.nominal.toLocaleString('id-ID')}`, 'TRANSACTION');

      // Auto preview receipt for freshly created transaction
      setReceiptTrx(newTrx);
      setIsReceiptModalOpen(true);
    }
  };

  const handleConfirmVoid = (trx: Transaction) => {
    setVoidTrx(trx);
    setIsVoidModalOpen(true);
  };

  const handleExecuteVoid = () => {
    if (!voidTrx) return;

    setTransactions((prev) =>
      prev.map((t) => (t.id === voidTrx.id ? { ...t, status: 'VOID' } : t))
    );

    // Reverse balance effect
    const profit = voidTrx.feeCust - voidTrx.feeAdmin;
    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === voidTrx.accountId) {
        if (voidTrx.type === 'SETOR TUNAI' || voidTrx.type === 'PEMBAYARAN') {
          return { ...acc, balance: Math.max(0, acc.balance - (voidTrx.nominal + profit)) };
        }
        if (voidTrx.type === 'TARIK TUNAI') {
          return { ...acc, balance: acc.balance + (voidTrx.nominal - profit) };
        }
        return { ...acc, balance: Math.max(0, acc.balance - profit) };
      }
      return acc;
    });

    setAccounts(updatedAccounts);

    // Create reversing mutation for void
    const voidMut: CashMutation = {
      id: `MUT-${Date.now()}`,
      time: formatDateTime(),
      accountId: voidTrx.accountId,
      type: voidTrx.type === 'TARIK TUNAI' ? 'MASUK' : 'KELUAR',
      amount: voidTrx.nominal,
      feeMargin: 0,
      description: `[BATAL/VOID] Trx #${voidTrx.id} - ${voidTrx.cust}`,
      relatedTrxId: voidTrx.id,
    };

    setMutations((prev) => [voidMut, ...prev]);

    // Real-time void sync to Google Sheets (Void status, Reverted Balances, and Void Mutation Log)
    syncVoidToSheets(voidTrx.id, updatedAccounts, voidMut);
    recordVersionChange(`Batal/VOID transaksi #${voidTrx.id} (${voidTrx.cust})`, 'TRANSACTION');

    setIsVoidModalOpen(false);
    setVoidTrx(null);
  };

  // Account Handlers
  const handleSaveAccount = (accData: Partial<Account>) => {
    if (accData.id) {
      let updatedAcc: Account | null = null;
      setAccounts((prev) => {
        const next = prev.map((a) => {
          if (a.id === accData.id) {
            updatedAcc = { ...a, ...accData } as Account;
            return updatedAcc;
          }
          return a;
        });
        if (updatedAcc) {
          syncAccountToSheets(updatedAcc);
          recordVersionChange(`Pembaruan akun kas ${(updatedAcc as Account).name}`, 'ACCOUNT');
        }
        return next;
      });
    } else {
      const newAcc: Account = {
        id: `acc${Date.now()}`,
        name: accData.name || 'Rekening Baru',
        type: accData.type || 'Bank',
        balance: accData.balance || 0,
        accountNumber: accData.accountNumber,
        bankName: accData.bankName,
      };
      setAccounts((prev) => [...prev, newAcc]);
      syncAccountToSheets(newAcc);
      recordVersionChange(`Tambah akun kas baru ${newAcc.name}`, 'ACCOUNT');
    }
  };

  const handleDeleteAccount = (id: string) => {
    if (accounts.length <= 1) {
      alert('Tidak dapat menghapus. Minimal harus tersisa 1 akun kas/rekening aktif dalam sistem.');
      return;
    }

    const targetAcc = accounts.find((a) => a.id === id);
    if (!targetAcc) return;

    const countTrx = transactions.filter((t) => t.accountId === id).length;
    const countMutations = mutations.filter((m) => m.accountId === id || m.toAccountId === id).length;

    let confirmMsg = `Yakin ingin menghapus akun "${targetAcc.name}"?`;
    if (countTrx > 0 || countMutations > 0) {
      confirmMsg = `Peringatan: Akun "${targetAcc.name}" memiliki ${countTrx} riwayat transaksi dan ${countMutations} catatan mutasi. Yakin tetap ingin menghapus akun ini?`;
    }

    if (window.confirm(confirmMsg)) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      syncDeleteAccountToSheets(id);
      recordVersionChange(`Hapus akun kas ${targetAcc.name}`, 'ACCOUNT');
      if (editingAccount?.id === id) {
        setIsAccountModalOpen(false);
        setEditingAccount(null);
      }
    }
  };

  // Product POS & Inventory Handlers
  const handleSaveProduct = (prodData: Partial<Product>) => {
    if (prodData.id) {
      let updatedProd: Product | null = null;
      setProducts((prev) => {
        const next = prev.map((p) => {
          if (p.id === prodData.id) {
            updatedProd = { ...p, ...prodData } as Product;
            return updatedProd;
          }
          return p;
        });
        if (updatedProd) {
          syncProductToSheets(updatedProd);
          recordVersionChange(`Pembaruan data produk ${(updatedProd as Product).name}`, 'PRODUCT');
        }
        return next;
      });
    } else {
      const newProd: Product = {
        id: `P0${products.length + 1}`,
        name: prodData.name || 'Produk Baru',
        price: prodData.price || 0,
        buyPrice: prodData.buyPrice !== undefined ? prodData.buyPrice : (prodData.price || 0) * 0.8,
        stock: prodData.stock || 0,
        minStock: prodData.minStock || 5,
        unit: prodData.unit || 'Pcs',
        barcode: prodData.barcode || undefined,
        category: prodData.category || 'Pulsa/Paket',
        lastRestockDate: new Date().toISOString().split('T')[0],
      };
      setProducts((prev) => [...prev, newProd]);
      syncProductToSheets(newProd);
      recordVersionChange(`Tambah produk baru ${newProd.name}`, 'PRODUCT');
    }
  };

  const handleDeleteProduct = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    if (window.confirm(`Hapus produk "${target.name}" dari katalog?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      syncDeleteProductToSheets(id);
      recordVersionChange(`Hapus produk ${target.name}`, 'PRODUCT');
      if (editingProduct?.id === id) {
        setIsProductModalOpen(false);
        setEditingProduct(null);
      }
    }
  };

  const handleRestockProduct = (
    productId: string,
    qtyToAdd: number,
    newBuyPrice?: number,
    supplierOrNotes?: string
  ) => {
    const targetProd = products.find((p) => p.id === productId);
    if (!targetProd) return;

    const previousStock = targetProd.stock;
    const currentStock = previousStock + qtyToAdd;
    const effectiveBuyPrice = newBuyPrice !== undefined ? newBuyPrice : (targetProd.buyPrice || targetProd.price * 0.8);
    const totalCost = effectiveBuyPrice * qtyToAdd;

    // 1. Update product stock and price
    const updatedProd: Product = {
      ...targetProd,
      stock: currentStock,
      buyPrice: effectiveBuyPrice,
      lastRestockDate: new Date().toISOString().split('T')[0],
    };

    setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProd : p)));
    syncProductToSheets(updatedProd);

    // 2. Add Stock Log
    const newLog: StockAdjustmentLog = {
      id: `LOG-RST-${Date.now()}`,
      time: formatDateTime(),
      productId,
      productName: targetProd.name,
      type: 'RESTOCK_MASUK',
      qtyChange: qtyToAdd,
      stockBefore: previousStock,
      stockAfter: currentStock,
      costPerUnit: effectiveBuyPrice,
      reason: supplierOrNotes || 'Restock pengadaan barang baru',
      operatorName: currentUser?.name || 'Administrator',
    };
    setStockLogs((prev) => [newLog, ...prev]);
    syncStockLogToSheets(newLog);
    recordVersionChange(`Restock ${targetProd.name} (+${qtyToAdd} ${targetProd.unit})`, 'STOCK');

    // 3. Create cash mutation if totalCost > 0 and primary account exists
    if (totalCost > 0 && accounts.length > 0) {
      const primaryAcc = accounts[0];
      const mut: CashMutation = {
        id: `MUT-RST-${Date.now()}`,
        time: formatDateTime(),
        accountId: primaryAcc.id,
        type: 'KELUAR',
        amount: totalCost,
        feeMargin: 0,
        description: `Restock Stok: ${targetProd.name} (+${qtyToAdd} unit @ ${effectiveBuyPrice.toLocaleString('id-ID')})`,
        relatedTrxId: newLog.id,
      };
      setMutations((prev) => [mut, ...prev]);
      const updatedAccounts = accounts.map((acc) =>
        acc.id === primaryAcc.id ? { ...acc, balance: acc.balance - totalCost } : acc
      );
      setAccounts(updatedAccounts);
      syncMutationToSheets(mut, updatedAccounts);
    }
  };

  const handleAdjustStock = (
    productId: string,
    qtyToDeduct: number,
    reason: string,
    adjustmentType: 'KOREKSI_RUSAK' | 'KOREKSI_HILANG' | 'KOREKSI_KADALUARSA' | 'PENYESUAIAN_KOREKSI'
  ) => {
    const targetProd = products.find((p) => p.id === productId);
    if (!targetProd) return;

    const previousStock = targetProd.stock;
    const currentStock = Math.max(0, previousStock - qtyToDeduct);

    const updatedProd: Product = {
      ...targetProd,
      stock: currentStock,
    };

    setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProd : p)));
    syncProductToSheets(updatedProd);

    // Add Stock Log
    const newLog: StockAdjustmentLog = {
      id: `LOG-ADJ-${Date.now()}`,
      time: formatDateTime(),
      productId,
      productName: targetProd.name,
      type: adjustmentType,
      qtyChange: -qtyToDeduct,
      stockBefore: previousStock,
      stockAfter: currentStock,
      reason,
      operatorName: currentUser?.name || 'Administrator',
    };
    setStockLogs((prev) => [newLog, ...prev]);
    syncStockLogToSheets(newLog);
    recordVersionChange(`Penyesuaian stok ${targetProd.name} (-${qtyToDeduct} ${targetProd.unit})`, 'STOCK');
  };

  // Checkout POS action
  const handleCheckoutPOS = (
    cart: CartItem[],
    total: number,
    paymentMethod: string = 'Tunai',
    customerName?: string,
    notes?: string,
    memberId?: string,
    pointsRedeemed: number = 0,
    discountFromPoints: number = 0,
    voucherClaimId?: string,
    cashReceived?: number,
    changeAmount?: number
  ) => {
    const saleId = `POS-${Date.now().toString().slice(-6)}`;
    const invoiceNum = `INV-${Date.now().toString().slice(-8)}`;
    const saleTime = formatDateTime();
    const selectedMember = memberId ? members.find((m) => m.id === memberId) : null;

    // 1. Calculate items, costs, discounts, and profit
    let totalCost = 0;
    let totalQty = 0;
    let totalBeforeDiscount = 0;
    let totalDiscount = 0;

    const saleItems: PosSaleItem[] = cart.map((c) => {
      const prod = products.find((p) => p.id === c.id);
      const buyPrice = c.buyPrice !== undefined ? c.buyPrice : (prod?.buyPrice !== undefined ? prod.buyPrice : c.price * 0.8);
      const itemCost = buyPrice * c.qty;
      const originalSubtotal = c.price * c.qty;

      // Calculate item discount amount
      let itemDiscountAmount = 0;
      if (c.discountValue && c.discountValue > 0) {
        if (c.discountType === 'percent') {
          const rate = Math.min(100, Math.max(0, c.discountValue));
          itemDiscountAmount = Math.round((originalSubtotal * rate) / 100);
        } else {
          const perUnit = Math.min(c.price, Math.max(0, c.discountValue));
          itemDiscountAmount = perUnit * c.qty;
        }
      } else if (c.discountAmount && c.discountAmount > 0) {
        itemDiscountAmount = c.discountAmount;
      }

      const subtotal = Math.max(0, originalSubtotal - itemDiscountAmount);
      const profit = subtotal - itemCost;
      totalCost += itemCost;
      totalQty += c.qty;
      totalBeforeDiscount += originalSubtotal;
      totalDiscount += itemDiscountAmount;

      return {
        productId: c.id,
        productName: c.name,
        category: c.category || prod?.category || 'Umum',
        qty: c.qty,
        unit: c.unit || prod?.unit || 'Pcs',
        price: c.price,
        buyPrice,
        discountType: c.discountType,
        discountValue: c.discountValue,
        discountAmount: itemDiscountAmount,
        subtotal,
        totalCost: itemCost,
        profit,
      };
    });

    const netRevenue = Math.max(0, totalBeforeDiscount - totalDiscount - (discountFromPoints || 0));
    const totalProfit = netRevenue - totalCost;

    // 2. Deduct stock for each purchased item
    const newStockLogs: StockAdjustmentLog[] = [];
    const updatedProducts = products.map((prod) => {
      const item = cart.find((c) => c.id === prod.id);
      if (item) {
        const previousStock = prod.stock;
        const currentStock = Math.max(0, prod.stock - item.qty);

        newStockLogs.push({
          id: `LOG-POS-${Date.now()}-${prod.id}`,
          time: saleTime,
          productId: prod.id,
          productName: prod.name,
          type: 'PENJUALAN_POS',
          qtyChange: -item.qty,
          stockBefore: previousStock,
          stockAfter: currentStock,
          reason: `Penjualan Kasir #${saleId}`,
          operatorName: currentUser?.name || 'Kasir',
        });

        return { ...prod, stock: currentStock };
      }
      return prod;
    });

    setProducts(updatedProducts);
    setStockLogs((prev) => [...newStockLogs, ...prev]);

    // 3. Save PosSale record
    const newPosSale: PosSale = {
      id: saleId,
      invoiceNumber: invoiceNum,
      time: saleTime,
      cashierName: currentUser?.name || 'Kasir',
      cashierRole: currentRole,
      customerName: selectedMember ? selectedMember.name : (customerName || 'Pelanggan Umum'),
      items: saleItems,
      totalQty,
      totalBeforeDiscount,
      totalDiscount: totalDiscount + (discountFromPoints || 0),
      totalRevenue: netRevenue,
      totalCost,
      grossProfit: totalProfit,
      paymentMethod,
      accountId: accounts[0]?.id || 'acc1',
      status: 'SUCCESS',
      notes,
      memberId: memberId || undefined,
      memberNumber: selectedMember?.memberNumber || undefined,
      cashReceived: cashReceived ?? netRevenue,
      changeAmount: changeAmount ?? 0,
    };
    setPosSales((prev) => [newPosSale, ...prev]);

    // Award +1 Poin to Member and handle point/voucher redemption
    if (memberId && selectedMember) {
      const pointsEarned = 1;
      const ptsRedeemed = pointsRedeemed || 0;
      const newPoints = Math.max(0, (selectedMember.points || 0) + pointsEarned - ptsRedeemed);
      const newTier = calculateTier(newPoints);

      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                points: newPoints,
                tier: newTier,
                totalSpent: (m.totalSpent || 0) + netRevenue,
                totalTrxCount: (m.totalTrxCount || 0) + 1,
              }
            : m
        )
      );

      const posPointLog: MemberPointHistory = {
        id: `LOG-PTS-${Date.now()}-1`,
        memberId,
        type: 'EARN_TRX_POS',
        points: 1,
        balanceAfter: (selectedMember.points || 0) + 1,
        refNumber: saleId,
        description: `Reward +1 Poin Transaksi Kasir POS #${saleId} (${totalQty} item)`,
        time: saleTime,
        operatorName: currentUser?.name || 'Kasir',
      };

      const newLogs: MemberPointHistory[] = [posPointLog];

      if (ptsRedeemed > 0) {
        const redeemLog: MemberPointHistory = {
          id: `LOG-PTS-${Date.now()}-2`,
          memberId,
          type: 'REDEEM_POS_DISCOUNT',
          points: -ptsRedeemed,
          balanceAfter: newPoints,
          refNumber: saleId,
          description: `Tukar ${ptsRedeemed} Poin Diskon Kasir POS #${saleId} (Hemat Rp ${(discountFromPoints || 0).toLocaleString('id-ID')})`,
          time: saleTime,
          operatorName: currentUser?.name || 'Kasir',
        };
        newLogs.unshift(redeemLog);
      }

      setMemberPoints((prev) => [...newLogs, ...prev]);

      // If voucher was claimed and used, mark as USED
      if (voucherClaimId) {
        setVoucherClaims((prev) =>
          prev.map((v) =>
            v.id === voucherClaimId
              ? { ...v, status: 'USED', usedDate: saleTime, usedRefNumber: saleId }
              : v
          )
        );
      }
    }

    const itemsSummary = cart
      .map((c) => {
        const disc =
          c.discountValue && c.discountValue > 0
            ? ` [Disc ${c.discountType === 'percent' ? `${c.discountValue}%` : `Rp ${c.discountValue.toLocaleString('id-ID')}`}]`
            : '';
        return `${c.name} (${c.qty}x)${disc}`;
      })
      .join(', ');

    const discInfo = totalDiscount > 0 ? ` (Diskon: -Rp ${totalDiscount.toLocaleString('id-ID')})` : '';

    // 4. Add as financial transaction
    const newTrx: Transaction = {
      id: `TRX-${transactions.length + 101}`,
      time: saleTime,
      type: 'PEMBAYARAN',
      cust: selectedMember ? selectedMember.name : (customerName || 'Pelanggan Kasir POS'),
      target: 'Penjualan Barang Fisik / POS',
      nominal: netRevenue,
      feeCust: 0,
      feeAdmin: 0,
      status: 'SUCCESS',
      accountId: accounts[0]?.id || 'acc1',
      notes: `POS #${saleId}: ${itemsSummary}${discInfo} (Laba: Rp ${totalProfit.toLocaleString('id-ID')})`,
      refNumber: saleId,
      memberId: memberId || undefined,
      memberNumber: selectedMember?.memberNumber || undefined,
      cashReceived: cashReceived ?? netRevenue,
      changeAmount: changeAmount ?? 0,
    };

    setTransactions((prev) => [newTrx, ...prev]);

    // 5. Add to account balance
    const updatedAccounts = accounts.map((acc) =>
      acc.id === newTrx.accountId ? { ...acc, balance: acc.balance + netRevenue } : acc
    );
    setAccounts(updatedAccounts);

    // 6. Create POS cash mutation
    const posMut: CashMutation = {
      id: `MUT-${Date.now()}`,
      time: newTrx.time,
      accountId: newTrx.accountId,
      type: 'MASUK',
      amount: netRevenue,
      feeMargin: totalProfit,
      description: `Penjualan Kasir POS #${saleId} [${paymentMethod}] (${itemsSummary})`,
      relatedTrxId: newTrx.id,
    };
    setMutations((prev) => [posMut, ...prev]);

    // 7. Auto-sync to Google Sheets (Products, POS Sale, Stock Logs, Transaction, Accounts, Mutation)
    syncCheckoutPOSToSheets(updatedProducts, newTrx, updatedAccounts, posMut, newPosSale, newStockLogs);
    recordVersionChange(`Penjualan POS #${saleId} (${totalQty} item) Rp ${netRevenue.toLocaleString('id-ID')}${totalDiscount > 0 ? ` [Diskon Rp ${totalDiscount.toLocaleString('id-ID')}]` : ''}`, 'TRANSACTION');

    // 8. Open receipt modal
    setReceiptPosSale(newPosSale);
    setReceiptTrx(newTrx);
    setIsReceiptModalOpen(true);
  };

  const handleVoidPosSale = (saleId: string) => {
    const targetSale = posSales.find((s) => s.id === saleId);
    if (!targetSale) return;

    if (
      !window.confirm(
        `Batalkan (VOID) transaksi kasir #${saleId}? Stok barang akan dikembalikan dan kas akan disesuaikan.`
      )
    ) {
      return;
    }

    // 1. Mark sale as VOID
    setPosSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, status: 'VOID' as const } : s))
    );
    syncVoidPosSaleToSheets(saleId);

    // 2. Return product stocks
    const newStockLogs: StockAdjustmentLog[] = [];
    const updatedProducts = products.map((prod) => {
      const soldItem = targetSale.items.find((item) => item.productId === prod.id);
      if (soldItem) {
        const previousStock = prod.stock;
        const currentStock = previousStock + soldItem.qty;

        newStockLogs.push({
          id: `LOG-VOID-${Date.now()}-${prod.id}`,
          time: formatDateTime(),
          productId: prod.id,
          productName: prod.name,
          type: 'PENYESUAIAN_KOREKSI',
          qtyChange: soldItem.qty,
          stockBefore: previousStock,
          stockAfter: currentStock,
          reason: `Batal / VOID Transaksi Kasir #${saleId}`,
          operatorName: currentUser?.name || 'Kasir',
        });

        return { ...prod, stock: currentStock };
      }
      return prod;
    });

    setProducts(updatedProducts);
    setStockLogs((prev) => [...newStockLogs, ...prev]);

    // 3. Deduct account balance & create negative mutation
    if (accounts.length > 0) {
      const primaryAcc = accounts[0];
      const mut: CashMutation = {
        id: `MUT-VOID-${Date.now()}`,
        time: formatDateTime(),
        accountId: primaryAcc.id,
        type: 'KELUAR',
        amount: targetSale.totalRevenue,
        feeMargin: 0,
        description: `Batal (VOID) Transaksi POS #${saleId}`,
        relatedTrxId: saleId,
      };
      setMutations((prev) => [mut, ...prev]);
      const updatedAccounts = accounts.map((acc) =>
        acc.id === primaryAcc.id ? { ...acc, balance: acc.balance - targetSale.totalRevenue } : acc
      );
      setAccounts(updatedAccounts);
    }
    recordVersionChange(`Batal/VOID penjualan POS #${saleId}`, 'TRANSACTION');
  };

  const handleReprintPOS = (sale: PosSale) => {
    setReceiptPosSale(sale);
    const matchingTrx = transactions.find((t) => t.refNumber === sale.id || t.id === sale.id);
    if (matchingTrx) {
      setReceiptTrx({
        ...matchingTrx,
        cashReceived: sale.cashReceived ?? matchingTrx.cashReceived ?? sale.totalRevenue,
        changeAmount: sale.changeAmount ?? matchingTrx.changeAmount ?? 0,
      });
    } else {
      const itemsSummary = sale.items.map((it) => `${it.productName} (${it.qty}x)`).join(', ');
      const virtualTrx: Transaction = {
        id: sale.invoiceNumber || sale.id,
        time: sale.time,
        type: 'PEMBAYARAN',
        cust: sale.customerName || 'Pelanggan Kasir POS',
        target: 'Penjualan Barang Fisik / POS',
        nominal: sale.totalRevenue,
        feeCust: 0,
        feeAdmin: 0,
        status: sale.status === 'VOID' ? 'VOID' : 'SUCCESS',
        accountId: sale.accountId || 'acc1',
        notes: `POS #${sale.id}: ${itemsSummary}`,
        refNumber: sale.id,
        memberId: sale.memberId,
        memberNumber: sale.memberNumber,
        cashReceived: sale.cashReceived ?? sale.totalRevenue,
        changeAmount: sale.changeAmount ?? 0,
      };
      setReceiptTrx(virtualTrx);
    }
    setIsReceiptModalOpen(true);
  };

  const handleRegisterUser = (userData: Partial<AppUser>): { success: boolean; message: string; user?: AppUser } => {
    try {
      const trimmedUser = (userData.username || '').trim().toLowerCase();
      const trimmedName = (userData.name || '').trim();
      const trimmedPin = (userData.password || '').trim();

      if (!trimmedName || !trimmedUser || !trimmedPin) {
        return { success: false, message: 'Nama, username, dan kata sandi wajib diisi.' };
      }

      if (trimmedUser.length < 3) {
        return { success: false, message: 'Username minimal terdiri dari 3 karakter.' };
      }

      const isDuplicate = users.some((u) => u.username.toLowerCase() === trimmedUser);
      if (isDuplicate) {
        return { success: false, message: `Username "${trimmedUser}" sudah digunakan. Silakan pilih username lain.` };
      }

      const newUser: AppUser = {
        id: `usr_${trimmedUser}_${Date.now()}`,
        username: trimmedUser,
        name: trimmedName,
        password: trimmedPin,
        role: userData.role || 'Kasir',
        status: 'ACTIVE',
        phone: userData.phone ? userData.phone.trim() : '',
        notes: userData.notes ? userData.notes.trim() : 'Pengguna Baru Terdaftar',
        createdAt: formatDateTime(),
        lastLogin: '-',
      };

      // Provision isolated workspace for this newly registered user
      const freshWorkspace = createFreshUserData(newUser);
      saveUserStorageItem(trimmedUser, 'profile', freshWorkspace.profile);
      saveUserStorageItem(trimmedUser, 'accounts', freshWorkspace.accounts);
      saveUserStorageItem(trimmedUser, 'transactions', freshWorkspace.transactions);
      saveUserStorageItem(trimmedUser, 'products', freshWorkspace.products);
      saveUserStorageItem(trimmedUser, 'pos_sales', freshWorkspace.posSales);
      saveUserStorageItem(trimmedUser, 'stock_logs', freshWorkspace.stockLogs);
      saveUserStorageItem(trimmedUser, 'mutations', freshWorkspace.mutations);
      saveUserStorageItem(trimmedUser, 'members', freshWorkspace.members);
      saveUserStorageItem(trimmedUser, 'member_points', freshWorkspace.memberPoints);
      saveUserStorageItem(trimmedUser, 'member_rewards', freshWorkspace.memberRewards);
      saveUserStorageItem(trimmedUser, 'member_vouchers', freshWorkspace.voucherClaims);
      saveUserStorageItem(trimmedUser, 'point_settings', freshWorkspace.pointSettings);
      saveUserStorageItem(trimmedUser, 'printer_settings', freshWorkspace.printerSettings);

      setUsers((prev) => [...prev, newUser]);
      syncUserToSheets(newUser);
      recordVersionChange(`Registrasi pengguna baru & alokasi database: ${newUser.name} (${newUser.role})`, 'USER');
      return { success: true, message: 'Pendaftaran akun berhasil!', user: newUser };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Terjadi kesalahan saat mendaftar.' };
    }
  };

  // Cash Mutation Handler
  const handleSaveMutation = (mut: CashMutation) => {
    setMutations((prev) => [mut, ...prev]);

    // Update account balances
    const updatedAccounts = accounts.map((acc) => {
      if (mut.type === 'TRANSFER_INTERNAL') {
        if (acc.id === mut.accountId) {
          return { ...acc, balance: acc.balance - mut.amount };
        }
        if (acc.id === mut.toAccountId) {
          return { ...acc, balance: acc.balance + mut.amount };
        }
      } else if (acc.id === mut.accountId) {
        if (mut.type === 'MASUK') {
          return { ...acc, balance: acc.balance + mut.amount };
        }
        if (mut.type === 'KELUAR') {
          return { ...acc, balance: acc.balance - mut.amount };
        }
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    syncMutationToSheets(mut, updatedAccounts);
    recordVersionChange(`Mutasi kas ${mut.type} Rp ${mut.amount.toLocaleString('id-ID')} (${mut.description})`, 'ACCOUNT');
  };

  const handleUpdateProfile = (newProf: AgentProfile) => {
    setProfile(newProf);
    syncProfileToSheets(newProf);
    recordVersionChange(`Pembaruan profil outlet agen "${newProf.storeName}"`, 'SETTING');
  };

  const handleUpdatePrinterSettings = (newSet: PrinterSettings) => {
    setPrinterSettings(newSet);
    syncPrinterSettingsToSheets(newSet);
    recordVersionChange(`Pembaruan pengaturan printer struk thermal (${newSet.paperWidth})`, 'SETTING');
  };

  const handleExportCSV = () => {
    exportToCSV(transactions, accounts);
  };

  // If user is not logged in, render the login page
  if (!currentUser) {
    return (
      <LoginView
        profile={profile}
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onRegisterUser={handleRegisterUser}
      />
    );
  }

  return (
    <div className="text-slate-800 antialiased bg-slate-100 min-h-screen flex flex-col font-sans">
      {/* Top Header */}
      <Header
        profile={profile}
        currentRole={currentRole}
        setRole={handleRoleChange}
        toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenNewTrx={() => {
          setEditingTrx(null);
          setIsTrxModalOpen(true);
        }}
        onExportCSV={handleExportCSV}
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigateToSpreadsheet={() => setActiveTab('database-spreadsheet')}
      />

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          profile={profile}
          trxCount={transactions.length}
          posSalesCount={posSales.length}
          userCount={users.length}
          memberCount={members.length}
          currentUser={currentUser}
          currentRole={currentRole}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Active Security Threat Warning Banner */}
          <SecurityAlertBanner
            alert={activeThreatAlert}
            onDismiss={dismissActiveAlert}
          />

          {/* Strict Role Guard: Check if Kasir attempts to open Admin-only pages */}
          {currentRole === 'Kasir' &&
            [
              'dashboard',
              'arus-kas',
              'akun-kas',
              'hak-akses',
              'profil-agen',
              'database-spreadsheet',
              'backup-reset',
            ].includes(activeTab) && (
              <div className="bg-white p-8 rounded-2xl border border-amber-200 shadow-sm text-center max-w-xl mx-auto space-y-4 my-8">
                <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Akses Terbatas Khusus Admin (Owner)</h2>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Halaman ini memuat data finansial, rekening master, atau pengaturan sistem yang hanya dapat diakses oleh Administrator / Pemilik Toko.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('transaksi')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Menu Kasir (Transaksi)</span>
                  </button>
                </div>
              </div>
            )}

          {activeTab === 'transaksi' && (
            <TransaksiView
              transactions={transactions}
              accounts={accounts}
              currentRole={currentRole}
              onOpenNewTrx={() => {
                setEditingTrx(null);
                setIsTrxModalOpen(true);
              }}
              onEditTrx={(trx) => {
                setEditingTrx(trx);
                setIsTrxModalOpen(true);
              }}
              onViewReceipt={(trx) => {
                setReceiptTrx(trx);
                setIsReceiptModalOpen(true);
              }}
              onConfirmVoid={handleConfirmVoid}
              onNavigateToHistory={() => setActiveTab('riwayat-transaksi-agen')}
            />
          )}

          {activeTab === 'riwayat-transaksi-agen' && (
            <RiwayatTransaksiAgenView
              transactions={transactions}
              accounts={accounts}
              profile={profile}
              currentRole={currentRole}
              operatorName={currentUser?.name || 'Operator'}
              onOpenNewTrx={() => {
                setEditingTrx(null);
                setIsTrxModalOpen(true);
              }}
              onEditTrx={(trx) => {
                setEditingTrx(trx);
                setIsTrxModalOpen(true);
              }}
              onViewReceipt={(trx) => {
                setReceiptTrx(trx);
                setIsReceiptModalOpen(true);
              }}
              onConfirmVoid={handleConfirmVoid}
              onNavigateToInputTrx={() => setActiveTab('transaksi')}
            />
          )}

          {activeTab === 'member-pelanggan' && (
            <MemberPelangganView
              members={members}
              pointLogs={memberPoints}
              pointHistory={memberPoints}
              rewards={memberRewards}
              voucherClaims={voucherClaims}
              pointSettings={pointSettings}
              transactions={transactions}
              posSales={posSales}
              profile={profile}
              currentRole={currentRole}
              onOpenAddMember={() => {
                setEditingMember(null);
                setIsMemberFormOpen(true);
              }}
              onOpenNewMember={() => {
                setEditingMember(null);
                setIsMemberFormOpen(true);
              }}
              onEditMember={(m) => {
                setEditingMember(m);
                setIsMemberFormOpen(true);
              }}
              onDeleteMember={handleDeleteMember}
              onOpenCardModal={(m) => {
                setSelectedCardMember(m);
                setIsMemberCardOpen(true);
              }}
              onViewCard={(m) => {
                setSelectedCardMember(m);
                setIsMemberCardOpen(true);
              }}
              onOpenDetailModal={(m) => {
                setSelectedDetailMember(m);
                setIsMemberDetailOpen(true);
              }}
              onViewDetail={(m) => {
                setSelectedDetailMember(m);
                setIsMemberDetailOpen(true);
              }}
              onOpenAddReward={() => {
                setEditingReward(null);
                setIsRewardModalOpen(true);
              }}
              onEditReward={(r) => {
                setEditingReward(r);
                setIsRewardModalOpen(true);
              }}
              onDeleteReward={handleDeleteReward}
              onOpenPointSettings={() => setIsPointSettingsModalOpen(true)}
              onOpenClaimModal={(m, r) => {
                setSelectedClaimMember(m);
                setSelectedClaimReward(r);
                setIsClaimModalOpen(true);
              }}
              onViewVoucherReceipt={(vch) => {
                setSelectedVoucherClaim(vch);
                setIsVoucherReceiptOpen(true);
              }}
              onToggleVoucherUsed={handleToggleVoucherUsed}
              onNavigateToTrx={() => setActiveTab('transaksi')}
              onNavigateToPOS={() => setActiveTab('kasir-fisik')}
            />
          )}

          {activeTab === 'laporan-detail' && (
            <LaporanDetailView
              transactions={transactions}
              accounts={accounts}
              onExportCSV={handleExportCSV}
            />
          )}

          {activeTab === 'dashboard' && currentRole === 'Admin' && (
            <DashboardView
              transactions={transactions}
              accounts={accounts}
              products={products}
              posSales={posSales}
              onOpenNewTrx={() => {
                setEditingTrx(null);
                setIsTrxModalOpen(true);
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onViewReceipt={(trx) => {
                setReceiptTrx(trx);
                setIsReceiptModalOpen(true);
              }}
            />
          )}

          {activeTab === 'arus-kas' && currentRole === 'Admin' && (
            <ArusKasView
              transactions={transactions}
              accounts={accounts}
              mutations={mutations}
              onOpenNewMutation={() => setIsMutationModalOpen(true)}
            />
          )}

          {activeTab === 'akun-kas' && currentRole === 'Admin' && (
            <AkunKasView
              accounts={accounts}
              currentRole={currentRole}
              onOpenNewAccount={() => {
                setEditingAccount(null);
                setIsAccountModalOpen(true);
              }}
              onEditAccount={(acc) => {
                setEditingAccount(acc);
                setIsAccountModalOpen(true);
              }}
              onDeleteAccount={handleDeleteAccount}
            />
          )}

          {activeTab === 'kasir-fisik' && (
            <KasirFisikView
              products={products}
              members={members}
              pointSettings={pointSettings}
              activeVouchers={voucherClaims}
              currentRole={currentRole}
              operatorName={currentUser?.name || 'Kasir'}
              onOpenNewProduct={(initialBarcode) => {
                setEditingProduct(null);
                setInitialProductBarcode(typeof initialBarcode === 'string' ? initialBarcode : '');
                setIsProductModalOpen(true);
              }}
              onNavigateToStock={() => setActiveTab('stok-barang')}
              onNavigateToReport={() => setActiveTab('laporan-penjualan-fisik')}
              onNavigateToHistoryPos={() => setActiveTab('riwayat-transaksi-pos')}
              onCheckoutPOS={handleCheckoutPOS}
              onOpenRestock={(p) => {
                setSelectedRestockProduct(p);
                setIsRestockModalOpen(true);
              }}
            />
          )}

          {activeTab === 'riwayat-transaksi-pos' && (
            <RiwayatTransaksiPosView
              posSales={posSales}
              products={products}
              accounts={accounts}
              profile={profile}
              currentRole={currentRole}
              operatorName={currentUser?.name || 'Kasir'}
              onVoidSale={handleVoidPosSale}
              onReprintReceipt={handleReprintPOS}
              onNavigateToPOS={() => setActiveTab('kasir-fisik')}
            />
          )}

          {activeTab === 'stok-barang' && (
            <StokBarangView
              products={products}
              stockLogs={stockLogs}
              currentRole={currentRole}
              operatorName={currentUser?.name || 'Operator'}
              onOpenNewProduct={(initialBarcode) => {
                setEditingProduct(null);
                setInitialProductBarcode(typeof initialBarcode === 'string' ? initialBarcode : '');
                setIsProductModalOpen(true);
              }}
              onEditProduct={(p) => {
                setEditingProduct(p);
                setInitialProductBarcode('');
                setIsProductModalOpen(true);
              }}
              onDeleteProduct={handleDeleteProduct}
              onRestock={(p) => {
                setSelectedRestockProduct(p);
                setIsRestockModalOpen(true);
              }}
              onAdjustStock={(p) => {
                setSelectedAdjustProduct(p);
                setIsAdjustModalOpen(true);
              }}
              onNavigateToPOS={() => setActiveTab('kasir-fisik')}
            />
          )}

          {activeTab === 'laporan-penjualan-fisik' && (
            <LaporanPenjualanFisikView
              posSales={posSales}
              sales={posSales}
              products={products}
              currentRole={currentRole}
              operatorName={currentUser?.name || 'Kasir'}
              onVoidSale={handleVoidPosSale}
              onReprintReceipt={handleReprintPOS}
              onNavigateToPOS={() => setActiveTab('kasir-fisik')}
              onNavigateToStock={() => setActiveTab('stok-barang')}
            />
          )}

          {activeTab === 'hak-akses' && currentRole === 'Admin' && (
            <HakAksesView
              users={users}
              currentUser={currentUser}
              currentRole={currentRole}
              setRole={handleRoleChange}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onToggleUserStatus={handleToggleUserStatus}
              onSwitchActiveUser={handleSwitchActiveUser}
              onOpenCreateUserModal={(defaultRole) => {
                setEditingUser(null);
                setIsUserModalOpen(true);
              }}
              onOpenEditUserModal={(user) => {
                setEditingUser(user);
                setIsUserModalOpen(true);
              }}
            />
          )}

          {activeTab === 'profil-agen' && currentRole === 'Admin' && (
            <ProfilAgenView
              profile={profile}
              onSaveProfile={handleUpdateProfile}
            />
          )}

          {activeTab === 'setting-printer' && (
            <SettingPrinterView
              profile={profile}
              settings={printerSettings}
              onSaveSettings={handleUpdatePrinterSettings}
              onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)}
            />
          )}

          {activeTab === 'database-spreadsheet' && currentRole === 'Admin' && (
            <DatabaseSpreadsheetView
              transactions={transactions}
              accounts={accounts}
              mutations={mutations}
              products={products}
              posSales={posSales}
              stockLogs={stockLogs}
              users={users}
              profile={profile}
              printerSettings={printerSettings}
              currentRole={currentRole}
              onApplyDataFromSheets={handleApplyDataFromSheets}
            />
          )}

          {activeTab === 'backup-reset' && currentRole === 'Admin' && (
            <BackupResetView
              transactions={transactions}
              mutations={mutations}
              accounts={accounts}
              products={products}
              users={users}
              members={members}
              memberPoints={memberPoints}
              profile={profile}
              printerSettings={printerSettings}
              currentRole={currentRole}
              onRestoreData={handleRestoreData}
              onOpenResetModal={() => setIsResetModalOpen(true)}
            />
          )}

          {activeTab === 'tentang-sistem' && (
            <TentangSistemView
              profile={profile}
              currentUser={currentUser}
              currentRole={currentRole}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <ModalTrx
        isOpen={isTrxModalOpen}
        onClose={() => {
          setIsTrxModalOpen(false);
          setEditingTrx(null);
        }}
        onSave={handleSaveTrx}
        editingTrx={editingTrx}
        accounts={accounts}
        members={members}
        pointSettings={pointSettings}
        activeVouchers={voucherClaims}
      />

      <ModalReceipt
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptTrx(null);
          setReceiptPosSale(null);
        }}
        trx={receiptTrx}
        posSale={receiptPosSale}
        posSales={posSales}
        profile={profile}
        printerSettings={printerSettings}
        onOpenPrinterSettings={() => setActiveTab('setting-printer')}
      />

      <ModalConfirmVoid
        isOpen={isVoidModalOpen}
        onClose={() => {
          setIsVoidModalOpen(false);
          setVoidTrx(null);
        }}
        onConfirm={handleExecuteVoid}
        trx={voidTrx}
      />

      <ModalAccount
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSaveAccount}
        onDelete={handleDeleteAccount}
        editingAccount={editingAccount}
      />

      <ModalProduct
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
          setInitialProductBarcode('');
        }}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        editingProduct={editingProduct}
        initialBarcode={initialProductBarcode}
      />

      <ModalRestock
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false);
          setSelectedRestockProduct(null);
        }}
        onConfirmRestock={handleRestockProduct}
        product={selectedRestockProduct}
        products={products}
        operatorName={currentUser?.name || 'Operator'}
        onSelectProduct={(p) => setSelectedRestockProduct(p)}
      />

      <ModalAdjustStock
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedAdjustProduct(null);
        }}
        onConfirmAdjustment={handleAdjustStock}
        product={selectedAdjustProduct}
      />

      <ModalMutation
        isOpen={isMutationModalOpen}
        onClose={() => setIsMutationModalOpen(false)}
        onSave={handleSaveMutation}
        accounts={accounts}
      />

      <ModalUserAccount
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        editingUser={editingUser}
        existingUsers={users}
      />

      <ModalMemberForm
        isOpen={isMemberFormOpen}
        onClose={() => {
          setIsMemberFormOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
        editingMember={editingMember}
        existingMembersCount={members.length}
      />

      <ModalMemberCard
        isOpen={isMemberCardOpen}
        onClose={() => {
          setIsMemberCardOpen(false);
          setSelectedCardMember(null);
        }}
        member={selectedCardMember}
        profile={profile}
      />

      <ModalMemberDetail
        isOpen={isMemberDetailOpen}
        onClose={() => {
          setIsMemberDetailOpen(false);
          setSelectedDetailMember(null);
        }}
        member={selectedDetailMember}
        pointHistory={memberPoints}
        transactions={transactions}
        posSales={posSales}
        profile={profile}
        onOpenCardModal={(m) => {
          setSelectedCardMember(m);
          setIsMemberCardOpen(true);
        }}
        onOpenEditModal={(m) => {
          setEditingMember(m);
          setIsMemberFormOpen(true);
        }}
        onAdjustPoints={handleAdjustMemberPoints}
      />

      {/* Rewards, Points & Voucher Modals */}
      <ModalRewardForm
        isOpen={isRewardModalOpen}
        onClose={() => {
          setIsRewardModalOpen(false);
          setEditingReward(null);
        }}
        onSave={handleSaveReward}
        onDelete={handleDeleteReward}
        editingReward={editingReward}
      />

      <ModalPointSettings
        isOpen={isPointSettingsModalOpen}
        onClose={() => setIsPointSettingsModalOpen(false)}
        onSave={handleSavePointSettings}
        currentSettings={pointSettings}
      />

      <ModalClaimReward
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          setSelectedClaimMember(null);
          setSelectedClaimReward(null);
        }}
        onConfirmClaim={handleConfirmDirectClaim}
        members={members}
        rewards={memberRewards}
        member={selectedClaimMember}
        reward={selectedClaimReward}
        pointSettings={pointSettings}
      />

      <ModalVoucherReceipt
        isOpen={isVoucherReceiptOpen}
        onClose={() => {
          setIsVoucherReceiptOpen(false);
          setSelectedVoucherClaim(null);
        }}
        voucher={selectedVoucherClaim}
        profile={profile}
        printerSettings={printerSettings}
      />

      <ModalLogout
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        user={currentUser}
      />

      <ModalResetData
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleConfirmReset}
        onDownloadBackup={handleDownloadBackup}
        profile={profile}
        trxCount={transactions.length}
        mutationCount={mutations.length}
        productCount={products.length}
        userCount={users.length}
        memberCount={members.length}
      />
    </div>
  );
}
