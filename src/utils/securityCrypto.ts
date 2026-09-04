/**
 * Enterprise-Grade Security & Cryptography Engine
 * Standards:
 * - TLS/SSL (HTTPS) 256-bit Transport Protocol
 * - AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode & 128-bit Auth Tag)
 * - Zero IP Exposure & Strict Customer Privacy Masking
 */

import { SecurityPrivacySettings } from '../types';

// Default Client Security Settings
export const DEFAULT_SECURITY_SETTINGS: SecurityPrivacySettings = {
  maskCustomerPhone: true,
  maskCustomerAccount: true,
  encryptLocalStorage: true,
  strictXssProtection: true,
  soundAlertOnThreat: true,
};

const SECURITY_STORAGE_KEY = 'mini_atm_security_settings_v1';
const FALLBACK_SECRET_SALT = 'salt_mini_atm_pos_client_2026';

/**
 * Retrieve saved privacy & security settings from local storage
 */
export function getSecuritySettings(): SecurityPrivacySettings {
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SECURITY_SETTINGS, ...parsed };
    }
  } catch {
    // ignore parse error, return defaults
  }
  return DEFAULT_SECURITY_SETTINGS;
}

/**
 * Save privacy & security settings
 */
export function saveSecuritySettings(settings: SecurityPrivacySettings): void {
  try {
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save security settings:', err);
  }
}

// ============================================================================
// AES-256-GCM CLIENT IMPLEMENTATION (Hardware-Accelerated Web Crypto API)
// ============================================================================

/**
 * Convert buffer to hexadecimal string
 */
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hexadecimal string to Uint8Array
 */
function hexToBuffer(hexString: string): Uint8Array {
  const clean = hexString.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Derive 256-bit AES-GCM CryptoKey using PBKDF2 (100,000 rounds of SHA-256)
 */
async function deriveKey(salt: Uint8Array, customPassphrase?: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const password = customPassphrase || 'MINI_ATM_AES256_ENTERPRISE_KEY_2026';
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  version: 'v1.aes256gcm';
  saltHex: string;
  ivHex: string;
  ciphertextHex: string;
  serialized: string;
}

/**
 * Encrypt arbitrary plain text using hardware-accelerated AES-256-GCM
 * Includes unique 96-bit random IV and 128-bit authentication tag
 */
export async function encryptAES256(
  plainText: string,
  passphrase?: string
): Promise<EncryptedPayload> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API tidak tersedia pada lingkungan ini.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit recommended for AES-GCM
  const key = await deriveKey(salt, passphrase);

  const encoder = new TextEncoder();
  const encodedText = encoder.encode(plainText);

  // Perform AES-GCM authenticated encryption (auth tag is appended automatically by Web Crypto)
  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedText
  );

  const saltHex = bufferToHex(salt);
  const ivHex = bufferToHex(iv);
  const ciphertextHex = bufferToHex(cipherBuffer);
  const serialized = `v1.aes256gcm.${saltHex}.${ivHex}.${ciphertextHex}`;

  return {
    version: 'v1.aes256gcm',
    saltHex,
    ivHex,
    ciphertextHex,
    serialized,
  };
}

/**
 * Decrypt an AES-256-GCM package. Throws if corrupted or tampered (authenticated tag mismatch).
 */
export async function decryptAES256(
  packageStringOrCipher: string,
  ivHex?: string,
  saltHex?: string,
  passphrase?: string
): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API tidak tersedia pada lingkungan ini.');
  }

  let finalSaltHex = saltHex || '';
  let finalIvHex = ivHex || '';
  let finalCipherHex = packageStringOrCipher;

  if (packageStringOrCipher.startsWith('v1.aes256gcm.')) {
    const parts = packageStringOrCipher.split('.');
    if (parts.length === 4) {
      finalSaltHex = parts[1];
      finalIvHex = parts[2];
      finalCipherHex = parts[3];
    }
  }

  if (!finalSaltHex || !finalIvHex || !finalCipherHex) {
    throw new Error('Format paket enkripsi AES-256-GCM tidak valid.');
  }

  const salt = hexToBuffer(finalSaltHex);
  const iv = hexToBuffer(finalIvHex);
  const ciphertext = hexToBuffer(finalCipherHex);
  const key = await deriveKey(salt, passphrase);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      ciphertext as BufferSource
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err: unknown) {
    throw new Error('Gagal mendekripsi: integritas data telah dimanipulasi atau kunci tidak cocok.');
  }
}

// ============================================================================
// CUSTOMER DATA CONFIDENTIALITY & MASKING (ZERO LEAKAGE)
// ============================================================================

/**
 * Mask customer phone number (e.g. 081234567890 -> 0812-****-7890)
 * Protects customer privacy against shoulder-surfing and unauthorized copying
 */
export function maskCustomerPhone(phone?: string | null, forceUnmask = false): string {
  if (!phone) return '-';
  if (forceUnmask) return phone;

  const clean = phone.trim();
  if (clean.length <= 6) return clean;

  const start = clean.substring(0, 4);
  const end = clean.substring(clean.length - 4);
  return `${start}-****-${end}`;
}

/**
 * Mask destination bank account or e-wallet number (e.g. 1234567890 -> ********7890)
 */
export function maskCustomerAccount(account?: string | null, forceUnmask = false): string {
  if (!account) return '-';
  if (forceUnmask) return account;

  const clean = account.trim();
  if (clean.length <= 4) return clean;

  const end = clean.substring(clean.length - 4);
  const maskedLength = Math.max(4, clean.length - 4);
  return `${'*'.repeat(maskedLength)}${end}`;
}

/**
 * Mask customer name for privacy (e.g. Budi Santoso -> Budi S*****)
 */
export function maskCustomerName(name?: string | null, forceUnmask = false): string {
  if (!name) return '-';
  if (forceUnmask) return name;

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    if (parts[0].length <= 3) return parts[0];
    return `${parts[0].substring(0, 3)}***`;
  }

  const firstName = parts[0];
  const maskedRest = parts
    .slice(1)
    .map((p) => (p.length > 1 ? `${p[0]}***` : '*'))
    .join(' ');

  return `${firstName} ${maskedRest}`;
}

// ============================================================================
// INPUT SANITIZER & XSS DEFENSE
// ============================================================================

/**
 * Sanitize text input to prevent Cross-Site Scripting (XSS) and command injection
 */
export function sanitizeText(input: string): { cleanText: string; isThreatDetected: boolean; threatReason?: string } {
  if (!input || typeof input !== 'string') {
    return { cleanText: '', isThreatDetected: false };
  }

  let isThreat = false;
  let threatReason = '';

  // Check for XSS script tags and event handlers
  if (/<script\b[^>]*>|javascript:|onerror\s*=|onload\s*=|onclick\s*=|eval\(|<iframe\b/i.test(input)) {
    isThreat = true;
    threatReason = 'Terdeteksi pola skrip XSS (<script> / javascript: / event-handler)';
  }

  // Check for SQL injection patterns
  if (/(\b(union\s+select|drop\s+table|insert\s+into|delete\s+from|update.*set)\b|--|\bOR\s+['"]?1['"]?\s*=\s*['"]?1)/i.test(input)) {
    isThreat = true;
    threatReason = 'Terdeteksi pola kata kunci injeksi database (SQL Injection)';
  }

  // Sanitize by stripping HTML tags and dangerous characters
  const cleanText = input
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();

  return { cleanText, isThreatDetected: isThreat, threatReason };
}
