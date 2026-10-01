import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { UploadForm } from '@/features/ascents';

export const Route = createFileRoute('/ascents/new')({
  component: NewAscentPage,
});

function NewAscentPage() {
  const { t } = useTranslation('ascents');
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('upload.title')}</h1>
        <p className="mt-2 text-ink-muted">{t('upload.intro')}</p>
      </div>
      <UploadForm
        onCreated={(ascent) => {
          void navigate({ to: '/ascents/$ascentId', params: { ascentId: ascent.id } });
        }}
      />
    </section>
  );
}
