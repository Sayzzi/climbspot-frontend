import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Position } from '@/shared/lib/position';
import type { MapOverlay } from '@/shared/map';
import type { Tab } from '@/shared/ui/tabs';

import { usePlanUphill } from '../api/plan-uphill';
import { PlanPanel, type UphillForm } from '../components/plan-panel';
import { DEFAULT_UPHILL } from '../domain';

/**
 * The Plan tab and what it adds to the map: the starting point the Visitor places,
 * and the proposal they select.
 */
export function useItineraryPlanner(): Tab & { readonly mapOverlay: MapOverlay } {
  const { t } = useTranslation('itineraries');
  const [start, setStart] = useState<Position>();
  const [form, setForm] = useState<UphillForm>({ ...DEFAULT_UPHILL, activity: 'running' });
  const [missingStart, setMissingStart] = useState(false);
  const [selected, setSelected] = useState(0);
  const planning = usePlanUphill();
  const shown = planning.data?.[selected];

  const ask = () => {
    if (start === undefined) {
      setMissingStart(true);
      return;
    }
    setSelected(0);
    planning.mutate({ start, ...form });
  };

  return {
    id: 'plan',
    label: t('tab'),
    content: (
      <PlanPanel
        hasStart={start !== undefined}
        missingStart={missingStart}
        form={form}
        onFormChange={setForm}
        onSubmit={ask}
        pending={planning.isPending}
        error={planning.error}
        proposals={planning.data}
        selected={selected}
        onSelect={setSelected}
      />
    ),
    mapOverlay: {
      markers: start
        ? [{ id: 'plan-start', position: start, label: t('start.marker'), tone: 'start' }]
        : [],
      ...(shown && {
        // GeoJSON pairs are [longitude, latitude].
        line: shown.path.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
      }),
      onMapClick: (position) => {
        setStart(position);
        setMissingStart(false);
      },
    },
  };
}
