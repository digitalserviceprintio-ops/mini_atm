import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, X, Sparkles, Calculator, Check } from 'lucide-react';
import { Account, Transaction, TransactionType } from '../../types';
import { calculateFeeSuggestion, formatDateTime, formatRp } from '../../utils/formatters';

interface ModalTrxProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trxData: Partial<Transaction>) => void;
  editingTrx: Transaction | null;
  accounts: Account[];
}

export const ModalTrx: React.FC<ModalTrxProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTrx,
  accounts,
}) => {
  const [type, setType] = useState<TransactionType>('SETOR TUNAI');
  const [accountId, setAccountId] = useState<string>('');
  const [cust, setCust] = useState<string>('');
  const [target, setTarget] = useState<string>('');
  const [phoneCust, setPhoneCust] = useState<string>('');
  const [nominal, setNominal] = useState<string>('');
  const [feeCust, setFeeCust] = useState<string>('4000');
  const [feeAdmin, setFeeAdmin] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [autoFee, setAutoFee] = useState<boolean>(true);

  useEffect(() => {
    if (editingTrx) {
      setType(editingTrx.type);
      setAccountId(editingTrx.accountId || (accounts[0]?.id ?? ''));
      setCust(editingTrx.cust);
      setTarget(editingTrx.target);
      setPhoneCust(editingTrx.phoneCust || '');
      setNominal(String(editingTrx.nominal));
      setFeeCust(String(editingTrx.feeCust));
      setFeeAdmin(String(editingTrx.feeAdmin));
      setNotes(editingTrx.notes || '');
      setAutoFee(false);
    } else {
      setType('SETOR TUNAI');
      setAccountId(accounts[0]?.id ?? '');
      setCust('');
      setTarget('');
      setPhoneCust('');
      setNominal('');
      setFeeCust('4000');
      setFeeAdmin('0');
      setNotes('');
      setAutoFee(true);
    }
  }, [editingTrx, isOpen, accounts]);

  const handleNominalChange = (val: string) => {
    setNominal(val);
    const num = parseFloat(val) || 0;
    if (autoFee && num > 0) {
      const suggested = calculateFeeSuggestion(type, num);
      setFeeCust(String(suggested.feeCust));
      setFeeAdmin(String(suggested.feeAdmin));
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const num = parseFloat(nominal) || 0;
    if (autoFee && num > 0) {
      const suggested = calculateFeeSuggestion(newType, num);
      setFeeCust(String(suggested.feeCust));
      setFeeAdmin(String(suggested.feeAdmin));
    }
  };

  const applyFeeSuggestion = () => {
    const num = parseFloat(nominal) || 0;
    const suggested = calculateFeeSuggestion(type, num);
    setFeeCust(String(suggested.feeCust));
    setFeeAdmin(String(suggested.feeAdmin));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numNominal = parseFloat(nominal) || 0;
    const numFeeCust = parseFloat(feeCust) || 0;
    const numFeeAdmin = parseFloat(feeAdmin) || 0;

    if (numNominal <= 0) {
      alert('Nominal transaksi harus lebih dari 0');
      return;
    }

    if (!accountId && accounts.length > 0) {
      alert('Pilih akun kas / rekening terlebih dahulu');
      return;
    }

    onSave({
      id: editingTrx ? editingTrx.id : undefined,
      type,
      accountId: accountId || accounts[0]?.id || 'acc1',
      cust: (cust || '').trim(),
      target: (target || '').trim(),
      phoneCust: (phoneCust || '').trim(),
      nominal: numNominal,
      feeCust: numFeeCust,
      feeAdmin: numFeeAdmin,
      notes: (notes || '').trim(),
      time: editingTrx ? editingTrx.time : formatDateTime(),
      status: editingTrx ? editingTrx.status : 'SUCCESS',
    });

    onClose();
  };

  if (!isOpen) return null;

  const numNominal = parseFloat(nominal) || 0;
  const numFeeCust = parseFloat(feeCust) || 0;
  const numFeeAdmin = parseFloat(feeAdmin) || 0;
  const totalCustomerPays = numNominal + numFeeCust;
  const netProfit = numFeeCust - numFeeAdmin;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 my-8">
        {/* Header Modal */}
        <div className="bg-[#003366] text-white p-4 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2" id="modalTrxTitle">
            {editingTrx ? (
              <>
                <Edit3 className="w-4 h-4 text-blue-300" />
                <span>Edit Transaksi #{editingTrx.id}</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 text-blue-300" />
                <span>Transaksi Baru Mini ATM / BRILink</span>
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Tipe & Rekening */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Tipe Transaksi</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium bg-white"
              >
                <option value="TARIK TUNAI">TARIK TUNAI (Tarik dari ATM/Kartu)</option>
                <option value="SETOR TUNAI">SETOR TUNAI (Setor Tunai Agen)</option>
                <option value="TRANSFER">TRANSFER (Antar Rekening/Bank)</option>
                <option value="PEMBAYARAN">PEMBAYARAN (PLN/BPJS/Pulsa)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Akun Kas / Rekening</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium bg-white"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatRp(acc.balance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nasabah & Tujuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Nama Nasabah / Pengirim</label>
              <input
                type="text"
                required
                value={cust}
                onChange={(e) => setCust(e.target.value)}
                placeholder="Contoh: Mbak Dewi"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Tujuan / Nama Penerima / No.Rek</label>
              <input
                type="text"
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Contoh: Bu Painem / Rek 12345"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Nomor WA (Opsional untuk kirim struk WA) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">
                No. WhatsApp Nasabah <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="tel"
                value={phoneCust}
                onChange={(e) => setPhoneCust(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700">Catatan / Keterangan</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Setor arisan, token PLN, dll."
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Nominal Utama */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">Nominal Transaksi (Rp)</label>
              {numNominal > 0 && (
                <span className="text-[11px] font-bold text-blue-700 font-mono">
                  {formatRp(numNominal)}
                </span>
              )}
            </div>
            <input
              type="number"
              required
              min="1000"
              step="1000"
              value={nominal}
              onChange={(e) => handleNominalChange(e.target.value)}
              placeholder="0"
              className="w-full p-2.5 text-base font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-slate-800"
            />
            {/* Quick Nominal Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[50000, 100000, 200000, 500000, 1000000, 2000000].map((quick) => (
                <button
                  type="button"
                  key={quick}
                  onClick={() => handleNominalChange(String(quick))}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded text-[10px] font-semibold transition-colors border border-slate-200"
                >
                  +{quick >= 1000000 ? `${quick / 1000000} Jt` : `${quick / 1000} Rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Biaya Customer & Admin Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                Rincian Biaya & Keuntungan Agen
              </span>
              <button
                type="button"
                onClick={applyFeeSuggestion}
                className="text-[10px] text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1 underline"
              >
                <Sparkles className="w-3 h-3" /> Hitung Otomatis
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  Biaya Customer (Fee Agen)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={feeCust}
                  onChange={(e) => {
                    setFeeCust(e.target.value);
                    setAutoFee(false);
                  }}
                  placeholder="0"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-semibold text-emerald-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  Biaya Admin (Modal/Bank)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={feeAdmin}
                  onChange={(e) => {
                    setFeeAdmin(e.target.value);
                    setAutoFee(false);
                  }}
                  placeholder="0"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-semibold text-slate-600"
                />
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Tagihan Nasabah</span>
                <span className="text-sm font-bold text-blue-700">{formatRp(totalCustomerPays)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Estimasi Net Profit Fee</span>
                <span className={`text-sm font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatRp(netProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingTrx ? 'Simpan Perubahan' : 'Catat Transaksi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
