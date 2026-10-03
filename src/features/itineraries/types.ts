import type { components } from '@/shared/api/schema.gen';

export type UphillItinerary = components['schemas']['UphillItinerary'];
export type LoopItinerary = components['schemas']['LoopItinerary'];
export type Itinerary = UphillItinerary | LoopItinerary;
export type UphillRequest = components['schemas']['UphillRequest'];
export type LoopRequest = components['schemas']['LoopRequest'];
export type HillSession = components['schemas']['HillSession'];
export type HillSessionRequest = components['schemas']['HillSessionRequest'];
/** Whatever the Plan tab proposes: an Itinerary or a Hill Session. */
export type Proposal = Itinerary | HillSession;
/** A copy of a proposal the Visitor kept, under the name they gave it. */
export type SavedItinerary = Omit<components['schemas']['SavedItinerary'], 'proposal'> & {
  readonly proposal: Proposal;
};
export type SavedItinerarySummary = components['schemas']['SavedItinerarySummary'];
