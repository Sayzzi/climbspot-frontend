import { useId, type ReactNode, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { activities, type Activity } from '@/shared/domain/values';
import { useDomainLabels } from '@/shared/i18n/use-domain-labels';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { ElevationProfileChart } from '@/shared/ui/elevation-profile-chart';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { FactList } from '@/shared/ui/fact-list';
import { useFormatters } from '@/shared/units';

import { GRADIENT_CHOICES, RADII, UPHILL_LENGTHS } from '../domain';
import type { UphillItinerary } from '../types';

export interface UphillForm {
  readonly minGradient: number;
  readonly maxGradient: number;
  readonly length: number;
  readonly radius: number;
  readonly activity: Activity;
}

interface PlanPanelProps {
  readonly hasStart: boolean;
  readonly missingStart: boolean;
  readonly form: UphillForm;
  readonly onFormChange: (form: UphillForm) => void;
  readonly onSubmit: () => void;
  readonly pending: boolean;
  readonly error: unknown;
  readonly proposals: readonly UphillItinerary[] | undefined;
  readonly selected: number;
  readonly onSelect: (index: number) => void;
}

/** Plan tab: where to start, what to look for, and the proposals. */
export function PlanPanel(props: PlanPanelProps) {
  const { t } = useTranslation('itineraries');
  const { form, onFormChange, proposals, selected } = props;
  const format = useFormatters();
  const labels = useDomainLabels();
  const shown = proposals?.[selected];

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!props.pending) {
      props.onSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <p className={cn('text-sm', props.hasStart ? 'text-ink' : 'text-ink-muted')}>
        {props.hasStart ? t('start.placed') : t('start.hint')}
      </p>

      <form noValidate onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Choice
            label={t('uphill.minGradient')}
            value={form.minGradient}
            options={GRADIENT_CHOICES}
            format={(value) => format.gradient(value)}
            onChange={(minGradient) => {
              onFormChange({
                ...form,
                minGradient,
                maxGradient: Math.max(form.maxGradient, minGradient),
              });
            }}
          />
          <Choice
            label={t('uphill.maxGradient')}
            value={form.maxGradient}
            options={GRADIENT_CHOICES}
            format={(value) => format.gradient(value)}
            onChange={(maxGradient) => {
              onFormChange({
                ...form,
                maxGradient,
                minGradient: Math.min(form.minGradient, maxGradient),
              });
            }}
          />
          <Choice
            label={t('uphill.length')}
            value={form.length}
            options={UPHILL_LENGTHS}
            format={(value) => format.distance(value)}
            onChange={(length) => {
              onFormChange({ ...form, length });
            }}
          />
          <Choice
            label={t('uphill.radius')}
            value={form.radius}
            options={RADII}
            format={(value) => format.distance(value)}
            onChange={(radius) => {
              onFormChange({ ...form, radius });
            }}
          />
        </div>
        <Field label={t('activity')}>
          {(id) => (
            <select
              id={id}
              value={form.activity}
              onChange={(event) => {
                onFormChange({ ...form, activity: event.target.value as Activity });
              }}
              className={selectClassName}
            >
              {activities.map((activity) => (
                <option key={activity} value={activity}>
                  {labels.activity(activity)}
                </option>
              ))}
            </select>
          )}
        </Field>

        {props.missingStart && (
          <p role="status" className="text-sm font-semibold text-danger">
            {t('start.missing')}
          </p>
        )}

        <Button type="submit" disabled={props.pending}>
          {props.pending ? t('submitting') : t('uphill.submit')}
        </Button>
      </form>

      {props.error !== null && props.error !== undefined && (
        <ErrorNotice error={props.error} onRetry={props.onSubmit} />
      )}

      {proposals?.length === 0 && (
        <div className="rounded-lg bg-lichen p-4">
          <p className="font-semibold">{t('empty.title')}</p>
          <p className="text-sm text-ink-muted">{t('empty.hint')}</p>
        </div>
      )}

      {proposals && proposals.length > 0 && (
        <ul aria-label={t('results')} className="flex flex-col divide-y divide-pine/10">
          {proposals.map((proposal, index) => {
            const name = t('name.uphill', {
              length: format.distance(proposal.length),
              gradient: format.gradient(proposal.averageGradient),
            });
            return (
              <li key={`${String(index)}-${name}`}>
                <article
                  className={cn(
                    '-mx-4 border-l-4 px-3 py-3',
                    index === selected ? 'border-blaze bg-lichen/60' : 'border-transparent',
                  )}
                >
                  <h3 className="text-lg leading-tight font-semibold">
                    <button
                      type="button"
                      aria-pressed={index === selected}
                      aria-label={t('show', { name })}
                      onClick={() => {
                        props.onSelect(index);
                      }}
                      className="text-left hover:underline focus-visible:outline-2 focus-visible:outline-pine"
                    >
                      {name}
                    </button>
                  </h3>
                  <p className={cn('text-sm', proposal.exact ? 'text-moss' : 'text-ink-muted')}>
                    {proposal.exact ? t('exact') : <Difference proposal={proposal} />}
                  </p>
                  <FactList
                    className="mt-2 grid-cols-3"
                    facts={[
                      { term: t('facts.length'), value: format.distance(proposal.length) },
                      {
                        term: t('facts.elevationGain'),
                        value: format.elevation(proposal.elevationGain),
                      },
                      {
                        term: t('facts.averageGradient'),
                        value: format.gradient(proposal.averageGradient),
                      },
                      {
                        term: t('facts.maximumGradient'),
                        value: format.gradient(proposal.maximumGradient),
                      },
                      { term: t('facts.category'), value: labels.category(proposal.category) },
                      {
                        term: t('facts.distanceToStart'),
                        value: t('away', { distance: format.distance(proposal.distanceToStart) }),
                      },
                    ]}
                  />
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {shown && (
        <ElevationProfileChart
          profile={shown.elevationProfile}
          length={shown.length}
          description={t('profile', {
            length: format.distance(shown.length),
            start: format.elevation(shown.elevationProfile[0]?.elevation ?? 0),
            top: format.elevation(shown.elevationProfile.at(-1)?.elevation ?? 0),
          })}
        />
      )}
    </div>
  );
}

function Difference({ proposal }: { readonly proposal: UphillItinerary }) {
  const { t } = useTranslation('itineraries');
  const format = useFormatters();

  return (
    <>
      {proposal.differences.map((difference) =>
        difference.kind === 'gradient'
          ? t('close.gradient', {
              actual: format.gradient(difference.actual),
              min: format.gradient(difference.min),
              max: format.gradient(difference.max),
            })
          : null,
      )}
    </>
  );
}

const selectClassName =
  'w-full rounded-md border border-pine/25 bg-white px-2 py-1.5 focus-visible:outline-2 focus-visible:outline-pine';

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

interface ChoiceProps {
  readonly label: string;
  readonly value: number;
  readonly options: readonly number[];
  readonly format: (value: number) => string;
  readonly onChange: (value: number) => void;
}

function Choice({ label, value, options, format, onChange }: ChoiceProps) {
  return (
    <Field label={label}>
      {(id) => (
        <select
          id={id}
          value={value}
          onChange={(event) => {
            onChange(Number(event.target.value));
          }}
          className={selectClassName}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {format(option)}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
