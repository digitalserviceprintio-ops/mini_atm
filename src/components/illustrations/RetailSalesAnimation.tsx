import React from 'react';

export const RetailSalesAnimation: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full overflow-hidden flex items-center justify-center select-none ${className}`}>
      <style>{`
        @keyframes pos-laser-sweep {
          0%, 100% {
            transform: translateY(-8px);
            opacity: 0.2;
          }
          50% {
            transform: translateY(18px);
            opacity: 0.9;
          }
        }
        @keyframes pos-receipt-feed {
          0% {
            stroke-dashoffset: 40;
            opacity: 0.6;
          }
          50% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          100% {
            stroke-dashoffset: -40;
            opacity: 0.6;
          }
        }
        @keyframes pos-coin-float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-5px) rotate(4deg);
          }
        }
        @keyframes pos-cart-bounce {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        @keyframes pos-pulse-ring {
          0% {
            r: 4px;
            opacity: 0.8;
          }
          100% {
            r: 16px;
            opacity: 0;
          }
        }
        @keyframes pos-badge-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .anim-laser {
          animation: pos-laser-sweep 2.2s ease-in-out infinite;
        }
        .anim-receipt {
          animation: pos-receipt-feed 3s linear infinite;
        }
        .anim-coin {
          animation: pos-coin-float 3s ease-in-out infinite;
        }
        .anim-cart {
          animation: pos-cart-bounce 4s ease-in-out infinite;
        }
        .anim-badge-left {
          animation: pos-badge-float 3.5s ease-in-out infinite;
        }
        .anim-badge-right {
          animation: pos-badge-float 3.8s ease-in-out infinite 0.5s;
        }
      `}</style>

      {/* Background Soft Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-emerald-500/10 rounded-2xl pointer-events-none" />

      {/* SVG Retail Sales & POS Illustration */}
      <svg
        viewBox="0 0 420 220"
        className="w-full h-auto max-h-[190px] drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="posDeskGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#334155" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="posScreenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="posPaperGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>

          <linearGradient id="bagGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="boxGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          <linearGradient id="laserGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
            <stop offset="50%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Filters */}
          <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- COUNTER BASE / DESK SURFACE --- */}
        <ellipse cx="210" cy="195" rx="190" ry="14" fill="#0f172a" fillOpacity="0.4" />
        <path
          d="M 30 190 L 390 190 L 375 204 L 45 204 Z"
          fill="url(#posDeskGrad)"
          stroke="#475569"
          strokeWidth="1"
        />
        <line x1="45" y1="190" x2="375" y2="190" stroke="#60a5fa" strokeOpacity="0.3" strokeWidth="1.5" />

        {/* --- 1. RETAIL SHOPPING BAG & PRODUCTS (LEFT SIDE) --- */}
        <g className="anim-cart">
          {/* Shopping Bag Shadow */}
          <ellipse cx="95" cy="188" rx="35" ry="6" fill="#020617" fillOpacity="0.4" />

          {/* Shopping Bag Body */}
          <path
            d="M 68 125 L 122 125 L 128 186 L 62 186 Z"
            fill="url(#bagGrad)"
            stroke="#b45309"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Bag Fold / Texture */}
          <path d="M 68 125 L 74 186" stroke="#fbbf24" strokeWidth="1" strokeOpacity="0.5" />
          <path d="M 122 125 L 116 186" stroke="#b45309" strokeWidth="1" strokeOpacity="0.6" />

          {/* Bag Handles */}
          <path
            d="M 82 125 C 82 108, 108 108, 108 125"
            fill="none"
            stroke="#fef3c7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Bag Tag / Logo "%" */}
          <rect x="83" y="145" width="24" height="20" rx="4" fill="#ffffff" fillOpacity="0.9" />
          <text x="95" y="159" fill="#d97706" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="system-ui">
            %
          </text>

          {/* Item sticking out of bag: Box */}
          <rect
            x="76"
            y="108"
            width="20"
            height="22"
            rx="3"
            fill="url(#boxGrad)"
            stroke="#93c5fd"
            strokeWidth="1"
          />
          <path d="M 76 116 L 96 116" stroke="#bfdbfe" strokeWidth="1" />

          {/* Barcode on retail box */}
          <rect x="100" y="112" width="18" height="14" rx="2" fill="#ffffff" />
          <line x1="103" y1="115" x2="103" y2="123" stroke="#1e293b" strokeWidth="1.2" />
          <line x1="106" y1="115" x2="106" y2="123" stroke="#1e293b" strokeWidth="0.8" />
          <line x1="109" y1="115" x2="109" y2="123" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="112" y1="115" x2="112" y2="123" stroke="#1e293b" strokeWidth="1" />
          <line x1="115" y1="115" x2="115" y2="123" stroke="#1e293b" strokeWidth="0.8" />
        </g>

        {/* --- 2. MAIN POS TOUCH TERMINAL (CENTER) --- */}
        <g>
          {/* Terminal Stand Base */}
          <ellipse cx="205" cy="186" rx="30" ry="5" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <path d="M 198 152 L 212 152 L 209 184 L 201 184 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />

          {/* Terminal Screen Frame */}
          <rect
            x="150"
            y="70"
            width="110"
            height="82"
            rx="8"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          {/* Inner Screen Bezel */}
          <rect
            x="154"
            y="74"
            width="102"
            height="74"
            rx="5"
            fill="url(#posScreenGrad)"
          />

          {/* POS Screen UI Elements */}
          {/* Top App Bar on POS Screen */}
          <rect x="157" y="77" width="96" height="12" rx="2" fill="#1e3a8a" />
          <circle cx="163" cy="83" r="2" fill="#38bdf8" />
          <rect x="168" y="81" width="35" height="4" rx="1" fill="#93c5fd" />
          <rect x="235" y="80" width="14" height="6" rx="2" fill="#10b981" />

          {/* Cart Item rows on Screen */}
          <rect x="157" y="93" width="55" height="5" rx="1.5" fill="#60a5fa" fillOpacity="0.8" />
          <rect x="225" y="93" width="28" height="5" rx="1.5" fill="#34d399" />

          <rect x="157" y="102" width="48" height="5" rx="1.5" fill="#94a3b8" fillOpacity="0.6" />
          <rect x="229" y="102" width="24" height="5" rx="1.5" fill="#94a3b8" fillOpacity="0.8" />

          <rect x="157" y="111" width="52" height="5" rx="1.5" fill="#94a3b8" fillOpacity="0.6" />
          <rect x="227" y="111" width="26" height="5" rx="1.5" fill="#94a3b8" fillOpacity="0.8" />

          {/* Total Amount Box on Screen */}
          <rect x="157" y="122" width="96" height="22" rx="3" fill="#0284c7" fillOpacity="0.3" stroke="#0284c7" strokeWidth="0.8" />
          <text x="162" y="132" fill="#93c5fd" fontSize="7" fontFamily="monospace">TOTAL POS</text>
          <text x="248" y="137" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="end">
            Rp 150.000
          </text>
        </g>

        {/* --- 3. THERMAL RECEIPT PRINTER & LIVE PRINTING RECEIPT (CENTER RIGHT) --- */}
        <g>
          {/* Printer Body */}
          <rect
            x="270"
            y="130"
            width="56"
            height="56"
            rx="6"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.5"
          />
          {/* Paper Slot */}
          <rect x="277" y="133" width="42" height="4" rx="1" fill="#020617" />
          {/* Printer Status LEDs */}
          <circle cx="278" cy="178" r="2" fill="#10b981" />
          <circle cx="284" cy="178" r="2" fill="#3b82f6" />
          <rect x="295" y="175" width="24" height="6" rx="2" fill="#334155" />

          {/* Paper Coming Out */}
          <g>
            <path
              d="M 280 134 L 316 134 L 316 75 L 280 75 Z"
              fill="url(#posPaperGrad)"
              stroke="#cbd5e1"
              strokeWidth="1"
              className="drop-shadow-sm"
            />
            {/* Paper Zigzag Top */}
            <path
              d="M 280 75 L 283 72 L 286 75 L 289 72 L 292 75 L 295 72 L 298 75 L 301 72 L 304 75 L 307 72 L 310 75 L 313 72 L 316 75"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="0.8"
            />

            {/* Receipt Text Lines */}
            <line x1="284" y1="83" x2="312" y2="83" stroke="#0f172a" strokeWidth="2" />
            <line x1="284" y1="88" x2="304" y2="88" stroke="#64748b" strokeWidth="1" />
            <line x1="284" y1="93" x2="312" y2="93" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="284" y1="98" x2="308" y2="98" stroke="#334155" strokeWidth="1.2" />
            <line x1="284" y1="104" x2="302" y2="104" stroke="#334155" strokeWidth="1.2" />
            <line x1="284" y1="110" x2="306" y2="110" stroke="#334155" strokeWidth="1.2" />
            <line x1="284" y1="116" x2="312" y2="116" stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="2 2" />
            <line x1="284" y1="122" x2="312" y2="122" stroke="#059669" strokeWidth="2" />

            {/* Live Printing Animated Sweep Bar */}
            <line
              x1="280"
              y1="130"
              x2="316"
              y2="130"
              stroke="#38bdf8"
              strokeWidth="2"
              className="anim-receipt"
            />
          </g>
        </g>

        {/* --- 4. BARCODE SCANNER WITH RED LASER (FAR RIGHT) --- */}
        <g>
          {/* Scanner Stand */}
          <path d="M 355 186 L 372 186 L 368 155 L 359 155 Z" fill="#1e293b" stroke="#334155" />
          <ellipse cx="363" cy="186" rx="14" ry="4" fill="#0f172a" />

          {/* Scanner Gun */}
          <path
            d="M 345 130 C 345 125, 360 120, 375 125 L 365 152 C 355 150, 348 142, 345 130 Z"
            fill="#2563eb"
            stroke="#60a5fa"
            strokeWidth="1.2"
          />
          {/* Scanner Head / Window */}
          <rect x="338" y="128" width="8" height="16" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          <line x1="340" y1="131" x2="340" y2="141" stroke="#ef4444" strokeWidth="2" />

          {/* Red Laser Scanning Beam (Animated) */}
          <g className="anim-laser">
            <polygon
              points="338,136 295,142 295,162 338,138"
              fill="url(#laserGrad)"
              filter="url(#laserGlow)"
            />
            <line x1="338" y1="136" x2="295" y2="152" stroke="#ef4444" strokeWidth="2" filter="url(#laserGlow)" />
          </g>
        </g>

        {/* --- 5. FLOATING GOLD COINS & PAYMENT CARD (ANIMATED) --- */}
        {/* Floating Coin 1 */}
        <g className="anim-coin">
          <circle cx="132" cy="48" r="13" fill="url(#coinGrad)" stroke="#fef08a" strokeWidth="1.5" />
          <circle cx="132" cy="48" r="10" fill="none" stroke="#b45309" strokeWidth="1" strokeDasharray="3 2" />
          <text x="132" y="53" fill="#78350f" fontSize="10" fontWeight="extrabold" textAnchor="middle" fontFamily="monospace">
            Rp
          </text>
        </g>

        {/* Floating Coin 2 */}
        <g className="anim-coin" style={{ animationDelay: '1.2s' }}>
          <circle cx="348" cy="42" r="9" fill="url(#coinGrad)" stroke="#fef08a" strokeWidth="1" />
          <text x="348" y="46" fill="#78350f" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            Rp
          </text>
        </g>

        {/* Contactless RFID Payment Card */}
        <g className="anim-badge-right">
          <rect
            x="295"
            y="18"
            width="58"
            height="36"
            rx="5"
            fill="#0284c7"
            stroke="#7dd3fc"
            strokeWidth="1.2"
            className="drop-shadow-md"
          />
          {/* Card Chip */}
          <rect x="302" y="27" width="10" height="8" rx="1.5" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
          {/* Contactless Wave icon */}
          <path d="M 342 25 C 344 27, 344 31, 342 33" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M 345 22 C 348 26, 348 34, 345 37" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" strokeOpacity="0.7" />
          {/* Card Number Line */}
          <line x1="302" y1="44" x2="328" y2="44" stroke="#bae6fd" strokeWidth="1.5" />
        </g>

        {/* --- 6. FLOATING FEATURE PILLS / BADGES --- */}
        {/* Left Pill: POS Ritel Kasir */}
        <g className="anim-badge-left">
          <rect
            x="32"
            y="26"
            width="90"
            height="22"
            rx="11"
            fill="#0f172a"
            fillOpacity="0.85"
            stroke="#38bdf8"
            strokeWidth="1"
          />
          <circle cx="43" cy="37" r="4" fill="#38bdf8" />
          <text x="53" y="41" fill="#e0f2fe" fontSize="9" fontWeight="bold" fontFamily="system-ui">
            Kasir POS Ritel
          </text>
        </g>

        {/* Right Pill: Struk Otomatis */}
        <g className="anim-badge-right">
          <rect
            x="195"
            y="24"
            width="94"
            height="22"
            rx="11"
            fill="#0f172a"
            fillOpacity="0.85"
            stroke="#34d399"
            strokeWidth="1"
          />
          <circle cx="206" cy="35" r="4" fill="#10b981" />
          <text x="216" y="39" fill="#d1fae5" fontSize="9" fontWeight="bold" fontFamily="system-ui">
            Struk Thermal Auto
          </text>
        </g>
      </svg>
    </div>
  );
};
