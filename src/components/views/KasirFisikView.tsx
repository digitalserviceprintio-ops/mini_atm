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
  Tag,
  Percent,
  Coins,
  Award,
  UserCheck,
  Banknote,
  AlertCircle,
  Receipt,
} from 'lucide-react';
import { CartItem, CustomerMember, MemberVoucherClaim, PointExchangeSettings, Product, UserRole } from '../../types';
import { formatRp } from '../../utils/formatters';
import { ModalBarcodeCameraScanner } from '../modals/ModalBarcodeCameraScanner';
import { ModalLowStockAlert } from '../modals/ModalLowStockAlert';
import { ModalItemDiscount } from '../modals/ModalItemDiscount';
import { playSuccessBeep, playErrorBeep } from '../../utils/audioFeedback';
import { DigitalClock } from '../common/DigitalClock';

interface KasirFisikViewProps {
  products?: Product[];
  members?: CustomerMember[];
  pointSettings?: PointExchangeSettings;
  activeVouchers?: MemberVoucherClaim[];
  currentRole: UserRole;
  operatorName?: string;
  onOpenNewProduct: (initialBarcode?: string) => void;
  onNavigateToStock: () => void;
  onNavigateToReport: () => void;
  onNavigateToHistoryPos?: () => void;
  onCheckoutPOS: (
    cart: CartItem[],
    total: number,
    paymentMethod: string,
    customerName?: string,
    notes?: string,
    memberId?: string,
    pointsRedeemed?: number,
    discountFromPoints?: number,
    voucherClaimId?: string,
    cashReceived?: number,
    changeAmount?: number
  ) => void;
  onOpenRestock?: (product: Product) => void;
}

export const KasirFisikView: React.FC<KasirFisikViewProps> = ({
  products = [],
  members = [],
  pointSettings = { minPointsRedeem: 50, pointsPerStep: 50, rupiahPerStep: 5000, enableDirectDiscounts: true },
  activeVouchers = [],
  currentRole,
  operatorName = 'Kasir',
  onOpenNewProduct,
  onNavigateToStock,
  onNavigateToReport,
  onNavigateToHistoryPos,
  onCheckoutPOS,
  onOpenRestock,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [paymentMethod, setPaymentMethod] = useState<string>('Tunai');
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Point & Voucher Redemption State in POS
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>('');

  // Cash Received & Change (Kembalian) State
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const memberPoints = selectedMember?.points || 0;
  const minPoints = pointSettings?.minPointsRedeem ?? 50;

  // Active POS vouchers for selected member
  const memberAvailableVouchers = activeVouchers.filter(
    (v) => v.memberId === selectedMemberId && v.status === 'ACTIVE' && (v.category === 'DISCOUNT_POS' || v.category === 'DISCOUNT_TRX')
  );

  // Reset redemption when member changes
  useEffect(() => {
    setPointsToRedeem(0);
    setSelectedVoucherId('');
  }, [selectedMemberId]);

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

  // Per-item discount modal state
  const [discountingItem, setDiscountingItem] = useState<CartItem | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState<boolean>(false);

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
    setCashReceivedInput('');
  };

  // Calculate discount amount for a single item
  const getItemDiscountAmount = (item: CartItem): number => {
    if (!item.discountValue || item.discountValue <= 0) return 0;
    const gross = item.price * item.qty;
    if (item.discountType === 'percent') {
      const rate = Math.min(100, Math.max(0, item.discountValue));
      return Math.round((gross * rate) / 100);
    } else {
      const perUnit = Math.min(item.price, Math.max(0, item.discountValue));
      return perUnit * item.qty;
    }
  };

  const handleApplyDiscount = (
    itemId: string,
    discountType: 'percent' | 'nominal',
    discountValue: number
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const discountAmount =
            discountType === 'percent'
              ? Math.round((item.price * item.qty * Math.min(100, Math.max(0, discountValue))) / 100)
              : Math.min(item.price, Math.max(0, discountValue)) * item.qty;
          return {
            ...item,
            discountType,
            discountValue,
            discountAmount,
          };
        }
        return item;
      })
    );
    playSuccessBeep();
    showToast(
      'success',
      'Diskon Diterapkan',
      `Diskon ${discountType === 'percent' ? `${discountValue}%` : formatRp(discountValue)} berhasil dipasang.`
    );
  };

  const handleRemoveDiscount = (itemId: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const { discountType, discountValue, discountAmount, ...rest } = item;
          return rest as CartItem;
        }
        return item;
      })
    );
    showToast('success', 'Diskon Dihapus', 'Potongan diskon pada item telah direset.');
  };

  const grossTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalDiscount = cart.reduce((acc, item) => acc + getItemDiscountAmount(item), 0);
  const baseCartTotal = Math.max(0, grossTotal - totalDiscount);

  // Calculate discount from points or selected voucher
  let discountFromPoints = 0;
  if (selectedVoucherId) {
    const v = memberAvailableVouchers.find((vch) => vch.id === selectedVoucherId);
    if (v) {
      discountFromPoints = Math.min(baseCartTotal, v.discountValue || 5000);
    }
  } else if (pointsToRedeem >= minPoints) {
    const steps = Math.floor(pointsToRedeem / (pointSettings?.pointsPerStep || 50));
    const calculatedDisc = steps * (pointSettings?.rupiahPerStep || 5000);
    discountFromPoints = Math.min(baseCartTotal, calculatedDisc);
  }

  const finalCartTotal = Math.max(0, baseCartTotal - discountFromPoints);
  const cartCost = cart.reduce(
    (acc, item) =>
      acc + (item.buyPrice !== undefined ? item.buyPrice : item.price * 0.8) * item.qty,
    0
  );
  const cartProfit = finalCartTotal - cartCost;
  const profitMarginPct = finalCartTotal > 0 ? Math.round((cartProfit / finalCartTotal) * 100) : 0;
  const totalCartQty = cart.reduce((acc, item) => acc + item.qty, 0);

  // Cash Received & Change Calculations
  const parsedCashReceived = cashReceivedInput.trim()
    ? parseFloat(cashReceivedInput.replace(/[^0-9]/g, '')) || 0
    : 0;
  const effectiveCashReceived = paymentMethod === 'Tunai' ? parsedCashReceived : finalCartTotal;
  const changeAmount = effectiveCashReceived > 0 ? effectiveCashReceived - finalCartTotal : 0;
  const isCashInsufficient = paymentMethod === 'Tunai' && effectiveCashReceived > 0 && changeAmount < 0;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Tunai' && effectiveCashReceived > 0 && changeAmount < 0) {
      playErrorBeep();
      showToast(
        'error',
        'Uang Tunai Kurang',
        `Nominal uang diterima (${formatRp(effectiveCashReceived)}) kurang ${formatRp(
          Math.abs(changeAmount)
        )} dari total tagihan.`
      );
      return;
    }

    const cartWithCalculatedDiscounts = cart.map((item) => ({
      ...item,
      discountAmount: getItemDiscountAmount(item),
    }));

    const selectedMember = members.find((m) => m.id === selectedMemberId);
    const finalCustomerName = selectedMember ? selectedMember.name : customerName.trim() || undefined;

    const finalCashReceived = paymentMethod === 'Tunai'
      ? (effectiveCashReceived > 0 ? effectiveCashReceived : finalCartTotal)
      : finalCartTotal;
    const finalChangeAmount = paymentMethod === 'Tunai' ? Math.max(0, changeAmount) : 0;

    onCheckoutPOS(
      cartWithCalculatedDiscounts,
      finalCartTotal,
      paymentMethod,
      finalCustomerName,
      notes.trim() || undefined,
      selectedMemberId || undefined,
      pointsToRedeem > 0 ? pointsToRedeem : undefined,
      discountFromPoints > 0 ? discountFromPoints : undefined,
      selectedVoucherId || undefined,
      finalCashReceived,
      finalChangeAmount
    );
    clearCart();
    setSelectedMemberId('');
    setPointsToRedeem(0);
    setSelectedVoucherId('');
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

          {onNavigateToHistoryPos && (
            <button
              onClick={onNavigateToHistoryPos}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Buka menu riwayat transaksi & struk kasir POS"
            >
              <Receipt className="w-4 h-4 text-emerald-700" />
              <span>Riwayat Struk POS</span>
            </button>
          )}

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
            <div className="divide-y divide-slate-100 my-2 max-h-64 overflow-y-auto" id="posCartItems">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs space-y-1">
                  <ShoppingCart className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                  <p className="font-semibold text-slate-500">Keranjang masih kosong</p>
                  <p className="text-[10px] text-slate-400">
                    Scan barcode barang atau klik tombol Tambah di katalog.
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const itemDisc = getItemDiscountAmount(item);
                  const originalItemSubtotal = item.price * item.qty;
                  const finalItemSubtotal = Math.max(0, originalItemSubtotal - itemDisc);

                  return (
                    <div key={item.id} className="py-2.5 space-y-1.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="overflow-hidden flex-1">
                          <span className="font-semibold text-slate-900 block truncate">{item.name}</span>
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>
                              {formatRp(item.price)} &times; {item.qty}
                            </span>

                            {/* Discount Tag / Trigger Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setDiscountingItem(item);
                                setIsDiscountModalOpen(true);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                itemDisc > 0
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 shadow-2xs'
                                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200'
                              }`}
                              title="Beri / sesuaikan diskon item ini"
                            >
                              <Tag className="w-2.5 h-2.5 text-emerald-600" />
                              <span>
                                {itemDisc > 0
                                  ? item.discountType === 'percent'
                                    ? `Diskon ${item.discountValue}%`
                                    : `Diskon -${formatRp(item.discountValue || 0)}`
                                  : '+ Diskon'}
                              </span>
                            </button>

                            {itemDisc > 0 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDiscount(item.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus Diskon"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Qty +/- Control */}
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

                          {/* Subtotal with Strikethrough if Discounted */}
                          <div className="w-20 text-right shrink-0">
                            {itemDisc > 0 && (
                              <span className="text-[10px] text-slate-400 line-through block font-mono">
                                {formatRp(originalItemSubtotal)}
                              </span>
                            )}
                            <span className="font-bold text-slate-900 font-mono text-xs block">
                              {formatRp(finalItemSubtotal)}
                            </span>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Applied Discount Highlight Banner per item */}
                      {itemDisc > 0 && (
                        <div className="flex items-center justify-between text-[10px] bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/70 text-emerald-800">
                          <span className="flex items-center gap-1 font-medium">
                            <Tag className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Potongan Diskon Produk:</span>
                          </span>
                          <span className="font-mono font-bold text-emerald-700">
                            - {formatRp(itemDisc)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Optional Customer, Member & Payment Method */}
            {cart.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                {/* Member Selector */}
                <div className="bg-gradient-to-br from-amber-500/10 via-blue-50/40 to-transparent p-2.5 rounded-xl border border-amber-300/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>Member Pelanggan (+1 Poin)</span>
                    </label>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.2 rounded font-mono">
                      REWARD
                    </span>
                  </div>

                  <select
                    value={selectedMemberId}
                    onChange={(e) => {
                      setSelectedMemberId(e.target.value);
                      const m = members.find((mem) => mem.id === e.target.value);
                      if (m) {
                        setCustomerName(m.name);
                      }
                    }}
                    className="w-full p-2 border border-amber-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
                  >
                    <option value="">-- Bukan Member / Pelanggan Umum --</option>
                    {members
                      .filter((m) => m.status === 'ACTIVE')
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          👑 [{m.tier}] {m.name} ({m.phone}) - {m.points} Poin
                        </option>
                      ))}
                  </select>

                  {selectedMember && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px] bg-amber-100/90 px-2.5 py-1 rounded-md text-amber-950 font-medium">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Member: <strong>{selectedMember.name}</strong></span>
                        </span>
                        <span className="font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded font-mono">
                          {memberPoints} Poin Tersedia
                        </span>
                      </div>

                      {/* Section Penukaran Poin (Minimal 50 Poin) */}
                      {memberPoints >= minPoints ? (
                        <div className="bg-white p-2.5 rounded-lg border border-amber-300/80 space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 text-amber-600" />
                              <span>Tukar Poin Diskon (Min. {minPoints} Poin):</span>
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              Poin Cukup ({memberPoints} Poin)
                            </span>
                          </div>

                          {/* Quick Points Redeem Selector */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPointsToRedeem(0);
                                setSelectedVoucherId('');
                              }}
                              className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                pointsToRedeem === 0 && !selectedVoucherId
                                  ? 'bg-slate-800 text-white border-slate-800'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              Tanpa Diskon
                            </button>

                            {/* 50 Points */}
                            <button
                              type="button"
                              onClick={() => {
                                setPointsToRedeem(50);
                                setSelectedVoucherId('');
                              }}
                              className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                pointsToRedeem === 50
                                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              50 Poin (-Rp 5k)
                            </button>

                            {/* 100 Points */}
                            {memberPoints >= 100 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPointsToRedeem(100);
                                  setSelectedVoucherId('');
                                }}
                                className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  pointsToRedeem === 100
                                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                100 Poin (-Rp 10k)
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="py-1 px-1.5 rounded-lg text-[10px] font-medium border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                              >
                                100 Poin (Kurang)
                              </button>
                            )}
                          </div>

                          {/* Member's Active Vouchers Option */}
                          {memberAvailableVouchers.length > 0 && (
                            <div className="pt-1 border-t border-slate-100">
                              <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                                Atau Gunakan Voucher Belanja POS Milik Member:
                              </label>
                              <select
                                value={selectedVoucherId}
                                onChange={(e) => {
                                  setSelectedVoucherId(e.target.value);
                                  if (e.target.value) setPointsToRedeem(0);
                                }}
                                className="w-full p-1.5 border border-emerald-300 rounded-lg text-[11px] bg-emerald-50/50 text-emerald-950 focus:ring-1 focus:ring-emerald-500 font-medium"
                              >
                                <option value="">-- Pilih Kupon / Voucher Kasir --</option>
                                {memberAvailableVouchers.map((vch) => (
                                  <option key={vch.id} value={vch.id}>
                                    🎟️ {vch.rewardName} ({vch.voucherCode}) - Diskon {formatRp(vch.discountValue)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Discount Summary Banner */}
                          {discountFromPoints > 0 && (
                            <div className="flex items-center justify-between p-1.5 bg-emerald-100/90 rounded-md text-emerald-900 text-[11px] font-bold border border-emerald-300">
                              <span className="flex items-center gap-1">
                                <Tag className="w-3.5 h-3.5 text-emerald-700" />
                                <span>
                                  {selectedVoucherId ? 'Voucher Diterapkan:' : `Tukar ${pointsToRedeem} Poin:`}
                                </span>
                              </span>
                              <span className="font-mono text-emerald-800">
                                - {formatRp(discountFromPoints)} (Poin Otomatis Berkurang)
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-[10px] text-amber-800 flex items-center justify-between">
                          <span>Minimal penukaran poin adalah <strong>{minPoints} Poin</strong>.</span>
                          <span className="font-semibold text-amber-900">(Kurang {minPoints - memberPoints} Poin lagi)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!selectedMemberId && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nama Pelanggan (Umum)
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Pak Budi / Pelanggan Toko"
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                )}

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

                {/* Input Nominal Uang Diterima & Kembalian (Khusus Tunai) */}
                {paymentMethod === 'Tunai' && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span>Nominal Uang Tunai Diterima:</span>
                      </label>
                      {effectiveCashReceived > 0 && (
                        <span className="text-[11px] font-mono text-slate-500 font-semibold">
                          {formatRp(effectiveCashReceived)}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          cashReceivedInput
                            ? parseInt(cashReceivedInput.replace(/[^0-9]/g, '') || '0', 10).toLocaleString('id-ID')
                            : ''
                        }
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '');
                          setCashReceivedInput(raw);
                        }}
                        placeholder={`Contoh: ${finalCartTotal.toLocaleString('id-ID')}`}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Tombol Cepat Nominal Uang */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setCashReceivedInput(String(finalCartTotal))}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        ⚡ Uang Pas ({formatRp(finalCartTotal)})
                      </button>

                      {[10000, 20000, 50000, 100000, 200000, 500000].map((nom) => {
                        if (nom < finalCartTotal && nom !== 50000 && nom !== 100000) return null;
                        return (
                          <button
                            key={nom}
                            type="button"
                            onClick={() => setCashReceivedInput(String(nom))}
                            className={`px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                              effectiveCashReceived === nom ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' : ''
                            }`}
                          >
                            {formatRp(nom)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Status Kembalian Real-time */}
                    {effectiveCashReceived > 0 && (
                      <div
                        className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
                          changeAmount >= 0
                            ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                            : 'bg-rose-50 border-rose-300 text-rose-800'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-bold">
                          {changeAmount >= 0 ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              <span>Kembalian:</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                              <span>Uang Masih Kurang:</span>
                            </>
                          )}
                        </span>
                        <span className="font-mono text-sm font-extrabold">
                          {changeAmount >= 0
                            ? formatRp(changeAmount)
                            : `- ${formatRp(Math.abs(changeAmount))}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2.5">
            {/* Breakdown Subtotal, Total Discount, and Net Total */}
            {cart.length > 0 && (
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Subtotal Kotor ({totalCartQty} item):</span>
                  <span className="font-mono">{formatRp(grossTotal)}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-600" />
                      <span>Total Diskon Produk:</span>
                    </span>
                    <span className="font-mono">- {formatRp(totalDiscount)}</span>
                  </div>
                )}

                {discountFromPoints > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-600" />
                      <span>Potongan Poin / Voucher Member:</span>
                    </span>
                    <span className="font-mono">- {formatRp(discountFromPoints)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-emerald-900 pt-1 border-t border-slate-200">
                  <span className="text-[11px] flex items-center gap-1 font-medium">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    Estimasi Laba Bersih:
                  </span>
                  <span className="font-mono font-bold text-emerald-800">
                    +{formatRp(cartProfit)} ({profitMarginPct}%)
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Kasir Bertugas:</span>
                  <span className="font-semibold text-slate-700">{operatorName}</span>
                </div>

                {paymentMethod === 'Tunai' && effectiveCashReceived > 0 && (
                  <div className="pt-1.5 border-t border-slate-200 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-700">
                      <span>Uang Tunai Diterima:</span>
                      <span className="font-mono font-semibold">{formatRp(effectiveCashReceived)}</span>
                    </div>
                    <div className={`flex justify-between font-bold ${changeAmount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      <span>{changeAmount >= 0 ? 'Kembalian Pelanggan:' : 'Kekurangan Uang:'}</span>
                      <span className="font-mono">{changeAmount >= 0 ? formatRp(changeAmount) : `- ${formatRp(Math.abs(changeAmount))}`}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center font-bold text-sm">
              <div>
                <span className="text-slate-700 block">Total Tagihan POS:</span>
                {(totalDiscount > 0 || discountFromPoints > 0) && (
                  <span className="text-[10px] text-emerald-700 font-semibold block">
                    (Hemat {formatRp(totalDiscount + discountFromPoints)})
                  </span>
                )}
              </div>
              <span id="posTotal" className="text-blue-900 text-lg font-mono font-bold">
                {formatRp(finalCartTotal)}
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

      {/* Modal Atur Diskon Per-Item */}
      <ModalItemDiscount
        isOpen={isDiscountModalOpen}
        item={discountingItem}
        onClose={() => {
          setIsDiscountModalOpen(false);
          setDiscountingItem(null);
        }}
        onApplyDiscount={(itemId, type, val) => {
          handleApplyDiscount(itemId, type, val);
        }}
        onRemoveDiscount={(itemId) => {
          handleRemoveDiscount(itemId);
        }}
      />
    </section>
  );
};
