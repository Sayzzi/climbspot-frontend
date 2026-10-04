import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { NewPasswordForm } from '@/features/account';
import { SignedInOnly } from '@/shared/auth';

export const Route = createFileRoute('/new-password')({
  component: NewPasswordPage,
});

/** Where the link to choose a new password brings the Visitor, signed in by it. */
function NewPasswordPage() {
  const { t } = useTranslation('account');
  return (
    <section className="flex max-w-sm flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('newPassword.title')}</h1>
      <SignedInOnly reason={t('newPassword.expired')}>
        <NewPasswordForm />
        <Link to="/account" className="font-semibold text-pine underline underline-offset-2">
          {t('newPassword.toAccount')}
        </Link>
      </SignedInOnly>
    </section>
  );
}
