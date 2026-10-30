export default function HeroIllustration({ size = 500 }) {
  return (
    <svg
      viewBox="0 0 600 650"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: size }}
    >
      <defs>
        <radialGradient id="faceGlow" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#ffe8d6" />
          <stop offset="100%" stopColor="#f5c9a0" />
        </radialGradient>
        <radialGradient id="blushPink" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hairDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="hairShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1e6ef5" />
        </linearGradient>
        <linearGradient id="hpInner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="dressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="dressShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="blob1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
        <linearGradient id="blob2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="blob3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d1fae5" />
          <stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient>
        <linearGradient id="blob4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="blob5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="100%" stopColor="#f9a8d4" />
        </linearGradient>
      </defs>

      {/* Background blobs */}
      <circle cx="320" cy="300" r="240" fill="url(#blob1)" opacity="0.7" />
      <circle cx="480" cy="450" r="160" fill="url(#blob2)" opacity="0.55" />
      <circle cx="130" cy="480" r="140" fill="url(#blob3)" opacity="0.55" />
      <circle cx="180" cy="180" r="100" fill="url(#blob4)" opacity="0.6" />
      <circle cx="500" cy="180" r="80" fill="url(#blob5)" opacity="0.5" />

      {/* Floating dots */}
      <circle cx="170" cy="130" r="10" fill="#a7f3d0" opacity="0.9" />
      <circle cx="520" cy="320" r="14" fill="#c4b5fd" opacity="0.8" />
      <circle cx="540" cy="440" r="9" fill="#fbbf24" opacity="0.9" />
      <circle cx="100" cy="400" r="7" fill="#60a5fa" opacity="0.9" />
      <circle cx="490" cy="140" r="6" fill="#f472b6" opacity="0.8" />

      {/* Body / Dress */}
      <path
        d="M 200 640 Q 190 500 240 440 Q 300 410 360 410 Q 420 410 460 440 Q 510 500 500 640 Z"
        fill="url(#dressGrad)"
        stroke="#cbd5e1"
        strokeWidth="2"
      />
      <path
        d="M 260 440 Q 280 470 300 440 Q 320 470 340 440"
        stroke="#e0f2fe"
        strokeWidth="3"
        fill="none"
      />

      {/* Neck */}
      <ellipse cx="300" cy="420" rx="32" ry="45" fill="url(#faceGlow)" />
      <ellipse cx="300" cy="440" rx="32" ry="25" fill="#f5b896" opacity="0.35" />

      {/* Hair back — flowing waves */}
      <path
        d="M 180 300 Q 155 400 175 520 Q 200 560 230 520 Q 225 430 245 340 Z"
        fill="url(#hairDark)"
      />
      <path
        d="M 420 300 Q 445 400 425 520 Q 400 560 370 520 Q 375 430 355 340 Z"
        fill="url(#hairDark)"
      />

      {/* Face */}
      <ellipse cx="300" cy="290" rx="100" ry="120" fill="url(#faceGlow)" />

      {/* Hair front */}
      <path
        d="M 195 265 Q 185 140 300 125 Q 415 140 405 265 Q 385 190 335 170 Q 280 155 245 180 Q 215 200 195 265 Z"
        fill="url(#hairDark)"
      />
      <path
        d="M 195 265 Q 185 140 300 125 Q 415 140 405 265 Q 385 190 335 170"
        fill="url(#hairShine)"
        opacity="0.5"
      />

      {/* Hair top curls */}
      <path
        d="M 245 150 Q 250 105 300 100 Q 350 105 355 150 Q 340 125 300 122 Q 260 125 245 150 Z"
        fill="#0f172a"
      />

      {/* Hair side strands */}
      <path d="M 195 265 Q 188 320 200 365 Q 215 340 215 285 Z" fill="#1e293b" />
      <path d="M 405 265 Q 412 320 400 365 Q 385 340 385 285 Z" fill="#1e293b" />

      {/* Eyebrows — thick, elegant */}
      <path d="M 235 255 Q 255 240 280 250" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <path d="M 320 250 Q 345 240 365 255" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" fill="none" />

      {/* Eyes — closed (happy) */}
      <path d="M 240 285 Q 258 302 278 288" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M 322 288 Q 342 302 360 285" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* Eyelashes */}
      <path d="M 238 285 L 233 280" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 362 285 L 367 280" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />

      {/* Nose */}
      <path d="M 300 315 Q 294 330 302 338" stroke="#e89670" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Smile — happy */}
      <path
        d="M 270 365 Q 300 390 330 365"
        stroke="#c2410c"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Blush on cheeks */}
      <ellipse cx="225" cy="330" rx="22" ry="14" fill="url(#blushPink)" />
      <ellipse cx="375" cy="330" rx="22" ry="14" fill="url(#blushPink)" />

      {/* Headphones band */}
      <path
        d="M 195 265 Q 185 140 300 130 Q 415 140 405 265"
        stroke="url(#hpGrad)"
        strokeWidth="24"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 195 265 Q 185 140 300 130 Q 415 140 405 265"
        stroke="#1554c9"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.25"
      />

      {/* Headphone left ear */}
      <rect x="165" y="245" width="60" height="105" rx="24" fill="url(#hpGrad)" />
      <rect x="175" y="258" width="40" height="78" rx="18" fill="url(#hpInner)" />
      <rect x="183" y="268" width="24" height="60" rx="12" fill="#bfdbfe" opacity="0.7" />

      {/* Headphone right ear */}
      <rect x="375" y="245" width="60" height="105" rx="24" fill="url(#hpGrad)" />
      <rect x="385" y="258" width="40" height="78" rx="18" fill="url(#hpInner)" />
      <rect x="393" y="268" width="24" height="60" rx="12" fill="#bfdbfe" opacity="0.7" />

      {/* Sound waves from headphones — right */}
      <path d="M 450 275 Q 475 305 450 335" stroke="#1e6ef5" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M 470 260 Q 505 305 470 350" stroke="#1e6ef5" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M 490 245 Q 535 305 490 365" stroke="#1e6ef5" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.45" />

      {/* Sound waves — left */}
      <path d="M 150 275 Q 125 305 150 335" stroke="#a855f7" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M 130 260 Q 95 305 130 350" stroke="#a855f7" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.4" />

      {/* Musical notes */}
      <g opacity="0.75">
        <ellipse cx="525" cy="160" rx="9" ry="6" fill="#a855f7" transform="rotate(-20 525 160)" />
        <line x1="533" y1="160" x2="533" y2="125" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 533 125 Q 548 122 550 135" stroke="#a855f7" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        <ellipse cx="85" cy="290" rx="8" ry="5" fill="#f59e0b" transform="rotate(-20 85 290)" />
        <line x1="93" y1="290" x2="93" y2="260" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />

        <ellipse cx="540" cy="460" rx="7" ry="5" fill="#10b981" transform="rotate(-20 540 460)" />
        <line x1="547" y1="460" x2="547" y2="435" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Sparkles */}
      <g opacity="0.9">
        <path d="M 480 420 L 485 435 L 500 440 L 485 445 L 480 460 L 475 445 L 460 440 L 475 435 Z" fill="#fbbf24" />
        <path d="M 130 220 L 135 232 L 147 237 L 135 242 L 130 254 L 125 242 L 113 237 L 125 232 Z" fill="#c084fc" />
        <path d="M 555 350 L 558 360 L 568 363 L 558 366 L 555 376 L 552 366 L 542 363 L 552 360 Z" fill="#34d399" />
      </g>

      {/* Heart */}
      <g opacity="0.75">
        <path
          d="M 120 165 Q 120 145 140 145 Q 160 145 160 165 Q 160 190 140 205 Q 120 190 120 165 Z"
          fill="#fb7185"
        />
        <path
          d="M 135 160 Q 135 155 140 155 Q 145 155 145 160"
          stroke="#fff"
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        />
      </g>

      {/* Small stars */}
      <g fill="#fbbf24" opacity="0.8">
        <path d="M 470 100 L 473 110 L 483 110 L 475 117 L 478 127 L 470 120 L 462 127 L 465 117 L 457 110 L 467 110 Z" />
        <path d="M 90 340 L 92 347 L 99 347 L 93 352 L 96 359 L 90 354 L 84 359 L 87 352 L 81 347 L 88 347 Z" />
      </g>
    </svg>
  );
}