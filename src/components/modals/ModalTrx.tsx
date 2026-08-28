import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, X, Sparkles, Calculator, Check, Award, Gift, Tag } from 'lucide-react';
import { Account, CustomerMember, MemberVoucherClaim, PointExchangeSettings, Transaction, TransactionType } from '../../types';
import { calculateFeeSuggestion, formatDateTime, formatRp } from '../../utils/formatters';

interface ModalTrxProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trxData: Partial<Transaction>) => void;
  editingTrx: Transaction | null;
  accounts: Account[];
  members?: CustomerMember[];
  pointSettings?: PointExchangeSettings;
  activeVouchers?: MemberVoucherClaim[];
}

export const ModalTrx: React.FC<ModalTrxProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTrx,
  accounts,
  members = [],
  pointSettings = { minPointsRedeem: 50, pointsPerStep: 50, rupiahPerStep: 5000, enableDirectDiscounts: true },
  activeVouchers = [],
}) => {
  const [type, setType] = useState<TransactionType>('SETOR TUNAI');
  const [accountId, setAccountId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [cust, setCust] = useState<string>('');
  const [target, setTarget] = useState<string>('');
  const [phoneCust, setPhoneCust] = useState<string>('');
  const [nominal, setNominal] = useState<string>('');
  const [feeCust, setFeeCust] = useState<string>('4000');
  const [feeAdmin, setFeeAdmin] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [autoFee, setAutoFee] = useState<boolean>(true);

  // Point Redemption State
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>('');

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const memberPoints = selectedMember?.points || 0;
  const minPoints = pointSettings?.minPointsRedeem ?? 50;

  // Member's active discount vouchers for ATM/Trx
  const memberAvailableVouchers = activeVouchers.filter(
    (v) => v.memberId === selectedMemberId && v.status === 'ACTIVE' && (v.category === 'DISCOUNT_TRX' || v.category === 'FREE_ADMIN')
  );

  useEffect(() => {
    if (editingTrx) {
      setType(editingTrx.type);
      setAccountId(editingTrx.accountId || (accounts[0]?.id ?? ''));
      setSelectedMemberId(editingTrx.memberId || '');
      setCust(editingTrx.cust);
      setTarget(editingTrx.target);
      setPhoneCust(editingTrx.phoneCust || '');
      setNominal(String(editingTrx.nominal));
      setFeeCust(String(editingTrx.feeCust));
      setFeeAdmin(String(editingTrx.feeAdmin));
      setNotes(editingTrx.notes || '');
      setPointsToRedeem(editingTrx.pointsRedeemed || 0);
      setSelectedVoucherId(editingTrx.voucherClaimId || '');
      setAutoFee(false);
    } else {
      setType('SETOR TUNAI');
      setAccountId(accounts[0]?.id ?? '');
      setSelectedMemberId('');
      setCust('');
      setTarget('');
      setPhoneCust('');
      setNominal('');
      setFeeCust('4000');
      setFeeAdmin('0');
      setNotes('');
      setPointsToRedeem(0);
      setSelectedVoucherId('');
      setAutoFee(true);
    }
  }, [editingTrx, isOpen, accounts]);

  // Reset redemption when member changes
  useEffect(() => {
    setPointsToRedeem(0);
    setSelectedVoucherId('');
  }, [selectedMemberId]);

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

  // Calculate discount from points or voucher
  let discountFromPoints = 0;
  if (selectedVoucherId) {
    const v = memberAvailableVouchers.find((vch) => vch.id === selectedVoucherId);
    if (v) {
      discountFromPoints = v.discountValue || 5000;
    }
  } else if (pointsToRedeem >= minPoints) {
    const steps = Math.floor(pointsToRedeem / (pointSettings?.pointsPerStep || 50));
    discountFromPoints = steps * (pointSettings?.rupiahPerStep || 5000);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numNominal = parseFloat(nominal) || 0;
    const rawFeeCust = parseFloat(feeCust) || 0;
    const numFeeAdmin = parseFloat(feeAdmin) || 0;

    if (numNominal <= 0) {
      alert('Nominal transaksi harus lebih dari 0');
      return;
    }

    if (!accountId && accounts.length > 0) {
      alert('Pilih akun kas / rekening terlebih dahulu');
      return;
    }

    // Effective fee customer after point discount
    const effectiveFeeCust = Math.max(0, rawFeeCust - discountFromPoints);

    onSave({
      id: editingTrx ? editingTrx.id : undefined,
      type,
      accountId: accountId || accounts[0]?.id || 'acc1',
      cust: (cust || '').trim(),
      target: (target || '').trim(),
      phoneCust: (phoneCust || '').trim(),
      nominal: numNominal,
      feeCust: effectiveFeeCust,
      feeAdmin: numFeeAdmin,
      notes: (notes || '').trim(),
      time: editingTrx ? editingTrx.time : formatDateTime(),
      status: editingTrx ? editingTrx.status : 'SUCCESS',
      memberId: selectedMemberId || undefined,
      memberNumber: selectedMember?.memberNumber || undefined,
      pointsRedeemed: pointsToRedeem > 0 ? pointsToRedeem : undefined,
      discountFromPoints: discountFromPoints > 0 ? discountFromPoints : undefined,
      voucherClaimId: selectedVoucherId || undefined,
    });

    onClose();
  };

  if (!isOpen) return null;

  const numNominal = parseFloat(nominal) || 0;
  const rawFeeCust = parseFloat(feeCust) || 0;
  const numFeeAdmin = parseFloat(feeAdmin) || 0;
  const effectiveFeeCust = Math.max(0, rawFeeCust - discountFromPoints);
  const totalCustomerPays = numNominal + effectiveFeeCust;
  const netProfit = effectiveFeeCust - numFeeAdmin;

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

          {/* Pilih Member Pelanggan (Reward +1 Poin & Tukar Diskon) */}
          <div className="bg-gradient-to-r from-amber-500/10 via-blue-50/50 to-transparent p-3 rounded-xl border border-amber-300/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Member Pelanggan (+1 Poin Reward)</span>
              </label>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-extrabold px-1.5 py-0.2 rounded font-mono">
                LOYALITAS
              </span>
            </div>

            <select
              value={selectedMemberId}
              onChange={(e) => {
                const memId = e.target.value;
                setSelectedMemberId(memId);
                const mem = members.find((m) => m.id === memId);
                if (mem) {
                  setCust(mem.name);
                  if (mem.phone) setPhoneCust(mem.phone);
                }
              }}
              className="w-full p-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium bg-white"
            >
              <option value="">-- Bukan Member / Nasabah Umum --</option>
              {members
                .filter((m) => m.status === 'ACTIVE')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    👑 [{m.tier}] {m.name} ({m.phone}) - Saldo: {m.points} Poin
                  </option>
                ))}
            </select>

            {selectedMember && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] bg-amber-100/90 px-2.5 py-1 rounded-lg text-amber-950">
                  <span className="flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Member: <strong>{selectedMember.name}</strong></span>
                  </span>
                  <span className="font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded font-mono">
                    {memberPoints} Poin Tersedia
                  </span>
                </div>

                {/* Section Penukaran Poin (Minimal 50 Poin) */}
                {memberPoints >= minPoints ? (
                  <div className="bg-white p-2.5 rounded-lg border border-amber-300/80 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-amber-600" />
                        <span>Tukar Poin Diskon (Min. {minPoints} Poin):</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Poin Cukup ({memberPoints} Poin)
                      </span>
                    </div>

                    {/* Quick Points Redeem Selector */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setPointsToRedeem(0);
                          setSelectedVoucherId('');
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          pointsToRedeem === 0 && !selectedVoucherId
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Tanpa Diskon
                      </button>

                      {/* 50 Points */}
                      <button
                        type="button"
                        onClick={() => {
                          setPointsToRedeem(50);
                          setSelectedVoucherId('');
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          pointsToRedeem === 50
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                            : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        50 Poin (-Rp 5k)
                      </button>

                      {/* 100 Points if available */}
                      {memberPoints >= 100 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPointsToRedeem(100);
                            setSelectedVoucherId('');
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            pointsToRedeem === 100
                              ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-2xs'
                              : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          100 Poin (-Rp 10k)
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="py-1.5 px-2 rounded-lg text-[10px] font-medium border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        >
                          100 Poin (Kurang)
                        </button>
                      )}
                    </div>

                    {/* Member's Active Vouchers Option */}
                    {memberAvailableVouchers.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-100">
                        <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                          Atau Gunakan Voucher Reward Aktif Milik Member:
                        </label>
                        <select
                          value={selectedVoucherId}
                          onChange={(e) => {
                            setSelectedVoucherId(e.target.value);
                            if (e.target.value) setPointsToRedeem(0);
                          }}
                          className="w-full p-1.5 border border-emerald-300 rounded-lg text-[11px] bg-emerald-50/50 text-emerald-950 focus:ring-1 focus:ring-emerald-500 font-medium"
                        >
                          <option value="">-- Pilih Kupon / Voucher Aktif --</option>
                          {memberAvailableVouchers.map((vch) => (
                            <option key={vch.id} value={vch.id}>
                              🎟️ {vch.rewardName} ({vch.voucherCode}) - Potongan {formatRp(vch.discountValue)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Discount Summary Banner */}
                    {discountFromPoints > 0 && (
                      <div className="flex items-center justify-between p-1.5 bg-emerald-100/90 rounded-md text-emerald-900 text-[11px] font-bold border border-emerald-300">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-emerald-700" />
                          <span>
                            {selectedVoucherId ? 'Voucher Diterapkan:' : `Tukar ${pointsToRedeem} Poin:`}
                          </span>
                        </span>
                        <span className="font-mono text-emerald-800">
                          - {formatRp(discountFromPoints)} (Poin Otomatis Berkurang)
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-[10px] text-amber-800 flex items-center justify-between">
                    <span>Minimal penukaran poin adalah <strong>{minPoints} Poin</strong>.</span>
                    <span className="font-semibold text-amber-900">(Kurang {minPoints - memberPoints} Poin lagi)</span>
                  </div>
                )}
              </div>
            )}
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

          {/* Nomor WA & Catatan */}
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
                  className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded text-[10px] font-semibold transition-colors border border-slate-200 cursor-pointer"
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
                className="text-[10px] text-blue-700 hover:text-blue-800 font-bold flex items-center gap-1 underline cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Hitung Otomatis
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  Biaya Customer (Fee Normal)
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

            {/* Discount breakdown if applied */}
            {discountFromPoints > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center justify-between text-xs text-emerald-900">
                <span className="font-semibold flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  Potongan Diskon Poin:
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  - {formatRp(discountFromPoints)} (Biaya Bersih: {formatRp(effectiveFeeCust)})
                </span>
              </div>
            )}

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
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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

