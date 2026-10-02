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

/** Choices offered in the Plan tab, in metres or ratios; they mirror the API's bounds. */
export const GRADIENT_CHOICES = Array.from({ length: 16 }, (_, percent) => percent / 100);
export const UPHILL_LENGTHS = [500, 1000, 2000, 3000, 5000, 8000, 10_000, 15_000, 20_000, 30_000];
export const RADII = [2000, 5000, 10_000, 25_000];
export const LOOP_DISTANCES = [
  2000, 3000, 5000, 8000, 10_000, 15_000, 20_000, 30_000, 50_000, 80_000, 100_000,
];

export const DEFAULT_PLAN: PlanForm = {
  kind: 'uphill',
  uphill: { minGradient: 0.02, maxGradient: 0.05, length: 3000, radius: 10_000 },
  loop: { distance: 5000, relief: 'rolling' },
  activity: 'running',
};
