import { useTranslation } from 'react-i18next';

import type { GeolocationState } from '@/shared/hooks/use-current-position';

/** Tells the Visitor where locating them stands, and what to do when it fails. */
export function LocateNotice({ state }: { readonly state: GeolocationState }) {
  const { t } = useTranslation('ascents');

  if (state.status === 'locating') {
    return <p className="text-ink-muted">{t('locate.locating')}</p>;
  }
  if (state.status === 'failed') {
    return (
      <div role="status" className="rounded-xl bg-brand-50 p-4">
        <p className="font-medium">{t(`locate.failures.${state.failure}`)}</p>
        <p className="text-sm text-ink-muted">{t('locate.fallback')}</p>
      </div>
    );
  }
  return null;
}
