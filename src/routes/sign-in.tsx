import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { SignInForm } from '@/features/account';

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  const { t } = useTranslation('account');
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('signIn.title')}</h1>
        <p className="mt-2 text-ink-muted">{t('signIn.intro')}</p>
      </div>
      <SignInForm />
    </section>
  );
}
