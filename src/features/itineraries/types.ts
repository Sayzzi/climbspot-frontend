import type { components } from '@/shared/api/schema.gen';

export type UphillItinerary = components['schemas']['UphillItinerary'];
export type LoopItinerary = components['schemas']['LoopItinerary'];
export type Itinerary = UphillItinerary | LoopItinerary;
export type UphillRequest = components['schemas']['UphillRequest'];
export type LoopRequest = components['schemas']['LoopRequest'];
