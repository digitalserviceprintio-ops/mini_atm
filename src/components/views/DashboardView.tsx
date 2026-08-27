import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  TrendingUp,
  ArrowLeftRight,
  Wallet,
  ArrowUpRight,
  PlusCircle,
  CreditCard,
  ShoppingCart,
  Layers,
  ArrowDownRight,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Store,
  Receipt,
  Eye,
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Account, ActiveTab, PosSale, Product, Transaction } from '../../types';
import { formatRp } from '../../utils/formatters';
import { RetailSalesIllustration } from '../illustrations/RetailSalesIllustration';

interface DashboardViewProps {
  transactions?: Transaction[];
  accounts?: Account[];
  products?: Product[];
  posSales?: PosSale[];
  onOpenNewTrx: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onViewReceipt: (trx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions = [],
  accounts = [],
  products = [],
  posSales = [],
  onOpenNewTrx,
  onNavigateTab,
  onViewReceipt,
}) => {
  const [activeTimeFilter, setActiveTimeFilter] = useState<'ALL' | 'TODAY' | 'MONTH'>('ALL');

  // Stats calculation
  const stats = useMemo(() => {
    let gross = 0;
    let net = 0;
    let successCount = 0;

    (transactions || []).forEach((t) => {
      if (t && t.status === 'SUCCESS') {
        gross += t.nominal || 0;
        net += (t.feeCust || 0) - (t.feeAdmin || 0);
        successCount++;
      }
    });

    const totalAll = (transactions || []).length;
    const rate = totalAll > 0 ? Math.round((successCount / totalAll) * 100) : 100;
    const margin = gross > 0 ? ((net / gross) * 100).toFixed(1) : '0';

    // Retail / POS Metrics
    let posGrossRevenue = 0;
    let posNetProfit = 0;
    let posItemsSold = 0;

    (posSales || []).forEach((s) => {
      if (s && s.status !== 'VOID') {
        posGrossRevenue += s.totalRevenue || 0;
        posNetProfit += s.grossProfit || 0;
        posItemsSold += s.totalQty || 0;
      }
    });

    return {
      gross,
      net,
      successCount,
      totalAll,
      rate,
      margin,
      posGrossRevenue,
      posNetProfit,
      posItemsSold,
      totalCombinedRevenue: gross + posGrossRevenue,
      totalCombinedProfit: net + posNetProfit,
    };
  }, [transactions, posSales]);

  // Total balance across all accounts
  const totalBalance = useMemo(() => {
    return (accounts || []).reduce((sum, a) => sum + (a?.balance || 0), 0);
  }, [accounts]);

  // Trend Chart Data
  const trendData = useMemo(() => {
    const sorted = [...(transactions || [])].reverse();
    const labels = sorted.map((t) => t.id);
    const nominals = sorted.map((t) => (t.status === 'SUCCESS' ? t.nominal : 0));
    const profits = sorted.map((t) => (t.status === 'SUCCESS' ? t.feeCust - t.feeAdmin : 0));

    return {
      labels: labels.length > 0 ? labels : ['TRX-001'],
      datasets: [
        {
          label: 'Nominal Trx',
          data: nominals.length > 0 ? nominals : [0],
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.06)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Net Profit Fee',
          data: profits.length > 0 ? profits : [0],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [transactions]);

  // Category Doughnut Data
  const catDoughnutData = useMemo(() => {
    const catMap: Record<string, number> = {};
    (transactions || []).forEach((t) => {
      if (t && t.status === 'SUCCESS') {
        catMap[t.type] = (catMap[t.type] || 0) + 1;
      }
    });

    const labels = Object.keys(catMap);
    const counts = Object.values(catMap);

    return {
      labels: labels.length > 0 ? labels : ['Belum ada transaksi'],
      datasets: [
        {
          data: counts.length > 0 ? counts : [1],
          backgroundColor: ['#0066cc', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  return (
    <section id="view-dashboard" className="space-y-6">
      {/* 1. HERO BANNER: Clean, Fresh Layout with Animated Vector Retail Illustration */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#003366] via-[#004b93] to-[#002855] text-white shadow-md border border-blue-900/30">
        {/* Subtle background decorative shapes */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -bottom-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 md:p-8">
          {/* Left Column: Greeting, Value Proposition & Quick CTA */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white/15 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-xs">
                <Store className="w-3.5 h-3.5 text-blue-200" />
                Mini ATM & Retail POS Management
              </span>
              <span className="bg-emerald-400/20 text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync Online
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Ringkasan Transaksi & Performa Penjualan Ritel
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl leading-relaxed">
                Pantau arus transaksi agen perbankan, penjualan produk kasir ritel, likuiditas rekening kas, dan laba bersih secara real-time.
              </p>
            </div>

            {/* Quick Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3">
                <span className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold block">
                  Total Laba Bersih
                </span>
                <span className="text-base sm:text-lg font-bold text-emerald-300 block mt-0.5">
                  {formatRp(stats.totalCombinedProfit)}
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3">
                <span className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold block">
                  Total Omset Terproses
                </span>
                <span className="text-base sm:text-lg font-bold text-white block mt-0.5">
                  {formatRp(stats.totalCombinedRevenue)}
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-3 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold block">
                  Tingkat Sukses
                </span>
                <span className="text-base sm:text-lg font-bold text-blue-200 block mt-0.5">
                  {stats.rate}% <span className="text-[11px] font-normal text-blue-300">({stats.successCount} Trx)</span>
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                onClick={onOpenNewTrx}
                className="bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-blue-700" />
                <span>Catat Transaksi Baru</span>
              </button>
              <button
                onClick={() => onNavigateTab('kasir-fisik')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 text-white" />
                <span>Buka Kasir POS Ritel</span>
              </button>
            </div>
          </div>

          {/* Right Column: Custom Animated Vector Illustration for Retail Sales */}
          <div className="lg:col-span-5 flex items-center justify-center p-2">
            <div className="w-full max-w-sm lg:max-w-md bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10 shadow-inner">
              <RetailSalesIllustration className="w-full h-auto" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. SALDO MULTI-REKENING: Clean horizontal cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-blue-700" />
            <span>Ringkasan Saldo Kas & Rekening Bank</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Total Likuiditas:</span>
            <span className="text-xs sm:text-sm font-extrabold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
              {formatRp(totalBalance)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" id="dashboardSaldoCards">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2 hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 truncate">{acc.name}</span>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                  {acc.type}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Saldo Kas</span>
                <p className="text-lg font-extrabold text-slate-900 leading-tight">
                  {formatRp(acc.balance)}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono truncate">{acc.accountNumber || acc.bankName || 'Kas Utama'}</span>
                <button
                  onClick={() => onNavigateTab('akun-kas')}
                  className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Kelola &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. FOUR CORE KPI PERFORMANCE METRICS */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Indikator Performa Keuangan & Penjualan Ritel</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Omset Mini ATM */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Volume Mini ATM</span>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Nominal Transaksi Perbankan</span>
              <span className="text-xl font-extrabold text-slate-900 leading-tight block mt-0.5">
                {formatRp(stats.gross)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-blue-700 font-semibold text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {stats.successCount} Berhasil
              </span>
              <span className="text-slate-400 text-[10px]">{stats.rate}% Rate</span>
            </div>
          </div>

          {/* Card 2: Fee Bersih Mini ATM */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Laba Fee Mini ATM</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Net Profit Margin Fee</span>
              <span className="text-xl font-extrabold text-emerald-600 leading-tight block mt-0.5">
                {formatRp(stats.net)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-semibold text-[11px]">
                Margin ~{stats.margin}%
              </span>
              <span className="text-slate-400 text-[10px]">Fee Positif</span>
            </div>
          </div>

          {/* Card 3: Omset Kasir POS Ritel */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Omset Kasir Ritel POS</span>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Penjualan Pulsa & Barang</span>
              <span className="text-xl font-extrabold text-slate-900 leading-tight block mt-0.5">
                {formatRp(stats.posGrossRevenue)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-amber-700 font-semibold text-[11px]">
                {posSales.length} Nota Kasir
              </span>
              <span className="text-slate-500 text-[10px]">{stats.posItemsSold} unit terjual</span>
            </div>
          </div>

          {/* Card 4: Profit Bersih Ritel */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-cyan-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Laba Bersih Ritel POS</span>
              <div className="p-2 bg-cyan-50 text-cyan-700 rounded-xl">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Gross Profit Selisih Modal</span>
              <span className="text-xl font-extrabold text-cyan-700 leading-tight block mt-0.5">
                {formatRp(stats.posNetProfit)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-cyan-700 font-semibold text-[11px]">
                {products.length} Item Katalog
              </span>
              <button
                onClick={() => onNavigateTab('laporan-pos')}
                className="text-blue-600 hover:text-blue-800 font-bold text-[10px] cursor-pointer"
              >
                Detail &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. VISUAL ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Nominal vs Net Profit */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Tren Volume Nominal vs Profit Bersih</h3>
              <p className="text-xs text-slate-500">Perbandingan pergerakan nilai transaksi dengan laba fee per transaksi</p>
            </div>
            <button
              onClick={() => onNavigateTab('laporan-detail')}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Laporan Lengkap</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-68 relative">
            <Line
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      font: { size: 11, family: 'sans-serif', weight: 'bold' },
                      boxWidth: 12,
                    },
                  },
                  tooltip: {
                    backgroundColor: '#0f172a',
                    padding: 10,
                    titleFont: { size: 11, weight: 'bold' },
                    bodyFont: { size: 11 },
                    callbacks: {
                      label: function (context) {
                        return `${context.dataset.label}: Rp ${Number(context.raw).toLocaleString('id-ID')}`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } },
                  },
                  y: {
                    grid: { color: '#f1f5f9' },
                    ticks: {
                      font: { size: 10 },
                      callback: function (val) {
                        return 'Rp ' + Number(val).toLocaleString('id-ID');
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Category Doughnut Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800">Porsi Layanan Transaksi</h3>
            <p className="text-xs text-slate-500">Distribusi frekuensi jenis transaksi</p>
          </div>

          <div className="h-68 relative flex items-center justify-center">
            <Doughnut
              data={catDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      font: { size: 11 },
                      boxWidth: 10,
                      padding: 12,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* 5. BOTTOM SECTION: QUICK ACTIONS & RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operational Shortcuts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            <span>Pusat Aksi Cepat & Navigasi</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onOpenNewTrx}
              className="p-3.5 bg-blue-50/70 hover:bg-blue-100/80 text-blue-800 rounded-xl text-left border border-blue-200/80 transition-all flex flex-col justify-between gap-3 cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs block">Catat Trx</span>
                <span className="text-[10px] text-blue-600">Tarik / Setor / Transfer</span>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('kasir-fisik')}
              className="p-3.5 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 rounded-xl text-left border border-emerald-200/80 transition-all flex flex-col justify-between gap-3 cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs block">Kasir POS</span>
                <span className="text-[10px] text-emerald-600">Jual Voucher / Barang</span>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('arus-kas')}
              className="p-3.5 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-800 rounded-xl text-left border border-indigo-200/80 transition-all flex flex-col justify-between gap-3 cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs block">Mutasi Kas</span>
                <span className="text-[10px] text-indigo-600">Pindah / Tarik Saldo</span>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('database-spreadsheet')}
              className="p-3.5 bg-amber-50/70 hover:bg-amber-100/80 text-amber-800 rounded-xl text-left border border-amber-200/80 transition-all flex flex-col justify-between gap-3 cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs block">Database</span>
                <span className="text-[10px] text-amber-600">Google Sheets Sync</span>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-700" />
              <span>5 Transaksi Terbaru</span>
            </h3>
            <button
              onClick={() => onNavigateTab('transaksi')}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Semua Riwayat Transaksi</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentTransactions.map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      t.type === 'TARIK TUNAI'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : t.type === 'SETOR TUNAI'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : t.type === 'TRANSFER'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {t.type.substring(0, 2)}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-800 truncate text-xs">
                      {t.cust} &rarr; <span className="font-semibold text-slate-600">{t.target}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      #{t.id} &bull; {t.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 block leading-tight text-xs sm:text-sm">
                      {formatRp(t.nominal)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold">
                      +{formatRp(t.feeCust - t.feeAdmin)} Fee
                    </span>
                  </div>
                  <button
                    onClick={() => onViewReceipt(t)}
                    className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="Cetak / Lihat Struk"
                  >
                    <Receipt className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            ))}

            {recentTransactions.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada data transaksi tersimpan. Klik <strong>Catat Transaksi</strong> untuk memulai.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
