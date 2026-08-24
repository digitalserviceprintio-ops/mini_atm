import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Transaction } from '../../types';
import { formatRp } from '../../utils/formatters';

interface ModalConfirmVoidProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  trx: Transaction | null;
}

export const ModalConfirmVoid: React.FC<ModalConfirmVoidProps> = ({
  isOpen,
  onClose,
  onConfirm,
  trx,
}) => {
  if (!isOpen || !trx) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4 text-center animate-in fade-in zoom-in duration-150">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-bold text-sm text-slate-800">Batalkan / Void Transaksi?</h3>
          <p className="text-xs text-slate-500 mt-1">
            Status transaksi <span className="font-bold text-slate-800">#{trx.id}</span> ({trx.type} - {formatRp(trx.nominal)}) akan diubah menjadi <span className="font-bold text-red-600">VOID</span> dan tidak lagi dihitung dalam total pendapatan bersih.
          </p>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-left space-y-1">
          <div className="flex justify-between text-slate-600">
            <span>Nasabah:</span>
            <span className="font-semibold text-slate-800">{trx.cust}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tujuan:</span>
            <span className="font-semibold text-slate-800">{trx.target}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Nominal:</span>
            <span className="font-bold text-slate-800">{formatRp(trx.nominal)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            Ya, Void Transaksi
          </button>
        </div>
      </div>
    </div>
  );
};
