import { AgentProfile, PosSale, PrinterSettings, Transaction } from '../types';
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
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
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
  copyLabel?: string,
  posSale?: PosSale | null
): string {
  const isPosRetail = Boolean(posSale && posSale.items && posSale.items.length > 0);
  const totalPay = isPosRetail ? posSale!.totalRevenue : (trx.nominal + trx.feeCust);
  const isVoid = trx.status === 'VOID' || (posSale ? posSale.status === 'VOID' : false);
  const maxWidth = settings.paperWidth === '58mm' ? '56mm' : '78mm';
  const fontSize = settings.paperWidth === '58mm' ? '11px' : '12px';
  const densityClass = settings.printerDensity === 'dark' ? 'font-bold' : '';

  const cash = isPosRetail
    ? (posSale?.cashReceived ?? totalPay)
    : (trx.cashReceived ?? totalPay);
  const change = isPosRetail
    ? (posSale?.changeAmount ?? (cash > totalPay ? cash - totalPay : 0))
    : (trx.changeAmount ?? 0);

  const receiptNumber = isPosRetail ? (posSale!.invoiceNumber || posSale!.id) : `#${trx.id}`;
  const cashier = isPosRetail ? (posSale!.cashierName || 'Kasir 01') : (profile.idAgent || 'Operator');
  const customer = isPosRetail ? (posSale!.customerName || 'Pelanggan Umum') : trx.cust;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Struk_${receiptNumber}</title>
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

  <div class="store-name">${profile.storeName || 'TOKO RITEL & POS'}</div>
  ${profile.receiptHeader ? `<div class="store-sub">${profile.receiptHeader}</div>` : ''}
  ${profile.address ? `<div class="store-address">${profile.address}</div>` : ''}
  <div class="store-sub">Telp/WA: ${profile.phone || '-'}</div>

  ${copyLabel ? `<div class="copy-banner">*** ${copyLabel} ***</div>` : ''}

  <div class="divider"></div>

  <div class="row">
    <span class="row-label">No. Struk:</span>
    <span class="row-value font-bold">${receiptNumber}</span>
  </div>
  <div class="row">
    <span class="row-label">Tanggal:</span>
    <span class="row-value">${isPosRetail ? posSale!.time : trx.time}</span>
  </div>
  <div class="row">
    <span class="row-label">Kasir:</span>
    <span class="row-value">${cashier}</span>
  </div>
  <div class="row">
    <span class="row-label">Pelanggan:</span>
    <span class="row-value">${customer}</span>
  </div>
  ${isPosRetail && posSale?.memberNumber ? `
  <div class="row">
    <span class="row-label">No. Member:</span>
    <span class="row-value font-bold">${posSale.memberNumber}</span>
  </div>` : ''}

  <div class="divider"></div>

  ${isVoid ? '<div class="void-badge">*** TRANSAKSI DIBATALKAN (VOID) ***</div>' : ''}

  ${isPosRetail ? `
    <!-- DAFTAR ITEM BARANG RITEL -->
    ${posSale!.items.map((it) => `
      <div style="margin-bottom: 4px;">
        <div style="font-weight: bold; text-align: left; font-size: ${fontSize}; word-break: break-word;">${it.productName.toUpperCase()}</div>
        <div style="display: flex; justify-content: space-between; font-size: ${fontSize};">
          <span>${it.qty} ${it.unit || 'PCS'} x ${formatRp(it.price)}</span>
          <span style="font-weight: bold;">${formatRp(it.subtotal)}</span>
        </div>
        ${it.discountAmount && it.discountAmount > 0 ? `
          <div style="font-size: 9.5px; padding-left: 6px;">  (Diskon Item: -${formatRp(it.discountAmount)})</div>
        ` : ''}
      </div>
    `).join('')}

    <div class="divider"></div>

    <div class="row">
      <span class="row-label">Total Item:</span>
      <span class="row-value">${posSale!.items.length} Item (${posSale!.totalQty} Qty)</span>
    </div>
    <div class="row">
      <span class="row-label">Subtotal:</span>
      <span class="row-value">${formatRp(posSale!.totalBeforeDiscount || posSale!.totalRevenue)}</span>
    </div>
    ${(posSale!.totalDiscount || 0) > 0 ? `
    <div class="row">
      <span class="row-label">Total Diskon:</span>
      <span class="row-value font-bold">-${formatRp(posSale!.totalDiscount || 0)}</span>
    </div>` : ''}
    ${posSale!.discountFromPoints && posSale!.discountFromPoints > 0 ? `
    <div class="row">
      <span class="row-label">Diskon Poin:</span>
      <span class="row-value font-bold">-${formatRp(posSale!.discountFromPoints)}</span>
    </div>` : ''}
  ` : `
    <!-- LAYANAN PERBANKAN / MINI ATM -->
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
    ${settings.showRefNumber && trx.refNumber ? `
    <div class="row">
      <span class="row-label">No. Ref:</span>
      <span class="row-value font-bold">${trx.refNumber}</span>
    </div>` : ''}

    <div class="divider"></div>

    <div class="row">
      <span class="row-label">Nominal:</span>
      <span class="row-value font-bold">${formatRp(trx.nominal)}</span>
    </div>
    <div class="row">
      <span class="row-label">Biaya Admin:</span>
      <span class="row-value">${formatRp(trx.feeCust)}</span>
    </div>
  `}

  <div class="divider-double"></div>

  <div class="total-row">
    <span>TOTAL BAYAR:</span>
    <span>${formatRp(totalPay)}</span>
  </div>

  <div class="divider"></div>

  <div class="row">
    <span class="row-label">Bayar (${isPosRetail ? (posSale!.paymentMethod || 'Tunai') : 'Tunai'}):</span>
    <span class="row-value font-bold">${formatRp(cash)}</span>
  </div>
  <div class="row" style="font-weight: bold;">
    <span class="row-label">Kembalian:</span>
    <span class="row-value">${formatRp(change)}</span>
  </div>

  ${isPosRetail && posSale?.pointsEarned ? `
  <div class="divider"></div>
  <div class="row">
    <span class="row-label">Poin Didapat:</span>
    <span class="row-value font-bold">+${posSale.pointsEarned} Poin</span>
  </div>` : ''}

  <div class="divider"></div>

  <div style="text-align: center; margin: 8px 0 4px;">
    <div style="font-family: monospace; font-size: 13px; letter-spacing: 3px; font-weight: 900;">|||| | ||||| || |||||| |||| |</div>
    <div style="font-size: 9px; letter-spacing: 1px; margin-top: 2px;">* ${receiptNumber} *</div>
  </div>

  <div class="divider"></div>

  <div class="footer-note">
    *** TERIMA KASIH TELAH BERBELANJA ***<br/>
    BARANG YANG SUDAH DIBELI TIDAK DAPAT DITUKAR / DIKEMBALIKAN KECUALI DENGAN PERJANJIAN<br/>
    SMS/WA LAYANAN: ${profile.phone || '-'}<br/>
    ${profile.receiptFooter || settings.customFooterNote || 'Simpan struk ini sebagai bukti pembayaran yang sah.'}
  </div>
</body>
</html>`;
}

/**
 * Execute Browser / System Print Dialog (Seamless multi-copy & popup fallback)
 */
export function printReceiptViaBrowser(
  trx: Transaction,
  profile: AgentProfile,
  settings: PrinterSettings,
  posSale?: PosSale | null
): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    try {
      const copiesCount = settings.printCopies || 1;
      let combinedHtml = '';

      if (copiesCount === 1) {
        combinedHtml = generateThermalReceiptHtml(trx, profile, settings, undefined, posSale);
      } else {
        const copy1 = generateThermalReceiptHtml(trx, profile, settings, 'LEMBAR PELANGGAN', posSale);
        const copy2 = generateThermalReceiptHtml(trx, profile, settings, 'LEMBAR TOKO / ARSIP', posSale);
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
  copyLabel?: string,
  posSale?: PosSale | null
): Uint8Array {
  const isPosRetail = Boolean(posSale && posSale.items && posSale.items.length > 0);
  const encoder = new TextEncoder();
  const bytes: number[] = [];

  // ESC @ (Initialize Printer)
  bytes.push(0x1B, 0x40);

  // Center Align: ESC a 1
  bytes.push(0x1B, 0x61, 0x01);

  // Double Height & Width for Store Name: GS ! 0x11
  bytes.push(0x1D, 0x21, 0x11);
  bytes.push(...encoder.encode(`${profile.storeName || (isPosRetail ? 'TOKO RITEL & POS' : 'MINI ATM AGENT')}\n`));

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
  const doubleLine = settings.paperWidth === '58mm' ? '================================\n' : '================================================\n';
  bytes.push(...encoder.encode(lineSeparator));

  // Left Align: ESC a 0
  bytes.push(0x1B, 0x61, 0x00);

  const receiptNumber = isPosRetail ? (posSale!.invoiceNumber || posSale!.id) : `#${trx.id}`;
  const cashier = isPosRetail ? (posSale!.cashierName || 'Kasir 01') : (profile.idAgent || 'Operator');
  const customer = isPosRetail ? (posSale!.customerName || 'Pelanggan Umum') : trx.cust;

  bytes.push(...encoder.encode(`No. Struk: ${receiptNumber}\n`));
  bytes.push(...encoder.encode(`Tanggal  : ${isPosRetail ? posSale!.time : trx.time}\n`));
  bytes.push(...encoder.encode(`Kasir    : ${cashier}\n`));
  bytes.push(...encoder.encode(`Pelanggan: ${customer}\n`));

  if (isPosRetail && posSale?.memberNumber) {
    bytes.push(...encoder.encode(`No. Mbr  : ${posSale.memberNumber}\n`));
  }
  if (!isPosRetail && settings.showRefNumber && trx.refNumber) {
    bytes.push(...encoder.encode(`No. Ref  : ${trx.refNumber}\n`));
  }

  bytes.push(...encoder.encode(lineSeparator));

  if (trx.status === 'VOID' || (posSale && posSale.status === 'VOID')) {
    bytes.push(0x1B, 0x61, 0x01);
    bytes.push(...encoder.encode(`*** TRANSAKSI DIBATALKAN (VOID) ***\n`));
    bytes.push(0x1B, 0x61, 0x00);
  }

  if (isPosRetail) {
    // Print item rows
    posSale!.items.forEach((it) => {
      bytes.push(...encoder.encode(`${it.productName.toUpperCase()}\n`));
      const detailStr = `  ${it.qty} ${it.unit || 'PCS'} x ${formatRp(it.price)}`;
      const subStr = formatRp(it.subtotal);
      const spaceCount = Math.max(1, (settings.paperWidth === '58mm' ? 32 : 48) - detailStr.length - subStr.length);
      bytes.push(...encoder.encode(`${detailStr}${' '.repeat(spaceCount)}${subStr}\n`));
      if (it.discountAmount && it.discountAmount > 0) {
        bytes.push(...encoder.encode(`  (Diskon: -${formatRp(it.discountAmount)})\n`));
      }
    });

    bytes.push(...encoder.encode(lineSeparator));
    bytes.push(...encoder.encode(`Total Item: ${posSale!.items.length} Item (${posSale!.totalQty} Qty)\n`));
    bytes.push(...encoder.encode(`Subtotal  : ${formatRp(posSale!.totalBeforeDiscount || posSale!.totalRevenue)}\n`));
    if ((posSale!.totalDiscount || 0) > 0) {
      bytes.push(...encoder.encode(`Diskon    : -${formatRp(posSale!.totalDiscount || 0)}\n`));
    }
    if (posSale!.discountFromPoints && posSale!.discountFromPoints > 0) {
      bytes.push(...encoder.encode(`Disc Poin : -${formatRp(posSale!.discountFromPoints)}\n`));
    }
  } else {
    bytes.push(...encoder.encode(`Layanan  : ${trx.type}\n`));
    bytes.push(...encoder.encode(`Pengirim : ${trx.cust}\n`));
    bytes.push(...encoder.encode(`Tujuan   : ${trx.target}\n`));
    bytes.push(...encoder.encode(lineSeparator));
    bytes.push(...encoder.encode(`Nominal  : ${formatRp(trx.nominal)}\n`));
    bytes.push(...encoder.encode(`Biaya Adm: ${formatRp(trx.feeCust)}\n`));
  }

  bytes.push(...encoder.encode(doubleLine));

  const totalPay = isPosRetail ? posSale!.totalRevenue : (trx.nominal + trx.feeCust);
  const cash = isPosRetail ? (posSale?.cashReceived ?? totalPay) : (trx.cashReceived ?? totalPay);
  const change = isPosRetail ? (posSale?.changeAmount ?? (cash > totalPay ? cash - totalPay : 0)) : (trx.changeAmount ?? 0);

  // Bold Total: ESC E 1
  bytes.push(0x1B, 0x45, 0x01);
  bytes.push(...encoder.encode(`TOTAL    : ${formatRp(totalPay)}\n`));
  bytes.push(0x1B, 0x45, 0x00);

  bytes.push(...encoder.encode(lineSeparator));
  bytes.push(...encoder.encode(`Bayar    : ${formatRp(cash)}\n`));
  bytes.push(...encoder.encode(`Kembali  : ${formatRp(change)}\n`));

  if (isPosRetail && posSale?.pointsEarned) {
    bytes.push(...encoder.encode(`Poin Baru: +${posSale.pointsEarned} Poin\n`));
  }

  bytes.push(...encoder.encode(lineSeparator));
  // Barcode text
  bytes.push(0x1B, 0x61, 0x01);
  bytes.push(...encoder.encode(`|||| | ||||| || |||||| ||||\n`));
  bytes.push(...encoder.encode(`* ${receiptNumber} *\n`));
  bytes.push(0x1B, 0x61, 0x00);

  if (settings.showFooter) {
    bytes.push(...encoder.encode(lineSeparator));
    bytes.push(0x1B, 0x61, 0x01);
    bytes.push(...encoder.encode(`*** TERIMA KASIH TELAH BERBELANJA ***\n`));
    bytes.push(...encoder.encode(`Barang yg dibeli tdk dpt ditukar/dikembalikan\n`));
    bytes.push(...encoder.encode(`SMS/WA: ${profile.phone || '-'}\n`));
    if (profile.receiptFooter || settings.customFooterNote) {
      bytes.push(...encoder.encode(`${profile.receiptFooter || settings.customFooterNote}\n`));
    }
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
  settings: PrinterSettings,
  posSale?: PosSale | null
): Promise<{ success: boolean; message: string }> {
  if (!activeBluetoothCharacteristic) {
    const connectResult = await connectBluetoothPrinter();
    if (!connectResult.success || !activeBluetoothCharacteristic) {
      await printReceiptViaBrowser(trx, profile, settings, posSale);
      return {
        success: false,
        message: `${connectResult.error || 'Printer Bluetooth belum terhubung'}. Dialihkan ke dialog cetak sistem.`,
      };
    }
  }

  try {
    const copies = settings.printCopies || 1;

    for (let c = 0; c < copies; c++) {
      const copyLabel = copies > 1 ? (c === 0 ? 'LEMBAR PELANGGAN' : 'LEMBAR TOKO / ARSIP') : undefined;
      const data = generateEscPosBytes(trx, profile, settings, copyLabel, posSale);

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
    await printReceiptViaBrowser(trx, profile, settings, posSale);
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
  settings: PrinterSettings,
  posSale?: PosSale | null
): Promise<{ success: boolean; message: string }> {
  if (!activeSerialWriter || !activeSerialPort) {
    const connectResult = await connectSerialPrinter();
    if (!connectResult.success || !activeSerialWriter) {
      await printReceiptViaBrowser(trx, profile, settings, posSale);
      return {
        success: false,
        message: `${connectResult.error || 'Port Serial belum dibuka'}. Dialihkan ke dialog cetak sistem.`,
      };
    }
  }

  try {
    const copies = settings.printCopies || 1;

    for (let c = 0; c < copies; c++) {
      const copyLabel = copies > 1 ? (c === 0 ? 'LEMBAR PELANGGAN' : 'LEMBAR TOKO / ARSIP') : undefined;
      const data = generateEscPosBytes(trx, profile, settings, copyLabel, posSale);

      await activeSerialWriter.write(data);

      if (c < copies - 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    return { success: true, message: `Struk berhasil dicetak via Port Serial / USB (${copies} rangkap).` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Serial write error:', errorMsg);
    await printReceiptViaBrowser(trx, profile, settings, posSale);
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
  settings: PrinterSettings,
  posSale?: PosSale | null
): { success: boolean; message: string } {
  try {
    const data = generateEscPosBytes(trx, profile, settings, undefined, posSale);
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
    printReceiptViaBrowser(trx, profile, settings, posSale);
    return { success: false, message: `Gagal RawBT: ${errorMsg}. Dialihkan ke browser print.` };
  }
}

/**
 * Unified Quick Print Master Function
 */
export async function executeQuickPrint(
  trx: Transaction,
  profile: AgentProfile,
  settings: PrinterSettings,
  posSale?: PosSale | null
): Promise<{ success: boolean; message: string }> {
  if (settings.connectionType === 'bluetooth') {
    return await printReceiptViaBluetooth(trx, profile, settings, posSale);
  } else if (settings.connectionType === 'serial') {
    return await printReceiptViaSerial(trx, profile, settings, posSale);
  } else if (settings.connectionType === 'rawbt') {
    return printReceiptViaRawBT(trx, profile, settings, posSale);
  } else {
    return await printReceiptViaBrowser(trx, profile, settings, posSale);
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
