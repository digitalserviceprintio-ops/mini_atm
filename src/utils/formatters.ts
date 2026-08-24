import { Transaction, AgentProfile, Account } from '../types';
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

export function createWhatsAppReceiptMessage(t: Transaction, profile: AgentProfile): string {
  const netTotal = t.nominal + t.feeCust;
  const message = `*STRUK BUKTI TRANSAKSI*
*${profile.storeName}*
${profile.receiptHeader}
----------------------------------------
No. Trx    : #${t.id}
Waktu      : ${t.time}
ID Agen    : ${profile.idAgent}
Layanan    : ${t.type}
Pengirim   : ${t.cust}
Tujuan     : ${t.target}
----------------------------------------
Nominal    : ${formatRp(t.nominal)}
Biaya Layanan : ${formatRp(t.feeCust)}
*TOTAL BAYAR : ${formatRp(netTotal)}*
Status     : ${t.status === 'SUCCESS' ? 'BERHASIL (SUCCESS)' : 'DIBATALKAN (VOID)'}
----------------------------------------
${profile.receiptFooter}
Hub: ${profile.phone}`;

  return encodeURIComponent(message);
}
