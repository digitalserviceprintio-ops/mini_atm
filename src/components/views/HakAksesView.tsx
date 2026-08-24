import React from 'react';
import { ShieldCheck, UserCheck, Check, X, Lock, ShieldAlert } from 'lucide-react';
import { UserRole } from '../../types';

interface HakAksesViewProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
}

export const HakAksesView: React.FC<HakAksesViewProps> = ({ currentRole, setRole }) => {
  return (
    <section id="view-hak-akses" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
            <span>Pengaturan Hak Akses & Role User</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kewenangan operasional antara Owner/Admin dan Operator/Kasir
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <span className="text-xs font-semibold px-2 text-slate-600">Pilih Role Aktif:</span>
          <button
            onClick={() => setRole('Admin')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              currentRole === 'Admin'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => setRole('Kasir')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              currentRole === 'Kasir'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Kasir</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Admin */}
        <div
          className={`bg-white border rounded-xl p-5 shadow-xs space-y-4 transition-all ${
            currentRole === 'Admin'
              ? 'border-blue-600 ring-2 ring-blue-600/20'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Role: ADMIN (Owner Toko)</h3>
                <p className="text-[11px] text-slate-500">Akses Penuh Seluruh Sistem & Keuangan</p>
              </div>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold border border-blue-200">
              Full Access
            </span>
          </div>

          <ul className="text-xs space-y-2.5 text-slate-700">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Catat, Ubah & Kelola Seluruh Transaksi Agen</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Otorisasi Void / Pembatalan Transaksi dengan Audit Trail</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Kelola Akun Kas, Rekening Bank, & Penyesuaian Saldo Awal</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Laporan Arus Kas, Visual Analytics & Export Data Spreadsheet Excel</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Kelola Katalog Barang POS Fisik & Pengaturan Profil Toko</span>
            </li>
          </ul>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Status Otorisasi:</span>
            <span className="text-xs font-bold text-blue-700">Tidak Terbatas</span>
          </div>
        </div>

        {/* Card Kasir */}
        <div
          className={`bg-white border rounded-xl p-5 shadow-xs space-y-4 transition-all ${
            currentRole === 'Kasir'
              ? 'border-amber-600 ring-2 ring-amber-600/20'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Role: KASIR (Operator)</h3>
                <p className="text-[11px] text-slate-500">Akses Operasional Pelayanan Harian</p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-bold border border-amber-200">
              Restricted
            </span>
          </div>

          <ul className="text-xs space-y-2.5 text-slate-700">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Catat Transaksi Agen Baru & Cetak Struk Bukti</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Transaksi Kasir POS Penjualan Fisik & Cetak Struk Kasir</span>
            </li>
            <li className="flex items-center gap-2 text-slate-400">
              <X className="w-4 h-4 text-red-500 shrink-0" />
              <span>Dilarang Membatalkan / Void Transaksi Tanpa Izin Admin</span>
            </li>
            <li className="flex items-center gap-2 text-slate-400">
              <X className="w-4 h-4 text-red-500 shrink-0" />
              <span>Dilarang Menyesuaikan / Mengubah Saldo Pokok Rekening</span>
            </li>
            <li className="flex items-center gap-2 text-slate-400">
              <X className="w-4 h-4 text-red-500 shrink-0" />
              <span>Dilarang Melakukan Export Data Spreadsheet Laporan Keuangan</span>
            </li>
          </ul>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Status Otorisasi:</span>
            <span className="text-xs font-bold text-amber-700">Terbatas (Operasional)</span>
          </div>
        </div>
      </div>

      {/* Security Info Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Keamanan Audit Trail & Proteksi Kasir</p>
          <p>
            Semua perubahan transaksi otomatis tercatat dengan timestamp. Kasir dapat melayani transaksi pelanggan secara lancar tanpa risiko terhapusnya data keuangan krusial atau rekayasa saldo.
          </p>
        </div>
      </div>
    </section>
  );
};
