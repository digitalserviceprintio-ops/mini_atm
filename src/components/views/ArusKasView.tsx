import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  PlusCircle,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Account, CashMutation, Transaction } from '../../types';
import { formatRp } from '../../utils/formatters';

interface ArusKasViewProps {
  transactions?: Transaction[];
  accounts?: Account[];
  mutations?: CashMutation[];
  onOpenNewMutation: () => void;
}

type ChartMode = 'liquidity_trend' | 'inflow_vs_outflow' | 'account_balance';
type TimeRange = '7d' | '14d' | '30d' | 'all';

interface DailyFlowData {
  dateKey: string;
  displayDate: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  runningBalance: number;
  txCount: number;
}

export const ArusKasView: React.FC<ArusKasViewProps> = ({
  transactions = [],
  accounts = [],
  mutations = [],
  onOpenNewMutation,
}) => {
  const [filterAccount, setFilterAccount] = useState<string>('ALL');
  const [chartMode, setChartMode] = useState<ChartMode>('liquidity_trend');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const accountMap = useMemo(() => {
    return new Map((accounts || []).map((a) => [a.id, a.name]));
  }, [accounts]);

  // Calculate current total balance across all accounts or selected account
  const currentTotalLiquidity = useMemo(() => {
    if (filterAccount !== 'ALL') {
      const target = (accounts || []).find((a) => a.id === filterAccount);
      return target ? target.balance : 0;
    }
    return (accounts || []).reduce((sum, a) => sum + (a.balance || 0), 0);
  }, [accounts, filterAccount]);

  // Combined mutation entries (from transactions + manual cash mutations)
  const combinedEntries = useMemo(() => {
    const list: Array<{
      id: string;
      time: string;
      rawDate: string;
      accountId: string;
      accountName: string;
      type: string;
      description: string;
      nominal: number;
      feeMargin: number;
      isPositive: boolean;
      inflow: number;
      outflow: number;
    }> = [];

    // Process from transactions
    (transactions || []).forEach((t) => {
      if (t && t.status !== 'VOID') {
        const acc = accountMap.get(t.accountId) || 'Kas Utama';
        const isPositive = t.type === 'SETOR TUNAI' || t.type === 'PEMBAYARAN';
        // For agent liquidity:
        // Setor Tunai / Pembayaran: Customer gives cash (Inflow into physical cash/account), Agent forwards nominal
        // Tarik Tunai: Agent dispenses cash (Outflow from cash), bank receives nominal + fee
        const inflow = isPositive ? t.nominal + t.feeCust : 0;
        const outflow = !isPositive ? t.nominal : t.feeAdmin;

        // Parse date for grouping
        const rawDate = (t.time || '').substring(0, 11).trim();

        list.push({
          id: t.id,
          time: t.time,
          rawDate,
          accountId: t.accountId,
          accountName: acc,
          type: t.type,
          description: `${t.cust} → ${t.target}${t.notes ? ` (${t.notes})` : ''}`,
          nominal: t.nominal,
          feeMargin: t.feeCust - t.feeAdmin,
          isPositive,
          inflow,
          outflow,
        });
      }
    });

    // Process from manual mutations
    (mutations || []).forEach((m) => {
      if (!m) return;
      const acc = accountMap.get(m.accountId) || 'Kas Utama';
      const toAcc = m.toAccountId ? accountMap.get(m.toAccountId) : null;
      const isInflow = m.type === 'MASUK';
      const isOutflow = m.type === 'KELUAR';
      const rawDate = (m.time || '').substring(0, 11).trim();

      list.push({
        id: m.id,
        time: m.time,
        rawDate,
        accountId: m.accountId,
        accountName: toAcc ? `${acc} → ${toAcc}` : acc,
        type:
          m.type === 'TRANSFER_INTERNAL'
            ? 'PINDAH SALDO'
            : m.type === 'MASUK'
            ? 'KAS MASUK'
            : 'KAS KELUAR',
        description: m.description,
        nominal: m.amount,
        feeMargin: m.feeMargin || 0,
        isPositive: isInflow,
        inflow: isInflow ? m.amount : 0,
        outflow: isOutflow ? m.amount : 0,
      });
    });

    // Sort newest first for table
    return list.sort((a, b) => (b.time > a.time ? 1 : -1));
  }, [transactions, mutations, accountMap]);

  // Filtered entries according to selected account
  const filteredEntries = useMemo(() => {
    if (filterAccount === 'ALL') return combinedEntries;
    return combinedEntries.filter((item) => item.accountId === filterAccount);
  }, [combinedEntries, filterAccount]);

  // Generate Daily Trend Data for Recharts
  const chartData = useMemo<DailyFlowData[]>(() => {
    const dailyMap = new Map<string, { inflow: number; outflow: number; count: number }>();

    // Sort chronologically ascending
    const ascendingEntries = [...filteredEntries].reverse();

    ascendingEntries.forEach((item) => {
      const dateKey = item.rawDate || item.time.split(' ')[0] || 'Hari Ini';
      const existing = dailyMap.get(dateKey) || { inflow: 0, outflow: 0, count: 0 };
      existing.inflow += item.inflow;
      existing.outflow += item.outflow;
      existing.count += 1;
      dailyMap.set(dateKey, existing);
    });

    // If empty, generate fallback baseline for visual appeal
    if (dailyMap.size === 0) {
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        dailyMap.set(dStr, { inflow: 0, outflow: 0, count: 0 });
      }
    }

    const keys = Array.from(dailyMap.keys());
    let selectedKeys = keys;

    if (timeRange === '7d') {
      selectedKeys = keys.slice(-7);
    } else if (timeRange === '14d') {
      selectedKeys = keys.slice(-14);
    } else if (timeRange === '30d') {
      selectedKeys = keys.slice(-30);
    }

    // Cumulative balance calculation
    let accumulator = currentTotalLiquidity;
    // Calculate backwards to estimate historical trajectory
    const points: DailyFlowData[] = [];

    selectedKeys.forEach((dateKey) => {
      const data = dailyMap.get(dateKey) || { inflow: 0, outflow: 0, count: 0 };
      const net = data.inflow - data.outflow;
      accumulator += net;

      points.push({
        dateKey,
        displayDate: dateKey,
        inflow: data.inflow,
        outflow: data.outflow,
        netFlow: net,
        runningBalance: Math.max(0, accumulator),
        txCount: data.count,
      });
    });

    return points;
  }, [filteredEntries, timeRange, currentTotalLiquidity]);

  // Account Distribution Data for Recharts Bar
  const accountDistributionData = useMemo(() => {
    return (accounts || []).map((acc) => ({
      name: (acc?.name || 'Akun').replace(/\(.*\)/, '').trim(),
      fullName: acc?.name || 'Akun',
      type: acc?.type || 'Cash',
      balance: acc?.balance || 0,
    }));
  }, [accounts]);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let totalProfit = 0;
    let count = filteredEntries.length;

    filteredEntries.forEach((item) => {
      totalIn += item.inflow;
      totalOut += item.outflow;
      totalProfit += item.feeMargin;
    });

    return {
      totalIn,
      totalOut,
      totalProfit,
      netFlow: totalIn - totalOut,
      count,
    };
  }, [filteredEntries]);

  // Custom Tooltip Formatter for Recharts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: DailyFlowData = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <span className="font-bold text-slate-200">{label}</span>
            <span className="text-[10px] bg-blue-600 px-1.5 py-0.5 rounded text-white font-mono">
              {dataPoint.txCount} Mutasi
            </span>
          </div>

          {chartMode === 'liquidity_trend' ? (
            <>
              <div className="flex justify-between items-center text-blue-300">
                <span>Saldo Likuiditas:</span>
                <span className="font-bold font-mono">{formatRp(dataPoint.runningBalance)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 text-[11px]">
                <span>Net Arus Harian:</span>
                <span
                  className={`font-mono font-semibold ${
                    dataPoint.netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {dataPoint.netFlow >= 0 ? '+' : ''}
                  {formatRp(dataPoint.netFlow)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center text-emerald-400">
                <span>Arus Kas Masuk:</span>
                <span className="font-bold font-mono">+{formatRp(dataPoint.inflow)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-400">
                <span>Arus Kas Keluar:</span>
                <span className="font-bold font-mono">-{formatRp(dataPoint.outflow)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-slate-200 font-semibold">
                <span>Net Surplus/Defisit:</span>
                <span
                  className={`font-mono ${
                    dataPoint.netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {dataPoint.netFlow >= 0 ? '+' : ''}
                  {formatRp(dataPoint.netFlow)}
                </span>
              </div>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <section id="view-arus-kas" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-700" />
            <span>Laporan Arus Kas & Analisis Likuiditas Harian</span>
          </h2>
          <p className="text-xs text-slate-500">
            Visualisasi grafik tren saldo kas, komparasi perputaran uang masuk-keluar, dan catatan mutasi rekening.
          </p>
        </div>

        <button
          onClick={onOpenNewMutation}
          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Catat Mutasi / Pindah Saldo</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Total Saldo Kas / Likuiditas Tersedia */}
        <div className="bg-white border border-blue-200 p-4 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-blue-800 font-bold uppercase tracking-wider">
              Total Likuiditas Tersedia
            </p>
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 leading-tight">
            {formatRp(currentTotalLiquidity)}
          </p>
          <span className="text-[10px] text-slate-500 block">
            {filterAccount === 'ALL' ? 'Total saldo seluruh rekening' : 'Saldo rekening terpilih'}
          </span>
        </div>

        {/* Total Kas Masuk */}
        <div className="bg-white border border-emerald-200 p-4 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
              Total Kas Masuk (Inflow)
            </p>
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-700 leading-tight">
            +{formatRp(summary.totalIn)}
          </p>
          <span className="text-[10px] text-slate-500 block">Setoran & Kas masuk periode ini</span>
        </div>

        {/* Total Kas Keluar */}
        <div className="bg-white border border-rose-200 p-4 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-rose-800 font-bold uppercase tracking-wider">
              Total Kas Keluar (Outflow)
            </p>
            <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-rose-700 leading-tight">
            -{formatRp(summary.totalOut)}
          </p>
          <span className="text-[10px] text-slate-500 block">Penarikan & Pengeluaran operasional</span>
        </div>

        {/* Total Net Profit Fee Agen */}
        <div className="bg-white border border-amber-200 p-4 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-amber-800 font-bold uppercase tracking-wider">
              Total Margin Keuntungan (Fee)
            </p>
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-amber-700 leading-tight">
            +{formatRp(summary.totalProfit)}
          </p>
          <span className="text-[10px] text-slate-500 block">
            Fee bersih dari {summary.count} transaksi
          </span>
        </div>
      </div>

      {/* RECHARTS VISUALIZATION COMPONENT */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-800">
                Grafik Visualisasi Likuiditas & Arus Kas
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Pantau tren saldo kumulatif dan dinamika likuiditas harian secara real-time.
            </p>
          </div>

          {/* Controls: Mode Switcher & Time Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Mode Buttons */}
            <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center text-xs">
              <button
                onClick={() => setChartMode('liquidity_trend')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  chartMode === 'liquidity_trend'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tren Saldo Likuiditas
              </button>
              <button
                onClick={() => setChartMode('inflow_vs_outflow')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  chartMode === 'inflow_vs_outflow'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Arus Masuk vs Keluar
              </button>
              <button
                onClick={() => setChartMode('account_balance')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  chartMode === 'account_balance'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Distribusi Rekening
              </button>
            </div>

            {/* Timeframe selector */}
            {chartMode !== 'account_balance' && (
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
                <button
                  onClick={() => setTimeRange('7d')}
                  className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    timeRange === '7d'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => setTimeRange('14d')}
                  className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    timeRange === '14d'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  14 Hari
                </button>
                <button
                  onClick={() => setTimeRange('30d')}
                  className={`px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${
                    timeRange === '30d'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  30 Hari
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RECHARTS CANVAS */}
        <div className="h-72 w-full pt-2">
          {chartMode === 'liquidity_trend' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="liquidityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#003366" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#003366" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="runningBalance"
                  name="Saldo Likuiditas"
                  stroke="#003366"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#liquidityGrad)"
                  dot={{ r: 4, fill: '#003366', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, stroke: '#003366', strokeWidth: 2, fill: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {chartMode === 'inflow_vs_outflow' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `Rp ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  formatter={(val) => (val === 'inflow' ? 'Uang Masuk (+)' : 'Uang Keluar (-)')}
                />
                <Bar dataKey="inflow" name="inflow" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="outflow" name="outflow" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartMode === 'account_balance' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={accountDistributionData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}jt`}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  width={140}
                />
                <Tooltip
                  formatter={(val: any) => [formatRp(Number(val)), 'Saldo Tersedia']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    borderColor: '#334155',
                  }}
                />
                <Bar dataKey="balance" name="Saldo" fill="#2563eb" radius={[0, 6, 6, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart Footer Indicator Info */}
        <div className="bg-slate-50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border border-slate-200/80">
          <div className="flex items-center gap-2 text-slate-600">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Grafik likuiditas diperbarui otomatis setiap kali ada transaksi agen, penjualan POS, atau mutasi saldo internal.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700">Status Likuiditas: Optimal</span>
          </div>
        </div>
      </div>

      {/* Main Mutasi Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-blue-700" />
            <span>Filter Rekening:</span>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="p-1.5 border border-slate-300 rounded-lg text-xs font-normal bg-slate-50 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            >
              <option value="ALL">Semua Akun Rekening</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] text-slate-500 font-mono">
            {filteredEntries.length} Baris Mutasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                <th className="p-3">Waktu</th>
                <th className="p-3">Akun Kas</th>
                <th className="p-3">Tipe Mutasi</th>
                <th className="p-3">Keterangan</th>
                <th className="p-3 text-right">Nominal</th>
                <th className="p-3 text-right">Fee Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-slate-400">
                    Belum ada riwayat mutasi kas
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {item.time}
                    </td>
                    <td className="p-3 text-slate-800 font-semibold">{item.accountName}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] inline-block ${
                          item.type === 'SETOR TUNAI' || item.type === 'KAS MASUK'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.type === 'TARIK TUNAI' || item.type === 'KAS KELUAR'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{item.description}</td>
                    <td
                      className={`p-3 text-right font-bold font-mono ${
                        item.isPositive ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {item.isPositive ? '+' : ''}
                      {formatRp(item.nominal)}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600 font-mono">
                      {item.feeMargin > 0 ? `+${formatRp(item.feeMargin)}` : 'Rp 0'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
