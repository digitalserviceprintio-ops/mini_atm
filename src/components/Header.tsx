import React, { useState, useEffect } from 'react';
import {
  Menu,
  ChevronRight,
  FileSpreadsheet,
  PlusCircle,
  Calendar,
  ShieldCheck,
  UserCheck,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { AgentProfile, UserRole } from '../types';
import { AuthUser } from './views/LoginView';
import { subscribeSyncState, SyncState } from '../utils/googleSheetsService';

interface HeaderProps {
  profile: AgentProfile;
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  toggleSidebar: () => void;
  onOpenNewTrx: () => void;
  onExportCSV: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onNavigateToSpreadsheet?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  currentRole,
  setRole,
  toggleSidebar,
  onOpenNewTrx,
  onExportCSV,
  currentUser,
  onLogout,
  onNavigateToSpreadsheet,
}) => {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'unconfigured',
    lastSyncedAt: null,
    spreadsheetName: null,
    spreadsheetUrl: null,
    errorMessage: null,
    pendingCount: 0,
  });

  useEffect(() => {
    const unsubscribe = subscribeSyncState((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  const initials = currentUser?.avatarInitials || (profile.ownerName
    ? profile.ownerName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'CS');

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-2.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          id="mobileMenuBtn"
          onClick={toggleSidebar}
          className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs overflow-hidden border border-blue-600 shadow-xs">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-slate-800 text-xs leading-tight">
              {currentUser?.name || profile.ownerName}
            </span>
            <span className="text-[10px] text-slate-500">{profile.storeName}</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Role Selector Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold px-2 text-slate-500 hidden md:inline">Mode Akses:</span>
          <button
            onClick={() => setRole('Admin')}
            id="btnRoleAdmin"
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              currentRole === 'Admin'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => setRole('Kasir')}
            id="btnRoleKasir"
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              currentRole === 'Kasir'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Kasir</span>
          </button>
        </div>

        {/* Google Sheets Backend Sync Indicator */}
        <button
          onClick={onNavigateToSpreadsheet}
          id="btnHeaderGasSync"
          title={
            syncState.status === 'synced'
              ? `Tersambung ke Google Sheet: ${syncState.spreadsheetName || 'Aktif'} (Terakhir sync: ${syncState.lastSyncedAt || 'baru saja'})`
              : syncState.status === 'syncing'
              ? 'Sedang menyinkronkan data ke Google Spreadsheet...'
              : syncState.status === 'error'
              ? `Koneksi Google Apps Script terganggu: ${syncState.errorMessage || ''}`
              : 'Klik untuk menghubungkan Google Apps Script (Spreadsheet Backend)'
          }
          className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            syncState.status === 'synced'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              : syncState.status === 'syncing'
              ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
              : syncState.status === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
              : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {syncState.status === 'synced' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : syncState.status === 'syncing' ? (
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
          ) : syncState.status === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          ) : (
            <Database className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )}
          <span className="hidden sm:inline font-semibold">
            {syncState.status === 'synced'
              ? 'Sheets Aktif'
              : syncState.status === 'syncing'
              ? 'Syncing...'
              : syncState.status === 'error'
              ? 'Sync Error'
              : 'Hubungkan Sheets'}
          </span>
        </button>

        {/* Quick New Trx Action */}
        <button
          onClick={onOpenNewTrx}
          className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Transaksi Baru</span>
        </button>

        {/* Export Excel / CSV */}
        {currentRole === 'Admin' && (
          <button
            onClick={onExportCSV}
            title="Download file spreadsheet Excel (.CSV)"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden md:inline">Export Excel</span>
          </button>
        )}

        {/* Live Date Badge */}
        <div className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono hidden lg:flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{todayStr}</span>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Keluar dari akun (Logout)"
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};

