import { useId, useState, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';

/** Longest name of a Saved Itinerary, as the API allows. */
const NAME_MAX_LENGTH = 100;

interface NameFormProps {
  readonly label: string;
  readonly initialName: string;
  readonly pending: boolean;
  readonly onSubmit: (name: string) => void;
  readonly onCancel: () => void;
}

/** Names a Saved Itinerary: when saving it, or renaming it. */
export function NameForm({ label, initialName, pending, onSubmit, onCancel }: NameFormProps) {
  const { t } = useTranslation('itineraries');
  const [name, setName] = useState(initialName);
  const [missing, setMissing] = useState(false);
  const inputId = useId();

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    setMissing(trimmed === '');
    if (trimmed !== '' && !pending) {
      onSubmit(trimmed);
    }
  };

  return (
    <form noValidate aria-label={label} onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {t('saved.name')}
      </label>
      <input
        id={inputId}
        value={name}
        maxLength={NAME_MAX_LENGTH}
        aria-invalid={missing}
        onChange={(event) => {
          setName(event.target.value);
        }}
        className="rounded-md border border-pine/25 bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-pine"
      />
      {missing && <p className="text-sm font-semibold text-danger">{t('saved.nameMissing')}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {t('saved.save')}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          {t('saved.cancel')}
        </Button>
      </div>
    </form>
  );
}
