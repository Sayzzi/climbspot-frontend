import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Position } from '@/shared/lib/position';
import type { MapOverlay } from '@/shared/map';
import type { Tab } from '@/shared/ui/tabs';

import { usePlanLoops } from '../api/plan-loops';
import { usePlanUphill } from '../api/plan-uphill';
import { PlanPanel } from '../components/plan-panel';
import { DEFAULT_PLAN, type PlanForm } from '../domain';
import type { Itinerary } from '../types';

/**
 * The Plan tab and what it adds to the map: the starting point the Visitor places,
 * and the proposal they select. Each kind of Itinerary keeps its own proposals.
 */
export function useItineraryPlanner(): Tab & { readonly mapOverlay: MapOverlay } {
  const { t } = useTranslation('itineraries');
  const [start, setStart] = useState<Position>();
  const [form, setForm] = useState<PlanForm>(DEFAULT_PLAN);
  const [missingStart, setMissingStart] = useState(false);
  const [selected, setSelected] = useState(0);
  const uphill = usePlanUphill();
  const loops = usePlanLoops();
  const planning = form.kind === 'uphill' ? uphill : loops;
  const proposals: readonly Itinerary[] | undefined = planning.data;
  const shown = proposals?.[selected];

  const ask = () => {
    if (start === undefined) {
      setMissingStart(true);
      return;
    }
    setSelected(0);
    if (form.kind === 'uphill') {
      uphill.mutate({ start, ...form.uphill, activity: form.activity });
    } else {
      loops.mutate({ start, ...form.loop, activity: form.activity });
    }
  };

  const changeForm = (next: PlanForm) => {
    if (next.kind !== form.kind) {
      setSelected(0);
    }
    setForm(next);
  };

  return {
    id: 'plan',
    label: t('tab'),
    content: (
      <PlanPanel
        hasStart={start !== undefined}
        missingStart={missingStart}
        form={form}
        onFormChange={changeForm}
        onSubmit={ask}
        pending={planning.isPending}
        error={planning.error}
        proposals={proposals}
        selected={selected}
        onSelect={setSelected}
      />
    ),
    mapOverlay: {
      markers: start
        ? [{ id: 'plan-start', position: start, label: t('start.marker'), tone: 'start' }]
        : [],
      ...(shown && { line: positionsOf(shown) }),
      ...(proposals && {
        alternatives: proposals.filter((proposal) => proposal !== shown).map(positionsOf),
      }),
      onMapClick: (position) => {
        setStart(position);
        setMissingStart(false);
      },
    },
  };
}

/** GeoJSON pairs are [longitude, latitude]. */
function positionsOf(itinerary: Itinerary): Position[] {
  return itinerary.path.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
}
