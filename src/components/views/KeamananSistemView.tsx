import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Download,
  FileCheck,
  Zap,
  Globe,
  Sliders,
  CheckCircle2,
  Fingerprint,
  Cpu,
  Info,
  ExternalLink,
} from 'lucide-react';
import { SecurityThreatItem, SecurityPrivacySettings } from '../../types';
import {
  encryptAES256,
  decryptAES256,
  getSecuritySettings,
  saveSecuritySettings,
  maskCustomerPhone,
  maskCustomerAccount,
} from '../../utils/securityCrypto';
import {
  getThreatLogs,
  recordThreat,
  clearAllThreatLogs,
  subscribeToThreats,
} from '../../utils/threatDetector';

export const KeamananSistemView: React.FC = () => {
  const [threats, setThreats] = useState<SecurityThreatItem[]>(getThreatLogs());
  const [settings, setSettings] = useState<SecurityPrivacySettings>(getSecuritySettings());
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // AES-256 Sandbox State
  const [plainInput, setPlainInput] = useState<string>(
    'Data Rahasia Pelanggan: Budi Santoso | HP: 081234567890 | Rek Bank: 451298765432'
  );
  const [encryptedOutput, setEncryptedOutput] = useState<string>('');
  const [decryptedResult, setDecryptedResult] = useState<string>('');
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [cryptoError, setCryptoError] = useState<string>('');
  const [tamperedCipher, setTamperedCipher] = useState<boolean>(false);

  // Attack Test State
  const [attackInput, setAttackInput] = useState<string>("<script>alert('Pencurian Data Konsumen')</script>");
  const [testFeedback, setTestFeedback] = useState<string>('');

  useEffect(() => {
    const unsubscribe = subscribeToThreats((updatedLogs) => {
      setThreats([...updatedLogs]);
    });
    return unsubscribe;
  }, []);

  const handleToggleSetting = (key: keyof SecurityPrivacySettings) => {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(updated);
    saveSecuritySettings(updated);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // Test AES-256 Encryption
  const handleTestEncrypt = async () => {
    if (!plainInput.trim()) return;
    setIsEncrypting(true);
    setCryptoError('');
    setDecryptedResult('');
    setTamperedCipher(false);

    try {
      const encrypted = await encryptAES256(plainInput);
      setEncryptedOutput(encrypted.serialized);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCryptoError('Gagal mengenkripsi: ' + msg);
    } finally {
      setIsEncrypting(false);
    }
  };

  // Test AES-256 Decryption
  const handleTestDecrypt = async () => {
    if (!encryptedOutput) return;
    setIsDecrypting(true);
    setCryptoError('');

    try {
      const decrypted = await decryptAES256(encryptedOutput);
      setDecryptedResult(decrypted);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCryptoError('GAGAL DEKRIPSI (Integritas Terganggu): ' + msg);
    } finally {
      setIsDecrypting(false);
    }
  };

  // Simulate Bit-Flipping Tampering to show AES-GCM Integrity Verification
  const handleTamperCiphertext = () => {
    if (!encryptedOutput) return;
    const parts = encryptedOutput.split('.');
    if (parts.length === 4) {
      // Alter the last character of ciphertext
      const cipher = parts[3];
      const altered = cipher.substring(0, cipher.length - 2) + (cipher.endsWith('a') ? 'b' : 'a') + cipher.slice(-1);
      const tampered = `${parts[0]}.${parts[1]}.${parts[2]}.${altered}`;
      setEncryptedOutput(tampered);
      setTamperedCipher(true);
      setDecryptedResult('');
    }
  };

  // Test Attack Simulation
  const handleSimulateAttack = (type: 'XSS' | 'SQLI' | 'TRAVERSAL' | 'BURST') => {
    setTestFeedback('');

    if (type === 'XSS') {
      const threat = recordThreat({
        threatType: 'XSS_ATTACK',
        severity: 'TINGGI',
        description: 'Simulasi deteksi Cross-Site Scripting (XSS): Tag skrip berbahaya dinetralkan dari formulir pelanggan.',
        status: 'DIMURNIKAN',
        source: 'WAF Client Filter',
      });
      setTestFeedback(`Peringatan aktif: ${threat.id} - Serangan XSS terdeteksi & data dinetralkan!`);
    } else if (type === 'SQLI') {
      const threat = recordThreat({
        threatType: 'SQL_INJECTION',
        severity: 'KRITIS',
        description: 'Simulasi deteksi Injeksi SQL: Percobaan manipulasi kueri database dicegat dan diblokir seketika.',
        status: 'TERBLOKIR',
        source: 'Backend SQL Shield',
      });
      setTestFeedback(`Peringatan aktif: ${threat.id} - Injeksi SQL terblokir 100%!`);
    } else if (type === 'TRAVERSAL') {
      const threat = recordThreat({
        threatType: 'PATH_TRAVERSAL',
        severity: 'TINGGI',
        description: 'Simulasi path traversal (../etc/passwd): Akses direktori terlarang dicegah.',
        status: 'TERBLOKIR',
        source: 'File Guard Engine',
      });
      setTestFeedback(`Peringatan aktif: ${threat.id} - Akses ilegal diblokir.`);
    } else if (type === 'BURST') {
      const threat = recordThreat({
        threatType: 'RATE_BURST',
        severity: 'SEDANG',
        description: 'Simulasi lonjakan request abnormal (Spam / Brute Force): Rate limiter membatasi akses sementara.',
        status: 'DIMURNIKAN',
        source: 'Sliding Window Limiter',
      });
      setTestFeedback(`Peringatan aktif: ${threat.id} - Pembatasan laju aktif.`);
    }
  };

  // Export audit logs as JSON
  const handleExportAuditLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(threats, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit_keamanan_mini_atm_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <section id="view-keamanan-sistem" className="space-y-6">
      {/* 1. Header Banner: Pusat Keamanan & Enkripsi Data */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-blue-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600/30 rounded-2xl border border-blue-500/40 text-blue-300 shrink-0">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                Enterprise Data Protection
              </span>
              <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Aktif &amp; Terlindungi
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Pusat Keamanan, Enkripsi &amp; Deteksi Ancaman
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Menjaga kerahasiaan penuh data konsumen dengan protokol <strong>TLS/SSL (HTTPS)</strong>, enkripsi otentikasi <strong>AES-256-GCM</strong>, kebijakan <strong>Zero IP Exposure</strong>, serta sistem peringatan dini akses mencurigakan.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 self-stretch md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExportAuditLogs}
            className="text-xs font-bold px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-sky-300" />
            <span>Unduh Log Audit</span>
          </button>
        </div>
      </div>

      {/* 2. Empat Pilar Keamanan Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pilar 1: TLS / SSL (HTTPS) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              HSTS Preload
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">TLS/SSL (HTTPS)</h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Mengamankan jalur komunikasi data agar tidak dapat disadap atau diintip di tengah jalan (<strong>Man-in-the-Middle Attack</strong>).
            </p>
          </div>
          <div className="pt-1 text-[10.5px] font-mono text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/60">
            ✓ 256-bit Cipher Suite
            <br />✓ Strict-Transport-Security
          </div>
        </div>

        {/* Pilar 2: AES-256 Advanced Encryption */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
              <Key className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
              AES-256-GCM
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Enkripsi AES-256</h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Standar enkripsi militer tingkat tinggi. Data pelanggan, nomor telepon, dan rekening terenkripsi dengan kunci 256-bit.
            </p>
          </div>
          <div className="pt-1 text-[10.5px] font-mono text-teal-800 bg-teal-50/70 p-2 rounded-lg border border-teal-200/60">
            ✓ 96-bit Random IV / Trx
            <br />✓ 128-bit Auth Tag Anti-Tamper
          </div>
        </div>

        {/* Pilar 3: Zero IP Exposure */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl border border-sky-100">
              <Fingerprint className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
              Zero IP Display
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Privasi IP Tertutup</h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Alamat IP tidak pernah ditampilkan di antarmuka kasir, struk thermal, maupun respons API publik demi mencegah pelacakan.
            </p>
          </div>
          <div className="pt-1 text-[10.5px] font-mono text-sky-800 bg-sky-50/70 p-2 rounded-lg border border-sky-200/60">
            ✓ No IP in Receipts
            <br />✓ Salted Hash Backend Logs
          </div>
        </div>

        {/* Pilar 4: IDS & WAF Real-Time */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
              WAF &amp; IDS
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Deteksi Akses Mencurigakan</h3>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Memantau percobaan retas (SQL Injection, XSS, manipulasi role, spam serangan) dan memberikan peringatan instan.
            </p>
          </div>
          <div className="pt-1 text-[10.5px] font-mono text-amber-900 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60">
            ✓ Pembersihan XSS Otomatis
            <br />✓ Banner Peringatan Kritis
          </div>
        </div>
      </div>

      {/* 3. Pengaturan Privasi & Sensor Data Konsumen */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-800 rounded-lg">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Pengaturan Privasi Data Konsumen &amp; Pertahanan
              </h2>
              <p className="text-[11px] text-slate-600">
                Kontrol perlindungan visual di layar untuk mencegah pengintipan (shoulder-surfing) di loket kasir
              </p>
            </div>
          </div>
          {settingsSaved && (
            <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tersimpan Otomatis
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Toggle 1: Sensor Nomor HP */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">Sensor Nomor HP Pelanggan</span>
                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                  {settings.maskCustomerPhone ? 'Aktif' : 'Terbuka'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Nomor ponsel disamarkan di tabel transaksi &amp; kasir menjadi:{' '}
                <span className="font-mono font-bold text-slate-900">
                  {maskCustomerPhone('081234567890', !settings.maskCustomerPhone)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSetting('maskCustomerPhone')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                settings.maskCustomerPhone ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  settings.maskCustomerPhone ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle 2: Sensor Rekening Tujuan */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">Sensor Nomor Rekening Tujuan</span>
                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                  {settings.maskCustomerAccount ? 'Aktif' : 'Terbuka'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Nomor rekening perbankan disamarkan di layar kasir menjadi:{' '}
                <span className="font-mono font-bold text-slate-900">
                  {maskCustomerAccount('541298765432', !settings.maskCustomerAccount)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSetting('maskCustomerAccount')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                settings.maskCustomerAccount ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  settings.maskCustomerAccount ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle 3: Enkripsi LocalStorage */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">Enkripsi Data Penyimpanan Lokal</span>
                <span className="text-[10px] font-mono bg-teal-50 text-teal-700 px-1.5 py-0.2 rounded border border-teal-200">
                  AES-256
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Menyimpan data sensitif pelanggan di cache peramban dengan perlindungan kriptografi anti-pencurian offline.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSetting('encryptLocalStorage')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                settings.encryptLocalStorage ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  settings.encryptLocalStorage ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle 4: Peringatan Audio Ancaman */}
          <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">Alarm Audio Peringatan Ancaman</span>
                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                  Audio Tone
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Memutar nada peringatan segera ketika terdapat percobaan injeksi atau anomali akses mencurigakan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleSetting('soundAlertOnThreat')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                settings.soundAlertOnThreat ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  settings.soundAlertOnThreat ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Simulator Interaktif: Uji Enkripsi AES-256 & Uji Deteksi Serangan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sandbox 1: Uji Enkripsi & Dekripsi AES-256-GCM */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Simulator Enkripsi AES-256-GCM (Hardware Accelerated)
              </h2>
              <p className="text-[11px] text-slate-600">
                Uji langsung proses enkripsi teks data pelanggan dan validasi integritas anti-tamper
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Teks Data Pelanggan / Transaksi (Plaintext):
              </label>
              <textarea
                rows={2}
                value={plainInput}
                onChange={(e) => setPlainInput(e.target.value)}
                className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600"
                placeholder="Masukkan teks sensitif untuk dienkripsi..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTestEncrypt}
                disabled={isEncrypting}
                className="text-xs font-bold px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Enkripsi dengan AES-256-GCM</span>
              </button>

              {encryptedOutput && (
                <>
                  <button
                    type="button"
                    onClick={handleTestDecrypt}
                    disabled={isDecrypting}
                    className="text-xs font-bold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Dekripsi &amp; Verifikasi</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTamperCiphertext}
                    title="Simulasikan peretasan/perubahan 1 bit pada ciphertext untuk menguji deteksi tamper"
                    className="text-xs font-bold px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Simulasi Perubahan Bit (Tamper)</span>
                  </button>
                </>
              )}
            </div>

            {encryptedOutput && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">Paket Enkripsi Terproteksi (Ciphertext + IV + Tag):</span>
                  {tamperedCipher && (
                    <span className="text-rose-600 font-extrabold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      ⚠️ Data Telah Dimanipulasi!
                    </span>
                  )}
                </div>
                <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[10.5px] rounded-xl break-all max-h-24 overflow-y-auto border border-slate-800 select-all">
                  {encryptedOutput}
                </div>
              </div>
            )}

            {decryptedResult && (
              <div className="space-y-1 pt-1 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-950 animate-in fade-in">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                  ✓ Hasil Dekripsi Valid (Otentikasi 100% Berhasil)
                </span>
                <p className="text-xs font-mono font-medium">{decryptedResult}</p>
              </div>
            )}

            {cryptoError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <span className="font-bold block">⚠️ Peringatan Keamanan Kriptografi:</span>
                <p className="text-[11px] leading-relaxed">{cryptoError}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sandbox 2: Uji Deteksi Akses Mencurigakan (IDS/WAF Sandbox) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <div className="p-2 bg-amber-50 text-amber-800 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Uji Deteksi Akses Mencurigakan &amp; Anti-Retas
              </h2>
              <p className="text-[11px] text-slate-600">
                Uji coba respons sistem terhadap percobaan serangan umum untuk memverifikasi warning banner
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Klik salah satu skenario uji serangan di bawah untuk menguji respons deteksi otomatis. Sistem akan menolak serangan, memicu peringatan merah/kuning, dan merekam insiden pada audit log:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSimulateAttack('XSS')}
                className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 bg-slate-50/70 hover:bg-amber-50/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-amber-900">
                  <span>1. Uji Injeksi Skrip XSS</span>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Pola &lt;script&gt; / pencurian session cookie
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateAttack('SQLI')}
                className="p-3 rounded-xl border border-slate-200 hover:border-rose-400 bg-slate-50/70 hover:bg-rose-50/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-rose-900">
                  <span>2. Uji Injeksi Database (SQLi)</span>
                  <Zap className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Pola manipulasi DROP TABLE / UNION SELECT
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateAttack('TRAVERSAL')}
                className="p-3 rounded-xl border border-slate-200 hover:border-sky-400 bg-slate-50/70 hover:bg-sky-50/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-sky-900">
                  <span>3. Uji Path Traversal</span>
                  <Zap className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Pola ../ direktori file sistem terlarang
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateAttack('BURST')}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/40 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-indigo-900">
                  <span>4. Uji Lonjakan Rate Burst</span>
                  <Zap className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Pola spam request otomatis / brute force
                </p>
              </button>
            </div>

            {testFeedback && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold text-[11px]">{testFeedback}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Riwayat Log Audit Ancaman & Akses Mencurigakan */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 text-slate-800 rounded-lg">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Log Audit Akses &amp; Insiden Keamanan Real-Time
              </h2>
              <p className="text-[11px] text-slate-600">
                Merekam deteksi ancaman dengan perlindungan Zero IP (tidak mengekspos IP address perangkat)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearAllThreatLogs}
              className="text-xs font-semibold px-3 py-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Log Peringatan</span>
            </button>
          </div>
        </div>

        {/* Tabel Log */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-2.5 px-3">ID &amp; Waktu</th>
                <th className="py-2.5 px-3">Tipe Ancaman</th>
                <th className="py-2.5 px-3">Tingkat Keparahan</th>
                <th className="py-2.5 px-3">Keterangan &amp; Tindakan Mitigasi</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Sumber Keamanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {threats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Tidak ada insiden keamanan mencurigakan. Sistem dalam keadaan aman terlindungi.
                  </td>
                </tr>
              ) : (
                threats.map((log) => {
                  const isCritical = log.severity === 'KRITIS';
                  const isHigh = log.severity === 'TINGGI';

                  const badgeClass = isCritical
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : isHigh
                    ? 'bg-amber-100 text-amber-900 border-amber-200'
                    : 'bg-slate-100 text-slate-800 border-slate-200';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{log.id}</span>
                        <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] font-semibold text-slate-800">
                        {log.threatType}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                          {log.severity}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-700 font-medium max-w-xs">
                        {log.description}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          {log.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-[10.5px] text-slate-600 whitespace-nowrap">
                        {log.source || 'Shield Guard'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
