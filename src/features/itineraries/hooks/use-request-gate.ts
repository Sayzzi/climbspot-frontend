import { useState } from 'react';

import type { UnitSystem } from '@/shared/units';

import type { ItineraryKind } from '../domain';

/**
 * Whether the Plan tab's request may be sent: no typed distance of the kind asked is
 * invalid. Problems are shown once the Visitor has tried to send.
 */
export function useRequestGate(system: UnitSystem) {
  const [invalidKinds, setInvalidKinds] = useState<ReadonlySet<ItineraryKind>>(new Set());
  const [triedToSend, setTriedToSend] = useState(false);
  const [checkedIn, setCheckedIn] = useState(system);
  // Switching units rewrites every typed distance from a valid value.
  if (checkedIn !== system) {
    setCheckedIn(system);
    setInvalidKinds(new Set());
  }

  return {
    showProblems: triedToSend,
    validityOf: (kind: ItineraryKind) => (valid: boolean) => {
      setInvalidKinds((current) => {
        const next = new Set(current);
        if (valid) next.delete(kind);
        else next.add(kind);
        return next;
      });
    },
    /** Records the attempt, and says whether the request for `kind` may go. */
    mayAsk: (kind: ItineraryKind) => {
      setTriedToSend(true);
      return !invalidKinds.has(kind);
    },
  };
}
