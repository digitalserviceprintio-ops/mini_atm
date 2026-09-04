import React from 'react';

interface TransactionVectorIllustrationProps {
  className?: string;
}

export const TransactionVectorIllustration: React.FC<TransactionVectorIllustrationProps> = ({
  className = 'w-full h-auto',
}) => {
  return (
    <svg
      viewBox="0 0 560 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Ilustrasi Transaksi Kasir Mini ATM & POS"
    >
      <defs>
        {/* Soft Background Radial Gradient */}
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#eff6ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Counter Gradient */}
        <linearGradient id="counterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        {/* Counter Top Gradient */}
        <linearGradient id="counterTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>

        {/* Screen Gradient */}
        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        {/* Card Gradient */}
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Emerald Glow */}
        <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Blue Pill Gradient */}
        <linearGradient id="bluePill" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        {/* Drop Shadows */}
        <filter id="shadowSm" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.08" />
        </filter>
        <filter id="shadowBadge" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1e40af" floodOpacity="0.14" />
        </filter>
      </defs>

      {/* 1. Ambient Background Aura */}
      <circle cx="280" cy="190" r="170" fill="url(#bgGlow)" />
      
      {/* Subtle Grid Dots */}
      <g opacity="0.25" fill="#3b82f6">
        <circle cx="80" cy="70" r="2.5" />
        <circle cx="110" cy="70" r="2.5" />
        <circle cx="80" cy="100" r="2.5" />
        <circle cx="110" cy="100" r="2.5" />
        <circle cx="450" cy="70" r="2.5" />
        <circle cx="480" cy="70" r="2.5" />
        <circle cx="450" cy="100" r="2.5" />
        <circle cx="480" cy="100" r="2.5" />
      </g>

      {/* 2. Floating Financial Icons & Badges */}
      {/* Verified Shield Badge (Top Left) */}
      <g filter="url(#shadowBadge)" transform="translate(60, 45)">
        <rect x="0" y="0" width="125" height="38" rx="19" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
        <circle cx="20" cy="19" r="12" fill="#dcfce7" />
        <path d="M15 19L19 23L26 15" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="38" y="18" fill="#0f172a" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">100% AMAN</text>
        <text x="38" y="28" fill="#64748b" fontSize="8" fontFamily="sans-serif">Terenkripsi Bank</text>
      </g>

      {/* Real-time Status Badge (Top Right) */}
      <g filter="url(#shadowBadge)" transform="translate(375, 45)">
        <rect x="0" y="0" width="130" height="38" rx="19" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
        <circle cx="20" cy="19" r="12" fill="#dbeafe" />
        <path d="M19 12V19L23 21" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
        <text x="38" y="18" fill="#0f172a" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">REAL-TIME</text>
        <text x="38" y="28" fill="#2563eb" fontSize="8" fontWeight="600" fontFamily="sans-serif">Sinkronisasi Kasir</text>
      </g>

      {/* Floating Rupiah Coin */}
      <g filter="url(#shadowSm)" transform="translate(100, 140)">
        <circle cx="16" cy="16" r="16" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="13" fill="#fef3c7" />
        <text x="16" y="20" textAnchor="middle" fill="#b45309" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Rp</text>
      </g>

      {/* Floating Digital Card Payment Badge */}
      <g filter="url(#shadowSm)" transform="translate(435, 145)">
        <rect x="0" y="0" width="48" height="32" rx="6" fill="url(#cardGrad)" />
        <rect x="0" y="6" width="48" height="6" fill="#78350f" opacity="0.4" />
        <rect x="6" y="18" width="12" height="7" rx="2" fill="#fef3c7" />
        <circle cx="36" cy="22" r="4" fill="#ffffff" opacity="0.8" />
        <circle cx="41" cy="22" r="4" fill="#ffffff" opacity="0.5" />
      </g>

      {/* 3. Transaction Desk / Counter Base */}
      <g filter="url(#shadowSm)">
        {/* Desk Front Panel */}
        <path
          d="M 60 270 L 500 270 L 485 365 L 75 365 Z"
          fill="url(#counterGrad)"
        />
        {/* Modern Accent Stripe on Counter */}
        <path
          d="M 65 295 L 495 295 L 490 325 L 70 325 Z"
          fill="#1e40af"
          opacity="0.5"
        />
        {/* Glow Line on Desk */}
        <line x1="75" y1="300" x2="485" y2="300" stroke="#60a5fa" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />

        {/* Counter Top Surface (Perspective) */}
        <path
          d="M 40 250 L 520 250 L 500 270 L 60 270 Z"
          fill="url(#counterTopGrad)"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />
      </g>

      {/* 4. Left Person: Female Teller / Cashier */}
      <g transform="translate(110, 100)">
        {/* Cashier Hair Back */}
        <path d="M 40 45 C 30 55, 25 80, 26 100 C 35 102, 75 102, 84 100 C 85 80, 80 55, 70 45 Z" fill="#1e293b" />
        {/* Cashier Body / Uniform */}
        <path
          d="M 28 115 C 33 90, 77 90, 82 115 L 92 165 L 18 165 Z"
          fill="#2563eb"
        />
        {/* Collar & Tie */}
        <path d="M 44 95 L 55 125 L 66 95 Z" fill="#ffffff" />
        <path d="M 52 110 L 55 145 L 58 110 Z" fill="#1d4ed8" />
        {/* Cashier ID Nametag */}
        <rect x="68" y="120" width="16" height="10" rx="2" fill="#ffffff" />
        <rect x="71" y="123" width="10" height="2" fill="#2563eb" />
        {/* Cashier Neck */}
        <rect x="48" y="80" width="14" height="18" fill="#fed7aa" />
        {/* Cashier Head */}
        <ellipse cx="55" cy="62" rx="19" ry="22" fill="#fed7aa" />
        {/* Cashier Hair Front */}
        <path
          d="M 36 60 C 36 40, 74 40, 74 60 C 70 50, 62 48, 55 50 C 48 48, 40 50, 36 60 Z"
          fill="#0f172a"
        />
        {/* Facial Features */}
        <circle cx="49" cy="62" r="2.2" fill="#1e293b" />
        <circle cx="61" cy="62" r="2.2" fill="#1e293b" />
        <path d="M 52 70 Q 55 74 58 70" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* Cashier Arms & Hands (Guiding Terminal) */}
        <path
          d="M 80 120 Q 110 135 125 152"
          stroke="#fed7aa"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* 5. Center Equipment: POS Screen & EDC Terminal */}
      {/* Computer POS Stand & Base */}
      <g transform="translate(230, 160)" filter="url(#shadowSm)">
        {/* Monitor Base */}
        <ellipse cx="50" cy="92" rx="28" ry="6" fill="#64748b" />
        <rect x="46" y="65" width="8" height="27" fill="#94a3b8" />
        
        {/* Monitor Frame */}
        <rect x="0" y="0" width="100" height="68" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        {/* Screen Display */}
        <rect x="5" y="5" width="90" height="58" rx="4" fill="url(#screenGrad)" />
        
        {/* Display Content: POS Screen */}
        <rect x="12" y="12" width="76" height="14" rx="3" fill="#1e293b" />
        <circle cx="20" cy="19" r="3" fill="#10b981" />
        <text x="28" y="22" fill="#38bdf8" fontSize="7" fontWeight="bold" fontFamily="monospace">MINI ATM POS</text>
        
        <text x="14" y="38" fill="#94a3b8" fontSize="6.5" fontFamily="sans-serif">Total Tagihan:</text>
        <text x="14" y="50" fill="#22c55e" fontSize="9" fontWeight="bold" fontFamily="monospace">Rp 150.000</text>
        <rect x="64" y="38" width="22" height="15" rx="3" fill="#2563eb" />
        <text x="75" y="48" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif">LUNAS</text>
      </g>

      {/* Mini ATM / EDC Machine with Receipt Printer */}
      <g transform="translate(195, 215)" filter="url(#shadowSm)">
        {/* EDC Body */}
        <rect x="0" y="0" width="38" height="42" rx="5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        {/* EDC Small Screen */}
        <rect x="5" y="5" width="28" height="13" rx="2" fill="#0284c7" />
        <text x="19" y="14" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif">TAP CARD</text>
        {/* Keypad */}
        <circle cx="10" cy="24" r="1.8" fill="#94a3b8" />
        <circle cx="19" cy="24" r="1.8" fill="#94a3b8" />
        <circle cx="28" cy="24" r="1.8" fill="#94a3b8" />
        <circle cx="10" cy="30" r="1.8" fill="#94a3b8" />
        <circle cx="19" cy="30" r="1.8" fill="#22c55e" />
        <circle cx="28" cy="30" r="1.8" fill="#ef4444" />

        {/* Thermal Receipt Fluttering Out */}
        <path
          d="M 12 0 L 12 -28 C 12 -33, 26 -33, 26 -28 L 26 0 Z"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="1"
        />
        {/* Barcode & Text on Receipt */}
        <line x1="15" y1="-22" x2="23" y2="-22" stroke="#475569" strokeWidth="1.5" />
        <line x1="15" y1="-18" x2="23" y2="-18" stroke="#475569" strokeWidth="1" />
        <line x1="15" y1="-14" x2="23" y2="-14" stroke="#475569" strokeWidth="1.5" />
        <line x1="15" y1="-10" x2="23" y2="-10" stroke="#475569" strokeWidth="1" />
        <line x1="15" y1="-6" x2="23" y2="-6" stroke="#475569" strokeWidth="2" strokeDasharray="1 1" />
      </g>

      {/* 6. Right Person: Customer Tapping Card / Paying */}
      <g transform="translate(360, 95)">
        {/* Customer Hair Back */}
        <path d="M 40 40 C 35 30, 65 30, 70 40 C 75 55, 75 80, 68 85 L 38 85 Z" fill="#334155" />
        {/* Customer Body / Jacket */}
        <path
          d="M 25 118 C 30 92, 75 92, 80 118 L 88 170 L 15 170 Z"
          fill="#0f766e"
        />
        {/* Inner Shirt */}
        <path d="M 45 96 L 53 125 L 61 96 Z" fill="#f8fafc" />
        {/* Customer Neck */}
        <rect x="46" y="80" width="14" height="18" fill="#fbcfe8" />
        {/* Customer Head */}
        <ellipse cx="53" cy="62" rx="19" ry="22" fill="#fbcfe8" />
        {/* Customer Modern Haircut */}
        <path
          d="M 34 60 C 34 40, 72 38, 72 56 C 66 48, 56 46, 50 48 C 42 46, 36 50, 34 60 Z"
          fill="#1e293b"
        />
        {/* Customer Face */}
        <circle cx="47" cy="62" r="2.2" fill="#1e293b" />
        <circle cx="59" cy="62" r="2.2" fill="#1e293b" />
        <path d="M 50 71 Q 53 74 56 71" stroke="#be185d" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        
        {/* Customer Arm Extended Forward Holding Payment Card */}
        <path
          d="M 30 120 Q -10 135 -35 150"
          stroke="#fbcfe8"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        {/* Payment Card in Hand */}
        <g transform="translate(-62, 142) rotate(-15)">
          <rect x="0" y="0" width="28" height="18" rx="3" fill="#2563eb" stroke="#1d4ed8" strokeWidth="0.8" />
          <rect x="0" y="3" width="28" height="4" fill="#1e3a8a" />
          <rect x="4" y="9" width="6" height="4" rx="1" fill="#fbbf24" />
          {/* Contactless Waves */}
          <path d="M 22 8 C 23 9, 23 11, 22 12" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" fill="none" />
          <path d="M 24 6 C 26 8, 26 13, 24 14" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" fill="none" />
        </g>
      </g>

      {/* 7. Success Verified Stamp (Bottom Center) */}
      <g filter="url(#shadowBadge)" transform="translate(215, 290)">
        <rect x="0" y="0" width="130" height="34" rx="17" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <circle cx="18" cy="17" r="10" fill="url(#successGrad)" />
        <path d="M14 17L17 20L22 14" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="34" y="16" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="sans-serif">TRANSAKSI SUKSES</text>
        <text x="34" y="26" fill="#059669" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Struk Kasir Dicetak</text>
      </g>
    </svg>
  );
};
