import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/shared/ui/button-variants';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-brand-100 bg-white">
        <nav className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Link to="/" className="text-lg font-semibold text-brand-700">
            {t('app.name')}
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}

function NotFound() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">{t('notFound.title')}</h1>
      <p className="text-ink-muted">{t('notFound.description')}</p>
      <Link to="/" className={buttonVariants({ variant: 'secondary' })}>
        {t('notFound.backHome')}
      </Link>
    </section>
  );
}
