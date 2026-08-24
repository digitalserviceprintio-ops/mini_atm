import { AgentProfile, PrinterSettings, Transaction } from '../types';
import { formatRp } from './formatters';

// Web Bluetooth API Interfaces
export interface BluetoothDevice {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

export interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect: () => Promise<BluetoothRemoteGATTServer>;
  disconnect: () => void;
  getPrimaryServices: () => Promise<BluetoothRemoteGATTService[]>;
}

export interface BluetoothRemoteGATTService {
  uuid: string;
  getCharacteristics: () => Promise<BluetoothRemoteGATTCharacteristic[]>;
}

export interface BluetoothRemoteGATTCharacteristic {
  uuid: string;
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValue: (value: BufferSource) => Promise<void>;
  writeValueWithoutResponse: (value: BufferSource) => Promise<void>;
}

// Web Serial API Interfaces
export interface SerialPort {
  open: (options: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  writable: WritableStream<Uint8Array> | null;
  readable: ReadableStream<Uint8Array> | null;
  getInfo?: () => { usbVendorId?: number; usbProductId?: number };
}

// Global active hardware connection references
let activeBluetoothDevice: BluetoothDevice | null = null;
let activeBluetoothServer: BluetoothRemoteGATTServer | null = null;
let activeBluetoothCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
let activeSerialPort: SerialPort | null = null;
let activeSerialWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;

// Verified BLE Thermal Printer GATT Services (No Blocklisted UUIDs)
export const VALID_BLE_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer Service
  '0000ff00-0000-1000-8000-00805f9b34fb', // POS-58 / GOOJPRT / MPT
  '0000fff0-0000-1000-8000-00805f9b34fb', // ESC/POS BLE Service
  '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent IoT Thermal
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent Transmission
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Mini POS Custom
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Serial
];

export function isInIframe(): boolean {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
}

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

export function getActiveBluetoothDeviceName(): string | null {
  if (activeBluetoothDevice && activeBluetoothDevice.gatt?.connected) {
    return activeBluetoothDevice.name || 'Printer Bluetooth (Terhubung)';
  }
  return null;
}

export function getActiveSerialPortName(): string | null {
  if (activeSerialPort) {
    return 'Port Serial / USB Thermal (Terhubung)';
  }
  return null;
}

/**
 * Connect to a Web Bluetooth Thermal Printer (BLE ESC/POS)
 */
export async function connectBluetoothPrinter(): Promise<{
  success: boolean;
  deviceName?: string;
  error?: string;
  isIframeBlocked?: boolean;
}> {
  if (isInIframe()) {
    return {
      success: false,
      isIframeBlocked: true,
      error:
        'Akses Bluetooth dibatasi oleh iframe browser. Silakan klik tombol "Buka di Tab Baru" di atas untuk menghubungkan printer.',
    };
  }

  if (!isWebBluetoothSupported()) {
    return {
      success: false,
      error:
        'Browser Anda belum mendukung Web Bluetooth. Gunakan Google Chrome atau Microsoft Edge versi terbaru.',
    };
  }

  try {
    const nav = navigator as unknown as {
      bluetooth: {
        requestDevice: (options: object) => Promise<BluetoothDevice>;
      };
    };

    // First attempt: Scan all devices with valid BLE thermal services
    let device: BluetoothDevice;
    try {
      device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: VALID_BLE_PRINTER_SERVICES,
      });
    } catch (scanErr: unknown) {
      const scanMsg = scanErr instanceof Error ? scanErr.message : String(scanErr);
      if (scanMsg.includes('User cancelled') || scanMsg.includes('cancelled')) {
        return { success: false, error: 'Pencarian perangkat Bluetooth dibatalkan oleh pengguna.' };
      }
      // Fallback request without filters
      device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
      });
    }

    if (!device || !device.gatt) {
      return { success: false, error: 'Perangkat Bluetooth tidak merespons koneksi GATT.' };
    }

    const server = await device.gatt.connect();
    activeBluetoothDevice = device;
    activeBluetoothServer = server;

    // Search for writable characteristic across primary services
    let foundChar: BluetoothRemoteGATTCharacteristic | null = null;

    try {
      const services = await server.getPrimaryServices();
      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              foundChar = char;
              break;
            }
          }
          if (foundChar) break;
        } catch {
          continue;
        }
      }
    } catch (serviceErr) {
      console.warn('Could not inspect all services directly:', serviceErr);
    }

    if (foundChar) {
      activeBluetoothCharacteristic = foundChar;
    }

    const devName = device.name || 'Printer Bluetooth';
    return {
      success: true,
      deviceName: devName,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    if (errorMsg.includes('User cancelled') || errorMsg.includes('cancelled')) {
      return { success: false, error: 'Pencarian Bluetooth dibatalkan.' };
    }

    if (errorMsg.includes('cross-origin iframe') || errorMsg.includes('Permissions Policy')) {
      return {
        success: false,
        isIframeBlocked: true,
        error:
          'Browser memblokir pemindaian Bluetooth di dalam iframe. Buka aplikasi di Tab Baru untuk mengizinkan deteksi printer.',
      };
    }

    return {
      success: false,
      error: `Gagal mendeteksi printer: ${errorMsg}. Pastikan Bluetooth HP/Laptop dan Printer Thermal menyala.`,
    };
  }
}

export function disconnectBluetoothPrinter(): void {
  if (activeBluetoothServer && activeBluetoothServer.connected) {
    activeBluetoothServer.disconnect();
  }
  activeBluetoothDevice = null;
  activeBluetoothServer = null;
  activeBluetoothCharacteristic = null;
}

/**
 * Connect to a USB / Virtual Bluetooth Serial COM Port (Web Serial API)
 */
export async function connectSerialPrinter(): Promise<{
  success: boolean;
  portName?: string;
  error?: string;
  isIframeBlocked?: boolean;
}> {
  if (isInIframe()) {
    return {
      success: false,
      isIframeBlocked: true,
      error:
        'Akses Serial/USB dibatasi di dalam iframe. Silakan buka aplikasi di Tab Baru.',
    };
  }

  if (!isWebSerialSupported()) {
    return {
      success: false,
      error:
        'Web Serial API tidak didukung di browser ini. Gunakan Google Chrome / Edge di desktop.',
    };
  }

  try {
    const nav = navigator as unknown as {
      serial: {
        requestPort: (options?: object) => Promise<SerialPort>;
      };
    };

    const port = await nav.serial.requestPort();
    await port.open({ baudRate: 9600 }); // Default 9600 standard ESC/POS thermal baud

    activeSerialPort = port;
    if (port.writable) {
      activeSerialWriter = port.writable.getWriter();
    }

    return {
      success: true,
      portName: 'Port Serial / USB Thermal Terhubung',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('cancelled') || errorMsg.includes('canceled')) {
      return { success: false, error: 'Pemilihan port serial dibatalkan.' };
    }
    return { success: false, error: `Gagal membuka Port Serial: ${errorMsg}` };
  }
}

export async function disconnectSerialPrinter(): Promise<void> {
  try {
    if (activeSerialWriter) {
      activeSerialWriter.releaseLock();
      activeSerialWriter = null;
    }
    if (activeSerialPort) {
      await activeSerialPort.close();
      activeSerialPort = null;
    }
  } catch (err) {
    console.warn('Error disconnecting serial:', err);
  }
}

/**
 * Generate Standalone HTML Document for Thermal Printers (ESC/POS Ready)
 */
export function generateThermalReceiptHtml(
  trx: Transaction,
  profile: AgentProfile,
  settings: PrinterSettings,
  copyLabel?: string
): string {
  const totalPay = trx.nominal + trx.feeCust;
  const isVoid = trx.status === 'VOID';
  const maxWidth = settings.paperWidth === '58mm' ? '56mm' : '78mm';
  const fontSize = settings.paperWidth === '58mm' ? '11px' : '12px';
  const densityClass = settings.printerDensity === 'dark' ? 'font-bold' : '';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Struk_${trx.id}</title>
  <style>
    @page {
      size: ${settings.paperWidth} auto;
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Courier New', Courier, monospace, monospace;
      font-size: ${fontSize};
      line-height: 1.35;
      color: #000000;
      background-color: #ffffff;
      width: ${maxWidth};
      margin: 0 auto;
      padding: 3mm 2mm;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: none;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: bold; }
    .font-extrabold { font-weight: 900; }
    .uppercase { text-transform: uppercase; }

    .logo-container {
      text-align: center;
      margin-bottom: 3px;
    }
    .logo-img {
      max-height: 38px;
      max-width: 120px;
      object-fit: contain;
      filter: grayscale(100%) contrast(180%);
    }

    .store-name {
      font-size: ${settings.paperWidth === '58mm' ? '13px' : '15px'};
      font-weight: bold;
      text-align: center;
      margin-bottom: 2px;
      letter-spacing: -0.2px;
    }
    .store-sub {
      font-size: 10px;
      text-align: center;
      margin-bottom: 2px;
    }
    .store-address {
      font-size: 9px;
      text-align: center;
      line-height: 1.2;
      margin-bottom: 3px;
    }

    .copy-banner {
      font-size: 10px;
      font-weight: bold;
      text-align: center;
      border: 1px dashed #000;
      padding: 2px 0;
      margin: 3px 0 5px 0;
    }

    .divider {
      border-top: 1px dashed #000;
      margin: 4px 0;
    }
    .divider-double {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      height: 3px;
      margin: 4px 0;
    }

    .row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2px;
      font-size: ${fontSize};
    }
    .row-label {
      flex: 1;
      color: #000;
    }
    .row-value {
      text-align: right;
      font-weight: 600;
      word-break: break-all;
    }

    .void-badge {
      border: 1px solid #000;
      padding: 3px 0;
      text-align: center;
      font-weight: bold;
      font-size: 11px;
      margin: 4px 0;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: ${settings.paperWidth === '58mm' ? '13px' : '14px'};
      font-weight: bold;
      margin: 4px 0;
    }

    .footer-note {
      font-size: 9px;
      text-align: center;
      margin-top: 6px;
      line-height: 1.25;
      white-space: pre-line;
    }

    @media print {
      body {
        width: 100% !important;
        max-width: ${maxWidth} !important;
        margin: 0 !important;
        padding: 1.5mm !important;
      }
    }
  </style>
</head>
<body class="${densityClass}">
  ${settings.showLogo && profile.logoUrl ? `
    <div class="logo-container">
      <img src="${profile.logoUrl}" class="logo-img" alt="Logo" />
    </div>
  ` : ''}

  <div class="store-name">${profile.storeName || 'MINI ATM AGENT'}</div>
  ${profile.receiptHeader ? `<div class="store-sub">${profile.receiptHeader}</div>` : ''}
  ${profile.address ? `<div class="store-address">${profile.address}</div>` : ''}
  <div class="store-sub">Telp/WA: ${profile.phone || '-'}</div>

  ${copyLabel ? `<div class="copy-banner">*** ${copyLabel} ***</div>` : ''}

  <div class="divider"></div>

  <div class="row">
    <span class="row-label">Tgl/Waktu:</span>
    <span class="row-value">${trx.time}</span>
  </div>
  <div class="row">
    <span class="row-label">No. Trx:</span>
    <span class="row-value font-bold">#${trx.id}</span>
  </div>

  ${settings.showIdAgent ? `
  <div class="row">
    <span class="row-label">ID Agen:</span>
    <span class="row-value">${profile.idAgent || 'BRI-9821-4402'}</span>
  </div>` : ''}

  ${settings.showRefNumber && trx.refNumber ? `
  <div class="row">
    <span class="row-label">No. Ref:</span>
    <span class="row-value font-bold">${trx.refNumber}</span>
  </div>` : ''}

  <div class="divider"></div>

  ${isVoid ? '<div class="void-badge">*** TRANSAKSI BATAL (VOID) ***</div>' : ''}

  <div class="row">
    <span class="row-label">Layanan:</span>
    <span class="row-value font-bold">${trx.type}</span>
  </div>
  <div class="row">
    <span class="row-label">Pengirim:</span>
    <span class="row-value">${trx.cust}</span>
  </div>
  <div class="row">
    <span class="row-label">Tujuan/Rek:</span>
    <span class="row-value">${trx.target}</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span class="row-label">Nominal:</span>
    <span class="row-value font-bold">${formatRp(trx.nominal)}</span>
  </div>
  <div class="row">
    <span class="row-label">Biaya Admin:</span>
    <span class="row-value">${formatRp(trx.feeCust)}</span>
  </div>

  <div class="divider-double"></div>

  <div class="total-row">
    <span>TOTAL BAYAR:</span>
    <span>${formatRp(totalPay)}</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span class="row-label">Status:</span>
    <span class="row-value font-bold">${isVoid ? 'VOID / BATAL' : 'BERHASIL / SUKSES'}</span>
  </div>

  ${settings.showNotes && trx.notes ? `
  <div class="row" style="margin-top: 3px;">
    <span class="row-label">Catatan:</span>
    <span class="row-value" style="font-size: 9px;">${trx.notes}</span>
  </div>` : ''}

  ${settings.showFooter ? `
  <div class="divider"></div>
  <div class="footer-note">${profile.receiptFooter || settings.customFooterNote}</div>` : ''}
</body>
</html>`;
}

/**
 * Execute Browser / System Print Dialog (Seamless multi-copy & popup fallback)
 */
export function printReceiptViaBrowser(
  trx: Transaction,
  profile: AgentProfile,
  settings: PrinterSettings
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    try {
      const copiesCount = settings.printCopies || 1;
      let combinedHtml = '';

      if (copiesCount === 1) {
        combinedHtml = generateThermalReceiptHtml(trx, profile, settings);
      } else {
        const copy1 = generateThermalReceiptHtml(trx, profile, settings, 'LEMBAR NASABAH');
        const copy2 = generateThermalReceiptHtml(trx, profile, settings, 'LEMBAR ARSIP OUTLET');
        combinedHtml = `${copy1}<div style="page-break-before: always; margin-top: 15px;"></div>${copy2}`;
      }

      const existingFrame = document.getElementById('thermal-print-frame');
      if (existingFrame) existingFrame.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'thermal-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      iframe.style.zIndex = '-9999';

      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!frameDoc || !iframe.contentWindow) {
        throw new Error('Frame unavailable');
      }

      frameDoc.open();
      frameDoc.write(combinedHtml);
      frameDoc.close();

      const triggerPrint = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve({ success: true, message: 'Dialog printer sistem telah dibuka.' });
        } catch {
          openPopupPrint(combinedHtml);
          resolve({ success: true, message: 'Dibuka di jendela cetak popup.' });
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) iframe.remove();
          }, 30000);
        }
      };

      if (frameDoc.readyState === 'complete') {
        setTimeout(triggerPrint, 150);
      } else {
        iframe.onload = () => setTimeout(triggerPrint, 150);
      }
    } catch {
      window.print();
      resolve({ success: true, message: 'Memicu window.print() langsung.' });
    }
  });
}

export function openPopupPrint(htmlContent: string): void {
  const printWindow = window.open('', '_blank', 'width=420,height=600,menubar=no,toolbar=no,location=no');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

/**
 * Generate ESC/POS Byte Array for direct Bluetooth / Serial / RawBT printing
 */
export function generateEscPosBytes(
  trx: Transaction,
  profile: AgentProfile,
  settings: PrinterSettings,
  copyLabel?: string
): Uint8Array {
  const encoder = new TextEncoder();
  const bytes: number[] = [];

  // ESC @ (Initialize Printer)
  bytes.push(0x1B, 0x40);

  // Center Align: ESC a 1
  bytes.push(0x1B, 0x61, 0x01);

  // Double Height & Width for Store Name: GS ! 0x11
  bytes.push(0x1D, 0x21, 0x11);
  bytes.push(...encoder.encode(`${profile.storeName || 'MINI ATM AGENT'}\n`));

  // Normal Font: GS ! 0x00
  bytes.push(0x1D, 0x21, 0x00);

  if (profile.receiptHeader) {
    bytes.push(...encoder.encode(`${profile.receiptHeader}\n`));
  }
  if (profile.address) {
    bytes.push(...encoder.encode(`${profile.address}\n`));
  }
  bytes.push(...encoder.encode(`Telp/WA: ${profile.phone || '-'}\n`));

  if (copyLabel) {
    bytes.push(...encoder.encode(`*** ${copyLabel} ***\n`));
  }

  // Separator Line
  const lineSeparator = settings.paperWidth === '58mm' ? '--------------------------------\n' : '------------------------------------------------\n';
  bytes.push(...encoder.encode(lineSeparator));

  // Left Align: ESC a 0
  bytes.push(0x1B, 0x61, 0x00);

  bytes.push(...encoder.encode(`Waktu    : ${trx.time}\n`));
  bytes.push(...encoder.encode(`No. Trx  : #${trx.id}\n`));
  if (settings.showIdAgent) {
    bytes.push(...encoder.encode(`ID Agen  : ${profile.idAgent || 'BRI-9821'}\n`));
  }
  if (settings.showRefNumber && trx.refNumber) {
    bytes.push(...encoder.encode(`No. Ref  : ${trx.refNumber}\n`));
  }

  bytes.push(...encoder.encode(lineSeparator));

  if (trx.status === 'VOID') {
    bytes.push(0x1B, 0x61, 0x01);
    bytes.push(...encoder.encode(`*** TRANSAKSI DIBATALKAN (VOID) ***\n`));
    bytes.push(0x1B, 0x61, 0x00);
  }

  bytes.push(...encoder.encode(`Layanan  : ${trx.type}\n`));
  bytes.push(...encoder.encode(`Pengirim : ${trx.cust}\n`));
  bytes.push(...encoder.encode(`Tujuan   : ${trx.target}\n`));

  bytes.push(...encoder.encode(lineSeparator));

  bytes.push(...encoder.encode(`Nominal  : ${formatRp(trx.nominal)}\n`));
  bytes.push(...encoder.encode(`Biaya Adm: ${formatRp(trx.feeCust)}\n`));

  const doubleLine = settings.paperWidth === '58mm' ? '================================\n' : '================================================\n';
  bytes.push(...encoder.encode(doubleLine));

  // Bold Total: ESC E 1
  bytes.push(0x1B, 0x45, 0x01);
  bytes.push(...encoder.encode(`TOTAL    : ${formatRp(trx.nominal + trx.feeCust)}\n`));
  bytes.push(0x1B, 0x45, 0x00);

  bytes.push(...encoder.encode(lineSeparator));
  bytes.push(...encoder.encode(`Status   : ${trx.status === 'VOID' ? 'VOID/BATAL' : 'BERHASIL/SUKSES'}\n`));

  if (settings.showNotes && trx.notes) {
    bytes.push(...encoder.encode(`Catatan  : ${trx.notes}\n`));
  }

  if (settings.showFooter) {
    bytes.push(...encoder.encode(lineSeparator));
    bytes.push(0x1B, 0x61, 0x01);
    bytes.push(...encoder.encode(`${profile.receiptFooter || settings.customFooterNote}\n`));
  }

  // Feed lines
  bytes.push(0x1B, 0x64, 0x04);

  if (settings.autoCut) {
    bytes.push(0x1D, 0x56, 0x00);
  }

  return new Uint8Array(bytes);
}

/**
 * Print via Web Bluetooth Characteristic
 */
export async function printReceiptViaBluetooth(
  trx: Transaction,
  profile: AgentProfile,
  settings: PrinterSettings
): Promise<{ success: boolean; message: string }> {
  if (!activeBluetoothCharacteristic) {
    const connectResult = await connectBluetoothPrinter();
    if (!connectResult.success || !activeBluetoothCharacteristic) {
      await printReceiptViaBrowser(trx, profile, settings);
      return {
        success: false,
        message: `${connectResult.error || 'Printer Bluetooth belum terhubung'}. Dialihkan ke dialog cetak sistem.`,
      };
    }
  }

  try {
    const copies = settings.printCopies || 1;

    for (let c = 0; c < copies; c++) {
      const copyLabel = copies > 1 ? (c === 0 ? 'LEMBAR NASABAH' : 'LEMBAR ARSIP OUTLET') : undefined;
      const data = generateEscPosBytes(trx, profile, settings, copyLabel);

      const chunkSize = 80;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        if (activeBluetoothCharacteristic.properties.writeWithoutResponse) {
          await activeBluetoothCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await activeBluetoothCharacteristic.writeValue(chunk);
        }
        await new Promise((r) => setTimeout(r, 25));
      }

      if (c < copies - 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    return { success: true, message: `Struk berhasil dikirim ke printer Bluetooth (${copies} rangkap).` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Bluetooth write error:', errorMsg);
    await printReceiptViaBrowser(trx, profile, settings);
    return {
      success: false,
      message: `Gagal Bluetooth: ${errorMsg}. Dialihkan ke dialog cetak sistem.`,
    };
  }
}

/**
 * Print via Web Serial / USB Port
 */
export async function printReceiptViaSerial(
  trx: Transaction,
  profile: AgentProfile,
  settings: PrinterSettings
): Promise<{ success: boolean; message: string }> {
  if (!activeSerialWriter || !activeSerialPort) {
    const connectResult = await connectSerialPrinter();
    if (!connectResult.success || !activeSerialWriter) {
      await printReceiptViaBrowser(trx, profile, settings);
      return {
        success: false,
        message: `${connectResult.error || 'Port Serial belum dibuka'}. Dialihkan ke dialog cetak sistem.`,
      };
    }
  }

  try {
    const copies = settings.printCopies || 1;

    for (let c = 0; c < copies; c++) {
      const copyLabel = copies > 1 ? (c === 0 ? 'LEMBAR NASABAH' : 'LEMBAR ARSIP OUTLET') : undefined;
      const data = generateEscPosBytes(trx, profile, settings, copyLabel);

      await activeSerialWriter.write(data);

      if (c < copies - 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    return { success: true, message: `Struk berhasil dicetak via Port Serial / USB (${copies} rangkap).` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Serial write error:', errorMsg);
    await printReceiptViaBrowser(trx, profile, settings);
    return {
      success: false,
      message: `Gagal cetak Serial: ${errorMsg}. Dialihkan ke dialog cetak browser.`,
    };
  }
}

/**
 * Print via Android RawBT Mobile App Intent
 */
export function printReceiptViaRawBT(
  trx: Transaction,
  profile: AgentProfile,
  settings: PrinterSettings
): { success: boolean; message: string } {
  try {
    const data = generateEscPosBytes(trx, profile, settings);
    let binary = '';
    const bytes = new Uint8Array(data);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = window.btoa(binary);
    const rawbtUrl = `rawbt:data:application/octet-stream;base64,${base64Data}`;
    window.location.href = rawbtUrl;
    return { success: true, message: 'Perintah cetak dikirim ke aplikasi RawBT.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    printReceiptViaBrowser(trx, profile, settings);
    return { success: false, message: `Gagal RawBT: ${errorMsg}. Dialihkan ke browser print.` };
  }
}

/**
 * Unified Quick Print Master Function
 */
export async function executeQuickPrint(
  trx: Transaction,
  profile: AgentProfile,
  settings: PrinterSettings
): Promise<{ success: boolean; message: string }> {
  if (settings.connectionType === 'bluetooth') {
    return await printReceiptViaBluetooth(trx, profile, settings);
  } else if (settings.connectionType === 'serial') {
    return await printReceiptViaSerial(trx, profile, settings);
  } else if (settings.connectionType === 'rawbt') {
    return printReceiptViaRawBT(trx, profile, settings);
  } else {
    return await printReceiptViaBrowser(trx, profile, settings);
  }
}

/**
 * Execute Test Print to verify printer setup
 */
export async function executeTestPrint(
  profile: AgentProfile,
  settings: PrinterSettings
): Promise<{ success: boolean; message: string }> {
  const dummyTrx: Transaction = {
    id: 'TEST-001',
    time: new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    type: 'TARIK TUNAI',
    cust: 'Uji Coba Printer',
    target: 'Outlet Agen BRILink',
    nominal: 100000,
    feeCust: 3000,
    feeAdmin: 0,
    status: 'SUCCESS',
    accountId: 'acc1',
    refNumber: 'TEST-PRINT-OK',
    notes: 'Uji Coba Cetak Thermal Berhasil',
  };

  return await executeQuickPrint(dummyTrx, profile, settings);
}
