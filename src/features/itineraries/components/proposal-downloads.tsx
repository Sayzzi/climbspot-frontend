import { useTranslation } from 'react-i18next';

import { fileNameFor, saveFile } from '@/shared/lib/save-file';
import { Button } from '@/shared/ui/button';
import { useFormatters } from '@/shared/units';

import { GPX_TYPE, itineraryTrack, sessionTrack, toGpx } from '../gpx';
import type { HillSession, Proposal } from '../types';

interface ProposalDownloadsProps {
  readonly proposal: Proposal;
  /** The proposal's name, which names its files. */
  readonly name: string;
}

/** Saves a proposal as a GPX track, and a Hill Session as a FIT workout too. */
export function ProposalDownloads({ proposal, name }: ProposalDownloadsProps) {
  const { t } = useTranslation('itineraries');
  const format = useFormatters();
  const fileName = t(`file.${proposal.kind}`, { name });

  const saveWorkout = async (session: HillSession) => {
    // The FIT SDK is large: loaded only when a workout is saved.
    const { FIT_TYPE, toFitWorkout } = await import('../fit');
    saveFile(
      fileNameFor(fileName, 'fit'),
      toFitWorkout(session, name, {
        warmUp: t('workout.warmUp'),
        repeat: (index, count) =>
          t('workout.repeat', { index: format.number(index), count: format.number(count) }),
        recovery: t('workout.recovery'),
        coolDown: t('workout.coolDown'),
      }),
      FIT_TYPE,
    );
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          const track =
            proposal.kind === 'session' ? sessionTrack(proposal) : itineraryTrack(proposal);
          saveFile(fileNameFor(fileName, 'gpx'), toGpx(track, fileName), GPX_TYPE);
        }}
      >
        {t('download')}
      </Button>
      {proposal.kind === 'session' && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            void saveWorkout(proposal);
          }}
        >
          {t('downloadWorkout')}
        </Button>
      )}
    </>
  );
}
