import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig, CameraDevice } from 'html5-qrcode';
import {
  Camera,
  X,
  RefreshCw,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Repeat,
  Zap,
} from 'lucide-react';
import { playSuccessBeep, playErrorBeep } from '../../utils/audioFeedback';

interface ModalBarcodeCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => { success: boolean; message: string };
}

export const ModalBarcodeCameraScanner: React.FC<ModalBarcodeCameraScannerProps> = ({
  isOpen,
  onClose,
  onBarcodeDetected,
}) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<{ code: string; message: string; success: boolean; time: string } | null>(null);
  const [continuousMode, setContinuousMode] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimeRef = useRef<number>(0);
  const isStoppingRef = useRef<boolean>(false);

  const containerElementIdRef = useRef(`barcode-camera-${Math.random().toString(36).slice(2, 9)}`);
  const containerElementId = containerElementIdRef.current;

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              try {
                scannerRef.current?.clear();
              } catch {
                // Ignore
              }
            }).catch(() => {});
          } else {
            scannerRef.current.clear();
          }
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Fetch camera devices
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setErrorMessage(null);
    setLastScanned(null);

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/environment camera if available
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('belakang') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setErrorMessage('Tidak ada perangkat kamera yang terdeteksi di perangkat Anda.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Error fetching cameras:', err);
        setErrorMessage(
          'Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin (permission) akses kamera pada peramban web.'
        );
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Start Scanner
  const startScanner = async (cameraId: string) => {
    if (!cameraId) return;

    try {
      setErrorMessage(null);
      isStoppingRef.current = false;

      // Stop existing if running
      if (scannerRef.current && scannerRef.current.isScanning) {
        isStoppingRef.current = true;
        await scannerRef.current.stop();
        isStoppingRef.current = false;
      }

      const html5QrCode = new Html5Qrcode(containerElementId);
      scannerRef.current = html5QrCode;

      const config: Html5QrcodeCameraScanConfig = {
        fps: 15,
        qrbox: { width: 260, height: 180 },
        aspectRatio: 1.333333,
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText) => {
          // Debounce same barcode within 1.5 seconds to prevent spamming
          const now = Date.now();
          const cleanCode = decodedText.trim();
          if (
            cleanCode === lastScannedCodeRef.current &&
            now - lastScanTimeRef.current < 1500
          ) {
            return;
          }

          lastScannedCodeRef.current = cleanCode;
          lastScanTimeRef.current = now;

          // Dispatch callback
          const result = onBarcodeDetected(cleanCode);

          if (result.success) {
            if (soundEnabled) playSuccessBeep();
          } else {
            if (soundEnabled) playErrorBeep();
          }

          setLastScanned({
            code: cleanCode,
            message: result.message,
            success: result.success,
            time: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          });

          // If not in continuous mode, close modal after successful scan
          if (!continuousMode && result.success) {
            setTimeout(() => {
              handleClose();
            }, 600);
          }
        },
        (errorMessage) => {
          // Ignored per-frame decode errors
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start camera scanner:', err);
      setIsScanning(false);
      setErrorMessage(
        'Gagal memulai pemindai kamera. Pastikan kamera tidak sedang dipakai aplikasi lain atau izinkan akses kamera.'
      );
    }
  };

  // Trigger start when selectedCameraId changes or modal opens
  useEffect(() => {
    if (isOpen && selectedCameraId) {
      // Small timeout to allow DOM container to render
      const timer = setTimeout(() => {
        startScanner(selectedCameraId);
      }, 200);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isOpen, selectedCameraId]);

  // Clean stop scanner
  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning && !isStoppingRef.current) {
        isStoppingRef.current = true;
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.warn('Error stopping scanner:', err);
    } finally {
      setIsScanning(false);
      isStoppingRef.current = false;
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-barcode-camera-scanner"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Pemindai Barcode Kamera</h3>
              <p className="text-[10px] text-slate-300">
                Arahkan barcode / QR produk ke area kotak pemindai
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Feed Container */}
        <div className="relative bg-black flex items-center justify-center min-h-[260px] overflow-hidden">
          {/* HTML5 QR Container */}
          <div
            id={containerElementId}
            className="w-full h-full min-h-[260px] flex items-center justify-center text-white"
          />

          {/* Scanner Overlay Visual Guidelines */}
          {isScanning && !errorMessage && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative w-64 h-44 border-2 border-blue-400/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                {/* Laser animation bar */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-bounce" />
                
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400" />

                <span className="text-[10px] bg-slate-900/80 text-blue-300 px-2 py-0.5 rounded-full font-medium tracking-wide">
                  Sejajarkan Barcode
                </span>
              </div>
            </div>
          )}

          {/* Error / Loading State */}
          {errorMessage && (
            <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center text-white space-y-3 z-10">
              <div className="p-3 bg-red-500/20 text-red-400 rounded-full">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <p className="text-xs text-slate-200 leading-relaxed max-w-xs">{errorMessage}</p>
              <button
                onClick={() => selectedCameraId && startScanner(selectedCameraId)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Hubungkan Ulang</span>
              </button>
            </div>
          )}
        </div>

        {/* Last Scanned Feedback Toast */}
        {lastScanned && (
          <div
            className={`px-4 py-2.5 flex items-center justify-between border-b transition-colors ${
              lastScanned.success
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {lastScanned.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <div className="text-xs truncate">
                <div className="font-bold flex items-center gap-1">
                  <span className="font-mono">{lastScanned.code}</span>
                  <span className="text-[10px] opacity-60">({lastScanned.time})</span>
                </div>
                <div className="text-[11px] truncate opacity-90">{lastScanned.message}</div>
              </div>
            </div>
            {lastScanned.success && (
              <span className="text-[10px] font-bold bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                +1 Kasir
              </span>
            )}
          </div>
        )}

        {/* Controls & Options Footer */}
        <div className="p-4 bg-slate-50 space-y-3">
          {/* Camera Selection */}
          {cameras.length > 1 && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Pilih Kamera Pemindai:
              </label>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
              >
                {cameras.map((cam, idx) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Kamera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode Toggles */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setContinuousMode((prev) => !prev)}
              className={`flex-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                continuousMode
                  ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Terus memindai barang berikutnya tanpa menutup modal"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Scan Beruntun: {continuousMode ? 'Aktif' : '1x Selesai'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs'
                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
              }`}
              title="Bunyi nada beep saat barcode berhasil terbaca"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Suara {soundEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-slate-500">
              Mendukung EAN-13, UPC, Code 128, Code 39, QR Code, dll.
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tutup Pemindai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
