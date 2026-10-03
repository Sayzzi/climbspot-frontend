import { Link } from '@tanstack/react-router';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/shared/auth';
import { cn } from '@/shared/lib/cn';
import { buttonVariants } from '@/shared/ui/button-variants';

import { useMyAccount } from '../api/my-account';

const itemClassName =
  'block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-lichen focus-visible:outline-2 focus-visible:outline-pine';

/** The header's way into the account: Sign in, or the signed-in Visitor's menu. */
export function AccountMenu() {
  const { t } = useTranslation('account');
  const { available, session, signOut } = useAuth();
  const { data: account } = useMyAccount();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const container = useRef<HTMLDivElement>(null);

  // Closes when the Visitor clicks elsewhere or presses Escape.
  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !container.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  if (!available) {
    return null;
  }

  if (!session) {
    return (
      <Link
        to="/sign-in"
        className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'whitespace-nowrap')}
      >
        {t('signIn.title')}
      </Link>
    );
  }

  const name = account?.displayName ?? session.email ?? '';
  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t('menu.label', { name })}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className="grid size-9 place-items-center rounded-full bg-pine font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
      >
        <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full right-0 z-30 mt-2 w-48 rounded-xl bg-white p-1 shadow-lg ring-1 ring-pine/15"
        >
          <Link
            role="menuitem"
            to="/ascents/new"
            className={itemClassName}
            onClick={() => {
              setOpen(false);
            }}
          >
            {t('menu.addAscent')}
          </Link>
          <Link
            role="menuitem"
            to="/account"
            className={itemClassName}
            onClick={() => {
              setOpen(false);
            }}
          >
            {t('menu.account')}
          </Link>
          <button
            type="button"
            role="menuitem"
            className={itemClassName}
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            {t('menu.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
