import { http, HttpResponse } from 'msw';

import { sha1 } from '@/shared/api/pwned-passwords';

import { PWNED_PASSWORDS, server } from './server';

/**
 * Pwned Passwords knowing these leaked passwords, answering by the first five
 * characters of their SHA-1 hash as the real range API does. Records the prefixes asked.
 */
export function pwnedPasswords(leaked: readonly string[], { failing = false } = {}) {
  const asked: string[] = [];
  server.use(
    http.get(`${PWNED_PASSWORDS}/range/:prefix`, async ({ params }) => {
      const prefix = String(params.prefix).toUpperCase();
      asked.push(prefix);
      if (failing) {
        return new HttpResponse(null, { status: 503 });
      }
      const hashes = await Promise.all(leaked.map(sha1));
      const lines = hashes
        .filter((hash) => hash.startsWith(prefix))
        .map((hash) => `${hash.slice(5)}:42`);
      return new HttpResponse([...lines, '0018A45C4D1DEF81644B54AB7F969B88D65:0'].join('\r\n'));
    }),
  );
  return { asked };
}
