import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Receipt,
  Download,
  Printer,
  Search,
  Filter,
  Calendar,
  User,
  Package,
  Layers,
  ChevronRight,
  Eye,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  Activity,
  RotateCcw,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  Line,
  ComposedChart,
} from 'recharts';
import { PosSale, PosSaleItem, Product, UserRole } from '../../types';
import { formatRp } from '../../utils/formatters';

interface LaporanPenjualanFisikViewProps {
  posSales?: PosSale[];
  sales?: PosSale[];
  products?: Product[];
  currentRole: UserRole;
  operatorName?: string;
  onVoidSale?: (saleId: string) => void;
  onReprintReceipt?: (sale: PosSale) => void;
  onNavigateToPOS?: () => void;
  onNavigateToStock?: () => void;
}

export type DatePeriodOption = 'ALL' | 'TODAY' | 'YESTERDAY' | '7D' | '30D' | 'CUSTOM';
type ChartViewMode = 'trend' | 'comparison' | 'products';
type ViewSubTab = 'transaksi' | 'produk' | 'kasir';

// Helper to parse Indonesian formatted date strings e.g. "26 Apr 2026 10:15"
function parseIndoDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) return isoDate;

  const indonesianMonths: { [key: string]: number } = {
    jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5,
    jul: 6, agu: 7, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11,
  };

  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthKey = parts[1].toLowerCase().slice(0, 3);
    const month = indonesianMonths[monthKey];
    const year = parseInt(parts[2], 10);

    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      let hours = 0;
      let minutes = 0;
      if (parts[3] && parts[3].includes(':')) {
        const timeParts = parts[3].split(':');
        hours = parseInt(timeParts[0], 10) || 0;
        minutes = parseInt(timeParts[1], 10) || 0;
      }
      return new Date(year, month, day, hours, minutes);
    }
  }
  return null;
}

export const LaporanPenjualanFisikView: React.FC<LaporanPenjualanFisikViewProps> = ({
  posSales,
  sales,
  products = [],
  currentRole,
  operatorName = 'Kasir',
  onVoidSale,
  onReprintReceipt,
  onNavigateToPOS,
  onNavigateToStock,
}) => {
  const actualSales = useMemo(() => {
    if (Array.isArray(posSales)) return posSales;
    if (Array.isArray(sales)) return sales;
    return [];
  }, [posSales, sales]);

  // Filters State
  const [period, setPeriod] = useState<DatePeriodOption>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedCashier, setSelectedCashier] = useState<string>('ALL');
  const [searchInvoice, setSearchInvoice] = useState<string>('');
  const [chartViewMode, setChartViewMode] = useState<ChartViewMode>('trend');
  const [activeSubTab, setActiveSubTab] = useState<ViewSubTab>('transaksi');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<PosSale | null>(null);

  // Cashiers list
  const cashiers = useMemo(() => {
    const set = new Set<string>();
    (actualSales || []).forEach((s) => {
      if (s && s.cashierName) set.add(s.cashierName);
    });
    return ['ALL', ...Array.from(set)];
  }, [actualSales]);

  // Filter posSales by period, custom date range, cashier, and search query
  const filteredSales = useMemo(() => {
    const now = new Date();
    // Reference base date (simulated system date if in prototype or real current date)
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return (actualSales || []).filter((sale) => {
      if (!sale) return false;

      // 1. Cashier filter
      if (selectedCashier !== 'ALL' && sale.cashierName !== selectedCashier) {
        return false;
      }

      // 2. Search invoice / items / customer
      if (searchInvoice.trim()) {
        const q = searchInvoice.toLowerCase().trim();
        const matchInv = sale.invoiceNumber && sale.invoiceNumber.toLowerCase().includes(q);
        const matchCust = sale.customerName && sale.customerName.toLowerCase().includes(q);
        const matchItem =
          Array.isArray(sale.items) &&
          sale.items.some((it) => it.productName && it.productName.toLowerCase().includes(q));
        if (!matchInv && !matchCust && !matchItem) return false;
      }

      // 3. Date Range Filter
      const saleDate = parseIndoDate(sale.time);

      if (period === 'ALL') {
        return true;
      }

      if (!saleDate) {
        // Fallback for items with non-parseable date strings
        return true;
      }

      const saleDay = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate()).getTime();

      if (period === 'TODAY') {
        // Match today's day
        const todayTime = todayMidnight.getTime();
        // Also support prototype date "26 Apr 2026"
        const isTodayText = sale.time && (sale.time.includes('26 Apr 2026') || sale.time.includes('Hari ini'));
        return saleDay === todayTime || isTodayText;
      }

      if (period === 'YESTERDAY') {
        const yesterdayTime = todayMidnight.getTime() - 24 * 60 * 60 * 1000;
        const isYesterdayText = sale.time && (sale.time.includes('25 Apr 2026') || sale.time.includes('Kemarin'));
        return saleDay === yesterdayTime || isYesterdayText;
      }

      if (period === '7D') {
        const sevenDaysAgo = todayMidnight.getTime() - 7 * 24 * 60 * 60 * 1000;
        // In prototype reference year 2026
        const ref2026April7DaysAgo = new Date(2026, 3, 19).getTime();
        return saleDay >= sevenDaysAgo || saleDay >= ref2026April7DaysAgo;
      }

      if (period === '30D') {
        const thirtyDaysAgo = todayMidnight.getTime() - 30 * 24 * 60 * 60 * 1000;
        const ref2026April30DaysAgo = new Date(2026, 2, 26).getTime();
        return saleDay >= thirtyDaysAgo || saleDay >= ref2026April30DaysAgo;
      }

      if (period === 'CUSTOM') {
        if (customStartDate) {
          const start = new Date(customStartDate + 'T00:00:00');
          if (saleDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate + 'T23:59:59');
          if (saleDate > end) return false;
        }
        return true;
      }

      return true;
    });
  }, [actualSales, selectedCashier, searchInvoice, period, customStartDate, customEndDate]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalGrossProfit = 0;
    let totalQty = 0;
    let totalTrx = (filteredSales || []).length;

    (filteredSales || []).forEach((s) => {
      if (!s) return;
      totalRevenue += s.totalRevenue || 0;
      totalCost += s.totalCost || 0;
      totalGrossProfit += s.grossProfit || 0;
      totalQty += s.totalQty || 0;
    });

    const profitMarginPct =
      totalRevenue > 0 ? Math.round((totalGrossProfit / totalRevenue) * 100) : 0;
    const avgBasketSize = totalTrx > 0 ? Math.round(totalRevenue / totalTrx) : 0;

    return {
      totalRevenue,
      totalCost,
      totalGrossProfit,
      profitMarginPct,
      totalQty,
      totalTrx,
      avgBasketSize,
    };
  }, [filteredSales]);

  // Product-level aggregation (item-by-item profit breakdown)
  const productPerformance = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        category: string;
        qtySold: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    >();

    (filteredSales || []).forEach((s) => {
      if (!s || !Array.isArray(s.items)) return;
      s.items.forEach((it) => {
        if (!it) return;
        const existing = map.get(it.productId) || {
          id: it.productId,
          name: it.productName || 'Produk',
          category: it.category || 'Umum',
          qtySold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        };

        existing.qtySold += it.qty || 0;
        existing.revenue += it.subtotal || 0;
        existing.cost += it.totalCost || 0;
        existing.profit += it.profit || 0;

        map.set(it.productId, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }, [filteredSales]);

  // Cashier Performance Aggregation
  const cashierPerformance = useMemo(() => {
    const map = new Map<
      string,
      {
        cashierName: string;
        role: string;
        trxCount: number;
        totalQty: number;
        revenue: number;
        profit: number;
      }
    >();

    (filteredSales || []).forEach((s) => {
      if (!s) return;
      const cName = s.cashierName || 'Kasir';
      const existing = map.get(cName) || {
        cashierName: cName,
        role: s.cashierRole || 'Kasir',
        trxCount: 0,
        totalQty: 0,
        revenue: 0,
        profit: 0,
      };

      existing.trxCount += 1;
      existing.totalQty += s.totalQty || 0;
      existing.revenue += s.totalRevenue || 0;
      existing.profit += s.grossProfit || 0;

      map.set(cName, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  // Timeline / Time-series Trend Data for Recharts
  const timelineTrendData = useMemo(() => {
    if (filteredSales.length === 0) return [];

    // Map by date string or chronological points
    const dateMap = new Map<
      string,
      {
        dateKey: string;
        displayDate: string;
        timestamp: number;
        totalRevenue: number;
        totalCost: number;
        grossProfit: number;
        totalTrx: number;
        totalQty: number;
      }
    >();

    // If all sales are within single day, group by hour/time; otherwise group by date
    const distinctDates = new Set<string>();
    filteredSales.forEach((s) => {
      const parts = (s.time || '').split(' ');
      const datePart = parts.slice(0, 3).join(' ');
      if (datePart) distinctDates.add(datePart);
    });

    const isSingleDayOrFew = distinctDates.size <= 1;

    filteredSales.forEach((s) => {
      const parsed = parseIndoDate(s.time);
      const timeParts = (s.time || '').split(' ');
      let groupKey = '';
      let displayLabel = '';

      if (isSingleDayOrFew) {
        // Group by hour/time or individual transactions if small batch
        const hourStr = timeParts[3] || '00:00';
        groupKey = hourStr;
        displayLabel = `${timeParts.slice(0, 2).join(' ')} ${hourStr}`;
      } else {
        // Group by Date (e.g. "26 Apr")
        groupKey = timeParts.slice(0, 2).join(' ') || (parsed ? `${parsed.getDate()} ${parsed.toLocaleString('id-ID', { month: 'short' })}` : 'Tgl');
        displayLabel = timeParts.slice(0, 3).join(' ') || groupKey;
      }

      const existing = dateMap.get(groupKey) || {
        dateKey: groupKey,
        displayDate: displayLabel,
        timestamp: parsed ? parsed.getTime() : 0,
        totalRevenue: 0,
        totalCost: 0,
        grossProfit: 0,
        totalTrx: 0,
        totalQty: 0,
      };

      existing.totalRevenue += s.totalRevenue || 0;
      existing.totalCost += s.totalCost || 0;
      existing.grossProfit += s.grossProfit || 0;
      existing.totalTrx += 1;
      existing.totalQty += s.totalQty || 0;

      dateMap.set(groupKey, existing);
    });

    return Array.from(dateMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredSales]);

  // Product Comparison Chart Data
  const productChartData = useMemo(() => {
    return productPerformance.slice(0, 7).map((p) => ({
      name: p.name.length > 15 ? p.name.slice(0, 13) + '...' : p.name,
      fullName: p.name,
      Omzet: p.revenue,
      Laba: p.profit,
      Modal: p.cost,
      Qty: p.qtySold,
    }));
  }, [productPerformance]);

  // Export Sales Report to CSV
  const handleExportCSV = () => {
    const headers = [
      'No. Invoice',
      'Waktu Transaksi',
      'Kasir',
      'Pelanggan',
      'Item Rincian',
      'Total Qty',
      'Total Penjualan / Omzet (Rp)',
      'Total Modal / HPP (Rp)',
      'Laba Bersih (Rp)',
      'Metode Pembayaran',
      'Catatan',
    ];

    const rows = filteredSales.map((s) => {
      const itemDetails = s.items
        .map((it) => `${it.productName} (${it.qty}x @${it.price})`)
        .join('; ');

      return [
        `"${s.invoiceNumber}"`,
        `"${s.time}"`,
        `"${s.cashierName}"`,
        `"${s.customerName || '-'}"`,
        `"${itemDetails.replace(/"/g, '""')}"`,
        s.totalQty,
        s.totalRevenue,
        s.totalCost,
        s.grossProfit,
        `"${s.paymentMethod}"`,
        `"${(s.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan_Kasir_Penjualan_Fisik_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetDateFilter = () => {
    setPeriod('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  return (
    <section id="view-laporan-penjualan-fisik" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-700" />
            <span>Laporan Kasir Penjualan Fisik & Laba Bersih</span>
          </h2>
          <p className="text-xs text-slate-500">
            Rekap komprehensif omzet penjualan POS, modal HPP, margin laba bersih, tren transaksi grafis, dan performa kasir.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* FILTER TANGGAL & RANGE PICKER CONTROL */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold text-slate-800">Filter Rentang Waktu Penjualan</span>
            {period !== 'ALL' && (
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {filteredSales.length} Transaksi Terpilih
              </span>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setPeriod('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                period === 'ALL'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => setPeriod('TODAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                period === 'TODAY'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriod('YESTERDAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                period === 'YESTERDAY'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kemarin
            </button>
            <button
              onClick={() => setPeriod('7D')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                period === '7D'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setPeriod('30D')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                period === '30D'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setPeriod('CUSTOM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                period === 'CUSTOM'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Rentang Kustom
            </button>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {period === 'CUSTOM' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Mulai:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-slate-50 text-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Sampai:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-slate-50 text-slate-800"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                onClick={handleResetDateFilter}
                className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Tanggal</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards: Revenue, Cost, Net Profit, Units Sold */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Total Omzet Penjualan */}
        <div className="bg-white border border-blue-200 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-blue-800 font-bold uppercase tracking-wider">
              Total Omzet Penjualan
            </span>
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 leading-tight">
            {formatRp(metrics.totalRevenue)}
          </p>
          <span className="text-[10px] text-slate-500 block">
            Dari <strong>{metrics.totalTrx}</strong> struk transaksi kasir POS
          </span>
        </div>

        {/* Total Modal HPP */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-700 font-bold uppercase tracking-wider">
              Total Modal Barang (HPP)
            </span>
            <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-800 leading-tight">
            {formatRp(metrics.totalCost)}
          </p>
          <span className="text-[10px] text-slate-500 block">
            Harga pokok pembelian barang terjual
          </span>
        </div>

        {/* Laba Bersih & Margin % */}
        <div className="bg-emerald-50/70 border border-emerald-300 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-900 font-bold uppercase tracking-wider">
              Total Laba Bersih (Gross Profit)
            </span>
            <div className="p-1.5 bg-emerald-200 text-emerald-800 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-800 leading-tight">
            +{formatRp(metrics.totalGrossProfit)}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
            <span className="bg-emerald-200/80 px-2 py-0.5 rounded-full">
              Margin: {metrics.profitMarginPct}%
            </span>
            <span className="font-normal text-emerald-800">keuntungan murni</span>
          </div>
        </div>

        {/* Volume & Rata-rata Belanja */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-700 font-bold uppercase tracking-wider">
              Volume & Rerata
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 leading-tight">
            {metrics.totalQty} <span className="text-xs font-normal text-slate-500">Unit Terjual</span>
          </p>
          <span className="text-[10px] text-slate-500 block">
            Rerata Struk: <strong>{formatRp(metrics.avgBasketSize)}</strong> / trx
          </span>
        </div>
      </div>

      {/* RECHARTS DATA VISUALIZATION DASHBOARD (ABOVE TABLE DATA) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Visual Chart Header & Switcher Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>Visualisasi Tren Pendapatan & Frekuensi Transaksi POS</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                Grafik interaktif agregasi periode:{' '}
                <strong className="text-slate-600">
                  {period === 'ALL'
                    ? 'Semua Waktu'
                    : period === 'TODAY'
                    ? 'Hari Ini'
                    : period === 'YESTERDAY'
                    ? 'Kemarin'
                    : period === '7D'
                    ? '7 Hari Terakhir'
                    : period === '30D'
                    ? '30 Hari Terakhir'
                    : `Kustom (${customStartDate || 'Awal'} s/d ${customEndDate || 'Akhir'})`}
                </strong>
              </span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setChartViewMode('trend')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                chartViewMode === 'trend'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📈 Tren Omzet & Transaksi
            </button>
            <button
              onClick={() => setChartViewMode('comparison')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                chartViewMode === 'comparison'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Omzet vs Modal vs Laba
            </button>
            <button
              onClick={() => setChartViewMode('products')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                chartViewMode === 'products'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏆 Top Produk
            </button>
          </div>
        </div>

        {/* CHART RENDER AREA */}
        {filteredSales.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Activity className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs font-semibold text-slate-600">Tidak ada data transaksi pada rentang tanggal ini.</p>
            <p className="text-[11px] text-slate-400 mt-1">Coba ubah filter periode atau tanggal di atas untuk melihat grafik.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Quick Stat Badges on top of chart */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-200/70 p-2 rounded-xl">
                <span className="text-[10px] text-slate-500 block">Total Omzet Grafik</span>
                <strong className="text-slate-900 font-mono text-xs">{formatRp(metrics.totalRevenue)}</strong>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-200/70 p-2 rounded-xl">
                <span className="text-[10px] text-emerald-800 block">Laba Bersih Grafik</span>
                <strong className="text-emerald-800 font-mono text-xs">+{formatRp(metrics.totalGrossProfit)}</strong>
              </div>
              <div className="bg-blue-50/60 border border-blue-200/70 p-2 rounded-xl">
                <span className="text-[10px] text-blue-800 block">Jumlah Transaksi</span>
                <strong className="text-blue-900 font-mono text-xs">{metrics.totalTrx} Struk Transaksi</strong>
              </div>
              <div className="bg-indigo-50/60 border border-indigo-200/70 p-2 rounded-xl">
                <span className="text-[10px] text-indigo-800 block">Rata-rata per Struk</span>
                <strong className="text-indigo-900 font-mono text-xs">{formatRp(metrics.avgBasketSize)}</strong>
              </div>
            </div>

            {/* View 1: Trend Pendapatan & Jumlah Transaksi (Dual-Axis Composed Chart) */}
            {chartViewMode === 'trend' && (
              <div className="h-64 w-full text-xs pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={timelineTrendData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 15 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="dateKey"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickMargin={6}
                    />
                    {/* Left Axis: Currency (Omzet & Laba) */}
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : val)}
                    />
                    {/* Right Axis: Transaction Count */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10, fill: '#818cf8' }}
                      tickFormatter={(val) => `${val} trx`}
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        if (name === 'Jumlah Transaksi') return [`${value} Struk`, name];
                        if (name === 'Total Unit Terjual') return [`${value} Pcs`, name];
                        return [formatRp(Number(value)), name];
                      }}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item?.displayDate ? `Waktu: ${item.displayDate}` : `Waktu: ${label}`;
                      }}
                      contentStyle={{
                        borderRadius: '12px',
                        fontSize: '11px',
                        borderColor: '#cbd5e1',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                        backgroundColor: '#ffffff',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="totalRevenue"
                      name="Total Omzet (Rp)"
                      fill="url(#colorRevenue)"
                      stroke="#2563eb"
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="grossProfit"
                      name="Laba Bersih (Rp)"
                      fill="url(#colorProfit)"
                      stroke="#059669"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalTrx"
                      name="Jumlah Transaksi"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#6366f1' }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* View 2: Komparasi Omzet vs Modal vs Laba (Bar Chart by Timeline) */}
            {chartViewMode === 'comparison' && (
              <div className="h-64 w-full text-xs pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timelineTrendData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 15 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="dateKey" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : val)}
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => [formatRp(Number(value)), name]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item?.displayDate ? `Periode: ${item.displayDate}` : `Periode: ${label}`;
                      }}
                      contentStyle={{
                        borderRadius: '12px',
                        fontSize: '11px',
                        borderColor: '#cbd5e1',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Omzet (Rp)" />
                    <Bar dataKey="totalCost" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Modal Pokok HPP (Rp)" />
                    <Bar dataKey="grossProfit" fill="#10b981" radius={[4, 4, 0, 0]} name="Laba Bersih (Rp)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* View 3: Top Kontributor Produk Terlaris */}
            {chartViewMode === 'products' && (
              <div className="h-64 w-full text-xs pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productChartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : val)}
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => [formatRp(Number(value)), name]}
                      labelFormatter={(label, payload) => {
                        const it = payload?.[0]?.payload;
                        return it?.fullName ? `Produk: ${it.fullName}` : `Produk: ${label}`;
                      }}
                      contentStyle={{
                        borderRadius: '12px',
                        fontSize: '11px',
                        borderColor: '#cbd5e1',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="Omzet" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Omzet (Rp)" />
                    <Bar dataKey="Modal" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Modal HPP (Rp)" />
                    <Bar dataKey="Laba" fill="#10b981" radius={[4, 4, 0, 0]} name="Laba Bersih (Rp)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area: Sub Tabs & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('transaksi')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'transaksi'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Daftar Struk Penjualan POS ({filteredSales.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('produk')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'produk'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Analisis Laba per Produk ({productPerformance.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('kasir')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'kasir'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Rekap Shift & Kasir ({cashierPerformance.length})</span>
            </button>
          </div>

          {/* Quick Search & Cashier Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                placeholder="Cari invoice/barang/nama..."
                className="text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-slate-50"
              />
            </div>

            <select
              value={selectedCashier}
              onChange={(e) => setSelectedCashier(e.target.value)}
              className="text-xs p-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
            >
              <option value="ALL">Semua Kasir</option>
              {cashiers
                .filter((c) => c !== 'ALL')
                .map((c) => (
                  <option key={c} value={c}>
                    Kasir: {c}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* SUBTAB 1: DAFTAR TRANSAKSI STRUK POS */}
        {activeSubTab === 'transaksi' && (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="p-3">No. Invoice</th>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Kasir</th>
                    <th className="p-3">Rincian Item</th>
                    <th className="p-3 text-right">Total Belanja</th>
                    <th className="p-3 text-right">Modal HPP</th>
                    <th className="p-3 text-right">Laba Bersih</th>
                    <th className="p-3 text-center">Metode</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-8 text-slate-400">
                        Tidak ada transaksi penjualan POS yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const marginPct =
                        sale.totalRevenue > 0
                          ? Math.round((sale.grossProfit / sale.totalRevenue) * 100)
                          : 0;

                      return (
                        <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                          {/* Invoice */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {sale.invoiceNumber}
                            </span>
                            {sale.customerName && (
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                Pelanggan: {sale.customerName}
                              </span>
                            )}
                          </td>

                          {/* Waktu */}
                          <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                            {sale.time}
                          </td>

                          {/* Kasir */}
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-800">{sale.cashierName}</span>
                          </td>

                          {/* Rincian Item */}
                          <td className="p-3">
                            <div className="space-y-0.5">
                              {sale.items.map((it, idx) => (
                                <div key={idx} className="text-[11px] text-slate-700 flex items-center gap-1">
                                  <span className="font-bold text-blue-800">{it.qty}x</span>
                                  <span>{it.productName}</span>
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Total Belanja */}
                          <td className="p-3 text-right font-mono font-bold text-blue-950 whitespace-nowrap">
                            {formatRp(sale.totalRevenue)}
                          </td>

                          {/* Modal HPP */}
                          <td className="p-3 text-right font-mono text-slate-600 whitespace-nowrap">
                            {formatRp(sale.totalCost)}
                          </td>

                          {/* Laba Bersih */}
                          <td className="p-3 text-right font-mono whitespace-nowrap">
                            <span className="font-bold text-emerald-700">
                              +{formatRp(sale.grossProfit)}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium ml-1 block">
                              ({marginPct}%)
                            </span>
                          </td>

                          {/* Metode */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {sale.paymentMethod}
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedSaleDetail(sale)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                                title="Lihat Rincian Struk"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {onReprintReceipt && (
                                <button
                                  onClick={() => onReprintReceipt(sale)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                                  title="Cetak Ulang Struk"
                                >
                                  <Printer className="w-3.5 h-3.5" />
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

        {/* SUBTAB 2: ANALISIS LABA PER PRODUK */}
        {activeSubTab === 'produk' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>
                Peringkat produk berdasarkan total perolehan laba bersih dan volume unit terjual.
              </span>
              <span className="font-mono font-bold text-slate-800">
                {productPerformance.length} Produk Pernah Terjual
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="p-3">Rank</th>
                    <th className="p-3">Nama Produk</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3 text-center">Qty Terjual</th>
                    <th className="p-3 text-right">Total Omzet</th>
                    <th className="p-3 text-right">Total Modal (HPP)</th>
                    <th className="p-3 text-right">Total Laba Bersih</th>
                    <th className="p-3 text-right">Margin %</th>
                    <th className="p-3 text-right">Kontribusi Laba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {productPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-8 text-slate-400">
                        Belum ada data penjualan produk.
                      </td>
                    </tr>
                  ) : (
                    productPerformance.map((prod, idx) => {
                      const margin =
                        prod.revenue > 0 ? Math.round((prod.profit / prod.revenue) * 100) : 0;
                      const contribution =
                        metrics.totalGrossProfit > 0
                          ? Math.round((prod.profit / metrics.totalGrossProfit) * 100)
                          : 0;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-500">#{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{prod.name}</td>
                          <td className="p-3">
                            <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                              {prod.category}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800">
                            {prod.qtySold}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-900">
                            {formatRp(prod.revenue)}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-600">
                            {formatRp(prod.cost)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            +{formatRp(prod.profit)}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700">{margin}%</td>
                          <td className="p-3 text-right font-mono font-bold text-blue-800">
                            {contribution}%
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

        {/* SUBTAB 3: REKAP SHIFT & KASIR */}
        {activeSubTab === 'kasir' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Rekap total omzet dan perolehan laba berdasarkan operator kasir yang bertugas.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cashierPerformance.map((c) => (
                <div
                  key={c.cashierName}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 text-blue-800 rounded-full font-bold text-xs">
                        {c.cashierName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{c.cashierName}</h4>
                        <span className="text-[10px] text-slate-500 font-semibold">{c.role}</span>
                      </div>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg">
                      {c.trxCount} Struk Transaksi
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg">
                      <span className="text-[10px] text-slate-500 block">Total Qty</span>
                      <strong className="text-slate-900 font-mono text-sm">{c.totalQty} Unit</strong>
                    </div>
                    <div className="bg-blue-50 p-2.5 rounded-lg">
                      <span className="text-[10px] text-blue-700 block">Total Omzet</span>
                      <strong className="text-blue-950 font-mono text-sm">{formatRp(c.revenue)}</strong>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-lg">
                      <span className="text-[10px] text-emerald-700 block">Total Laba</span>
                      <strong className="text-emerald-800 font-mono text-sm">+{formatRp(c.profit)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL FOR A POS SALE */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-sm text-slate-900">
                  Rincian Struk #{selectedSaleDetail.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Sale Meta */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Waktu Transaksi</span>
                <span className="font-mono font-bold text-slate-800">{selectedSaleDetail.time}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Kasir / Operator</span>
                <span className="font-bold text-slate-800">{selectedSaleDetail.cashierName}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Metode Pembayaran</span>
                <span className="font-bold text-blue-800">{selectedSaleDetail.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Nama Pelanggan</span>
                <span className="font-bold text-slate-800">{selectedSaleDetail.customerName || 'Umum'}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800">Daftar Barang yang Dibeli:</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] text-slate-700 uppercase">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Harga</th>
                      <th className="p-2.5 text-right">Modal</th>
                      <th className="p-2.5 text-right">Laba</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSaleDetail.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-slate-900">{it.productName}</td>
                        <td className="p-2.5 text-center font-bold">{it.qty}</td>
                        <td className="p-2.5 text-right font-mono">{formatRp(it.subtotal)}</td>
                        <td className="p-2.5 text-right font-mono text-slate-500">{formatRp(it.totalCost)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                          +{formatRp(it.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grand Total */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Omzet Penjualan:</span>
                <span className="font-bold font-mono text-slate-900">
                  {formatRp(selectedSaleDetail.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Modal Pokok (HPP):</span>
                <span className="font-mono text-slate-700">{formatRp(selectedSaleDetail.totalCost)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-emerald-800 font-bold">
                <span>Total Laba Bersih Transaksi:</span>
                <span className="font-mono text-sm">+{formatRp(selectedSaleDetail.grossProfit)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {onReprintReceipt && (
                <button
                  onClick={() => {
                    onReprintReceipt(selectedSaleDetail);
                    setSelectedSaleDetail(null);
                  }}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Struk Transaksi</span>
                </button>
              )}
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
