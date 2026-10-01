import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { unwrap } from '@/shared/api/request';

import type { Surface } from '../types';
import { asAscent, ascentQuery } from './ascent';

export interface NewAscent {
  readonly name: string;
  readonly surface: Surface;
  readonly gpx: File;
}

/** Uploads a GPX file as a new Ascent, and caches the created Ascent for its page. */
export function useCreateAscent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, surface, gpx }: NewAscent) => {
      const form = new FormData();
      form.set('name', name);
      form.set('surface', surface);
      form.set('gpx', gpx, gpx.name);

      return asAscent(
        await unwrap(
          apiClient.POST('/ascents', {
            // The typed body only documents the fields; the file travels as multipart.
            body: { name, surface, gpx: gpx.name },
            bodySerializer: () => form,
          }),
        ),
      );
    },
    onSuccess: (ascent) => {
      queryClient.setQueryData(ascentQuery(ascent.id).queryKey, ascent);
    },
  });
}
