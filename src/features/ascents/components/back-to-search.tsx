import { Link, useCanGoBack, useLocation, useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '@/shared/ui/button-variants';

declare module '@tanstack/react-router' {
  interface HistoryState {
    /** Set when an Ascent page was opened from the search results. */
    fromSearch?: true;
  }
}

/**
 * Returns to the search the Visitor came from (keeping its filters and scroll),
 * or opens the search page when they arrived another way.
 */
export function BackToSearch({ variant = 'ghost' }: { readonly variant?: 'ghost' | 'secondary' }) {
  const { t } = useTranslation('ascents');
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const fromSearch = useLocation({ select: (location) => location.state.fromSearch === true });
  const className = buttonVariants({ variant, size: variant === 'ghost' ? 'sm' : 'md' });
  const label = (
    <>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
        <path
          d="M10 3 5 8l5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {t('detail.backToSearch')}
    </>
  );

  return fromSearch && canGoBack ? (
    <button
      type="button"
      className={className}
      onClick={() => {
        router.history.back();
      }}
    >
      {label}
    </button>
  ) : (
    <Link to="/" className={className}>
      {label}
    </Link>
  );
}
