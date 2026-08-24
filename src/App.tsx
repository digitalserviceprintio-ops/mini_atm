import React, { useState, useEffect } from 'react';
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
} from './types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_AGENT_PROFILE,
  INITIAL_PRINTER_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_TRANSACTIONS,
  INITIAL_USERS,
} from './data/initialData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginView, AuthUser } from './components/views/LoginView';
import { TransaksiView } from './components/views/TransaksiView';
import { LaporanDetailView } from './components/views/LaporanDetailView';
import { DashboardView } from './components/views/DashboardView';
import { ArusKasView } from './components/views/ArusKasView';
import { AkunKasView } from './components/views/AkunKasView';
import { KasirFisikView } from './components/views/KasirFisikView';
import { HakAksesView } from './components/views/HakAksesView';
import { ProfilAgenView } from './components/views/ProfilAgenView';
import { SettingPrinterView } from './components/views/SettingPrinterView';
import { DatabaseSpreadsheetView } from './components/views/DatabaseSpreadsheetView';
import { ModalTrx } from './components/modals/ModalTrx';
import { ModalReceipt } from './components/modals/ModalReceipt';
import { ModalConfirmVoid } from './components/modals/ModalConfirmVoid';
import { ModalAccount } from './components/modals/ModalAccount';
import { ModalProduct } from './components/modals/ModalProduct';
import { ModalMutation } from './components/modals/ModalMutation';
import { ModalUserAccount } from './components/modals/ModalUserAccount';
import { ModalLogout } from './components/modals/ModalLogout';
import { exportToCSV, formatDateTime } from './utils/formatters';
import {
  getGasUrl,
  fetchInitialDataFromSheets,
  syncTransactionToSheets,
  syncVoidToSheets,
  syncMutationToSheets,
  syncAccountToSheets,
  syncDeleteAccountToSheets,
  syncProductToSheets,
  syncCheckoutPOSToSheets,
  syncUserToSheets,
  syncDeleteUserToSheets,
  syncProfileToSheets,
  syncPrinterSettingsToSheets,
  AppSyncData,
} from './utils/googleSheetsService';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem('miniatm_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Persistence state with LocalStorage
  const [profile, setProfile] = useState<AgentProfile>(() => {
    const saved = localStorage.getItem('miniatm_profile');
    return saved ? JSON.parse(saved) : INITIAL_AGENT_PROFILE;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('miniatm_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('miniatm_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('miniatm_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('miniatm_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [mutations, setMutations] = useState<CashMutation[]>(() => {
    const saved = localStorage.getItem('miniatm_mutations');
    return saved ? JSON.parse(saved) : [];
  });

  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(() => {
    const saved = localStorage.getItem('miniatm_printer_settings');
    return saved ? JSON.parse(saved) : INITIAL_PRINTER_SETTINGS;
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

  const [isVoidModalOpen, setIsVoidModalOpen] = useState<boolean>(false);
  const [voidTrx, setVoidTrx] = useState<Transaction | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const [isMutationModalOpen, setIsMutationModalOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

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

  // Sync authentication & data to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('miniatm_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('miniatm_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('miniatm_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('miniatm_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('miniatm_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('miniatm_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('miniatm_mutations', JSON.stringify(mutations));
  }, [mutations]);

  useEffect(() => {
    localStorage.setItem('miniatm_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('miniatm_printer_settings', JSON.stringify(printerSettings));
  }, [printerSettings]);

  useEffect(() => {
    localStorage.setItem('miniatm_role', currentRole);
  }, [currentRole]);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
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
      const newUser: AppUser = {
        id: `usr_${Date.now()}`,
        username: (userData.username || '').trim().toLowerCase(),
        name: (userData.name || '').trim(),
        password: userData.password || '123456',
        role: userData.role || 'Kasir',
        phone: userData.phone || '',
        status: userData.status || 'ACTIVE',
        createdAt: formatDateTime(),
        notes: userData.notes || '',
        lastLogin: '-',
      };
      setUsers((prev) => [...prev, newUser]);
      syncUserToSheets(newUser);
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    syncDeleteUserToSheets(userId);
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
    if (user.role === 'Kasir') {
      setActiveTab('transaksi');
    }
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
      };

      setTransactions((prev) => [newTrx, ...prev]);

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
      if (editingAccount?.id === id) {
        setIsAccountModalOpen(false);
        setEditingAccount(null);
      }
    }
  };

  // Product POS Handlers
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
        }
        return next;
      });
    } else {
      const newProd: Product = {
        id: `P0${products.length + 1}`,
        name: prodData.name || 'Produk Baru',
        price: prodData.price || 0,
        stock: prodData.stock || 0,
        category: prodData.category || 'Pulsa/Paket',
      };
      setProducts((prev) => [...prev, newProd]);
      syncProductToSheets(newProd);
    }
  };

  // Checkout POS action
  const handleCheckoutPOS = (cart: CartItem[], total: number) => {
    // 1. Deduct stock for each purchased item
    const updatedProducts = products.map((prod) => {
      const item = cart.find((c) => c.id === prod.id);
      if (item) {
        return { ...prod, stock: Math.max(0, prod.stock - item.qty) };
      }
      return prod;
    });
    setProducts(updatedProducts);

    const itemsSummary = cart.map((c) => `${c.name} (${c.qty}x)`).join(', ');

    // 2. Add as transaction
    const newTrx: Transaction = {
      id: `TRX-${transactions.length + 101}`,
      time: formatDateTime(),
      type: 'PEMBAYARAN',
      cust: 'Pelanggan Kasir POS',
      target: 'Penjualan Barang / Pulsa',
      nominal: total,
      feeCust: 0,
      feeAdmin: 0,
      status: 'SUCCESS',
      accountId: accounts[0]?.id || 'acc1',
      notes: `POS: ${itemsSummary}`,
      refNumber: `POS-${Date.now().toString().slice(-6)}`,
    };

    setTransactions((prev) => [newTrx, ...prev]);

    // 3. Add to account balance
    const updatedAccounts = accounts.map((acc) =>
      acc.id === newTrx.accountId ? { ...acc, balance: acc.balance + total } : acc
    );
    setAccounts(updatedAccounts);

    // 4. Create POS cash mutation
    const posMut: CashMutation = {
      id: `MUT-${Date.now()}`,
      time: newTrx.time,
      accountId: newTrx.accountId,
      type: 'MASUK',
      amount: total,
      feeMargin: total,
      description: `Penjualan Kasir POS #${newTrx.id} (${itemsSummary})`,
      relatedTrxId: newTrx.id,
    };
    setMutations((prev) => [posMut, ...prev]);

    // 5. Auto-sync to Google Sheets (Products, Transactions, Accounts, and Mutations)
    syncCheckoutPOSToSheets(updatedProducts, newTrx, updatedAccounts, posMut);

    // 6. Open receipt modal
    setReceiptTrx(newTrx);
    setIsReceiptModalOpen(true);
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
  };

  const handleUpdateProfile = (newProf: AgentProfile) => {
    setProfile(newProf);
    syncProfileToSheets(newProf);
  };

  const handleUpdatePrinterSettings = (newSet: PrinterSettings) => {
    setPrinterSettings(newSet);
    syncPrinterSettingsToSheets(newSet);
  };

  const handleExportCSV = () => {
    exportToCSV(transactions, accounts);
  };

  // If user is not logged in, render the login page
  if (!currentUser) {
    return <LoginView profile={profile} users={users} onLoginSuccess={handleLoginSuccess} />;
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
          userCount={users.length}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
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
            />
          )}

          {activeTab === 'laporan-detail' && (
            <LaporanDetailView
              transactions={transactions}
              accounts={accounts}
              onExportCSV={handleExportCSV}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              accounts={accounts}
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

          {activeTab === 'arus-kas' && (
            <ArusKasView
              transactions={transactions}
              accounts={accounts}
              mutations={mutations}
              onOpenNewMutation={() => setIsMutationModalOpen(true)}
            />
          )}

          {activeTab === 'akun-kas' && (
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
              currentRole={currentRole}
              onOpenNewProduct={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onCheckoutPOS={handleCheckoutPOS}
            />
          )}

          {activeTab === 'hak-akses' && (
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

          {activeTab === 'profil-agen' && (
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

          {activeTab === 'database-spreadsheet' && (
            <DatabaseSpreadsheetView
              transactions={transactions}
              accounts={accounts}
              mutations={mutations}
              products={products}
              users={users}
              profile={profile}
              printerSettings={printerSettings}
              currentRole={currentRole}
              onApplyDataFromSheets={handleApplyDataFromSheets}
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
      />

      <ModalReceipt
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptTrx(null);
        }}
        trx={receiptTrx}
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
        }}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
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

      <ModalLogout
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        user={currentUser}
      />
    </div>
  );
}
