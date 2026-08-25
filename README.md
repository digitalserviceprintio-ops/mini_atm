# 📗 Panduan Lengkap Integrasi Database Google Spreadsheet & Google Apps Script (Code.gs)

Panduan praktis langkah demi langkah untuk menghubungkan **Aplikasi Pencatatan Transaksi Agen Mini ATM & BRILink** ke **Google Spreadsheet** menggunakan **Google Apps Script (`Code.gs`)** sebagai backend database relasional.

---

## 🌟 Keunggulan Menggunakan Google Sheets & GAS

1. **Gratis 100% Selamanya:** Menggunakan infrastruktur Google Cloud & Google Drive pribadi Anda tanpa biaya langganan database bulanan.
2. **Multi-User & Real-time:** Seluruh kasir di cabang berbeda dapat mencatat transaksi dan data langsung terpusat ke 1 Google Spreadsheet.
3. **Data Aman & Milik Sendiri:** Anda memiliki kontrol penuh atas spreadsheet Anda, bisa di-backup, diedit manual jika perlu, atau diekspor ke format apa pun kapan saja.
4. **Auto-Ledger (Buku Besar Otomatis):** Perubahan saldo kas, saldo rekening bank (BRI, BCA, Mandiri), dan mutasi debit-kredit tercatat otomatis.

---

## 🚀 Langkah 1: Buat Google Spreadsheet Baru

1. Buka peramban (browser) dan akses [Google Sheets](https://sheets.new) atau buka Google Drive Anda.
2. Beri nama Spreadsheet, misalnya: **`Database Transaksi Agen Bank & Mini ATM`**.
3. Biarkan spreadsheet dalam keadaan kosong (sistem akan membuat seluruh tabel dan header otomatis).

---

## 💻 Langkah 2: Buka Editor Google Apps Script

1. Pada Google Spreadsheet yang baru dibuat, klik menu atas: **Ekstensi** > **Apps Script** (*Extensions > Apps Script*).
2. Anda akan diarahkan ke editor kode Google Apps Script.
3. Beri nama proyek Apps Script Anda, misalnya: **`Backend Agen Bank App`**.

---

## 📝 Langkah 3: Salin File `Code.gs`

1. Di panel kiri editor Apps Script, klik file `Code.gs` (atau buat file baru jika belum ada).
2. Hapus seluruh isi kode bawaan (`function myFunction() { ... }`).
3. Buka file [`Code.gs`](file:///c:/Users/user/.gemini/antigravity-ide/scratch/agen-bank-app/Code.gs) yang ada di folder aplikasi ini, **Salin (Copy)** seluruh isinya, lalu **Tempel (Paste)** ke dalam editor `Code.gs` di Apps Script.
4. Klik tombol **Simpan Proyek** (ikon disket atau `Ctrl + S`).

> [!TIP]
> Jika skrip dibuat langsung dari menu *Ekstensi > Apps Script* di Google Sheets Anda, konstanta `SPREADSHEET_ID = ''` dapat dibiarkan kosong karena otomatis mendeteksi spreadsheet aktif.

---

## 🌐 Langkah 4: Terapkan Sebagai Aplikasi Web (Deploy as Web App)

1. Di pojok kanan atas editor Apps Script, klik tombol biru **Terapkan** > **Penerapan baru** (*Deploy > New deployment*).
2. Pada jendela yang muncul, klik ikon roda gigi ⚙️ di samping *Pilih jenis* dan pilih **Aplikasi web** (*Web app*).
3. Isi konfigurasi sebagai berikut:
   - **Deskripsi:** `Produksi v1.0`
   - **Jalankan sebagai (Execute as):** `Saya (emailanda@gmail.com)` *(Me)*
   - **Siapa yang memiliki akses (Who has access):** **`Siapa saja (Anyone)`** *(PENTING agar aplikasi frontend dapat mengirim transaksi)*
4. Klik tombol **Terapkan (Deploy)**.
5. Google akan meminta otorisasi izin akses pertama kali:
   - Klik **Tinjau Izin (Review Permissions)**.
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced** > **Go to Backend Agen Bank App (unsafe)**.
   - Klik **Allow (Izinkan)**.
6. Salin **URL Aplikasi Web** yang berakhiran `/exec` (Contoh: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 🔗 Langkah 5: Hubungkan ke Aplikasi Agen Bank

1. Buka aplikasi web Agen Bank di browser Anda ([index.html](file:///c:/Users/user/.gemini/antigravity-ide/scratch/agen-bank-app/index.html)).
2. Klik tombol **`Google Sheets` / `Mode Lokal`** di topbar atas, atau buka menu sidebar **Pengaturan Owner > Database & GAS**.
3. Tempelkan URL Web App yang telah disalin ke kolom **URL Endpoint Google Apps Script Web App**.
4. Klik tombol **`Simpan & Hubungkan`**.
5. Klik tombol **`Inisialisasi Database`** untuk membuat 7 lembar sheet secara otomatis di Google Spreadsheet Anda:
   - 📑 `Accounts`
   - 📑 `Transactions`
   - 📑 `Mutasi`
   - 📑 `Products`
   - 📑 `StockAudit`
   - 📑 `Branches`
   - 📑 `Settings`
6. Selesai! Indikator di topbar akan berubah menjadi **🟢 Google Sheets ✓**, menandakan seluruh transaksi kini tersimpan real-time di database spreadsheet Anda.

---

## 📊 Skema 7 Tabel Database di Google Spreadsheet

| Nama Sheet | Deskripsi | Kolom Utama |
| :--- | :--- | :--- |
| **`Accounts`** | Master rekening kas tunai, brankas, bank BRI, BCA, Mandiri, dan E-Wallet. | `id`, `name`, `type`, `number`, `balance`, `isCash`, `status`, `updatedAt` |
| **`Transactions`** | Rekam jejak transaksi Tarik Tunai, Setor Tunai, Transfer Bank, dan Pembayaran PPOB. | `id`, `time`, `timestamp`, `type`, `nasabah`, `tujuan`, `nominal`, `customerFee`, `adminFee`, `profit`, `accountId`, `status`, `branch`, `cashier`, `note` |
| **`Mutasi`** | Buku besar pencatatan arus uang keluar (kredit) dan masuk (debit) multi-rekening ganda. | `id`, `time`, `accountId`, `accountName`, `category`, `refId`, `debit`, `kredit`, `balanceAfter` |
| **`Products`** | Katalog stok barang POS (Pulsa, Token PLN, Aksesoris HP, Voucher Game, Kartu Perdana). | `id`, `code`, `name`, `category`, `cost`, `price`, `stock`, `updatedAt` |
| **`StockAudit`** | Audit trail keluar-masuk stok barang akibat penjualan POS, restock barang, dan koreksi stok. | `id`, `time`, `productName`, `type`, `delta`, `stockAfter`, `operator`, `note` |
| **`Branches`** | Data multi-cabang outlet operasional agen. | `id`, `name`, `address`, `phone`, `status` |
| **`Settings`** | Parameter biaya default dan identitas tenant agen. | `key`, `value`, `description`, `updatedAt` |

---

## 🛠️ Tanya Jawab & Troubleshooting

### Q: Apa yang terjadi jika koneksi internet terputus saat transaksi?
A: Aplikasi dilengkapi sistem *offline-first cache*. Transaksi tetap dicatat dan tersimpan di penyimpanan lokal browser, dan saldo langsung dihitung. Saat koneksi online kembali, Anda dapat menekan tombol **"Sinkronkan Sekarang"**.

### Q: Bagaimana cara memperbarui kode backend jika ada perubahan?
A: Buka editor Apps Script Anda, perbarui kodenya, lalu klik **Deploy > Manage deployments > Edit (ikon pensil) > Version: New version > Deploy**.
