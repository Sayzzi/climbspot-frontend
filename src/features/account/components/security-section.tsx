import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { NewPasswordForm } from './new-password-form';
import { PasskeysSection } from './passkeys-section';
import { SecondFactorSection } from './second-factor-section';

/** How the signed-in Visitor signs in: their password, second factor and passkeys. */
export function SecuritySection() {
  const { t } = useTranslation('account');
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 border-t border-pine/10 pt-6"
    >
      <h2 id={headingId} className="text-lg font-semibold">
        {t('security.title')}
      </h2>
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">{t('security.password.title')}</h3>
        <p className="text-sm text-ink-muted">{t('security.password.explanation')}</p>
        <NewPasswordForm />
      </div>
      <SecondFactorSection />
      <PasskeysSection />
    </section>
  );
}
