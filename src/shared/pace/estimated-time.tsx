import { useTranslation } from 'react-i18next';

import { useFormatters } from '@/shared/units';

import { estimatedMinutes } from './pace';
import { useFlatPace } from './use-flat-pace';

/** The Estimated Time of a path, or an invitation to set the Flat Pace that opens the setting. */
export function EstimatedTime({
  flatEquivalentDistance,
}: {
  readonly flatEquivalentDistance: number;
}) {
  const { t } = useTranslation();
  const format = useFormatters();
  const { secondsPerKm, openSetting } = useFlatPace();

  if (secondsPerKm === undefined) {
    return (
      <button
        type="button"
        onClick={openSetting}
        className="text-left font-medium text-moss underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-pine"
      >
        {t('pace.invite')}
      </button>
    );
  }

  return t('time.approximately', {
    time: format.duration(estimatedMinutes(flatEquivalentDistance, secondsPerKm)),
  });
}
