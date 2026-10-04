const PWNED_PASSWORDS = 'https://api.pwnedpasswords.com/range';

/** A text's SHA-1 hash, in upper-case hexadecimal as Pwned Passwords writes it. */
export async function sha1(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Whether Pwned Passwords knows the password from data leaks. Only the first five
 * characters of its SHA-1 hash leave the browser (k-anonymity), padded; when the check
 * cannot be made, the password is let through: Supabase's own check replaces this one
 * on its Pro plan (ADR 0009).
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
