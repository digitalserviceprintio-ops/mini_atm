import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Check, PackageMinus } from 'lucide-react';
import { Product } from '../../types';
import { formatRp } from '../../utils/formatters';

interface ModalAdjustStockProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  operatorName: string;
  onConfirmAdjust: (
    productId: string,
    qtyToDeduct: number,
    reason: string,
    adjustmentType: 'PENYESUAIAN_KURANG' | 'KOREKSI_MANUAL'
  ) => void;
}

export const ModalAdjustStock: React.FC<ModalAdjustStockProps> = ({
  isOpen,
  onClose,
  product,
  operatorName,
  onConfirmAdjust,
}) => {
  const [qty, setQty] = useState<string>('1');
  const [reason, setReason] = useState<string>('Barang Rusak / Cacat Pabrik');
  const [customNote, setCustomNote] = useState<string>('');

  useEffect(() => {
    if (product) {
      setQty('1');
      setReason('Barang Rusak / Cacat Pabrik');
      setCustomNote('');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const numQty = parseInt(qty, 10) || 0;
  const stockAfter = Math.max(0, product.stock - numQty);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty <= 0) {
      alert('Jumlah pengurangan harus minimal 1 unit!');
      return;
    }
    if (numQty > product.stock) {
      alert(`Jumlah pengurangan (${numQty}) tidak boleh melebihi stok yang ada (${product.stock})!`);
      return;
    }

    const fullReason = customNote.trim() ? `${reason} - ${customNote.trim()}` : reason;

    onConfirmAdjust(
      product.id,
      numQty,
      fullReason,
      'PENYESUAIAN_KURANG'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <PackageMinus className="w-5 h-5 text-rose-600" />
            <span>Koreksi / Kurangi Stok Fisik</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Info Banner */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">{product.name}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
              {product.category || 'Umum'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
            <span>
              Stok Tersedia: <strong className="text-slate-800">{product.stock} {product.unit || 'pcs'}</strong>
            </span>
            <span>
              Harga Modal: <strong className="text-slate-700">{formatRp(product.buyPrice || 0)}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Jumlah Pengurangan */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">
              Jumlah Pengurangan (Unit) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                required
                min="1"
                max={product.stock}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="1"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 focus:outline-hidden font-bold text-sm text-rose-700"
              />
              <span className="text-slate-500 font-semibold px-2">{product.unit || 'pcs'}</span>
            </div>
          </div>

          {/* Alasan Pengurangan */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">
              Alasan Pengurangan / Koreksi <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 focus:outline-hidden bg-white"
            >
              <option value="Barang Rusak / Cacat Pabrik">Barang Rusak / Cacat Pabrik</option>
              <option value="Kadaluarsa / Expired">Kadaluarsa / Expired</option>
              <option value="Hilang / Selisih Stok Opname">Hilang / Selisih Stok Opname</option>
              <option value="Pengembalian ke Supplier (Retur)">Pengembalian ke Supplier (Retur)</option>
              <option value="Digunakan untuk Operasional Toko">Digunakan untuk Operasional Toko</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Keterangan Tambahan */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">
              Keterangan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Contoh: Kabel putus saat unboxing tester"
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 focus:outline-hidden"
            />
          </div>

          {/* Summary Warning Box */}
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-1 text-[11px] text-rose-900">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Sisa Stok Setelah Koreksi: {stockAfter} {product.unit || 'pcs'}</span>
            </div>
            <p className="text-[10px] text-rose-700 leading-relaxed">
              Pengurangan stok ini akan dicatat ke dalam log mutasi stok permanen dan dipertanggungjawabkan pada laporan opname.
            </p>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-rose-200/60">
              Operator: <strong>{operatorName}</strong>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Koreksi Stok</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
