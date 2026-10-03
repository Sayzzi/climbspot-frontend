import { useTranslation } from 'react-i18next';

import { ElevationProfileChart } from '@/shared/ui/elevation-profile-chart';
import { useFormatters } from '@/shared/units';

import { mainStretch } from '../proposal';
import type { Proposal } from '../types';

/** The Elevation Profile of a proposal: the path of an Itinerary, the Repeat of a session. */
export function ProposalProfile({ proposal }: { readonly proposal: Proposal }) {
  const { t } = useTranslation('itineraries');
  const format = useFormatters();
  const { elevationProfile, length } = mainStretch(proposal);
  const elevations = elevationProfile.map((point) => point.elevation);

  return (
    <ElevationProfileChart
      profile={elevationProfile}
      length={length}
      description={
        proposal.kind === 'loop'
          ? t('profile.loop', {
              length: format.distance(length),
              lowest: format.elevation(Math.min(...elevations)),
              highest: format.elevation(Math.max(...elevations)),
            })
          : t('profile.uphill', {
              length: format.distance(length),
              start: format.elevation(elevations[0] ?? 0),
              top: format.elevation(elevations.at(-1) ?? 0),
            })
      }
    />
  );
}
