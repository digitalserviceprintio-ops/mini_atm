import * as XLSX from 'xlsx';
import { Account, CashMutation, Product, Transaction, AppUser, AgentProfile } from '../types';
import { formatDateTime } from './formatters';

// Helper to auto calculate column widths
function calculateColWidths(data: (string | number | null | undefined)[][]): { wch: number }[] {
  const colWidths: number[] = [];
  data.forEach((row) => {
    row.forEach((cell, colIdx) => {
      const cellLen = cell !== null && cell !== undefined ? String(cell).length : 0;
      if (!colWidths[colIdx] || cellLen > colWidths[colIdx]) {
        colWidths[colIdx] = cellLen;
      }
    });
  });
  // Add a little padding and ensure minimum width
  return colWidths.map((w) => ({ wch: Math.max(w + 3, 10) }));
}

/**
 * Export Transactions to a neat, professional Excel (.xlsx) file
 */
export function exportTransactionsToExcel(
  transactions: Transaction[],
  accounts: Account[],
  profile?: AgentProfile,
  filterLabel?: string
): void {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const wb = XLSX.utils.book_new();

  const titleRows: (string | number)[][] = [
    [profile?.storeName || 'MINI ATM AGENT & BRILINK - LAPORAN TRANSAKSI'],
    [
      `Dicetak: ${formatDateTime()} | Agen: ${profile?.idAgent || '-'} | Filter: ${
        filterLabel || 'Semua Transaksi'
      }`,
    ],
    [], // empty line
  ];

  const headerRow = [
    'No',
    'ID Transaksi',
    'Waktu Transaksi',
    'Jenis Layanan',
    'Nama Nasabah',
    'No/Rek Tujuan',
    'Akun/Kas',
    'Nominal (Rp)',
    'Biaya Nasabah (Rp)',
    'Biaya Admin/Bank (Rp)',
    'Laba Bersih (Rp)',
    'Status',
    'No. Referensi',
    'No. WhatsApp',
    'Catatan',
  ];

  let totalNominal = 0;
  let totalFeeCust = 0;
  let totalFeeAdmin = 0;
  let totalNetProfit = 0;
  let validCount = 0;
  let voidCount = 0;

  const dataRows = transactions.map((t, idx) => {
    const isVoid = t.status === 'VOID';
    const netProfit = isVoid ? 0 : t.feeCust - t.feeAdmin;
    const accName = accountMap.get(t.accountId) || 'Utama';

    if (!isVoid) {
      totalNominal += t.nominal;
      totalFeeCust += t.feeCust;
      totalFeeAdmin += t.feeAdmin;
      totalNetProfit += netProfit;
      validCount++;
    } else {
      voidCount++;
    }

    return [
      idx + 1,
      t.id,
      t.time,
      t.type,
      t.cust,
      t.target,
      accName,
      t.nominal,
      t.feeCust,
      t.feeAdmin,
      netProfit,
      t.status === 'SUCCESS' ? 'BERHASIL' : 'VOID (BATAL)',
      t.refNumber || '-',
      t.phoneCust || '-',
      t.notes || '-',
    ];
  });

  const summaryRows: (string | number)[][] = [
    [],
    [
      'TOTAL RINGKASAN',
      '',
      '',
      '',
      '',
      '',
      `Valid: ${validCount} | Void: ${voidCount}`,
      totalNominal,
      totalFeeCust,
      totalFeeAdmin,
      totalNetProfit,
      '',
      '',
      '',
      '',
    ],
  ];

  const allRows = [...titleRows, headerRow, ...dataRows, ...summaryRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  ws['!cols'] = calculateColWidths(allRows);

  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Transaksi');

  const dateStr = new Date().toISOString().slice(0, 10);
  const storeSlug = (profile?.storeName || 'MiniATM').replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Laporan_Transaksi_${storeSlug}_${dateStr}.xlsx`);
}

/**
 * Export Full Multi-Sheet Database Excel (.xlsx) containing all modules
 */
export function exportFullDatabaseToExcel(
  transactions: Transaction[],
  mutations: CashMutation[],
  accounts: Account[],
  products: Product[],
  users: AppUser[],
  profile: AgentProfile
): void {
  const wb = XLSX.utils.book_new();
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const exportTime = formatDateTime();

  // --- SHEET 1: RINGKASAN & PROFIL AGEN ---
  const validTrx = transactions.filter((t) => t.status !== 'VOID');
  const totalVolume = validTrx.reduce((sum, t) => sum + t.nominal, 0);
  const totalFeeCust = validTrx.reduce((sum, t) => sum + t.feeCust, 0);
  const totalFeeAdmin = validTrx.reduce((sum, t) => sum + t.feeAdmin, 0);
  const totalProfit = totalFeeCust - totalFeeAdmin;
  const totalSaldoKas = accounts.reduce((sum, a) => sum + a.balance, 0);

  const summarySheetData: (string | number)[][] = [
    ['RINGKASAN DATABASE & PROFIL OUTLET'],
    [`Tanggal Export: ${exportTime}`],
    [],
    ['INFORMASI PROFIL OUTLET', ''],
    ['Nama Outlet / Toko', profile.storeName],
    ['Nama Pemilik', profile.ownerName],
    ['ID Agen', profile.idAgent],
    ['Nomor Telepon / WA', profile.phone],
    ['Alamat Outlet', profile.address],
    ['Header Struk', profile.receiptHeader],
    ['Footer Struk', profile.receiptFooter],
    [],
    ['METRIK KINERJA UTAMA', 'NILAI'],
    ['Total Transaksi Tercatat', transactions.length],
    ['Transaksi Berhasil (Success)', validTrx.length],
    ['Transaksi Dibatalkan (Void)', transactions.length - validTrx.length],
    ['Total Volume Transaksi (Rp)', totalVolume],
    ['Total Pendapatan Biaya Nasabah (Rp)', totalFeeCust],
    ['Total Biaya Admin Bank (Rp)', totalFeeAdmin],
    ['Total Laba Bersih Agen (Rp)', totalProfit],
    ['Total Saldo Kas & Bank Aktif (Rp)', totalSaldoKas],
    ['Jumlah Akun Kas / Rekening Bank', accounts.length],
    ['Jumlah Item Produk POS', products.length],
    ['Jumlah Catatan Mutasi Kas', mutations.length],
    ['Jumlah Pengguna (Admin & Kasir)', users.length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  wsSummary['!cols'] = calculateColWidths(summarySheetData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan & Profil');

  // --- SHEET 2: DATA TRANSAKSI ---
  const trxHeader = [
    'No',
    'ID Transaksi',
    'Waktu',
    'Jenis Layanan',
    'Nama Nasabah',
    'No / Rek Tujuan',
    'Akun Kas / Rekening',
    'Nominal (Rp)',
    'Biaya Nasabah (Rp)',
    'Biaya Admin (Rp)',
    'Laba Bersih (Rp)',
    'Status',
    'No Referensi',
    'Kontak WA',
    'Catatan Transaksi',
  ];

  const trxRows = transactions.map((t, idx) => {
    const isVoid = t.status === 'VOID';
    return [
      idx + 1,
      t.id,
      t.time,
      t.type,
      t.cust,
      t.target,
      accountMap.get(t.accountId) || t.accountId,
      t.nominal,
      t.feeCust,
      t.feeAdmin,
      isVoid ? 0 : t.feeCust - t.feeAdmin,
      t.status,
      t.refNumber || '-',
      t.phoneCust || '-',
      t.notes || '-',
    ];
  });

  const trxFullRows = [
    [`DAFTAR TRANSAKSI - ${profile.storeName}`],
    [`Diexport pada: ${exportTime}`],
    [],
    trxHeader,
    ...trxRows,
  ];
  const wsTrx = XLSX.utils.aoa_to_sheet(trxFullRows);
  wsTrx['!cols'] = calculateColWidths(trxFullRows);
  XLSX.utils.book_append_sheet(wb, wsTrx, 'Data Transaksi');

  // --- SHEET 3: ARUS KAS & MUTASI ---
  const mutasiHeader = [
    'No',
    'ID Mutasi',
    'Waktu',
    'Tipe Mutasi',
    'Akun Sumber',
    'Akun Tujuan',
    'Jumlah Nominal (Rp)',
    'Margin / Biaya (Rp)',
    'Keterangan / Deskripsi',
    'ID Transaksi Terkait',
  ];

  const mutasiRows = mutations.map((m, idx) => [
    idx + 1,
    m.id,
    m.time,
    m.type,
    accountMap.get(m.accountId) || m.accountId,
    m.toAccountId ? accountMap.get(m.toAccountId) || m.toAccountId : '-',
    m.amount,
    m.feeMargin,
    m.description,
    m.relatedTrxId || '-',
  ]);

  const mutasiFullRows = [
    [`CATATAN ARUS KAS & MUTASI - ${profile.storeName}`],
    [`Diexport pada: ${exportTime}`],
    [],
    mutasiHeader,
    ...mutasiRows,
  ];
  const wsMutasi = XLSX.utils.aoa_to_sheet(mutasiFullRows);
  wsMutasi['!cols'] = calculateColWidths(mutasiFullRows);
  XLSX.utils.book_append_sheet(wb, wsMutasi, 'Arus Kas & Mutasi');

  // --- SHEET 4: AKUN KAS & REKENING ---
  const accHeader = [
    'No',
    'ID Akun',
    'Nama Akun / Kas',
    'Tipe Akun',
    'Nomor Rekening / Kode',
    'Nama Bank',
    'Saldo Saat Ini (Rp)',
  ];

  const accRows = accounts.map((a, idx) => [
    idx + 1,
    a.id,
    a.name,
    a.type,
    a.accountNumber || '-',
    a.bankName || '-',
    a.balance,
  ]);

  const accFullRows = [
    [`DAFTAR AKUN KAS & REKENING BANK - ${profile.storeName}`],
    [`Diexport pada: ${exportTime}`],
    [],
    accHeader,
    ...accRows,
  ];
  const wsAcc = XLSX.utils.aoa_to_sheet(accFullRows);
  wsAcc['!cols'] = calculateColWidths(accFullRows);
  XLSX.utils.book_append_sheet(wb, wsAcc, 'Akun Kas & Bank');

  // --- SHEET 5: KATALOG PRODUK POS ---
  const prodHeader = [
    'No',
    'ID Produk',
    'Nama Produk / Layanan',
    'Kategori',
    'Harga Jual (Rp)',
    'Stok Tersedia',
    'Barcode / SKU',
  ];

  const prodRows = products.map((p, idx) => [
    idx + 1,
    p.id,
    p.name,
    p.category || 'Umum',
    p.price,
    p.stock,
    p.barcode || '-',
  ]);

  const prodFullRows = [
    [`KATALOG PRODUK PENJUALAN FISIK - ${profile.storeName}`],
    [`Diexport pada: ${exportTime}`],
    [],
    prodHeader,
    ...prodRows,
  ];
  const wsProd = XLSX.utils.aoa_to_sheet(prodFullRows);
  wsProd['!cols'] = calculateColWidths(prodFullRows);
  XLSX.utils.book_append_sheet(wb, wsProd, 'Katalog Produk POS');

  // --- SHEET 6: PENGGUNA & AKSES ---
  const userHeader = [
    'No',
    'ID Pengguna',
    'Username',
    'Nama Lengkap',
    'Role Hak Akses',
    'Status Akun',
    'No. Telepon / WA',
    'Tanggal Dibuat',
    'Terakhir Login',
    'Catatan Akun',
  ];

  const userRows = users.map((u, idx) => [
    idx + 1,
    u.id,
    u.username,
    u.name,
    u.role,
    u.status,
    u.phone || '-',
    u.createdAt,
    u.lastLogin || '-',
    u.notes || '-',
  ]);

  const userFullRows = [
    [`DAFTAR PENGGUNA & HAK AKSES - ${profile.storeName}`],
    [`Diexport pada: ${exportTime}`],
    [],
    userHeader,
    ...userRows,
  ];
  const wsUser = XLSX.utils.aoa_to_sheet(userFullRows);
  wsUser['!cols'] = calculateColWidths(userFullRows);
  XLSX.utils.book_append_sheet(wb, wsUser, 'Daftar Pengguna');

  // Save full workbook
  const dateStr = new Date().toISOString().slice(0, 10);
  const storeSlug = profile.storeName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Database_Lengkap_${storeSlug}_${dateStr}.xlsx`);
}
