import { useTranslation } from 'react-i18next';

import { useAuth } from '@/shared/auth';
import { useFlatPace, type PaceToRevertTo } from '@/shared/pace';
import { useFormatters, useUnits } from '@/shared/units';

import { useMyAccount, useUpdateMyAccount } from '../api/my-account';

/**
 * Where the signed-in Visitor's Flat Pace comes from, when Strava gives it, and the way
 * back to Strava's after they stated their own.
 */
export function useFlatPaceSource(): {
  readonly source: string | undefined;
  readonly revertTo: PaceToRevertTo | undefined;
} {
  const { t } = useTranslation('account');
  const { t: tCommon } = useTranslation();
  const { system } = useUnits();
  const format = useFormatters();
  const { session } = useAuth();
  const { data: account } = useMyAccount();
  const { mutate } = useUpdateMyAccount();
  const { secondsPerKm } = useFlatPace();

  if (!session || !account) {
    return { source: undefined, revertTo: undefined };
  }
  // Until the account follows a change the Visitor just made, the pace is theirs.
  const fromStrava = account.flatPaceSource === 'strava' && account.flatPace === secondsPerKm;
  const strava = account.stravaFlatPace;
  return {
    source: fromStrava ? t('flatPace.strava') : undefined,
    revertTo:
      strava !== null && !fromStrava
        ? {
            label: t('flatPace.useStrava', {
              pace: tCommon(`pace.per.${system}`, { pace: format.pace(strava) }),
            }),
            onRevert: () => {
              mutate({ flatPace: null });
            },
          }
        : undefined,
  };
}
