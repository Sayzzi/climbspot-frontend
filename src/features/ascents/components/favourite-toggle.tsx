import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/shared/auth';
import { cn } from '@/shared/lib/cn';
import { Confirmation } from '@/shared/ui/confirmation';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { textLinkClassName } from '@/shared/ui/text-link';

import type { FavouriteToggle } from '../api/favourite-ascents';
import { StarIcon } from './star-icon';

interface FavouriteStarProps {
  readonly ascent: { readonly id: string; readonly name: string; readonly favourite?: boolean };
  readonly toggle: FavouriteToggle;
  /** What a Visitor who is not signed in sees: an invitation to sign in, or nothing. */
  readonly signedOut?: 'invite' | 'nothing';
}

/** Keeps a climb in the signed-in Visitor's favourites, or not; signed out, invites to sign in. */
export function FavouriteStar({ ascent, toggle, signedOut = 'invite' }: FavouriteStarProps) {
  const { t } = useTranslation('ascents');
  const { session, secondFactorPending } = useAuth();

  if (!session) {
    if (signedOut === 'nothing') {
      return null;
    }
    if (secondFactorPending) {
      return (
        <Link to="/second-factor" className={`text-sm ${textLinkClassName}`}>
          {t('favourite.enterCode')}
        </Link>
      );
    }
    return (
      <Link to="/sign-in" className={`text-sm ${textLinkClassName}`}>
        {t('favourite.signIn')}
      </Link>
    );
  }
  const favourite = ascent.favourite ?? false;
  return (
    <button
      type="button"
      aria-pressed={favourite}
      aria-label={t('favourite.toggle', { name: ascent.name })}
      onClick={() => {
        // One change at a time per climb, so that the API ends where the star shows.
        if (!(toggle.isPending && toggle.variables.id === ascent.id)) {
          toggle.mutate({ id: ascent.id, favourite: !favourite });
        }
      }}
      className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-pine hover:bg-white focus-visible:outline-3 focus-visible:outline-pine"
    >
      <StarIcon
        className="size-7"
        pathClassName={cn(
          'stroke-pine transition-colors duration-200',
          favourite ? 'fill-signpost' : 'fill-transparent',
        )}
      />
    </button>
  );
}

/** Says that a climb was added to or removed from the favourites, or why it could not be. */
export function FavouriteFeedback({ toggle }: { readonly toggle: FavouriteToggle }) {
  const { t } = useTranslation('ascents');
  const { session } = useAuth();

  // A session that ended says so itself; trying again could only fail.
  if (!session) {
    return null;
  }
  if (toggle.isSuccess) {
    return (
      <Confirmation className="self-start">
        {t(toggle.variables.favourite ? 'favourite.added' : 'favourite.removed')}
      </Confirmation>
    );
  }
  if (toggle.isError) {
    return (
      <ErrorNotice
        error={toggle.error}
        onRetry={() => {
          toggle.mutate(toggle.variables);
        }}
      />
    );
  }
  return null;
}
