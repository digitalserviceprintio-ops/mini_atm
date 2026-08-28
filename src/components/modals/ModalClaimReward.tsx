import React, { useState, useEffect } from 'react';
import { Gift, X, Check, Award, AlertCircle, Sparkles, User, Tag, CheckCircle2 } from 'lucide-react';
import { CustomerMember, MemberRewardItem, PointExchangeSettings } from '../../types';
import { formatRp } from '../../utils/formatters';

interface ModalClaimRewardProps {
  isOpen: boolean;
  onClose: () => void;
  members?: CustomerMember[];
  rewards?: MemberRewardItem[];
  pointSettings?: PointExchangeSettings;
  member?: CustomerMember | null;
  reward?: MemberRewardItem | null;
  selectedMemberId?: string;
  selectedRewardId?: string;
  onConfirmClaim: (memberId: string, rewardId: string, notes?: string) => void;
}

export const ModalClaimReward: React.FC<ModalClaimRewardProps> = ({
  isOpen,
  onClose,
  members = [],
  rewards = [],
  pointSettings,
  member,
  reward,
  selectedMemberId: initialMemberId = '',
  selectedRewardId: initialRewardId = '',
  onConfirmClaim,
}) => {
  const [memberId, setMemberId] = useState<string>(member?.id || initialMemberId);
  const [rewardId, setRewardId] = useState<string>(reward?.id || initialRewardId);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setMemberId(member?.id || initialMemberId);
      setRewardId(reward?.id || initialRewardId);
      setNotes('');
    }
  }, [isOpen, member, reward, initialMemberId, initialRewardId]);

  if (!isOpen) return null;

  const currentMember = member || (members || []).find((m) => m.id === memberId);
  const currentReward = reward || (rewards || []).find((r) => r.id === rewardId);
  const minPoints = pointSettings?.minPointsRedeem ?? 50;

  const memberPoints = currentMember?.points || 0;
  const pointsRequired = currentReward?.pointsRequired || 50;
  const isPointsSufficient = memberPoints >= pointsRequired && memberPoints >= minPoints;
  const isStockAvailable = currentReward ? (currentReward.stock ?? 1) > 0 : true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      alert('Silakan pilih member pelanggan!');
      return;
    }
    if (!rewardId) {
      alert('Silakan pilih hadiah / kupon voucher yang ingin ditukarkan!');
      return;
    }
    if (!isPointsSufficient) {
      alert(`Poin member tidak mencukupi! Poin saat ini: ${memberPoints}, Dibutuhkan: ${pointsRequired} Poin.`);
      return;
    }
    if (!isStockAvailable) {
      alert('Maaf, stok hadiah ini sedang habis.');
      return;
    }

    onConfirmClaim(memberId, rewardId, notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Tukar Poin / Klaim Hadiah Member</h3>
              <p className="text-[11px] text-amber-100/90">
                Poin akan otomatis dipotong dan kupon voucher dibuat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Member Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Pilih Member Pelanggan <span className="text-rose-500">*</span></span>
              {currentMember && (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  👑 {currentMember.points} Poin Tersedia
                </span>
              )}
            </label>
            <select
              value={memberId}
              required
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium text-slate-800"
            >
              <option value="">-- Pilih Member Pelanggan --</option>
              {members
                .filter((m) => m.status === 'ACTIVE')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.phone}) - {m.points} Poin [{m.tier}]
                  </option>
                ))}
            </select>
          </div>

          {/* Reward Item Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Pilih Hadiah / Kupon Voucher <span className="text-rose-500">*</span></span>
              {currentReward && (
                <span className="text-[10px] text-slate-500">
                  Stok: {currentReward.stock ?? 0} unit
                </span>
              )}
            </label>
            <select
              value={rewardId}
              required
              onChange={(e) => setRewardId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium text-slate-800"
            >
              <option value="">-- Pilih Hadiah dari Katalog --</option>
              {rewards
                .filter((r) => r.status === 'ACTIVE')
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    🎁 {r.name} ({r.pointsRequired} Poin) {r.discountValue ? `- Nilai ${formatRp(r.discountValue)}` : ''}
                  </option>
                ))}
            </select>
          </div>

          {/* Validation & Points Breakdown Box */}
          {currentMember && currentReward && (
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              isPointsSufficient
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  {isPointsSufficient ? (
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>Kalkulasi Poin Member:</span>
                </span>
                <span className="font-mono font-bold">
                  {isPointsSufficient ? 'Poin Cukup' : 'Poin Kurang'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Poin Saat Ini</span>
                  <span className="font-bold text-slate-900 font-mono">{memberPoints}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Poin Dipotong</span>
                  <span className="font-bold text-rose-600 font-mono">-{pointsRequired}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px]">Sisa Poin</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {Math.max(0, memberPoints - pointsRequired)}
                  </span>
                </div>
              </div>

              {!isPointsSufficient && (
                <p className="text-[11px] text-rose-700 font-medium pt-1">
                  ⚠️ Member membutuhkan setidaknya <strong>{pointsRequired} Poin</strong> untuk menukar hadiah ini.
                </p>
              )}

              {currentReward.discountValue > 0 && (
                <div className="flex justify-between items-center bg-white/80 p-2 rounded-lg text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  <span>Nilai Diskon yang Didapat:</span>
                  <span className="font-mono">{formatRp(currentReward.discountValue)}</span>
                </div>
              )}
            </div>
          )}

          {/* Catatan / Keterangan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan Penukaran (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Diambil langsung oleh pelanggan / Penukaran kasir"
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-slate-700"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isPointsSufficient || !isStockAvailable || !memberId || !rewardId}
              className={`px-5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                !isPointsSufficient || !isStockAvailable || !memberId || !rewardId
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Konfirmasi & Potong Poin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
