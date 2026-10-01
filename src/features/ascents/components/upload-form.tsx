import { useId, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { errorMessageKey } from '@/shared/api/error-message';
import { Button } from '@/shared/ui/button';

import { useCreateAscent } from '../api/create-ascent';
import {
  activitiesBySurface,
  MAXIMUM_GPX_FILE_SIZE,
  MAXIMUM_NAME_LENGTH,
  surfaces,
} from '../domain';
import { useAscentLabels } from '../hooks/use-ascent-labels';
import type { Ascent, Surface } from '../types';

type Field = 'name' | 'surface' | 'gpx';
type FieldErrors = Partial<Record<Field, string>>;

interface UploadFormProps {
  readonly onCreated: (ascent: Ascent) => void;
}

/** GPX file, name and Surface of a new Ascent. */
export function UploadForm({ onCreated }: UploadFormProps) {
  const { t } = useTranslation('ascents');
  const { t: tCommon } = useTranslation();
  const labels = useAscentLabels();
  const createAscent = useCreateAscent();
  const ids = { name: useId(), surface: useId(), gpx: useId() };

  const [name, setName] = useState('');
  const [surface, setSurface] = useState<Surface>();
  const [gpx, setGpx] = useState<File>();
  const [errors, setErrors] = useState<FieldErrors>({});

  const validate = (): FieldErrors => {
    const trimmed = name.trim();
    return {
      ...(trimmed === '' && { name: t('upload.errors.nameRequired') }),
      ...(trimmed.length > MAXIMUM_NAME_LENGTH && { name: t('upload.errors.nameTooLong') }),
      ...(surface === undefined && { surface: t('upload.errors.surfaceRequired') }),
      ...(gpx === undefined && { gpx: t('upload.errors.fileRequired') }),
      ...(gpx && gpx.size > MAXIMUM_GPX_FILE_SIZE && { gpx: t('upload.errors.fileTooLarge') }),
    };
  };

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0 || !surface || !gpx || createAscent.isPending) {
      return;
    }
    createAscent.mutate({ name: name.trim(), surface, gpx }, { onSuccess: onCreated });
  };

  return (
    <form noValidate onSubmit={submit} className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor={ids.name} className="font-medium">
          {t('upload.name')}
        </label>
        <input
          id={ids.name}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          aria-invalid={errors.name !== undefined}
          aria-describedby={errors.name && `${ids.name}-error`}
          className="rounded-lg border border-brand-200 px-3 py-2"
        />
        <FieldError id={`${ids.name}-error`} message={errors.name} />
      </div>

      <fieldset
        role="radiogroup"
        aria-labelledby={ids.surface}
        aria-describedby={errors.surface && `${ids.surface}-error`}
        className="flex flex-col gap-2"
      >
        <legend id={ids.surface} className="mb-1 font-medium">
          {t('upload.surface')}
        </legend>
        {surfaces.map((option) => (
          <label
            key={option}
            className="flex items-start gap-3 rounded-lg border border-brand-100 p-3 has-checked:border-brand-600 has-checked:bg-brand-50"
          >
            <input
              type="radio"
              name="surface"
              value={option}
              checked={surface === option}
              onChange={() => {
                setSurface(option);
              }}
              className="mt-1 accent-brand-600"
            />
            <span>
              <span className="block font-medium">{labels.surface(option)}</span>{' '}
              <span className="block text-sm text-ink-muted">
                {labels.activities(activitiesBySurface[option])}
              </span>
            </span>
          </label>
        ))}
        <FieldError id={`${ids.surface}-error`} message={errors.surface} />
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor={ids.gpx} className="font-medium">
          {t('upload.file')}
        </label>
        <input
          id={ids.gpx}
          type="file"
          accept=".gpx,application/gpx+xml"
          onChange={(event) => {
            setGpx(event.target.files?.[0]);
          }}
          aria-invalid={errors.gpx !== undefined}
          aria-describedby={errors.gpx && `${ids.gpx}-error`}
        />
        <FieldError id={`${ids.gpx}-error`} message={errors.gpx} />
      </div>

      {createAscent.isError && (
        <p role="alert" className="rounded-lg bg-brand-50 p-3">
          {tCommon(errorMessageKey(createAscent.error))}
        </p>
      )}

      <div>
        <Button type="submit" disabled={createAscent.isPending}>
          {createAscent.isPending ? t('upload.submitting') : t('upload.submit')}
        </Button>
      </div>
    </form>
  );
}

function FieldError({
  id,
  message,
}: {
  readonly id: string;
  readonly message?: string | undefined;
}) {
  return message ? (
    <p id={id} className="text-sm text-red-700">
      {message}
    </p>
  ) : null;
}
