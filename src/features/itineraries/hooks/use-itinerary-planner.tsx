import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Position } from '@/shared/lib/position';
import type { MapOverlay } from '@/shared/map';
import type { Tab } from '@/shared/ui/tabs';

import { isRunning } from '@/shared/domain/values';

import { usePlanLoops } from '../api/plan-loops';
import { usePlanSessions } from '../api/plan-sessions';
import { usePlanUphill } from '../api/plan-uphill';
import { PlanPanel } from '../components/plan-panel';
import { DEFAULT_PLAN, type PlanForm } from '../domain';
import type { Proposal } from '../types';

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
  const sessions = usePlanSessions();
  const planning = { uphill, loop: loops, session: sessions }[form.kind];
  const proposals: readonly Proposal[] | undefined = planning.data;
  const shown = proposals?.[selected];

  const ask = () => {
    if (start === undefined) {
      setMissingStart(true);
      return;
    }
    setSelected(0);
    if (form.kind === 'uphill') {
      uphill.mutate({ start, ...form.uphill, activity: form.activity });
    } else if (form.kind === 'loop') {
      loops.mutate({ start, ...form.loop, activity: form.activity });
    } else {
      sessions.mutate({
        start,
        ...form.session,
        activity: isRunning(form.activity) ? form.activity : 'running',
      });
    }
  };

  const changeForm = (next: PlanForm) => {
    if (next.kind !== form.kind) {
      setSelected(0);
    }
    // Hill Sessions are running workouts: a cycling Activity becomes running.
    setForm(
      next.kind === 'session' && !isRunning(next.activity)
        ? { ...next, activity: 'running' }
        : next,
    );
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
      ...(shown && { line: positionsOf(drawnPathOf(shown)) }),
      ...(proposals && {
        alternatives: [
          // A session's Warm-up, then the other proposals.
          ...(shown?.kind === 'session' ? [positionsOf(shown.warmUp.path)] : []),
          ...proposals
            .filter((proposal) => proposal !== shown)
            .map((proposal) => positionsOf(drawnPathOf(proposal))),
        ],
      }),
      onMapClick: (position) => {
        setStart(position);
        setMissingStart(false);
      },
    },
  };
}

/** What stands for a proposal on the map: its path, or a session's Repeat. */
const drawnPathOf = (proposal: Proposal) =>
  proposal.kind === 'session' ? proposal.repeat.path : proposal.path;

/** GeoJSON pairs are [longitude, latitude]. */
function positionsOf(path: { readonly coordinates: readonly [number, number][] }): Position[] {
  return path.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
}
