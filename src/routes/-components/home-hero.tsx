import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { ClimbingProfile } from './climbing-profile';

/** Above this share of the reveal, the hero lets the map underneath take gestures. */
const REVEALED = 0.98;

interface HomeHeroProps {
  /** How far the map underneath is revealed, from 0 to 1, as the Visitor scrolls. */
  readonly reveal: number;
  readonly onShowClimbs: () => void;
  readonly onExploreMap: () => void;
}

/**
 * What ClimbSpot does and the two ways in, over a veiled map: an elevation profile
 * climbing to a waymark. It dissolves as the Visitor scrolls, letting the map through.
 */
export function HomeHero({ reveal, onShowClimbs, onExploreMap }: HomeHeroProps) {
  const { t } = useTranslation();
  const opacity = Math.max(0, 1 - reveal * 1.6);

  return (
    <div
      className={cn(
        'fixed inset-0 z-10 flex items-center',
        reveal >= REVEALED && 'pointer-events-none',
      )}
    >
      {/* Lichen veil over the map, lifting as the hero dissolves. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-lichen"
        style={{ opacity: 0.88 * (1 - reveal) }}
      />
      <div
        className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-6 pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12"
        style={{ opacity }}
      >
        <div className="flex flex-col items-start gap-6">
          <h1 className="max-w-[11ch] text-[clamp(2.75rem,6.2vw,5rem)] leading-[0.92] font-extrabold text-pine">
            {t('home.headline')}
          </h1>
          <p className="max-w-[36ch] text-lg text-ink-muted">{t('home.intro')}</p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={onShowClimbs}>
              {t('home.showClimbs')}
            </Button>
            <Button size="lg" variant="secondary" onClick={onExploreMap}>
              {t('home.exploreMap')}
            </Button>
          </div>
        </div>
        <ClimbingProfile className="order-first w-full max-w-[22rem] justify-self-center lg:order-none lg:max-w-none" />
      </div>
    </div>
  );
}
