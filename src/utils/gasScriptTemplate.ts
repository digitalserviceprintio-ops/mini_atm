/**
 * Template Kode Google Apps Script (Code.gs)
 * Siap ditempel ke Google Sheets via menu: Ekstensi > Apps Script
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * BACKEND GOOGLE APPS SCRIPT - SISTEM KASIR & AGEN MINI ATM BRILINK
 * =========================================================================
 * Script ini mengelola penyimpanan data transaksi, akun kas, mutasi,
 * produk kasir fisik, profil agen, dan log aktivitas secara real-time.
 * 
 * PANDUAN DEPLOY:
 * 1. Buka spreadsheet baru di Google Sheets.
 * 2. Klik menu "Ekstensi" > "Apps Script".
 * 3. Hapus semua kode default dan tempel kode ini.
 * 4. Klik "Simpan" (Ctrl+S atau Cmd+S).
 * 5. Klik "Deploy" > "New deployment" (Penerapan baru).
 * 6. Pilih tipe "Web app" (Aplikasi web).
 * 7. Pada "Execute as": Pilih "Me (Akun Anda)".
 * 8. Pada "Who has access": Pilih "Anyone" (Siapa saja).
 * 9. Klik "Deploy" dan berikan izin akses (Authorize access).
 * 10. Salin "Web app URL" dan tempelkan ke aplikasi Mini ATM.
 * =========================================================================
 */

// Konstanta Nama Sheet
var SHEET_TRANSAKSI = "Transaksi";
var SHEET_AKUN_KAS = "AkunKas";
var SHEET_MUTASI_KAS = "MutasiKas";
var SHEET_PRODUK = "Produk";
var SHEET_PENGGUNA = "Pengguna";
var SHEET_PROFIL = "ProfilAgen";
var SHEET_SETTING_PRINTER = "SettingPrinter";
var SHEET_LOG = "LogAktivitas";

/**
 * Handle HTTP GET Request (Inisialisasi Menu & Pengambilan Data)
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initAllSheets(ss);
    
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "init";
    
    if (action === "ping") {
      return createJsonResponse({
        status: "success",
        message: "Koneksi Google Apps Script berhasil terhubung!",
        spreadsheetName: ss.getName(),
        spreadsheetUrl: ss.getUrl(),
        timestamp: new Date().toISOString()
      });
    }
    
    // Inisialisasi data lengkap untuk seluruh menu aplikasi
    var data = fetchAllAppData(ss);
    return createJsonResponse({
      status: "success",
      action: "init",
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      data: data
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Handle HTTP POST Request (Simpan & Update Otomatis)
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initAllSheets(ss);
    
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }
    
    var action = payload.action || "syncAll";
    var result = { status: "success", action: action };
    
    switch (action) {
      case "ping":
        result.message = "Ping POST berhasil";
        break;
        
      case "init":
      case "getData":
        result.data = fetchAllAppData(ss);
        break;
        
      case "saveTransaction":
        result.transaction = saveOrUpdateTransaction(ss, payload.transaction);
        if (payload.accounts && Array.isArray(payload.accounts)) {
          saveAllAccounts(ss, payload.accounts);
        }
        if (payload.mutation) {
          saveMutation(ss, payload.mutation);
        }
        break;
        
      case "voidTransaction":
        result.transaction = voidTransaction(ss, payload.transactionId);
        if (payload.accounts && Array.isArray(payload.accounts)) {
          saveAllAccounts(ss, payload.accounts);
        }
        if (payload.mutation) {
          saveMutation(ss, payload.mutation);
        }
        break;
        
      case "saveMutation":
        result.mutation = saveMutation(ss, payload.mutation);
        if (payload.accounts && Array.isArray(payload.accounts)) {
          saveAllAccounts(ss, payload.accounts);
        }
        break;
        
      case "saveAccount":
        result.account = saveOrUpdateAccount(ss, payload.account);
        break;
        
      case "deleteAccount":
        result.deletedId = deleteAccount(ss, payload.accountId);
        break;
        
      case "saveProduct":
        result.product = saveOrUpdateProduct(ss, payload.product);
        break;
        
      case "checkoutPOS":
        if (payload.products && Array.isArray(payload.products)) {
          saveAllProducts(ss, payload.products);
        }
        if (payload.transaction) {
          saveOrUpdateTransaction(ss, payload.transaction);
        }
        if (payload.accounts && Array.isArray(payload.accounts)) {
          saveAllAccounts(ss, payload.accounts);
        }
        if (payload.mutation) {
          saveMutation(ss, payload.mutation);
        }
        result.message = "Checkout POS berhasil disimpan";
        break;
        
      case "saveProfile":
        result.profile = saveProfile(ss, payload.profile);
        break;
        
      case "savePrinterSettings":
        result.printerSettings = savePrinterSettings(ss, payload.printerSettings);
        break;
        
      case "saveUser":
        result.user = saveOrUpdateUser(ss, payload.user);
        break;
        
      case "deleteUser":
        result.deletedId = deleteUser(ss, payload.userId);
        break;
        
      case "syncAll":
        // Batch sync seluruh data aplikasi
        if (payload.transactions) saveAllTransactions(ss, payload.transactions);
        if (payload.accounts) saveAllAccounts(ss, payload.accounts);
        if (payload.mutations) saveAllMutations(ss, payload.mutations);
        if (payload.products) saveAllProducts(ss, payload.products);
        if (payload.users) saveAllUsers(ss, payload.users);
        if (payload.profile) saveProfile(ss, payload.profile);
        if (payload.printerSettings) savePrinterSettings(ss, payload.printerSettings);
        result.message = "Sinkronisasi batch seluruh data berhasil!";
        break;
        
      default:
        result.status = "error";
        result.message = "Aksi '" + action + "' tidak dikenali.";
    }
    
    // Log aksi
    logActivity(ss, action, JSON.stringify(payload).substring(0, 300));
    
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

/**
 * Format JSON Response dengan Header CORS Lengkap
 */
function createJsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Otomatis Membuat Semua Sheet & Header Jika Belum Tersedia
 */
function initAllSheets(ss) {
  // 1. Transaksi
  getOrCreateSheet(ss, SHEET_TRANSAKSI, [
    "ID Transaksi", "Waktu", "Tipe Layanan", "Nama Pelanggan", "Tujuan / No Rek",
    "Nominal (Rp)", "Biaya Pelanggan (Rp)", "Biaya Admin (Rp)", "Keuntungan (Rp)",
    "Status", "ID Akun Kas", "No HP Pelanggan", "Catatan", "Nomor Referensi"
  ], "#003366");

  // 2. Akun Kas / Rekening
  getOrCreateSheet(ss, SHEET_AKUN_KAS, [
    "ID Akun", "Nama Akun", "Tipe Akun", "Saldo (Rp)", "Nomor Rekening", "Nama Bank"
  ], "#0055A5");

  // 3. Mutasi Kas
  getOrCreateSheet(ss, SHEET_MUTASI_KAS, [
    "ID Mutasi", "Waktu", "ID Akun Asal", "ID Akun Tujuan", "Jenis Mutasi",
    "Jumlah (Rp)", "Margin/Biaya (Rp)", "Keterangan", "ID Trx Terkait"
  ], "#0E7490");

  // 4. Produk Kasir Fisik
  getOrCreateSheet(ss, SHEET_PRODUK, [
    "ID Produk", "Nama Produk", "Harga Jual (Rp)", "Stok", "Kategori", "Barcode"
  ], "#059669");

  // 5. Pengguna (Admin & Kasir)
  getOrCreateSheet(ss, SHEET_PENGGUNA, [
    "ID User", "Username", "Nama Lengkap", "Password", "Role", "Status", "No HP", "Tanggal Dibuat", "Catatan", "Terakhir Login"
  ], "#B45309");

  // 6. Profil Agen
  getOrCreateSheet(ss, SHEET_PROFIL, [
    "Kunci Parameter", "Nilai", "Keterangan"
  ], "#D97706");

  // 7. Setting Printer
  getOrCreateSheet(ss, SHEET_SETTING_PRINTER, [
    "Kunci Konfigurasi", "Nilai", "Keterangan"
  ], "#7C3AED");

  // 8. Log Aktivitas
  getOrCreateSheet(ss, SHEET_LOG, [
    "Timestamp", "Aksi", "Payload Cuplikan"
  ], "#475569");
}

function getOrCreateSheet(ss, sheetName, headers, headerColor) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground(headerColor || "#003366");
    headerRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Mengambil Semua Data Aplikasi dari Spreadsheet
 */
function fetchAllAppData(ss) {
  return {
    transactions: readSheetTransactions(ss),
    accounts: readSheetAccounts(ss),
    mutations: readSheetMutations(ss),
    products: readSheetProducts(ss),
    users: readSheetUsers(ss),
    profile: readSheetProfile(ss),
    printerSettings: readSheetPrinterSettings(ss)
  };
}

function readSheetTransactions(ss) {
  var sheet = ss.getSheetByName(SHEET_TRANSAKSI);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).getValues();
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    result.push({
      id: String(r[0]),
      time: String(r[1]),
      type: String(r[2]),
      cust: String(r[3]),
      target: String(r[4]),
      nominal: Number(r[5]) || 0,
      feeCust: Number(r[6]) || 0,
      feeAdmin: Number(r[7]) || 0,
      status: String(r[9]) || "SUCCESS",
      accountId: String(r[10]),
      phoneCust: String(r[11] || ""),
      notes: String(r[12] || ""),
      refNumber: String(r[13] || "")
    });
  }
  return result;
}

function readSheetAccounts(ss) {
  var sheet = ss.getSheetByName(SHEET_AKUN_KAS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    result.push({
      id: String(r[0]),
      name: String(r[1]),
      type: String(r[2]),
      balance: Number(r[3]) || 0,
      accountNumber: String(r[4] || ""),
      bankName: String(r[5] || "")
    });
  }
  return result;
}

function readSheetMutations(ss) {
  var sheet = ss.getSheetByName(SHEET_MUTASI_KAS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    result.push({
      id: String(r[0]),
      time: String(r[1]),
      accountId: String(r[2]),
      toAccountId: r[3] ? String(r[3]) : undefined,
      type: String(r[4]),
      amount: Number(r[5]) || 0,
      feeMargin: Number(r[6]) || 0,
      description: String(r[7] || ""),
      relatedTrxId: r[8] ? String(r[8]) : undefined
    });
  }
  return result;
}

function readSheetProducts(ss) {
  var sheet = ss.getSheetByName(SHEET_PRODUK);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    result.push({
      id: String(r[0]),
      name: String(r[1]),
      price: Number(r[2]) || 0,
      stock: Number(r[3]) || 0,
      category: String(r[4] || "Pulsa/Paket"),
      barcode: String(r[5] || "")
    });
  }
  return result;
}

function readSheetUsers(ss) {
  var sheet = ss.getSheetByName(SHEET_PENGGUNA);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    result.push({
      id: String(r[0]),
      username: String(r[1] || ""),
      name: String(r[2] || ""),
      password: String(r[3] || ""),
      role: String(r[4] || "Kasir"),
      status: String(r[5] || "ACTIVE"),
      phone: String(r[6] || ""),
      createdAt: String(r[7] || ""),
      notes: String(r[8] || ""),
      lastLogin: String(r[9] || "")
    });
  }
  return result;
}

function readSheetProfile(ss) {
  var sheet = ss.getSheetByName(SHEET_PROFIL);
  if (!sheet || sheet.getLastRow() <= 1) return null;
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  var map = {};
  for (var i = 0; i < rows.length; i++) {
    var k = String(rows[i][0]).trim();
    if (k) map[k] = rows[i][1];
  }
  if (!map.storeName) return null;
  return {
    storeName: map.storeName || "AGEN BRILINK RESMI",
    ownerName: map.ownerName || "Budi Santoso",
    phone: map.phone || "0812-3456-7890",
    idAgent: map.idAgent || "BRI-8839-2024",
    address: map.address || "Jl. Raya Ahmad Yani No. 45, Surabaya",
    receiptHeader: map.receiptHeader || "Melayani Tarik Tunai, Transfer & Pembayaran",
    receiptFooter: map.receiptFooter || "Terima kasih atas kepercayaan Anda bertransaksi di Agen BRILink kami.",
    logoUrl: map.logoUrl || null,
    paperWidth: map.paperWidth || "58mm"
  };
}

function readSheetPrinterSettings(ss) {
  var sheet = ss.getSheetByName(SHEET_SETTING_PRINTER);
  if (!sheet || sheet.getLastRow() <= 1) return null;
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  var map = {};
  for (var i = 0; i < rows.length; i++) {
    var k = String(rows[i][0]).trim();
    if (k) map[k] = rows[i][1];
  }
  if (!map.connectionType) return null;
  return {
    connectionType: map.connectionType || "browser",
    paperWidth: map.paperWidth || "58mm",
    autoPrintOnSuccess: map.autoPrintOnSuccess === "true" || map.autoPrintOnSuccess === true,
    printCopies: Number(map.printCopies) === 2 ? 2 : 1,
    autoCut: map.autoCut === "true" || map.autoCut === true,
    showLogo: map.showLogo === "true" || map.showLogo === true,
    showIdAgent: map.showIdAgent === "true" || map.showIdAgent === true,
    showRefNumber: map.showRefNumber === "true" || map.showRefNumber === true,
    showNotes: map.showNotes === "true" || map.showNotes === true,
    showFooter: map.showFooter === "true" || map.showFooter === true,
    customFooterNote: map.customFooterNote || "Simpan struk ini sebagai bukti pembayaran sah.",
    bluetoothDeviceName: map.bluetoothDeviceName || null,
    serialPortName: map.serialPortName || null,
    printerDensity: map.printerDensity || "normal"
  };
}

/**
 * Penyimpanan Data Transaksi
 */
function saveOrUpdateTransaction(ss, trx) {
  if (!trx || !trx.id) return null;
  var sheet = ss.getSheetByName(SHEET_TRANSAKSI);
  var profit = (Number(trx.feeCust) || 0) - (Number(trx.feeAdmin) || 0);
  var rowData = [
    trx.id,
    trx.time || new Date().toLocaleString("id-ID"),
    trx.type || "TRANSFER",
    trx.cust || "-",
    trx.target || "-",
    Number(trx.nominal) || 0,
    Number(trx.feeCust) || 0,
    Number(trx.feeAdmin) || 0,
    profit,
    trx.status || "SUCCESS",
    trx.accountId || "acc1",
    trx.phoneCust || "",
    trx.notes || "",
    trx.refNumber || ""
  ];

  var lastRow = sheet.getLastRow();
  var foundRow = -1;
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(trx.id)) {
        foundRow = i + 2;
        break;
      }
    }
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return trx;
}

function voidTransaction(ss, trxId) {
  var sheet = ss.getSheetByName(SHEET_TRANSAKSI);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return null;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(trxId)) {
      sheet.getRange(i + 2, 10).setValue("VOID");
      return { id: trxId, status: "VOID" };
    }
  }
  return null;
}

function saveMutation(ss, mut) {
  if (!mut || !mut.id) return null;
  var sheet = ss.getSheetByName(SHEET_MUTASI_KAS);
  var rowData = [
    mut.id,
    mut.time || new Date().toLocaleString("id-ID"),
    mut.accountId,
    mut.toAccountId || "",
    mut.type,
    Number(mut.amount) || 0,
    Number(mut.feeMargin) || 0,
    mut.description || "",
    mut.relatedTrxId || ""
  ];
  sheet.appendRow(rowData);
  return mut;
}

function saveOrUpdateAccount(ss, acc) {
  if (!acc || !acc.id) return null;
  var sheet = ss.getSheetByName(SHEET_AKUN_KAS);
  var rowData = [
    acc.id,
    acc.name,
    acc.type || "Bank",
    Number(acc.balance) || 0,
    acc.accountNumber || "",
    acc.bankName || ""
  ];
  var lastRow = sheet.getLastRow();
  var foundRow = -1;
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(acc.id)) {
        foundRow = i + 2;
        break;
      }
    }
  }
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return acc;
}

function deleteAccount(ss, accId) {
  var sheet = ss.getSheetByName(SHEET_AKUN_KAS);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return accId;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(accId)) {
      sheet.deleteRow(i + 2);
      break;
    }
  }
  return accId;
}

function saveOrUpdateProduct(ss, prod) {
  if (!prod || !prod.id) return null;
  var sheet = ss.getSheetByName(SHEET_PRODUK);
  var rowData = [
    prod.id,
    prod.name,
    Number(prod.price) || 0,
    Number(prod.stock) || 0,
    prod.category || "Umum",
    prod.barcode || ""
  ];
  var lastRow = sheet.getLastRow();
  var foundRow = -1;
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(prod.id)) {
        foundRow = i + 2;
        break;
      }
    }
  }
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return prod;
}

function saveProfile(ss, prof) {
  if (!prof) return null;
  var sheet = ss.getSheetByName(SHEET_PROFIL);
  sheet.clearContents();
  sheet.appendRow(["Kunci Parameter", "Nilai", "Keterangan"]);
  var headerRange = sheet.getRange(1, 1, 1, 3);
  headerRange.setFontWeight("bold").setBackground("#D97706").setFontColor("#FFFFFF");
  
  var rows = [
    ["storeName", prof.storeName || "", "Nama Toko / Outlet"],
    ["ownerName", prof.ownerName || "", "Nama Pemilik / Agen"],
    ["phone", prof.phone || "", "No WhatsApp / Telepon"],
    ["idAgent", prof.idAgent || "", "ID Resmi Agen BRILink"],
    ["address", prof.address || "", "Alamat Lengkap Outlet"],
    ["receiptHeader", prof.receiptHeader || "", "Teks Header Struk"],
    ["receiptFooter", prof.receiptFooter || "", "Teks Footer Struk"],
    ["logoUrl", prof.logoUrl || "", "Link URL Gambar Logo"],
    ["paperWidth", prof.paperWidth || "58mm", "Ukuran Kertas Thermal"]
  ];
  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  return prof;
}

function savePrinterSettings(ss, ps) {
  if (!ps) return null;
  var sheet = ss.getSheetByName(SHEET_SETTING_PRINTER);
  sheet.clearContents();
  sheet.appendRow(["Kunci Konfigurasi", "Nilai", "Keterangan"]);
  var headerRange = sheet.getRange(1, 1, 1, 3);
  headerRange.setFontWeight("bold").setBackground("#7C3AED").setFontColor("#FFFFFF");

  var rows = [
    ["connectionType", ps.connectionType || "browser", "Jalur Cetak (browser/bluetooth/serial/rawbt)"],
    ["paperWidth", ps.paperWidth || "58mm", "Lebar Kertas Thermal"],
    ["autoPrintOnSuccess", String(ps.autoPrintOnSuccess || false), "Auto Cetak Saat Berhasil"],
    ["printCopies", String(ps.printCopies || 1), "Jumlah Rangkap Cetak (1/2)"],
    ["autoCut", String(ps.autoCut || false), "Kirim Sinyal Potong Otomatis"],
    ["showLogo", String(ps.showLogo !== false), "Tampilkan Logo"],
    ["showIdAgent", String(ps.showIdAgent !== false), "Tampilkan ID Agen"],
    ["showRefNumber", String(ps.showRefNumber !== false), "Tampilkan No Ref"],
    ["showNotes", String(ps.showNotes !== false), "Tampilkan Catatan"],
    ["showFooter", String(ps.showFooter !== false), "Tampilkan Footer"],
    ["customFooterNote", ps.customFooterNote || "", "Catatan Kustom Footer"],
    ["bluetoothDeviceName", ps.bluetoothDeviceName || "", "Nama Perangkat Bluetooth Terakhir"],
    ["serialPortName", ps.serialPortName || "", "Nama Port Serial Terakhir"],
    ["printerDensity", ps.printerDensity || "normal", "Ketebalan Cetak (normal/dark)"]
  ];
  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  return ps;
}

function saveAllTransactions(ss, list) {
  if (!list || !Array.isArray(list)) return;
  var sheet = ss.getSheetByName(SHEET_TRANSAKSI);
  sheet.clearContents();
  sheet.appendRow([
    "ID Transaksi", "Waktu", "Tipe Layanan", "Nama Pelanggan", "Tujuan / No Rek",
    "Nominal (Rp)", "Biaya Pelanggan (Rp)", "Biaya Admin (Rp)", "Keuntungan (Rp)",
    "Status", "ID Akun Kas", "No HP Pelanggan", "Catatan", "Nomor Referensi"
  ]);
  var headerRange = sheet.getRange(1, 1, 1, 14);
  headerRange.setFontWeight("bold").setBackground("#003366").setFontColor("#FFFFFF");

  if (list.length === 0) return;
  var rows = [];
  for (var i = 0; i < list.length; i++) {
    var t = list[i];
    var p = (Number(t.feeCust) || 0) - (Number(t.feeAdmin) || 0);
    rows.push([
      t.id, t.time, t.type, t.cust, t.target,
      Number(t.nominal) || 0, Number(t.feeCust) || 0, Number(t.feeAdmin) || 0, p,
      t.status || "SUCCESS", t.accountId, t.phoneCust || "", t.notes || "", t.refNumber || ""
    ]);
  }
  sheet.getRange(2, 1, rows.length, 14).setValues(rows);
}

function saveAllAccounts(ss, list) {
  if (!list || !Array.isArray(list)) return;
  var sheet = ss.getSheetByName(SHEET_AKUN_KAS);
  sheet.clearContents();
  sheet.appendRow(["ID Akun", "Nama Akun", "Tipe Akun", "Saldo (Rp)", "Nomor Rekening", "Nama Bank"]);
  var headerRange = sheet.getRange(1, 1, 1, 6);
  headerRange.setFontWeight("bold").setBackground("#0055A5").setFontColor("#FFFFFF");

  if (list.length === 0) return;
  var rows = [];
  for (var i = 0; i < list.length; i++) {
    var a = list[i];
    rows.push([a.id, a.name, a.type, Number(a.balance) || 0, a.accountNumber || "", a.bankName || ""]);
  }
  sheet.getRange(2, 1, rows.length, 6).setValues(rows);
}

function saveAllMutations(ss, list) {
  if (!list || !Array.isArray(list)) return;
  var sheet = ss.getSheetByName(SHEET_MUTASI_KAS);
  sheet.clearContents();
  sheet.appendRow(["ID Mutasi", "Waktu", "ID Akun Asal", "ID Akun Tujuan", "Jenis Mutasi", "Jumlah (Rp)", "Margin/Biaya (Rp)", "Keterangan", "ID Trx Terkait"]);
  var headerRange = sheet.getRange(1, 1, 1, 9);
  headerRange.setFontWeight("bold").setBackground("#0E7490").setFontColor("#FFFFFF");

  if (list.length === 0) return;
  var rows = [];
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    rows.push([m.id, m.time, m.accountId, m.toAccountId || "", m.type, Number(m.amount) || 0, Number(m.feeMargin) || 0, m.description || "", m.relatedTrxId || ""]);
  }
  sheet.getRange(2, 1, rows.length, 9).setValues(rows);
}

function saveAllProducts(ss, list) {
  if (!list || !Array.isArray(list)) return;
  var sheet = ss.getSheetByName(SHEET_PRODUK);
  sheet.clearContents();
  sheet.appendRow(["ID Produk", "Nama Produk", "Harga Jual (Rp)", "Stok", "Kategori", "Barcode"]);
  var headerRange = sheet.getRange(1, 1, 1, 6);
  headerRange.setFontWeight("bold").setBackground("#059669").setFontColor("#FFFFFF");

  if (list.length === 0) return;
  var rows = [];
  for (var i = 0; i < list.length; i++) {
    var p = list[i];
    rows.push([p.id, p.name, Number(p.price) || 0, Number(p.stock) || 0, p.category || "Umum", p.barcode || ""]);
  }
  sheet.getRange(2, 1, rows.length, 6).setValues(rows);
}

function saveOrUpdateUser(ss, user) {
  if (!user || !user.id) return null;
  var sheet = ss.getSheetByName(SHEET_PENGGUNA);
  var rowData = [
    user.id,
    user.username || "",
    user.name || "",
    user.password || "",
    user.role || "Kasir",
    user.status || "ACTIVE",
    user.phone || "",
    user.createdAt || new Date().toISOString(),
    user.notes || "",
    user.lastLogin || ""
  ];
  var lastRow = sheet.getLastRow();
  var foundRow = -1;
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(user.id)) {
        foundRow = i + 2;
        break;
      }
    }
  }
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return user;
}

function deleteUser(ss, userId) {
  if (!userId) return null;
  var sheet = ss.getSheetByName(SHEET_PENGGUNA);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return userId;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(userId)) {
      sheet.deleteRow(i + 2);
      break;
    }
  }
  return userId;
}

function saveAllUsers(ss, list) {
  if (!list || !Array.isArray(list)) return;
  var sheet = ss.getSheetByName(SHEET_PENGGUNA);
  sheet.clearContents();
  sheet.appendRow([
    "ID User", "Username", "Nama Lengkap", "Password", "Role", "Status", "No HP", "Tanggal Dibuat", "Catatan", "Terakhir Login"
  ]);
  var headerRange = sheet.getRange(1, 1, 1, 10);
  headerRange.setFontWeight("bold").setBackground("#B45309").setFontColor("#FFFFFF");

  if (list.length === 0) return;
  var rows = [];
  for (var i = 0; i < list.length; i++) {
    var u = list[i];
    rows.push([
      u.id, u.username || "", u.name || "", u.password || "", u.role || "Kasir",
      u.status || "ACTIVE", u.phone || "", u.createdAt || "", u.notes || "", u.lastLogin || ""
    ]);
  }
  sheet.getRange(2, 1, rows.length, 10).setValues(rows);
}

function logActivity(ss, action, preview) {
  try {
    var sheet = ss.getSheetByName(SHEET_LOG);
    if (!sheet) return;
    sheet.appendRow([new Date().toISOString(), action, preview]);
    // Batasi log maksimal 1000 baris agar tetap ringan
    if (sheet.getLastRow() > 1050) {
      sheet.deleteRows(2, 100);
    }
  } catch (e) {}
}
`;
