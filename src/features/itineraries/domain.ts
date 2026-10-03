import type { Activity, Relief } from '@/shared/domain/values';

export const itineraryKinds = ['uphill', 'loop'] as const;
export type ItineraryKind = (typeof itineraryKinds)[number];

export interface UphillCriteria {
  readonly minGradient: number;
  readonly maxGradient: number;
  readonly length: number;
  readonly radius: number;
}

export interface LoopCriteria {
  readonly distance: number;
  readonly relief: Relief;
}

/** What the Visitor asks for in the Plan tab; each kind keeps its own criteria. */
export interface PlanForm {
  readonly kind: ItineraryKind;
  readonly uphill: UphillCriteria;
  readonly loop: LoopCriteria;
  readonly activity: Activity;
}

/** Choices and bounds of the Plan tab, in metres or ratios; they mirror the API's bounds. */
export const GRADIENT_CHOICES = Array.from({ length: 31 }, (_, percent) => percent / 100);
export const RADII = [2000, 5000, 10_000, 25_000];
export const UPHILL_LENGTH = { minimum: 500, maximum: 30_000 } as const;
export const LOOP_DISTANCE = { minimum: 1000, maximum: 100_000 } as const;

export const DEFAULT_PLAN: PlanForm = {
  kind: 'uphill',
  uphill: { minGradient: 0.02, maxGradient: 0.05, length: 3000, radius: 10_000 },
  loop: { distance: 5000, relief: 'rolling' },
  activity: 'running',
};
