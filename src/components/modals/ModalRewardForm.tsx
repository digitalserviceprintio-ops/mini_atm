import React, { useState, useEffect } from 'react';
import { Gift, Edit3, X, Check, Tag, DollarSign, Package } from 'lucide-react';
import { MemberRewardItem, RewardCategory } from '../../types';

interface ModalRewardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rewardData: Partial<MemberRewardItem>) => void;
  editingReward: MemberRewardItem | null;
}

export const ModalRewardForm: React.FC<ModalRewardFormProps> = ({
  isOpen,
  onClose,
  onSave,
  editingReward,
}) => {
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<RewardCategory>('DISCOUNT_TRX');
  const [pointsRequired, setPointsRequired] = useState<number>(50);
  const [discountValue, setDiscountValue] = useState<number>(5000);
  const [stock, setStock] = useState<number>(50);
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  useEffect(() => {
    if (editingReward) {
      setName(editingReward.name);
      setCategory(editingReward.category);
      setPointsRequired(editingReward.pointsRequired || 50);
      setDiscountValue(editingReward.discountValue || 0);
      setStock(editingReward.stock ?? 50);
      setDescription(editingReward.description || '');
      setStatus(editingReward.status || 'ACTIVE');
    } else {
      setName('');
      setCategory('DISCOUNT_TRX');
      setPointsRequired(50);
      setDiscountValue(5000);
      setStock(50);
      setDescription('');
      setStatus('ACTIVE');
    }
  }, [editingReward, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama hadiah / voucher wajib diisi!');
      return;
    }
    if (pointsRequired < 1) {
      alert('Jumlah poin yang dibutuhkan minimal 1 poin (standar min. 50 poin)');
      return;
    }

    onSave({
      id: editingReward?.id,
      name: name.trim(),
      category,
      pointsRequired: Number(pointsRequired),
      discountValue: Number(discountValue),
      stock: Number(stock),
      description: description.trim(),
      status,
      createdAt: editingReward?.createdAt || new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              {editingReward ? <Edit3 className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {editingReward ? 'Edit Hadiah / Voucher' : 'Tambah Hadiah / Kupon Baru'}
              </h3>
              <p className="text-[11px] text-amber-100/90">
                Atur reward yang dapat ditukarkan oleh member pelanggan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Nama Hadiah */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Hadiah / Voucher / Kupon <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Voucher Diskon Transaksi Rp 5.000 / Mug Eksklusif"
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium text-slate-800"
            />
          </div>

          {/* Kategori & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kategori Reward
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as RewardCategory;
                  setCategory(cat);
                  if (cat === 'DISCOUNT_TRX' || cat === 'FREE_ADMIN') {
                    if (discountValue === 0) setDiscountValue(5000);
                  } else if (cat === 'DISCOUNT_POS') {
                    if (discountValue === 0) setDiscountValue(10000);
                  } else if (cat === 'PHYSICAL_GIFT') {
                    setDiscountValue(0);
                  } else if (cat === 'CASHBACK') {
                    if (discountValue === 0) setDiscountValue(50000);
                  }
                }}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
              >
                <option value="DISCOUNT_TRX">Diskon Transaksi ATM</option>
                <option value="FREE_ADMIN">Gratis Biaya Admin</option>
                <option value="DISCOUNT_POS">Diskon Kasir POS</option>
                <option value="PHYSICAL_GIFT">Barang / Hadiah Fisik</option>
                <option value="CASHBACK">Cashback Tunai / Saldo</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Ketersediaan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
              >
                <option value="ACTIVE">Aktif (Tersedia)</option>
                <option value="INACTIVE">Nonaktif (Ditutup)</option>
              </select>
            </div>
          </div>

          {/* Poin Dibutuhkan & Nilai Potongan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Poin Dibutuhkan <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-amber-700 font-bold">Min. 50</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  step="5"
                  value={pointsRequired}
                  onChange={(e) => setPointsRequired(Number(e.target.value))}
                  className="w-full p-2.5 pr-12 border border-slate-300 rounded-xl font-mono font-bold text-amber-800 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-[11px]">
                  Poin
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nilai Diskon / Nominal (Rp)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  placeholder="0 jika barang fisik"
                  className="w-full p-2.5 pl-8 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <span className="absolute left-2.5 top-2.5 text-slate-400 font-bold text-[11px]">
                  Rp
                </span>
              </div>
            </div>
          </div>

          {/* Stok Kuota */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Stok / Kuota Tersedia (Pcs / Lembar)
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full p-2.5 pl-8 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <Package className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Deskripsi & Keterangan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Deskripsi & Syarat Penukaran
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Berlaku untuk semua transaksi transfer/tarik tunai tanpa batas minimal."
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-slate-700 resize-none"
            />
          </div>

          {/* Fast Presets Chips */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
              Contoh Template Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setName('Voucher Diskon Transaksi Rp 5.000');
                  setCategory('DISCOUNT_TRX');
                  setPointsRequired(50);
                  setDiscountValue(5000);
                  setDescription('Potongan Rp 5.000 untuk transaksi perbankan / Mini ATM');
                }}
                className="px-2 py-1 bg-white border border-slate-200 hover:border-amber-400 rounded-lg text-[10px] text-slate-700 font-semibold transition-all cursor-pointer"
              >
                🎟️ Diskon ATM 50 Poin (Rp 5k)
              </button>
              <button
                type="button"
                onClick={() => {
                  setName('Gratis Biaya Admin 1x Transaksi');
                  setCategory('FREE_ADMIN');
                  setPointsRequired(50);
                  setDiscountValue(5000);
                  setDescription('Bebas biaya admin perbankan');
                }}
                className="px-2 py-1 bg-white border border-slate-200 hover:border-amber-400 rounded-lg text-[10px] text-slate-700 font-semibold transition-all cursor-pointer"
              >
                🆓 Free Admin (50 Poin)
              </button>
              <button
                type="button"
                onClick={() => {
                  setName('Voucher Belanja Kasir POS Rp 10.000');
                  setCategory('DISCOUNT_POS');
                  setPointsRequired(100);
                  setDiscountValue(10000);
                  setDescription('Potongan belanja barang fisik kasir POS');
                }}
                className="px-2 py-1 bg-white border border-slate-200 hover:border-amber-400 rounded-lg text-[10px] text-slate-700 font-semibold transition-all cursor-pointer"
              >
                🛍️ Diskon Belanja 100 Poin (Rp 10k)
              </button>
              <button
                type="button"
                onClick={() => {
                  setName('Mug Keramik Sahabat Agen');
                  setCategory('PHYSICAL_GIFT');
                  setPointsRequired(150);
                  setDiscountValue(0);
                  setDescription('Hadiah mug eksklusif agen');
                }}
                className="px-2 py-1 bg-white border border-slate-200 hover:border-amber-400 rounded-lg text-[10px] text-slate-700 font-semibold transition-all cursor-pointer"
              >
                🎁 Souvenir Mug (150 Poin)
              </button>
            </div>
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
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingReward ? 'Simpan Perubahan' : 'Simpan Hadiah'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
