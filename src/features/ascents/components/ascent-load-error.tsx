import { useRouter } from '@tanstack/react-router';

import { ErrorNotice } from '@/shared/ui/error-notice';

import { BackToSearch } from './back-to-search';

export function AscentLoadError({ error }: { readonly error: unknown }) {
  const router = useRouter();

  return (
    <ErrorNotice
      error={error}
      onRetry={() => {
        void router.invalidate();
      }}
    >
      <BackToSearch variant="secondary" />
    </ErrorNotice>
  );
}
