import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(source: Record<string, unknown>): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }

  return result.data;
}

export const env = parseEnv(import.meta.env);
