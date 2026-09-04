/**
 * Real-Time Intrusion & Threat Detector Engine
 * Monitors suspicious activities on both backend API responses and frontend user interactions
 */

import { SecurityThreatItem } from '../types';
import { getSecuritySettings } from './securityCrypto';

const THREATS_STORAGE_KEY = 'mini_atm_threat_logs_v1';

// Initial baseline log
const INITIAL_THREAT_LOGS: SecurityThreatItem[] = [
  {
    id: 'SEC-CORE-001',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    threatType: 'UNAUTHORIZED_ACCESS',
    severity: 'RENDAH',
    description: 'Enkripsi AES-256-GCM dan sistem pertahanan anti-retas aktif. Pengawasan celah keamanan dimulai.',
    status: 'DIMURNIKAN',
    source: 'Enterprise Shield WAF',
  },
];

type ThreatListener = (threats: SecurityThreatItem[], latestThreat: SecurityThreatItem | null) => void;
const listeners: Set<ThreatListener> = new Set();

let cachedThreats: SecurityThreatItem[] | null = null;
let currentActiveAlert: SecurityThreatItem | null = null;

export function getThreatLogs(): SecurityThreatItem[] {
  if (cachedThreats) return cachedThreats;
  try {
    const raw = localStorage.getItem(THREATS_STORAGE_KEY);
    if (raw) {
      cachedThreats = JSON.parse(raw);
      return cachedThreats!;
    }
  } catch {
    // fallback
  }
  cachedThreats = [...INITIAL_THREAT_LOGS];
  return cachedThreats;
}

function persistThreats(threats: SecurityThreatItem[]): void {
  cachedThreats = threats;
  try {
    localStorage.setItem(THREATS_STORAGE_KEY, JSON.stringify(threats.slice(0, 50)));
  } catch {
    // ignore
  }
}

/**
 * Trigger an audible warning tone (safe Web Audio API, no external mp3 needed)
 */
function playThreatTone() {
  try {
    const settings = getSecuritySettings();
    if (!settings.soundAlertOnThreat) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25); // ramp down to A4

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {
    // Audio might be blocked by browser autoplay policy before gesture, ignore
  }
}

/**
 * Register a suspicious access or detected threat
 */
export function recordThreat(threat: Omit<SecurityThreatItem, 'id' | 'timestamp'>): SecurityThreatItem {
  const newThreat: SecurityThreatItem = {
    id: `SEC-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    ...threat,
  };

  const logs = getThreatLogs();
  const updatedLogs = [newThreat, ...logs.slice(0, 49)];
  persistThreats(updatedLogs);
  currentActiveAlert = newThreat;

  playThreatTone();

  // Notify active listeners
  listeners.forEach((fn) => fn(updatedLogs, newThreat));

  // Asynchronously report to backend without blocking
  try {
    fetch('/api/security/report-threat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threatType: newThreat.threatType,
        description: newThreat.description,
        severity: newThreat.severity,
      }),
    }).catch(() => {
      // Backend might be offline or client-only mode, safe to ignore
    });
  } catch {
    // Ignore network error
  }

  return newThreat;
}

/**
 * Subscribe to threat events
 */
export function subscribeToThreats(callback: ThreatListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Dismiss the current active warning banner
 */
export function dismissActiveAlert(): void {
  currentActiveAlert = null;
  const logs = getThreatLogs();
  listeners.forEach((fn) => fn(logs, null));
}

/**
 * Clear all acknowledged threat logs (Admin only)
 */
export function clearAllThreatLogs(): void {
  cachedThreats = [...INITIAL_THREAT_LOGS];
  persistThreats(cachedThreats);
  currentActiveAlert = null;

  // Inform backend
  try {
    fetch('/api/security/clear-alerts', { method: 'POST' }).catch(() => {});
  } catch {
    // ignore
  }

  listeners.forEach((fn) => fn(cachedThreats!, null));
}

/**
 * Check if the active alert is present
 */
export function getActiveAlert(): SecurityThreatItem | null {
  return currentActiveAlert;
}
