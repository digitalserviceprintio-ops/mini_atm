import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Check, PackagePlus, DollarSign, Barcode, Camera, Sparkles, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';
import { formatRp } from '../../utils/formatters';
import { ModalBarcodeCameraScanner } from './ModalBarcodeCameraScanner';
import { playSuccessBeep, playErrorBeep } from '../../utils/audioFeedback';

interface ModalRestockProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  products?: Product[];
  operatorName?: string;
  onSelectProduct?: (product: Product) => void;
  onConfirmRestock: (
    productId: string,
    qtyToAdd: number,
    newBuyPrice: number | undefined,
    supplierOrNotes: string
  ) => void;
}

export const ModalRestock: React.FC<ModalRestockProps> = ({
  isOpen,
  onClose,
  product: initialProduct,
  products = [],
  operatorName = 'Operator',
  onSelectProduct,
  onConfirmRestock,
}) => {
  const [activeProduct, setActiveProduct] = useState<Product | null>(initialProduct);
  const [qty, setQty] = useState<string>('10');
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);

  useEffect(() => {
    setActiveProduct(initialProduct);
    if (initialProduct) {
      setQty('10');
      setBuyPrice(initialProduct.buyPrice !== undefined ? String(initialProduct.buyPrice) : '');
      setNotes('');
    }
  }, [initialProduct, isOpen]);

  if (!isOpen || !activeProduct) return null;

  const numQty = parseInt(qty, 10) || 0;
  const numBuy = buyPrice ? parseFloat(buyPrice) : activeProduct.buyPrice || 0;
  const totalCost = numQty * numBuy;
  const stockAfter = activeProduct.stock + numQty;

  const handleBarcodeScanned = (scannedCode: string) => {
    const code = scannedCode.trim().toLowerCase();
    if (!code) return { success: false, message: 'Kode barcode kosong.' };

    const target = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === code) ||
        p.id.toLowerCase() === code ||
        p.name.toLowerCase() === code
    );

    if (target) {
      setActiveProduct(target);
      setBuyPrice(target.buyPrice !== undefined ? String(target.buyPrice) : '');
      if (onSelectProduct) onSelectProduct(target);
      playSuccessBeep();
      setSwitchFeedback(`Produk dialihkan ke "${target.name}"`);
      setTimeout(() => setSwitchFeedback(null), 3000);
      return {
        success: true,
        message: `Produk "${target.name}" berhasil dipilih untuk restock.`,
      };
    } else {
      playErrorBeep();
      return {
        success: false,
        message: `Produk dengan barcode/SKU "${scannedCode}" tidak ditemukan di database.`,
      };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty <= 0) {
      alert('Jumlah restock harus lebih dari 0!');
      return;
    }

    onConfirmRestock(
      activeProduct.id,
      numQty,
      buyPrice ? parseFloat(buyPrice) : undefined,
      notes.trim() || 'Kulakan / Restock Stok Masuk'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Restock / Tambah Stok Masuk</h3>
              <p className="text-[10px] text-slate-500">Pencatatan barang masuk & penyesuaian HPP modal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Info Banner with Barcode Scan Trigger */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-bold text-slate-900 text-sm block leading-tight">{activeProduct.name}</span>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  {activeProduct.category || 'Umum'}
                </span>
                {activeProduct.barcode ? (
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Barcode className="w-3 h-3" />
                    <span>{activeProduct.barcode}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Belum ada barcode</span>
                )}
              </div>
            </div>

            {/* Tombol Scan Barcode Kamera untuk Switch / Verifikasi Barang */}
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer shrink-0"
              title="Scan barcode untuk ganti produk yang mau di-restock"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ganti Item</span>
            </button>
          </div>

          {switchFeedback && (
            <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{switchFeedback}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1.5 border-t border-slate-200">
            <span>
              Stok Saat Ini: <strong className="text-slate-800">{activeProduct.stock} {activeProduct.unit || 'pcs'}</strong>
            </span>
            <span>
              Harga Jual: <strong className="text-blue-700">{formatRp(activeProduct.price)}</strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Jumlah Tambah */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">
              Jumlah Masuk (Tambah Unit) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                required
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Jumlah item..."
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-bold text-sm text-slate-900"
              />
              <span className="text-slate-500 font-semibold px-2">{activeProduct.unit || 'pcs'}</span>
            </div>
          </div>

          {/* Harga Beli / Modal Baru */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">
              Harga Modal / Beli per Unit (Opsional / Update)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[11px]">
                Rp
              </span>
              <input
                type="number"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="Biarkan kosong jika tidak berubah"
                className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Supplier / Alasan / Catatan */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">
              Catatan / Nama Supplier / No. Nota Kulakan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Kulakan Grosir Indomarco / Nota #992"
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Summary Box */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center text-emerald-900">
              <span>Estimasi Stok Baru:</span>
              <span className="font-bold text-sm">{stockAfter} {activeProduct.unit || 'pcs'}</span>
            </div>
            {totalCost > 0 && (
              <div className="flex justify-between items-center text-emerald-800 pt-1 border-t border-emerald-200/60">
                <span>Total Biaya Kulakan:</span>
                <span className="font-bold font-mono">{formatRp(totalCost)}</span>
              </div>
            )}
            <div className="text-[10px] text-slate-500 pt-1">
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Konfirmasi Tambah Stok</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal Barcode Camera Scanner */}
      <ModalBarcodeCameraScanner
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onBarcodeDetected={(code) => handleBarcodeScanned(code)}
      />
    </div>
  );
};
