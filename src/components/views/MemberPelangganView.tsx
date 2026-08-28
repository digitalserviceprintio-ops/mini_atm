import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Award,
  CreditCard,
  Phone,
  Printer,
  Sparkles,
  TrendingUp,
  Gift,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Filter,
  Layers,
  ShoppingBag,
  ShieldCheck,
  Tag,
  Copy,
  Check,
  Coins,
  Settings,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import {
  AgentProfile,
  CustomerMember,
  MemberPointHistory,
  MemberRewardItem,
  MemberTier,
  MemberVoucherClaim,
  PointExchangeSettings,
  PosSale,
  Transaction,
  UserRole,
} from '../../types';
import { formatRp } from '../../utils/formatters';

interface MemberPelangganViewProps {
  members: CustomerMember[];
  rewards?: MemberRewardItem[];
  voucherClaims?: MemberVoucherClaim[];
  pointSettings?: PointExchangeSettings;
  pointLogs?: MemberPointHistory[];
  pointHistory?: MemberPointHistory[];
  transactions?: Transaction[];
  posSales?: PosSale[];
  profile: AgentProfile;
  currentRole: UserRole;
  onOpenAddMember?: () => void;
  onOpenNewMember?: () => void;
  onEditMember: (member: CustomerMember) => void;
  onDeleteMember: (memberId: string) => void;
  onOpenCardModal?: (member: CustomerMember) => void;
  onViewCard?: (member: CustomerMember) => void;
  onOpenDetailModal?: (member: CustomerMember) => void;
  onViewDetail?: (member: CustomerMember) => void;
  onNavigateToTrx?: () => void;
  onNavigateToPOS?: () => void;
  // Reward & Point Management Callbacks
  onOpenAddReward?: () => void;
  onEditReward?: (reward: MemberRewardItem) => void;
  onDeleteReward?: (rewardId: string) => void;
  onOpenPointSettings?: () => void;
  onOpenClaimModal?: (member?: CustomerMember, reward?: MemberRewardItem) => void;
  onViewVoucherReceipt?: (voucher: MemberVoucherClaim) => void;
  onToggleVoucherUsed?: (voucherId: string) => void;
}

export const MemberPelangganView: React.FC<MemberPelangganViewProps> = ({
  members = [],
  rewards = [],
  voucherClaims = [],
  pointSettings = { minPointsRedeem: 50, pointsPerStep: 50, rupiahPerStep: 5000, enableDirectDiscounts: true },
  pointLogs,
  pointHistory,
  transactions = [],
  posSales = [],
  profile,
  currentRole,
  onOpenAddMember,
  onOpenNewMember,
  onEditMember,
  onDeleteMember,
  onOpenCardModal,
  onViewCard,
  onOpenDetailModal,
  onViewDetail,
  onNavigateToTrx,
  onNavigateToPOS,
  onOpenAddReward,
  onEditReward,
  onDeleteReward,
  onOpenPointSettings,
  onOpenClaimModal,
  onViewVoucherReceipt,
  onToggleVoucherUsed,
}) => {
  const handleOpenAdd = onOpenAddMember || onOpenNewMember || (() => {});
  const handleOpenCard = onOpenCardModal || onViewCard || (() => {});
  const handleOpenDetail = onOpenDetailModal || onViewDetail || (() => {});

  // Sub-tabs: 'members' | 'rewards' | 'vouchers'
  const [activeSubTab, setActiveSubTab] = useState<'members' | 'rewards' | 'vouchers'>('members');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Rewards filter
  const [rewardCategoryFilter, setRewardCategoryFilter] = useState<string>('ALL');
  // Vouchers filter
  const [voucherStatusFilter, setVoucherStatusFilter] = useState<string>('ALL');

  const isAdmin = currentRole === 'Admin';
  const minPoints = pointSettings?.minPointsRedeem ?? 50;
  const pointsPerStep = pointSettings?.pointsPerStep ?? 50;
  const rupiahPerStep = pointSettings?.rupiahPerStep ?? 5000;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.barcode && m.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchTier = tierFilter === 'ALL' || m.tier === tierFilter;
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;

      return matchSearch && matchTier && matchStatus;
    });
  }, [members, searchTerm, tierFilter, statusFilter]);

  // Filtered rewards
  const filteredRewards = useMemo(() => {
    return rewards.filter((r) => {
      const matchCategory = rewardCategoryFilter === 'ALL' || r.category === rewardCategoryFilter;
      const matchSearch =
        !searchTerm ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [rewards, rewardCategoryFilter, searchTerm]);

  // Filtered vouchers
  const filteredVouchers = useMemo(() => {
    return voucherClaims.filter((v) => {
      const matchStatus = voucherStatusFilter === 'ALL' || v.status === voucherStatusFilter;
      const matchSearch =
        !searchTerm ||
        v.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.voucherCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.rewardName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [voucherClaims, voucherStatusFilter, searchTerm]);

  // Key Statistics
  const stats = useMemo(() => {
    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === 'ACTIVE').length;
    const totalPoints = members.reduce((acc, m) => acc + (m.points || 0), 0);
    const vipCount = members.filter((m) => m.tier === 'VIP' || m.tier === 'PLATINUM' || m.tier === 'Platinum').length;
    const totalMemberTransactions = members.reduce((acc, m) => acc + (m.totalTransactions || 0), 0);
    const totalMemberSpent = members.reduce((acc, m) => acc + (m.totalSpent || 0), 0);
    const activeVouchersCount = voucherClaims.filter((v) => v.status === 'ACTIVE').length;
    const totalRewardsCount = rewards.length;

    return {
      totalMembers,
      activeMembers,
      totalPoints,
      vipCount,
      totalMemberTransactions,
      totalMemberSpent,
      activeVouchersCount,
      totalRewardsCount,
    };
  }, [members, voucherClaims, rewards]);

  const getTierBadgeStyle = (tier: MemberTier) => {
    switch (tier) {
      case 'PLATINUM':
      case 'Platinum':
        return 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900 font-bold border-slate-300';
      case 'VIP':
      case 'GOLD':
      case 'Gold':
        return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-extrabold border-amber-300 shadow-2xs';
      case 'SILVER':
      case 'Silver':
        return 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 font-bold border-slate-400';
      case 'BRONZE':
      case 'Bronze':
      default:
        return 'bg-amber-100 text-amber-900 font-semibold border-amber-200';
    }
  };

  const getRewardCategoryLabel = (category: string) => {
    switch (category) {
      case 'DISCOUNT_TRX':
        return { label: 'Diskon Mini ATM', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'FREE_ADMIN':
        return { label: 'Gratis Admin', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'DISCOUNT_POS':
        return { label: 'Diskon Kasir POS', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'PHYSICAL_GIFT':
        return { label: 'Hadiah Fisik', color: 'bg-amber-50 text-amber-900 border-amber-200' };
      case 'CASHBACK':
        return { label: 'Cashback Saldo', color: 'bg-teal-50 text-teal-900 border-teal-200' };
      default:
        return { label: 'Reward Umum', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-5" id="memberPelangganSection">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#003366] via-blue-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md border border-blue-800/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 bg-blue-600/80 rounded-xl shadow-xs">
              <Users className="w-5 h-5 text-amber-300" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Manajemen Member & Reward Poin
            </h2>
            <span className="text-[10px] bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full shadow-xs uppercase">
              +1 Poin / Trx • Min. {minPoints} Poin Tukar
            </span>
          </div>
          <p className="text-xs text-blue-200">
            Kelola member pelanggan setia, atur katalog hadiah/kupon diskon, dan klaim penukaran poin otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tombol Atur Aturan Poin */}
          {onOpenPointSettings && (
            <button
              onClick={onOpenPointSettings}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Atur Minimal Poin & Nilai Diskon Rupiah"
            >
              <Settings className="w-3.5 h-3.5 text-amber-300" />
              <span>Atur Poin & Diskon</span>
            </button>
          )}

          {/* Tombol Tukar Hadiah Modal */}
          {onOpenClaimModal && (
            <button
              onClick={() => onOpenClaimModal()}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              <span>Tukar Poin Member</span>
            </button>
          )}

          {/* Tombol Tambah Member */}
          <button
            onClick={handleOpenAdd}
            id="btnRegisterMember"
            className="px-3.5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Member Baru</span>
          </button>
        </div>
      </div>

      {/* Point Reward Explanation Alert Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-blue-50/50 border border-amber-300/80 p-3.5 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-950 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-amber-200 text-amber-900 rounded-lg shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-amber-700" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
              <span>Sistem Penukaran Poin Otomatis Berkurang</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                Otomatis
              </span>
            </h4>
            <p className="text-[11px] text-amber-900/90 leading-relaxed">
              Poin member bertambah <strong>+1 Poin</strong> setiap transaksi Mini ATM / Kasir POS. Poin dapat ditukarkan potongan biaya/belanja (minimal <strong>{minPoints} Poin = {formatRp((minPoints / pointsPerStep) * rupiahPerStep)}</strong>) atau diklaim menjadi kupon voucher reward. Saat ditukarkan, saldo poin member akan <strong>otomatis berkurang</strong>.
            </p>
          </div>
        </div>

        {onOpenPointSettings && (
          <button
            onClick={onOpenPointSettings}
            className="text-[11px] text-amber-900 hover:text-amber-950 font-bold underline shrink-0 cursor-pointer hidden sm:block"
          >
            Ubah Pengaturan
          </button>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Member</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {stats.totalMembers}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium block">
            {stats.activeMembers} Member Aktif
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Poin Beredar</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {stats.totalPoints} <span className="text-xs font-normal text-slate-500">Poin</span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            Min. tukar {minPoints} poin
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Katalog Hadiah / Kupon</span>
            <Gift className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700">
            {stats.totalRewardsCount}
          </div>
          <span className="text-[10px] text-purple-600 font-medium block">
            Tersedia untuk diklaim
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Voucher Aktif Belum Dipakai</span>
            <Ticket className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {stats.activeVouchersCount}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">
            Siap digunakan di transaksi
          </span>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('members')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'members'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Member & Kartu Pelanggan ({members.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rewards')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'rewards'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Atur Hadiah & Kupon ({rewards.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('vouchers')}
          className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'vouchers'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Riwayat Klaim & Voucher Aktif ({voucherClaims.length})</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR MEMBER */}
      {activeSubTab === 'members' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari member berdasarkan Nama, No. HP, No. Kartu, atau Barcode..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer pr-2"
                >
                  <option value="ALL">Semua Tier</option>
                  <option value="VIP">Tier VIP</option>
                  <option value="PLATINUM">Tier Platinum</option>
                  <option value="GOLD">Tier Gold</option>
                  <option value="SILVER">Tier Silver</option>
                  <option value="BRONZE">Tier Bronze</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer pr-2"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="ACTIVE">Status Aktif</option>
                  <option value="INACTIVE">Non-Aktif</option>
                </select>
              </div>

              {/* Layout Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setViewLayout('table')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                    viewLayout === 'table' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tabel
                </button>
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                    viewLayout === 'grid' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Grid
                </button>
              </div>
            </div>
          </div>

          {/* Members Content */}
          {filteredMembers.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <Users className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-800 text-sm">Tidak ada member ditemukan</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm || tierFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Coba ganti kata kunci pencarian atau reset filter di atas.'
                  : 'Belum ada data member terdaftar. Daftarkan pelanggan untuk mengumpulkan poin reward.'}
              </p>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Member Baru</span>
              </button>
            </div>
          ) : viewLayout === 'table' ? (
            /* TABLE VIEW */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="p-3.5">Pelanggan Member</th>
                      <th className="p-3.5">Nomor Kartu</th>
                      <th className="p-3.5 text-center">Tier</th>
                      <th className="p-3.5 text-center">Saldo Poin</th>
                      <th className="p-3.5 text-right">Total Trx</th>
                      <th className="p-3.5 text-right">Total Belanja</th>
                      <th className="p-3.5 text-center">Tukar Poin & Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.map((member) => {
                      const isCopied = copiedId === member.id;
                      const hasSufficientPoints = (member.points || 0) >= minPoints;

                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                          {/* Name & Contact */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-900 to-blue-900 text-amber-300 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs border border-amber-400/40">
                                {member.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block text-xs group-hover:text-blue-900">
                                  {member.name}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                  <span className="flex items-center gap-1 font-mono">
                                    <Phone className="w-2.5 h-2.5 text-slate-400" />
                                    {member.phone}
                                  </span>
                                  <span>&bull;</span>
                                  <span>Join: {member.joinDate}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Card Number */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-800">
                              <span>{member.memberNumber}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(member.memberNumber, member.id)}
                                className="text-slate-400 hover:text-blue-600 p-0.5 rounded cursor-pointer"
                                title="Salin nomor kartu"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>

                          {/* Tier Badge */}
                          <td className="p-3.5 text-center">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider inline-block ${getTierBadgeStyle(
                                member.tier
                              )}`}
                            >
                              {member.tier}
                            </span>
                          </td>

                          {/* Points */}
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 font-bold font-mono text-xs shadow-2xs">
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              <span>{member.points || 0} Poin</span>
                            </div>
                          </td>

                          {/* Total Transactions */}
                          <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                            {member.totalTransactions || 0} &times;
                          </td>

                          {/* Total Spent */}
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                            {formatRp(member.totalSpent || 0)}
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Quick Redeem Point Button */}
                              {onOpenClaimModal && (
                                <button
                                  type="button"
                                  onClick={() => onOpenClaimModal(member)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer ${
                                    hasSufficientPoints
                                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                                  }`}
                                  title={hasSufficientPoints ? 'Tukar poin member ini dengan hadiah/diskon' : `Poin kurang dari minimal ${minPoints}`}
                                >
                                  <Gift className="w-3 h-3 text-slate-950" />
                                  <span>Tukar Poin</span>
                                </button>
                              )}

                              {/* Print VIP Card */}
                              <button
                                onClick={() => handleOpenCard(member)}
                                className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Lihat & Cetak Kartu Member VIP"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Detail & History */}
                              <button
                                onClick={() => handleOpenDetail(member)}
                                className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                title="Lihat Detail & Log Poin"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => onEditMember(member)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Member"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Apakah Anda yakin ingin menghapus member "${member.name}"?`)) {
                                      onDeleteMember(member.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => {
                const hasSufficientPoints = (member.points || 0) >= minPoints;

                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full border uppercase ${getTierBadgeStyle(
                            member.tier
                          )}`}
                        >
                          {member.tier} MEMBER
                        </span>
                        <div className="flex items-center gap-1 font-mono text-amber-300 font-bold text-xs bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>{member.points || 0} Poin</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-white truncate">{member.name}</h4>
                        <p className="text-[11px] font-mono text-amber-200/90 tracking-wider">
                          {member.memberNumber}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 space-y-2 text-xs text-slate-600 flex-1">
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-400">No. HP/WA:</span>
                        <span className="font-semibold text-slate-800 font-mono">{member.phone}</span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-400">Total Transaksi:</span>
                        <span className="font-bold text-slate-800">{member.totalTransactions || 0} kali</span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-400">Total Belanja:</span>
                        <span className="font-bold text-emerald-700 font-mono">
                          {formatRp(member.totalSpent || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                      {onOpenClaimModal && (
                        <button
                          onClick={() => onOpenClaimModal(member)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                            hasSufficientPoints
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Tukar Poin</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenCard(member)}
                        className="p-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Cetak Kartu VIP"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenDetail(member)}
                        className="p-2 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        title="Detail Member"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEditMember(member)}
                        className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Edit Data"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ATUR HADIAH & KUPON / VOUCHER */}
      {activeSubTab === 'rewards' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
                <select
                  value={rewardCategoryFilter}
                  onChange={(e) => setRewardCategoryFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer pr-2"
                >
                  <option value="ALL">Semua Kategori Hadiah</option>
                  <option value="DISCOUNT_TRX">Diskon Transaksi ATM</option>
                  <option value="FREE_ADMIN">Gratis Biaya Admin</option>
                  <option value="DISCOUNT_POS">Diskon Kasir POS</option>
                  <option value="PHYSICAL_GIFT">Barang / Hadiah Fisik</option>
                  <option value="CASHBACK">Cashback Tunai</option>
                </select>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                Total: <strong>{filteredRewards.length}</strong> jenis reward
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onOpenAddReward && (
                <button
                  onClick={onOpenAddReward}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Tambah Hadiah / Kupon</span>
                </button>
              )}
            </div>
          </div>

          {/* Rewards Grid */}
          {filteredRewards.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <Gift className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Hadiah / Kupon Terdaftar</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Buat pilihan kupon diskon (misal: 50 Poin = Diskon Rp 5.000) atau souvenir fisik yang bisa ditukarkan member saat bertransaksi.
              </p>
              {onOpenAddReward && (
                <button
                  onClick={onOpenAddReward}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Hadiah Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRewards.map((reward) => {
                const catMeta = getRewardCategoryLabel(reward.category);

                return (
                  <div
                    key={reward.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full border border-white/20 uppercase">
                          {catMeta.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          reward.status === 'ACTIVE'
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-slate-300 text-slate-800'
                        }`}>
                          {reward.status === 'ACTIVE' ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-white">{reward.name}</h4>
                        {reward.discountValue ? (
                          <p className="text-xs font-mono font-bold text-amber-200">
                            Potongan {formatRp(reward.discountValue)}
                          </p>
                        ) : (
                          <p className="text-xs text-amber-100">Hadiah Fisik / Souvenir</p>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-2.5 text-xs flex-1">
                      <div className="flex justify-between items-center py-1.5 px-2 bg-amber-50 rounded-lg border border-amber-200">
                        <span className="text-amber-900 font-semibold flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5 text-amber-600" />
                          <span>Poin Dibutuhkan:</span>
                        </span>
                        <span className="font-mono font-extrabold text-amber-900 text-sm">
                          {reward.pointsRequired} Poin
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100 text-[11px]">
                        <span className="text-slate-500">Stok Tersedia:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {reward.stock !== undefined ? `${reward.stock} pcs` : 'Tak Terbatas'}
                        </span>
                      </div>

                      {reward.description && (
                        <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          &ldquo;{reward.description}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                      {/* Claim Button */}
                      {onOpenClaimModal && (
                        <button
                          type="button"
                          onClick={() => onOpenClaimModal(undefined, reward)}
                          disabled={reward.status !== 'ACTIVE' || (reward.stock !== undefined && reward.stock <= 0)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
                            reward.status === 'ACTIVE' && (reward.stock === undefined || reward.stock > 0)
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Klaim untuk Member</span>
                        </button>
                      )}

                      {/* Edit */}
                      {onEditReward && (
                        <button
                          type="button"
                          onClick={() => onEditReward(reward)}
                          className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Edit Hadiah"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete */}
                      {isAdmin && onDeleteReward && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus hadiah "${reward.name}"?`)) {
                              onDeleteReward(reward.id);
                            }
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Hadiah"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RIWAYAT KLAIM & VOUCHER AKTIF */}
      {activeSubTab === 'vouchers' && (
        <div className="space-y-4">
          {/* Header Filter */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
                <select
                  value={voucherStatusFilter}
                  onChange={(e) => setVoucherStatusFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer pr-2"
                >
                  <option value="ALL">Semua Status Voucher</option>
                  <option value="ACTIVE">Voucher Aktif (Belum Dipakai)</option>
                  <option value="USED">Sudah Digunakan</option>
                  <option value="EXPIRED">Kadaluarsa</option>
                </select>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                Total: <strong>{filteredVouchers.length}</strong> riwayat klaim kupon
              </span>
            </div>

            {onOpenClaimModal && (
              <button
                onClick={() => onOpenClaimModal()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>+ Klaim Kupon Baru</span>
              </button>
            )}
          </div>

          {/* Vouchers Table */}
          {filteredVouchers.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <Ticket className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Riwayat Klaim Voucher</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Kupon yang diklaim member dari penukaran poin (minimal 50 poin) akan tercatat di sini lengkap dengan kode dan status penggunaan.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="p-3.5">Kode Kupon / Voucher</th>
                      <th className="p-3.5">Member Pelanggan</th>
                      <th className="p-3.5">Nama Hadiah / Diskon</th>
                      <th className="p-3.5 text-center">Poin Dipotong</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5">Waktu Klaim</th>
                      <th className="p-3.5 text-center">Aksi & Struk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVouchers.map((vch) => {
                      const isCopied = copiedId === vch.id;

                      return (
                        <tr
                          key={vch.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          {/* Voucher Code */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 font-mono font-extrabold text-slate-900 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg w-fit">
                              <span>{vch.voucherCode}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(vch.voucherCode, vch.id)}
                                className="text-slate-400 hover:text-amber-700 p-0.5 rounded cursor-pointer"
                                title="Salin Kode Voucher"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>

                          {/* Member */}
                          <td className="p-3.5">
                            <div>
                              <span className="font-bold text-slate-900 block">{vch.memberName}</span>
                              <span className="text-[10px] font-mono text-slate-400">{vch.memberNumber}</span>
                            </div>
                          </td>

                          {/* Reward */}
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-800 block">{vch.rewardName}</span>
                              {vch.discountValue > 0 && (
                                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded inline-block">
                                  Diskon: {formatRp(vch.discountValue)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Points Used */}
                          <td className="p-3.5 text-center">
                            <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-xs">
                              -{vch.pointsUsed} Poin
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-3.5 text-center">
                            {vch.status === 'ACTIVE' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle className="w-3 h-3" />
                                <span>AKTIF</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                                <span>DIGUNAKAN</span>
                              </span>
                            )}
                          </td>

                          {/* Claim Time */}
                          <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                            {vch.claimDate}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Print Receipt */}
                              {onViewVoucherReceipt && (
                                <button
                                  type="button"
                                  onClick={() => onViewVoucherReceipt(vch)}
                                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                  title="Lihat & Cetak Struk Bukti Klaim"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Struk</span>
                                </button>
                              )}

                              {/* Toggle Used Status */}
                              {onToggleVoucherUsed && vch.status === 'ACTIVE' && (
                                <button
                                  type="button"
                                  onClick={() => onToggleVoucherUsed(vch.id)}
                                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  title="Tandai Sudah Dipakai"
                                >
                                  Pakai Kupon
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
