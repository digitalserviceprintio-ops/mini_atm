import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  UploadCloud,
  DownloadCloud,
  Database,
  Layers,
  Sparkles,
  HelpCircle,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Activity,
  Code2,
} from 'lucide-react';
import {
  Account,
  AgentProfile,
  CashMutation,
  PrinterSettings,
  Product,
  Transaction,
  UserRole,
} from '../../types';
import {
  getGasUrl,
  setGasUrl,
  testGasConnection,
  fetchInitialDataFromSheets,
  syncAllToSheets,
  subscribeSyncState,
  SyncState,
  AppSyncData,
} from '../../utils/googleSheetsService';
import { GOOGLE_APPS_SCRIPT_CODE } from '../../utils/gasScriptTemplate';

interface DatabaseSpreadsheetViewProps {
  transactions: Transaction[];
  accounts: Account[];
  mutations: CashMutation[];
  products: Product[];
  profile: AgentProfile;
  printerSettings: PrinterSettings;
  currentRole: UserRole;
  onApplyDataFromSheets: (data: AppSyncData) => void;
}

export const DatabaseSpreadsheetView: React.FC<DatabaseSpreadsheetViewProps> = ({
  transactions,
  accounts,
  mutations,
  products,
  profile,
  printerSettings,
  currentRole,
  onApplyDataFromSheets,
}) => {
  const [urlInput, setUrlInput] = useState<string>('');
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'unconfigured',
    lastSyncedAt: null,
    spreadsheetName: null,
    spreadsheetUrl: null,
    errorMessage: null,
    pendingCount: 0,
  });

  const [isLoadingTest, setIsLoadingTest] = useState<boolean>(false);
  const [isLoadingFetch, setIsLoadingFetch] = useState<boolean>(false);
  const [isLoadingPush, setIsLoadingPush] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'transaksi' | 'akun' | 'produk' | 'mutasi' | 'code'>('transaksi');

  useEffect(() => {
    setUrlInput(getGasUrl());
    const unsubscribe = subscribeSyncState((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  const handleTestAndSave = async () => {
    if (!urlInput.trim()) {
      setFeedbackMsg({
        type: 'error',
        text: 'Harap masukkan URL Google Apps Script Web App terlebih dahulu.',
      });
      return;
    }

    setIsLoadingTest(true);
    setFeedbackMsg(null);

    const res = await testGasConnection(urlInput.trim());
    setIsLoadingTest(false);

    if (res.success) {
      setGasUrl(urlInput.trim(), res.spreadsheetName, res.spreadsheetUrl);
      setFeedbackMsg({
        type: 'success',
        text: `Tersambung ke Spreadsheet "${res.spreadsheetName || 'Google Sheets'}"! Konfigurasi tersimpan.`,
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.message || 'Gagal terhubung ke Google Apps Script.',
      });
    }
  };

  const handleFetchFromSheets = async () => {
    if (!urlInput.trim()) {
      setFeedbackMsg({
        type: 'error',
        text: 'Masukkan URL Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setIsLoadingFetch(true);
    setFeedbackMsg(null);

    const res = await fetchInitialDataFromSheets(urlInput.trim());
    setIsLoadingFetch(false);

    if (res.success && res.data) {
      onApplyDataFromSheets(res.data);
      setGasUrl(urlInput.trim(), res.spreadsheetName, res.spreadsheetUrl);
      setFeedbackMsg({
        type: 'success',
        text: `Berhasil menginisialisasi menu & data dari Spreadsheet! (${res.data.transactions?.length || 0} transaksi, ${res.data.accounts?.length || 0} akun kas, ${res.data.products?.length || 0} produk).`,
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.message || 'Gagal memuat data dari Spreadsheet.',
      });
    }
  };

  const handlePushAllToSheets = async () => {
    if (!urlInput.trim()) {
      setFeedbackMsg({
        type: 'error',
        text: 'Masukkan URL Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setIsLoadingPush(true);
    setFeedbackMsg(null);

    const res = await syncAllToSheets({
      transactions,
      accounts,
      mutations,
      products,
      profile,
      printerSettings,
    });
    setIsLoadingPush(false);

    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: 'Seluruh data aplikasi saat ini berhasil dikirim dan tersimpan di Google Spreadsheet!',
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.message || 'Gagal sinkronisasi data ke Spreadsheet.',
      });
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Yakin ingin memutuskan koneksi Google Apps Script? Data lokal tetap tersimpan di browser.')) {
      setGasUrl('');
      setUrlInput('');
      setFeedbackMsg({
        type: 'success',
        text: 'Koneksi Google Apps Script berhasil diputuskan.',
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const isConnected = !!getGasUrl() && syncState.status !== 'unconfigured';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#003366] via-[#004080] to-[#0055A5] rounded-2xl p-6 text-white shadow-md border border-blue-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Backend Google Sheets (Apps Script)
              </span>
              {isConnected && (
                <span className="bg-blue-400/20 text-blue-200 border border-blue-300/30 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Auto-Sync Real-time Aktif
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Pusat Data & Sinkronisasi Spreadsheet
            </h1>
            <p className="text-sm text-blue-100/90 max-w-3xl leading-relaxed">
              Seluruh transaksi, akun kas, mutasi, produk kasir, dan profil agen otomatis tersimpan secara real-time ke Google Spreadsheet via Google Apps Script Web App.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {syncState.spreadsheetUrl && (
              <a
                href={syncState.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka Spreadsheet
              </a>
            )}
            <button
              onClick={handleCopyCode}
              className="bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Tersalin!' : 'Salin Kode Script (Code.gs)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">{feedbackMsg.text}</div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Configuration Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Koneksi Google Apps Script Web App
              </h2>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    syncState.status === 'synced'
                      ? 'bg-emerald-500'
                      : syncState.status === 'syncing'
                      ? 'bg-amber-500 animate-ping'
                      : syncState.status === 'error'
                      ? 'bg-rose-500'
                      : 'bg-slate-300'
                  }`}
                />
                <span className="text-xs font-semibold text-slate-600">
                  {syncState.status === 'synced'
                    ? 'Terhubung'
                    : syncState.status === 'syncing'
                    ? 'Menyimpan...'
                    : syncState.status === 'error'
                    ? 'Koneksi Terganggu'
                    : 'Belum Terhubung'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="gasUrlInput" className="block text-xs font-bold text-slate-700">
                Web App URL (Hasil Deploy Google Apps Script):
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="gasUrlInput"
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleTestAndSave}
                  disabled={isLoadingTest}
                  className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                >
                  {isLoadingTest ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Uji & Simpan</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                URL diperoleh setelah melakukan <strong>Deploy &gt; New deployment &gt; Web app</strong> pada Google Sheets Anda.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2.5 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleFetchFromSheets}
                  disabled={isLoadingFetch || !urlInput.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isLoadingFetch ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <DownloadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>Tarik & Inisialisasi Data dari Spreadsheet</span>
                </button>

                {currentRole === 'Admin' && (
                  <button
                    type="button"
                    onClick={handlePushAllToSheets}
                    disabled={isLoadingPush || !urlInput.trim()}
                    className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {isLoadingPush ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>Kirim Seluruh Data ke Spreadsheet</span>
                  </button>
                )}
              </div>

              {isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2.5 py-2 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Putuskan Koneksi</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics of Synced Data */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Total Transaksi</span>
              <div className="text-lg font-bold text-slate-800 mt-1 flex items-baseline gap-1">
                <span>{transactions.length}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">baris</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Akun Kas / Bank</span>
              <div className="text-lg font-bold text-blue-700 mt-1 flex items-baseline gap-1">
                <span>{accounts.length}</span>
                <span className="text-[10px] text-slate-500 font-semibold">rekening</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Produk Kasir POS</span>
              <div className="text-lg font-bold text-amber-700 mt-1 flex items-baseline gap-1">
                <span>{products.length}</span>
                <span className="text-[10px] text-slate-500 font-semibold">item</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Riwayat Mutasi</span>
              <div className="text-lg font-bold text-cyan-700 mt-1 flex items-baseline gap-1">
                <span>{mutations.length}</span>
                <span className="text-[10px] text-slate-500 font-semibold">catatan</span>
              </div>
            </div>
          </div>

          {/* Tabbed Data Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('transaksi')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activePreviewTab === 'transaksi'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Sheet Transaksi ({transactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('akun')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activePreviewTab === 'akun'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Sheet AkunKas ({accounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('produk')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activePreviewTab === 'produk'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Sheet Produk ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('mutasi')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activePreviewTab === 'mutasi'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Sheet MutasiKas ({mutations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('code')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    activePreviewTab === 'code'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 inline mr-1" />
                  Lihat Kode Script
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-mono">
                {syncState.lastSyncedAt ? `Terakhir sync: ${syncState.lastSyncedAt}` : 'Otomatis tersimpan'}
              </span>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto">
              {activePreviewTab === 'transaksi' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">ID TRX</th>
                        <th className="py-2 px-3">Waktu</th>
                        <th className="py-2 px-3">Layanan</th>
                        <th className="py-2 px-3">Pelanggan</th>
                        <th className="py-2 px-3 text-right">Nominal</th>
                        <th className="py-2 px-3 text-right">Admin / Fee</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.slice(0, 8).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 font-mono text-[11px]">
                          <td className="py-2 px-3 font-bold text-blue-700">{t.id}</td>
                          <td className="py-2 px-3 text-slate-600">{t.time}</td>
                          <td className="py-2 px-3 font-sans font-semibold text-slate-800">{t.type}</td>
                          <td className="py-2 px-3 font-sans text-slate-700">{t.cust}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            Rp {t.nominal.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-right text-emerald-600 font-bold">
                            +Rp {(t.feeCust - t.feeAdmin).toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                t.status === 'SUCCESS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400 font-sans">
                            Belum ada riwayat transaksi tersimpan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activePreviewTab === 'akun' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">ID Akun</th>
                        <th className="py-2 px-3">Nama Akun</th>
                        <th className="py-2 px-3">Tipe</th>
                        <th className="py-2 px-3">No Rekening / Info</th>
                        <th className="py-2 px-3 text-right">Saldo Saat Ini</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accounts.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50 font-mono text-[11px]">
                          <td className="py-2 px-3 text-slate-500">{a.id}</td>
                          <td className="py-2 px-3 font-sans font-bold text-slate-800">{a.name}</td>
                          <td className="py-2 px-3 font-sans text-blue-700 font-semibold">{a.type}</td>
                          <td className="py-2 px-3 text-slate-600">{a.accountNumber || a.bankName || '-'}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">
                            Rp {a.balance.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activePreviewTab === 'produk' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">ID</th>
                        <th className="py-2 px-3">Nama Produk</th>
                        <th className="py-2 px-3">Kategori</th>
                        <th className="py-2 px-3 text-right">Harga Jual</th>
                        <th className="py-2 px-3 text-center">Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 font-mono text-[11px]">
                          <td className="py-2 px-3 text-slate-500">{p.id}</td>
                          <td className="py-2 px-3 font-sans font-bold text-slate-800">{p.name}</td>
                          <td className="py-2 px-3 font-sans text-slate-600">{p.category || 'Umum'}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            Rp {p.price.toLocaleString('id-ID')}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                p.stock <= 5
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {p.stock}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activePreviewTab === 'mutasi' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Waktu</th>
                        <th className="py-2 px-3">Jenis</th>
                        <th className="py-2 px-3">Keterangan</th>
                        <th className="py-2 px-3 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mutations.slice(0, 8).map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 font-mono text-[11px]">
                          <td className="py-2 px-3 text-slate-500">{m.time}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.type === 'MASUK'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : m.type === 'KELUAR'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {m.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-700">{m.description}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            Rp {m.amount.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                      {mutations.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400 font-sans">
                            Belum ada catatan mutasi kas tersimpan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activePreviewTab === 'code' && (
                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed max-h-64">
                    {GOOGLE_APPS_SCRIPT_CODE}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Tersalin' : 'Salin Kode'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Setup Guide */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              Panduan 5 Langkah Mudah Setup
            </h2>

            <ol className="space-y-3.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-800 block">Buat Google Sheets Baru</strong>
                  Buka peramban dan kunjungi{' '}
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline font-semibold"
                  >
                    sheets.new
                  </a>
                  . Beri nama spreadsheet Anda (misal: <em>Database Mini ATM BRILink</em>).
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-800 block">Buka Script Editor</strong>
                  Di menu atas Google Sheets, klik menu <strong>Ekstensi</strong> &gt;{' '}
                  <strong>Apps Script</strong>.
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-800 block">Tempelkan Kode Script</strong>
                  Hapus semua isi bawaan pada file <code>Code.gs</code>, lalu klik tombol{' '}
                  <button
                    onClick={handleCopyCode}
                    className="text-blue-700 underline font-bold inline cursor-pointer"
                  >
                    Salin Kode Script
                  </button>{' '}
                  dan tempelkan di editor. Tekan tombol Simpan (ikon disket / Ctrl+S).
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-slate-800 block">Deploy sebagai Web App</strong>
                  Klik tombol <strong>Deploy (Terapkan)</strong> &gt;{' '}
                  <strong>New deployment (Penerapan baru)</strong>:
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500 pl-1">
                    <li>Pilih jenis: <strong>Web app</strong></li>
                    <li>Execute as: <strong>Me (Akun Anda)</strong></li>
                    <li>Who has access: <strong className="text-amber-700">Anyone (Siapa saja)</strong></li>
                  </ul>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  5
                </span>
                <div>
                  <strong className="text-slate-800 block">Salin Web App URL</strong>
                  Salin tautan URL yang berakhiran <code>/exec</code>, lalu tempelkan pada kolom di atas dan klik{' '}
                  <strong>Uji & Simpan</strong>.
                </div>
              </li>
            </ol>
          </div>

          {/* Keunggulan Fitur Backend Spreadsheet */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl border border-blue-100 p-4 space-y-3">
            <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Keuntungan Integrasi Google Apps Script
            </h3>
            <ul className="space-y-2 text-[11px] text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Data Terpusat & Permanen:</strong> Aman dari riwayat browser yang terhapus atau pergantian perangkat kasir.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Inisialisasi Otomatis:</strong> Saat aplikasi dibuka di HP / Laptop lain, data langsung ditarik dari Spreadsheet.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Otomatis Buat Header & Tabel:</strong> Script otomatis menyusun sheet Transaksi, AkunKas, MutasiKas, Produk, dan Profil.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Multi-User Kasir:</strong> Kasir di cabang lain dapat menggunakan database spreadsheet yang sama.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
