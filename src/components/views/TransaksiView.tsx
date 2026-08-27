import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  PlusCircle,
  Search,
  Printer,
  Edit3,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Account, Transaction, TransactionType, UserRole } from '../../types';
import { formatRp } from '../../utils/formatters';

interface TransaksiViewProps {
  transactions?: Transaction[];
  accounts?: Account[];
  currentRole: UserRole;
  onOpenNewTrx: () => void;
  onEditTrx: (trx: Transaction) => void;
  onViewReceipt: (trx: Transaction) => void;
  onConfirmVoid: (trx: Transaction) => void;
}

export const TransaksiView: React.FC<TransaksiViewProps> = ({
  transactions = [],
  accounts = [],
  currentRole,
  onOpenNewTrx,
  onEditTrx,
  onViewReceipt,
  onConfirmVoid,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const categories: (string | TransactionType)[] = [
    'SEMUA',
    'TARIK TUNAI',
    'SETOR TUNAI',
    'TRANSFER',
    'PEMBAYARAN',
  ];

  // Category counts & totals
  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const filtered =
        cat === 'SEMUA'
          ? (transactions || [])
          : (transactions || []).filter((t) => t && t.type === cat);

      const totalNom = filtered.reduce(
        (sum, t) => sum + (t && t.status !== 'VOID' ? t.nominal || 0 : 0),
        0
      );

      const totalProfit = filtered.reduce(
        (sum, t) => sum + (t && t.status !== 'VOID' ? (t.feeCust || 0) - (t.feeAdmin || 0) : 0),
        0
      );

      return {
        category: cat,
        count: filtered.length,
        totalNominal: totalNom,
        totalProfit,
      };
    });
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return (transactions || []).filter((t) => {
      if (!t) return false;
      const matchCat =
        activeCategory === 'SEMUA' || t.type === activeCategory;
      const matchSearch =
        !q ||
        (t.cust && t.cust.toLowerCase().includes(q)) ||
        (t.target && t.target.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q)) ||
        String(t.nominal || '').includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.refNumber && t.refNumber.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [transactions, activeCategory, searchQuery]);

  // Pagination
  const totalPages = Math.ceil((filteredTransactions || []).length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return (filteredTransactions || []).slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const accountMap = useMemo(() => {
    return new Map((accounts || []).map((a) => [a.id, a.name]));
  }, [accounts]);

  return (
    <section id="view-transaksi" className="space-y-5">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-700 text-white rounded-xl shadow-xs">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Pencatatan Transaksi Agen</h2>
            <p className="text-xs text-slate-500">Kelola catatan harian transaksi Mini ATM & BRILink</p>
          </div>
        </div>

        <button
          onClick={onOpenNewTrx}
          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Transaksi Baru</span>
        </button>
      </div>

      {/* Dynamic Category Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categoryStats.map((stat) => {
          const isActive = activeCategory === stat.category;
          return (
            <button
              key={stat.category}
              onClick={() => {
                setActiveCategory(stat.category);
                setCurrentPage(1);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-700 text-white border-blue-700 shadow-md transform scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider block ${
                    isActive ? 'text-blue-200' : 'text-slate-500'
                  }`}
                >
                  {stat.category}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {stat.count}
                </span>
              </div>
              <span className="text-sm font-bold block mt-1.5 leading-none">
                {formatRp(stat.totalNominal)}
              </span>
              <span
                className={`text-[10px] mt-1.5 block font-medium ${
                  isActive ? 'text-emerald-300' : 'text-emerald-600'
                }`}
              >
                Profit: {formatRp(stat.totalProfit)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Live Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nasabah, tujuan, nominal, ID..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
          />
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filter Aktif:</span>
          <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-md border border-blue-200 text-[11px]">
            {activeCategory}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-red-600 hover:underline ml-1"
            >
              Hapus Pencarian
            </button>
          )}
        </div>
      </div>

      {/* Main Transaction Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#003366] text-white font-semibold uppercase tracking-wider text-[11px]">
                <th className="p-3">Waktu</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Nasabah</th>
                <th className="p-3">Tujuan</th>
                <th className="p-3">Rekening</th>
                <th className="p-3 text-right">Nominal</th>
                <th className="p-3 text-right">Fee Cust</th>
                <th className="p-3 text-right">Fee Admin</th>
                <th className="p-3 text-right">Net Profit</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center p-8 text-slate-400">
                    <p className="font-semibold">Tidak ada transaksi yang cocok dengan filter atau pencarian</p>
                    <p className="text-[11px] mt-1">Coba ganti kategori filter atau kata kunci pencarian Anda</p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t) => {
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
                      <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        <span className="font-bold text-slate-700 block">#{t.id}</span>
                        <span>{t.time}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] inline-block ${
                            t.type === 'TARIK TUNAI'
                              ? 'bg-amber-100 text-amber-800'
                              : t.type === 'SETOR TUNAI'
                              ? 'bg-blue-100 text-blue-800'
                              : t.type === 'TRANSFER'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        {t.cust}
                        {t.phoneCust && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {t.phoneCust}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{t.target}</td>
                      <td className="p-3 text-slate-600 text-[11px]">{accName}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {formatRp(t.nominal)}
                      </td>
                      <td className="p-3 text-right text-emerald-600 font-semibold">
                        {formatRp(t.feeCust)}
                      </td>
                      <td className="p-3 text-right text-slate-500 font-medium">
                        {formatRp(t.feeAdmin)}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        {isVoid ? 'Rp 0' : formatRp(netProfit)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            isVoid
                              ? 'bg-red-500 text-white'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewReceipt(t)}
                            title="Cetak Struk Thermal / Kirim WA"
                            className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-md text-slate-600 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditTrx(t)}
                            title="Edit Transaksi"
                            className="p-1.5 hover:bg-blue-50 hover:text-blue-700 rounded-md text-blue-600 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {currentRole === 'Admin' && !isVoid && (
                            <button
                              onClick={() => onConfirmVoid(t)}
                              title="Void / Batalkan Transaksi"
                              className="p-1.5 hover:bg-red-50 hover:text-red-700 rounded-md text-red-600 transition-colors"
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

        {/* Table Pagination / Summary Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Menampilkan{' '}
            <strong className="text-slate-800">
              {filteredTransactions.length === 0
                ? '0'
                : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                    currentPage * itemsPerPage,
                    filteredTransactions.length
                  )}`}
            </strong>{' '}
            dari <strong className="text-slate-800">{filteredTransactions.length}</strong> transaksi
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-2.5 py-1 rounded border text-xs font-semibold flex items-center gap-0.5 ${
                currentPage === 1
                  ? 'bg-white border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="px-2.5 py-1 bg-blue-700 text-white rounded font-bold text-xs">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-2.5 py-1 rounded border text-xs font-semibold flex items-center gap-0.5 ${
                currentPage === totalPages || totalPages === 0
                  ? 'bg-white border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
