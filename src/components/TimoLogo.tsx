export function TimoLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 134 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="timo"
      shapeRendering="geometricPrecision"
      className={`h-14 w-auto select-none text-neutral-900 ${className}`}
    >
      {/* t — fluid stem with a relaxed bottom curve */}
      <path
        d="M 16 10 C 16 20 15.5 30 16 37 C 16.5 43 20 45.5 27 43.5"
        stroke="currentColor"
        strokeWidth="5.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 8 21.5 Q 17 19.5 26 21"
        stroke="currentColor"
        strokeWidth="5.6"
        strokeLinecap="round"
      />

      {/* i — lifted dot and gently curved stem */}
      <circle cx="37.5" cy="11.5" r="3.4" fill="currentColor" />
      <path
        d="M 37.5 21.5 C 37 29 37 37 38 44"
        stroke="currentColor"
        strokeWidth="5.6"
        strokeLinecap="round"
      />

      {/* m — free-flowing organic arches with soft exit flick */}
      <path
        d="M 50 44 C 50 35 50 26 50 21.5"
        stroke="currentColor"
        strokeWidth="5.6"
        strokeLinecap="round"
      />
      <path
        d="M 50 25.5 C 53.5 19.5 62.5 19 66.5 24.5 C 68.5 27.5 68.5 35 68.5 44"
        stroke="currentColor"
        strokeWidth="5.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 68.5 26 C 72.5 19.5 81.5 19 85.5 24.5 C 88 28 87.5 36 88 41.5 C 88.5 44.5 91 45 94 43.5"
        stroke="currentColor"
        strokeWidth="5.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* o — hand-drawn organic clock dial */}
      <path
        d="M 116.5 20.5 C 123.5 21 127.5 26 127.3 32.5 C 127 39.5 121.5 44.5 114.5 44.5 C 107.5 44.5 103 39.2 103.2 32.5 C 103.4 25.8 108 21.2 114 20.6"
        stroke="currentColor"
        strokeWidth="5.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 115.2 26 Q 114.6 29.2 115 32.5 Q 118 33.8 120.8 35.6"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
