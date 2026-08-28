import React, { useState } from 'react';
import { Settings, X, Check, Award, AlertCircle, Sparkles } from 'lucide-react';
import { PointExchangeSettings } from '../../types';
import { formatRp } from '../../utils/formatters';

interface ModalPointSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: PointExchangeSettings;
  currentSettings?: PointExchangeSettings;
  onSave: (newSettings: PointExchangeSettings) => void;
}

export const ModalPointSettings: React.FC<ModalPointSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  currentSettings,
  onSave,
}) => {
  const activeSettings = currentSettings || settings || {
    minPointsRedeem: 50,
    pointsPerStep: 50,
    rupiahPerStep: 5000,
    enableDirectDiscounts: true,
  };

  const [minPointsRedeem, setMinPointsRedeem] = useState<number>(activeSettings?.minPointsRedeem ?? 50);
  const [pointsPerStep, setPointsPerStep] = useState<number>(activeSettings?.pointsPerStep ?? 50);
  const [rupiahPerStep, setRupiahPerStep] = useState<number>(activeSettings?.rupiahPerStep ?? 5000);
  const [enableDirectDiscounts, setEnableDirectDiscounts] = useState<boolean>(
    activeSettings?.enableDirectDiscounts ?? true
  );

  // Sync state if settings prop changes or modal reopens
  React.useEffect(() => {
    if (isOpen) {
      const src = currentSettings || settings || {
        minPointsRedeem: 50,
        pointsPerStep: 50,
        rupiahPerStep: 5000,
        enableDirectDiscounts: true,
      };
      setMinPointsRedeem(src?.minPointsRedeem ?? 50);
      setPointsPerStep(src?.pointsPerStep ?? 50);
      setRupiahPerStep(src?.rupiahPerStep ?? 5000);
      setEnableDirectDiscounts(src?.enableDirectDiscounts ?? true);
    }
  }, [isOpen, settings, currentSettings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (minPointsRedeem < 1) {
      alert('Minimal poin penukaran harus lebih dari 0!');
      return;
    }
    if (pointsPerStep < 1) {
      alert('Kelipatan poin harus lebih dari 0!');
      return;
    }

    onSave({
      minPointsRedeem: Number(minPointsRedeem),
      pointsPerStep: Number(pointsPerStep),
      rupiahPerStep: Number(rupiahPerStep),
      enableDirectDiscounts,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Pengaturan Sistem Poin & Diskon</h3>
              <p className="text-[11px] text-slate-400">
                Atur ambang batas minimal dan nilai konversi diskon poin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Info Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-900">
            <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold block">Aturan Utama Loyalitas:</span>
              Setiap transaksi Mini ATM atau Kasir POS otomatis memberikan <strong>+1 Poin</strong> ke member. Poin dapat ditukarkan jika sudah mencapai minimal <strong>{minPointsRedeem} Poin</strong>.
            </div>
          </div>

          {/* Minimal Poin Penukaran */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Minimal Poin yang Dapat Ditukarkan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="1"
                step="5"
                value={minPointsRedeem}
                onChange={(e) => setMinPointsRedeem(Number(e.target.value))}
                className="w-full p-2.5 pr-14 border border-slate-300 rounded-xl font-mono font-bold text-amber-800 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-[11px]">
                Poin
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Member dengan poin di bawah angka ini tidak dapat memproses penukaran potongan transaksi.
            </p>
          </div>

          {/* Kelipatan Poin & Nilai Potongan Diskon */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kelipatan Poin
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  step="5"
                  value={pointsPerStep}
                  onChange={(e) => setPointsPerStep(Number(e.target.value))}
                  className="w-full p-2.5 pr-12 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-[11px]">
                  Poin
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nilai Diskon (Rp)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="500"
                  step="500"
                  value={rupiahPerStep}
                  onChange={(e) => setRupiahPerStep(Number(e.target.value))}
                  className="w-full p-2.5 pl-8 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <span className="absolute left-2.5 top-2.5 text-slate-400 font-bold text-[11px]">
                  Rp
                </span>
              </div>
            </div>
          </div>

          {/* Live Preview Conversion */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Simulasi Nilai Tukar Diskon:
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">{pointsPerStep} Poin</span>
                <span className="font-bold text-emerald-700 font-mono">{formatRp(rupiahPerStep)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">{pointsPerStep * 2} Poin</span>
                <span className="font-bold text-emerald-700 font-mono">{formatRp(rupiahPerStep * 2)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">{pointsPerStep * 3} Poin</span>
                <span className="font-bold text-emerald-700 font-mono">{formatRp(rupiahPerStep * 3)}</span>
              </div>
            </div>
          </div>

          {/* Toggle Potongan Langsung di Transaksi */}
          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-white">
            <div>
              <span className="font-semibold text-slate-800 block text-xs">
                Aktifkan Opsi Diskon Poin di Kasir & Mini ATM
              </span>
              <span className="text-[10px] text-slate-500">
                Tampilkan pilihan potong biaya/belanja menggunakan poin member saat transaksi
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableDirectDiscounts}
                onChange={(e) => setEnableDirectDiscounts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Simpan Aturan Poin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
