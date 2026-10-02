/** Choices offered in the Plan tab, in metres or ratios; they mirror the API's bounds. */
export const GRADIENT_CHOICES = Array.from({ length: 16 }, (_, percent) => percent / 100);
export const UPHILL_LENGTHS = [500, 1000, 2000, 3000, 5000, 8000, 10_000, 15_000, 20_000, 30_000];
export const RADII = [2000, 5000, 10_000, 25_000];

export const DEFAULT_UPHILL = {
  minGradient: 0.02,
  maxGradient: 0.05,
  length: 3000,
  radius: 10_000,
} as const;
