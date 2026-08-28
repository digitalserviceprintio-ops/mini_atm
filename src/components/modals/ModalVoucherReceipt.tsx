import React from 'react';
import { Printer, X, Award, CheckCircle, Ticket, Calendar, User, Sparkles } from 'lucide-react';
import { AgentProfile, MemberVoucherClaim, PrinterSettings } from '../../types';
import { formatRp } from '../../utils/formatters';

interface ModalVoucherReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  claim: MemberVoucherClaim | null;
  profile: AgentProfile;
  printerSettings: PrinterSettings;
}

export const ModalVoucherReceipt: React.FC<ModalVoucherReceiptProps> = ({
  isOpen,
  onClose,
  claim,
  profile,
  printerSettings,
}) => {
  if (!isOpen || !claim) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs">Struk Bukti Penukaran Reward Poin</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Area */}
        <div className="p-5 bg-slate-50 overflow-y-auto max-h-[75vh]">
          <div
            id="voucher-receipt-printable"
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-slate-800 font-sans text-xs space-y-4 print:border-none print:shadow-none print:p-0"
          >
            {/* Header Outlet */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                {profile.storeName || 'AGEN MINI ATM & POS'}
              </h4>
              <p className="text-[10px] text-slate-500">{profile.address || 'Pusat Layanan Transaksi & Kasir'}</p>
              <p className="text-[10px] text-slate-500 font-mono">Telp/WA: {profile.phone || '-'}</p>
              <div className="mt-2 inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-900">
                <Award className="w-3 h-3 text-amber-600" />
                <span>BUKTI KLAIM REWARD MEMBER</span>
              </div>
            </div>

            {/* Voucher Code Big Badge */}
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 border-2 border-dashed border-amber-400 p-3 rounded-xl text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                Kode Kupon / Voucher Resmi
              </span>
              <div className="text-lg font-extrabold font-mono text-slate-950 tracking-widest">
                {claim.voucherCode}
              </div>
              <div className="inline-block bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                {claim.status === 'ACTIVE' ? 'STATUS: AKTIF / DAPAT DIGUNAKAN' : 'STATUS: SUDAH DIGUNAKAN'}
              </div>
            </div>

            {/* Reward Detail */}
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between items-start">
                <span className="text-slate-500 text-[11px]">Nama Hadiah:</span>
                <span className="font-bold text-slate-900 text-right max-w-[65%] text-[11px]">
                  {claim.rewardName}
                </span>
              </div>

              {claim.discountValue > 0 && (
                <div className="flex justify-between items-center text-emerald-700 font-bold">
                  <span>Nilai Diskon:</span>
                  <span className="font-mono text-sm">{formatRp(claim.discountValue)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-amber-900 font-bold">
                <span>Poin Ditukarkan:</span>
                <span className="font-mono text-xs bg-amber-100 px-1.5 py-0.2 rounded">
                  -{claim.pointsUsed} Poin
                </span>
              </div>
            </div>

            {/* Member Details */}
            <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Member:</span>
                <span className="font-semibold text-slate-800">{claim.memberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ID Member:</span>
                <span className="font-mono text-slate-700">{claim.memberNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Klaim:</span>
                <span className="text-slate-700">{claim.claimDate}</span>
              </div>
              {claim.operatorName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas Kasir:</span>
                  <span className="text-slate-700">{claim.operatorName}</span>
                </div>
              )}
              {claim.notes && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Keterangan:</span>
                  <span className="text-slate-700 italic">{claim.notes}</span>
                </div>
              )}
            </div>

            {/* Barcode & Footer Note */}
            <div className="text-center pt-1 space-y-1.5">
              {/* Simulated Visual Barcode */}
              <div className="flex flex-col items-center">
                <div className="h-9 w-44 bg-slate-900 flex items-center justify-center rounded p-1">
                  <div className="w-full h-full flex justify-between items-center bg-white px-1">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4].map((w, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 h-full"
                        style={{ width: `${w * 1.5}px` }}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[9px] font-mono tracking-widest text-slate-500 mt-1">
                  *{claim.voucherCode}*
                </span>
              </div>

              <p className="text-[9px] text-slate-400">
                Tunjukkan kupon ini kepada kasir saat bertransaksi atau melakukan pengambilan hadiah.
              </p>
              <p className="text-[9px] font-semibold text-slate-600">
                Terima kasih atas loyalitas Anda sebagai Sahabat Agen!
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk Voucher</span>
          </button>
        </div>
      </div>
    </div>
  );
};
