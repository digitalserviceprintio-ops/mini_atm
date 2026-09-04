import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Calendar,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  CreditCard,
  Printer,
  Download,
  Eye,
  XCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  PlusCircle,
  EyeOff,
  Clock,
  Wallet,
  X,
  Share2,
  SlidersHorizontal,
} from 'lucide-react';
import { Account, Transaction, TransactionType, UserRole, AgentProfile } from '../../types';
import { formatRp, formatDateTime } from '../../utils/formatters';
import { getSecuritySettings, maskCustomerPhone, maskCustomerAccount } from '../../utils/securityCrypto';
import { exportTransactionsToExcel } from '../../utils/excelExport';

interface RiwayatTransaksiAgenViewProps {
  transactions: Transaction[];
  accounts: Account[];
  profile: AgentProfile;
  currentRole: UserRole;
  operatorName?: string;
  onOpenNewTrx: () => void;
  onEditTrx: (trx: Transaction) => void;
  onViewReceipt: (trx: Transaction) => void;
  onConfirmVoid: (trx: Transaction) => void;
  onNavigateToInputTrx?: () => void;
}

export type PeriodFilter = 'ALL' | 'TODAY' | 'YESTERDAY' | '7D' | '30D' | 'CUSTOM';

// Helper to parse date from various formats
function parseTrxDate(dateStr?: string): Date | null {
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

export const RiwayatTransaksiAgenView: React.FC<RiwayatTransaksiAgenViewProps> = ({
  transactions = [],
  accounts = [],
  profile,
  currentRole,
  operatorName = 'Operator',
  onOpenNewTrx,
  onEditTrx,
  onViewReceipt,
  onConfirmVoid,
  onNavigateToInputTrx,
}) => {
  // Filter States
  const [period, setPeriod] = useState<PeriodFilter>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('SEMUA');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('SEMUA');
  const [selectedStatus, setSelectedStatus] = useState<'SEMUA' | 'SUCCESS' | 'VOID'>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'NOMINAL_DESC' | 'NOMINAL_ASC'>('NEWEST');

  // Privacy & UI States
  const [unmaskPrivacy, setUnmaskPrivacy] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDetailTrx, setSelectedDetailTrx] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const securitySettings = getSecuritySettings();

  const accountMap = useMemo(() => {
    return new Map((accounts || []).map((a) => [a.id, a.name]));
  }, [accounts]);

  // Copy ID with visual feedback
  const handleCopyId = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Date range checking
  const isDateInPeriod = (trxTime: string): boolean => {
    if (period === 'ALL') return true;
    const trxDate = parseTrxDate(trxTime);
    if (!trxDate) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === 'TODAY') {
      return trxDate >= today;
    }

    if (period === 'YESTERDAY') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return trxDate >= yesterday && trxDate < today;
    }

    if (period === '7D') {
      const past7 = new Date(today);
      past7.setDate(today.getDate() - 7);
      return trxDate >= past7;
    }

    if (period === '30D') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      return trxDate >= past30;
    }

    if (period === 'CUSTOM') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (trxDate < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (trxDate > end) return false;
      }
      return true;
    }

    return true;
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();

    return (transactions || []).filter((t) => {
      if (!t) return false;

      // 1. Period Filter
      if (!isDateInPeriod(t.time)) return false;

      // 2. Type Filter
      if (selectedType !== 'SEMUA' && t.type !== selectedType) return false;

      // 3. Account Filter
      if (selectedAccountId !== 'SEMUA' && t.accountId !== selectedAccountId) return false;

      // 4. Status Filter
      if (selectedStatus !== 'SEMUA' && t.status !== selectedStatus) return false;

      // 5. Search Query
      if (q) {
        const matchCust = t.cust && t.cust.toLowerCase().includes(q);
        const matchTarget = t.target && t.target.toLowerCase().includes(q);
        const matchId = t.id && t.id.toLowerCase().includes(q);
        const matchRef = t.refNumber && t.refNumber.toLowerCase().includes(q);
        const matchPhone = t.phoneCust && t.phoneCust.toLowerCase().includes(q);
        const matchNotes = t.notes && t.notes.toLowerCase().includes(q);
        const matchNominal = String(t.nominal || '').includes(q);
        const matchAcc = (accountMap.get(t.accountId) || '').toLowerCase().includes(q);

        if (!matchCust && !matchTarget && !matchId && !matchRef && !matchPhone && !matchNotes && !matchNominal && !matchAcc) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    period,
    customStartDate,
    customEndDate,
    selectedType,
    selectedAccountId,
    selectedStatus,
    searchQuery,
    accountMap,
  ]);

  // Sorted transactions
  const sortedTransactions = useMemo(() => {
    const list = [...filteredTransactions];
    return list.sort((a, b) => {
      if (sortBy === 'NOMINAL_DESC') {
        return (b.nominal || 0) - (a.nominal || 0);
      }
      if (sortBy === 'NOMINAL_ASC') {
        return (a.nominal || 0) - (b.nominal || 0);
      }
      if (sortBy === 'OLDEST') {
        const dateA = parseTrxDate(a.time)?.getTime() || 0;
        const dateB = parseTrxDate(b.time)?.getTime() || 0;
        return dateA - dateB;
      }
      // Default: NEWEST
      const dateA = parseTrxDate(a.time)?.getTime() || 0;
      const dateB = parseTrxDate(b.time)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [filteredTransactions, sortBy]);

  // Aggregated KPIs for filtered transactions
  const kpis = useMemo(() => {
    let countTotal = 0;
    let countSuccess = 0;
    let countVoid = 0;
    let totalNominal = 0;
    let totalFeeCust = 0;
    let totalFeeAdmin = 0;
    let totalNetProfit = 0;
    let totalVoidNominal = 0;

    filteredTransactions.forEach((t) => {
      countTotal++;
      if (t.status === 'VOID') {
        countVoid++;
        totalVoidNominal += t.nominal || 0;
      } else {
        countSuccess++;
        totalNominal += t.nominal || 0;
        totalFeeCust += t.feeCust || 0;
        totalFeeAdmin += t.feeAdmin || 0;
        totalNetProfit += (t.feeCust || 0) - (t.feeAdmin || 0);
      }
    });

    return {
      countTotal,
      countSuccess,
      countVoid,
      totalNominal,
      totalFeeCust,
      totalFeeAdmin,
      totalNetProfit,
      totalVoidNominal,
    };
  }, [filteredTransactions]);

  // Pagination
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(start, start + itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  // Reset pagination on filter change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Export Excel
  const handleExportExcel = () => {
    let filterLabel = `Periode: ${period}`;
    if (period === 'CUSTOM') {
      filterLabel = `Kustom: ${customStartDate || '-'} s/d ${customEndDate || '-'}`;
    }
    if (selectedType !== 'SEMUA') {
      filterLabel += ` | Jenis: ${selectedType}`;
    }
    if (selectedStatus !== 'SEMUA') {
      filterLabel += ` | Status: ${selectedStatus}`;
    }
    exportTransactionsToExcel(filteredTransactions, accounts, profile, filterLabel);
  };

  // Print Rekap Window
  const handlePrintRekap = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) return;

    const rowsHtml = filteredTransactions
      .map((t, idx) => {
        const isVoid = t.status === 'VOID';
        return `
          <tr style="${isVoid ? 'color: #991b1b; text-decoration: line-through; background-color: #fef2f2;' : ''}">
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-family: monospace;">#${t.id}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${t.time}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">${t.type}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${t.cust}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1;">${t.target}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">Rp ${(t.nominal || 0).toLocaleString('id-ID')}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right;">Rp ${(t.feeCust || 0).toLocaleString('id-ID')}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: #047857;">Rp ${((t.feeCust || 0) - (t.feeAdmin || 0)).toLocaleString('id-ID')}</td>
            <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${t.status}</td>
          </tr>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rekap Riwayat Transaksi Agen - ${profile.storeName}</title>
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
        <h2>${profile.storeName} - Laporan Rekap Riwayat Transaksi Agen</h2>
        <p>${profile.address || ''} | Telp: ${profile.phone || ''} | ID Agen: ${profile.idAgent || '-'}</p>
        <p>Waktu Cetak: ${formatDateTime()} | Dicetak oleh: ${operatorName}</p>

        <div class="summary-box">
          <div class="summary-item">
            <span>Total Transaksi</span>
            <strong>${kpis.countTotal} Transaksi (${kpis.countSuccess} Sukses)</strong>
          </div>
          <div class="summary-item">
            <span>Total Perputaran (Volume)</span>
            <strong>Rp ${kpis.totalNominal.toLocaleString('id-ID')}</strong>
          </div>
          <div class="summary-item">
            <span>Total Fee Nasabah</span>
            <strong>Rp ${kpis.totalFeeCust.toLocaleString('id-ID')}</strong>
          </div>
          <div class="summary-item">
            <span>Keuntungan Bersih Agen</span>
            <strong style="color: #047857;">Rp ${kpis.totalNetProfit.toLocaleString('id-ID')}</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">No</th>
              <th>ID</th>
              <th>Waktu</th>
              <th>Layanan</th>
              <th>Nasabah</th>
              <th>Tujuan / Rekening</th>
              <th style="text-align: right;">Nominal</th>
              <th style="text-align: right;">Fee</th>
              <th style="text-align: right;">Profit Agen</th>
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

  // Helper Badge Color for Transaction Type
  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'TARIK TUNAI':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
        };
      case 'SETOR TUNAI':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <ArrowUpRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
        };
      case 'TRANSFER':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600 shrink-0" />,
        };
      case 'PEMBAYARAN':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <CreditCard className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: <History className="w-3.5 h-3.5 text-slate-500 shrink-0" />,
        };
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/20 shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Riwayat Transaksi Agen
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-cyan-50 text-cyan-700 border border-cyan-200">
                {transactions.length} Total Data
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Log riwayat transaksi perbankan Mini ATM, transfer, tarik & setor tunai, serta keuntungan fee agen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Ekspor seluruh data hasil filter ke file spreadsheet Excel (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrintRekap}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Cetak format rekap riwayat transaksi yang terfilter"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Rekap</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewTrx}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Transaksi */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Transaksi
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{kpis.countTotal}</div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span className="text-emerald-700 font-semibold">{kpis.countSuccess} Sukses</span>
            {kpis.countVoid > 0 && (
              <span className="text-rose-600 font-semibold">{kpis.countVoid} Void</span>
            )}
          </div>
        </div>

        {/* Perputaran Uang / Nominal */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Perputaran
            </span>
            <div className="p-1.5 bg-cyan-50 text-cyan-700 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900">{formatRp(kpis.totalNominal)}</div>
          <p className="text-[11px] text-slate-500">Akumulasi volume transaksi berhasil</p>
        </div>

        {/* Total Fee Nasabah */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Fee Nasabah
            </span>
            <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-purple-700">{formatRp(kpis.totalFeeCust)}</div>
          <p className="text-[11px] text-slate-500">Total biaya admin ditarik dari nasabah</p>
        </div>

        {/* Keuntungan Bersih Agen */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 bg-gradient-to-br from-white to-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Laba Bersih Agen
            </span>
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700">{formatRp(kpis.totalNetProfit)}</div>
          <div className="text-[11px] text-emerald-800/80 font-medium">
            Margin agen setelah potong fee bank
          </div>
        </div>
      </div>

      {/* Filter Bar & Controls */}
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
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Privacy unmask toggle */}
          <button
            type="button"
            onClick={() => setUnmaskPrivacy(!unmaskPrivacy)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              unmaskPrivacy
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Buka / Sensor nomor HP & nomor rekening pelanggan di tabel"
          >
            {unmaskPrivacy ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{unmaskPrivacy ? 'Privasi: Terbuka' : 'Privasi: Sensor Aktif'}</span>
          </button>
        </div>

        {/* Custom Date Inputs (if CUSTOM period selected) */}
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
                className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  handleFilterChange();
                }}
                className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
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
              placeholder="Cari nasabah, tujuan, ID, No. Ref, nominal..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Jenis Layanan */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                handleFilterChange();
              }}
              className="w-full text-xs px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="SEMUA">Semua Jenis Layanan</option>
              <option value="TARIK TUNAI">Tarik Tunai</option>
              <option value="SETOR TUNAI">Setor Tunai</option>
              <option value="TRANSFER">Transfer Antar Bank</option>
              <option value="PEMBAYARAN">Pembayaran / Tagihan</option>
            </select>
          </div>

          {/* Akun Kas / Bank */}
          <div>
            <select
              value={selectedAccountId}
              onChange={(e) => {
                setSelectedAccountId(e.target.value);
                handleFilterChange();
              }}
              className="w-full text-xs px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="SEMUA">Semua Akun Kas / Bank</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          {/* Status Transaksi */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                handleFilterChange();
              }}
              className="w-full text-xs px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="SUCCESS">SUKSES (Berhasil)</option>
              <option value="VOID">VOID (Dibatalkan)</option>
            </select>
          </div>
        </div>

        {/* Sort & Quick Filter Stats bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-0 font-bold text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="NEWEST">Waktu Terbaru (Terbaru di atas)</option>
              <option value="OLDEST">Waktu Terlama</option>
              <option value="NOMINAL_DESC">Nominal Tertinggi</option>
              <option value="NOMINAL_ASC">Nominal Terendah</option>
            </select>
          </div>

          <div>
            Menampilkan <strong className="text-slate-800">{sortedTransactions.length}</strong> transaksi dari total{' '}
            <strong className="text-slate-800">{transactions.length}</strong>
          </div>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">No</th>
                <th className="py-3 px-3">ID & Ref</th>
                <th className="py-3 px-3">Waktu</th>
                <th className="py-3 px-3">Layanan</th>
                <th className="py-3 px-3">Nasabah & Kontak</th>
                <th className="py-3 px-3">Tujuan / Rekening</th>
                <th className="py-3 px-3">Akun Kas</th>
                <th className="py-3 px-3 text-right">Nominal</th>
                <th className="py-3 px-3 text-right">Fee / Laba</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <History className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-600 text-sm">Tidak Ada Riwayat Transaksi</p>
                      <p className="text-xs text-slate-400">
                        Tidak ada transaksi yang cocok dengan filter yang Anda tentukan.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((trx, index) => {
                  const isVoid = trx.status === 'VOID';
                  const badge = getTypeBadge(trx.type);
                  const netProfit = (trx.feeCust || 0) - (trx.feeAdmin || 0);
                  const accountName = accountMap.get(trx.accountId) || trx.accountId;
                  const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;

                  // Phone & Account masking
                  const displayPhone =
                    securitySettings.maskCustomerPhone && !unmaskPrivacy
                      ? maskCustomerPhone(trx.phoneCust || '')
                      : trx.phoneCust || '-';

                  const displayTarget =
                    securitySettings.maskCustomerAccount && !unmaskPrivacy
                      ? maskCustomerAccount(trx.target || '')
                      : trx.target;

                  return (
                    <tr
                      key={trx.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isVoid ? 'bg-rose-50/40 text-slate-400' : ''
                      }`}
                    >
                      {/* Row No */}
                      <td className="py-3 px-3.5 text-center text-[11px] font-semibold text-slate-400">
                        {rowNumber}
                      </td>

                      {/* ID & Ref Number */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailTrx(trx)}
                            className="font-mono font-bold text-blue-700 hover:underline hover:text-blue-900 cursor-pointer"
                            title="Klik untuk melihat rincian transaksi lengkap"
                          >
                            #{trx.id}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyId(trx.id, trx.id)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                            title="Salin ID Transaksi"
                          >
                            {copiedId === trx.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {trx.refNumber && (
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <span>Ref: {trx.refNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Waktu */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-slate-700 font-medium">{trx.time}</div>
                      </td>

                      {/* Layanan */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                        >
                          {badge.icon}
                          <span>{trx.type}</span>
                        </span>
                      </td>

                      {/* Nasabah */}
                      <td className="py-3 px-3">
                        <div className={`font-semibold ${isVoid ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {trx.cust || '-'}
                        </div>
                        {trx.phoneCust && (
                          <div className="text-[10px] text-slate-400 font-mono">{displayPhone}</div>
                        )}
                      </td>

                      {/* Target / Tujuan */}
                      <td className="py-3 px-3 max-w-[150px] truncate" title={trx.target}>
                        <div className="font-mono text-[11px] text-slate-700 truncate">{displayTarget}</div>
                        {trx.notes && (
                          <div className="text-[10px] text-slate-400 truncate italic">
                            {trx.notes}
                          </div>
                        )}
                      </td>

                      {/* Akun Kas */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {accountName}
                        </span>
                      </td>

                      {/* Nominal */}
                      <td className="py-3 px-3 text-right">
                        <div
                          className={`font-bold font-mono text-xs ${
                            isVoid ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {formatRp(trx.nominal)}
                        </div>
                      </td>

                      {/* Fee & Profit */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="text-[11px] text-slate-600 font-mono">
                          Fee: {formatRp(trx.feeCust)}
                        </div>
                        <div
                          className={`text-[10px] font-extrabold font-mono ${
                            isVoid ? 'text-slate-400' : 'text-emerald-700'
                          }`}
                        >
                          Laba: +{formatRp(netProfit)}
                        </div>
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
                          {/* Lihat Detail */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailTrx(trx)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-100/60 rounded-lg transition-colors cursor-pointer"
                            title="Rincian Lengkap Transaksi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Cetak Struk */}
                          <button
                            type="button"
                            onClick={() => onViewReceipt(trx)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Cetak Struk Thermal"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Void Button */}
                          {!isVoid && (
                            <button
                              type="button"
                              onClick={() => onConfirmVoid(trx)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 rounded-lg transition-colors cursor-pointer"
                              title="Batalkan / Void Transaksi"
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
        {sortedTransactions.length > 0 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Baris per halaman:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-600"
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

      {/* Modal Detail Transaksi Agen */}
      {selectedDetailTrx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-xl">
                  <History className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Rincian Transaksi Agen</h3>
                  <p className="text-[11px] text-slate-300 font-mono">#{selectedDetailTrx.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailTrx(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Status Banner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  selectedDetailTrx.status === 'VOID'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {selectedDetailTrx.status === 'VOID' ? (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>
                    Status:{' '}
                    {selectedDetailTrx.status === 'VOID'
                      ? 'DIBATALKAN (VOID)'
                      : 'BERHASIL & SAH'}
                  </span>
                </div>
                <span className="font-mono text-[11px]">{selectedDetailTrx.time}</span>
              </div>

              {/* Data Transaksi Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Jenis Layanan
                  </span>
                  <span className="font-bold text-slate-800 text-xs">
                    {selectedDetailTrx.type}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Akun Kas / Bank
                  </span>
                  <span className="font-bold text-slate-800 text-xs">
                    {accountMap.get(selectedDetailTrx.accountId) || selectedDetailTrx.accountId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Nama Nasabah
                  </span>
                  <span className="font-bold text-slate-800 text-xs">
                    {selectedDetailTrx.cust || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    No. Handphone / WA
                  </span>
                  <span className="font-mono text-slate-800 text-xs">
                    {selectedDetailTrx.phoneCust || '-'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Tujuan / Rekening / No. Meter
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-xs break-all">
                    {selectedDetailTrx.target || '-'}
                  </span>
                </div>
                {selectedDetailTrx.refNumber && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Nomor Referensi Bank
                    </span>
                    <span className="font-mono text-slate-700 text-xs">
                      {selectedDetailTrx.refNumber}
                    </span>
                  </div>
                )}
                {selectedDetailTrx.notes && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Catatan Tambahan
                    </span>
                    <span className="text-slate-600 text-xs italic">
                      {selectedDetailTrx.notes}
                    </span>
                  </div>
                )}
              </div>

              {/* Rincian Finansial & Profit */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100/70 px-3.5 py-2 font-bold text-slate-700 border-b border-slate-200">
                  Rincian Finansial Transaksi
                </div>
                <div className="p-3.5 space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nominal Pokok Transaksi:</span>
                    <span className="font-bold text-slate-800">
                      {formatRp(selectedDetailTrx.nominal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Biaya Admin Nasabah (Fee):</span>
                    <span className="text-slate-800">+{formatRp(selectedDetailTrx.feeCust)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                    <span>Total Tagihan / Pembayaran:</span>
                    <span className="text-sm text-blue-700">
                      {formatRp(selectedDetailTrx.nominal + selectedDetailTrx.feeCust)}
                    </span>
                  </div>
                  {selectedDetailTrx.cashReceived !== undefined && (
                    <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-dashed border-slate-200">
                      <span>Uang Tunai Diterima:</span>
                      <span>{formatRp(selectedDetailTrx.cashReceived)}</span>
                    </div>
                  )}
                  {selectedDetailTrx.changeAmount !== undefined && (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Kembalian:</span>
                      <span>{formatRp(selectedDetailTrx.changeAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-emerald-800 bg-emerald-50 -mx-3.5 -mb-3.5 p-3">
                    <span className="font-bold">Keuntungan Bersih Agen:</span>
                    <span className="font-extrabold text-sm text-emerald-700">
                      +{formatRp((selectedDetailTrx.feeCust || 0) - (selectedDetailTrx.feeAdmin || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedDetailTrx(null);
                  onViewReceipt(selectedDetailTrx);
                }}
                className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedDetailTrx.status !== 'VOID' && (
                  <button
                    type="button"
                    onClick={() => {
                      const t = selectedDetailTrx;
                      setSelectedDetailTrx(null);
                      onConfirmVoid(t);
                    }}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Void Transaksi
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDetailTrx(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
