import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  ShieldCheck,
  User,
  Lock,
  Phone,
  FileText,
  Eye,
  EyeOff,
  RefreshCw,
  Share2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { AppUser, UserRole } from '../../types';

interface ModalUserAccountProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<AppUser>) => void;
  editingUser: AppUser | null;
  existingUsers: AppUser[];
}

export const ModalUserAccount: React.FC<ModalUserAccountProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser,
  existingUsers,
}) => {
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('Kasir');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedWA, setCopiedWA] = useState<boolean>(false);

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name);
      setUsername(editingUser.username);
      setPassword(editingUser.password);
      setRole(editingUser.role);
      setPhone(editingUser.phone || '');
      setNotes(editingUser.notes || '');
      setStatus(editingUser.status || 'ACTIVE');
    } else {
      setName('');
      setUsername('');
      setPassword('kasir' + Math.floor(100 + Math.random() * 900));
      setRole('Kasir');
      setPhone('');
      setNotes('Operator Kasir');
      setStatus('ACTIVE');
    }
    setErrorMessage(null);
    setCopiedWA(false);
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let res = role === 'Kasir' ? 'kasir' : 'admin';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Username minimal harus 3 karakter tanpa spasi.');
      return;
    }

    // Check duplicate username
    const isDuplicate = existingUsers.some(
      (u) =>
        u.username.toLowerCase() === cleanUsername &&
        (!editingUser || u.id !== editingUser.id)
    );

    if (isDuplicate) {
      setErrorMessage(`Username "${cleanUsername}" sudah digunakan oleh akun lain. Gunakan username berbeda.`);
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('Kata sandi minimal harus 4 karakter.');
      return;
    }

    onSave({
      id: editingUser ? editingUser.id : undefined,
      name: cleanName,
      username: cleanUsername,
      password: (password || '').trim(),
      role,
      phone: (phone || '').trim(),
      notes: (notes || '').trim(),
      status,
    });

    onClose();
  };

  const handleShareToWhatsApp = () => {
    if (!phone && !name) return;
    const msg = `Halo ${name || 'Kasir'},\nBerikut kredensial akun login sistem Mini ATM / BRILink Anda:\n\n👤 Username: ${username}\n🔑 Password: ${password}\n🎭 Role: ${role}\n\nSilakan login ke aplikasi dan jaga kerahasiaan kata sandi Anda.`;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 3000);
  };

  return (
    <div
      id="modal-user-account-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        id="modal-user-account"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-[#003366] text-white p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/80 rounded-xl">
              {role === 'Admin' ? (
                <ShieldCheck className="w-5 h-5 text-white" />
              ) : (
                <UserCheck className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {editingUser ? 'Edit Akun Pengguna' : 'Buat Akun Kasir / Admin Baru'}
              </h3>
              <p className="text-[11px] text-blue-200">
                {editingUser
                  ? `Mengubah informasi akun @${editingUser.username}`
                  : 'Admin membuatkan kredensial login resmi'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Role Akun <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('Kasir')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  role === 'Kasir'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    role === 'Kasir' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Kasir (Operator)</div>
                  <div className="text-[10px] text-slate-500">Pelayanan & POS</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('Admin')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  role === 'Admin'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-600/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    role === 'Admin' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">Admin (Owner)</div>
                  <div className="text-[10px] text-slate-500">Akses Penuh Keuangan</div>
                </div>
              </button>
            </div>
          </div>

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Petugas <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingUser && !username) {
                      // Auto suggest username based on first word
                      const auto = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '')
                        .slice(0, 12);
                      if (auto) setUsername(auto);
                    }
                  }}
                  placeholder="Contoh: Dewi Lestari"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username Login <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="Contoh: dewi_kasir"
                  className="w-full text-xs pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden font-mono"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Digunakan untuk masuk ke aplikasi.
              </span>
            </div>
          </div>

          {/* Password with generator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Kata Sandi (Password)</span> <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[11px] text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Acak Sandi</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi akun"
                className="w-full text-xs pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Sembunyikan' : 'Lihat Sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Phone & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. WhatsApp / HP
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Akun
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden font-medium"
              >
                <option value="ACTIVE">🟢 Aktif (Bisa Login)</option>
                <option value="INACTIVE">🔴 Non-Aktif (Diblokir/Cuti)</option>
              </select>
            </div>
          </div>

          {/* Notes / Shift */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Penempatan / Shift Kerja
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Shift Pagi (08:00 - 15:00) / Kasir Utama"
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* WhatsApp Share Card Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="text-[11px] text-emerald-900">
                <p className="font-bold">Kirim Kredensial via WhatsApp</p>
                <p className="text-emerald-700">Kirim username & password ke nomor kasir</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleShareToWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedWA ? 'Terkirim!' : 'Kirim WA'}</span>
            </button>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#003366] hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingUser ? 'Perbarui Akun' : 'Simpan & Aktifkan Akun'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
