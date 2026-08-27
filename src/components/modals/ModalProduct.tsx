import React, { useState, useEffect, useRef } from 'react';
import { X, ShoppingBag, Check, Tag, Barcode, TrendingUp, Camera, Sparkles, CheckCircle2 } from 'lucide-react';
import { Product } from '../../types';
import { formatRp } from '../../utils/formatters';
import { ModalBarcodeCameraScanner } from './ModalBarcodeCameraScanner';
import { playSuccessBeep } from '../../utils/audioFeedback';

interface ModalProductProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => void;
  editingProduct: Product | null;
  initialBarcode?: string;
  onDelete?: (productId: string) => void;
}

export const ModalProduct: React.FC<ModalProductProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
  initialBarcode,
  onDelete,
}) => {
  const [name, setName] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [category, setCategory] = useState<string>('Pulsa/Paket');
  const [unit, setUnit] = useState<string>('pcs');
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('');
  const [minStock, setMinStock] = useState<string>('5');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [justScanned, setJustScanned] = useState<boolean>(false);

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setBarcode(editingProduct.barcode || '');
      setCategory(editingProduct.category || 'Pulsa/Paket');
      setUnit(editingProduct.unit || 'pcs');
      setBuyPrice(editingProduct.buyPrice !== undefined ? String(editingProduct.buyPrice) : '');
      setPrice(String(editingProduct.price || 0));
      setStock(String(editingProduct.stock || 0));
      setMinStock(editingProduct.minStock !== undefined ? String(editingProduct.minStock) : '5');
    } else {
      setName('');
      setBarcode(initialBarcode || '');
      setCategory('Pulsa/Paket');
      setUnit('pcs');
      setBuyPrice('');
      setPrice('');
      setStock('');
      setMinStock('5');
    }
  }, [editingProduct, initialBarcode, isOpen]);

  if (!isOpen) return null;

  const numBuy = parseFloat(buyPrice) || 0;
  const numSell = parseFloat(price) || 0;
  const unitProfit = numSell - numBuy;
  const profitMarginPct = numSell > 0 ? Math.round((unitProfit / numSell) * 100) : 0;

  const handleBarcodeScanned = (scannedCode: string) => {
    const code = scannedCode.trim();
    if (!code) return { success: false, message: 'Kode barcode kosong.' };

    setBarcode(code);
    setJustScanned(true);
    playSuccessBeep();
    setTimeout(() => setJustScanned(false), 3000);

    return {
      success: true,
      message: `Barcode "${code}" berhasil diisi ke field SKU produk.`,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: editingProduct ? editingProduct.id : undefined,
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      category,
      unit: unit.trim() || 'pcs',
      buyPrice: numBuy,
      price: numSell,
      stock: parseInt(stock, 10) || 0,
      minStock: parseInt(minStock, 10) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 space-y-4 animate-in fade-in zoom-in duration-150 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-700" />
            <span>{editingProduct ? 'Edit Master Data Produk Fisik' : 'Tambah Produk Fisik & Stok Baru'}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Nama Produk */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">
              Nama Produk / Barang / Voucher <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Voucher Telkomsel 50k / Kabel Type C 65W"
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
            />
          </div>

          {/* Barcode & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5 text-slate-400" />
                  <span>Barcode / SKU (Opsional)</span>
                </label>
                {justScanned && (
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5 animate-bounce">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Terisi!</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="EAN/UPC/SKU..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono uppercase text-xs"
                  />
                  {barcode && (
                    <button
                      type="button"
                      onClick={() => setBarcode('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      title="Hapus barcode"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsCameraScannerOpen(true)}
                  className="px-2.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl flex items-center gap-1 font-bold text-xs shadow-2xs transition-all cursor-pointer shrink-0"
                  title="Pindai barcode fisik menggunakan kamera perangkat"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">Scan</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Dapat diketik manual, ditembak dengan scanner gun, atau scan via kamera.
              </span>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Kategori Produk</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
              >
                <option value="Pulsa/Paket">Pulsa / Paket Data</option>
                <option value="Listrik">Listrik & PLN</option>
                <option value="Aksesoris">Aksesoris Handphone</option>
                <option value="Perdana">Kartu Perdana</option>
                <option value="Game">Voucher Game</option>
                <option value="Lainnya">Lainnya / Umum</option>
              </select>
            </div>
          </div>

          {/* Harga Beli (Modal/HPP) & Harga Jual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">
                Harga Modal / Beli (HPP)
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
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Modal kulakan per item</span>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-blue-900">
                Harga Jual ke Pelanggan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 font-bold text-[11px]">
                  Rp
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono font-bold text-blue-950"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Harga di kasir POS</span>
            </div>

            {/* Profit Projection Preview */}
            <div className="sm:col-span-2 pt-1 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-600 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Estimasi Laba per Unit:
              </span>
              <span className="font-mono font-bold text-emerald-700">
                {formatRp(unitProfit)} {numSell > 0 ? `(${profitMarginPct}%)` : ''}
              </span>
            </div>
          </div>

          {/* Stok, Minimum Alert, & Satuan */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Stok Awal</label>
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Min. Alert</label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="5"
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Satuan</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
              >
                <option value="pcs">pcs</option>
                <option value="voucher">voucher</option>
                <option value="token">token</option>
                <option value="unit">unit</option>
                <option value="pack">pack</option>
                <option value="box">box</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Data Produk</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal Scanner Barcode Kamera Khusus Input SKU */}
      <ModalBarcodeCameraScanner
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onBarcodeDetected={(code) => handleBarcodeScanned(code)}
      />
    </div>
  );
};

