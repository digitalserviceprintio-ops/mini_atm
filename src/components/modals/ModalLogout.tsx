import React from 'react';
import { LogOut, AlertCircle, X } from 'lucide-react';
import { AuthUser } from '../views/LoginView';

interface ModalLogoutProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: AuthUser | null;
}

export const ModalLogout: React.FC<ModalLogoutProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4 text-center animate-in fade-in zoom-in duration-150">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto -mt-4 shadow-inner">
          <LogOut className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="font-bold text-base text-slate-900">Konfirmasi Keluar (Logout)</h3>
          <p className="text-xs text-slate-500">
            Apakah Anda yakin ingin mengakhiri sesi kasir/admin saat ini?
          </p>
        </div>

        {user && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-left space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Akun Aktif:</span>
              <span className="font-bold text-slate-800">{user.name}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Role:</span>
              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${user.role === 'Admin' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                {user.role}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Ya, Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
