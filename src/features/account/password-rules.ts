import { isKnownLeaked } from '@/shared/api/pwned-passwords';

/** Passwords follow NIST SP 800-63B-4: long enough to stand alone, no composition rules. */
export const PASSWORD_MIN_LENGTH = 15;

/** Supabase keeps passwords with bcrypt, which reads 72 bytes at most (ADR 0009). */
export const PASSWORD_MAX_BYTES = 72;

export type PasswordProblem = 'too-short' | 'too-long' | 'leaked';

/** What is wrong with a new password's length, if anything; any characters are fine. */
export function lengthProblem(password: string): PasswordProblem | undefined {
  // NIST counts each Unicode code point as one character.
  if (Array.from(password).length < PASSWORD_MIN_LENGTH) {
    return 'too-short';
  }
  return new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES ? 'too-long' : undefined;
}

/** What is wrong with a new password, if anything: its length first, then known leaks. */
export async function newPasswordProblem(password: string): Promise<PasswordProblem | undefined> {
  return lengthProblem(password) ?? ((await isKnownLeaked(password)) ? 'leaked' : undefined);
}
