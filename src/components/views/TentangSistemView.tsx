import React, { useState } from 'react';
import {
  Info,
  Code2,
  ShieldAlert,
  BookOpen,
  HelpCircle,
  Sparkles,
  Layers,
  Printer,
  CreditCard,
  ShoppingCart,
  Users,
  Database,
  FileSpreadsheet,
  Wallet,
  Package,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Terminal,
  Cpu,
  Globe,
  Award,
  BookmarkCheck,
  ShieldCheck,
  Zap,
  Clock,
  Send,
} from 'lucide-react';
import { AgentProfile, UserRole } from '../../types';
import { useAppVersion } from '../../utils/versionManager';
import { AuthUser } from './LoginView';

interface TentangSistemViewProps {
  profile: AgentProfile;
  currentUser?: AuthUser | null;
  currentRole: UserRole;
  onNavigateTab: (tab: any) => void;
}

type SubSection = 'overview' | 'panduan' | 'kebijakan' | 'arsitektur' | 'developer';

interface GuideItem {
  id: string;
  category: 'MINI_ATM' | 'POS' | 'MEMBER' | 'STOK' | 'KEUANGAN' | 'MULTIUSER' | 'PRINTER' | 'SHEETS' | 'BACKUP';
  categoryLabel: string;
  categoryIcon: any;
  title: string;
  summary: string;
  steps: string[];
  tips?: string[];
  warning?: string;
  badge?: string;
}

const GUIDE_DATA: GuideItem[] = [
  {
    id: 'guide-mini-atm',
    category: 'MINI_ATM',
    categoryLabel: 'Mini ATM & Perbankan',
    categoryIcon: CreditCard,
    title: 'Panduan Operasional Transaksi Mini ATM',
    summary: 'Prosedur lengkap melayani Tarik Tunai, Setor Tunai, Transfer Antar Bank, dan Pembayaran Tagihan.',
    steps: [
      'Buka menu "Daftar Transaksi Agen" atau klik tombol "Transaksi Baru" di bagian atas.',
      'Pilih Tipe Transaksi yang diinginkan: Tarik Tunai, Setor Tunai, Transfer, atau Pembayaran.',
      'Pilih Rekening Kas / Bank yang digunakan untuk memproses transaksi (misal: EDC BRI, BCA, Kas Tunai Laci).',
      'Masukkan Nama Pelanggan dan Nomor Target (Nomor Rekening Tujuan, No. Rekening Pelanggan, atau No. Pelanggan PLN/Tagihan).',
      'Input Nominal Transaksi dasar yang ingin diproses.',
      'Sistem akan otomatis menghitung Biaya Pelanggan (Fee Cust) dan Biaya Admin Bank (Fee Bank) sesuai aturan yang berlaku, serta menampilkan estimasi Laba Bersih yang didapatkan agen.',
      'Jika pelanggan merupakan Member Terdaftar, pilih nama member untuk memberikan +1 Poin loyalitas secara otomatis atau menukarkan poin potongan harga.',
      'Klik tombol "Simpan & Proses Transaksi". Data langsung tersimpan, saldo kas/rekening terpotong atau bertambah secara real-time, dan jendela struk thermal siap dicetak.',
    ],
    tips: [
      'Gunakan fitur Pencarian Pelanggan Otomatis (Auto-fill) untuk mempercepat pengisian nama pelanggan langganan.',
      'Setelah transaksi berhasil, Anda dapat mencetak struk thermal ke printer Bluetooth atau mengirimkan tanda bukti via WhatsApp.',
    ],
    warning: 'Selalu pastikan saldo rekening bank Anda dan uang fisik dari pelanggan telah dihitung dengan tepat sebelum mengklik tombol Simpan.',
    badge: 'Fitur Utama',
  },
  {
    id: 'guide-pos-kasir',
    category: 'POS',
    categoryLabel: 'Kasir Ritel POS',
    categoryIcon: ShoppingCart,
    title: 'Panduan Transaksi Penjualan Barang Fisik (POS)',
    summary: 'Cara menggunakan mesin kasir ritel untuk menjual produk toko, scan barcode, diskon, dan pembayaran multi-metode.',
    steps: [
      'Masuk ke menu "Kasir POS (Jual Barang)".',
      'Pilih produk dengan mengklik kartu barang pada katalog atau ketik nama/kategori pada kolom pencarian.',
      'Untuk pengguna Barcode Scanner: Sorot kursor ke kolom scan barcode atau klik ikon kamera untuk memindai barcode fisik produk.',
      'Atur kuantitas (Qty) barang di keranjang belanja. Klik tombol (+) atau (-) sesuai pesanan pembeli.',
      'Jika memberikan potongan harga, klik tombol Diskon pada item untuk memberikan potongan Persentase (%) atau Nominal (Rp), atau diskon global pada keranjang.',
      'Jika pembeli merupakan Member VIP, pilih akun Member untuk mengumpulkan poin belanja atau gunakan Voucher Diskon yang telah diklaim pembeli.',
      'Pilih Metode Pembayaran: Tunai (Cash), QRIS / E-Wallet, atau Transfer Bank.',
      'Masukkan jumlah Nominal Uang Diterima. Sistem akan otomatis menghitung uang kembalian secara presisi.',
      'Klik tombol "Proses Pembayaran & Cetak Struk". Stok barang akan berkurang secara otomatis dan laba penjualan langsung masuk ke laporan.',
    ],
    tips: [
      'Gunakan tombol pintas nominal cepat uang pas (Rp 10.000, Rp 20.000, Rp 50.000, Rp 100.000) untuk mempercepat proses kasir.',
    ],
    warning: 'Jika stok produk habis (0), item tidak dapat ditambahkan ke keranjang hingga dilakukan Restock pada menu Stok Barang.',
    badge: 'POS Ritel',
  },
  {
    id: 'guide-member-loyalty',
    category: 'MEMBER',
    categoryLabel: 'Member & Kartu VIP',
    categoryIcon: Users,
    title: 'Panduan Manajemen Member & Program Loyalitas Poin',
    summary: 'Membangun loyalitas pelanggan dengan kartu member digital, akumulasi poin transaksi, tiering status, dan hadiah voucher.',
    steps: [
      'Buka menu "Member & Kartu VIP".',
      'Klik tombol "+ Tambah Member Baru" untuk mendaftarkan pelanggan dengan mengisi Nama, Nomor WhatsApp, dan Alamat.',
      'Sistem akan otomatis menerbitkan Nomor Kartu Member VIP 16 digit dan Barcode unik untuk pelanggan tersebut.',
      'Setiap kali member bertransaksi di Mini ATM atau belanja di Kasir POS, sistem otomatis menambahkan +1 Poin atau sesuai konfigurasi poin.',
      'Tingkatan Tier Member (Bronze, Silver, Gold, Platinum) akan naik secara otomatis berdasarkan akumulasi poin pelanggan.',
      'Untuk mencetak kartu member fisik/digital: Klik ikon Kartu pada data member, lalu pilih "Cetak Kartu Member (Depan / Belakang)". Kartu siap dicetak dalam format elegan.',
      'Pelanggan dapat menukarkan poin dengan hadiah barang atau voucher potongan diskon belanja melalui tab "Katalog Hadiah & Poin".',
    ],
    tips: [
      'Tunjukkan barcode pada kartu digital member kepada kasir saat berbelanja agar kasir dapat memindai kartu pelanggan secara cepat.',
    ],
    badge: 'Loyalitas',
  },
  {
    id: 'guide-stok-barang',
    category: 'STOK',
    categoryLabel: 'Inventori & Stok',
    categoryIcon: Package,
    title: 'Panduan Manajemen Inventori & Penyesuaian Stok',
    summary: 'Mengelola katalog produk barang dagangan, restock barang masuk, serta audit koreksi stok rusak atau hilang.',
    steps: [
      'Buka menu "Stok Barang Fisik".',
      'Klik tombol "+ Tambah Produk Baru" untuk menambahkan barang baru beserta Barcode, Kategori, Harga Modal (Beli/HPP), Harga Jual Kasir, dan Stok Awal.',
      'Untuk menambah stok barang yang baru datang dari supplier: Klik tombol "Restock" pada produk terkait, masukkan jumlah unit yang masuk, dan simpan.',
      'Untuk mencatat barang rusak, hilang, atau kedaluwarsa: Klik tombol "Penyesuaian (Koreksi)", pilih tipe penyesuaian, dan cantumkan alasan audit.',
      'Setiap riwayat perubahan stok tercatat secara transparan pada tab "Riwayat Log Penyesuaian Stok".',
      'Sistem akan memunculkan lencana "Stok Menipis" jika sisa barang berada di bawah batas minimum stok yang telah ditentukan.',
    ],
    warning: 'Pastikan Harga Modal (HPP) diisi dengan tepat agar perhitungan laba kotor dan laba bersih di Laporan Penjualan POS akurat.',
    badge: 'Inventori',
  },
  {
    id: 'guide-keuangan-mutasi',
    category: 'KEUANGAN',
    categoryLabel: 'Arus Kas & Rekening',
    categoryIcon: Wallet,
    title: 'Panduan Pengelolaan Rekening Kas & Arus Kas',
    summary: 'Mencatat saldo awal, mutasi internal antar rekening agen, operasional toko, dan audit mutasi kas.',
    steps: [
      'Buka menu "Akun Kas / Rekening" (Khusus Admin/Owner).',
      'Buat rekening penampung sesuai perangkat operasional toko: misal "Laci Kasir Fisik", "EDC BRI", "BCA Mobile", "E-Wallet Dana", dll.',
      'Tentukan saldo awal masing-masing rekening.',
      'Buka menu "Arus Kas & Mutasi" untuk mencatat pengeluaran operasional (seperti beli bensin, kertas struk, token listrik toko) atau pemasukan di luar transaksi kasir.',
      'Gunakan fitur "Transfer Internal Antar Rekening" ketika Anda melakukan setor uang tunai dari laci kasir ke rekening bank agen atau sebaliknya.',
      'Lihat ringkasan total saldo gabungan untuk memantau likuiditas kas toko secara menyeluruh.',
    ],
    badge: 'Keuangan',
  },
  {
    id: 'guide-multiuser-isolation',
    category: 'MULTIUSER',
    categoryLabel: 'Multi-User & Isolasi DB',
    categoryIcon: Lock,
    title: 'Panduan Multi-User & Sistem Database Mandiri per Akun',
    summary: 'Penjelasan pemisahan peran wewenang serta arsitektur isolasi database lokal yang terpisah untuk tiap pengguna.',
    steps: [
      'Pendaftaran Akun: Pengguna baru dapat mendaftar mandiri melalui tab "Daftar Akun Baru" di halaman login, atau ditambahkan oleh Admin di menu "Akun Admin & Kasir".',
      'Perbedaan Peran (Role):',
      '   • Administrator (Owner): Memiliki akses penuh ke seluruh menu (Dashboard Analitik, Master Rekening, Arus Kas, Manajemen Pengguna, Backup Data, dan Google Sheets).',
      '   • Kasir (Operator Shift): Memiliki akses fokus operasional ke Transaksi Mini ATM, Kasir POS, Member Pelanggan, Stok Barang, Laporan Kasir, dan Setting Printer.',
      'Sistem Database Terisolasi: Setiap akun yang terdaftar otomatis dialokasikan partisi database mandiri. Transaksi dan saldo kasir A tidak akan bercampur atau dapat diubah oleh kasir B.',
      'Pergantian Sesi (Switch User): Pengguna dapat berpindah sesi akun dengan cepat melalui menu Akun Pengguna tanpa harus logout total.',
    ],
    tips: [
      'Gunakan kombinasi PIN/Password yang kuat untuk akun Owner/Admin guna menjaga kerahasiaan data finansial.',
    ],
    badge: 'Keamanan',
  },
  {
    id: 'guide-printer-thermal',
    category: 'PRINTER',
    categoryLabel: 'Printer Struk Thermal',
    categoryIcon: Printer,
    title: 'Panduan Konfigurasi & Cetak Printer Thermal',
    summary: 'Menghubungkan printer thermal kasir via Bluetooth, Serial USB, Dialog Browser, atau RawBT Android.',
    steps: [
      'Buka menu "Setting Printer Thermal".',
      'Pilih Mode Koneksi yang sesuai dengan perangkat keras Anda:',
      '   1. Dialog Browser (Default): Menggunakan dialog print bawaan Chrome/Edge/Firefox. Praktis tanpa setup driver khusus.',
      '   2. Bluetooth ESC/POS: Menghubungkan langsung ke printer thermal nirkabel via Web Bluetooth API di Chrome/Edge.',
      '   3. Web Serial USB: Menghubungkan via kabel USB / port COM serial langsung dari browser.',
      '   4. RawBT Android: Mengirimkan perintah cetak via protokol RawBT Service di smartphone Android.',
      'Pilih Ukuran Kertas Thermal yang digunakan: 58mm (mini) atau 80mm (standar lebar).',
      'Kustomisasi Konten Struk: Anda dapat mengaktifkan/menonaktifkan logo toko, ID agen, nomor referensi, dan menambahkan catatan kaki promosi.',
      'Klik tombol "Simpan Pengaturan" lalu klik "Test Cetak Struk Sampel" untuk memastikan hasil cetakan rapi dan jelas.',
    ],
    badge: 'Hardware',
  },
  {
    id: 'guide-google-sheets',
    category: 'SHEETS',
    categoryLabel: 'Google Spreadsheet Cloud',
    categoryIcon: FileSpreadsheet,
    title: 'Panduan Sinkronisasi Cloud dengan Google Spreadsheet',
    summary: 'Menghubungkan database lokal aplikasi dengan Google Sheets menggunakan Google Apps Script Web App.',
    steps: [
      'Buka menu "Database Spreadsheet" (Khusus Admin).',
      'Salin kode Google Apps Script yang telah disediakan pada template integrasi ke Google Spreadsheet Anda (Extensions -> Apps Script).',
      'Deploy Apps Script sebagai Web App dengan hak akses "Anyone" (Siapa Saja).',
      'Salin URL Web App yang dihasilkan (format: https://script.google.com/macros/s/.../exec) dan tempel ke kolom URL Google Apps Script di aplikasi.',
      'Klik tombol "Tes Koneksi Cloud" untuk memverifikasi endpoint terhubung dengan baik.',
      'Aktifkan opsi "Sinkronisasi Otomatis" agar setiap transaksi, penjualan POS, dan data member langsung ter-backup otomatis ke cloud Google Sheets Anda.',
    ],
    badge: 'Cloud Sync',
  },
  {
    id: 'guide-backup-restore',
    category: 'BACKUP',
    categoryLabel: 'Backup & Restore Data',
    categoryIcon: RotateCcw,
    title: 'Panduan Backup File & Pemulihan (Restore) Database',
    summary: 'Menjaga keamanan data dengan mencadangkan file JSON berkala serta cara memindahkan data ke perangkat baru.',
    steps: [
      'Buka menu "Backup & Reset Data" (Khusus Admin).',
      'Klik tombol "Download Backup Lengkap (.JSON)" untuk mengunduh seluruh transaksi, rekening, katalog barang, data member, dan pengaturan ke komputer/HP Anda.',
      'Simpan file backup tersebut di tempat aman (Google Drive, Flashdisk, atau email).',
      'Untuk memulihkan data di perangkat/browser baru: Buka menu Backup & Reset di perangkat baru, lalu unggah file .JSON backup Anda.',
      'Sistem akan memvalidasi struktur data dan memulihkan seluruh catatan transaksi dengan utuh.',
    ],
    warning: 'Sangat disarankan melakukan Backup file .JSON minimal satu minggu sekali atau sebelum melakukan pembersihan browser.',
    badge: 'Cadangan',
  },
];

export const TentangSistemView: React.FC<TentangSistemViewProps> = ({
  profile,
  currentUser,
  currentRole,
  onNavigateTab,
}) => {
  const { version, enterpriseVersion } = useAppVersion();
  const [activeSection, setActiveSection] = useState<SubSection>('overview');
  const [guideSearch, setGuideSearch] = useState<string>('');
  const [selectedGuideCategory, setSelectedGuideCategory] = useState<string>('ALL');
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>('guide-mini-atm');

  const filteredGuides = GUIDE_DATA.filter((g) => {
    const matchCategory = selectedGuideCategory === 'ALL' || g.category === selectedGuideCategory;
    const matchSearch =
      g.title.toLowerCase().includes(guideSearch.toLowerCase()) ||
      g.summary.toLowerCase().includes(guideSearch.toLowerCase()) ||
      g.steps.some((s) => s.toLowerCase().includes(guideSearch.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#003366] via-blue-900 to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-blue-800/60 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                <span>{enterpriseVersion}</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sistem Terverifikasi & Aktif</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Tentang Aplikasi & Panduan Sistem
            </h1>
            <p className="text-sm md:text-base text-blue-100/90 max-w-3xl leading-relaxed">
              Pusat informasi komprehensif Mini ATM & POS Kasir Ritel, panduan operasional langkah demi langkah, kebijakan keamanan, dan profil pengembang resmi.
            </p>
          </div>

          {/* Developer Badge Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shrink-0 flex items-center gap-3.5 shadow-lg">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200">
                Pengembang Resmi (Developer)
              </div>
              <div className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>microdata2r</span>
                <Award className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-[11px] text-blue-200 font-medium">Digital Architecture Pro</div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 pt-5 border-t border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'overview'
                ? 'bg-white text-blue-950 shadow-md scale-102'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Ringkasan Sistem</span>
          </button>

          <button
            onClick={() => setActiveSection('panduan')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'panduan'
                ? 'bg-white text-blue-950 shadow-md scale-102'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Panduan Penggunaan (Detail)</span>
            <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              {GUIDE_DATA.length} Modul
            </span>
          </button>

          <button
            onClick={() => setActiveSection('kebijakan')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'kebijakan'
                ? 'bg-white text-blue-950 shadow-md scale-102'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Warning & Kebijakan</span>
          </button>

          <button
            onClick={() => setActiveSection('developer')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'developer'
                ? 'bg-white text-blue-950 shadow-md scale-102'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4 text-sky-500" />
            <span>Developer: microdata2r</span>
          </button>

          <button
            onClick={() => setActiveSection('arsitektur')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'arsitektur'
                ? 'bg-white text-blue-950 shadow-md scale-102'
                : 'text-blue-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Arsitektur & Fitur Pro</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: OVERVIEW & RINGKASAN */}
      {/* ========================================================================= */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics / Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Layanan Inti</div>
                <div className="text-base font-bold text-slate-800">Mini ATM & Perbankan</div>
                <div className="text-[11px] text-slate-500 mt-1">Tarik, Setor, Transfer & PPOB</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Mesin Kasir Ritel</div>
                <div className="text-base font-bold text-slate-800">POS & Barcode Scanner</div>
                <div className="text-[11px] text-slate-500 mt-1">Katalog, Stok, Diskon & Multi Bayar</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Arsitektur Data</div>
                <div className="text-base font-bold text-slate-800">Isolated Multi-Tenant</div>
                <div className="text-[11px] text-slate-500 mt-1">Database mandiri tiap akun pengguna</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Cetak Struk Instan</div>
                <div className="text-base font-bold text-slate-800">Thermal Multi-Protocol</div>
                <div className="text-[11px] text-slate-500 mt-1">Bluetooth, Serial, RawBT & 58/80mm</div>
              </div>
            </div>
          </div>

          {/* System Identity Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Profil Sistem & Toko Terpasang
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  {profile.storeName}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Pemilik Toko: <span className="font-semibold text-slate-800">{profile.ownerName}</span> • ID Agen: <span className="font-mono font-bold text-blue-700">{profile.idAgent}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('profil-agen')}
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Edit Profil Toko
                </button>
                <button
                  onClick={() => onNavigateTab('setting-printer')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Setting Printer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <BookmarkCheck className="w-4 h-4 text-blue-600" />
                  <span>Deskripsi & Tujuan Sistem</span>
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Aplikasi ini dirancang khusus untuk mempermudah dan mengamankan seluruh aktivitas harian Agen Mini ATM, Agen Link Perbankan (Tarik Tunai, Setor Tunai, Transfer Antar Bank, Pembayaran), serta Toko Kelontong / Konter Ritel fisik dalam satu platform terpadu.
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Dilengkapi sistem akuntansi arus kas otomatis, pemantauan saldo mutasi rekening, program loyalitas member dengan kartu VIP digital ber-barcode, serta kemampuan bekerja secara offline-first dengan sinkronisasi cloud Google Spreadsheet.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Keunggulan Utama</span>
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Database Terisolasi Mandiri:</strong> Setiap akun pengguna memiliki database terpisah, mencegah transaksi tercampur antar operator.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Cetak Struk Multi-Koneksi:</strong> Mendukung printer thermal 58mm & 80mm via Web Bluetooth, Serial Port USB, dan dialog cetak.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Kamera Barcode Scanner:</strong> Pindai kode batang fisik barang atau kartu member langsung menggunakan kamera perangkat.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Integrasi Cloud Spreadsheet:</strong> Data dapat di-backup dan disinkronkan langsung ke Google Sheets pemilik toko.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Jalan Pintas Akses Modul Penting
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <button
                  onClick={() => onNavigateTab('transaksi')}
                  className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 rounded-xl text-center text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <span>Mini ATM</span>
                </button>
                <button
                  onClick={() => onNavigateTab('kasir-fisik')}
                  className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 rounded-xl text-center text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <span>Kasir POS</span>
                </button>
                <button
                  onClick={() => onNavigateTab('member-pelanggan')}
                  className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 rounded-xl text-center text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                  <span>Member VIP</span>
                </button>
                <button
                  onClick={() => onNavigateTab('stok-barang')}
                  className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 rounded-xl text-center text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                  <span>Stok Barang</span>
                </button>
                <button
                  onClick={() => onNavigateTab('setting-printer')}
                  className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 rounded-xl text-center text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 mx-auto mb-1 text-slate-600" />
                  <span>Printer Struk</span>
                </button>
                <button
                  onClick={() => onNavigateTab('backup-reset')}
                  className="p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 rounded-xl text-center text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                  <span>Backup Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PANDUAN PENGGUNAAN (USER MANUAL DETAIL) */}
      {/* ========================================================================= */}
      {activeSection === 'panduan' && (
        <div className="space-y-6">
          {/* Search & Filter Header */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>Buku Panduan Operasional Lengkap</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pelajari alur kerja tiap modul sistem untuk memaksimalkan efisiensi dan keamanan kasir Anda.
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={guideSearch}
                  onChange={(e) => setGuideSearch(e.target.value)}
                  placeholder="Cari topik panduan..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {guideSearch && (
                  <button
                    onClick={() => setGuideSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedGuideCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedGuideCategory === 'ALL'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Modul ({GUIDE_DATA.length})
              </button>
              <button
                onClick={() => setSelectedGuideCategory('MINI_ATM')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedGuideCategory === 'MINI_ATM'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Mini ATM
              </button>
              <button
                onClick={() => setSelectedGuideCategory('POS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedGuideCategory === 'POS'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Kasir POS
              </button>
              <button
                onClick={() => setSelectedGuideCategory('MEMBER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedGuideCategory === 'MEMBER'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Member & VIP
              </button>
              <button
                onClick={() => setSelectedGuideCategory('STOK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedGuideCategory === 'STOK'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Stok Barang
              </button>
              <button
                onClick={() => setSelectedGuideCategory('MULTIUSER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedGuideCategory === 'MULTIUSER'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Multi-User & DB
              </button>
              <button
                onClick={() => setSelectedGuideCategory('PRINTER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedGuideCategory === 'PRINTER'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Printer Thermal
              </button>
              <button
                onClick={() => setSelectedGuideCategory('SHEETS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedGuideCategory === 'SHEETS'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Google Sheets
              </button>
              <button
                onClick={() => setSelectedGuideCategory('BACKUP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedGuideCategory === 'BACKUP'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Backup & Restore
              </button>
            </div>
          </div>

          {/* Guide Accordion List */}
          <div className="space-y-3.5">
            {filteredGuides.map((guide, idx) => {
              const isExpanded = expandedGuideId === guide.id;
              const IconComponent = guide.categoryIcon;
              return (
                <div
                  key={guide.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'border-blue-300 shadow-md ring-1 ring-blue-400/20'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedGuideId(isExpanded ? null : guide.id)}
                    className="w-full p-5 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-xl shrink-0 mt-0.5 ${
                          isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {guide.categoryLabel}
                          </span>
                          {guide.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                              {guide.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{guide.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{guide.summary}</p>
                      </div>
                    </div>

                    <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 shrink-0 mt-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-5 pb-6 pt-2 border-t border-slate-100 space-y-5 bg-slate-50/50">
                      {/* Step-by-step numbered instructions */}
                      <div className="space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>Langkah-Langkah Penggunaan</span>
                        </div>
                        <div className="space-y-2.5">
                          {guide.steps.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-3 text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <span className="flex-1 font-medium">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tips & Pro Tricks */}
                      {guide.tips && guide.tips.length > 0 && (
                        <div className="p-3.5 bg-sky-50 border border-sky-200/80 rounded-xl text-xs text-sky-900 space-y-1.5">
                          <div className="font-bold flex items-center gap-1.5 text-sky-800">
                            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                            <span>Tips Efisiensi & Trik Cepat:</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-sky-800/90 pl-1">
                            {guide.tips.map((t, tIdx) => (
                              <li key={tIdx}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Warning Notice */}
                      {guide.warning && (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-800">Perhatian Penting: </span>
                            <span>{guide.warning}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredGuides.length === 0 && (
              <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-700">Topik panduan tidak ditemukan</h3>
                <p className="text-xs text-slate-500">
                  Coba gunakan kata kunci pencarian lain atau pilih kategori 'Semua Modul'.
                </p>
                <button
                  onClick={() => {
                    setGuideSearch('');
                    setSelectedGuideCategory('ALL');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: KEBIJAKAN & WARNING (SOP KEAMANAN) */}
      {/* ========================================================================= */}
      {activeSection === 'kebijakan' && (
        <div className="space-y-6">
          {/* Critical Warning Alert Box */}
          <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 text-white p-6 rounded-3xl shadow-lg border border-rose-700/60 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-200 rounded-xl border border-rose-400/30">
                <ShieldAlert className="w-6 h-6 text-rose-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Peringatan Keamanan Transaksi & Kebijakan Operasional
                </h2>
                <p className="text-xs text-rose-200">
                  Wajib dipatuhi oleh seluruh Administrator (Owner) dan Kasir Operator demi integritas keuangan.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Policy 1: Verifikasi Transaksi */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  1. SOP Validasi Transaksi Mini ATM
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sebelum mengonfirmasi transaksi Tarik Tunai atau Setor Tunai pada sistem:
              </p>
              <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside pl-1">
                <li>Pastikan bukti fisik slip EDC mesin gesek telah tercetak <strong>SUKSES / APPROVED</strong>.</li>
                <li>Untuk Setor Tunai & Transfer: Uang tunai dari pelanggan wajib dihitung dan diverifikasi keasliannya sebelum saldo dikirim.</li>
                <li>Periksa kembali Nomor Rekening dan Nama Pemilik Rekening Tujuan pada layar EDC / Bank sebelum eksekusi transfer.</li>
              </ul>
            </div>

            {/* Policy 2: Browser Storage & Cache */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  2. Peringatan Pembersihan Cache Browser
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aplikasi menggunakan teknologi <strong>LocalStorage Namespaces Isolated</strong> pada browser Anda:
              </p>
              <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside pl-1">
                <li><strong>JANGAN</strong> melakukan "Clear Site Data" atau hapus riwayat browser tanpa melakukan <strong>Download Backup (.JSON)</strong> terlebih dahulu.</li>
                <li>Lakukan download cadangan data minimal seminggu sekali atau aktifkan sinkronisasi Google Spreadsheet Cloud.</li>
                <li>Jika berganti laptop/HP, gunakan fitur Backup & Restore untuk memindahkan seluruh data transaksi dan saldo kas.</li>
              </ul>
            </div>

            {/* Policy 3: Pembatalan / Void Transaksi */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  3. Kebijakan Pembatalan (Void) Transaksi
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fitur pembatalan (Void) hanya diperkenankan jika terjadi kesalahan input atau kegagalan mesin EDC:
              </p>
              <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside pl-1">
                <li>Void transaksi akan otomatis membalikkan mutasi saldo kas/rekening ke posisi sebelum transaksi.</li>
                <li>Poin member yang telah didapat akan dikurangi kembali secara otomatis.</li>
                <li>Setiap aksi Void tercatat permanen pada riwayat log audit untuk mencegah kecurangan kasir.</li>
              </ul>
            </div>

            {/* Policy 4: Kerahasiaan Akun & Hak Akses */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  4. Keamanan Akun & Wewenang Peran
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Perlindungan data dan wewenang pengguna:
              </p>
              <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside pl-1">
                <li>Akun <strong>Admin (Owner)</strong> memegang akses vital keuangan. Jangan berikan kata sandi Admin kepada operator kasir shift.</li>
                <li>Kasir shift hanya boleh menggunakan akun kasir masing-masing agar rekapitulasi penjualan tercatat per individu.</li>
                <li>Gunakan fitur Logout setelah selesai jam operasional shift kerja.</li>
              </ul>
            </div>
          </div>

          {/* Legal Disclaimer Box */}
          <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-2">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              Pernyataan Tanggung Jawab & Disclaimer
            </div>
            <p>
              Aplikasi ini adalah perangkat lunak manajemen kasir, pencatatan transaksi, dan inventori independen. Aplikasi tidak terhubung langsung dengan core banking perbankan komersial tanpa izin, dan bertindak sebagai buku kasir digital pembantu operasional agen. Pemilik agen bertanggung jawab penuh terhadap pencocokan uang fisik dengan mutasi yang dicatat.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: DEVELOPER CREDIT: microdata2r */}
      {/* ========================================================================= */}
      {activeSection === 'developer' && (
        <div className="space-y-6">
          {/* Developer Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-[#002244] to-blue-950 text-white rounded-3xl p-8 shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
              <Code2 className="w-96 h-96 text-white" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg border border-white/20">
                    <Terminal className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                        microdata2r
                      </span>
                      <span className="bg-blue-500/30 text-blue-200 border border-blue-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Official Architect
                      </span>
                    </div>
                    <p className="text-sm text-blue-200 font-medium mt-0.5">
                      Digital System & Enterprise Software Developer
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-center">
                    <div className="text-[10px] uppercase font-bold text-blue-200">Framework</div>
                    <div className="text-sm font-extrabold text-white">React 18 + TS</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-center">
                    <div className="text-[10px] uppercase font-bold text-blue-200">Engine Engine</div>
                    <div className="text-sm font-extrabold text-white">Multi-Tenant</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1.5">
                  <div className="font-bold text-blue-200 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-300" />
                    <span>Spesialisasi Sistem</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Pengembangan aplikasi Point of Sale (POS), Manajemen Keagenan Mini ATM, Integrasi Hardware Bluetooth/Serial, dan Arsitektur Database Terisolasi.
                  </p>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1.5">
                  <div className="font-bold text-blue-200 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-300" />
                    <span>Filosofi Desain</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Mengutamakan kecepatan eksekusi, antarmuka elegan bebas hambatan, keamanan data multi-tenant mandiri, dan kemudahan bagi pengguna awam.
                  </p>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1.5">
                  <div className="font-bold text-blue-200 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-300" />
                    <span>Teknologi Pro</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    ESC/POS Thermal Engine, Web Bluetooth API, Web Serial API, Camera Barcode Scanner, Google Apps Script Cloud REST Sync.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Developer Features & Craftsmanship */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>Komitmen Kualitas & Pembaruan Berkelanjutan</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Isolasi Database Teruji</span>
                </div>
                <p className="leading-relaxed">
                  Dikembangkan oleh <strong>microdata2r</strong> dengan modul namespaced storage cerdas yang menjamin seluruh pendaftaran akun baru memiliki partisi data lokal independen.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Stabilitas Hardware Thermal</span>
                </div>
                <p className="leading-relaxed">
                  Protokol cetak termal dirancang kompatibel dengan printer murah 58mm maupun standar 80mm di Android, Windows, Mac, dan Linux.
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs text-blue-900 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-blue-950 block">Dikembangkan oleh: microdata2r</span>
                  <span className="text-[11px] text-blue-800">Versi Sistem: {enterpriseVersion}</span>
                </div>
              </div>

              <div className="text-[11px] text-blue-800 font-medium">
                Hak Cipta & Hak Desain © 2026 microdata2r. Seluruh hak cipta dilindungi.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: ARSITEKTUR & FITUR PRO */}
      {/* ========================================================================= */}
      {activeSection === 'arsitektur' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Spesifikasi Teknis & Modul
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Arsitektur Ekosistem Aplikasi Mini ATM & POS Kasir
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Kombinasi teknologi modern untuk menghadirkan kecepatan transaksi kasir tanpa jeda server.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Frontend React + Tailwind</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Antarmuka reaktif, responsif untuk layar PC desktop, laptop, tablet kasir, hingga layar smartphone.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Database className="w-4 h-4 text-amber-600" />
                  <span>Namespaced Storage Engine</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Isolasi data otomatis per username mencegah tumpang tindih data akun kasir yang berbeda.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Google Apps Script REST</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Sinkronisasi cloud dua arah langsung ke lembar kerja Google Sheets tanpa biaya server tambahan.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <span>ESC/POS Print Driver</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Dukungan format struk 58mm/80mm, pencetakan logo bitmap, auto-cut kertas, dan pengaturan densitas cetak.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>VIP Loyalty Matrix</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Sistem tier otomatis (Bronze, Silver, Gold, Platinum), barcode scan, voucher hadiah, dan diskon belanja.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Role-Based Access Control</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Pemisahan wewenang ketat antara Administrator (Owner) dan Kasir Operator demi keamanan data finansial.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
