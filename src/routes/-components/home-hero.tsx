import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

import { ClimbingProfile } from './climbing-profile';

interface HomeHeroProps {
  /** Fading away after the Visitor chose a way in; gone once that is done. */
  readonly closing: boolean;
  readonly onShowClimbs: () => void;
  readonly onExploreMap: () => void;
}

/**
 * The welcome screen, over a veiled map: what ClimbSpot does, an elevation profile
 * climbing to a waymark, and the two ways in, each of which lifts it.
 */
export function HomeHero({ closing, onShowClimbs, onExploreMap }: HomeHeroProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'fixed inset-0 z-10 flex items-center transition-opacity duration-300 ease-out',
        closing && 'pointer-events-none opacity-0',
      )}
    >
      {/* Lichen veil over the map. */}
      <div aria-hidden="true" className="absolute inset-0 bg-lichen/90" />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-6 pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
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
