import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Package,
  PackagePlus,
  ArrowRight,
  Boxes,
  Search,
  ShoppingCart,
  Plus,
  AlertCircle,
  TrendingDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { Product } from '../../types';
import { formatRp } from '../../utils/formatters';

interface ModalLowStockAlertProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onOpenRestock?: (product: Product) => void;
  onNavigateToStock?: () => void;
  onAddToCart?: (product: Product) => void;
}

export const ModalLowStockAlert: React.FC<ModalLowStockAlertProps> = ({
  isOpen,
  onClose,
  products = [],
  onOpenRestock,
  onNavigateToStock,
  onAddToCart,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'EMPTY' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract low stock products
  const lowStockItems = useMemo(() => {
    return (products || [])
      .filter((p) => {
        if (!p) return false;
        const min = p.minStock !== undefined ? p.minStock : 5;
        return p.stock <= min;
      })
      .sort((a, b) => {
        // Out of stock first
        if (a.stock === 0 && b.stock !== 0) return -1;
        if (b.stock === 0 && a.stock !== 0) return 1;
        // Lowest stock ratio
        const minA = a.minStock !== undefined ? Math.max(1, a.minStock) : 5;
        const minB = b.minStock !== undefined ? Math.max(1, b.minStock) : 5;
        return a.stock / minA - b.stock / minB;
      });
  }, [products]);

  const emptyCount = useMemo(() => lowStockItems.filter((p) => p.stock <= 0).length, [lowStockItems]);
  const lowCount = useMemo(() => lowStockItems.filter((p) => p.stock > 0).length, [lowStockItems]);

  const filteredItems = useMemo(() => {
    return lowStockItems.filter((p) => {
      const isOut = p.stock <= 0;
      if (filterType === 'EMPTY' && !isOut) return false;
      if (filterType === 'LOW' && isOut) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    });
  }, [lowStockItems, filterType, searchQuery]);

  const totalRestockCapital = useMemo(() => {
    return lowStockItems.reduce((sum, p) => {
      const min = p.minStock !== undefined ? p.minStock : 5;
      const targetQty = Math.max(10, min * 2);
      const qtyNeeded = Math.max(0, targetQty - p.stock);
      const buyPrice = p.buyPrice !== undefined ? p.buyPrice : p.price * 0.8;
      return sum + qtyNeeded * buyPrice;
    }, 0);
  }, [lowStockItems]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-low-stock-alert-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="modal-low-stock-alert-dialog"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-amber-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Accent Strip */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 w-full" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-amber-100 bg-gradient-to-b from-amber-50/80 to-white flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Pemberitahuan Stok Produk Kritis
                </h3>
                <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                  {lowStockItems.length} Produk Perlu Restock
                </span>
                {emptyCount > 0 && (
                  <span className="text-[11px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                    {emptyCount} Habis (0)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Produk di bawah ini telah mencapai atau berada di bawah batas minimum (<em>minStock</em>). Segera lakukan restock agar transaksi kasir POS tidak terganggu.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Tutup Notifikasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3.5 sm:px-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'ALL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua ({lowStockItems.length})
            </button>
            <button
              onClick={() => setFilterType('EMPTY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'EMPTY'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Stok Habis / 0 ({emptyCount})
            </button>
            <button
              onClick={() => setFilterType('LOW')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'LOW'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Menipis ({lowCount})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk / barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Scrollable Products List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>Tidak ada produk yang sesuai dengan filter pencarian ini.</p>
            </div>
          ) : (
            filteredItems.map((prod) => {
              const min = prod.minStock !== undefined ? prod.minStock : 5;
              const isOutOfStock = prod.stock <= 0;
              const stockPct = Math.min(100, Math.round((prod.stock / Math.max(1, min)) * 100));
              const buyPrice = prod.buyPrice !== undefined ? prod.buyPrice : prod.price * 0.8;
              const suggestedRestockQty = Math.max(10, min * 2 - prod.stock);

              return (
                <div
                  key={prod.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isOutOfStock
                      ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                      : 'bg-amber-50/30 border-amber-200 hover:border-amber-300'
                  }`}
                >
                  {/* Left info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {isOutOfStock ? 'STOK HABIS (0)' : 'STOK MENIPIS'}
                      </span>
                      {prod.category && (
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          {prod.category}
                        </span>
                      )}
                      {prod.barcode && (
                        <span className="text-[10px] font-mono text-slate-500">
                          SKU: {prod.barcode}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 truncate" title={prod.name}>
                      {prod.name}
                    </h4>

                    {/* Stock level info */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 pt-0.5">
                      <span className="font-medium">
                        Sisa Fisik:{' '}
                        <strong className={isOutOfStock ? 'text-rose-600' : 'text-amber-700'}>
                          {prod.stock} {prod.unit || 'pcs'}
                        </strong>{' '}
                        <span className="text-slate-400 font-normal">/ Min: {min}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>Harga: {formatRp(prod.price)}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-700 font-medium">
                        Saran: +{suggestedRestockQty} {prod.unit || 'pcs'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-md bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOutOfStock ? 'bg-rose-500 w-0' : 'bg-amber-500'
                        }`}
                        style={{ width: `${isOutOfStock ? 0 : Math.max(8, stockPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* Add to POS Cart if stock > 0 */}
                    {onAddToCart && prod.stock > 0 && (
                      <button
                        onClick={() => onAddToCart(prod)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Tambahkan ke keranjang kasir"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>+ Keranjang</span>
                      </button>
                    )}

                    {/* Direct Restock Button */}
                    {onOpenRestock && (
                      <button
                        onClick={() => {
                          onOpenRestock(prod);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                        title={`Restock ${prod.name}`}
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Estimasi modal restock untuk semua item:{' '}
              <strong className="text-slate-900 font-bold">{formatRp(totalRestockCapital)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-end">
            {onNavigateToStock && (
              <button
                onClick={() => {
                  onNavigateToStock();
                  onClose();
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Boxes className="w-4 h-4 text-blue-600" />
                <span>Buka Manajemen Stok</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Mengerti / Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
