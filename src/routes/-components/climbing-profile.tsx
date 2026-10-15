/**
 * The identity's one opening move: an elevation profile climbing from left to right
 * over faint contour lines, ending on a red-and-white waymark. Decorative; under
 * reduced motion it is simply there.
 */
export function ClimbingProfile({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 600 380" aria-hidden="true" className={className}>
      <g fill="none" stroke="var(--color-pine)" strokeWidth="1.5" opacity="0.14">
        <path d="M-20 340 C80 320 140 250 230 250 S380 300 470 230 S580 150 640 150" />
        <path d="M-20 300 C90 285 150 215 240 210 S370 250 450 180 S560 105 640 110" />
        <path d="M-20 262 C100 250 165 180 250 172 S360 200 430 135 S540 65 640 72" />
        <path d="M30 226 C120 214 180 146 258 136 S350 152 412 96 S505 35 600 40" />
        <path d="M110 190 C170 178 205 120 266 104 S340 108 394 64 S462 18 540 14" />
      </g>
      <defs>
        <linearGradient id="climbing-profile-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-pine)" stopOpacity="0.12" />
          <stop offset="1" stopColor="var(--color-pine)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* The hill under the profile, its far side falling away past the Top. */}
      <path
        d="M20 380 L20 318 C70 312 105 286 150 262 S230 250 270 214 S340 168 380 160 S450 118 486 92 L520 74 C548 82 570 104 600 122 L600 380 Z"
        fill="url(#climbing-profile-ground)"
      />
      <path
        d="M20 318 C70 312 105 286 150 262 S230 250 270 214 S340 168 380 160 S450 118 486 92 L520 74"
        pathLength={1}
        fill="none"
        stroke="var(--color-blaze)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-profile-draw [stroke-dasharray:1] [stroke-dashoffset:1]"
      />
      <g className="origin-[520px_74px] animate-waymark-in opacity-0">
        <path d="M520 74 V36" stroke="var(--color-pine)" strokeWidth="5" strokeLinecap="round" />
        <rect x="490" y="0" width="60" height="44" rx="5" fill="var(--color-pine)" />
        <rect x="497" y="7" width="46" height="14" className="fill-white" />
        <rect x="497" y="23" width="46" height="14" fill="var(--color-blaze)" />
      </g>
    </svg>
  );
}
