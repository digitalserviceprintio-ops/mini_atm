import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Sparkles,
  QrCode,
  CreditCard,
  Wifi,
  ShieldCheck,
  Award,
  Download,
  Copy,
  Check,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { AgentProfile, CustomerMember, MemberTier } from '../../types';
import { formatRp } from '../../utils/formatters';

interface ModalMemberCardProps {
  isOpen: boolean;
  onClose: () => void;
  member: CustomerMember | null;
  profile: AgentProfile;
}

type CardTheme = 'obsidian-gold' | 'royal-sapphire' | 'emerald-prestige' | 'ruby-royale';

export const ModalMemberCard: React.FC<ModalMemberCardProps> = ({
  isOpen,
  onClose,
  member,
  profile,
}) => {
  const [theme, setTheme] = useState<CardTheme>('obsidian-gold');
  const [viewMode, setViewMode] = useState<'both' | 'front' | 'back'>('both');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !member) return null;

  const handleCopyCardNumber = () => {
    navigator.clipboard.writeText(member.memberNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrintCard = () => {
    window.print();
  };

  const getTierColor = (tier: MemberTier) => {
    switch (tier) {
      case 'VIP':
        return {
          badge: 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-slate-900 border-amber-300',
          gradient: 'from-amber-400 via-amber-200 to-yellow-500',
          ring: 'border-amber-400/40',
        };
      case 'Platinum':
        return {
          badge: 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 text-slate-900 border-slate-300',
          gradient: 'from-slate-200 via-slate-100 to-slate-300',
          ring: 'border-slate-300/40',
        };
      case 'Gold':
        return {
          badge: 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-slate-950 border-yellow-300',
          gradient: 'from-yellow-400 via-amber-300 to-yellow-500',
          ring: 'border-yellow-400/40',
        };
      case 'Silver':
      default:
        return {
          badge: 'bg-gradient-to-r from-slate-300 via-slate-200 to-slate-400 text-slate-900 border-slate-400',
          gradient: 'from-slate-300 via-slate-100 to-slate-400',
          ring: 'border-slate-400/40',
        };
    }
  };

  const tierColors = getTierColor(member.tier);

  // Theme styling configuration
  const themeStyles = {
    'obsidian-gold': {
      name: 'Obsidian Gold (VIP Executive)',
      bgFront: 'bg-gradient-to-br from-[#121620] via-[#0b0e14] to-[#1a1f2c]',
      borderFront: 'border-amber-500/50 shadow-[0_15px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(217,119,6,0.15)]',
      accentText: 'text-amber-300',
      goldEmboss: 'text-amber-200 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_8px_rgba(245,158,11,0.3)]',
      subText: 'text-amber-100/70',
      watermark: 'border-amber-500/10 text-amber-500/5',
      badgeBg: 'bg-amber-950/80 border-amber-600/60 text-amber-300',
    },
    'royal-sapphire': {
      name: 'Royal Sapphire (Navy Gold)',
      bgFront: 'bg-gradient-to-br from-[#0c1e3d] via-[#071328] to-[#122e5e]',
      borderFront: 'border-sky-400/50 shadow-[0_15px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(56,189,248,0.15)]',
      accentText: 'text-sky-300',
      goldEmboss: 'text-sky-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_8px_rgba(56,189,248,0.3)]',
      subText: 'text-sky-200/70',
      watermark: 'border-sky-500/10 text-sky-500/5',
      badgeBg: 'bg-blue-950/80 border-sky-600/60 text-sky-300',
    },
    'emerald-prestige': {
      name: 'Emerald Prestige (Zamrud VIP)',
      bgFront: 'bg-gradient-to-br from-[#092918] via-[#05170d] to-[#0f3d24]',
      borderFront: 'border-emerald-400/50 shadow-[0_15px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.15)]',
      accentText: 'text-emerald-300',
      goldEmboss: 'text-emerald-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_8px_rgba(16,185,129,0.3)]',
      subText: 'text-emerald-200/70',
      watermark: 'border-emerald-500/10 text-emerald-500/5',
      badgeBg: 'bg-emerald-950/80 border-emerald-600/60 text-emerald-300',
    },
    'ruby-royale': {
      name: 'Ruby Royale (Marun Premier)',
      bgFront: 'bg-gradient-to-br from-[#3b0b18] via-[#24050e] to-[#4f0e21]',
      borderFront: 'border-rose-400/50 shadow-[0_15px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(244,63,94,0.15)]',
      accentText: 'text-rose-300',
      goldEmboss: 'text-rose-100 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_8px_rgba(244,63,94,0.3)]',
      subText: 'text-rose-200/70',
      watermark: 'border-rose-500/10 text-rose-500/5',
      badgeBg: 'bg-rose-950/80 border-rose-600/60 text-rose-300',
    },
  }[theme];

  return (
    <div
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      id="modalMemberCard"
    >
      {/* Printable specific styles injected inline to ensure accurate PVC standard size & color reproduction */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printableCardArea, #printableCardArea * {
            visibility: visible;
          }
          #printableCardArea {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 20px !important;
            justify-content: center !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .pvc-card-item {
            break-inside: avoid;
            page-break-inside: avoid;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl shadow-md text-slate-950">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Kartu Member Pelanggan VIP
                </h3>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase shadow-xs ${tierColors.badge}`}
                >
                  {member.tier}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Desain kartu profesional & siap cetak untuk {member.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Control Toolbar */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Theme Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Tema Kartu:</span>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'obsidian-gold', name: 'Obsidian Gold', dot: 'bg-amber-400' },
                  { id: 'royal-sapphire', name: 'Royal Sapphire', dot: 'bg-sky-400' },
                  { id: 'emerald-prestige', name: 'Emerald VIP', dot: 'bg-emerald-400' },
                  { id: 'ruby-royale', name: 'Ruby Royale', dot: 'bg-rose-400' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    theme === t.id
                      ? 'bg-slate-800 text-white border border-slate-600 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                  <span className="hidden sm:inline">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* View Mode & Print Action */}
          <div className="flex items-center gap-2">
            {/* View Mode switcher */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex items-center">
              <button
                onClick={() => setViewMode('both')}
                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  viewMode === 'both' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Depan & Belakang
              </button>
              <button
                onClick={() => setViewMode('front')}
                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  viewMode === 'front' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Depan
              </button>
              <button
                onClick={() => setViewMode('back')}
                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  viewMode === 'back' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Belakang
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrintCard}
              id="btnPrintMemberCard"
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-amber-900/30 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kartu</span>
            </button>
          </div>
        </div>

        {/* Modal Body - Card Preview Section */}
        <div className="p-6 overflow-y-auto bg-slate-950/60 flex-1 flex flex-col items-center justify-center min-h-[420px]">
          {/* Printable Container */}
          <div
            id="printableCardArea"
            ref={printAreaRef}
            className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full max-w-3xl"
          >
            {/* FRONT CARD */}
            {(viewMode === 'both' || viewMode === 'front') && (
              <div
                className={`pvc-card-item relative w-full max-w-[390px] h-[245px] rounded-2xl p-5 border flex flex-col justify-between overflow-hidden select-none transition-transform duration-200 hover:scale-[1.01] ${themeStyles.bgFront} ${themeStyles.borderFront}`}
                style={{
                  aspectRatio: '85.6 / 53.98',
                }}
              >
                {/* Micro-texture background pattern */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                    backgroundSize: '16px 16px',
                  }}
                />

                {/* Elegant metallic guilloche wavy glow */}
                <div className="absolute -right-16 -top-16 w-52 h-52 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-52 h-52 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Front Top Bar: Store Branding & Contactless Icon */}
                <div className="relative z-10 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                      <h4 className="font-extrabold text-[13px] tracking-wider text-white uppercase truncate max-w-[230px]">
                        {profile.storeName}
                      </h4>
                    </div>
                    <p className={`text-[9px] font-semibold tracking-widest uppercase ${themeStyles.accentText}`}>
                      PRIORITY MEMBER LOYALTY CARD
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-amber-300/80 rotate-90" />
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${tierColors.badge}`}
                    >
                      {member.tier}
                    </span>
                  </div>
                </div>

                {/* Front Middle: EMV Chip & Points Badge */}
                <div className="relative z-10 flex items-center justify-between my-auto">
                  {/* Realistic Metallic Gold EMV Chip */}
                  <div className="relative w-11 h-8 rounded-md bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600 p-0.5 shadow-inner border border-amber-300/80 flex flex-col justify-between overflow-hidden">
                    <div className="w-full h-px bg-amber-700/60 mt-1.5" />
                    <div className="w-full h-px bg-amber-700/60 mb-1.5" />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-amber-700/60 transform -translate-x-1/2" />
                    <div className="absolute inset-0 bg-radial from-transparent to-amber-900/20" />
                  </div>

                  {/* Points Counter Badge */}
                  <div
                    className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 backdrop-blur-xs ${themeStyles.badgeBg}`}
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <div className="text-right">
                      <span className="text-[9px] text-amber-200/80 block uppercase font-medium leading-none">
                        Saldo Poin
                      </span>
                      <span className="text-xs font-mono font-extrabold text-amber-300 leading-none">
                        {member.points} Poin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Front Bottom: Card Number & Member Holder Info */}
                <div className="relative z-10 space-y-2">
                  {/* Embossed 16-Digit Member Number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-sm sm:text-base font-bold tracking-[0.2em] select-all ${themeStyles.goldEmboss}`}
                    >
                      {member.memberNumber}
                    </span>
                    <button
                      onClick={handleCopyCardNumber}
                      title="Salin nomor kartu"
                      className="no-print text-amber-400/60 hover:text-amber-300 p-1 cursor-pointer transition-colors"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Cardholder Name & Expiry / Join Date */}
                  <div className="flex items-end justify-between text-[10px] pt-0.5 border-t border-white/10">
                    <div>
                      <span className={`block text-[8px] uppercase tracking-wider font-semibold ${themeStyles.subText}`}>
                        Cardholder Name
                      </span>
                      <span className="font-bold text-xs uppercase tracking-wide text-white block truncate max-w-[210px]">
                        {member.name}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`block text-[8px] uppercase tracking-wider font-semibold ${themeStyles.subText}`}>
                        Member Since
                      </span>
                      <span className="font-mono font-bold text-xs text-amber-200">
                        {member.joinDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BACK CARD */}
            {(viewMode === 'both' || viewMode === 'back') && (
              <div
                className={`pvc-card-item relative w-full max-w-[390px] h-[245px] rounded-2xl border flex flex-col justify-between overflow-hidden select-none transition-transform duration-200 hover:scale-[1.01] ${themeStyles.bgFront} ${themeStyles.borderFront}`}
                style={{
                  aspectRatio: '85.6 / 53.98',
                }}
              >
                {/* Magnetic Stripe Bar */}
                <div className="w-full h-9 bg-[#111111] shadow-inner border-y border-black/40 mt-3" />

                {/* Signature Strip & CVV/ID */}
                <div className="px-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-6 bg-slate-100 rounded-sm flex items-center px-3 border border-slate-300 overflow-hidden relative">
                      <span className="text-[8px] text-slate-400 italic font-mono absolute right-2">
                        AUTHORIZED SIGNATURE
                      </span>
                      <span className="font-serif italic text-xs text-slate-800 tracking-wider">
                        {member.name}
                      </span>
                    </div>
                    <div className="bg-amber-100/90 text-slate-900 font-mono font-bold text-[10px] px-2 py-1 rounded-sm border border-amber-300">
                      ID: {member.id}
                    </div>
                  </div>

                  {/* Terms and conditions */}
                  <div className="text-[7.5px] leading-tight text-slate-300/80 space-y-0.5 bg-black/30 p-2 rounded-lg border border-white/5">
                    <p className="font-semibold text-amber-300">Syarat & Ketentuan Keanggotaan:</p>
                    <p>• 1. Setiap transaksi di outlet mendapatkan 1 Poin Reward resmi.</p>
                    <p>• 2. Tunjukkan kartu atau sebutkan nomor HP / scan barcode ini kepada kasir.</p>
                    <p>• 3. Poin reward dapat ditukarkan dengan diskon atau hadiah menarik.</p>
                    <p>• 4. Layanan Pelanggan: {profile.phone || '0812-3456-7890'} | ID Agen: {profile.idAgent}</p>
                  </div>
                </div>

                {/* Barcode & QR Code Section */}
                <div className="px-5 pb-3 flex items-center justify-between border-t border-white/10 pt-2 bg-black/40">
                  {/* Simulated 1D High-Contrast Optical Barcode */}
                  <div className="space-y-0.5">
                    <div className="bg-white p-1 rounded flex items-center justify-center space-x-[2px] h-7 shadow-xs">
                      {/* Barcode visual lines */}
                      <span className="w-1 h-full bg-black"></span>
                      <span className="w-0.5 h-full bg-black"></span>
                      <span className="w-1.5 h-full bg-black"></span>
                      <span className="w-0.5 h-full bg-black"></span>
                      <span className="w-2 h-full bg-black"></span>
                      <span className="w-0.5 h-full bg-black"></span>
                      <span className="w-1 h-full bg-black"></span>
                      <span className="w-1.5 h-full bg-black"></span>
                      <span className="w-0.5 h-full bg-black"></span>
                      <span className="w-2 h-full bg-black"></span>
                      <span className="w-1 h-full bg-black"></span>
                      <span className="w-0.5 h-full bg-black"></span>
                      <span className="w-1.5 h-full bg-black"></span>
                      <span className="w-1 h-full bg-black"></span>
                      <span className="w-0.5 h-full bg-black"></span>
                      <span className="w-2 h-full bg-black"></span>
                      <span className="w-0.5 h-full bg-black"></span>
                      <span className="w-1.5 h-full bg-black"></span>
                    </div>
                    <span className="font-mono text-[9px] text-amber-200 tracking-wider block text-center font-bold">
                      {member.barcode || member.id}
                    </span>
                  </div>

                  {/* Outlet Security Hologram Seal */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-[8px] text-slate-400 block font-medium">LOKASI OUTLET</span>
                      <span className="text-[9px] font-bold text-white block max-w-[130px] truncate">
                        {profile.address || 'Kecamatan Sukajadi'}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-100 to-amber-600 p-0.5 shadow-md flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-amber-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Guide Note */}
          <p className="text-xs text-slate-400 text-center mt-6 max-w-md no-print">
            💡 Kartu didesain presisi sesuai rasio standar kartu PVC / ID Card (85.6mm &times; 53.98mm). Anda dapat langsung menekan tombol <strong>Cetak Kartu</strong> untuk mencetak pada kertas PVC atau foto.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-white">{member.name}</span>
            <span>&bull;</span>
            <span className="font-mono text-amber-300 font-bold">{member.points} Poin Transaksi</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handlePrintCard}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
