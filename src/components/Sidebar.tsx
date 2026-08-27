import React from 'react';
import {
  CreditCard,
  X,
  LayoutDashboard,
  ListOrdered,
  FileBarChart,
  ArrowLeftRight,
  Wallet,
  ShoppingCart,
  ShieldCheck,
  Store,
  Printer,
  ChevronDown,
  LogOut,
  FileSpreadsheet,
  Users,
  Database,
  Lock,
  UserCheck,
  RotateCcw,
  Package,
  TrendingUp,
} from 'lucide-react';
import { ActiveTab, AgentProfile, UserRole } from '../types';
import { AuthUser } from './views/LoginView';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  profile: AgentProfile;
  trxCount: number;
  userCount?: number;
  currentUser?: AuthUser | null;
  currentRole?: UserRole;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  profile,
  trxCount,
  userCount = 0,
  currentUser,
  currentRole = 'Admin',
  onLogout,
}) => {
  const effectiveRole: UserRole = currentUser?.role || currentRole;
  const isAdmin = effectiveRole === 'Admin';

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        id="sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#003366] text-white transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col justify-between shadow-xl lg:shadow-none select-none`}
      >
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Brand Heading */}
          <div className="flex items-center justify-between pb-3.5 border-b border-blue-900/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 rounded-lg shadow-xs">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-bold text-sm leading-tight text-white truncate">{profile.storeName}</h1>
                <p className="text-[10px] text-blue-200 font-medium truncate">Agen Link Bersama & Mini ATM</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-blue-200 hover:text-white p-1 rounded-md cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Role Badge Banner */}
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
              isAdmin
                ? 'bg-blue-900/70 border-blue-700/60 text-blue-100'
                : 'bg-amber-950/70 border-amber-800/60 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-blue-300 shrink-0" />
              ) : (
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="text-[10px] uppercase tracking-wider block font-bold text-white/70">
                  Peran Akun
                </span>
                <span className="font-extrabold text-xs">
                  {isAdmin ? 'ADMINISTRATOR (Owner)' : 'KASIR OPERATOR'}
                </span>
              </div>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                isAdmin ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
              }`}
            >
              {isAdmin ? 'Full' : 'Shift'}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs">
            {/* ADMIN ONLY: Dashboard Insights */}
            {isAdmin && (
              <button
                onClick={() => handleSelectTab('dashboard')}
                id="nav-dashboard"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-blue-100 hover:bg-blue-700/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-blue-300" />
                <span className="flex-1">Dashboard Insights</span>
              </button>
            )}

            {/* Submenu Transaksi & Kasir */}
            <div className="space-y-1 pt-2">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center justify-between">
                <span>{isAdmin ? 'TRANSAKSI & POS' : 'MENU KASIR'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
              </div>

              <button
                onClick={() => handleSelectTab('transaksi')}
                id="nav-transaksi"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left cursor-pointer ${
                  activeTab === 'transaksi'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-blue-100 hover:bg-blue-700/60'
                }`}
              >
                <ListOrdered className="w-4 h-4 text-blue-300" />
                <span className="flex-1">Daftar Transaksi Agen</span>
                <span className="bg-blue-900/90 text-blue-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  {trxCount}
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('kasir-fisik')}
                id="nav-kasir-fisik"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left cursor-pointer ${
                  activeTab === 'kasir-fisik'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-blue-100 hover:bg-blue-700/60'
                }`}
              >
                <ShoppingCart className="w-4 h-4 text-blue-300" />
                <span className="flex-1">Kasir POS (Jual Barang)</span>
              </button>

              <button
                onClick={() => handleSelectTab('stok-barang')}
                id="nav-stok-barang"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left cursor-pointer ${
                  activeTab === 'stok-barang'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-blue-100 hover:bg-blue-700/60'
                }`}
              >
                <Package className="w-4 h-4 text-amber-300" />
                <span className="flex-1">Stok Barang Fisik</span>
                <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                  Inventori
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('laporan-penjualan-fisik')}
                id="nav-laporan-penjualan-fisik"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left cursor-pointer ${
                  activeTab === 'laporan-penjualan-fisik'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-blue-100 hover:bg-blue-700/60'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-300" />
                <span className="flex-1">Laporan Penjualan & Laba</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  POS
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('laporan-detail')}
                id="nav-laporan-detail"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left cursor-pointer ${
                  activeTab === 'laporan-detail'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-blue-100 hover:bg-blue-700/60'
                }`}
              >
                <FileBarChart className="w-4 h-4 text-blue-300" />
                <span className="flex-1">
                  {isAdmin ? 'Laporan Detail & Grafik' : 'Laporan Transaksi Kasir'}
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('setting-printer')}
                id="nav-setting-printer"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left cursor-pointer ${
                  activeTab === 'setting-printer'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-blue-100 hover:bg-blue-700/60'
                }`}
              >
                <Printer className="w-4 h-4 text-blue-300" />
                <span className="flex-1">Setting Printer Thermal</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Cepat
                </span>
              </button>
            </div>

            {/* ADMIN ONLY: Keuangan & Master Mutasi */}
            {isAdmin && (
              <div className="space-y-1 pt-3">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center justify-between">
                  <span>KEUANGAN & ARUS KAS</span>
                  <span className="text-[9px] bg-blue-800 text-blue-200 px-1 py-0.2 rounded">Admin</span>
                </div>

                <button
                  onClick={() => handleSelectTab('arus-kas')}
                  id="nav-arus-kas"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left cursor-pointer ${
                    activeTab === 'arus-kas'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-blue-100 hover:bg-blue-700/60'
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4 text-blue-300" />
                  <span className="flex-1">Arus Kas & Mutasi</span>
                </button>

                <button
                  onClick={() => handleSelectTab('akun-kas')}
                  id="nav-akun-kas"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left cursor-pointer ${
                    activeTab === 'akun-kas'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-blue-100 hover:bg-blue-700/60'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-blue-300" />
                  <span className="flex-1">Akun Kas / Rekening</span>
                </button>
              </div>
            )}

            {/* ADMIN ONLY: Pengaturan & Master Data */}
            {isAdmin && (
              <div className="space-y-1 pt-3">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center justify-between">
                  <span>PENGATURAN OWNER (ADMIN)</span>
                </div>

                <button
                  onClick={() => handleSelectTab('hak-akses')}
                  id="nav-hak-akses"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left cursor-pointer ${
                    activeTab === 'hak-akses'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-blue-100 hover:bg-blue-700/60'
                  }`}
                >
                  <Users className="w-4 h-4 text-blue-300" />
                  <span className="flex-1">Akun Admin & Kasir</span>
                  {userCount > 0 && (
                    <span className="bg-blue-900/90 text-blue-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {userCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleSelectTab('profil-agen')}
                  id="nav-profil-agen"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left cursor-pointer ${
                    activeTab === 'profil-agen'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-blue-100 hover:bg-blue-700/60'
                  }`}
                >
                  <Store className="w-4 h-4 text-blue-300" />
                  <span className="flex-1">Setting Profil Agen</span>
                </button>

                <button
                  onClick={() => handleSelectTab('database-spreadsheet')}
                  id="nav-database-spreadsheet"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left cursor-pointer ${
                    activeTab === 'database-spreadsheet'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-blue-100 hover:bg-blue-700/60'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="flex-1">Database Spreadsheet</span>
                  <span className="bg-blue-900/60 text-blue-200 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-400/30">
                    GAS
                  </span>
                </button>

                <button
                  onClick={() => handleSelectTab('backup-reset')}
                  id="nav-backup-reset"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-medium text-left cursor-pointer ${
                    activeTab === 'backup-reset'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-blue-100 hover:bg-blue-700/60'
                  }`}
                >
                  <Database className="w-4 h-4 text-amber-300" />
                  <span className="flex-1">Backup & Reset Data</span>
                </button>
              </div>
            )}

            {/* FOR KASIR: Information notice regarding Admin features */}
            {!isAdmin && (
              <div className="pt-3">
                <div className="bg-blue-950/60 border border-blue-800/40 rounded-xl p-3 space-y-1.5 text-[11px] text-blue-200/80">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-200">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fitur Terkunci</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-300">
                    Menu Dashboard analitik, Rekening, Arus Kas, Manajemen Akun, dan Database dikelola oleh <strong>Admin/Owner</strong>.
                  </p>
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Footer Sidebar Status & Active User with Logout */}
        <div className="p-3.5 border-t border-blue-900/80 bg-[#002244]/80 space-y-3">
          {currentUser && (
            <div className="flex items-center justify-between bg-blue-950/60 p-2 rounded-xl border border-blue-800/40">
              <div className="overflow-hidden pr-2">
                <span className="text-[11px] font-bold text-white block truncate leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-blue-300 font-medium">
                  Role: {currentUser.role}
                </span>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Keluar dari sesi"
                  className="p-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] text-blue-200 font-medium">Sistem Online</span>
            </div>
            <span className="text-[10px] text-blue-400 font-mono">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};


