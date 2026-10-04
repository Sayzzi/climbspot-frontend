import { useId, useState, type ReactNode, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';
import { useFormatters, useUnits } from '@/shared/units';

import { paceBounds, parsePace, type PaceProblem } from './pace';
import { useFlatPace } from './use-flat-pace';

/** Another pace the Visitor may go back to, e.g. the one worked out from their runs. */
export interface PaceToRevertTo {
  readonly label: string;
  readonly onRevert: () => void;
}

interface FlatPaceSettingProps {
  /** Where the pace shown comes from, when not from the Visitor (e.g. "Strava"). */
  readonly source?: string | undefined;
  /** Shown in the setting with a pace from elsewhere, e.g. the attribution its source requires. */
  readonly attribution?: ReactNode;
  readonly revertTo?: PaceToRevertTo | undefined;
}

/** The Flat Pace in the header: shows it, or invites to set it, and opens a small form. */
export function FlatPaceSetting({ source, attribution, revertTo }: FlatPaceSettingProps = {}) {
  const { t } = useTranslation();
  const { system } = useUnits();
  const format = useFormatters();
  const { secondsPerKm, setSecondsPerKm, isSettingOpen, openSetting, closeSetting } = useFlatPace();
  const currentPace =
    secondsPerKm === undefined
      ? undefined
      : t(`pace.per.${system}`, { pace: format.pace(secondsPerKm) });

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isSettingOpen}
        // Once set, the name says what the figure is; until then the visible words name it.
        aria-label={
          currentPace === undefined
            ? undefined
            : t(source === undefined ? 'pace.current' : 'pace.currentFrom', {
                pace: currentPace,
                source,
              })
        }
        onClick={isSettingOpen ? closeSetting : openSetting}
        className="rounded-full bg-white px-2.5 py-1.5 text-sm whitespace-nowrap shadow-sm ring-1 ring-pine/15 focus-visible:outline-2 focus-visible:outline-pine sm:px-3"
      >
        {currentPace === undefined
          ? t('pace.unset')
          : [currentPace, source].filter(Boolean).join(' · ')}
      </button>
      {isSettingOpen && (
        <PaceForm
          initial={secondsPerKm === undefined ? '' : format.pace(secondsPerKm)}
          onSave={(next) => {
            setSecondsPerKm(next);
            closeSetting();
          }}
          onClose={closeSetting}
          attribution={source === undefined ? undefined : attribution}
          {...(revertTo && {
            revertTo: {
              ...revertTo,
              onRevert: () => {
                revertTo.onRevert();
                closeSetting();
              },
            },
          })}
        />
      )}
    </div>
  );
}

interface PaceFormProps {
  readonly initial: string;
  readonly onSave: (secondsPerKm: number) => void;
  readonly onClose: () => void;
  readonly revertTo?: PaceToRevertTo;
  readonly attribution?: ReactNode;
}

function PaceForm({ initial, onSave, onClose, revertTo, attribution }: PaceFormProps) {
  const { t } = useTranslation();
  const { system } = useUnits();
  const format = useFormatters();
  const bounds = paceBounds(system);
  const [text, setText] = useState(initial);
  const [problem, setProblem] = useState<PaceProblem>();
  const inputId = useId();
  const problemId = useId();

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parsePace(text, system);
    if ('problem' in parsed) {
      setProblem(parsed.problem);
      return;
    }
    onSave(parsed.secondsPerKm);
  };

  return (
    <div
      role="dialog"
      aria-label={t('pace.dialog')}
      // Full width under the header on phones, below the button on wider screens.
      className="fixed inset-x-4 top-16 z-30 rounded-xl bg-white p-4 text-sm shadow-lg ring-1 ring-pine/15 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-72"
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor={inputId} className="font-medium">
          {t(`pace.input.${system}`)}
        </label>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={t('pace.placeholder')}
          // The form opens on purpose, for this one field.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          value={text}
          onChange={(event) => {
            setText(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onClose();
            }
          }}
          aria-invalid={problem !== undefined}
          aria-describedby={problem === undefined ? undefined : problemId}
          className="rounded-md border border-pine/25 px-2 py-1.5 focus-visible:outline-2 focus-visible:outline-pine"
        />
        {problem !== undefined && (
          <p id={problemId} role="alert" className="text-danger">
            {problem === 'format'
              ? t('pace.errors.format')
              : t('pace.errors.range', {
                  fastest: format.pace(bounds.fastest),
                  slowest: format.pace(bounds.slowest),
                  unit: t(`pace.unit.${system}`),
                })}
          </p>
        )}
        <Button type="submit" size="sm">
          {t('pace.save')}
        </Button>
      </form>
      {attribution && <div className="mt-2">{attribution}</div>}
      {revertTo && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 w-full"
          onClick={revertTo.onRevert}
        >
          {revertTo.label}
        </Button>
      )}
    </div>
  );
}
