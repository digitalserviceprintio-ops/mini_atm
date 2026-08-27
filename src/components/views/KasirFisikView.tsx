import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShoppingCart,
  PlusCircle,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Search,
  Package,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Camera,
  ScanLine,
  Barcode,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Zap,
  BellRing,
} from 'lucide-react';
import { CartItem, Product, UserRole } from '../../types';
import { formatRp } from '../../utils/formatters';
import { ModalBarcodeCameraScanner } from '../modals/ModalBarcodeCameraScanner';
import { ModalLowStockAlert } from '../modals/ModalLowStockAlert';
import { playSuccessBeep, playErrorBeep } from '../../utils/audioFeedback';
import { DigitalClock } from '../common/DigitalClock';

interface KasirFisikViewProps {
  products?: Product[];
  currentRole: UserRole;
  operatorName?: string;
  onOpenNewProduct: (initialBarcode?: string) => void;
  onNavigateToStock: () => void;
  onNavigateToReport: () => void;
  onCheckoutPOS: (
    cart: CartItem[],
    total: number,
    paymentMethod: string,
    customerName?: string,
    notes?: string
  ) => void;
  onOpenRestock?: (product: Product) => void;
}

export const KasirFisikView: React.FC<KasirFisikViewProps> = ({
  products = [],
  currentRole,
  operatorName = 'Kasir',
  onOpenNewProduct,
  onNavigateToStock,
  onNavigateToReport,
  onCheckoutPOS,
  onOpenRestock,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [paymentMethod, setPaymentMethod] = useState<string>('Tunai');
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Scanner states
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [scanNotification, setScanNotification] = useState<{
    type: 'success' | 'error';
    title: string;
    description: string;
    barcode?: string;
  } | null>(null);

  // Low stock alert modal state
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState<boolean>(false);

  // Count items below minStock
  const lowStockItems = useMemo(() => {
    return (products || []).filter((p) => {
      if (!p) return false;
      const min = p.minStock !== undefined ? p.minStock : 5;
      return p.stock <= min;
    });
  }, [products]);

  // Show pop up notification automatically on entering POS Cashier if there are low stock items
  useEffect(() => {
    if (lowStockItems.length > 0) {
      const alreadyNotified = sessionStorage.getItem('pos_low_stock_pop_up_seen');
      if (!alreadyNotified) {
        setIsLowStockModalOpen(true);
        sessionStorage.setItem('pos_low_stock_pop_up_seen', 'true');
      }
    }
  }, [lowStockItems.length]);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const scanBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const categories = ['ALL', 'Pulsa/Paket', 'Listrik', 'Aksesoris', 'Perdana', 'Game', 'Lainnya'];

  // Filtered products list
  const filteredProducts = (products || []).filter((p) => {
    if (!p) return false;
    const matchCat = selectedCat === 'ALL' || p.category === selectedCat;
    const q = (search || '').toLowerCase().trim();
    const matchSearch =
      !q ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const showToast = (type: 'success' | 'error', title: string, description: string, barcode?: string) => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    setScanNotification({ type, title, description, barcode });
    notificationTimerRef.current = setTimeout(() => {
      setScanNotification(null);
    }, 4500);
  };

  // Add Product directly to Cart
  const addToCart = (product: Product): boolean => {
    if (product.stock <= 0) {
      playErrorBeep();
      showToast('error', 'Stok Barang Habis', `Produk "${product.name}" saat ini tidak memiliki stok.`);
      return false;
    }

    let isSuccess = true;
    let limitReached = false;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          limitReached = true;
          isSuccess = false;
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          buyPrice: product.buyPrice !== undefined ? product.buyPrice : product.price * 0.8,
          qty: 1,
          maxStock: product.stock,
          category: product.category,
          unit: product.unit,
        },
      ];
    });

    if (limitReached) {
      playErrorBeep();
      showToast('error', 'Batas Stok Tercapai', `Stok "${product.name}" hanya tersedia ${product.stock} unit.`);
      return false;
    }

    if (isSuccess) {
      playSuccessBeep();
      showToast(
        'success',
        `+1 ${product.name}`,
        `${formatRp(product.price)} • Stok sisa: ${product.stock}`
      );
    }

    return isSuccess;
  };

  // Process Barcode from Camera or Hardware Scanner Gun or Search Input
  const processBarcodeScan = (rawCode: string): { success: boolean; message: string } => {
    const code = rawCode.trim();
    if (!code) {
      return { success: false, message: 'Kode barcode kosong.' };
    }

    // 1. Exact match by Barcode
    let targetProduct = (products || []).find(
      (p) => p && p.barcode && p.barcode.toLowerCase() === code.toLowerCase()
    );

    // 2. Fallback exact match by ID / SKU
    if (!targetProduct) {
      targetProduct = (products || []).find(
        (p) => p && p.id && p.id.toLowerCase() === code.toLowerCase()
      );
    }

    // 3. Fallback exact match by Name
    if (!targetProduct) {
      targetProduct = (products || []).find(
        (p) => p && p.name && p.name.toLowerCase() === code.toLowerCase()
      );
    }

    if (targetProduct) {
      const added = addToCart(targetProduct);
      if (added) {
        return {
          success: true,
          message: `Berhasil menambahkan "${targetProduct.name}" (${formatRp(targetProduct.price)}) ke keranjang.`,
        };
      } else {
        return {
          success: false,
          message: `Stok "${targetProduct.name}" tidak mencukupi atau habis.`,
        };
      }
    } else {
      playErrorBeep();
      showToast(
        'error',
        'Barcode Tidak Ditemukan',
        `Kode "${code}" belum terdaftar di database master barang.`,
        code
      );
      return {
        success: false,
        message: `Produk dengan barcode/kode "${code}" tidak ditemukan.`,
      };
    }
  };

  // Hardware Scanner Gun Global Keydown Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore functional keys like Alt, Ctrl, Shift, Tab, etc.
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
        return;
      }

      const activeEl = document.activeElement;
      const isInputActive =
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
      const isSearchInput = activeEl === searchInputRef.current;

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Hardware barcode scanners type very quickly (< 60ms between characters)
      const isFastTyping = timeDiff < 65;

      if (e.key === 'Enter') {
        if (scanBufferRef.current.length >= 2) {
          const barcode = scanBufferRef.current;
          scanBufferRef.current = '';
          const res = processBarcodeScan(barcode);
          if (res.success && isSearchInput) {
            setSearch('');
          }
          if (isFastTyping || !isInputActive || isSearchInput) {
            e.preventDefault();
          }
          return;
        }

        // If user is typing in search input and hits Enter
        if (isSearchInput && search.trim()) {
          const q = search.trim();
          // Check if single exact or best match
          const exact = (products || []).find(
            (p) =>
              (p.barcode && p.barcode.toLowerCase() === q.toLowerCase()) ||
              p.id.toLowerCase() === q.toLowerCase() ||
              p.name.toLowerCase() === q.toLowerCase()
          );

          if (exact) {
            e.preventDefault();
            processBarcodeScan(exact.barcode || exact.id);
            setSearch('');
            return;
          }

          if (filteredProducts.length === 1) {
            e.preventDefault();
            addToCart(filteredProducts[0]);
            setSearch('');
            return;
          }
        }
      } else if (e.key.length === 1) {
        // Collect single character in scanner buffer
        if (timeDiff > 250) {
          // Reset buffer if delay is too long (human typing)
          scanBufferRef.current = e.key;
        } else {
          scanBufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [products, search, filteredProducts]);

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            if (newQty > item.maxStock) {
              playErrorBeep();
              showToast('error', 'Batas Maksimum Stok', `Stok barang hanya tersisa ${item.maxStock} unit.`);
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setNotes('');
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartCost = cart.reduce(
    (acc, item) =>
      acc + (item.buyPrice !== undefined ? item.buyPrice : item.price * 0.8) * item.qty,
    0
  );
  const cartProfit = cartTotal - cartCost;
  const profitMarginPct = cartTotal > 0 ? Math.round((cartProfit / cartTotal) * 100) : 0;
  const totalCartQty = cart.reduce((acc, item) => acc + item.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    onCheckoutPOS(
      cart,
      cartTotal,
      paymentMethod,
      customerName.trim() || undefined,
      notes.trim() || undefined
    );
    clearCart();
  };

  return (
    <section id="view-kasir-fisik" className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-700" />
              <span>Kasir Penjualan Barang Fisik (POS)</span>
            </h2>

            {/* Status Scanner Hardware Gun Ready */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Barcode className="w-3.5 h-3.5" />
              <span>Alat Scan USB/BT Siap</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dukungan pencarian teks instan, pemindai barcode kamera & hardware barcode gun otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tombol Pemberitahuan Stok Kritis / Menipis */}
          {lowStockItems.length > 0 && (
            <button
              onClick={() => setIsLowStockModalOpen(true)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer animate-in fade-in"
              title="Klik untuk melihat daftar produk yang stoknya menipis/habis"
            >
              <BellRing className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>{lowStockItems.length} Perlu Restock</span>
            </button>
          )}

          {/* Tombol Scan Barcode Kamera */}
          <button
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            title="Buka pemindai kamera untuk scan barcode/QR"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Kamera</span>
          </button>

          <button
            onClick={onNavigateToStock}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Package className="w-4 h-4 text-blue-600" />
            <span>Manajemen Stok</span>
          </button>

          <button
            onClick={onNavigateToReport}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Laporan Penjualan</span>
          </button>

          {currentRole === 'Admin' && (
            <button
              onClick={() => onOpenNewProduct()}
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Scan Toast Banner */}
      {scanNotification && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 ${
            scanNotification.type === 'success'
              ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-700/20'
              : 'bg-rose-600 text-white border-rose-700 shadow-rose-700/20'
          }`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {scanNotification.type === 'success' ? (
              <div className="p-1.5 bg-white/20 rounded-xl shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div className="p-1.5 bg-white/20 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="text-xs truncate">
              <div className="font-bold text-sm leading-tight">{scanNotification.title}</div>
              <div className="text-white/90 text-[11px] truncate mt-0.5">{scanNotification.description}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {scanNotification.barcode && currentRole === 'Admin' && (
              <button
                onClick={() => {
                  onOpenNewProduct(scanNotification.barcode);
                  setScanNotification(null);
                }}
                className="px-2.5 py-1 bg-white text-rose-700 hover:bg-rose-50 rounded-lg font-bold text-[11px] shadow-xs cursor-pointer transition-all whitespace-nowrap"
              >
                + Daftarkan SKU Ini
              </button>
            )}
            <button
              onClick={() => setScanNotification(null)}
              className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Katalog Barang & Search Bar */}
        <div className="lg:col-span-2 space-y-3.5">
          {/* Search & Camera Trigger Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama produk, barcode EAN/UPC, atau SKU... (Tekan Enter untuk input cepat)"
                  className="w-full text-xs pl-10 pr-9 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50/50 font-medium"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Button: Scan Kamera */}
              <button
                onClick={() => setIsCameraScannerOpen(true)}
                className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0"
                title="Buka Kamera Barcode Scanner"
              >
                <Camera className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Scan Kamera</span>
              </button>
            </div>

            {/* Category Pills & Total Match Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCat(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      selectedCat === cat
                        ? 'bg-blue-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua Kategori' : cat}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                Ditemukan <strong className="text-slate-800">{filteredProducts.length}</strong> produk
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" id="posProductGrid">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
                <Package className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">Tidak ada produk yang cocok dengan pencarian "{search}"</p>
                <p className="text-[11px] text-slate-400">
                  Coba ketik kata kunci lain atau gunakan fitur <strong>Scan Barcode Kamera</strong>.
                </p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const min = p.minStock !== undefined ? p.minStock : 5;
                const isLow = p.stock > 0 && p.stock <= min;
                const modal = p.buyPrice !== undefined ? p.buyPrice : p.price * 0.8;
                const profit = p.price - modal;

                return (
                  <div
                    key={p.id}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2.5 hover:border-blue-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md truncate">
                          {p.category || 'POS'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          Stok: {p.stock}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 mt-1.5 line-clamp-2 leading-tight">
                        {p.name}
                      </h4>

                      {/* Barcode/SKU Tag */}
                      {p.barcode && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1">
                          <Barcode className="w-3 h-3 shrink-0" />
                          <span className="truncate">{p.barcode}</span>
                        </div>
                      )}

                      <p className="text-sm font-bold text-blue-900 mt-1.5 font-mono">
                        {formatRp(p.price)}
                      </p>
                      <span className="text-[10px] text-emerald-700 font-medium block">
                        Laba: +{formatRp(profit)}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(p)}
                      disabled={isOutOfStock}
                      className={`w-full py-2 font-bold text-xs rounded-xl border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-blue-50 hover:bg-blue-700 hover:text-white text-blue-700 border-blue-200 shadow-2xs'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Stok Habis' : 'Tambah'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Keranjang Belanja POS Checkout */}
        <div className="space-y-4 h-fit sticky top-16">
          {/* Live Digital Clock & Shift Status Widget */}
          <DigitalClock variant="pos" />

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-700" />
                  <span>Keranjang Kasir POS</span>
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Kosongkan ({totalCartQty})</span>
                  </button>
                )}
              </div>

            {/* Cart Items List */}
            <div className="divide-y divide-slate-100 my-2 max-h-56 overflow-y-auto" id="posCartItems">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs space-y-1">
                  <ShoppingCart className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                  <p className="font-semibold text-slate-500">Keranjang masih kosong</p>
                  <p className="text-[10px] text-slate-400">
                    Scan barcode barang atau klik tombol Tambah di katalog.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                    <div className="overflow-hidden">
                      <span className="font-semibold text-slate-900 block truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatRp(item.price)} &times; {item.qty}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded-l cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold text-xs">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded-r cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-bold text-slate-900 w-18 text-right font-mono">
                        {formatRp(item.price * item.qty)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Optional Customer & Payment Method */}
            {cart.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Pelanggan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Pak Budi / Pelanggan Toko"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
                  >
                    <option value="Tunai">Tunai (Cash)</option>
                    <option value="QRIS">QRIS Link Bersama</option>
                    <option value="Transfer BRI">Transfer Bank BRI</option>
                    <option value="Transfer BCA">Transfer Bank BCA</option>
                    <option value="Transfer Mandiri">Transfer Bank Mandiri</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2.5">
            {/* Profit preview if items in cart */}
            {cart.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between items-center text-emerald-900">
                  <span className="text-[11px] flex items-center gap-1 font-medium">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    Estimasi Laba Penjualan:
                  </span>
                  <span className="font-mono font-bold text-emerald-800">
                    +{formatRp(cartProfit)} ({profitMarginPct}%)
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Kasir Bertugas:</span>
                  <span className="font-semibold text-slate-700">{operatorName}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center font-bold text-sm">
              <span className="text-slate-700">Total Tagihan POS:</span>
              <span id="posTotal" className="text-blue-900 text-lg font-mono font-bold">
                {formatRp(cartTotal)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Proses Pembayaran & Simpan Struk</span>
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Modal Scanner Barcode Kamera */}
      <ModalBarcodeCameraScanner
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onBarcodeDetected={(code) => processBarcodeScan(code)}
      />

      {/* Modal Notifikasi Pop-up Stok Kritis / Menipis */}
      <ModalLowStockAlert
        isOpen={isLowStockModalOpen}
        onClose={() => setIsLowStockModalOpen(false)}
        products={products}
        onOpenRestock={onOpenRestock}
        onNavigateToStock={onNavigateToStock}
        onAddToCart={(p) => {
          addToCart(p);
          setIsLowStockModalOpen(false);
        }}
      />
    </section>
  );
};
