import React from 'react';
import {
  Sparkles,
  X,
  History,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowUpCircle,
  RefreshCw,
  BookOpen,
  Code2,
} from 'lucide-react';
import { useAppVersion, VersionChangeLog } from '../../utils/versionManager';

interface ModalVersionInfoProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAbout?: () => void;
}

export const ModalVersionInfo: React.FC<ModalVersionInfoProps> = ({
  isOpen,
  onClose,
  onNavigateToAbout,
}) => {
  const { state, version, enterpriseVersion, buildDetails, recordChange, resetVersion } =
    useAppVersion();

  if (!isOpen) return null;

  const getTypeBadge = (type: VersionChangeLog['type']) => {
    switch (type) {
      case 'TRANSACTION':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PRODUCT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'STOCK':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SETTING':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'ACCOUNT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'USER':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div
      id="modalVersionInfoBackdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modalVersionInfoCard"
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b1b36] via-[#0d2347] to-[#09162e] text-white p-5 flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Cpu className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {enterpriseVersion}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h2 className="text-lg font-extrabold text-white mt-0.5 tracking-tight flex items-center gap-1.5">
                <span>Informasi Versi Sistem</span>
                <span className="text-xs font-mono font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-lg border border-sky-800/60">
                  {version}
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer relative z-10"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-700">
          {/* Key Metrics Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Versi Rilis
              </span>
              <span className="text-lg font-mono font-black text-blue-700 block mt-0.5">
                {version}
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Total Perubahan
              </span>
              <span className="text-lg font-mono font-black text-emerald-700 block mt-0.5">
                {state.changeCount} <span className="text-xs font-normal text-slate-500">rev</span>
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Build Number
              </span>
              <span className="text-lg font-mono font-black text-indigo-700 block mt-0.5">
                #{state.buildNumber}
              </span>
            </div>
          </div>

          {/* Auto-increment Feature Notice */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Sistem Auto-Increment Versioning Aktif</span>
            </div>
            <p className="text-blue-800/80 leading-relaxed text-[11.5px]">
              Setiap kali terjadi transaksi, perubahan katalog produk, kasir POS, stok barang, atau
              pengaturan profil outlet, nomor patch versi akan secara otomatis bertambah (
              <span className="font-mono font-bold text-blue-900">{version}</span>).
            </p>
          </div>

          {/* Action Test Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() =>
                recordChange('Pembaruan manual modul sistem operasional', 'SYSTEM')
              }
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Naikkan Versi (+1 Patch)</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Reset nomor versi kembali ke Enterprise v1.2 awal?')) {
                  resetVersion();
                }
              }}
              className="py-2 px-3 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset ke Baseline v1.2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Change History Logs */}
          <div className="space-y-2 pt-2">
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <span>Riwayat Pembaruan Versi ({state.history?.length || 0})</span>
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl max-h-48 overflow-y-auto bg-slate-50/50">
              {state.history && state.history.length > 0 ? (
                state.history.map((item) => (
                  <div key={item.id} className="p-3 text-xs flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border uppercase font-mono ${getTypeBadge(
                            item.type
                          )}`}
                        >
                          {item.type}
                        </span>
                        <span className="font-mono font-bold text-blue-900">{item.version}</span>
                      </div>
                      <p className="text-slate-700 font-medium text-[11.5px] truncate">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {item.timestamp}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  Belum ada log pembaruan tersimpan.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Developer Credit & Guide Link */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Developer: <strong className="text-slate-800">microdata2r</strong></span>
          </div>
          {onNavigateToAbout && (
            <button
              onClick={onNavigateToAbout}
              className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Buku Panduan Detail &rarr;</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{buildDetails}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
