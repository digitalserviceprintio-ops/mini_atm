import React, { useState } from 'react';
import {
  X,
  UserCheck,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Award,
  TrendingUp,
  History,
  PlusCircle,
  MinusCircle,
  Gift,
  Printer,
  Sparkles,
  ShoppingBag,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  AgentProfile,
  CustomerMember,
  MemberPointHistory,
  MemberTier,
  PosSale,
  Transaction,
} from '../../types';
import { formatRp } from '../../utils/formatters';

interface ModalMemberDetailProps {
  isOpen: boolean;
  onClose: () => void;
  member: CustomerMember | null;
  pointLogs?: MemberPointHistory[];
  pointHistory?: MemberPointHistory[];
  memberTransactions?: Transaction[];
  transactions?: Transaction[];
  memberPosSales?: PosSale[];
  posSales?: PosSale[];
  profile: AgentProfile;
  onOpenCard?: (member: CustomerMember) => void;
  onOpenCardModal?: (member: CustomerMember) => void;
  onOpenEditModal?: (member: CustomerMember) => void;
  onAdjustPoints: (
    memberId: string,
    pointsChange: number,
    type: any,
    description: string
  ) => void;
}

export const ModalMemberDetail: React.FC<ModalMemberDetailProps> = ({
  isOpen,
  onClose,
  member,
  pointLogs,
  pointHistory,
  memberTransactions,
  transactions,
  memberPosSales,
  posSales,
  profile,
  onOpenCard,
  onOpenCardModal,
  onOpenEditModal,
  onAdjustPoints,
}) => {
  const [activeTab, setActiveTab] = useState<'poin' | 'transaksi' | 'pos' | 'tukar'>('poin');
  const [adjustPointsVal, setAdjustPointsVal] = useState<string>('5');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustMode, setAdjustMode] = useState<'add' | 'redeem'>('add');

  const handleOpenCard = onOpenCard || onOpenCardModal || (() => {});

  if (!isOpen || !member) return null;

  const allPointLogs = pointLogs || pointHistory || [];
  const currentMemberPointLogs = allPointLogs.filter((l) => l.memberId === member.id);

  const finalMemberTrx = memberTransactions || (transactions ? transactions.filter((t) => t.memberId === member.id) : []);
  const finalMemberPos = memberPosSales || (posSales ? posSales.filter((s) => s.memberId === member.id) : []);

  const getTierBadge = (tier: MemberTier) => {
    switch (tier) {
      case 'VIP':
        return 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold border-amber-300 shadow-xs';
      case 'Platinum':
        return 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900 font-bold border-slate-300';
      case 'Gold':
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold border-yellow-300';
      case 'Silver':
      default:
        return 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 font-bold border-slate-400';
    }
  };

  const handlePointSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(adjustPointsVal, 10);
    if (!val || val <= 0) {
      alert('Jumlah poin harus lebih dari 0');
      return;
    }

    if (adjustMode === 'redeem' && member.points < val) {
      alert(`Saldo poin member (${member.points} Poin) tidak mencukupi untuk ditukar ${val} Poin!`);
      return;
    }

    const pointsChange = adjustMode === 'add' ? val : -val;
    const type = adjustMode === 'add' ? 'BONUS' : 'REDEEM';
    const desc =
      adjustReason.trim() ||
      (adjustMode === 'add'
        ? `Penambahan bonus poin manual (+${val} Poin)`
        : `Penukaran reward/diskon belanja (-${val} Poin)`);

    onAdjustPoints(member.id, pointsChange, type, desc);
    setAdjustPointsVal('5');
    setAdjustReason('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-amber-300 text-sm">
                {member.name.substring(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{member.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${getTierBadge(member.tier)}`}>
                  {member.tier}
                </span>
              </div>
              <p className="text-xs text-amber-200/80 font-mono tracking-wider">
                {member.memberNumber} &bull; ID: {member.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenCard(member)}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Lihat & Cetak Kartu Member VIP"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Kartu</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Member Key Metrics Card Banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Saldo Poin</span>
            </div>
            <span className="text-base font-extrabold font-mono text-amber-600">
              {member.points} <span className="text-xs font-normal text-slate-500">Poin</span>
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <span>Total Transaksi</span>
            </div>
            <span className="text-base font-extrabold font-mono text-slate-900">
              {member.totalTransactions ?? member.totalTrxCount ?? (finalMemberTrx.length + finalMemberPos.length)} &times;
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
              <span>Total Belanja</span>
            </div>
            <span className="text-xs font-bold font-mono text-emerald-700 block truncate">
              {formatRp(member.totalSpent || 0)}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <Clock className="w-3.5 h-3.5 text-purple-500" />
              <span>Bergabung</span>
            </div>
            <span className="text-xs font-semibold text-slate-700 block truncate">
              {member.joinDate || member.joinedDate || 'Member Baru'}
            </span>
          </div>
        </div>

        {/* Member Profile Quick Detail */}
        <div className="px-5 py-2.5 bg-blue-50/60 border-b border-blue-100 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-700 shrink-0">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold">{member.phone}</span>
          </div>
          {member.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>{member.email}</span>
            </div>
          )}
          {member.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span className="truncate max-w-[280px]">{member.address}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-slate-200 bg-white flex items-center gap-2 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('poin')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'poin'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Poin ({currentMemberPointLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tukar')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tukar'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-amber-500" />
            <span>Tukar & Atur Poin</span>
          </button>

          <button
            onClick={() => setActiveTab('transaksi')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'transaksi'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Mini ATM ({finalMemberTrx.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pos'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Belanja POS ({finalMemberPos.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: RIWAYAT POIN */}
          {activeTab === 'poin' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-slate-600 pb-1">
                <span className="font-semibold text-slate-800">
                  Log Perubahan Saldo Poin Pelanggan
                </span>
                <span className="text-[11px] text-slate-400">
                  Setiap transaksi = +1 Poin resmi
                </span>
              </div>

              {currentMemberPointLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-1">
                  <Award className="w-8 h-8 mx-auto opacity-30 text-amber-400" />
                  <p>Belum ada riwayat perolehan poin tercatat.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  {currentMemberPointLogs.map((log) => {
                    const change = log.pointsChange ?? (log.type === 'REDEEM' || log.type === 'REDEEM_POINT' || log.type === 'EXPIRED_POINT' ? -(log.points || 0) : (log.points || 0));
                    const isPositive = change > 0;
                    return (
                      <div key={log.id} className="p-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                              isPositive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {log.description}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span>{log.time}</span>
                              {(log.referenceId || log.refNumber) && (
                                <span className="font-mono bg-slate-100 px-1 rounded text-slate-600">
                                  Ref: {log.referenceId || log.refNumber}
                                </span>
                              )}
                              {log.operatorName && (
                                <span>&bull; Operator: {log.operatorName}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`font-mono font-extrabold text-sm ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? `+${change}` : change} Poin
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TUKAR & ATUR POIN */}
          {activeTab === 'tukar' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Program Reward & Penukaran Poin Member</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Member saat ini memiliki <strong>{member.points} Poin</strong>. Anda dapat menambahkan bonus poin apresiasi atau menukarkan poin dengan potongan belanja/hadiah.
                </p>
              </div>

              <form onSubmit={handlePointSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustMode('add')}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      adjustMode === 'add'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tambah Poin Bonus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustMode('redeem')}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      adjustMode === 'redeem'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>Tukar / Kurangi Poin</span>
                  </button>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah Poin yang {adjustMode === 'add' ? 'Ditambahkan' : 'Ditukarkan'}:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={adjustPointsVal}
                      onChange={(e) => setAdjustPointsVal(e.target.value)}
                      className="w-32 px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm bg-white"
                    />
                    <span className="font-semibold text-slate-500">Poin</span>

                    <div className="flex items-center gap-1 ml-auto">
                      {[1, 5, 10, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setAdjustPointsVal(String(num))}
                          className="px-2 py-1 rounded bg-white border border-slate-300 hover:bg-slate-200 font-mono text-[11px] font-bold cursor-pointer"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Keterangan / Alasan (Opsional):
                  </label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder={
                      adjustMode === 'add'
                        ? 'Contoh: Bonus transaksi ke-10 / Promo Ulang Tahun'
                        : 'Contoh: Tukar diskon belanja Rp 10.000 / Hadiah Mug'
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-lg text-white font-bold transition-colors cursor-pointer shadow-sm ${
                    adjustMode === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {adjustMode === 'add' ? 'Simpan Penambahan Poin' : 'Tukarkan Poin Member'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: TRANSAKSI MINI ATM */}
          {activeTab === 'transaksi' && (
            <div className="space-y-2">
              <span className="font-semibold text-slate-800 block">
                Riwayat Transaksi Mini ATM / Pembayaran Terkait ({finalMemberTrx.length})
              </span>

              {finalMemberTrx.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CreditCard className="w-8 h-8 mx-auto opacity-30 text-blue-400 mb-1" />
                  <p>Belum ada transaksi Mini ATM yang terhubung dengan member ini.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                  {finalMemberTrx.map((trx) => (
                    <div key={trx.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{trx.type}</span>
                          <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                            {trx.id}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{trx.time} &bull; Tujuan: {trx.target}</p>
                      </div>
                      <span className="font-bold font-mono text-slate-900">
                        {formatRp(trx.nominal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BELANJA POS */}
          {activeTab === 'pos' && (
            <div className="space-y-2">
              <span className="font-semibold text-slate-800 block">
                Riwayat Belanja Barang Kasir POS ({finalMemberPos.length})
              </span>

              {finalMemberPos.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ShoppingBag className="w-8 h-8 mx-auto opacity-30 text-emerald-400 mb-1" />
                  <p>Belum ada riwayat belanja barang fisik di kasir POS.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                  {finalMemberPos.map((sale) => (
                    <div key={sale.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
                          <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                            {sale.totalQty} Item
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {sale.time} &bull; Kasir: {sale.cashierName}
                        </p>
                      </div>
                      <span className="font-bold font-mono text-emerald-800">
                        {formatRp(sale.totalRevenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button
            onClick={() => handleOpenCard(member)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Lihat Kartu Member</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
