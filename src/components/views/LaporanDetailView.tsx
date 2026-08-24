import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  Printer,
  Download,
  Filter,
  RotateCcw,
  TrendingUp,
  CreditCard,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Account, Transaction } from '../../types';
import { formatRp } from '../../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LaporanDetailViewProps {
  transactions: Transaction[];
  accounts: Account[];
  onExportCSV: () => void;
}

export const LaporanDetailView: React.FC<LaporanDetailViewProps> = ({
  transactions,
  accounts,
  onExportCSV,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterAccount, setFilterAccount] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSearch, setFilterSearch] = useState<string>('');

  const accountMap = useMemo(() => {
    return new Map(accounts.map((a) => [a.id, a.name]));
  }, [accounts]);

  const resetFilters = () => {
    setFilterType('ALL');
    setFilterAccount('ALL');
    setFilterStatus('ALL');
    setFilterSearch('');
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = filterType === 'ALL' || t.type === filterType;
      const matchAcc = filterAccount === 'ALL' || t.accountId === filterAccount;
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
      const q = filterSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.cust.toLowerCase().includes(q) ||
        t.target.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q));

      return matchType && matchAcc && matchStatus && matchSearch;
    });
  }, [transactions, filterType, filterAccount, filterStatus, filterSearch]);

  // Key stats
  const stats = useMemo(() => {
    let totalGross = 0;
    let totalNet = 0;
    let totalFeeCust = 0;
    let totalFeeAdmin = 0;
    let validCount = 0;

    filteredTransactions.forEach((t) => {
      if (t.status !== 'VOID') {
        totalGross += t.nominal;
        totalFeeCust += t.feeCust;
        totalFeeAdmin += t.feeAdmin;
        totalNet += t.feeCust - t.feeAdmin;
        validCount++;
      }
    });

    const avgNominal = validCount > 0 ? Math.round(totalGross / validCount) : 0;

    return {
      totalGross,
      totalNet,
      totalFeeCust,
      totalFeeAdmin,
      totalCount: filteredTransactions.length,
      validCount,
      avgNominal,
    };
  }, [filteredTransactions]);

  // Chart 1: Line Chart Data (Trend)
  const lineChartData = useMemo(() => {
    const sorted = [...filteredTransactions].reverse();
    const labels = sorted.map((t) => {
      const parts = t.time.split(' ');
      return parts.length >= 4 ? `${parts[0]} ${parts[1]} ${parts[3]}` : t.id;
    });
    const nominals = sorted.map((t) => (t.status !== 'VOID' ? t.nominal : 0));
    const profits = sorted.map((t) => (t.status !== 'VOID' ? t.feeCust - t.feeAdmin : 0));

    return {
      labels: labels.length > 0 ? labels : ['Belum ada data'],
      datasets: [
        {
          label: 'Nominal Transaksi (Rp)',
          data: nominals.length > 0 ? nominals : [0],
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#0284c7',
        },
        {
          label: 'Profit Fee Bersih (Rp)',
          data: profits.length > 0 ? profits : [0],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
        },
      ],
    };
  }, [filteredTransactions]);

  // Chart 2: Bar Chart Data (Category comparison)
  const barChartData = useMemo(() => {
    const catMap: Record<string, { nominal: number; profit: number }> = {};
    filteredTransactions.forEach((t) => {
      if (t.status !== 'VOID') {
        if (!catMap[t.type]) catMap[t.type] = { nominal: 0, profit: 0 };
        catMap[t.type].nominal += t.nominal;
        catMap[t.type].profit += t.feeCust - t.feeAdmin;
      }
    });

    const labels = Object.keys(catMap);
    const nominals = labels.map((l) => catMap[l].nominal);
    const profits = labels.map((l) => catMap[l].profit);

    return {
      labels: labels.length > 0 ? labels : ['Belum ada'],
      datasets: [
        {
          label: 'Total Nominal (Rp)',
          data: nominals.length > 0 ? nominals : [0],
          backgroundColor: '#3b82f6',
          borderRadius: 6,
        },
        {
          label: 'Total Net Profit (Rp)',
          data: profits.length > 0 ? profits : [0],
          backgroundColor: '#10b981',
          borderRadius: 6,
        },
      ],
    };
  }, [filteredTransactions]);

  // Chart 3: Pie Chart (Account Distribution)
  const pieChartData = useMemo(() => {
    const accCountMap: Record<string, number> = {};
    filteredTransactions.forEach((t) => {
      if (t.status !== 'VOID') {
        const name = accountMap.get(t.accountId) || 'Utama';
        accCountMap[name] = (accCountMap[name] || 0) + 1;
      }
    });

    const labels = Object.keys(accCountMap);
    const counts = labels.map((l) => accCountMap[l]);

    return {
      labels: labels.length > 0 ? labels : ['Tidak ada data'],
      datasets: [
        {
          data: counts.length > 0 ? counts : [1],
          backgroundColor: [
            '#0066cc',
            '#10b981',
            '#f59e0b',
            '#8b5cf6',
            '#ec4899',
            '#06b6d4',
          ],
        },
      ],
    };
  }, [filteredTransactions, accountMap]);

  // Chart 4: Doughnut Chart (Success vs Void)
  const statusChartData = useMemo(() => {
    const successCount = filteredTransactions.filter((t) => t.status === 'SUCCESS').length;
    const voidCount = filteredTransactions.filter((t) => t.status === 'VOID').length;

    return {
      labels: ['Sukses (Success)', 'Dibatalkan (Void)'],
      datasets: [
        {
          data: [successCount, voidCount],
          backgroundColor: ['#10b981', '#ef4444'],
        },
      ],
    };
  }, [filteredTransactions]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <section id="view-laporan-detail" className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-blue-700" />
            <span>Laporan Transaksi Detail & Visual Analytics</span>
          </h2>
          <p className="text-xs text-slate-500">
            Analisis statistik komprehensif, grafik tren, dan distribusi rekening transaksi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={onExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-blue-700" />
            Filter Laporan Detail
          </span>
          <button
            onClick={resetFilters}
            className="text-[11px] text-blue-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Tipe Transaksi</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-slate-50/50"
            >
              <option value="ALL">Semua Tipe Transaksi</option>
              <option value="TARIK TUNAI">TARIK TUNAI</option>
              <option value="SETOR TUNAI">SETOR TUNAI</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="PEMBAYARAN">PEMBAYARAN</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Akun Kas / Rekening</label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-slate-50/50"
            >
              <option value="ALL">Semua Rekening</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Status Transaksi</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-slate-50/50"
            >
              <option value="ALL">Semua Status</option>
              <option value="SUCCESS">SUCCESS (Berhasil)</option>
              <option value="VOID">VOID (Dibatalkan)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Cari Kata Kunci</label>
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Nasabah, ID, Penerima..."
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Nominal (Gross)
          </span>
          <p className="text-base sm:text-lg font-bold text-blue-900 leading-tight">
            {formatRp(stats.totalGross)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Profit Fee (Net)
          </span>
          <p className="text-base sm:text-lg font-bold text-emerald-600 leading-tight">
            {formatRp(stats.totalNet)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Jumlah Transaksi
          </span>
          <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            {stats.totalCount}{' '}
            <span className="text-xs font-normal text-slate-400">
              ({stats.validCount} valid)
            </span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Rata-Rata per Trx
          </span>
          <p className="text-base sm:text-lg font-bold text-indigo-700 leading-tight">
            {formatRp(stats.avgNominal)}
          </p>
        </div>
      </div>

      {/* 4 Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Line Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Grafik Tren Transaksi & Profit
              </h4>
              <p className="text-[10px] text-slate-400">Pertumbuhan volume transaksi dan keuntungan</p>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
              Line Chart
            </span>
          </div>
          <div className="h-60 relative">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { font: { size: 10 } } },
                },
                scales: {
                  x: { ticks: { font: { size: 9 } } },
                  y: { ticks: { font: { size: 9 } } },
                },
              }}
            />
          </div>
        </div>

        {/* Chart 2: Bar Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Diagram Batang Per Kategori
              </h4>
              <p className="text-[10px] text-slate-400">
                Perbandingan nominal & fee berdasarkan jenis layanan
              </p>
            </div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
              Bar Chart
            </span>
          </div>
          <div className="h-60 relative">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { font: { size: 10 } } },
                },
                scales: {
                  x: { ticks: { font: { size: 9 } } },
                  y: { ticks: { font: { size: 9 } } },
                },
              }}
            />
          </div>
        </div>

        {/* Chart 3: Pie Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                Diagram Pie Distribusi Rekening
              </h4>
              <p className="text-[10px] text-slate-400">
                Porsi penggunaan akun kas & rekening bank
              </p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
              Pie Chart
            </span>
          </div>
          <div className="h-60 relative flex items-center justify-center">
            <Pie
              data={pieChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
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

        {/* Chart 4: Doughnut Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-600" />
                Diagram Status Transaksi
              </h4>
              <p className="text-[10px] text-slate-400">Rasio transaksi Sukses vs Dibatalkan</p>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded">
              Doughnut
            </span>
          </div>
          <div className="h-60 relative flex items-center justify-center">
            <Doughnut
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
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

      {/* Comprehensive Detailed Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-4 space-y-3" id="printableReport">
        <div className="flex items-center justify-between pb-2 border-b">
          <h4 className="font-bold text-xs text-slate-800">Rincian Tabel Laporan Transaksi Lengkap</h4>
          <span className="text-[11px] text-slate-500 font-mono">
            {filteredTransactions.length} Data Transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                <th className="p-2.5">ID Trx</th>
                <th className="p-2.5">Waktu</th>
                <th className="p-2.5">Tipe</th>
                <th className="p-2.5">Nasabah</th>
                <th className="p-2.5">Tujuan</th>
                <th className="p-2.5">Rekening</th>
                <th className="p-2.5 text-right">Nominal</th>
                <th className="p-2.5 text-right">Biaya Cust</th>
                <th className="p-2.5 text-right">Biaya Admin</th>
                <th className="p-2.5 text-right">Net Profit</th>
                <th className="p-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center p-6 text-slate-400">
                    Tidak ada transaksi yang memenuhi kriteria filter
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  const isVoid = t.status === 'VOID';
                  const netProfit = t.feeCust - t.feeAdmin;
                  const accName = accountMap.get(t.accountId) || 'Utama';

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isVoid ? 'opacity-50 bg-slate-50' : ''
                      }`}
                    >
                      <td className="p-2.5 font-mono font-bold text-slate-700">#{t.id}</td>
                      <td className="p-2.5 font-mono text-slate-500 whitespace-nowrap">{t.time}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{t.type}</td>
                      <td className="p-2.5 text-slate-800">{t.cust}</td>
                      <td className="p-2.5 text-slate-600">{t.target}</td>
                      <td className="p-2.5 text-slate-600">{accName}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatRp(t.nominal)}
                      </td>
                      <td className="p-2.5 text-right text-slate-600 font-medium">
                        {formatRp(t.feeCust)}
                      </td>
                      <td className="p-2.5 text-right text-slate-500 font-medium">
                        {formatRp(t.feeAdmin)}
                      </td>
                      <td
                        className={`p-2.5 text-right font-bold ${
                          netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {isVoid ? 'Rp 0' : formatRp(netProfit)}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            isVoid ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredTransactions.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                <tr>
                  <td colSpan={6} className="p-2.5 text-right uppercase font-bold text-slate-600">
                    Total Ringkasan:
                  </td>
                  <td className="p-2.5 text-right font-bold text-blue-900">
                    {formatRp(stats.totalGross)}
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-700">
                    {formatRp(stats.totalFeeCust)}
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-500">
                    {formatRp(stats.totalFeeAdmin)}
                  </td>
                  <td className="p-2.5 text-right font-bold text-emerald-600">
                    {formatRp(stats.totalNet)}
                  </td>
                  <td className="p-2.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </section>
  );
};
