import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Share2,
  Copy,
  Check,
  Zap,
  Sliders,
  Loader2,
  Layers,
  Settings,
  ShoppingBag,
} from 'lucide-react';
import { AgentProfile, PosSale, PrinterSettings, Transaction } from '../../types';
import { createWhatsAppReceiptMessage, formatRp } from '../../utils/formatters';
import { executeQuickPrint } from '../../utils/thermalPrinterService';

interface ModalReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  trx: Transaction | null;
  profile: AgentProfile;
  printerSettings: PrinterSettings;
  posSale?: PosSale | null;
  posSales?: PosSale[];
  onOpenPrinterSettings?: () => void;
}

export const ModalReceipt: React.FC<ModalReceiptProps> = ({
  isOpen,
  onClose,
  trx,
  profile,
  printerSettings,
  posSale,
  posSales = [],
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

  // Determine if this is a retail POS transaction with itemized goods
  const activePosSale =
    posSale ||
    (trx
      ? posSales.find(
          (s) => s.id === trx.refNumber || s.id === trx.id || s.invoiceNumber === trx.id
        ) || null
      : null);

  const isPosRetail = Boolean(activePosSale && activePosSale.items && activePosSale.items.length > 0);

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
  }, [isOpen, trx, profile, printerSettings, localPaperWidth, activePosSale]);

  if (!isOpen || !trx) return null;

  const totalPay = isPosRetail ? activePosSale!.totalRevenue : trx.nominal + trx.feeCust;
  const isVoid = trx.status === 'VOID' || (activePosSale ? activePosSale.status === 'VOID' : false);
  const cash = isPosRetail
    ? activePosSale?.cashReceived ?? totalPay
    : trx.cashReceived ?? totalPay;
  const change = isPosRetail
    ? activePosSale?.changeAmount ?? (cash > totalPay ? cash - totalPay : 0)
    : trx.changeAmount ?? 0;

  const receiptNumber = isPosRetail
    ? activePosSale!.invoiceNumber || activePosSale!.id
    : `#${trx.id}`;
  const cashier = isPosRetail
    ? activePosSale!.cashierName || 'Kasir 01'
    : profile.idAgent || 'Operator';
  const customer = isPosRetail
    ? activePosSale!.customerName || 'Pelanggan Umum'
    : trx.cust;

  const handleQuickPrint = async () => {
    if (!trx) return;
    setIsPrinting(true);
    setPrintFeedback('Mengirim struk ke printer thermal...');

    try {
      const activeConfig: PrinterSettings = {
        ...printerSettings,
        paperWidth: localPaperWidth,
      };

      const result = await executeQuickPrint(trx, profile, activeConfig, activePosSale);
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
    const waText = createWhatsAppReceiptMessage(trx, profile, activePosSale);
    const targetPhone = trx.phoneCust
      ? trx.phoneCust.replace(/[^0-9]/g, '').replace(/^0/, '62')
      : '';
    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${waText}`
      : `https://wa.me/?text=${waText}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    let text = '';
    if (isPosRetail && activePosSale) {
      const itemRows = activePosSale.items
        .map(
          (it) =>
            `${it.productName.toUpperCase()}\n  ${it.qty} ${it.unit || 'PCS'} x ${formatRp(it.price)} = ${formatRp(it.subtotal)}`
        )
        .join('\n');

      text = `STRUK BUKTI PEMBELIAN RITEL - ${profile.storeName || 'TOKO RITEL & POS'}
No. Struk: ${receiptNumber} | ${activePosSale.time}
Kasir: ${cashier} | Pelanggan: ${customer}
----------------------------------------
${itemRows}
----------------------------------------
Total Item: ${activePosSale.items.length} Item (${activePosSale.totalQty} Qty)
Subtotal: ${formatRp(activePosSale.totalBeforeDiscount || activePosSale.totalRevenue)}
${activePosSale.totalDiscount ? `Diskon: -${formatRp(activePosSale.totalDiscount)}\n` : ''}TOTAL: ${formatRp(totalPay)}
Bayar: ${formatRp(cash)} | Kembali: ${formatRp(change)}
Status: ${isVoid ? 'DIBATALKAN (VOID)' : 'SUKSES'}
Terima kasih telah berbelanja!`;
    } else {
      text = `STRUK TRANSAKSI - ${profile.storeName}
No: #${trx.id} | ${trx.time}
ID Agen: ${profile.idAgent || '-'}
Layanan: ${trx.type}
Pengirim: ${trx.cust} | Tujuan: ${trx.target}
Nominal: ${formatRp(trx.nominal)} | Biaya: ${formatRp(trx.feeCust)}
TOTAL: ${formatRp(totalPay)}
Status: ${isVoid ? 'VOID' : 'SUKSES'}
${profile.receiptFooter || ''}`;
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto receipt-modal-backdrop">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150 my-6 receipt-modal-card">
        {/* Modal Top Header */}
        <div className="p-3.5 bg-slate-900 text-white flex justify-between items-center modal-header">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-lg border border-white/15">
              {isPosRetail ? (
                <ShoppingBag className="w-4 h-4 text-emerald-300" />
              ) : (
                <Printer className="w-4 h-4 text-teal-300" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-xs text-white leading-tight">
                {isPosRetail ? 'Struk Kasir Toko Ritel' : 'Struk Bukti Transaksi'}
              </h3>
              <p className="text-[10px] text-slate-300">
                Format Cetak Thermal Siap Pakai (ESC/POS &amp; Browser)
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
                    ? 'bg-white text-slate-900 shadow-xs'
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
                    ? 'bg-white text-slate-900 shadow-xs'
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
              <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-bold">Ctrl+P</kbd>
            </span>
          </div>
        </div>

        {/* Print Feedback Banner */}
        {printFeedback && (
          <div className="bg-teal-50 text-teal-900 text-xs px-4 py-2 border-b border-teal-200 flex items-center gap-2 animate-in fade-in duration-150 no-print">
            <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="font-medium text-[11px]">{printFeedback}</span>
          </div>
        )}

        {/* Receipt Container - Authentic Thermal Paper Styling */}
        <div className="p-4 sm:p-5 bg-slate-100 flex justify-center items-center">
          <div
            id="printableReceipt"
            className={`p-4 sm:p-5 font-mono text-xs bg-white text-slate-950 select-text shadow-md rounded-md border border-slate-300 receipt-print-area ${
              localPaperWidth === '58mm' ? 'max-w-[270px] w-full' : 'max-w-[340px] w-full'
            }`}
          >
            {/* Header Toko Ritel */}
            <div className="text-center pb-2 space-y-1">
              {printerSettings.showLogo && profile.logoUrl && (
                <div className="w-10 h-10 mx-auto rounded overflow-hidden mb-1 border border-slate-200">
                  <img
                    src={profile.logoUrl}
                    className="w-full h-full object-cover"
                    alt="Logo"
                  />
                </div>
              )}
              <h4 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                {profile.storeName || (isPosRetail ? 'TOKO RITEL & POS' : 'MINI ATM AGENT')}
              </h4>
              {profile.receiptHeader && (
                <p className="text-[10px] text-slate-700 font-sans font-medium">
                  {profile.receiptHeader}
                </p>
              )}
              {profile.address && (
                <p className="text-[9px] text-slate-600 font-sans leading-tight">
                  {profile.address}
                </p>
              )}
              <p className="text-[9px] text-slate-600 font-mono pt-0.5">
                Telp/WA: {profile.phone || '-'}
              </p>
            </div>

            {/* Separator Garis Putus-Putus */}
            <div className="border-b border-dashed border-slate-400 my-2" />

            {/* Metadata Struk Ritel */}
            <div className="space-y-0.5 text-[10.5px]">
              <div className="flex justify-between">
                <span className="text-slate-600">No. Struk:</span>
                <span className="font-bold">{receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tanggal:</span>
                <span>{isPosRetail ? activePosSale!.time : trx.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Kasir:</span>
                <span>{cashier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pelanggan:</span>
                <span className="font-medium truncate max-w-[140px]">{customer}</span>
              </div>
              {isPosRetail && activePosSale?.memberNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-600">No. Member:</span>
                  <span className="font-bold">{activePosSale.memberNumber}</span>
                </div>
              )}
              {!isPosRetail && settingsRefNumber(printerSettings, trx)}
            </div>

            {/* Void Banner if Void */}
            {isVoid && (
              <div className="my-2 bg-red-50 text-red-700 p-1.5 rounded text-center font-bold text-xs border border-red-200">
                *** TRANSAKSI DIBATALKAN (VOID) ***
              </div>
            )}

            {/* Separator Garis Putus-Putus */}
            <div className="border-b border-dashed border-slate-400 my-2" />

            {/* Body: Daftar Item Ritel ATAU Layanan Mini ATM */}
            {isPosRetail && activePosSale ? (
              <div className="space-y-2 py-1">
                {activePosSale.items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5 text-[11px]">
                    <div className="font-bold text-slate-900 uppercase break-words leading-tight">
                      {it.productName}
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span>
                        {it.qty} {it.unit || 'PCS'} x {formatRp(it.price)}
                      </span>
                      <span className="font-bold text-slate-900">{formatRp(it.subtotal)}</span>
                    </div>
                    {it.discountAmount && it.discountAmount > 0 ? (
                      <div className="text-[9.5px] text-rose-600 pl-2">
                        (Diskon Item: -{formatRp(it.discountAmount)})
                      </div>
                    ) : null}
                  </div>
                ))}

                <div className="border-b border-dashed border-slate-300 pt-1 my-1.5" />

                <div className="space-y-0.5 text-[10.5px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Item:</span>
                    <span>
                      {activePosSale.items.length} Item ({activePosSale.totalQty} Qty)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>
                      {formatRp(activePosSale.totalBeforeDiscount || activePosSale.totalRevenue)}
                    </span>
                  </div>
                  {(activePosSale.totalDiscount || 0) > 0 && (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Total Diskon:</span>
                      <span>-{formatRp(activePosSale.totalDiscount || 0)}</span>
                    </div>
                  )}
                  {activePosSale.discountFromPoints && activePosSale.discountFromPoints > 0 ? (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Diskon Poin:</span>
                      <span>-{formatRp(activePosSale.discountFromPoints)}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-[11px] py-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Layanan:</span>
                  <span className="font-bold text-slate-900">{trx.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pengirim:</span>
                  <span className="font-semibold">{trx.cust}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tujuan/Rek:</span>
                  <span className="font-semibold">{trx.target}</span>
                </div>
                <div className="border-b border-dashed border-slate-300 my-1.5" />
                <div className="flex justify-between">
                  <span className="text-slate-600">Nominal:</span>
                  <span className="font-bold">{formatRp(trx.nominal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Admin:</span>
                  <span>{formatRp(trx.feeCust)}</span>
                </div>
              </div>
            )}

            {/* Total Bayar Garis Ganda Toko Ritel */}
            <div className="border-t-2 border-b-2 border-slate-900 py-1.5 my-2 flex justify-between items-center text-xs">
              <span className="font-black text-slate-900 uppercase">TOTAL BAYAR:</span>
              <span className="font-black text-sm text-slate-900">{formatRp(totalPay)}</span>
            </div>

            {/* Pembayaran & Kembalian */}
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span>Bayar ({isPosRetail ? activePosSale?.paymentMethod || 'Tunai' : 'Tunai'}):</span>
                <span className="font-bold">{formatRp(cash)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Kembalian:</span>
                <span className="font-black text-xs">{formatRp(change)}</span>
              </div>
            </div>

            {/* Poin Loyalitas Jika Ada */}
            {isPosRetail && activePosSale?.pointsEarned ? (
              <div className="pt-1.5 mt-1.5 border-t border-dashed border-slate-300 flex justify-between text-[10px] text-emerald-800 font-bold">
                <span>Poin Didapat:</span>
                <span>+{activePosSale.pointsEarned} Poin</span>
              </div>
            ) : null}

            {/* Barcode Garis Simulasi Ritel */}
            <div className="text-center my-3 pt-1 border-t border-dashed border-slate-300">
              <div className="font-mono text-xs tracking-widest font-black select-none text-slate-900">
                |||| | ||||| || |||||| |||| |
              </div>
              <div className="text-[9px] tracking-wider text-slate-600 mt-0.5">
                * {receiptNumber} *
              </div>
            </div>

            {/* Footer Resmi Struk Toko Ritel */}
            <div className="text-center text-[9px] text-slate-600 pt-1.5 border-t border-dashed border-slate-400 space-y-1 leading-tight">
              <p className="font-bold text-slate-900">*** TERIMA KASIH TELAH BERBELANJA ***</p>
              <p>BARANG YANG SUDAH DIBELI TIDAK DAPAT DITUKAR / DIKEMBALIKAN KECUALI DENGAN PERJANJIAN</p>
              <p className="text-[8.5px]">SMS/WA LAYANAN: {profile.phone || '-'}</p>
              {profile.receiptFooter && (
                <p className="pt-1 text-[8.5px] italic">{profile.receiptFooter}</p>
              )}
            </div>
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
            className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-75 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {isPrinting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            )}
            <span>
              {isPrinting
                ? 'Sedang Mencetak...'
                : `⚡ Cetak Struk Ritel (${localPaperWidth})`}
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white ml-1 font-mono uppercase">
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

function settingsRefNumber(settings: PrinterSettings, trx: Transaction) {
  if (settings.showRefNumber && trx.refNumber) {
    return (
      <div className="flex justify-between">
        <span className="text-slate-600">No. Ref:</span>
        <span className="font-mono text-[10px] font-bold">{trx.refNumber}</span>
      </div>
    );
  }
  return null;
}

