import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  RotateCcw,
  Trash2,
  Download,
  ShieldAlert,
  CheckCircle2,
  Layers,
  Database,
} from 'lucide-react';
import { AgentProfile } from '../../types';

export type ResetScope = 'transactions_only' | 'factory_default' | 'clear_all';

interface ModalResetDataProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (scope: ResetScope) => void;
  onDownloadBackup: () => void;
  profile: AgentProfile;
  trxCount: number;
  mutationCount: number;
  productCount: number;
  userCount: number;
}

export const ModalResetData: React.FC<ModalResetDataProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  onDownloadBackup,
  profile,
  trxCount,
  mutationCount,
  productCount,
  userCount,
}) => {
  const [selectedScope, setSelectedScope] = useState<ResetScope>('transactions_only');
  const [confirmInput, setConfirmInput] = useState<string>('');
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const requiredConfirmText = 'RESET DATA';
  const isConfirmValid = confirmInput.trim().toUpperCase() === requiredConfirmText;

  const handleBackupClick = () => {
    onDownloadBackup();
    setHasDownloadedBackup(true);
  };

  const handleExecuteReset = () => {
    if (!isConfirmValid) return;
    setIsProcessing(true);
    setTimeout(() => {
      onConfirmReset(selectedScope);
      setIsProcessing(false);
      setConfirmInput('');
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with High Contrast Hazard Colors */}
        <div className="bg-gradient-to-r from-rose-700 via-red-600 to-rose-800 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
              <ShieldAlert className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                Peringatan: Reset & Pembersihan Data
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                Tindakan ini menghapus data operasional dan tidak dapat dibatalkan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-xs">
          {/* Critical Warning Alert Box */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold text-rose-900 text-xs block">
                PERHATIAN PENTING SEBELUM MELANJUTKAN:
              </span>
              <p className="text-rose-700 text-[11px] leading-relaxed">
                Data yang direset akan dihapus permanen dari penyimpanan lokal peramban (browser) dan sinkronisasi spreadsheet. Pastikan Anda telah mengunduh salinan berkas cadangan (backup).
              </p>
            </div>
          </div>

          {/* Quick Backup Recommendation Step */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800 text-xs block">
                Rekomendasi Keamanan:
              </span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Simpan seluruh data saat ini ke dalam berkas JSON cadangan.
              </p>
            </div>
            <button
              type="button"
              onClick={handleBackupClick}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs ${
                hasDownloadedBackup
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-blue-700 hover:bg-blue-800 text-white'
              }`}
            >
              {hasDownloadedBackup ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Backup Berhasil Diunduh</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Backup JSON</span>
                </>
              )}
            </button>
          </div>

          {/* Reset Scope Selector */}
          <div className="space-y-2.5">
            <label className="font-extrabold text-slate-900 text-xs uppercase tracking-wider block">
              Pilih Lingkup Reset Data:
            </label>

            {/* Scope 1: Transactions only */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedScope === 'transactions_only'
                  ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/30'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="resetScope"
                checked={selectedScope === 'transactions_only'}
                onChange={() => setSelectedScope('transactions_only')}
                className="mt-1 text-amber-600 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">
                    1. Reset Riwayat Transaksi & Mutasi Kas Saja (Direkomendasikan)
                  </span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Aman
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Menghapus <strong>{trxCount} transaksi</strong> dan <strong>{mutationCount} mutasi kas</strong>. Akun kas, rekening bank, saldo awal, katalog {productCount} produk POS, dan {userCount} akun pengguna tetap aman tersimpan.
                </p>
              </div>
            </label>

            {/* Scope 2: Factory Default */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedScope === 'factory_default'
                  ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-400/30'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="resetScope"
                checked={selectedScope === 'factory_default'}
                onChange={() => setSelectedScope('factory_default')}
                className="mt-1 text-rose-600 focus:ring-rose-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">
                    2. Reset ke Data Standar Demo (Factory Default)
                  </span>
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Kembali Awal
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Mengembalikan semua data transaksi, saldo akun kas, produk, dan pengguna ke contoh data awal sistem (demo pabrik).
                </p>
              </div>
            </label>

            {/* Scope 3: Clear All */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedScope === 'clear_all'
                  ? 'bg-red-100/60 border-red-500 ring-2 ring-red-500/30'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="resetScope"
                checked={selectedScope === 'clear_all'}
                onChange={() => setSelectedScope('clear_all')}
                className="mt-1 text-red-700 focus:ring-red-600"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-950 text-xs">
                    3. Kosongkan Database Bersih (Hapus Semua)
                  </span>
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Pembersihan Total
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Mengosongkan semua transaksi, riwayat mutasi kas, dan menghapus seluruh produk POS dari awal untuk memulai pembukuan baru dari nol.
                </p>
              </div>
            </label>
          </div>

          {/* Type Confirmation Input Safeguard */}
          <div className="space-y-1.5 pt-1">
            <label className="font-bold text-slate-800 text-xs block">
              Ketik kata <span className="font-mono text-rose-700 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{requiredConfirmText}</span> untuk mengonfirmasi:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={`Ketik "${requiredConfirmText}" di sini...`}
              className="w-full text-xs font-mono font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-hidden text-slate-900 transition-all uppercase"
            />
            {confirmInput.length > 0 && !isConfirmValid && (
              <p className="text-[10px] text-rose-600 font-semibold">
                Teks konfirmasi belum cocok. Ketik tepat: {requiredConfirmText}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Batalkan
          </button>

          <button
            type="button"
            onClick={handleExecuteReset}
            disabled={!isConfirmValid || isProcessing}
            className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-700/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <span>Memproses Reset...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Konfirmasi Reset Data Permanen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
