import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  Building2,
  Receipt,
  KeyRound,
  Fingerprint,
  Store,
  CheckCircle2,
  Phone,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Database,
} from 'lucide-react';
import { AgentProfile, AppUser, UserRole } from '../../types';
import { useAppVersion } from '../../utils/versionManager';
import { ModalVersionInfo } from '../modals/ModalVersionInfo';

export interface AuthUser {
  id?: string;
  username: string;
  name: string;
  role: UserRole;
  avatarInitials: string;
}

export interface RegisterResult {
  success: boolean;
  message: string;
  user?: AppUser;
}

interface LoginViewProps {
  profile: AgentProfile;
  users?: AppUser[];
  onLoginSuccess: (user: AuthUser) => void;
  onRegisterUser?: (userData: Partial<AppUser>) => RegisterResult;
}

export const LoginView: React.FC<LoginViewProps> = ({
  profile,
  users = [],
  onLoginSuccess,
  onRegisterUser,
}) => {
  const { enterpriseVersion, version } = useAppVersion();
  const [activeMode, setActiveMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);

  // Login Form States
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Registration Form States
  const [regName, setRegName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regRole, setRegRole] = useState<UserRole>('Kasir');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regNotes, setRegNotes] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);
  const [autoLoginAfterRegister, setAutoLoginAfterRegister] = useState<boolean>(true);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const safeUsers = Array.isArray(users) ? users : [];

  const executeLogin = (user: AuthUser) => {
    onLoginSuccess(user);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

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
      }, 350);
    } else {
      setErrorMessage('Username atau kata sandi salah. Silakan periksa kembali.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = regName.trim();
    const cleanUser = regUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    const cleanPass = regPassword.trim();
    const cleanConfirm = regConfirmPassword.trim();

    if (!cleanName) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }

    if (!cleanUser || cleanUser.length < 3) {
      setErrorMessage('Username wajib diisi minimal 3 karakter (huruf, angka, titik, atau garis bawah).');
      return;
    }

    if (safeUsers.some((u) => u.username.toLowerCase() === cleanUser)) {
      setErrorMessage(`Username "${cleanUser}" sudah terdaftar. Silakan pilih username lain.`);
      return;
    }

    if (!cleanPass || cleanPass.length < 4) {
      setErrorMessage('Kata sandi minimal 4 karakter.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi yang dimasukkan.');
      return;
    }

    setIsRegistering(true);

    setTimeout(() => {
      if (onRegisterUser) {
        const result = onRegisterUser({
          name: cleanName,
          username: cleanUser,
          password: cleanPass,
          role: regRole,
          phone: regPhone.trim(),
          notes: regNotes.trim() || `Pendaftaran akun ${regRole} baru`,
          status: 'ACTIVE',
        });

        setIsRegistering(false);

        if (!result.success) {
          setErrorMessage(result.message);
          return;
        }

        const registeredUser = result.user;

        if (autoLoginAfterRegister && registeredUser) {
          setSuccessMessage('Pendaftaran berhasil! Mengalihkan ke sistem...');
          const initials = cleanName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

          setTimeout(() => {
            executeLogin({
              id: registeredUser.id,
              username: registeredUser.username,
              name: registeredUser.name,
              role: registeredUser.role,
              avatarInitials: initials || (registeredUser.role === 'Admin' ? 'AD' : 'KS'),
            });
          }, 600);
        } else {
          setSuccessMessage(`Akun "${cleanName}" (@${cleanUser}) berhasil didaftarkan! Silakan masuk dengan akun baru Anda.`);
          setUsername(cleanUser);
          setPassword(cleanPass);
          setActiveMode('LOGIN');
          // Reset reg fields
          setRegName('');
          setRegUsername('');
          setRegPassword('');
          setRegConfirmPassword('');
          setRegPhone('');
          setRegNotes('');
        }
      } else {
        setIsRegistering(false);
        setErrorMessage('Fitur registrasi belum terhubung.');
      }
    }, 400);
  };

  const isDuplicateUsername =
    regUsername.trim().length >= 3 &&
    safeUsers.some((u) => u.username.toLowerCase() === regUsername.trim().toLowerCase());

  return (
    <div className="min-h-screen bg-[#070e1b] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
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

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
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
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Database Mandiri per Pengguna</h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                    Data transaksi, saldo kas, stok POS & pelanggan terisolasi mandiri untuk tiap akun.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-3 rounded-2xl border border-white/[0.08]">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Struk Thermal & POS</h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                    Format cetak Bluetooth 58/80mm instan dan transaksi ritel fisik.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-3 rounded-2xl border border-white/[0.08]">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">Otomasi Saldo & Poin Member</h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                    Pencatatan mutasi kasir otomatis serta loyalty rewards pelanggan.
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
            <button
              type="button"
              onClick={() => setIsVersionModalOpen(true)}
              title={`${enterpriseVersion} (${version}) - Klik untuk info versi`}
              className="font-mono text-blue-300 hover:text-white bg-slate-900/80 hover:bg-slate-800/90 px-2.5 py-0.5 rounded border border-blue-800/50 transition-colors text-[11px] cursor-pointer"
            >
              {enterpriseVersion}
            </button>
          </div>
        </div>

        {/* Right Column: High Polish Secure Login & Register Form */}
        <div className="lg:col-span-7 bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col justify-between">
          <div>
            {/* Top Navigation Tabs: Masuk vs Daftar Akun Baru */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('LOGIN');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeMode === 'LOGIN'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Akun</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMode('REGISTER');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeMode === 'REGISTER'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Daftar Akun Baru</span>
                <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                  Baru
                </span>
              </button>
            </div>

            {/* Header Description */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {activeMode === 'LOGIN' ? 'Masuk ke Portal' : 'Pendaftaran Akun Baru'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {activeMode === 'LOGIN'
                    ? 'Masukkan username & kata sandi akun Anda untuk mengakses sistem'
                    : 'Buat akun untuk kasir atau pengelola baru agar dapat mengakses terminal kasir'}
                </p>
              </div>
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 hidden sm:flex shrink-0">
                {activeMode === 'LOGIN' ? <KeyRound className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Success Message Box */}
            {successMessage && (
              <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{successMessage}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 1. FORM LOGIN */}
            {/* ========================================================================= */}
            {activeMode === 'LOGIN' && (
              <form onSubmit={handleManualLogin} className="space-y-4 mt-6">
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
                      placeholder="Masukkan username akun"
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

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4"
                    />
                    <span>Simpan sesi masuk</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Autentikasi Aman 100%
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-3"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengautentikasi...</span>
                    </span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Masuk ke Sistem</span>
                    </>
                  )}
                </button>

                {/* Quick Register Action Banner */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-600">
                    Pengguna baru atau belum memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMode('REGISTER');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      Daftar Akun Baru
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ========================================================================= */}
            {/* 2. FORM DAFTAR PENGGUNA BARU (REGISTRATION) */}
            {/* ========================================================================= */}
            {activeMode === 'REGISTER' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 mt-5">
                {/* Multi-Tenant Database Isolation Info Notice */}
                <div className="p-3 bg-blue-50/90 border border-blue-200/80 rounded-2xl text-[11px] text-blue-950 flex items-start gap-2.5 shadow-2xs">
                  <Database className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-blue-900">Database Mandiri & Terisolasi:</span> Setiap akun baru yang Anda buat otomatis memiliki database tersendiri (transaksi, rekening kas, katalog POS, dan data member masing-masing) secara terpisah tanpa bercampur dengan akun lain.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap Pengguna <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Contoh: Siti Rahmawati"
                        className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Username Login <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Fingerprint className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) =>
                          setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))
                        }
                        placeholder="Contoh: siti_kasir"
                        className={`w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:bg-white focus:outline-hidden text-slate-900 font-medium ${
                          isDuplicateUsername
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-blue-600'
                        }`}
                      />
                    </div>
                    {isDuplicateUsername && (
                      <p className="text-[10px] text-rose-600 font-medium mt-1">
                        Username ini sudah digunakan akun lain.
                      </p>
                    )}
                  </div>
                </div>

                {/* Peran / Hak Akses (Role Selection Cards) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih Peran Akun (Hak Akses)
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRegRole('Kasir')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        regRole === 'Kasir'
                          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/40'
                          : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-600" />
                          Kasir / Operator
                        </span>
                        {regRole === 'Kasir' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        Akses transaksi kasir, POS ritel, cetak struk & member.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('Admin')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        regRole === 'Admin'
                          ? 'border-blue-700 bg-blue-50/70 ring-2 ring-blue-600/30'
                          : 'border-slate-200 bg-slate-50/80 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                          Admin / Owner
                        </span>
                        {regRole === 'Admin' && <CheckCircle2 className="w-4 h-4 text-blue-700" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                        Akses penuh ke semua modul, laporan laba, & rekening kas.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Nomor Telepon / WA & Catatan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. WhatsApp / HP <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Keterangan / Shift <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={regNotes}
                      onChange={(e) => setRegNotes(e.target.value)}
                      placeholder="Contoh: Kasir Shift Pagi"
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                    />
                  </div>
                </div>

                {/* Password & Konfirmasi Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kata Sandi (Password) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimal 4 karakter"
                        className="w-full text-xs pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        aria-label="Toggle password"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi"
                        className="w-full text-xs pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        aria-label="Toggle confirm password"
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Checkbox auto login */}
                <div className="pt-1 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                    <input
                      type="checkbox"
                      checked={autoLoginAfterRegister}
                      onChange={(e) => setAutoLoginAfterRegister(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 w-4 h-4"
                    />
                    <span>Langsung masuk setelah pendaftaran berhasil</span>
                  </label>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={isRegistering || isDuplicateUsername}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
                >
                  {isRegistering ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mendaftarkan Akun Baru...</span>
                    </span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Daftarkan Akun Pengguna</span>
                    </>
                  )}
                </button>

                {/* Switch back to Login */}
                <div className="pt-2 text-center">
                  <p className="text-xs text-slate-600">
                    Sudah memiliki akun terdaftar?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMode('LOGIN');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Masuk ke Sistem
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sistem Kasir & Terminal MINI ATM Multi-User</span>
            <span className="flex items-center gap-1 text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data Tersimpan Lokal & Cloud</span>
            </span>
          </div>
        </div>
      </div>

      {/* Modal Version Info */}
      <ModalVersionInfo
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />
    </div>
  );
};

