import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Sun, Moon } from 'lucide-react';

interface DigitalClockProps {
  variant?: 'header' | 'card' | 'compact' | 'pos';
  className?: string;
  showDate?: boolean;
  showSeconds?: boolean;
  showPeriodIcon?: boolean;
}

export const DigitalClock: React.FC<DigitalClockProps> = ({
  variant = 'header',
  className = '',
  showDate = true,
  showSeconds = true,
  showPeriodIcon = true,
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const [blink, setBlink] = useState<boolean>(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setBlink((prev) => !prev);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const hourNum = time.getHours();

  // Day and Date formatting in Indonesian
  const dayName = time.toLocaleDateString('id-ID', { weekday: 'long' });
  const dateFormatted = time.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const fullDateFormatted = time.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Timezone determination (Indonesia commonly WIB/WITA/WIT)
  const tzOffset = -time.getTimezoneOffset() / 60;
  let tzLabel = 'WIB';
  if (tzOffset === 8) tzLabel = 'WITA';
  else if (tzOffset === 9) tzLabel = 'WIT';
  else if (tzOffset !== 7) tzLabel = `GMT${tzOffset >= 0 ? '+' : ''}${tzOffset}`;

  const isNight = hourNum >= 18 || hourNum < 6;

  // Render based on variant
  if (variant === 'card' || variant === 'pos') {
    return (
      <div
        id="digitalClockCard"
        className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 border border-slate-700 shadow-md flex items-center justify-between gap-4 select-none ${className}`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner shrink-0">
            {showPeriodIcon && isNight ? (
              <Moon className="w-5 h-5 text-indigo-300" />
            ) : (
              <Sun className="w-5 h-5 text-amber-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">
                {dayName}, {fullDateFormatted}
              </span>
              <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30">
                {tzLabel}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white drop-shadow-xs">
                {hours}
                <span className={`transition-opacity duration-300 text-blue-400 ${blink ? 'opacity-100' : 'opacity-30'}`}>:</span>
                {minutes}
              </span>
              {showSeconds && (
                <span className="text-sm font-mono font-bold text-blue-300">
                  <span className="text-blue-400/50">:</span>
                  {seconds}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right border-l border-slate-700/80 pl-4">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Real-Time
          </span>
          <span className="text-xs text-slate-400 font-medium mt-0.5">
            Jam Operasional Kasir
          </span>
        </div>
      </div>
    );
  }

  // Header compact badge variant (Default)
  return (
    <div
      id="digitalClockHeader"
      title={`Waktu Sistem: ${dayName}, ${fullDateFormatted} - ${hours}:${minutes}:${seconds} ${tzLabel}`}
      className={`flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-slate-800 shadow-xs select-none ${className}`}
    >
      {showPeriodIcon && (
        <div className="text-blue-400 shrink-0">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
        </div>
      )}

      {showDate && (
        <div className="hidden xl:flex items-center gap-1 text-[11px] font-medium text-slate-300 pr-2 border-r border-slate-700/80">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{dayName.substring(0, 3)}, {dateFormatted}</span>
        </div>
      )}

      {/* Digits Display */}
      <div className="flex items-center font-mono font-bold text-xs sm:text-sm tracking-tight text-white">
        <span className="text-slate-100">{hours}</span>
        <span className={`text-blue-400 font-extrabold px-0.5 transition-opacity duration-300 ${blink ? 'opacity-100' : 'opacity-20'}`}>
          :
        </span>
        <span className="text-slate-100">{minutes}</span>
        {showSeconds && (
          <>
            <span className="text-blue-400/60 font-extrabold px-0.5">:</span>
            <span className="text-emerald-400 text-xs">{seconds}</span>
          </>
        )}
      </div>

      <span className="text-[9px] font-bold bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded border border-blue-400/30 hidden sm:inline font-mono">
        {tzLabel}
      </span>
    </div>
  );
};
