import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  PlusCircle,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { Account, CashMutation, Transaction } from '../../types';
import { formatRp } from '../../utils/formatters';

interface ArusKasViewProps {
  transactions: Transaction[];
  accounts: Account[];
  mutations: CashMutation[];
  onOpenNewMutation: () => void;
}

export const ArusKasView: React.FC<ArusKasViewProps> = ({
  transactions,
  accounts,
  mutations,
  onOpenNewMutation,
}) => {
  const [filterAccount, setFilterAccount] = useState<string>('ALL');

  const accountMap = useMemo(() => {
    return new Map(accounts.map((a) => [a.id, a.name]));
  }, [accounts]);

  // Combined mutation entries (from transactions + manual cash mutations)
  const combinedEntries = useMemo(() => {
    const list: Array<{
      id: string;
      time: string;
      accountName: string;
      type: string;
      description: string;
      nominal: number;
      feeMargin: number;
      isPositive: boolean;
    }> = [];

    // From transactions
    transactions.forEach((t) => {
      if (t.status !== 'VOID') {
        const acc = accountMap.get(t.accountId) || 'Kas Utama';
        list.push({
          id: t.id,
          time: t.time,
          accountName: acc,
          type: t.type,
          description: `${t.cust} → ${t.target}${t.notes ? ` (${t.notes})` : ''}`,
          nominal: t.nominal,
          feeMargin: t.feeCust - t.feeAdmin,
          isPositive: t.type === 'SETOR TUNAI' || t.type === 'PEMBAYARAN',
        });
      }
    });

    // From manual mutations
    mutations.forEach((m) => {
      const acc = accountMap.get(m.accountId) || 'Kas Utama';
      const toAcc = m.toAccountId ? accountMap.get(m.toAccountId) : null;
      list.push({
        id: m.id,
        time: m.time,
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
        isPositive: m.type === 'MASUK',
      });
    });

    // Filter by account if selected
    if (filterAccount !== 'ALL') {
      const targetAccName = accountMap.get(filterAccount);
      return list.filter((item) => item.accountName.includes(targetAccName || ''));
    }

    return list;
  }, [transactions, mutations, accountMap, filterAccount]);

  const summary = useMemo(() => {
    let totalIn = 0;
    let totalProfit = 0;
    let count = combinedEntries.length;

    combinedEntries.forEach((item) => {
      totalIn += item.nominal;
      totalProfit += item.feeMargin;
    });

    return {
      totalIn,
      totalProfit,
      count,
    };
  }, [combinedEntries]);

  return (
    <section id="view-arus-kas" className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-700" />
            <span>Laporan Arus Kas & Mutasi Rekening</span>
          </h2>
          <p className="text-xs text-slate-500">
            Pantau arus mutasi uang masuk, uang keluar, serta porsi keuntungan agen per rekening
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
              Total Mutasi Diproses
            </p>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-900 leading-tight">
            {formatRp(summary.totalIn)}
          </p>
          <span className="text-[10px] text-emerald-700 block">Akumulasi seluruh arus kas</span>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-blue-800 font-bold uppercase tracking-wider">
              Total Keuntungan Bersih (Fee)
            </p>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-900 leading-tight">
            {formatRp(summary.totalProfit)}
          </p>
          <span className="text-[10px] text-blue-700 block">Net margin profit fee operasional</span>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-indigo-800 font-bold uppercase tracking-wider">
              Total Frekuensi Mutasi
            </p>
            <Wallet className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-indigo-900 leading-tight">
            {summary.count} Mutasi
          </p>
          <span className="text-[10px] text-indigo-700 block">Tercatat dalam sistem</span>
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
            {combinedEntries.length} Baris Mutasi
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
              {combinedEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-6 text-slate-400">
                    Belum ada riwayat mutasi kas
                  </td>
                </tr>
              ) : (
                combinedEntries.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {item.time}
                    </td>
                    <td className="p-3 text-slate-800 font-semibold">{item.accountName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700 inline-block">
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{item.description}</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatRp(item.nominal)}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600">
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
