import {
  isRunning,
  type Activity,
  type Relief,
  type RunningActivity,
} from '@/shared/domain/values';

export const itineraryKinds = ['uphill', 'loop', 'session'] as const;
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

export interface SessionCriteria {
  readonly repeats: number;
  readonly repeatLength: number;
  readonly minGradient: number;
  readonly maxGradient: number;
  readonly radius: number;
}

/** What the Visitor asks for in the Plan tab; each kind keeps its own criteria. */
export interface PlanForm {
  readonly kind: ItineraryKind;
  readonly uphill: UphillCriteria;
  readonly loop: LoopCriteria;
  readonly session: SessionCriteria;
  readonly activity: Activity;
}

/** Choices and bounds of the Plan tab, in metres or ratios; they mirror the API's bounds. */
export const GRADIENT_CHOICES = Array.from({ length: 31 }, (_, percent) => percent / 100);
export const RADII = [2000, 5000, 10_000, 25_000];
export const UPHILL_LENGTH = { minimum: 500, maximum: 30_000 } as const;
export const LOOP_DISTANCE = { minimum: 1000, maximum: 100_000 } as const;
export const REPEAT_LENGTH = { minimum: 200, maximum: 2000 } as const;
export const REPEAT_COUNTS = Array.from({ length: 19 }, (_, index) => index + 2);

export const DEFAULT_PLAN: PlanForm = {
  kind: 'uphill',
  uphill: { minGradient: 0.02, maxGradient: 0.05, length: 3000, radius: 10_000 },
  loop: { distance: 5000, relief: 'rolling' },
  session: { repeats: 8, repeatLength: 300, minGradient: 0.06, maxGradient: 0.08, radius: 10_000 },
  activity: 'running',
};

/** Hill Sessions are for running only: any other Activity asks for running. */
export const sessionActivity = (activity: Activity): RunningActivity =>
  isRunning(activity) ? activity : 'running';
