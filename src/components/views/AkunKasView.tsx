import React from 'react';
import { Wallet, Plus, Edit2, ShieldAlert, CreditCard, Trash2 } from 'lucide-react';
import { Account, UserRole } from '../../types';
import { formatRp } from '../../utils/formatters';

interface AkunKasViewProps {
  accounts: Account[];
  currentRole: UserRole;
  onOpenNewAccount: () => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
}

export const AkunKasView: React.FC<AkunKasViewProps> = ({
  accounts,
  currentRole,
  onOpenNewAccount,
  onEditAccount,
  onDeleteAccount,
}) => {
  const isAdmin = currentRole === 'Admin';

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  return (
    <section id="view-akun-kas" className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-700" />
            <span>Manajemen Akun Kas & Rekening Bank</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kelola daftar saldo kas fisik laci dan rekening bank operasional Mini ATM
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenNewAccount}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rekening</span>
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Mode Kasir aktif: Anda dapat melihat saldo rekening operasional, namun penambahan dan penyesuaian saldo hanya dapat dilakukan oleh <strong>Admin</strong>.
          </span>
        </div>
      )}

      {/* Summary Total Card */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-white p-5 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs text-blue-200 uppercase font-semibold tracking-wider">
            Total Seluruh Likuiditas Operasional
          </span>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">{formatRp(totalBalance)}</p>
          <p className="text-xs text-blue-300">Tersebar di {accounts.length} akun kas & rekening</p>
        </div>
      </div>

      {/* Accounts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="accountsListContainer">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 hover:border-blue-300 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 truncate">{acc.name}</h4>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-100">
                  {acc.type}
                </span>
              </div>

              <div className="space-y-1 pt-3">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Saldo Operasional Aktif
                </span>
                <p className="text-xl font-bold text-blue-900 leading-tight">
                  {formatRp(acc.balance)}
                </p>
                {acc.accountNumber && (
                  <span className="text-[11px] text-slate-500 font-mono block pt-1">
                    No. Rek: {acc.accountNumber}
                  </span>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onDeleteAccount(acc.id)}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                  title="Hapus Akun / Rekening"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEditAccount(acc)}
                  className="text-xs text-blue-700 hover:text-white hover:bg-blue-700 font-semibold flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg border border-blue-200 transition-all cursor-pointer"
                  title="Ubah Rincian & Saldo Akun"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Akun</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
