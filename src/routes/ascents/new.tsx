import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { UploadForm } from '@/features/ascents';
import { useAuth } from '@/shared/auth';
import { buttonVariants } from '@/shared/ui/button-variants';

export const Route = createFileRoute('/ascents/new')({
  component: NewAscentPage,
});

function NewAscentPage() {
  const { t } = useTranslation('ascents');
  const navigate = useNavigate();
  const { session } = useAuth();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('upload.title')}</h1>
        <p className="mt-2 text-ink-muted">{t('upload.intro')}</p>
      </div>
      {/* Ascents are added by Contributors: any signed-in Visitor. */}
      {session ? (
        <UploadForm
          onCreated={(ascent) => {
            void navigate({ to: '/ascents/$ascentId', params: { ascentId: ascent.id } });
          }}
        />
      ) : (
        <div className="flex max-w-xl flex-col items-start gap-3 rounded-lg bg-lichen p-4">
          <p>{t('upload.signInNeeded')}</p>
          <Link to="/sign-in" className={buttonVariants()}>
            {t('upload.signIn')}
          </Link>
        </div>
      )}
    </section>
  );
}
