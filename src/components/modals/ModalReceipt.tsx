import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Share2,
  Copy,
  Check,
  Zap,
  Sliders,
  ExternalLink,
  Loader2,
  Layers,
  Settings,
} from 'lucide-react';
import { AgentProfile, PrinterSettings, Transaction } from '../../types';
import { createWhatsAppReceiptMessage, formatRp } from '../../utils/formatters';
import { executeQuickPrint } from '../../utils/thermalPrinterService';

interface ModalReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  trx: Transaction | null;
  profile: AgentProfile;
  printerSettings: PrinterSettings;
  onOpenPrinterSettings?: () => void;
}

export const ModalReceipt: React.FC<ModalReceiptProps> = ({
  isOpen,
  onClose,
  trx,
  profile,
  printerSettings,
  onOpenPrinterSettings,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [localPaperWidth, setLocalPaperWidth] = useState<'58mm' | '80mm'>(
    printerSettings?.paperWidth || '58mm'
  );
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (printerSettings?.paperWidth) {
      setLocalPaperWidth(printerSettings.paperWidth);
    }
  }, [printerSettings?.paperWidth]);

  // Keyboard shortcut listener for Ctrl+P / Cmd+P while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handleQuickPrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, trx, profile, printerSettings, localPaperWidth]);

  if (!isOpen || !trx) return null;

  const totalPay = trx.nominal + trx.feeCust;
  const isVoid = trx.status === 'VOID';

  const handleQuickPrint = async () => {
    if (!trx) return;
    setIsPrinting(true);
    setPrintFeedback('Mengirim ke printer thermal...');

    try {
      const activeConfig: PrinterSettings = {
        ...printerSettings,
        paperWidth: localPaperWidth,
      };

      const result = await executeQuickPrint(trx, profile, activeConfig);
      setPrintFeedback(result.message);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setPrintFeedback(`Gagal mencetak: ${errMsg}`);
    } finally {
      setIsPrinting(false);
      setTimeout(() => setPrintFeedback(null), 4000);
    }
  };

  const handleShareWhatsApp = () => {
    const waText = createWhatsAppReceiptMessage(trx, profile);
    const targetPhone = trx.phoneCust
      ? trx.phoneCust.replace(/[^0-9]/g, '').replace(/^0/, '62')
      : '';
    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${waText}`
      : `https://wa.me/?text=${waText}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    const text = `STRUK TRANSAKSI - ${profile.storeName}
No: #${trx.id} | ${trx.time}
Agen: ${profile.idAgent}
Layanan: ${trx.type}
Pengirim: ${trx.cust}
Tujuan: ${trx.target}
Nominal: ${formatRp(trx.nominal)}
Biaya Layanan: ${formatRp(trx.feeCust)}
TOTAL: ${formatRp(totalPay)}
Status: ${trx.status}
${profile.receiptFooter}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto receipt-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150 my-6 receipt-modal-card">
        {/* Modal Top Header */}
        <div className="p-3.5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex justify-between items-center modal-header">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600/40 rounded-lg border border-blue-400/30">
              <Printer className="w-4 h-4 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white leading-tight">
                Struk Bukti Transaksi
              </h3>
              <p className="text-[10px] text-blue-200">
                Cetak Thermal Siap Pakai (ESC/POS &amp; Driver)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenPrinterSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrinterSettings();
                }}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-[10px] flex items-center gap-1"
                title="Buka Pengaturan Printer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Setting</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Tutup struk"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper Format & Controls Bar */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs no-print">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-semibold text-slate-600">Kertas:</span>
            <div className="inline-flex rounded-lg bg-slate-200 p-0.5 ml-1">
              <button
                type="button"
                onClick={() => setLocalPaperWidth('58mm')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  localPaperWidth === '58mm'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                58 mm
              </button>
              <button
                type="button"
                onClick={() => setLocalPaperWidth('80mm')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  localPaperWidth === '80mm'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80 mm
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            {printerSettings?.printCopies === 2 && (
              <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>2 Rangkap</span>
              </span>
            )}
            <span className="font-mono hidden sm:inline">
              Pintasan: <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-bold">Ctrl+P</kbd>
            </span>
          </div>
        </div>

        {/* Print Feedback Banner */}
        {printFeedback && (
          <div className="bg-blue-50 text-blue-900 text-xs px-4 py-2 border-b border-blue-200 flex items-center gap-2 animate-in fade-in duration-150 no-print">
            <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span className="font-medium text-[11px]">{printFeedback}</span>
          </div>
        )}

        {/* Receipt Container */}
        <div className="p-4 sm:p-5 bg-slate-100/70 flex justify-center items-center">
          {/* Printable Thermal Receipt Card */}
          <div
            id="printableReceipt"
            className={`p-4 sm:p-5 font-mono text-xs space-y-3 bg-white text-slate-900 select-text shadow-md rounded-lg border border-slate-200 receipt-print-area ${
              localPaperWidth === '58mm' ? 'max-w-[270px] w-full' : 'max-w-[340px] w-full'
            }`}
          >
            {/* Header */}
            <div className="text-center border-b border-slate-200 pb-2.5 space-y-1">
              {printerSettings.showLogo && profile.logoUrl && (
                <div className="w-10 h-10 mx-auto rounded-lg overflow-hidden mb-1 border border-slate-200">
                  <img
                    src={profile.logoUrl}
                    className="w-full h-full object-cover"
                    alt="Logo"
                  />
                </div>
              )}
              <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                {profile.storeName}
              </h4>
              <p className="text-[10px] text-slate-600 font-sans font-medium">
                {profile.receiptHeader}
              </p>
              {profile.address && (
                <p className="text-[9px] text-slate-500 font-sans leading-tight">
                  {profile.address}
                </p>
              )}
              <p className="text-[9px] text-slate-500 font-mono pt-0.5">
                Telp/WA: {profile.phone}
              </p>
              <div className="text-[9px] text-slate-500 font-mono pt-1 border-t border-slate-100 flex justify-between">
                <span>{trx.time}</span>
                <span className="font-bold">ID: #{trx.id}</span>
              </div>
            </div>

            {/* Void Banner if Void */}
            {isVoid && (
              <div className="bg-red-50 text-red-700 p-1.5 rounded text-center font-bold text-xs border border-red-200">
                *** TRANSAKSI DIBATALKAN (VOID) ***
              </div>
            )}

            {/* Transaction Data */}
            <div className="space-y-1 text-[11px]">
              {printerSettings.showIdAgent && (
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Agen:</span>
                  <span className="font-semibold">{profile.idAgent}</span>
                </div>
              )}
              {printerSettings.showRefNumber && trx.refNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Ref:</span>
                  <span className="font-mono text-[10px] font-bold">{trx.refNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Layanan:</span>
                <span className="font-bold text-blue-900">{trx.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pengirim/Nasabah:</span>
                <span className="font-semibold">{trx.cust}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tujuan/Penerima:</span>
                <span className="font-semibold">{trx.target}</span>
              </div>
            </div>

            {/* Nominal Breakdown */}
            <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Nominal:</span>
                <span className="font-bold">{formatRp(trx.nominal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Biaya Layanan:</span>
                <span>{formatRp(trx.feeCust)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL BAYAR:</span>
                <span className="font-mono text-blue-950">{formatRp(totalPay)}</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>Status:</span>
              <span
                className={`font-bold ${
                  isVoid ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {isVoid ? 'VOID / BATAL' : 'BERHASIL / SUKSES'}
              </span>
            </div>

            {/* Notes if any */}
            {printerSettings.showNotes && trx.notes && (
              <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                <span>Ket: {trx.notes}</span>
              </div>
            )}

            {/* Footer Text */}
            {printerSettings.showFooter && (
              <div className="text-center text-[9px] text-slate-500 pt-2 font-sans whitespace-pre-line border-t border-slate-200 leading-tight">
                {profile.receiptFooter || printerSettings.customFooterNote}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col gap-2.5 modal-footer no-print">
          {/* Primary Quick Print Button */}
          <button
            type="button"
            onClick={handleQuickPrint}
            disabled={isPrinting}
            id="btnQuickPrint"
            className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-75 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-700/20 transition-all cursor-pointer"
          >
            {isPrinting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            )}
            <span>
              {isPrinting
                ? 'Sedang Mencetak...'
                : `⚡ Print Cepat Struk (${localPaperWidth})`}
            </span>
            <span className="text-[10px] bg-blue-900/80 px-2 py-0.5 rounded text-blue-200 ml-1 font-mono uppercase">
              {printerSettings.connectionType}
            </span>
          </button>

          {/* Secondary Action Grid */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Kirim bukti struk langsung via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Kirim WA</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Salin teks struk ke clipboard"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="border border-slate-300 hover:bg-slate-100 text-slate-600 font-semibold py-2 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
