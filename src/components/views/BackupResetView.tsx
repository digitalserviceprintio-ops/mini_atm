import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  FileSpreadsheet,
  FileJson,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardDrive,
  Layers,
  ArrowDownToLine,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';
import {
  Account,
  AgentProfile,
  AppUser,
  CashMutation,
  CustomerMember,
  MemberPointHistory,
  PrinterSettings,
  Product,
  Transaction,
  UserRole,
} from '../../types';
import { formatDateTime, formatRp } from '../../utils/formatters';
import { exportFullDatabaseToExcel, exportTransactionsToExcel } from '../../utils/excelExport';
import { downloadBackupJSON, parseBackupFile, AppBackupPayload } from '../../utils/backupService';

interface BackupResetViewProps {
  transactions: Transaction[];
  mutations: CashMutation[];
  accounts: Account[];
  products: Product[];
  users: AppUser[];
  members?: CustomerMember[];
  memberPoints?: MemberPointHistory[];
  profile: AgentProfile;
  printerSettings: PrinterSettings;
  currentRole: UserRole;
  onRestoreData: (backupPayload: AppBackupPayload) => void;
  onOpenResetModal: () => void;
}

export const BackupResetView: React.FC<BackupResetViewProps> = ({
  transactions,
  mutations,
  accounts,
  products,
  users,
  members = [],
  memberPoints = [],
  profile,
  printerSettings,
  currentRole,
  onRestoreData,
  onOpenResetModal,
}) => {
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [parsedRestoreData, setParsedRestoreData] = useState<AppBackupPayload | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('miniatm_last_backup_time') || null;
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDownloadJSON = () => {
    downloadBackupJSON({
      transactions,
      mutations,
      accounts,
      products,
      users,
      members,
      memberPoints,
      profile,
      printerSettings,
    });
    const nowStr = formatDateTime();
    setLastBackupTime(nowStr);
    localStorage.setItem('miniatm_last_backup_time', nowStr);
  };

  const handleDownloadFullExcel = () => {
    exportFullDatabaseToExcel(transactions, mutations, accounts, products, users, profile);
  };

  const handleDownloadTrxExcel = () => {
    exportTransactionsToExcel(transactions, accounts, profile);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    setParseError(null);
    setRestoreSuccessMsg(null);

    const result = await parseBackupFile(file);
    if (result.success && result.data) {
      setParsedRestoreData(result.data);
    } else {
      setParsedRestoreData(null);
      setParseError(result.error || 'Gagal memverifikasi berkas backup.');
    }
  };

  const handleExecuteRestore = () => {
    if (!parsedRestoreData) return;
    setIsRestoring(true);

    setTimeout(() => {
      onRestoreData(parsedRestoreData);
      setIsRestoring(false);
      setRestoreSuccessMsg('Database berhasil dipulihkan dari berkas backup!');
      setParsedRestoreData(null);
      setRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 700);
  };

  const totalKasBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  return (
    <section id="view-backup-reset" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#003366] via-blue-900 to-indigo-950 text-white p-6 rounded-2xl border border-blue-800/60 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600/80 rounded-2xl shadow-inner border border-blue-400/30">
            <Database className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Pusat Backup, Export Excel & Reset Data
              </h2>
              <span className="bg-blue-500/20 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                Aman & Terkendali
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-1 max-w-xl leading-relaxed">
              Amankan salinan database lokal Anda, ekspor format Microsoft Excel yang rapi, pulihkan riwayat data dari cadangan, atau lakukan reset dengan perlindungan konfirmasi berlapis.
            </p>
          </div>
        </div>

        {lastBackupTime && (
          <div className="bg-blue-950/70 border border-blue-700/50 p-3 rounded-xl flex items-center gap-2.5 text-xs text-blue-200 shrink-0">
            <Clock className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-blue-300 block">Backup Terakhir:</span>
              <strong className="text-white font-mono text-[11px]">{lastBackupTime}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Grid: 3 Main Operation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CARD 1: BACKUP & EXPORT EXCEL */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                <ArrowDownToLine className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">1. Backup & Export Excel</h3>
                <p className="text-[11px] text-slate-500">Download berkas lengkap ke perangkat</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Unduh salinan data seluruh sistem untuk cadangan offline atau analisis pembukuan di Microsoft Excel / Google Sheets:
            </p>

            <div className="space-y-2 pt-1">
              {/* Button Backup JSON */}
              <button
                type="button"
                onClick={handleDownloadJSON}
                className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl border border-blue-200 font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <FileJson className="w-4 h-4 text-blue-700" />
                  <span>Download Backup JSON (.json)</span>
                </div>
                <span className="text-[10px] bg-blue-700 text-white px-2 py-0.5 rounded-full font-sans">
                  Snapshot Full
                </span>
              </button>

              {/* Button Full Multi-Sheet Excel */}
              <button
                type="button"
                onClick={handleDownloadFullExcel}
                className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>Export Full Excel Multi-Sheet (.xlsx)</span>
                </div>
                <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-sans">
                  6 Sheet Rapi
                </span>
              </button>

              {/* Button Transaksi Excel Only */}
              <button
                type="button"
                onClick={handleDownloadTrxExcel}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 font-semibold text-xs flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                  <span>Export Data Transaksi Saja (.xlsx)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {transactions.length} Trx
                </span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Format Excel dibuat rapi dengan lebar kolom otomatis dan format mata uang.</span>
          </div>
        </div>

        {/* CARD 2: RESTORE DATA DARI BACKUP */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">2. Restore Database</h3>
                <p className="text-[11px] text-slate-500">Pulihkan data dari berkas JSON cadangan</p>
              </div>
            </div>

            {restoreSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{restoreSuccessMsg}</span>
              </div>
            )}

            {parseError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/70 p-4 rounded-xl text-center space-y-2 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="restoreFileInput"
              />
              <label
                htmlFor="restoreFileInput"
                className="cursor-pointer block space-y-1.5"
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-blue-700 block">
                  {restoreFile ? restoreFile.name : 'Pilih Berkas Backup (.json)'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Klik untuk menelusuri berkas dari komputer/ponsel
                </span>
              </label>
            </div>

            {/* Backup Preview Info if loaded */}
            {parsedRestoreData && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-2 text-xs">
                <span className="font-bold text-blue-900 block">
                  Informasi Berkas Backup:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700">
                  <span>Tanggal: <strong>{parsedRestoreData.backupDate || '-'}</strong></span>
                  <span>Versi: <strong>{parsedRestoreData.version || '2.0'}</strong></span>
                  <span>Transaksi: <strong>{parsedRestoreData.transactions?.length || 0}</strong></span>
                  <span>Member VIP: <strong>{parsedRestoreData.members?.length || 0}</strong></span>
                  <span>Riwayat Poin: <strong>{parsedRestoreData.memberPoints?.length || 0}</strong></span>
                  <span>Mutasi Kas: <strong>{parsedRestoreData.mutations?.length || 0}</strong></span>
                  <span>Akun Kas: <strong>{parsedRestoreData.accounts?.length || 0}</strong></span>
                  <span>Produk: <strong>{parsedRestoreData.products?.length || 0}</strong></span>
                  <span>Pengguna: <strong>{parsedRestoreData.users?.length || 0}</strong></span>
                  <span>Toko: <strong>{parsedRestoreData.profile?.storeName || '-'}</strong></span>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              disabled={!parsedRestoreData || isRestoring}
              onClick={handleExecuteRestore}
              className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isRestoring ? (
                <span>Memulihkan Data...</span>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Terapkan Pemulihan Database</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CARD 3: RESET DATA DENGAN WARNING */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 pb-3 border-b border-rose-100">
              <div className="p-2 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-rose-900">3. Reset & Hapus Data</h3>
                <p className="text-[11px] text-rose-600 font-medium">Pengaturan pembersihan bertahap</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs space-y-1.5">
              <span className="font-extrabold text-rose-900 block flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-700" />
                Proteksi Konfirmasi Ganda
              </span>
              <p className="text-rose-700 text-[11px] leading-relaxed">
                Pilih opsi reset: hanya riwayat transaksi & mutasi, kembali ke data demo awal, atau pengosongan total. Dilengkapi input kata kunci pengaman agar tidak terklik tanpa sengaja.
              </p>
            </div>

            <div className="space-y-2 pt-1 text-xs text-slate-600">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span>Total Transaksi Saat Ini:</span>
                <strong className="text-slate-900 font-mono">{transactions.length} record</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span>Total Mutasi Kas:</span>
                <strong className="text-slate-900 font-mono">{mutations.length} record</strong>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span>Total Akun Pengguna:</span>
                <strong className="text-slate-900 font-mono">{users.length} akun</strong>
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={onOpenResetModal}
              className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Buka Menu Reset Data...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h4 className="font-bold text-xs text-slate-800 mb-3 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-blue-700" />
          <span>Status Kapasitas Database Penyimpanan Lokal (Local Storage)</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Total Transaksi</span>
            <span className="text-base font-extrabold text-blue-900 font-mono">{transactions.length}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Total Saldo Kas & Bank</span>
            <span className="text-base font-extrabold text-emerald-700 font-mono">{formatRp(totalKasBalance)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Item Produk POS</span>
            <span className="text-base font-extrabold text-indigo-900 font-mono">{products.length}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Pengguna Terdaftar</span>
            <span className="text-base font-extrabold text-purple-900 font-mono">{users.length}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
