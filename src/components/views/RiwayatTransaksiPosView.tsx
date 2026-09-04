import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  Filter,
  ShoppingCart,
  Printer,
  Download,
  Eye,
  XCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  CreditCard,
  Clock,
  Package,
  TrendingUp,
  X,
  SlidersHorizontal,
  Tag,
  User,
  ExternalLink,
} from 'lucide-react';
import { Account, PosSale, Product, UserRole, AgentProfile } from '../../types';
import { formatRp, formatDateTime } from '../../utils/formatters';
import { exportPosSalesToExcel } from '../../utils/excelExport';

interface RiwayatTransaksiPosViewProps {
  posSales: PosSale[];
  products: Product[];
  accounts: Account[];
  profile: AgentProfile;
  currentRole: UserRole;
  operatorName?: string;
  onVoidSale: (saleId: string) => void;
  onReprintReceipt: (sale: PosSale) => void;
  onNavigateToPOS?: () => void;
}

export type PeriodFilter = 'ALL' | 'TODAY' | 'YESTERDAY' | '7D' | '30D' | 'CUSTOM';

// Helper to parse date
function parseSaleDate(dateStr?: string): Date | null {
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

export const RiwayatTransaksiPosView: React.FC<RiwayatTransaksiPosViewProps> = ({
  posSales = [],
  products = [],
  accounts = [],
  profile,
  currentRole,
  operatorName = 'Kasir',
  onVoidSale,
  onReprintReceipt,
  onNavigateToPOS,
}) => {
  // Filter States
  const [period, setPeriod] = useState<PeriodFilter>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('SEMUA');
  const [selectedCashier, setSelectedCashier] = useState<string>('SEMUA');
  const [selectedStatus, setSelectedStatus] = useState<'SEMUA' | 'SUCCESS' | 'VOID'>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'REVENUE_DESC' | 'REVENUE_ASC'>('NEWEST');

  // UI States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDetailSale, setSelectedDetailSale] = useState<PosSale | null>(null);
  const [saleToVoid, setSaleToVoid] = useState<PosSale | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const accountMap = useMemo(() => {
    return new Map((accounts || []).map((a) => [a.id, a.name]));
  }, [accounts]);

  // Unique cashier list
  const uniqueCashiers = useMemo(() => {
    const set = new Set<string>();
    posSales.forEach((s) => {
      if (s.cashierName) set.add(s.cashierName);
    });
    return Array.from(set);
  }, [posSales]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Check if date falls in period
  const isDateInPeriod = (saleTime: string): boolean => {
    if (period === 'ALL') return true;
    const saleDate = parseSaleDate(saleTime);
    if (!saleDate) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === 'TODAY') {
      return saleDate >= today;
    }

    if (period === 'YESTERDAY') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return saleDate >= yesterday && saleDate < today;
    }

    if (period === '7D') {
      const past7 = new Date(today);
      past7.setDate(today.getDate() - 7);
      return saleDate >= past7;
    }

    if (period === '30D') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      return saleDate >= past30;
    }

    if (period === 'CUSTOM') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (saleDate < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (saleDate > end) return false;
      }
      return true;
    }

    return true;
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();

    return (posSales || []).filter((s) => {
      if (!s) return false;

      // 1. Period filter
      if (!isDateInPeriod(s.time)) return false;

      // 2. Payment Method filter
      if (selectedMethod !== 'SEMUA') {
        const method = (s.paymentMethod || 'Tunai').toLowerCase();
        if (method !== selectedMethod.toLowerCase()) return false;
      }

      // 3. Cashier filter
      if (selectedCashier !== 'SEMUA') {
        if (s.cashierName !== selectedCashier) return false;
      }

      // 4. Status filter
      if (selectedStatus !== 'SEMUA') {
        const isVoid = s.status === 'VOID';
        if (selectedStatus === 'VOID' && !isVoid) return false;
        if (selectedStatus === 'SUCCESS' && isVoid) return false;
      }

      // 5. Search Query
      if (q) {
        const matchInvoice = (s.invoiceNumber || s.id).toLowerCase().includes(q);
        const matchCust = s.customerName && s.customerName.toLowerCase().includes(q);
        const matchMember = s.memberNumber && s.memberNumber.toLowerCase().includes(q);
        const matchCashier = s.cashierName && s.cashierName.toLowerCase().includes(q);
        const matchNotes = s.notes && s.notes.toLowerCase().includes(q);
        const matchAmount = String(s.totalRevenue || '').includes(q);
        const matchItem = (s.items || []).some(
          (it) =>
            (it.productName && it.productName.toLowerCase().includes(q)) ||
            (it.barcode && it.barcode.toLowerCase().includes(q))
        );

        if (
          !matchInvoice &&
          !matchCust &&
          !matchMember &&
          !matchCashier &&
          !matchNotes &&
          !matchAmount &&
          !matchItem
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    posSales,
    period,
    customStartDate,
    customEndDate,
    selectedMethod,
    selectedCashier,
    selectedStatus,
    searchQuery,
  ]);

  // Sorted sales
  const sortedSales = useMemo(() => {
    const list = [...filteredSales];
    return list.sort((a, b) => {
      if (sortBy === 'REVENUE_DESC') {
        return (b.totalRevenue || 0) - (a.totalRevenue || 0);
      }
      if (sortBy === 'REVENUE_ASC') {
        return (a.totalRevenue || 0) - (b.totalRevenue || 0);
      }
      if (sortBy === 'OLDEST') {
        const dateA = parseSaleDate(a.time)?.getTime() || 0;
        const dateB = parseSaleDate(b.time)?.getTime() || 0;
        return dateA - dateB;
      }
      // Default: NEWEST
      const dateA = parseSaleDate(a.time)?.getTime() || 0;
      const dateB = parseSaleDate(b.time)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [filteredSales, sortBy]);

  // Aggregated KPIs
  const kpis = useMemo(() => {
    let countTotal = 0;
    let countSuccess = 0;
    let countVoid = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalQty = 0;
    let totalDiscount = 0;

    filteredSales.forEach((s) => {
      countTotal++;
      if (s.status === 'VOID') {
        countVoid++;
      } else {
        countSuccess++;
        totalRevenue += s.totalRevenue || 0;
        totalCost += s.totalCost || 0;
        totalProfit += s.grossProfit || 0;
        totalQty += s.totalQty || 0;
        totalDiscount += (s.totalDiscount || 0) + (s.discountFromPoints || 0);
      }
    });

    return {
      countTotal,
      countSuccess,
      countVoid,
      totalRevenue,
      totalCost,
      totalProfit,
      totalQty,
      totalDiscount,
    };
  }, [filteredSales]);

  // Pagination
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage) || 1;
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedSales.slice(start, start + itemsPerPage);
  }, [sortedSales, currentPage, itemsPerPage]);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    let filterLabel = `Periode: ${period}`;
    if (period === 'CUSTOM') {
      filterLabel = `Kustom: ${customStartDate || '-'} s/d ${customEndDate || '-'}`;
    }
    if (selectedMethod !== 'SEMUA') {
      filterLabel += ` | Metode: ${selectedMethod}`;
    }
    if (selectedStatus !== 'SEMUA') {
      filterLabel += ` | Status: ${selectedStatus}`;
    }
    exportPosSalesToExcel(filteredSales, accounts, profile, filterLabel);
  };

  // Print Rekap Window
  const handlePrintRekap = () => {
    const printWindow = window.open('', '_blank', 'width=880,height=900');
    if (!printWindow) return;

    const rowsHtml = filteredSales
      .map((s, idx) => {
        const isVoid = s.status === 'VOID';
        const itemsList = (s.items || [])
          .map((it) => `${it.productName} (${it.qty}x)`)
          .join(', ');

        return `
          <tr style="${isVoid ? 'color: #991b1b; text-decoration: line-through; background-color: #fef2f2;' : ''}">
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: monospace;">${s.invoiceNumber || s.id}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${s.time}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${s.cashierName || '-'}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${s.customerName || 'Umum'}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 10px;">${itemsList}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${s.totalQty || 0}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">Rp ${(s.totalRevenue || 0).toLocaleString('id-ID')}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #047857;">Rp ${(s.grossProfit || 0).toLocaleString('id-ID')}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${s.paymentMethod || 'Tunai'}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${s.status || 'SUKSES'}</td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekap Riwayat Kasir POS - ${profile.storeName}</title>
        <style>
          body { font-family: sans-serif; margin: 24px; color: #1e293b; font-size: 11px; }
          h2 { margin: 0 0 4px 0; font-size: 16px; }
          p { margin: 2px 0; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #0f172a; color: #ffffff; padding: 8px; font-size: 10px; border: 1px solid #0f172a; text-align: left; }
          .summary-box { display: flex; gap: 16px; margin-top: 16px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
          .summary-item { flex: 1; }
          .summary-item span { display: block; font-size: 10px; color: #64748b; }
          .summary-item strong { font-size: 13px; color: #0f172a; }
        </style>
      </head>
      <body>
        <h2>${profile.storeName} - Laporan Rekap Riwayat Transaksi Kasir POS</h2>
        <p>${profile.address || ''} | Telp: ${profile.phone || ''}</p>
        <p>Waktu Cetak: ${formatDateTime()} | Dicetak oleh: ${operatorName}</p>

        <div class="summary-box">
          <div class="summary-item">
            <span>Total Struk Terbit</span>
            <strong>${kpis.countTotal} Struk (${kpis.countSuccess} Sukses)</strong>
          </div>
          <div class="summary-item">
            <span>Total Omset Belanja</span>
            <strong>Rp ${kpis.totalRevenue.toLocaleString('id-ID')}</strong>
          </div>
          <div class="summary-item">
            <span>Total Qty Terjual</span>
            <strong>${kpis.totalQty} Pcs Barang</strong>
          </div>
          <div class="summary-item">
            <span>Total Laba Kotor</span>
            <strong style="color: #047857;">Rp ${kpis.totalProfit.toLocaleString('id-ID')}</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">No</th>
              <th>No. Invoice</th>
              <th>Waktu</th>
              <th>Kasir</th>
              <th>Pelanggan</th>
              <th>Rincian Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Total Omset</th>
              <th style="text-align: right;">Laba Kotor</th>
              <th style="text-align: center;">Bayar</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Riwayat Transaksi Kasir POS
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {posSales.length} Total Struk
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Log riwayat penjualan ritel barang fisik kasir, rincian item struk, laba kotor, dan metode pembayaran
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Ekspor seluruh data riwayat POS ke file spreadsheet Excel (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrintRekap}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Cetak format rekap penjualan kasir POS yang terfilter"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Rekap POS</span>
          </button>

          {onNavigateToPOS && (
            <button
              type="button"
              onClick={onNavigateToPOS}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buka Kasir POS</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Struk */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Struk POS
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{kpis.countTotal} Struk</div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span className="text-emerald-700 font-semibold">{kpis.countSuccess} Sukses</span>
            {kpis.countVoid > 0 && (
              <span className="text-rose-600 font-semibold">{kpis.countVoid} Void</span>
            )}
          </div>
        </div>

        {/* Total Omset Penjualan */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Omset Penjualan
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-700">
            {formatRp(kpis.totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-500">Nilai total belanja pelanggan kasir</p>
        </div>

        {/* Total Barang / Qty Terjual */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Barang Terjual
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{kpis.totalQty} Pcs</div>
          <p className="text-[11px] text-slate-500">Total kuantitas unit produk fisik</p>
        </div>

        {/* Laba Kotor POS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Laba Kotor (Margin)
            </span>
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700">{formatRp(kpis.totalProfit)}</div>
          <div className="text-[11px] text-emerald-800/80 font-medium">
            Margin keuntungan kotor penjualan
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        {/* Period Filter Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Periode:</span>
            </span>
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'TODAY', label: 'Hari Ini' },
              { id: 'YESTERDAY', label: 'Kemarin' },
              { id: '7D', label: '7 Hari Terakhir' },
              { id: '30D', label: 'Bulan Ini' },
              { id: 'CUSTOM', label: 'Kustom Tanggal' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPeriod(p.id as PeriodFilter);
                  handleFilterChange();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Diskon diberikan: <strong className="text-slate-800">{formatRp(kpis.totalDiscount)}</strong>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {period === 'CUSTOM' && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Rentang Tanggal:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  handleFilterChange();
                }}
                className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  handleFilterChange();
                }}
                className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Detailed Dropdowns & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleFilterChange();
              }}
              placeholder="Cari No. Invoice (POS-...), produk, pelanggan..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Metode Pembayaran */}
          <div>
            <select
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                handleFilterChange();
              }}
              className="w-full text-xs px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-medium"
            >
              <option value="SEMUA">Semua Metode Bayar</option>
              <option value="Tunai">Tunai (Cash)</option>
              <option value="QRIS">QRIS</option>
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="E-Wallet">E-Wallet</option>
            </select>
          </div>

          {/* Filter Kasir */}
          <div>
            <select
              value={selectedCashier}
              onChange={(e) => {
                setSelectedCashier(e.target.value);
                handleFilterChange();
              }}
              className="w-full text-xs px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-medium"
            >
              <option value="SEMUA">Semua Kasir Operator</option>
              {uniqueCashiers.map((c) => (
                <option key={c} value={c}>
                  Kasir: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                handleFilterChange();
              }}
              className="w-full text-xs px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600 font-medium"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="SUCCESS">SUKSES (Selesai)</option>
              <option value="VOID">VOID (Dibatalkan)</option>
            </select>
          </div>
        </div>

        {/* Sort & Count Row */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-0 font-bold text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="NEWEST">Waktu Terbaru</option>
              <option value="OLDEST">Waktu Terlama</option>
              <option value="REVENUE_DESC">Total Belanja Tertinggi</option>
              <option value="REVENUE_ASC">Total Belanja Terendah</option>
            </select>
          </div>

          <div>
            Menampilkan <strong className="text-slate-800">{sortedSales.length}</strong> struk dari total{' '}
            <strong className="text-slate-800">{posSales.length}</strong>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">No</th>
                <th className="py-3 px-3">No. Invoice / Struk</th>
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3">Kasir</th>
                <th className="py-3 px-3">Pelanggan</th>
                <th className="py-3 px-3">Rincian Barang</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3 text-right">Total Bayar</th>
                <th className="py-3 px-3 text-right">Laba Kotor</th>
                <th className="py-3 px-3 text-center">Metode</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-600 text-sm">Tidak Ada Riwayat Struk POS</p>
                      <p className="text-xs text-slate-400">
                        Tidak ada transaksi penjualan POS yang cocok dengan filter yang ditentukan.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale, index) => {
                  const isVoid = sale.status === 'VOID';
                  const invoiceNo = sale.invoiceNumber || sale.id;
                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  const items = sale.items || [];
                  const displayedItems = items.slice(0, 2);
                  const remainingCount = items.length - 2;

                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-emerald-50/30 transition-colors ${
                        isVoid ? 'bg-rose-50/40 text-slate-400' : ''
                      }`}
                    >
                      {/* Row No */}
                      <td className="py-3 px-3.5 text-center text-[11px] font-semibold text-slate-400">
                        {rowNumber}
                      </td>

                      {/* Invoice Number */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailSale(sale)}
                            className="font-mono font-bold text-emerald-700 hover:underline hover:text-emerald-900 cursor-pointer"
                            title="Klik untuk melihat faktur digital & rincian barang"
                          >
                            {invoiceNo}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(invoiceNo, sale.id)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                            title="Salin No Invoice"
                          >
                            {copiedId === sale.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Waktu */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-slate-700 font-medium">{sale.time}</div>
                      </td>

                      {/* Kasir */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{sale.cashierName || 'Kasir'}</span>
                        </span>
                      </td>

                      {/* Pelanggan */}
                      <td className="py-3 px-3">
                        <div className={`font-semibold ${isVoid ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {sale.customerName || 'Pelanggan Umum'}
                        </div>
                        {sale.memberNumber && (
                          <span className="inline-block text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                            VIP: {sale.memberNumber}
                          </span>
                        )}
                      </td>

                      {/* Rincian Barang */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <div className="space-y-0.5">
                          {displayedItems.map((it, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700 truncate">
                              • <span className="font-semibold">{it.productName}</span>{' '}
                              <span className="text-slate-400 font-mono">({it.qty}x)</span>
                            </div>
                          ))}
                          {remainingCount > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedDetailSale(sale)}
                              className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer block"
                            >
                              +{remainingCount} item lainnya...
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Total Qty */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {sale.totalQty || 0}
                        </span>
                      </td>

                      {/* Total Bayar */}
                      <td className="py-3 px-3 text-right">
                        <div
                          className={`font-bold font-mono text-xs ${
                            isVoid ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {formatRp(sale.totalRevenue)}
                        </div>
                        {((sale.totalDiscount || 0) > 0 || (sale.discountFromPoints || 0) > 0) && (
                          <div className="text-[10px] text-amber-600 font-mono">
                            Disc: -{formatRp((sale.totalDiscount || 0) + (sale.discountFromPoints || 0))}
                          </div>
                        )}
                      </td>

                      {/* Laba Kotor */}
                      <td className="py-3 px-3 text-right font-mono">
                        <span
                          className={`font-bold text-xs ${
                            isVoid ? 'text-slate-400' : 'text-emerald-700'
                          }`}
                        >
                          +{formatRp(sale.grossProfit || 0)}
                        </span>
                      </td>

                      {/* Metode Pembayaran */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          <span>{sale.paymentMethod || 'Tunai'}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            isVoid
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isVoid ? (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>VOID</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>SUKSES</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Detail Item */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailSale(sale)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100/60 rounded-lg transition-colors cursor-pointer"
                            title="Rincian Faktur Belanja & Produk"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Cetak Struk Ulang */}
                          <button
                            type="button"
                            onClick={() => onReprintReceipt(sale)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Cetak Ulang Struk Thermal"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Void Button */}
                          {!isVoid && (
                            <button
                              type="button"
                              onClick={() => setSaleToVoid(sale)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 rounded-lg transition-colors cursor-pointer"
                              title="Batalkan (Void) Struk POS"
                            >
                              <XCircle className="w-3.5 h-3.5" />
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

        {/* Pagination Bar */}
        {sortedSales.length > 0 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Baris per halaman:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-slate-400">|</span>
              <span>
                Halaman <strong className="text-slate-800">{currentPage}</strong> dari{' '}
                <strong className="text-slate-800">{totalPages}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail Faktur / Struk POS */}
      {selectedDetailSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 rounded-xl">
                  <Receipt className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Faktur Penjualan Kasir POS</h3>
                  <p className="text-[11px] text-slate-300 font-mono">
                    {selectedDetailSale.invoiceNumber || selectedDetailSale.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailSale(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Status Banner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  selectedDetailSale.status === 'VOID'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {selectedDetailSale.status === 'VOID' ? (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>
                    Status:{' '}
                    {selectedDetailSale.status === 'VOID'
                      ? 'DIBATALKAN (VOID)'
                      : 'TRANSAKSI SELESAI / SAH'}
                  </span>
                </div>
                <span className="font-mono text-[11px]">{selectedDetailSale.time}</span>
              </div>

              {/* Meta Info Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Kasir Operator
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedDetailSale.cashierName || 'Kasir'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Metode Pembayaran
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedDetailSale.paymentMethod || 'Tunai'} (
                    {accountMap.get(selectedDetailSale.accountId) || selectedDetailSale.accountId})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Pelanggan
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedDetailSale.customerName || 'Pelanggan Umum'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Nomor Member VIP
                  </span>
                  <span className="font-mono text-slate-800">
                    {selectedDetailSale.memberNumber || '-'}
                  </span>
                </div>
                {selectedDetailSale.notes && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Catatan
                    </span>
                    <span className="text-slate-600 italic">{selectedDetailSale.notes}</span>
                  </div>
                )}
              </div>

              {/* Tabel Item Belanja */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-700 border-b border-slate-200 flex justify-between items-center">
                  <span>Daftar Barang Belanja</span>
                  <span className="text-slate-500 font-normal">
                    {selectedDetailSale.items.length} Item ({selectedDetailSale.totalQty} Qty)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Produk</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Harga</th>
                        <th className="py-2 px-3 text-right">Diskon</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDetailSale.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-800">{it.productName}</div>
                            {it.barcode && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                {it.barcode}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold">{it.qty}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            {formatRp(it.price)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-amber-600">
                            {it.discountAmount ? `-${formatRp(it.discountAmount)}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                            {formatRp(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rangkuman Finansial */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Sebelum Diskon:</span>
                  <span>
                    {formatRp(
                      selectedDetailSale.totalBeforeDiscount || selectedDetailSale.totalRevenue
                    )}
                  </span>
                </div>
                {selectedDetailSale.totalDiscount && selectedDetailSale.totalDiscount > 0 ? (
                  <div className="flex justify-between text-amber-600">
                    <span>Potongan Diskon Promo:</span>
                    <span>-{formatRp(selectedDetailSale.totalDiscount)}</span>
                  </div>
                ) : null}
                {selectedDetailSale.discountFromPoints &&
                selectedDetailSale.discountFromPoints > 0 ? (
                  <div className="flex justify-between text-purple-600">
                    <span>Diskon Tukar Poin Member:</span>
                    <span>-{formatRp(selectedDetailSale.discountFromPoints)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 text-sm">
                  <span>TOTAL BAYAR:</span>
                  <span className="text-emerald-700">{formatRp(selectedDetailSale.totalRevenue)}</span>
                </div>
                {selectedDetailSale.cashReceived !== undefined && (
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-dashed border-slate-200">
                    <span>Uang Diterima ({selectedDetailSale.paymentMethod}):</span>
                    <span>{formatRp(selectedDetailSale.cashReceived)}</span>
                  </div>
                )}
                {selectedDetailSale.changeAmount !== undefined && (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Kembalian:</span>
                    <span>{formatRp(selectedDetailSale.changeAmount)}</span>
                  </div>
                )}

                {/* Profit Bar */}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-emerald-800 bg-emerald-50/70 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
                  <span className="font-bold">Laba Kotor Penjualan:</span>
                  <span className="font-extrabold text-sm text-emerald-700">
                    +{formatRp(selectedDetailSale.grossProfit || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDetailSale(null);
                  onReprintReceipt(selectedDetailSale);
                }}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk POS</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedDetailSale.status !== 'VOID' && (
                  <button
                    type="button"
                    onClick={() => {
                      const s = selectedDetailSale;
                      setSelectedDetailSale(null);
                      setSaleToVoid(s);
                    }}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Void Struk
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDetailSale(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Void Struk POS */}
      {saleToVoid && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Batalkan (VOID) Struk POS?</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {saleToVoid.invoiceNumber || saleToVoid.id}
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1.5">
              <p className="font-semibold">Perhatian Pembatalan:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Semua stok barang fisik ({saleToVoid.totalQty} Pcs) akan otomatis dikembalikan ke inventori toko.</li>
                <li>Saldo kas penampung akan disesuaikan sebesar {formatRp(saleToVoid.totalRevenue)}.</li>
                <li>Tindakan ini permanen dan akan dicatat di log audit keamanan.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSaleToVoid(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = saleToVoid.id;
                  setSaleToVoid(null);
                  onVoidSale(id);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ya, Batalkan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
