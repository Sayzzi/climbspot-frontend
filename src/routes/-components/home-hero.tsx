import { useTranslation } from 'react-i18next';

import { prefersReducedMotion } from '@/shared/hooks/use-scroll-progress';
import { cn } from '@/shared/lib/cn';

/** Above this share of the reveal, the hero lets the map underneath take gestures. */
const REVEALED = 0.98;

/**
 * The app's name, huge, over a veiled map. It stays in place and dissolves as the
 * Visitor scrolls (`reveal` from 0 to 1), letting the map come through.
 */
export function HomeHero({ reveal }: { readonly reveal: number }) {
  const { t } = useTranslation();
  const opacity = Math.max(0, 1 - reveal * 1.6);
  const scale = prefersReducedMotion() ? 1 : 1 + reveal * 0.06;

  return (
    <div
      className={cn(
        'fixed inset-0 z-10 grid place-items-center px-4 text-center',
        reveal >= REVEALED && 'pointer-events-none',
      )}
    >
      {/* Lichen veil over the map, lifting as the name dissolves. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-lichen"
        style={{ opacity: 0.78 * (1 - reveal) }}
      />
      <div className="relative" style={{ opacity }}>
        <h1
          className="text-[clamp(5.5rem,19vw,18rem)] leading-[0.95] font-extrabold tracking-tight text-pine"
          style={{ transform: `scale(${String(scale)})` }}
        >
          {t('app.name')}
        </h1>
        <p className="mt-[0.6em] pt-1 text-[clamp(1.125rem,2vw,1.5rem)]">{t('app.tagline')}</p>
        {/* A red-and-white waymark, as painted on long-distance trails. */}
        <span
          aria-hidden="true"
          className="mt-7 inline-block h-[18px] w-16 rounded-sm bg-[linear-gradient(var(--color-white)_0_33%,var(--color-blaze)_33%_67%,var(--color-white)_67%)] ring-1 ring-pine/15"
        />
      </div>
    </div>
  );
}
