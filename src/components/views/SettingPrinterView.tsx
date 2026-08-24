import React, { useState, useEffect } from 'react';
import {
  Printer,
  Bluetooth,
  Monitor,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sliders,
  Sparkles,
  Zap,
  Layers,
  HelpCircle,
  ExternalLink,
  Cable,
  RefreshCw,
  Info,
  Laptop,
} from 'lucide-react';
import { AgentProfile, PrinterSettings } from '../../types';
import { INITIAL_PRINTER_SETTINGS } from '../../data/initialData';
import {
  connectBluetoothPrinter,
  connectSerialPrinter,
  disconnectBluetoothPrinter,
  disconnectSerialPrinter,
  executeTestPrint,
  getActiveBluetoothDeviceName,
  getActiveSerialPortName,
  isInIframe,
  isWebBluetoothSupported,
  isWebSerialSupported,
} from '../../utils/thermalPrinterService';

interface SettingPrinterViewProps {
  profile: AgentProfile;
  settings: PrinterSettings;
  onSaveSettings: (newSettings: PrinterSettings) => void;
  onNavigateTab?: (tab: string) => void;
}

export const SettingPrinterView: React.FC<SettingPrinterViewProps> = ({
  profile,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<PrinterSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isTestingPrint, setIsTestingPrint] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [isScanningBluetooth, setIsScanningBluetooth] = useState<boolean>(false);
  const [isConnectingSerial, setIsConnectingSerial] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'info' | 'success' | 'warning' | 'error';
    showOpenTabButton?: boolean;
  } | null>(null);

  const [inIframeState, setInIframeState] = useState<boolean>(false);

  useEffect(() => {
    setInIframeState(isInIframe());
  }, []);

  const activeBtName = getActiveBluetoothDeviceName() || formData.bluetoothDeviceName;
  const activeSerialName = getActiveSerialPortName() || formData.serialPortName;
  const isBluetoothSupported = isWebBluetoothSupported();
  const isSerialSupported = isWebSerialSupported();

  const handleUpdate = <K extends keyof PrinterSettings>(
    key: K,
    value: PrinterSettings[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan pengaturan printer ke konfigurasi bawaan?')) {
      setFormData(INITIAL_PRINTER_SETTINGS);
      onSaveSettings(INITIAL_PRINTER_SETTINGS);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleOpenInNewTab = () => {
    try {
      window.open(window.location.href, '_blank');
    } catch {
      // Fallback
    }
  };

  const handleConnectBluetooth = async () => {
    setIsScanningBluetooth(true);
    setStatusMessage({
      text: 'Membuka dialog pemindaian Bluetooth... Pastikan Bluetooth HP/Laptop & Printer ON.',
      type: 'info',
    });

    const res = await connectBluetoothPrinter();
    setIsScanningBluetooth(false);

    if (res.success) {
      setFormData((prev) => ({
        ...prev,
        connectionType: 'bluetooth',
        bluetoothDeviceName: res.deviceName || 'Printer Bluetooth',
      }));
      setStatusMessage({
        text: `Berhasil terhubung ke ${res.deviceName || 'Printer Bluetooth'}!`,
        type: 'success',
      });
    } else {
      setStatusMessage({
        text: res.error || 'Gagal mendeteksi printer Bluetooth.',
        type: res.isIframeBlocked ? 'warning' : 'error',
        showOpenTabButton: res.isIframeBlocked || inIframeState,
      });
    }
  };

  const handleDisconnectBluetooth = () => {
    disconnectBluetoothPrinter();
    setFormData((prev) => ({
      ...prev,
      bluetoothDeviceName: null,
      connectionType: 'browser',
    }));
    setStatusMessage({
      text: 'Koneksi Bluetooth diputus.',
      type: 'info',
    });
  };

  const handleConnectSerial = async () => {
    setIsConnectingSerial(true);
    setStatusMessage({
      text: 'Membuka daftar Port COM / USB...',
      type: 'info',
    });

    const res = await connectSerialPrinter();
    setIsConnectingSerial(false);

    if (res.success) {
      setFormData((prev) => ({
        ...prev,
        connectionType: 'serial',
        serialPortName: res.portName || 'Port Serial USB',
      }));
      setStatusMessage({
        text: 'Berhasil terhubung ke Port Serial / USB Thermal!',
        type: 'success',
      });
    } else {
      setStatusMessage({
        text: res.error || 'Gagal membuka Port Serial.',
        type: res.isIframeBlocked ? 'warning' : 'error',
        showOpenTabButton: res.isIframeBlocked || inIframeState,
      });
    }
  };

  const handleDisconnectSerial = async () => {
    await disconnectSerialPrinter();
    setFormData((prev) => ({
      ...prev,
      serialPortName: null,
      connectionType: 'browser',
    }));
    setStatusMessage({
      text: 'Koneksi Serial / USB diputus.',
      type: 'info',
    });
  };

  const handleTestPrint = async () => {
    setIsTestingPrint(true);
    setTestResult(null);

    try {
      const res = await executeTestPrint(profile, formData);
      setTestResult(res);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setTestResult({
        success: false,
        message: `Uji coba cetak gagal: ${errMsg}`,
      });
    } finally {
      setIsTestingPrint(false);
      setTimeout(() => setTestResult(null), 6000);
    }
  };

  return (
    <section id="view-setting-printer" className="space-y-5">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-700" />
            <span>Pengaturan Printer Thermal &amp; Cetak Struk</span>
          </h2>
          <p className="text-xs text-slate-500">
            Konfigurasi koneksi Bluetooth, USB/COM Port, Dialog Sistem, ukuran kertas 58mm/80mm, serta rangkap struk
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefault}
            className="text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Setting</span>
          </button>
        </div>
      </div>

      {/* Iframe Warning Banner if in Iframe */}
      {inIframeState && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs">Pemberitahuan Izin Bluetooth / USB Browser</h4>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Fitur pemindaian perangkat Bluetooth &amp; USB Port memerlukan izin halaman utama (Top-Level Window). Jika pemindaian tidak merespons di dalam kotak pratinjau, klik tombol di samping untuk membukanya di Tab Baru.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka di Tab Baru</span>
          </button>
        </div>
      )}

      {/* Quick Status Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Mode Jalur Cetak</span>
          <div className="flex items-center gap-1.5 mt-1">
            {formData.connectionType === 'bluetooth' ? (
              <Bluetooth className="w-4 h-4 text-blue-600" />
            ) : formData.connectionType === 'serial' ? (
              <Cable className="w-4 h-4 text-indigo-600" />
            ) : formData.connectionType === 'rawbt' ? (
              <Smartphone className="w-4 h-4 text-emerald-600" />
            ) : (
              <Monitor className="w-4 h-4 text-slate-700" />
            )}
            <span className="font-bold text-xs text-slate-800 uppercase">
              {formData.connectionType === 'bluetooth'
                ? 'Web Bluetooth'
                : formData.connectionType === 'serial'
                ? 'Port Serial/USB'
                : formData.connectionType === 'rawbt'
                ? 'RawBT Mobile'
                : 'Dialog Browser'}
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Lebar Kertas</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="font-bold text-xs text-slate-800">
              Thermal {formData.paperWidth}
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Rangkap Struk</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-xs text-slate-800">
              {formData.printCopies === 2 ? '2 Rangkap (Nasabah+Toko)' : '1 Lembar (Tunggal)'}
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Status Perangkat</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`w-2 h-2 rounded-full ${
                (formData.connectionType === 'bluetooth' && activeBtName) ||
                (formData.connectionType === 'serial' && activeSerialName)
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-blue-500'
              }`}
            ></span>
            <span className="font-bold text-xs text-slate-800 truncate">
              {formData.connectionType === 'bluetooth'
                ? activeBtName || 'Siap Scanning'
                : formData.connectionType === 'serial'
                ? activeSerialName || 'Siap Port COM'
                : 'Siap Cetak (Universal)'}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications & Dynamic Status Feedback */}
      {savedSuccess && (
        <div className="bg-emerald-50 text-emerald-800 text-xs px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">Pengaturan printer berhasil disimpan!</span>
        </div>
      )}

      {statusMessage && (
        <div
          className={`text-xs px-4 py-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-150 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200'
              : statusMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' || statusMessage.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>

          {statusMessage.showOpenTabButton && (
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di Tab Baru</span>
            </button>
          )}
        </div>
      )}

      {testResult && (
        <div
          className={`text-xs px-4 py-2.5 rounded-xl border flex items-center gap-2 animate-in fade-in duration-150 ${
            testResult.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section 1: Connection Type Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Pilih Mode / Jalur Cetak Printer</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Sesuaikan dengan jenis printer yang Anda miliki (Dialog Browser, Bluetooth BLE, Port USB/COM, atau RawBT Mobile)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {/* Option 1: Browser Dialog (Universal) */}
              <div
                onClick={() => handleUpdate('connectionType', 'browser')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  formData.connectionType === 'browser'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                      <Monitor className="w-4 h-4" />
                    </div>
                    {formData.connectionType === 'browser' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 pt-1">Dialog Browser</h4>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Universal untuk semua printer Windows/Mac/Linux, driver USB &amp; PDF.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-blue-700 mt-2 block">
                  ✓ Universal (Semua OS)
                </span>
              </div>

              {/* Option 2: Web Bluetooth Direct (BLE) */}
              <div
                onClick={() => handleUpdate('connectionType', 'bluetooth')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  formData.connectionType === 'bluetooth'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                      <Bluetooth className="w-4 h-4" />
                    </div>
                    {formData.connectionType === 'bluetooth' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 pt-1">Web Bluetooth</h4>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Koneksi nirkabel langsung ke printer BLE (Chrome/Edge).
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-blue-700 mt-2 block">
                  ✓ Mini Thermal BLE
                </span>
              </div>

              {/* Option 3: Web Serial / USB & Bluetooth COM Port */}
              <div
                onClick={() => handleUpdate('connectionType', 'serial')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  formData.connectionType === 'serial'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                      <Cable className="w-4 h-4" />
                    </div>
                    {formData.connectionType === 'serial' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 pt-1">USB / Port COM</h4>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Untuk kabel USB &amp; Bluetooth Classic yang terdaftar sebagai Port Serial.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-indigo-700 mt-2 block">
                  ✓ Kabel USB &amp; COM Port
                </span>
              </div>

              {/* Option 4: RawBT Mobile Service */}
              <div
                onClick={() => handleUpdate('connectionType', 'rawbt')}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  formData.connectionType === 'rawbt'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    {formData.connectionType === 'rawbt' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 pt-1">RawBT Mobile</h4>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Integrasi aplikasi Android RawBT Print Service untuk HP Kasir.
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 mt-2 block">
                  ✓ Khusus Android HP
                </span>
              </div>
            </div>

            {/* Bluetooth Pairer Card if Bluetooth selected */}
            {formData.connectionType === 'bluetooth' && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-blue-950 block">
                      Status Perangkat Bluetooth:
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-700">
                      {activeBtName || 'Belum ada printer Bluetooth yang tersambung'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isScanningBluetooth}
                      onClick={handleConnectBluetooth}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Bluetooth className="w-4 h-4" />
                      <span>{isScanningBluetooth ? 'Memindai...' : 'Scan & Sambungkan Bluetooth'}</span>
                    </button>

                    {activeBtName && (
                      <button
                        type="button"
                        onClick={handleDisconnectBluetooth}
                        className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Putus
                      </button>
                    )}
                  </div>
                </div>

                {/* Bluetooth Troubleshooting & Guide Box */}
                <div className="bg-white p-3.5 rounded-lg border border-blue-200/80 text-[11px] text-slate-600 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    <span>Panduan Jika Printer Bluetooth Tidak Terdeteksi:</span>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 leading-relaxed text-slate-700">
                    <li>
                      <strong>Nyalakan Bluetooth &amp; Printer:</strong> Pastikan printer thermal menyala (lampu power/bluetooth berkedip biru/hijau).
                    </li>
                    <li>
                      <strong>Buka di Tab Baru:</strong> Karena batasan keamanan browser, jendela pratinjau (iframe) dapat memblokir pemindaian Bluetooth.{' '}
                      <button
                        type="button"
                        onClick={handleOpenInNewTab}
                        className="text-blue-700 font-bold underline hover:text-blue-900 cursor-pointer inline-flex items-center gap-0.5"
                      >
                        Klik di sini untuk Buka di Tab Baru <ExternalLink className="w-3 h-3 inline" />
                      </button>
                    </li>
                    <li>
                      <strong>Gunakan Mode Port USB / COM:</strong> Jika printer Anda jenis <em>Bluetooth Classic SPP (bukan BLE)</em>, pilih opsi mode <strong>&quot;USB / Port COM&quot;</strong> di atas atau hubungkan melalui kabel USB.
                    </li>
                    <li>
                      <strong>Gunakan Mode Dialog Browser:</strong> Anda juga bisa memilih mode <strong>&quot;Dialog Browser&quot;</strong> yang dapat mencetak ke semua printer thermal yang telah terpasang di Windows/Mac/Android tanpa pairing manual.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Serial / USB Pairer Card if Serial selected */}
            {formData.connectionType === 'serial' && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-indigo-950 block">
                      Status Port Serial / USB:
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-700">
                      {activeSerialName || 'Belum ada Port COM/USB yang dibuka'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isConnectingSerial}
                      onClick={handleConnectSerial}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Cable className="w-4 h-4" />
                      <span>{isConnectingSerial ? 'Membuka...' : 'Pilih Port COM / USB'}</span>
                    </button>

                    {activeSerialName && (
                      <button
                        type="button"
                        onClick={handleDisconnectSerial}
                        className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Tutup Port
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-indigo-200/80 text-[11px] text-slate-600">
                  <p className="leading-relaxed">
                    💡 <strong>Tips Port COM / USB:</strong> Mode ini mendukung koneksi langsung kabel USB printer thermal dan virtual Bluetooth Serial Port (COM3/COM4) di Windows/Linux/ChromeOS.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Format Kertas & Rangkap */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Ukuran Kertas &amp; Rangkap Struk</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Paper Width */}
              <div>
                <label className="block font-semibold text-xs text-slate-700 mb-1">
                  Lebar Kertas Printer Thermal
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate('paperWidth', '58mm')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      formData.paperWidth === '58mm'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    58 mm (Standar)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdate('paperWidth', '80mm')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      formData.paperWidth === '80mm'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    80 mm (POS Lebar)
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * 58mm cocok untuk printer bluetooth portabel kecil.
                </span>
              </div>

              {/* Print Copies */}
              <div>
                <label className="block font-semibold text-xs text-slate-700 mb-1">
                  Jumlah Rangkap Cetak Struk
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate('printCopies', 1)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      formData.printCopies === 1
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    1 Lembar (Tunggal)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdate('printCopies', 2)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      formData.printCopies === 2
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    2 Rangkap (Nasabah + Agen)
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * Otomatis memberi label &quot;Lembar Nasabah&quot; &amp; &quot;Lembar Arsip&quot;.
                </span>
              </div>
            </div>

            {/* Density & Cut Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-xs text-slate-700 mb-1">
                  Ketebalan Teks (Density)
                </label>
                <select
                  value={formData.printerDensity}
                  onChange={(e) =>
                    handleUpdate('printerDensity', e.target.value as 'normal' | 'dark')
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="normal">Normal (Standar Tajam)</option>
                  <option value="dark">Tebal / Bold (High Contrast Thermal)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-xs text-slate-700 mb-1">
                  Kirim Perintah Potong Kertas (Auto-Cut)
                </label>
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="checkbox"
                    id="chkAutoCut"
                    checked={formData.autoCut}
                    onChange={(e) => handleUpdate('autoCut', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="chkAutoCut" className="text-xs text-slate-700 cursor-pointer">
                    Kirim sinyal potong (GS V 0) di akhir struk
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Kustomisasi Elemen Struk */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Kustomisasi Tampilan Data Struk</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showLogo}
                  onChange={(e) => handleUpdate('showLogo', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
                />
                <span className="text-slate-700 font-medium">Tampilkan Logo Toko / Outlet</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showIdAgent}
                  onChange={(e) => handleUpdate('showIdAgent', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
                />
                <span className="text-slate-700 font-medium">Tampilkan ID Agen BRILink</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showRefNumber}
                  onChange={(e) => handleUpdate('showRefNumber', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
                />
                <span className="text-slate-700 font-medium">Tampilkan Nomor Referensi Transaksi</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showNotes}
                  onChange={(e) => handleUpdate('showNotes', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
                />
                <span className="text-slate-700 font-medium">Tampilkan Catatan Transaksi</span>
              </label>
            </div>

            <div>
              <label className="block font-semibold text-xs text-slate-700 mb-1">
                Catatan Footer Tambahan
              </label>
              <textarea
                rows={2}
                value={formData.customFooterNote}
                onChange={(e) => handleUpdate('customFooterNote', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                placeholder="Contoh: Simpan struk ini sebagai bukti pembayaran yang sah."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Test Print & Live Thermal Preview */}
        <div className="space-y-4">
          {/* Test Print Action Card */}
          <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-xl p-4 shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-xs leading-tight">Uji Coba Printer</h3>
                <p className="text-[10px] text-blue-200">Pastikan cetakan presisi &amp; terbaca jelas</p>
              </div>
            </div>

            <button
              type="button"
              disabled={isTestingPrint}
              onClick={handleTestPrint}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {isTestingPrint ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Printer className="w-4 h-4 text-white" />
              )}
              <span>{isTestingPrint ? 'Mengirim Data...' : '⚡ Cetak Struk Uji Coba (Test)'}</span>
            </button>

            <p className="text-[10px] text-blue-200 text-center">
              Mencetak 1 struk demo menggunakan mode{' '}
              <strong className="text-white uppercase">{formData.connectionType}</strong> ({formData.paperWidth}).
            </p>
          </div>

          {/* Live Thermal Receipt Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pratinjau Struk ({formData.paperWidth})
              </h3>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
                {formData.printCopies} Rangkap
              </span>
            </div>

            {/* Thermal Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm font-mono text-xs space-y-2.5 select-none">
              {/* Header */}
              <div className="text-center border-b border-slate-200 pb-2 space-y-1">
                {formData.showLogo && profile.logoUrl && (
                  <div className="w-9 h-9 mx-auto rounded-md overflow-hidden mb-1 border border-slate-200">
                    <img
                      src={profile.logoUrl}
                      className="w-full h-full object-cover"
                      alt="Logo"
                    />
                  </div>
                )}
                <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                  {profile.storeName || 'MINI ATM AGENT'}
                </h4>
                <p className="text-[10px] text-slate-600 font-sans">
                  {profile.receiptHeader || 'BRILink & Multi Payment'}
                </p>
                {profile.address && (
                  <p className="text-[9px] text-slate-500 font-sans leading-tight">
                    {profile.address}
                  </p>
                )}
                <p className="text-[9px] text-slate-500 font-mono">
                  Telp/WA: {profile.phone || '-'}
                </p>
              </div>

              {formData.printCopies === 2 && (
                <div className="text-[10px] font-bold text-center border border-dashed border-slate-400 py-0.5">
                  *** LEMBAR NASABAH ***
                </div>
              )}

              {/* Data Items */}
              <div className="space-y-1 text-[11px] text-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tgl/Waktu:</span>
                  <span>26 Apr 2026 20:24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Trx:</span>
                  <span className="font-bold">#TRX-101</span>
                </div>
                {formData.showIdAgent && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID Agen:</span>
                    <span>{profile.idAgent}</span>
                  </div>
                )}
                {formData.showRefNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Ref:</span>
                    <span className="font-mono text-[10px]">REF-20260426-101</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Layanan:</span>
                  <span className="font-bold text-blue-900">SETOR TUNAI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pengirim:</span>
                  <span>Mbak Dewi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tujuan:</span>
                  <span>Bu Painem</span>
                </div>
              </div>

              {/* Nominal */}
              <div className="border-t border-b border-dashed border-slate-300 py-1.5 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Nominal:</span>
                  <span className="font-bold">Rp 200.000</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Admin:</span>
                  <span>Rp 4.000</span>
                </div>
                <div className="flex justify-between font-extrabold text-xs text-blue-950 pt-1 border-t border-slate-200">
                  <span>TOTAL:</span>
                  <span>Rp 204.000</span>
                </div>
              </div>

              {formData.showNotes && (
                <div className="text-[10px] text-slate-500 bg-slate-50 p-1 rounded">
                  Ket: Setor tabungan arisan
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-[9px] text-slate-500 pt-1 whitespace-pre-line font-sans leading-tight">
                {formData.customFooterNote || profile.receiptFooter}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
