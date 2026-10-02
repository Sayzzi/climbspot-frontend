import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Link, Outlet, useLocation } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useScrollProgress } from '@/shared/hooks/use-scroll-progress';
import { cn } from '@/shared/lib/cn';
import { buttonVariants } from '@/shared/ui/button-variants';
import { UnitSwitch } from '@/shared/units';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  const { t } = useTranslation();
  const isHome = useLocation({ select: (location) => location.pathname === '/' });
  const reveal = useScrollProgress();
  // On the home page the big name is the brand; the small one appears as it dissolves.
  const brandOpacity = isHome ? Math.max(0, reveal * 2 - 1) : 1;

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-20',
          !isHome && 'border-b border-pine/10 bg-lichen/90 backdrop-blur',
        )}
      >
        <nav className="flex h-16 items-center justify-between gap-4 px-4">
          <Link
            to="/"
            style={{ opacity: brandOpacity }}
            className="font-display text-2xl font-extrabold text-pine focus-visible:outline-2 focus-visible:outline-pine"
          >
            {t('app.name')}
          </Link>
          <div className="flex items-center gap-2">
            <UnitSwitch />
            <Link to="/ascents/new" className={buttonVariants({ size: 'sm' })}>
              {t('nav.addAscent')}
            </Link>
          </div>
        </nav>
      </header>
      <main className={cn('flex-1', !isHome && 'mx-auto w-full max-w-5xl px-4 pt-24 pb-12')}>
        <Outlet />
      </main>
    </div>
  );
}

function NotFound() {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="text-4xl font-extrabold">{t('notFound.title')}</h1>
      <p className="text-ink-muted">{t('notFound.description')}</p>
      <Link to="/" className={buttonVariants({ variant: 'secondary' })}>
        {t('notFound.backHome')}
      </Link>
    </section>
  );
}
