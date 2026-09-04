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
  Database,
  RefreshCw,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { AgentProfile, AppUser, UserRole } from '../../types';
import { useAppVersion } from '../../utils/versionManager';
import { ModalVersionInfo } from '../modals/ModalVersionInfo';
import { TransactionVectorIllustration } from '../illustrations/TransactionVectorIllustration';

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
  // Card Flip State: false = Front (LOGIN), true = Back (REGISTER)
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
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
          setSuccessMessage(`Akun "${cleanName}" (@${cleanUser}) berhasil didaftarkan! Kartu dibalik ke formulir login.`);
          setUsername(cleanUser);
          setPassword(cleanPass);
          // Flip back to Login card
          setIsFlipped(false);
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-center items-center p-3 sm:p-6 md:p-8 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Clean Light Subtle Ambient Lighting & Grid */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[350px] bg-gradient-to-br from-blue-100/60 via-indigo-50/40 to-transparent blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-gradient-to-tr from-emerald-100/50 via-sky-50/40 to-transparent blur-[130px] rounded-full pointer-events-none" />

      {/* Subtle Micro-Dot Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-stretch">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Clean White Enterprise Brand Showcase & Vector Illustration */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xl shadow-slate-200/50 relative overflow-hidden">
          {/* Subtle Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600" />

          <div className="space-y-5">
            {/* Header / Brand Identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 p-0.5 shadow-md shadow-blue-500/20 shrink-0">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                  {profile.logoUrl ? (
                    <img
                      src={profile.logoUrl}
                      alt="Logo Outlet"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-blue-600" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    Sistem Kasir Agen
                  </span>
                </div>
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-snug mt-0.5">
                  {profile.storeName || 'MINI ATM & BRILINK'}
                </h1>
              </div>
            </div>

            {/* Outlet Information Banner */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Store className="w-3.5 h-3.5 text-blue-600" />
                  <span>Terminal Outlet:</span>
                </span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  {profile.idAgent || 'AG-88921'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/70">
                <span className="text-slate-500 font-medium">Pemilik / Owner:</span>
                <span className="font-semibold text-slate-800">{profile.ownerName || 'Bpk. Rahmat Santoso'}</span>
              </div>
            </div>

            {/* Vector Illustration of Person Transacting */}
            <div className="bg-gradient-to-b from-blue-50/50 via-slate-50/80 to-white rounded-2xl border border-blue-100/80 p-3 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              <div className="w-full max-w-[340px] my-1">
                <TransactionVectorIllustration className="w-full h-auto drop-shadow-sm" />
              </div>
              <div className="text-center mt-1">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Transaksi Kasir & Mini ATM Terintegrasi</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Layanan perbankan cepat, kasir POS ritel, cetak struk bluetooth, dan database aman.
                </p>
              </div>
            </div>

            {/* Core Capability Pills */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700">
                <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold truncate">Data Per-Akun Mandiri</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700">
                <Receipt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold truncate">Struk Thermal 58/80</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer Status */}
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-600">Sistem Siap Operasi</span>
            </span>
            <button
              type="button"
              onClick={() => setIsVersionModalOpen(true)}
              title={`${enterpriseVersion} (${version}) - Klik untuk riwayat versi`}
              className="font-mono text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors text-[10px] font-bold cursor-pointer"
            >
              {enterpriseVersion}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: 3D Flip Card Container (Front = Login, Back = Register) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 [perspective:1400px] flex flex-col">
          {/* Card 3D Rotating Flipper */}
          <div
            className="w-full grid grid-cols-1 grid-rows-1 transition-transform duration-700 ease-in-out flex-1"
            style={{
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* ===================================================================== */}
            {/* CARD FRONT FACE: FORM LOGIN */}
            {/* ===================================================================== */}
            <div
              className={`col-start-1 row-start-1 w-full h-full bg-white text-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/90 flex flex-col justify-between ${
                isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
              aria-hidden={isFlipped}
              inert={isFlipped ? true : undefined}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(0deg) translateZ(1px)',
                WebkitTransform: 'rotateY(0deg) translateZ(1px)',
              }}
            >
              <div>
                {/* Header Switcher & Flip Action Indicator */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase mb-1">
                      <KeyRound className="w-3 h-3" />
                      <span>Autentikasi Pengguna</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      Masuk ke Sistem Kasir
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gunakan username dan kata sandi akun Anda untuk mengakses terminal.
                    </p>
                  </div>

                  {/* Interactive 3D Flip Trigger Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(true);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    id="btn-flip-to-register"
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-800 border border-blue-200 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer group"
                    title="Klik untuk membalik kartu ke formulir pendaftaran akun baru"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600 transition-transform group-hover:rotate-180 duration-500" />
                    <span className="hidden sm:inline">Daftar Akun Baru</span>
                    <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                      Flip ⟳
                    </span>
                  </button>
                </div>

                {/* Feedback Alerts */}
                {errorMessage && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="font-medium">{successMessage}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleManualLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Username Pengguna
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
                        placeholder="Contoh: admin / kasir_1"
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
                      <span>Simpan sesi login</span>
                    </label>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      <span>Aman Terisolasi</span>
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    id="btn-submit-login"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-3"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mengautentikasi Sesi...</span>
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

              {/* Bottom Card Flip Switcher */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <p className="text-xs text-slate-600 text-center sm:text-left">
                  Belum memiliki akun kasir?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-blue-700 hover:text-blue-800 text-xs inline-flex items-center gap-1.5 hover:underline cursor-pointer bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
                >
                  <span>Daftar Akun Baru</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* CARD BACK FACE: FORM REGISTER (3D FLIPPED 180 DEG) */}
            {/* ===================================================================== */}
            <div
              className={`col-start-1 row-start-1 w-full h-full bg-white text-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/60 border border-slate-200/90 flex flex-col justify-between ${
                !isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
              }`}
              aria-hidden={!isFlipped}
              inert={!isFlipped ? true : undefined}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg) translateZ(1px)',
                WebkitTransform: 'rotateY(180deg) translateZ(1px)',
              }}
            >
              <div>
                {/* Header Back & Flip Button */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase mb-1">
                      <UserPlus className="w-3 h-3 text-emerald-600" />
                      <span>Registrasi Pengguna Baru</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                      Buat Akun Terminal Baru
                    </h2>
                  </div>

                  {/* Flip Back Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    id="btn-flip-to-login"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer group"
                    title="Kembali ke formulir login (Flip balik)"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-600 transition-transform group-hover:-rotate-180 duration-500" />
                    <span>Kembali Masuk</span>
                    <span className="text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded-full font-extrabold uppercase">
                      Flip ⟳
                    </span>
                  </button>
                </div>

                {/* Multi-Tenant Database Notice */}
                <div className="p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-[11px] text-blue-950 flex items-start gap-2 mb-3.5">
                  <Database className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="font-bold text-blue-900">Database Mandiri:</span> Tiap akun memiliki database transaksi, saldo kas, katalog POS, & riwayat member tersendiri tanpa bercampur.
                  </div>
                </div>

                {/* Feedback Alerts on Register Card */}
                {errorMessage && (
                  <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Nama Lengkap */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nama Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Contoh: Siti Rahmawati"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Username Login <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) =>
                          setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))
                        }
                        placeholder="Contoh: siti_kasir"
                        className={`w-full text-xs px-3 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:bg-white focus:outline-hidden text-slate-900 font-medium ${
                          isDuplicateUsername
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-blue-600'
                        }`}
                      />
                      {isDuplicateUsername && (
                        <p className="text-[10px] text-rose-600 font-medium mt-0.5">
                          Username sudah terdaftar.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Role Selector Cards */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Pilih Peran Akun (Hak Akses)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegRole('Kasir')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          regRole === 'Kasir'
                            ? 'border-amber-500 bg-amber-50/80 ring-1 ring-amber-400'
                            : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-amber-600" />
                            Kasir / Operator
                          </span>
                          {regRole === 'Kasir' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                          Akses transaksi, POS & struk.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegRole('Admin')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          regRole === 'Admin'
                            ? 'border-blue-600 bg-blue-50/80 ring-1 ring-blue-500'
                            : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            Admin / Owner
                          </span>
                          {regRole === 'Admin' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                          Akses penuh & rekening kas.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Phone & Shift Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        No. HP / WA <span className="text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Shift / Catatan <span className="text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="text"
                        value={regNotes}
                        onChange={(e) => setRegNotes(e.target.value)}
                        placeholder="Contoh: Shift Pagi"
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Kata Sandi <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 4 karakter"
                          className="w-full text-xs pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Konfirmasi Kata Sandi <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Ulangi kata sandi"
                          className="w-full text-xs pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden text-slate-900 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Auto-login checkbox */}
                  <div className="pt-0.5 flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                      <input
                        type="checkbox"
                        checked={autoLoginAfterRegister}
                        onChange={(e) => setAutoLoginAfterRegister(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 w-4 h-4"
                      />
                      <span className="text-[11px]">Langsung masuk setelah pendaftaran berhasil</span>
                    </label>
                  </div>

                  {/* Register Submit Button */}
                  <button
                    type="submit"
                    disabled={isRegistering || isDuplicateUsername}
                    id="btn-submit-register"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
                </form>
              </div>

              {/* Bottom Back to Login */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Sudah punya akun terdaftar?</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Masuk ke Sistem (Flip ⟳)</span>
                </button>
              </div>
            </div>
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
