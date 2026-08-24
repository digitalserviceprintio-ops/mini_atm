import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Sparkles,
  Store,
  Building2,
  Receipt,
  ArrowRight,
  KeyRound,
  Fingerprint,
  Users,
} from 'lucide-react';
import { AgentProfile, AppUser, UserRole } from '../../types';

export interface AuthUser {
  id?: string;
  username: string;
  name: string;
  role: UserRole;
  avatarInitials: string;
}

interface LoginViewProps {
  profile: AgentProfile;
  users?: AppUser[];
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ profile, users = [], onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'Admin' | 'Kasir'>('ALL');

  const safeUsers = Array.isArray(users) ? users : [];

  const executeLogin = (user: AuthUser) => {
    onLoginSuccess(user);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = username.trim().toLowerCase();
    const matchedAccount = safeUsers.find(
      (acc) => acc.username.toLowerCase() === trimmedUser && acc.password === password
    );

    if (matchedAccount) {
      if (matchedAccount.status === 'INACTIVE') {
        setErrorMessage('Akun ini berstatus Non-Aktif. Hubungi Admin untuk mengaktifkannya kembali.');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const initials = matchedAccount.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();

        executeLogin({
          id: matchedAccount.id,
          username: matchedAccount.username,
          name: matchedAccount.name,
          role: matchedAccount.role,
          avatarInitials: initials || (matchedAccount.role === 'Admin' ? 'AD' : 'KS'),
        });
      }, 300);
    } else {
      setErrorMessage('Username atau kata sandi tidak cocok. Silakan periksa kembali atau pilih akun dari daftar di bawah.');
    }
  };

  const handleQuickLogin = (account: AppUser) => {
    if (account.status === 'INACTIVE') {
      setErrorMessage(`Akun "${account.name}" sedang non-aktif.`);
      return;
    }

    setUsername(account.username);
    setPassword(account.password);
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const initials = account.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      executeLogin({
        id: account.id,
        username: account.username,
        name: account.name,
        role: account.role,
        avatarInitials: initials || (account.role === 'Admin' ? 'AD' : 'KS'),
      });
    }, 250);
  };

  const visibleQuickUsers = safeUsers.filter((u) => {
    if (selectedRoleFilter === 'Admin') return u.role === 'Admin';
    if (selectedRoleFilter === 'Kasir') return u.role === 'Kasir';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070e1b] text-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Dynamic Background Lighting Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-gradient-to-br from-blue-600/20 to-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-gradient-to-tr from-amber-500/10 to-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }}
      />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        {/* Left Column: Premium Brand & System Highlights */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0b1b36] via-[#09162e] to-[#061022] border border-blue-800/40 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          {/* Subtle glow border line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

          <div className="space-y-6">
            {/* Header / Brand Identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 p-0.5 shadow-lg shadow-blue-500/20 shrink-0">
                <div className="w-full h-full bg-[#09162e] rounded-[14px] flex items-center justify-center overflow-hidden">
                  {profile.logoUrl ? (
                    <img
                      src={profile.logoUrl}
                      alt="Logo Outlet"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-blue-400" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 bg-blue-950/90 border border-blue-800/60 px-2 py-0.5 rounded-full">
                    Sistem Kasir Agen
                  </span>
                </div>
                <h1 className="font-extrabold text-lg sm:text-xl text-white tracking-tight leading-snug mt-0.5">
                  {profile.storeName || 'MINI ATM & BRILINK'}
                </h1>
              </div>
            </div>

            {/* Outlet Information Card */}
            <div className="bg-slate-900/60 border border-blue-900/50 rounded-2xl p-4 space-y-2 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-blue-400" />
                  <span>ID Terminal Agen</span>
                </span>
                <span className="font-mono font-bold text-white bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/50">
                  {profile.idAgent || 'AG-88921'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Pemilik Outlet:</span>
                <span className="font-semibold text-slate-200">{profile.ownerName || 'Bpk. Rahmat Santoso'}</span>
              </div>
            </div>

            {/* Core Capability Badges */}
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-3 rounded-2xl border border-white/[0.08]">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Akun Admin & Kasir Resmi</h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                    Admin dapat membuatkan kredensial akun kasir baru untuk operator shift harian.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-3 rounded-2xl border border-white/[0.08]">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Struk Thermal Bluetooth & POS</h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                    Format cetak thermal 58mm / 80mm instan, invoice via WhatsApp, dan penjualan barang fisik.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-3 rounded-2xl border border-white/[0.08]">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Otomasi Saldo & Google Sheets</h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                    Sinkronisasi real-time seluruh transaksi, kas tunai, dan rekening bank ke spreadsheet.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistem Siap Digunakan</span>
            </span>
            <span className="font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
              Enterprise v2.5
            </span>
          </div>
        </div>

        {/* Right Column: High Polish Login Form & Quick Demo Cards */}
        <div className="lg:col-span-7 bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col justify-between space-y-6">
          <div>
            {/* Header Form */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Masuk ke Portal
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Masukkan username & password Anda atau pilih akun dari daftar di bawah
                </p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 hidden sm:flex">
                <KeyRound className="w-5 h-5" />
              </div>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Form Manual Login */}
            <form onSubmit={handleManualLogin} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username (contoh: admin / kasir)"
                    className="w-full text-xs pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Kata Sandi (Password)
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun"
                    className="w-full text-xs pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4"
                  />
                  <span>Simpan sesi masuk</span>
                </label>
                <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {users.length} Akun Tersedia
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mengautentikasi...</span>
                  </span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick 1-Click Login List from Real Users State */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pilih Akun Terdaftar (1-Klik Masuk)</span>
              </span>

              {/* Role filter buttons */}
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('ALL')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    selectedRoleFilter === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('Admin')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    selectedRoleFilter === 'Admin'
                      ? 'bg-blue-700 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('Kasir')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    selectedRoleFilter === 'Kasir'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Kasir
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {visibleQuickUsers.map((acc) => {
                const isAdmin = acc.role === 'Admin';
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickLogin(acc)}
                    disabled={isLoading}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative group hover:-translate-y-0.5 hover:shadow-md ${
                      isAdmin
                        ? 'bg-blue-50/70 hover:bg-blue-100/80 border-blue-200/80'
                        : 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-xl text-white shadow-xs ${
                            isAdmin ? 'bg-blue-700' : 'bg-amber-600'
                          }`}
                        >
                          {isAdmin ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <span className="font-bold text-xs text-slate-900 block leading-tight truncate">
                            {acc.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              isAdmin ? 'text-blue-700' : 'text-amber-700'
                            }`}
                          >
                            Role: {acc.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono bg-white/90 p-1.5 rounded-lg border border-slate-200/80 flex items-center justify-between text-slate-700">
                      <span>User: <strong className="text-slate-900">@{acc.username}</strong></span>
                      <span>Pass: <strong className="text-slate-900">{acc.password}</strong></span>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-[10px] font-bold">
                      <span className="text-slate-500 truncate max-w-[120px]">
                        {acc.notes || (isAdmin ? 'Owner Utama' : 'Operator')}
                      </span>
                      <span className="text-slate-800 group-hover:text-blue-700 flex items-center gap-0.5 transition-colors">
                        <span>Pilih</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
