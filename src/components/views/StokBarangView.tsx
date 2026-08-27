import React, { useState, useMemo } from 'react';
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PackagePlus,
  PackageMinus,
  Edit2,
  Trash2,
  Download,
  Printer,
  TrendingUp,
  History,
  Barcode,
  Layers,
  Sparkles,
  ArrowUpDown,
  Camera,
  X,
} from 'lucide-react';
import { Product, StockAdjustmentLog, UserRole } from '../../types';
import { formatRp } from '../../utils/formatters';
import { ModalBarcodeCameraScanner } from '../modals/ModalBarcodeCameraScanner';
import { playSuccessBeep, playErrorBeep } from '../../utils/audioFeedback';

interface StokBarangViewProps {
  products?: Product[];
  stockLogs?: StockAdjustmentLog[];
  currentRole: UserRole;
  operatorName?: string;
  onOpenNewProduct: (initialBarcode?: string) => void;
  onOpenEditProduct?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenRestock?: (product: Product) => void;
  onRestock?: (product: Product) => void;
  onOpenAdjust?: (product: Product) => void;
  onAdjustStock?: (product: Product) => void;
  onNavigateToPOS?: () => void;
}

type StockFilterStatus = 'ALL' | 'READY' | 'LOW' | 'EMPTY';

export const StokBarangView: React.FC<StokBarangViewProps> = ({
  products = [],
  stockLogs = [],
  currentRole,
  operatorName = 'Operator',
  onOpenNewProduct,
  onOpenEditProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenRestock,
  onRestock,
  onOpenAdjust,
  onAdjustStock,
  onNavigateToPOS,
}) => {
  const handleEdit = onOpenEditProduct || onEditProduct;
  const handleRestock = onOpenRestock || onRestock;
  const handleAdjust = onOpenAdjust || onAdjustStock;

  const [search, setSearch] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [stockStatus, setStockStatus] = useState<StockFilterStatus>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'katalog' | 'riwayat_mutasi'>('katalog');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [scanToast, setScanToast] = useState<{ message: string; type: 'success' | 'info' | 'error'; barcode?: string } | null>(null);

  const handleBarcodeScanned = (scannedCode: string) => {
    const code = scannedCode.trim().toLowerCase();
    if (!code) return { success: false, message: 'Kode barcode kosong.' };

    const target = (products || []).find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === code) ||
        p.id.toLowerCase() === code ||
        p.name.toLowerCase() === code
    );

    if (target) {
      playSuccessBeep();
      setSearch(target.barcode || target.name);
      setScanToast({
        message: `Produk "${target.name}" ditemukan (Stok: ${target.stock} ${target.unit || 'pcs'}).`,
        type: 'success',
      });
      setTimeout(() => setScanToast(null), 5000);
      return {
        success: true,
        message: `Produk "${target.name}" ditemukan!`,
      };
    } else {
      playErrorBeep();
      setScanToast({
        message: `Barcode "${scannedCode}" belum terdaftar di katalog produk.`,
        type: 'info',
        barcode: scannedCode.trim(),
      });
      setTimeout(() => setScanToast(null), 8000);
      return {
        success: false,
        message: `Barcode "${scannedCode}" tidak ditemukan di database.`,
      };
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach((p) => {
      if (p && p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      if (!p) return false;
      const matchCat = selectedCat === 'ALL' || p.category === selectedCat;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));

      const min = p.minStock !== undefined ? p.minStock : 5;
      let matchStatus = true;
      if (stockStatus === 'EMPTY') {
        matchStatus = p.stock <= 0;
      } else if (stockStatus === 'LOW') {
        matchStatus = p.stock > 0 && p.stock <= min;
      } else if (stockStatus === 'READY') {
        matchStatus = p.stock > min;
      }

      return matchCat && matchSearch && matchStatus;
    });
  }, [products, selectedCat, search, stockStatus]);

  // Overall Stock Metrics
  const metrics = useMemo(() => {
    let totalItems = products.length;
    let totalUnits = 0;
    let totalAssetValue = 0;
    let totalPotentialRevenue = 0;
    let countLow = 0;
    let countEmpty = 0;

    products.forEach((p) => {
      totalUnits += p.stock;
      const modal = p.buyPrice !== undefined ? p.buyPrice : p.price * 0.8;
      totalAssetValue += p.stock * modal;
      totalPotentialRevenue += p.stock * p.price;

      const min = p.minStock !== undefined ? p.minStock : 5;
      if (p.stock <= 0) {
        countEmpty++;
      } else if (p.stock <= min) {
        countLow++;
      }
    });

    const potentialGrossProfit = totalPotentialRevenue - totalAssetValue;

    return {
      totalItems,
      totalUnits,
      totalAssetValue,
      totalPotentialRevenue,
      potentialGrossProfit,
      countLow,
      countEmpty,
    };
  }, [products]);

  // Export Stock to CSV
  const handleExportStockCSV = () => {
    const headers = [
      'ID Produk',
      'Barcode/SKU',
      'Nama Produk',
      'Kategori',
      'Harga Beli/Modal (Rp)',
      'Harga Jual (Rp)',
      'Laba Satuan (Rp)',
      'Stok Saat Ini',
      'Min Alert',
      'Satuan',
      'Nilai Aset Modal (Rp)',
      'Status Stok',
      'Restock Terakhir',
    ];

    const rows = products.map((p) => {
      const modal = p.buyPrice !== undefined ? p.buyPrice : 0;
      const profit = p.price - modal;
      const min = p.minStock !== undefined ? p.minStock : 5;
      const status = p.stock <= 0 ? 'HABIS' : p.stock <= min ? 'MENIPIS' : 'AMAN';
      const asset = p.stock * modal;

      return [
        `"${p.id}"`,
        `"${p.barcode || '-'}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category || '-'}"`,
        modal,
        p.price,
        profit,
        p.stock,
        min,
        `"${p.unit || 'pcs'}"`,
        asset,
        `"${status}"`,
        `"${p.lastRestockDate || '-'}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan_Stok_Barang_Fisik_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Stock Summary
  const handlePrintStock = () => {
    window.print();
  };

  return (
    <section id="view-stok-barang" className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-700" />
            <span>Manajemen Stok Barang Fisik & Inventaris POS</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kelola data barang, harga beli modal (HPP), harga jual, restock kulakan, dan kontrol peringatan stok minimum.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportStockCSV}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintStock}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Cetak Rekap Stok"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Stok</span>
          </button>

          <button
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Scan barcode fisik menggunakan kamera perangkat"
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Scan Barcode</span>
          </button>

          {currentRole === 'Admin' && (
            <button
              onClick={() => onOpenNewProduct()}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Tambah Produk Fisik</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards: Stock & Asset Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Total Item & Unit */}
        <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-blue-800 font-bold uppercase tracking-wider">
              Total Fisik & Variasi
            </span>
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 leading-tight">
            {metrics.totalUnits} <span className="text-xs font-normal text-slate-500">Unit Fisik</span>
          </p>
          <span className="text-[10px] text-slate-500 block">
            Terbagi dalam <strong>{metrics.totalItems}</strong> macam SKU produk
          </span>
        </div>

        {/* Total Nilai Aset Modal (HPP) */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-700 font-bold uppercase tracking-wider">
              Nilai Aset Modal (HPP)
            </span>
            <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 leading-tight">
            {formatRp(metrics.totalAssetValue)}
          </p>
          <span className="text-[10px] text-slate-500 block">
            Total modal tertanam dalam inventori toko
          </span>
        </div>

        {/* Estimasi Potensi Omzet & Laba */}
        <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
              Potensi Laba Stok
            </span>
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-700 leading-tight">
            +{formatRp(metrics.potentialGrossProfit)}
          </p>
          <span className="text-[10px] text-slate-500 block">
            Jika seluruh stok terjual: {formatRp(metrics.totalPotentialRevenue)}
          </span>
        </div>

        {/* Peringatan Stok Menipis / Habis */}
        <div
          className={`border p-4 rounded-2xl shadow-xs space-y-1 ${
            metrics.countEmpty > 0
              ? 'bg-rose-50/50 border-rose-300'
              : metrics.countLow > 0
              ? 'bg-amber-50/50 border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                metrics.countEmpty > 0
                  ? 'text-rose-800'
                  : metrics.countLow > 0
                  ? 'text-amber-800'
                  : 'text-slate-700'
              }`}
            >
              Alert Stok Inventaris
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                metrics.countEmpty > 0
                  ? 'bg-rose-100 text-rose-700'
                  : metrics.countLow > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {metrics.countEmpty > 0 ? (
                <XCircle className="w-4 h-4" />
              ) : metrics.countLow > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-rose-700">{metrics.countEmpty} Habis</span>
            <span className="text-xs font-semibold text-amber-700">| {metrics.countLow} Menipis</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            {metrics.countEmpty + metrics.countLow === 0
              ? 'Seluruh persediaan dalam kondisi aman'
              : 'Perlu segera dilakukan kulakan / restock'}
          </span>
        </div>
      </div>

      {/* Sub-Tabs: Daftar Stok vs Log Riwayat Mutasi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('katalog')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'katalog'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Daftar Stok Produk Fisik ({products.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('riwayat_mutasi')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'riwayat_mutasi'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Log Kartu Stok & Penyesuaian ({stockLogs.length})</span>
            </button>
          </div>

          <span className="text-xs text-slate-500">
            Operator Aktif: <strong>{operatorName}</strong> ({currentRole})
          </span>
        </div>

        {/* SUBTAB 1: DAFTAR STOK BARANG */}
        {activeSubTab === 'katalog' && (
          <div className="space-y-4">
            {/* Scan Toast Feedback */}
            {scanToast && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-150 ${
                  scanToast.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : scanToast.type === 'info'
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {scanToast.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
                  )}
                  <span>{scanToast.message}</span>
                </div>

                <div className="flex items-center gap-2">
                  {scanToast.barcode && currentRole === 'Admin' && (
                    <button
                      onClick={() => {
                        onOpenNewProduct(scanToast.barcode);
                        setScanToast(null);
                      }}
                      className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow-2xs"
                    >
                      + Tambah Produk dengan SKU Ini
                    </button>
                  )}
                  <button
                    onClick={() => setScanToast(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Bar with Camera Scanner */}
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama barang, barcode, SKU produk..."
                    className="w-full text-xs pl-10 pr-9 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-slate-50/50"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsCameraScannerOpen(true)}
                  className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-2xs transition-all cursor-pointer shrink-0"
                  title="Pindai barcode barang fisik pakai kamera"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">Scan SKU</span>
                </button>
              </div>

              {/* Filter Status Stok */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto">
                <button
                  onClick={() => setStockStatus('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    stockStatus === 'ALL'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Stok ({products.length})
                </button>
                <button
                  onClick={() => setStockStatus('READY')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    stockStatus === 'READY'
                      ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Aman
                </button>
                <button
                  onClick={() => setStockStatus('LOW')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    stockStatus === 'LOW'
                      ? 'bg-white text-amber-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Menipis ({metrics.countLow})
                </button>
                <button
                  onClick={() => setStockStatus('EMPTY')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    stockStatus === 'EMPTY'
                      ? 'bg-white text-rose-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Habis ({metrics.countEmpty})
                </button>
              </div>
            </div>

            {/* Category Pills & Alert Notice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
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

              {metrics.countEmpty + metrics.countLow > 0 && (
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-xl text-[11px] font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>
                    <strong>{metrics.countEmpty + metrics.countLow} Produk</strong> di bawah / sama dengan batas minimum (Stok ≤ Min).
                  </span>
                </div>
              )}
            </div>

            {/* Table Products & Stock */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="p-3.5">SKU / Barcode</th>
                    <th className="p-3.5">Nama Produk</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5 text-right">Modal Beli (HPP)</th>
                    <th className="p-3.5 text-right">Harga Jual</th>
                    <th className="p-3.5 text-right">Laba Satuan</th>
                    <th className="p-3.5 text-center">Stok Fisik</th>
                    <th className="p-3.5 text-right">Nilai Aset Modal</th>
                    <th className="p-3.5 text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-8 text-slate-400">
                        Tidak ada produk yang cocok dengan pencarian atau filter status.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => {
                      const modal = prod.buyPrice !== undefined ? prod.buyPrice : prod.price * 0.8;
                      const unitProfit = prod.price - modal;
                      const marginPct =
                        prod.price > 0 ? Math.round((unitProfit / prod.price) * 100) : 0;
                      const min = prod.minStock !== undefined ? prod.minStock : 5;
                      const isEmpty = prod.stock <= 0;
                      const isUnderOrEqualMin = prod.stock <= min;
                      const totalAsset = prod.stock * modal;

                      return (
                        <tr
                          key={prod.id}
                          className={`transition-colors ${
                            isUnderOrEqualMin
                              ? 'bg-red-50/70 hover:bg-red-100/60 border-l-4 border-l-red-600'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* SKU/Barcode */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {prod.barcode || prod.id}
                            </span>
                          </td>

                          {/* Nama Produk */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">{prod.name}</span>
                              {isUnderOrEqualMin && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 shadow-2xs">
                                  <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                                  <span>Peringatan: Stok ≤ Min ({prod.stock}/{min})</span>
                                </span>
                              )}
                            </div>
                            {prod.lastRestockDate && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Restock: {prod.lastRestockDate}
                              </span>
                            )}
                          </td>

                          {/* Kategori */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                              {prod.category || 'Umum'}
                            </span>
                          </td>

                          {/* Modal Beli */}
                          <td className="p-3.5 text-right font-mono text-slate-700">
                            {formatRp(modal)}
                          </td>

                          {/* Harga Jual */}
                          <td className="p-3.5 text-right font-mono font-bold text-blue-900">
                            {formatRp(prod.price)}
                          </td>

                          {/* Laba Satuan & Margin */}
                          <td className="p-3.5 text-right font-mono whitespace-nowrap">
                            <span className="text-emerald-700 font-bold">
                              +{formatRp(unitProfit)}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium ml-1 block">
                              ({marginPct}%)
                            </span>
                          </td>

                          {/* Stok Fisik & Badge */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <span
                                className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                                  isUnderOrEqualMin
                                    ? 'bg-red-100 text-red-800 border-red-400 shadow-2xs'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                }`}
                              >
                                {isUnderOrEqualMin && (
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                )}
                                <span>{prod.stock} {prod.unit || 'pcs'}</span>
                              </span>
                            </div>
                            {isUnderOrEqualMin && (
                              <span className="text-[10px] text-red-700 font-bold block mt-1">
                                {isEmpty ? 'Habis (0)!' : `Kritis (Batas Min: ${min})`}
                              </span>
                            )}
                            {!isUnderOrEqualMin && (
                              <span className="text-[9px] text-slate-400 block mt-0.5">
                                Min: {min}
                              </span>
                            )}
                          </td>

                          {/* Nilai Total Aset Modal */}
                          <td className="p-3.5 text-right font-mono font-semibold text-slate-900">
                            {formatRp(totalAsset)}
                          </td>

                          {/* Aksi Cepat */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {/* + Restock */}
                              <button
                                onClick={() => handleRestock && handleRestock(prod)}
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  isUnderOrEqualMin
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                                title="Tambah Stok (Restock Kulakan)"
                              >
                                <PackagePlus className="w-3.5 h-3.5" />
                              </button>

                              {/* - Kurangi / Koreksi */}
                              <button
                                onClick={() => handleAdjust && handleAdjust(prod)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                                title="Koreksi / Kurangi Stok (Rusak / Opname)"
                              >
                                <PackageMinus className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Master Product (Admin) */}
                              {currentRole === 'Admin' && (
                                <button
                                  onClick={() => handleEdit && handleEdit(prod)}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                  title="Edit Data Produk"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Product (Admin) */}
                              {currentRole === 'Admin' && (
                                <button
                                  onClick={() => onDeleteProduct(prod.id)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Produk"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 2: LOG RIWAYAT MUTASI & KARTU STOK */}
        {activeSubTab === 'riwayat_mutasi' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span>
                Catatan riwayat pergerakan stok keluar-masuk (Restock Kulakan, Penjualan POS, dan Penyesuaian Manual).
              </span>
              <span className="font-mono font-bold text-slate-800">
                {stockLogs.length} Aktivitas Tercatat
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Nama Produk</th>
                    <th className="p-3">Jenis Mutasi</th>
                    <th className="p-3 text-center">Perubahan Qty</th>
                    <th className="p-3 text-center">Sebelum → Sesudah</th>
                    <th className="p-3">Alasan / Catatan Operator</th>
                    <th className="p-3">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {stockLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-slate-400">
                        Belum ada riwayat mutasi stok tercatat.
                      </td>
                    </tr>
                  ) : (
                    stockLogs.map((log) => {
                      const isPositive = log.qtyChange > 0;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                            {log.time}
                          </td>
                          <td className="p-3 font-bold text-slate-900">{log.productName}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                log.type === 'RESTOCK'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.type === 'PENJUALAN_POS'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {log.type === 'RESTOCK'
                                ? 'RESTOCK MASUK'
                                : log.type === 'PENJUALAN_POS'
                                ? 'PENJUALAN POS'
                                : 'KOREKSI / RUSAK'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold whitespace-nowrap">
                            <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                              {isPositive ? `+${log.qtyChange}` : log.qtyChange}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-slate-600 whitespace-nowrap">
                            {log.stockBefore} → <strong className="text-slate-900">{log.stockAfter}</strong>
                          </td>
                          <td className="p-3 text-slate-700 text-[11px]">{log.reason || '-'}</td>
                          <td className="p-3 font-semibold text-slate-800 text-[11px]">
                            {log.operatorName}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Barcode Scanner Kamera untuk Cek & Cari Stok */}
      <ModalBarcodeCameraScanner
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onBarcodeDetected={(code) => handleBarcodeScanned(code)}
      />
    </section>
  );
};
