import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Position } from '@/shared/lib/position';
import type { MapOverlay } from '@/shared/map';
import type { Tab } from '@/shared/ui/tabs';

import { usePlanLoops } from '../api/plan-loops';
import { usePlanSessions } from '../api/plan-sessions';
import { usePlanUphill } from '../api/plan-uphill';
import { PlanPanel } from '../components/plan-panel';
import { DEFAULT_PLAN, sessionActivity, type PlanForm } from '../domain';
import { mainStretch, positionsOf } from '../proposal';
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
        activity: sessionActivity(form.activity),
      });
    }
  };

  const changeForm = (next: PlanForm) => {
    if (next.kind !== form.kind) {
      setSelected(0);
    }
    setForm(next.kind === 'session' ? { ...next, activity: sessionActivity(next.activity) } : next);
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
      ...(shown && { line: positionsOf(mainStretch(shown).path) }),
      ...(shown?.kind === 'session' && { dashedLine: positionsOf(shown.warmUp.path) }),
      ...(proposals && {
        alternatives: proposals
          .filter((proposal) => proposal !== shown)
          .map((proposal) => positionsOf(mainStretch(proposal).path)),
      }),
      onMapClick: (position) => {
        setStart(position);
        setMissingStart(false);
      },
    },
  };
}
