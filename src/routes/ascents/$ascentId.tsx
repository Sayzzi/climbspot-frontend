import { createFileRoute, notFound } from '@tanstack/react-router';

import {
  AscentDetail,
  AscentLoadError,
  AscentNotFound,
  ascentQuery,
  isAscentMissing,
} from '@/features/ascents';

export const Route = createFileRoute('/ascents/$ascentId')({
  loader: async ({ context: { queryClient }, params: { ascentId } }) => {
    try {
      // Reuse cached data when there is some (e.g. right after creating the Ascent).
      await queryClient.query({ ...ascentQuery(ascentId), staleTime: 'static' });
    } catch (error) {
      if (isAscentMissing(error)) {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- the router's not-found signal
        throw notFound();
      }
      throw error;
    }
  },
  component: AscentPage,
  notFoundComponent: AscentNotFound,
  errorComponent: ({ error }) => <AscentLoadError error={error} />,
});

function AscentPage() {
  const { ascentId } = Route.useParams();
  return <AscentDetail id={ascentId} />;
}
