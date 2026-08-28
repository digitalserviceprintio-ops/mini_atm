import React, { useState, useEffect } from 'react';
import {
  Tag,
  Percent,
  Coins,
  X,
  Check,
  RotateCcw,
  Sparkles,
  AlertCircle,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';
import { CartItem } from '../../types';
import { formatRp } from '../../utils/formatters';

interface ModalItemDiscountProps {
  isOpen: boolean;
  item: CartItem | null;
  onClose: () => void;
  onApplyDiscount: (
    itemId: string,
    discountType: 'percent' | 'nominal',
    discountValue: number
  ) => void;
  onRemoveDiscount: (itemId: string) => void;
}

export const ModalItemDiscount: React.FC<ModalItemDiscountProps> = ({
  isOpen,
  item,
  onClose,
  onApplyDiscount,
  onRemoveDiscount,
}) => {
  const [discountType, setDiscountType] = useState<'percent' | 'nominal'>('percent');
  const [discountValue, setDiscountValue] = useState<string>('0');

  useEffect(() => {
    if (item) {
      setDiscountType(item.discountType || 'percent');
      setDiscountValue(
        item.discountValue !== undefined && item.discountValue > 0
          ? String(item.discountValue)
          : ''
      );
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const numericVal = Math.max(0, parseFloat(discountValue) || 0);
  const originalSubtotal = item.price * item.qty;
  const buyPrice = item.buyPrice !== undefined ? item.buyPrice : item.price * 0.8;
  const totalCost = buyPrice * item.qty;

  // Calculate discount per unit & total discount
  let totalDiscount = 0;
  let discountPerUnit = 0;

  if (discountType === 'percent') {
    const rate = Math.min(100, numericVal);
    totalDiscount = Math.round((originalSubtotal * rate) / 100);
    discountPerUnit = Math.round((item.price * rate) / 100);
  } else {
    // Nominal per unit
    discountPerUnit = Math.min(item.price, numericVal);
    totalDiscount = discountPerUnit * item.qty;
  }

  const finalSubtotal = Math.max(0, originalSubtotal - totalDiscount);
  const finalProfit = finalSubtotal - totalCost;
  const isLossOrZeroProfit = finalProfit <= 0;

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (numericVal <= 0) {
      onRemoveDiscount(item.id);
    } else {
      onApplyDiscount(item.id, discountType, numericVal);
    }
    onClose();
  };

  const handleReset = () => {
    setDiscountValue('');
    onRemoveDiscount(item.id);
    onClose();
  };

  const percentPresets = [5, 10, 15, 20, 25, 50];
  const nominalPresets = [500, 1000, 2000, 5000, 10000, 20000];

  return (
    <div
      id="modal-item-discount-backdrop"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div
        id="modal-item-discount"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
              <Tag className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Atur Diskon Per-Item</h3>
              <p className="text-[11px] text-slate-500">
                Pemberian potongan harga khusus pada barang ini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Info Banner */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
          <div className="flex justify-between items-start">
            <div className="pr-2">
              <span className="font-bold text-xs text-slate-900 line-clamp-1">{item.name}</span>
              <span className="text-[11px] text-slate-500">
                Harga Normal: <strong>{formatRp(item.price)}</strong> / {item.unit || 'Pcs'} &bull; Qty: <strong>{item.qty}</strong>
              </span>
            </div>
            <span className="font-mono font-bold text-xs text-slate-800 shrink-0">
              {formatRp(originalSubtotal)}
            </span>
          </div>
        </div>

        <form onSubmit={handleApply} className="space-y-4">
          {/* Toggle Type: Persentase (%) vs Nominal (Rp) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Tipe Potongan Diskon
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  discountType === 'percent'
                    ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                <span>Persentase (%)</span>
              </button>

              <button
                type="button"
                onClick={() => setDiscountType('nominal')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  discountType === 'nominal'
                    ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nominal Rupiah (Rp)</span>
              </button>
            </div>
          </div>

          {/* Input Value */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold text-slate-700">
                {discountType === 'percent' ? 'Nilai Diskon (%)' : 'Potongan Diskon per Unit (Rp)'}
              </label>
              {numericVal > 0 && (
                <span className="text-[11px] font-mono text-emerald-700 font-bold">
                  Hemat {formatRp(totalDiscount)}
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                {discountType === 'percent' ? '%' : 'Rp'}
              </div>
              <input
                type="number"
                min="0"
                max={discountType === 'percent' ? 100 : item.price}
                step={discountType === 'percent' ? '0.5' : '100'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? 'Contoh: 10' : 'Contoh: 2000'}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                autoFocus
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Pilihan Cepat Diskon:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {discountType === 'percent'
                ? percentPresets.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountValue(String(pct))}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        numericVal === pct
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))
                : nominalPresets.map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => setDiscountValue(String(nom))}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        numericVal === nom
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {formatRp(nom)}
                    </button>
                  ))}
              <button
                type="button"
                onClick={() => setDiscountValue('0')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all cursor-pointer"
              >
                Reset (0)
              </button>
            </div>
          </div>

          {/* Live Calculation Preview Card */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Subtotal Awal ({item.qty} &times; {formatRp(item.price)}):</span>
              <span className="font-mono">{formatRp(originalSubtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-emerald-800 font-bold">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Potongan Diskon {discountType === 'percent' && numericVal > 0 ? `(${numericVal}%)` : ''}:
              </span>
              <span className="font-mono text-emerald-700">
                - {formatRp(totalDiscount)}
              </span>
            </div>

            <div className="border-t border-emerald-200/80 pt-1.5 flex justify-between items-center font-bold">
              <span className="text-slate-900">Subtotal Bersih (Netto):</span>
              <span className="font-mono text-sm text-blue-900">
                {formatRp(finalSubtotal)}
              </span>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-slate-400" />
                Estimasi Laba Item ({item.qty} unit):
              </span>
              <span
                className={`font-mono font-bold ${
                  finalProfit > 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {finalProfit > 0 ? `+${formatRp(finalProfit)}` : formatRp(finalProfit)}
              </span>
            </div>

            {isLossOrZeroProfit && numericVal > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Peringatan: Diskon membuat harga jual sama atau di bawah modal pokok.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            {(item.discountValue || 0) > 0 ? (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Hapus Diskon</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Diskon</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
