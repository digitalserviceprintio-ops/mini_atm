import React, { useMemo } from 'react';
import {
  CheckCircle2,
  BarChart2,
  TrendingUp,
  ArrowLeftRight,
  Wallet,
  ArrowUpRight,
  PlusCircle,
  CreditCard,
  ShoppingCart,
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Account, ActiveTab, Transaction } from '../../types';
import { formatRp } from '../../utils/formatters';

interface DashboardViewProps {
  transactions: Transaction[];
  accounts: Account[];
  onOpenNewTrx: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onViewReceipt: (trx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  accounts,
  onOpenNewTrx,
  onNavigateTab,
  onViewReceipt,
}) => {
  // Stats
  const stats = useMemo(() => {
    let gross = 0;
    let net = 0;
    let successCount = 0;

    transactions.forEach((t) => {
      if (t.status === 'SUCCESS') {
        gross += t.nominal;
        net += t.feeCust - t.feeAdmin;
        successCount++;
      }
    });

    const totalAll = transactions.length;
    const rate = totalAll > 0 ? Math.round((successCount / totalAll) * 100) : 100;
    const margin = gross > 0 ? ((net / gross) * 100).toFixed(1) : '0';

    return {
      gross,
      net,
      successCount,
      totalAll,
      rate,
      margin,
    };
  }, [transactions]);

  // Total balance across all accounts
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  // Trend Chart Data
  const trendData = useMemo(() => {
    const sorted = [...transactions].reverse();
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
          backgroundColor: 'rgba(2, 132, 199, 0.08)',
          fill: true,
          tension: 0.35,
        },
        {
          label: 'Net Profit Fee',
          data: profits.length > 0 ? profits : [0],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          fill: true,
          tension: 0.35,
        },
      ],
    };
  }, [transactions]);

  // Category Doughnut Data
  const catDoughnutData = useMemo(() => {
    const catMap: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.status === 'SUCCESS') {
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
          backgroundColor: ['#0066cc', '#10b981', '#f59e0b', '#8b5cf6'],
        },
      ],
    };
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  return (
    <section id="view-dashboard" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800">Dashboard Insights & Analisis KPI</h2>
          <p className="text-xs text-slate-500">Ringkasan real-time posisi keuangan, saldo akun kas, dan performa transaksi</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>Sistem Realtime Aktif</span>
          </span>
          <button
            onClick={onOpenNewTrx}
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Trx</span>
          </button>
        </div>
      </div>

      {/* Saldo Multi-Rekening Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-blue-700" />
            <span>Ringkasan Saldo Multi-Rekening</span>
          </h3>
          <span className="text-xs font-bold text-slate-700">
            Total Likuiditas: <span className="text-blue-700">{formatRp(totalBalance)}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" id="dashboardSaldoCards">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 truncate">{acc.name}</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-100">
                  {acc.type}
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 leading-tight pt-1">
                {formatRp(acc.balance)}
              </p>
              {acc.accountNumber && (
                <span className="text-[10px] text-slate-400 font-mono block">
                  No: {acc.accountNumber}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* KPI Performance Cards */}
      <div className="space-y-3 pt-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Performansi Pendapatan & Indikator KPI
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gross */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-blue-900">Total Nominal Terproses</p>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <BarChart2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Total Omset Trx Keseluruhan</span>
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {formatRp(stats.gross)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                <TrendingUp className="w-3.5 h-3.5" /> +14.2% omset bulanan
              </span>
              <span className="text-slate-400 text-[10px]">Performa Baik</span>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-blue-900">Keuntungan Bersih (Fee)</p>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Total Net Profit Fee Agen</span>
              <span className="text-xl font-bold text-emerald-600 leading-tight">
                {formatRp(stats.net)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                <ArrowUpRight className="w-3.5 h-3.5" /> Margin ~{stats.margin}%
              </span>
              <span className="text-slate-400 text-[10px]">Fee Positif</span>
            </div>
          </div>

          {/* Volume */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-blue-900">Volume Transaksi</p>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Jumlah Transaksi Berhasil</span>
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {stats.successCount}{' '}
                <span className="text-xs font-normal text-slate-400">
                  / {stats.totalAll} Total
                </span>
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-blue-700 font-semibold flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {stats.rate}% Success Rate
              </span>
              <span className="text-slate-400 text-[10px]">Tinggi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-800">Tren Nominal vs Profit Fee</h4>
              <p className="text-[11px] text-slate-400">Perbandingan volume transaksi dan fee bersih per transaksi</p>
            </div>
            <button
              onClick={() => onNavigateTab('laporan-detail')}
              className="text-[11px] text-blue-700 hover:underline font-semibold"
            >
              Lihat Semua Grafik
            </button>
          </div>
          <div className="h-64 relative">
            <Line
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { font: { size: 10 } } } },
                scales: {
                  x: { ticks: { font: { size: 9 } } },
                  y: { ticks: { font: { size: 9 } } },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="border-b pb-2">
            <h4 className="font-bold text-xs text-slate-800">Distribusi Tipe Transaksi</h4>
            <p className="text-[11px] text-slate-400">Persentase frekuensi transaksi harian</p>
          </div>
          <div className="h-64 relative flex items-center justify-center">
            <Doughnut
              data={catDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { font: { size: 10 } },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Shortcuts & Recent Transactions list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Shortcuts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h4 className="font-bold text-xs text-slate-800 border-b pb-2">Aksi Cepat & Navigasi Operasional</h4>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onOpenNewTrx}
              className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-left border border-blue-200 transition-colors flex flex-col justify-between gap-2 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-blue-700" />
              <div>
                <span className="font-bold text-xs block">Catat Trx</span>
                <span className="text-[10px] text-blue-600">Mini ATM Baru</span>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('kasir-fisik')}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-left border border-emerald-200 transition-colors flex flex-col justify-between gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5 text-emerald-700" />
              <div>
                <span className="font-bold text-xs block">Kasir POS</span>
                <span className="text-[10px] text-emerald-600">Jual Voucher/Barang</span>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('arus-kas')}
              className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-left border border-indigo-200 transition-colors flex flex-col justify-between gap-2 cursor-pointer"
            >
              <ArrowLeftRight className="w-5 h-5 text-indigo-700" />
              <div>
                <span className="font-bold text-xs block">Mutasi Kas</span>
                <span className="text-[10px] text-indigo-600">Pindah Dana Saldo</span>
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('akun-kas')}
              className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-left border border-amber-200 transition-colors flex flex-col justify-between gap-2 cursor-pointer"
            >
              <Wallet className="w-5 h-5 text-amber-700" />
              <div>
                <span className="font-bold text-xs block">Kelola Akun</span>
                <span className="text-[10px] text-amber-600">Rekening & Saldo</span>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-700" />
              <span>Transaksi Terkini</span>
            </h4>
            <button
              onClick={() => onNavigateTab('transaksi')}
              className="text-[11px] text-blue-700 hover:underline font-semibold"
            >
              Lihat Semua Transaksi &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentTransactions.map((t) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      t.type === 'TARIK TUNAI'
                        ? 'bg-amber-100 text-amber-800'
                        : t.type === 'SETOR TUNAI'
                        ? 'bg-blue-100 text-blue-800'
                        : t.type === 'TRANSFER'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {t.type.substring(0, 2)}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-800 truncate">
                      {t.cust} &rarr; {t.target}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      #{t.id} &bull; {t.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block leading-tight">
                      {formatRp(t.nominal)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      +{formatRp(t.feeCust - t.feeAdmin)}
                    </span>
                  </div>
                  <button
                    onClick={() => onViewReceipt(t)}
                    className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                    title="Lihat Struk"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
