import React from 'react';

interface RetailSalesIllustrationProps {
  className?: string;
  variant?: 'pos' | 'retail' | 'analytics';
}

export const RetailSalesIllustration: React.FC<RetailSalesIllustrationProps> = ({
  className = 'w-full h-full',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 560 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-h-72 drop-shadow-sm"
      >
        <defs>
          <linearGradient id="counterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#042f2e" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
          <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="cartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.2" floodColor="#042f2e" />
          </filter>
        </defs>

        {/* Ambient background glow & elements */}
        <circle cx="280" cy="150" r="130" fill="#ccfbf1" fillOpacity="0.5" />
        <circle cx="460" cy="90" r="60" fill="#d1fae5" fillOpacity="0.6" />
        <circle cx="100" cy="180" r="70" fill="#ecfdf5" fillOpacity="0.6" />

        {/* Floor base line with subtle perspective */}
        <ellipse cx="280" cy="265" rx="240" ry="18" fill="#f1f5f9" />
        <line x1="60" y1="265" x2="500" y2="265" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 6" />

        {/* Floating Sales Stats Badge 1 (Top Left) */}
        <g className="animate-bounce" style={{ animationDuration: '3.5s' }}>
          <rect x="50" y="45" width="130" height="52" rx="12" fill="#ffffff" filter="url(#softShadow)" stroke="#e2e8f0" />
          <circle cx="74" cy="71" r="14" fill="#ecfdf5" />
          <path d="M68 71 L72 75 L80 67" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="96" y="65" fill="#64748b" fontSize="9" fontWeight="600" fontFamily="sans-serif">Penjualan Aktif</text>
          <text x="96" y="80" fill="#0f172a" fontSize="12" fontWeight="800" fontFamily="sans-serif">100% Realtime</text>
        </g>

        {/* Floating Badge 2 (Top Right) */}
        <g className="animate-pulse" style={{ animationDuration: '4s' }}>
          <rect x="380" y="35" width="135" height="56" rx="12" fill="#ffffff" filter="url(#softShadow)" stroke="#e2e8f0" />
          <rect x="395" y="48" width="24" height="24" rx="6" fill="#f0fdfa" />
          <path d="M401 64 L407 58 L411 61 L415 54" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="428" y="56" fill="#64748b" fontSize="9" fontWeight="600" fontFamily="sans-serif">Pertumbuhan Omset</text>
          <text x="428" y="73" fill="#0f766e" fontSize="13" fontWeight="800" fontFamily="sans-serif">+28.4% Naik</text>
        </g>

        {/* CASHIER DESK / COUNTER */}
        <g filter="url(#softShadow)">
          {/* Main desk body */}
          <path
            d="M 140 180 L 420 180 L 410 260 L 150 260 Z"
            fill="url(#counterGrad)"
          />
          {/* Desk Countertop */}
          <polygon
            points="120,180 140,165 420,165 440,180"
            fill="#334155"
          />
          {/* Desk Accent Front Strip */}
          <rect x="160" y="195" width="240" height="6" rx="3" fill="url(#accentGlow)" />
          {/* Mini Shelf / Grid slots */}
          <rect x="175" y="215" width="65" height="30" rx="4" fill="#0f172a" />
          <rect x="250" y="215" width="65" height="30" rx="4" fill="#0f172a" />
          <rect x="325" y="215" width="45" height="30" rx="4" fill="#0f172a" />
        </g>

        {/* SMART POS TERMINAL ON THE DESK */}
        <g>
          {/* Stand */}
          <rect x="270" y="140" width="20" height="30" rx="3" fill="#64748b" />
          <polygon points="260,170 300,170 295,175 265,175" fill="#475569" />

          {/* POS Monitor Screen */}
          <rect x="225" y="75" width="110" height="72" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="3" />
          <rect x="231" y="81" width="98" height="60" rx="5" fill="url(#screenGrad)" />

          {/* POS Screen Content / Charts */}
          <line x1="237" y1="94" x2="323" y2="94" stroke="#7dd3fc" strokeWidth="1" strokeOpacity="0.4" />
          {/* Mini Bar Chart on POS */}
          <rect x="240" y="118" width="8" height="16" rx="2" fill="#38bdf8" />
          <rect x="252" y="108" width="8" height="26" rx="2" fill="#4ade80" />
          <rect x="264" y="112" width="8" height="22" rx="2" fill="#fbbf24" />
          <rect x="276" y="102" width="8" height="32" rx="2" fill="#a78bfa" />
          <rect x="288" y="98" width="8" height="36" rx="2" fill="#22c55e" />

          {/* Screen Top Status Pill */}
          <rect x="238" y="85" width="38" height="5" rx="2.5" fill="#ffffff" fillOpacity="0.8" />
          <circle cx="318" cy="87" r="2.5" fill="#4ade80" />
        </g>

        {/* BARCODE SCANNER with Laser Beam */}
        <g>
          {/* Scanner Base & Holder */}
          <path d="M 360 168 L 375 145 L 388 152 L 375 172 Z" fill="#3b82f6" />
          <circle cx="373" cy="148" r="6" fill="#1d4ed8" />
          {/* Laser beam animation line */}
          <line x1="365" y1="145" x2="320" y2="175" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" opacity="0.85">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" repeatCount="indefinite" />
          </line>
        </g>

        {/* EDC / MINI ATM CARD MACHINE */}
        <g>
          <rect x="180" y="145" width="32" height="28" rx="4" fill="#0284c7" />
          <rect x="184" y="149" width="24" height="10" rx="2" fill="#0f172a" />
          <rect x="186" y="152" width="10" height="4" rx="1" fill="#22c55e" />
          {/* Keypad dots */}
          <circle cx="186" cy="164" r="1" fill="#ffffff" />
          <circle cx="192" cy="164" r="1" fill="#ffffff" />
          <circle cx="198" cy="164" r="1" fill="#ffffff" />
          <circle cx="204" cy="164" r="1" fill="#ffffff" />
          {/* ATM Card inserted */}
          <rect x="187" y="136" width="18" height="11" rx="2" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
          <line x1="187" y1="140" x2="205" y2="140" stroke="#78350f" strokeWidth="1.5" />
        </g>

        {/* RECEIPT TAPE POPPING OUT */}
        <g>
          <path
            d="M 305 135 Q 315 125 320 135 T 330 145"
            fill="none"
            stroke="#ffffff"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <line x1="310" y1="133" x2="316" y2="133" stroke="#64748b" strokeWidth="1" />
          <line x1="318" y1="137" x2="324" y2="137" stroke="#64748b" strokeWidth="1" />
        </g>

        {/* MODERN RETAIL SHOPPING CART (Right side) */}
        <g className="animate-pulse" style={{ animationDuration: '5s' }}>
          {/* Cart Basket */}
          <polygon
            points="420,175 495,175 480,225 435,225"
            fill="none"
            stroke="url(#cartGrad)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Basket Grid Wires */}
          <line x1="432" y1="190" x2="488" y2="190" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="436" y1="205" x2="482" y2="205" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="450" y1="175" x2="445" y2="225" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="470" y1="175" x2="465" y2="225" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" />

          {/* Cart Handle */}
          <path d="M 420 175 L 405 160 L 395 160" fill="none" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />

          {/* Cart Wheels & Frame */}
          <path d="M 435 225 L 430 245 L 478 245 L 480 225" fill="none" stroke="#64748b" strokeWidth="2.5" />
          <circle cx="433" cy="252" r="6" fill="#334155" />
          <circle cx="433" cy="252" r="2.5" fill="#f8fafc" />
          <circle cx="475" cy="252" r="6" fill="#334155" />
          <circle cx="475" cy="252" r="2.5" fill="#f8fafc" />

          {/* Items inside cart (Groceries / Products) */}
          <rect x="430" y="155" width="22" height="26" rx="3" fill="#3b82f6" />
          <line x1="434" y1="162" x2="448" y2="162" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="462" cy="165" r="10" fill="#ef4444" />
          <polygon points="468,150 488,150 482,175 464,175" fill="#10b981" />
        </g>

        {/* SHOPPING BAG WITH LOGO (Left side) */}
        <g>
          <path
            d="M 85 200 L 130 200 L 138 255 L 77 255 Z"
            fill="#0d9488"
            filter="url(#softShadow)"
          />
          {/* Bag handles */}
          <path
            d="M 98 200 C 98 180, 117 180, 117 200"
            fill="none"
            stroke="#0f766e"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Bag store icon */}
          <circle cx="107" cy="225" r="10" fill="#ffffff" fillOpacity="0.25" />
          <path d="M 103 227 L 107 221 L 111 227" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* FLOATING SUCCESS COINS / PARTICLES */}
        <g>
          <g>
            <circle cx="170" cy="100" r="10" fill="#f59e0b" />
            <circle cx="170" cy="100" r="7.5" fill="#fbbf24" />
            <text x="167" y="104" fill="#78350f" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Rp</text>
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-8; 0,0"
              dur="3s"
              repeatCount="indefinite"
            />
          </g>

          <g>
            <circle cx="360" cy="85" r="12" fill="#10b981" />
            <circle cx="360" cy="85" r="9" fill="#34d399" />
            <path d="M356 85 L359 88 L365 82" stroke="#064e3b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 0,-10; 0,0"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </g>

          {/* Sparkles */}
          <path d="M 215 55 L 217 60 L 222 62 L 217 64 L 215 69 L 213 64 L 208 62 L 213 60 Z" fill="#fbbf24" />
          <path d="M 335 48 L 336 51 L 339 52 L 336 53 L 335 56 L 334 53 L 331 52 L 334 51 Z" fill="#38bdf8" />
        </g>
      </svg>
    </div>
  );
};
