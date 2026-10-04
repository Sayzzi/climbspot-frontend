import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';

interface ConnectWithStravaProps {
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

/** The "Connect with Strava" button, in Strava's colours. */
export function ConnectWithStrava({ onClick, disabled = false }: ConnectWithStravaProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-12 items-center rounded-md bg-strava px-5 font-bold text-white shadow-sm hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine disabled:opacity-60',
      )}
    >
      {t('strava.connect')}
    </button>
  );
}

/** "Powered by Strava", wherever data from Strava appears. */
export function PoweredByStrava({ className }: { readonly className?: string }) {
  const { t } = useTranslation();
  return (
    <p className={cn('text-xs font-semibold tracking-wide text-strava uppercase', className)}>
      {t('strava.poweredBy')}
    </p>
  );
}
