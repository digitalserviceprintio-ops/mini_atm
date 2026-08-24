import React, { useState } from 'react';
import { X, ArrowLeftRight, Check } from 'lucide-react';
import { Account, CashMutation, MutationType } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface ModalMutationProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mutation: CashMutation) => void;
  accounts: Account[];
}

export const ModalMutation: React.FC<ModalMutationProps> = ({
  isOpen,
  onClose,
  onSave,
  accounts,
}) => {
  const [type, setType] = useState<MutationType>('MASUK');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState<string>(accounts[1]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [feeMargin, setFeeMargin] = useState<string>('0');
  const [description, setDescription] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) {
      alert('Nominal mutasi harus lebih dari 0');
      return;
    }

    if (type === 'TRANSFER_INTERNAL' && accountId === toAccountId) {
      alert('Rekening asal dan tujuan tidak boleh sama');
      return;
    }

    const newMutation: CashMutation = {
      id: 'MUT-' + Date.now().toString().slice(-6),
      time: formatDateTime(),
      accountId,
      toAccountId: type === 'TRANSFER_INTERNAL' ? toAccountId : undefined,
      type,
      amount: numAmount,
      feeMargin: parseFloat(feeMargin) || 0,
      description: description.trim() || (type === 'TRANSFER_INTERNAL' ? 'Pindah Dana Antar Rekening' : 'Mutasi Kas'),
    };

    onSave(newMutation);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-blue-600" />
            <span>Catat Mutasi Kas / Pindah Saldo</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700">Jenis Mutasi</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MutationType)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
            >
              <option value="MASUK">Uang Masuk / Tambah Modal Kas</option>
              <option value="KELUAR">Uang Keluar / Biaya Operasional</option>
              <option value="TRANSFER_INTERNAL">Pindah Saldo (Transfer Antar Rekening)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">
                {type === 'TRANSFER_INTERNAL' ? 'Dari Rekening (Asal)' : 'Akun Kas / Rekening'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {type === 'TRANSFER_INTERNAL' && (
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Ke Rekening (Tujuan)</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700">Nominal Mutasi (Rp)</label>
            <input
              type="number"
              required
              min="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-bold text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700">Keterangan / Keperluan</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Beli kertas thermal, setor tunai ke bank, dll."
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Mutasi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
