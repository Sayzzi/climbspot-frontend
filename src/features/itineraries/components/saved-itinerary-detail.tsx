import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MapView } from '@/shared/map';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { FactList } from '@/shared/ui/fact-list';

import {
  useDeleteSavedItinerary,
  useRenameSavedItinerary,
  useSavedItinerary,
} from '../api/saved-itineraries';
import { useProposalFacts } from '../hooks/use-proposal-description';
import { mainStretch, positionsOf } from '../proposal';
import type { SavedItinerary } from '../types';
import { NameForm } from './name-form';
import { ProposalDownloads } from './proposal-downloads';
import { ProposalProfile } from './proposal-profile';

/** A Saved Itinerary: on the map, with its profile, facts, downloads and changes. */
export function SavedItineraryDetail({ id }: { readonly id: string }) {
  const { t } = useTranslation('itineraries');
  const saved = useSavedItinerary(id);

  if (saved.error) {
    return <ErrorNotice error={saved.error} onRetry={() => void saved.refetch()} />;
  }
  if (!saved.data) {
    return <p className="text-ink-muted">{t('saved.loadingOne')}</p>;
  }
  return <Details saved={saved.data} />;
}

type Change = 'renaming' | 'deleting' | undefined;

function Details({ saved }: { readonly saved: SavedItinerary }) {
  const { t } = useTranslation('itineraries');
  const { proposal } = saved;
  const facts = useProposalFacts(proposal);
  const rename = useRenameSavedItinerary();
  const remove = useDeleteSavedItinerary();
  const [change, setChange] = useState<Change>();
  const path = positionsOf(mainStretch(proposal).path);
  const warmUp = proposal.kind === 'session' ? positionsOf(proposal.warmUp.path) : undefined;
  const center = path[0];

  return (
    <article className="flex min-w-0 flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-tight">{saved.name}</h2>

      {change === undefined && (
        <div className="flex flex-wrap gap-2">
          <ProposalDownloads proposal={proposal} name={saved.name} />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setChange('renaming');
            }}
          >
            {t('saved.rename')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setChange('deleting');
            }}
          >
            {t('saved.delete')}
          </Button>
        </div>
      )}
      {change === 'renaming' && (
        <NameForm
          label={t('saved.renameLabel', { name: saved.name })}
          initialName={saved.name}
          pending={rename.isPending}
          onSubmit={(name) => {
            rename.mutate(
              { id: saved.id, name },
              {
                onSuccess: () => {
                  setChange(undefined);
                },
              },
            );
          }}
          onCancel={() => {
            setChange(undefined);
          }}
        />
      )}
      {change === 'deleting' && (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-lichen p-4">
          <p>{t('saved.confirmDelete', { name: saved.name })}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate(saved.id);
              }}
            >
              {t('saved.delete')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setChange(undefined);
              }}
            >
              {t('saved.cancel')}
            </Button>
          </div>
        </div>
      )}
      {rename.error && (
        <ErrorNotice
          error={rename.error}
          onRetry={() => {
            setChange('renaming');
          }}
        />
      )}
      {remove.error && (
        <ErrorNotice
          error={remove.error}
          onRetry={() => {
            remove.mutate(saved.id);
          }}
        />
      )}

      {center && (
        <MapView
          label={t('saved.map', { name: saved.name })}
          center={center}
          zoom={13}
          fitTo={[...(warmUp ?? []), ...path]}
          line={path}
          {...(warmUp && { dashedLine: warmUp })}
          className="h-72 lg:h-96"
        />
      )}
      <ProposalProfile proposal={proposal} />
      <FactList className="grid-cols-2 sm:grid-cols-3" facts={facts} />
    </article>
  );
}
