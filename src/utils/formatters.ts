import { Transaction, AgentProfile, Account, PosSale } from '../types';
import { exportTransactionsToExcel } from './excelExport';

export function formatRp(num: number | string | null | undefined): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n === null || n === undefined || isNaN(n)) return 'Rp 0';
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

export function formatDateTime(dateInput?: Date | string): string {
  const date = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
  if (isNaN(date.getTime())) {
    // If string was already formatted e.g. "26 Apr 2026 20:24"
    if (typeof dateInput === 'string') return dateInput;
    return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
           new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} ${hours}:${minutes}`;
}

export function calculateFeeSuggestion(type: string, nominal: number): { feeCust: number; feeAdmin: number } {
  if (nominal <= 0) return { feeCust: 0, feeAdmin: 0 };

  let feeCust = 5000;
  let feeAdmin = 0;

  switch (type) {
    case 'TARIK TUNAI':
      if (nominal <= 500000) feeCust = 3000;
      else if (nominal <= 1000000) feeCust = 5000;
      else if (nominal <= 3000000) feeCust = 8000;
      else feeCust = 10000;
      feeAdmin = 0;
      break;

    case 'SETOR TUNAI':
      if (nominal <= 500000) feeCust = 4000;
      else if (nominal <= 1000000) feeCust = 5000;
      else if (nominal <= 3000000) feeCust = 8000;
      else feeCust = 10000;
      feeAdmin = 0;
      break;

    case 'TRANSFER':
      if (nominal <= 500000) feeCust = 3000;
      else if (nominal <= 1000000) feeCust = 4000;
      else if (nominal <= 2500000) feeCust = 5000;
      else feeCust = 7000;
      feeAdmin = 0; // standard sesama/BI-Fast
      break;

    case 'PEMBAYARAN':
      feeCust = 3000;
      feeAdmin = 0;
      break;

    default:
      feeCust = 3000;
      feeAdmin = 0;
  }

  return { feeCust, feeAdmin };
}

export function exportToCSV(transactions: Transaction[], accounts: Account[], profile?: AgentProfile): void {
  // Directly export formatted .xlsx Excel file
  exportTransactionsToExcel(transactions, accounts, profile);
}

export function createWhatsAppReceiptMessage(t: Transaction, profile: AgentProfile, posSale?: PosSale | null): string {
  // If this is a retail POS sale with items
  if (posSale && posSale.items && posSale.items.length > 0) {
    const isVoid = posSale.status === 'VOID' || t.status === 'VOID';
    let itemRows = '';
    posSale.items.forEach((it) => {
      itemRows += `${it.productName.toUpperCase()}\n  ${it.qty} ${it.unit || 'PCS'} x ${formatRp(it.price)} = ${formatRp(it.subtotal)}\n`;
      if (it.discountAmount && it.discountAmount > 0) {
        itemRows += `  (Diskon Item: -${formatRp(it.discountAmount)})\n`;
      }
    });

    const subtotal = posSale.totalBeforeDiscount || posSale.totalRevenue;
    const totalDiscount = posSale.totalDiscount || 0;
    const finalTotal = posSale.totalRevenue;
    const cash = posSale.cashReceived ?? finalTotal;
    const change = posSale.changeAmount ?? (cash > finalTotal ? cash - finalTotal : 0);

    const message = `*STRUK BUKTI PEMBELIAN RITEL*
*${profile.storeName || 'TOKO RITEL & POS'}*
${profile.receiptHeader ? `${profile.receiptHeader}\n` : ''}${profile.address ? `${profile.address}\n` : ''}Telp/WA: ${profile.phone || '-'}
================================
No. Struk : ${posSale.invoiceNumber || posSale.id}
Tanggal   : ${posSale.time}
Kasir     : ${posSale.cashierName || 'Kasir'}
Pelanggan : ${posSale.customerName || 'Pelanggan Umum'}${posSale.memberNumber ? ` (No: ${posSale.memberNumber})` : ''}
${isVoid ? '*** TRANSAKSI DIBATALKAN (VOID) ***\n' : ''}--------------------------------
${itemRows.trim()}
--------------------------------
Total Item   : ${posSale.items.length} Item (${posSale.totalQty} Qty)
Subtotal     : ${formatRp(subtotal)}${totalDiscount > 0 ? `\nTotal Diskon : -${formatRp(totalDiscount)}` : ''}${posSale.discountFromPoints ? `\nDiskon Poin  : -${formatRp(posSale.discountFromPoints)}` : ''}
================================
*TOTAL BAYAR : ${formatRp(finalTotal)}*
Bayar (${posSale.paymentMethod || 'Tunai'}): ${formatRp(cash)}
*Kembalian   : ${formatRp(change)}*
--------------------------------
* TERIMA KASIH TELAH BERBELANJA *
Barang yg dibeli tdk dpt ditukar/dikembalikan
${profile.receiptFooter || 'Simpan struk ini sebagai bukti pembayaran sah.'}`;

    return encodeURIComponent(message);
  }

  // Standard Retail Banking / Mini ATM receipt layout
  const netTotal = t.nominal + t.feeCust;
  const isVoid = t.status === 'VOID';
  const message = `*STRUK BUKTI TRANSAKSI LAYANAN*
*${profile.storeName || 'MINI ATM & TOKO RITEL'}*
${profile.receiptHeader ? `${profile.receiptHeader}\n` : ''}${profile.address ? `${profile.address}\n` : ''}Telp/WA: ${profile.phone || '-'}
================================
No. Struk : #${t.id}${t.refNumber ? `\nNo. Ref   : ${t.refNumber}` : ''}
Tanggal   : ${t.time}
ID Agen   : ${profile.idAgent || '-'}
${isVoid ? '*** TRANSAKSI DIBATALKAN (VOID) ***\n' : ''}--------------------------------
Layanan   : ${t.type}
Pengirim  : ${t.cust}
Tujuan    : ${t.target}
--------------------------------
Nominal       : ${formatRp(t.nominal)}
Biaya Layanan : ${formatRp(t.feeCust)}
================================
*TOTAL BAYAR  : ${formatRp(netTotal)}*${t.cashReceived ? `\nBayar (Tunai) : ${formatRp(t.cashReceived)}\n*Kembalian    : ${formatRp(t.changeAmount || 0)}*` : ''}
Status        : ${isVoid ? 'DIBATALKAN (VOID)' : 'BERHASIL / SUKSES'}
--------------------------------
* TERIMA KASIH ATAS KUNJUNGAN ANDA *
${profile.receiptFooter || 'Simpan struk ini sebagai bukti transaksi resmi.'}`;

  return encodeURIComponent(message);
}
