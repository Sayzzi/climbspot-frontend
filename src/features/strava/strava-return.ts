import { z } from 'zod';

/** What Strava adds to the address when it sends the Visitor back: a code and the state, or why not. */
export const stravaReturnSchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export type StravaReturn = z.infer<typeof stravaReturnSchema>;
