import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { AccountDetails } from '@/features/account';
import { StravaSection } from '@/features/strava';

export const Route = createFileRoute('/account')({
  component: AccountPage,
});

function AccountPage() {
  const { t } = useTranslation('account');
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('account.title')}</h1>
      <AccountDetails />
      <StravaSection />
    </section>
  );
}
