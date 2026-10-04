import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { SecondFactorStep } from '@/features/account';

export const Route = createFileRoute('/second-factor')({
  /** `then`: where the Visitor was headed when the code was asked for. */
  validateSearch: z.object({ then: z.string().optional() }),
  component: SecondFactorPage,
});

function SecondFactorPage() {
  const { t } = useTranslation('account');
  const { then } = Route.useSearch();
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('secondFactor.stepTitle')}</h1>
        <p className="mt-2 text-ink-muted">{t('secondFactor.stepIntro')}</p>
      </div>
      <SecondFactorStep then={then} />
    </section>
  );
}
