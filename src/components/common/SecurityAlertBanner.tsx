import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight, X, Lock, CheckCircle2 } from 'lucide-react';
import { SecurityThreatItem } from '../../types';

interface SecurityAlertBannerProps {
  alert: SecurityThreatItem | null;
  onDismiss: () => void;
  onOpenSecurityCenter?: () => void;
}

export const SecurityAlertBanner: React.FC<SecurityAlertBannerProps> = ({
  alert,
  onDismiss,
  onOpenSecurityCenter,
}) => {
  if (!alert) return null;

  const isCritical = alert.severity === 'KRITIS';
  const isHigh = alert.severity === 'TINGGI';

  const bgColor = isCritical
    ? 'bg-rose-950/95 border-rose-600 text-rose-50'
    : isHigh
    ? 'bg-amber-950/95 border-amber-600 text-amber-50'
    : 'bg-slate-900/95 border-teal-500 text-teal-50';

  const iconColor = isCritical ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-teal-400';
  const badgeBg = isCritical ? 'bg-rose-600 text-white' : isHigh ? 'bg-amber-600 text-slate-950' : 'bg-teal-600 text-white';

  return (
    <div
      role="alert"
      id="security-threat-banner"
      className={`rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-top-3 duration-200 ${bgColor}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-black/40 border border-white/10 shrink-0 mt-0.5 sm:mt-0">
            {isCritical ? (
              <ShieldAlert className={`w-5 h-5 ${iconColor} animate-pulse`} />
            ) : (
              <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${badgeBg}`}>
                PERINGATAN KEAMANAN: {alert.severity}
              </span>
              <span className="text-[11px] opacity-75 font-mono">
                {alert.timestamp}
              </span>
              <span className="text-[10px] bg-black/30 border border-white/10 px-2 py-0.5 rounded text-slate-300 font-mono">
                Status: {alert.status}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold leading-snug">
              {alert.description}
            </p>

            <div className="flex items-center gap-2 text-[11px] opacity-80 pt-0.5">
              <Lock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>
                Proteksi TLS &amp; Enkripsi AES-256 melindungi data pelanggan dari kebocoran.
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {onOpenSecurityCenter && (
            <button
              type="button"
              onClick={onOpenSecurityCenter}
              id="btn-view-security-center"
              className="text-xs font-bold px-3 py-1.5 bg-white text-slate-950 hover:bg-slate-100 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Pusat Keamanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onDismiss}
            title="Tutup peringatan ini"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
