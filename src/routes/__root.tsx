import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Link, Outlet, useLocation } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import {
  AccountMenu,
  SessionNotice,
  SignedInConfirmation,
  useFlatPaceSource,
  useFlatPaceSync,
  useSecondFactorStep,
} from '@/features/account';
import { useStravaSyncOnSignIn } from '@/features/strava';
import { cn } from '@/shared/lib/cn';
import { buttonVariants } from '@/shared/ui/button-variants';
import { LogoMark } from '@/shared/ui/logo';
import { FlatPaceSetting } from '@/shared/pace';
import { PoweredByStrava } from '@/shared/ui/strava-brand';
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
  useFlatPaceSync();
  useSecondFactorStep();
  const paceSource = useFlatPaceSource();
  useStravaSyncOnSignIn();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#content"
        // Not every browser moves the focus to an anchor's target: move it here.
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('content')?.focus();
        }}
        className="sr-only z-50 rounded-md bg-signpost px-4 py-3 font-semibold text-pine focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('nav.skip')}
      </a>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-20',
          !isHome && 'border-b border-pine/10 bg-lichen/90 backdrop-blur',
        )}
      >
        <nav className="flex h-16 items-center justify-between gap-4 px-4">
          <Link
            to="/"
            search={{ welcome: true }}
            className="flex min-h-11 items-center gap-2 font-display text-2xl font-extrabold text-pine"
          >
            <LogoMark />
            {/* On phones the mark alone leaves room for the controls. */}
            <span className="sr-only sm:not-sr-only">{t('app.name')}</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FlatPaceSetting {...paceSource} attribution={<PoweredByStrava />} />
            <UnitSwitch />
            {/* On phones, adding a climb lives in the account menu. */}
            <Link
              to="/ascents/new"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'hidden whitespace-nowrap sm:inline-flex',
              )}
            >
              {t('nav.addAscent')}
            </Link>
            <AccountMenu />
          </div>
        </nav>
        <SessionNotice />
      </header>
      <main
        id="content"
        tabIndex={-1}
        className={cn(
          'flex-1 focus:outline-none',
          !isHome && 'mx-auto w-full max-w-5xl px-4 pt-24 pb-12',
        )}
      >
        <Outlet />
      </main>
      <SignedInConfirmation />
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
