import React, { useState, useEffect } from 'react';
import { X, Wallet, Check, Trash2 } from 'lucide-react';
import { Account, AccountType } from '../../types';

interface ModalAccountProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountData: Partial<Account>) => void;
  onDelete?: (id: string) => void;
  editingAccount: Account | null;
}

export const ModalAccount: React.FC<ModalAccountProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingAccount,
}) => {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<AccountType>('Bank');
  const [balance, setBalance] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setType(editingAccount.type);
      setBalance(String(editingAccount.balance));
      setAccountNumber(editingAccount.accountNumber || '');
      setBankName(editingAccount.bankName || '');
    } else {
      setName('');
      setType('Bank');
      setBalance('');
      setAccountNumber('');
      setBankName('BRI');
    }
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: editingAccount ? editingAccount.id : undefined,
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      accountNumber: accountNumber.trim(),
      bankName: type === 'Bank' ? bankName.trim() : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-600" />
            <span>{editingAccount ? 'Edit Akun Kas / Rekening' : 'Tambah Akun Kas / Rekening Baru'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Nama Akun Rekening / Kas</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kas Utama (Laci), Mandiri Agen, BCA Operasional"
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Tipe Akun</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
              >
                <option value="Bank">Bank Operasional</option>
                <option value="Kas">Kas Tunai (Fisik)</option>
                <option value="E-Wallet">E-Wallet (Dana/OVO/GoPay)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Nomor Rekening / ID</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Contoh: 012901002938501"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700">Saldo Rekening (Rp)</label>
            <input
              type="number"
              required
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-bold text-slate-800 text-sm"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t">
            {editingAccount && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingAccount.id);
                  onClose();
                }}
                className="px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Rekening</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
