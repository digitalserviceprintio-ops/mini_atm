import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Check,
  X,
  Lock,
  UserPlus,
  Search,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  Trash2,
  Edit,
  Phone,
  Share2,
  LogIn,
  AlertTriangle,
  Sparkles,
  Users,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { AppUser, UserRole } from '../../types';
import { AuthUser } from './LoginView';

interface HakAksesViewProps {
  users?: AppUser[];
  onSaveUser?: (user: Partial<AppUser>) => void;
  onDeleteUser?: (userId: string) => void;
  onToggleUserStatus?: (userId: string) => void;
  onSwitchActiveUser?: (user: AppUser) => void;
  currentUser?: AuthUser | null;
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  onOpenCreateUserModal?: (defaultRole?: UserRole) => void;
  onOpenEditUserModal?: (user: AppUser) => void;
}

export const HakAksesView: React.FC<HakAksesViewProps> = ({
  users = [],
  onSaveUser = (_user: Partial<AppUser>) => {},
  onDeleteUser = (_userId: string) => {},
  onToggleUserStatus = (_userId: string) => {},
  onSwitchActiveUser = (_user: AppUser) => {},
  currentUser,
  currentRole,
  setRole,
  onOpenCreateUserModal = (_defaultRole?: UserRole) => {},
  onOpenEditUserModal = (_user: AppUser) => {},
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'Admin' | 'Kasir' | 'INACTIVE'>('ALL');
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const safeUsers = Array.isArray(users) ? users : [];

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCredentials = (user: AppUser) => {
    const text = `Username: ${user.username}\nPassword: ${user.password}\nRole: ${user.role}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShareWA = (user: AppUser) => {
    const msg = `Halo ${user.name},\nBerikut data login sistem Mini ATM / Agen BRILink Anda:\n\n👤 Username: ${user.username}\n🔑 Password: ${user.password}\n🎭 Role: ${user.role}\n\nSilakan login ke aplikasi. Terima kasih.`;
    const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handleDelete = (user: AppUser) => {
    if (user.username === 'admin' && safeUsers.filter((u) => u.role === 'Admin').length <= 1) {
      alert('Akun Admin utama tidak dapat dihapus.');
      return;
    }
    if (currentUser?.username === user.username) {
      alert('Anda tidak dapat menghapus akun yang sedang aktif digunakan login.');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus akun "${user.name}" (@${user.username})?`)) {
      onDeleteUser(user.id);
    }
  };

  // Filtered list
  const filteredUsers = safeUsers.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm)) ||
      (u.notes && u.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (filterRole === 'Admin') return u.role === 'Admin';
    if (filterRole === 'Kasir') return u.role === 'Kasir';
    if (filterRole === 'INACTIVE') return u.status === 'INACTIVE';
    return true;
  });

  const totalAdmins = safeUsers.filter((u) => u.role === 'Admin').length;
  const totalKasirs = safeUsers.filter((u) => u.role === 'Kasir').length;
  const totalActive = safeUsers.filter((u) => u.status === 'ACTIVE').length;

  return (
    <section id="view-hak-akses" className="space-y-5">
      {/* Header & Quick Action Buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
              Daftar Akun Pengguna & Hak Akses
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola daftar akun login Admin (Owner) dan buatkan akun login resmi untuk Operator Kasir.
          </p>
        </div>

        {/* Action Buttons for Admin */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onOpenCreateUserModal('Kasir')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Buat Akun Kasir</span>
          </button>

          <button
            onClick={() => onOpenCreateUserModal('Admin')}
            className="px-4 py-2.5 bg-[#003366] hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>+ Tambah Admin</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Total Pengguna</span>
            <span className="text-lg font-black text-slate-900">{users.length} Akun</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-blue-700 font-medium block">Akun Admin (Owner)</span>
            <span className="text-lg font-black text-blue-900">{totalAdmins} Akun</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-amber-700 font-medium block">Akun Kasir (Operator)</span>
            <span className="text-lg font-black text-amber-900">{totalKasirs} Akun</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-emerald-700 font-medium block">Akun Aktif</span>
            <span className="text-lg font-black text-emerald-900">{totalActive} Akun</span>
          </div>
        </div>
      </div>

      {/* Main Content Area: User Accounts Table & Role Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Tab Filter */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterRole('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterRole === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Akun ({users.length})
            </button>
            <button
              onClick={() => setFilterRole('Admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                filterRole === 'Admin'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin ({totalAdmins})</span>
            </button>
            <button
              onClick={() => setFilterRole('Kasir')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                filterRole === 'Kasir'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Kasir ({totalKasirs})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama, username, no HP..."
              className="w-full text-xs pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-slate-900 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Users List Grid / Table */}
        <div className="p-4 sm:p-5">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada akun yang sesuai filter.</p>
              <button
                onClick={() => onOpenCreateUserModal('Kasir')}
                className="px-4 py-2 bg-blue-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Buat Akun Kasir Baru</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredUsers.map((user) => {
                const isAdmin = user.role === 'Admin';
                const isCurrentUser = currentUser?.username === user.username;
                const isPasswordVisible = !!visiblePasswords[user.id];
                const initials = user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={user.id}
                    className={`border rounded-2xl p-4.5 transition-all flex flex-col justify-between space-y-4 ${
                      isCurrentUser
                        ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/10'
                        : user.status === 'INACTIVE'
                        ? 'border-slate-200 bg-slate-50/80 opacity-75'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {/* Header User Card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-xs shrink-0 ${
                            isAdmin
                              ? 'bg-gradient-to-br from-blue-700 to-blue-500'
                              : 'bg-gradient-to-br from-amber-500 to-amber-600'
                          }`}
                        >
                          {initials || (isAdmin ? 'AD' : 'KS')}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900 leading-tight">
                              {user.name}
                            </h3>
                            {isCurrentUser && (
                              <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                Akun Anda
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              @{user.username}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                isAdmin
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isAdmin ? (
                                <ShieldCheck className="w-3 h-3" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              <span>Role: {user.role}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Toggle Badge */}
                      <button
                        onClick={() => onToggleUserStatus(user.id)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Klik untuk mengubah status aktif/non-aktif"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            user.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        <span>{user.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}</span>
                      </button>
                    </div>

                    {/* Credentials & Details Box */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2 text-xs">
                      {/* Password Field */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                          <span>Kata Sandi:</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {isPasswordVisible ? user.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title={isPasswordVisible ? 'Sembunyikan' : 'Tampilkan Kata Sandi'}
                          >
                            {isPasswordVisible ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyCredentials(user)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                            title="Salin Kredensial Login"
                          >
                            {copiedId === user.id ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Phone & WA */}
                      {user.phone && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>WhatsApp / HP:</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700">{user.phone}</span>
                            <button
                              onClick={() => handleShareWA(user)}
                              className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer"
                              title="Kirim kredensial via WA"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>Kirim WA</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Notes / Shift */}
                      {user.notes && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                          <span className="text-slate-500">Catatan / Shift:</span>
                          <span className="text-slate-700 font-medium italic">{user.notes}</span>
                        </div>
                      )}

                      {/* Created At */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Dibuat: {user.createdAt}</span>
                        </span>
                        {user.lastLogin && <span>Login: {user.lastLogin}</span>}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenEditUserModal(user)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick Switch Account (Testing) */}
                      {!isCurrentUser && (
                        <button
                          onClick={() => onSwitchActiveUser(user)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-blue-900 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Beralih sesi login ke akun ini"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Login Sebagai User Ini</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-700" />
              <span>Matriks Perbandingan Hak Akses (Admin vs Kasir)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Standar otorisasi keamanan operasional agen untuk memisahkan kewenangan keuangan & kasir
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold px-2 text-slate-600">Simulasi Mode:</span>
            <button
              onClick={() => setRole('Admin')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currentRole === 'Admin'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setRole('Kasir')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currentRole === 'Kasir'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kasir
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-bold">Fitur & Modul Aplikasi</th>
                <th className="py-2.5 px-3 font-bold text-center text-blue-700 bg-blue-50/60">
                  Admin (Owner)
                </th>
                <th className="py-2.5 px-3 font-bold text-center text-amber-700 bg-amber-50/60">
                  Kasir (Operator)
                </th>
                <th className="py-2.5 px-3 font-bold">Keterangan Keamanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 px-3 font-semibold">Catat Transaksi Agen (Setor/Tarik/Transfer)</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 bg-blue-50/30">
                  <Check className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-center text-emerald-600 bg-amber-50/30">
                  <Check className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-slate-500">Pelayanan transaksi nasabah harian</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Kasir POS Penjualan Fisik & Pulsa</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 bg-blue-50/30">
                  <Check className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-center text-emerald-600 bg-amber-50/30">
                  <Check className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-slate-500">Checkout barang & potong stok otomatis</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Cetak Struk Thermal & Bagikan WA</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 bg-blue-50/30">
                  <Check className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-center text-emerald-600 bg-amber-50/30">
                  <Check className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-slate-500">Pemberian bukti sah transaksi ke pelanggan</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Otorisasi Pembatalan (VOID Transaksi)</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 bg-blue-50/30 font-bold">
                  <Check className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-center text-rose-500 bg-amber-50/30">
                  <X className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-slate-500">
                  Mencegah kasir menghapus transaksi tanpa izin owner
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Kelola Akun Bank & Penyesuaian Saldo Pokok</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 bg-blue-50/30 font-bold">
                  <Check className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-center text-rose-500 bg-amber-50/30">
                  <X className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-slate-500">
                  Hanya owner yang berhak merubah saldo modal rekening
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Buat Akun Kasir & Kelola Hak Akses</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 bg-blue-50/30 font-bold">
                  <Check className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-center text-rose-500 bg-amber-50/30">
                  <X className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-slate-500">
                  Admin dapat membuat, mengubah, dan memblokir akun kasir
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold">Export Laporan Spreadsheet & Backend GAS</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 bg-blue-50/30 font-bold">
                  <Check className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-center text-rose-500 bg-amber-50/30">
                  <X className="w-4 h-4 mx-auto" />
                </td>
                <td className="py-2.5 px-3 text-slate-500">
                  Akses database dan rekap keuntungan bersih outlet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
