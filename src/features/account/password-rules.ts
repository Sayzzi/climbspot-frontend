/** Passwords follow NIST SP 800-63B-4 (ADR 0009): long enough to stand alone, no composition rules. */
export const PASSWORD_MIN_LENGTH = 15;

/** Supabase keeps passwords with bcrypt, which reads 72 bytes at most. */
export const PASSWORD_MAX_BYTES = 72;

const PWNED_PASSWORDS = 'https://api.pwnedpasswords.com/range';

export type PasswordProblem = 'too-short' | 'too-long' | 'leaked';

/** What is wrong with a new password's length, if anything; any characters are fine. */
export function lengthProblem(password: string): PasswordProblem | undefined {
  // NIST counts each Unicode code point as one character.
  if (Array.from(password).length < PASSWORD_MIN_LENGTH) {
    return 'too-short';
  }
  return new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES ? 'too-long' : undefined;
}

/**
 * Whether Pwned Passwords knows the password from data leaks. Only the first five
 * characters of its SHA-1 hash leave the browser (k-anonymity); when the check cannot
 * be made, the password is let through: Supabase's own check replaces this one on its
 * Pro plan (ADR 0009).
 */
export async function isKnownLeaked(password: string): Promise<boolean> {
  try {
    const hash = await sha1(password);
    const response = await globalThis.fetch(`${PWNED_PASSWORDS}/${hash.slice(0, 5)}`, {
      headers: { 'Add-Padding': 'true' },
    });
    if (!response.ok) {
      return false;
    }
    const suffix = hash.slice(5);
    return (await response.text()).split('\n').some((line) => {
      const [candidate, count] = line.trim().split(':');
      return candidate === suffix && Number(count) > 0;
    });
  } catch {
    return false;
  }
}

async function sha1(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}
