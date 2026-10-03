import type { SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { activities, runningActivities, type Activity } from '@/shared/domain/values';
import { useDomainLabels } from '@/shared/i18n/use-domain-labels';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { ElevationProfileChart } from '@/shared/ui/elevation-profile-chart';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { useFormatters, useUnits } from '@/shared/units';

import { itineraryKinds, type PlanForm } from '../domain';
import { useRequestGate } from '../hooks/use-request-gate';
import { mainStretch } from '../proposal';
import type { Proposal } from '../types';
import { LoopFields, SessionFields, UphillFields } from './criteria-fields';
import { Field, selectClassName } from './fields';
import { ProposalCard } from './proposal-card';

interface PlanPanelProps {
  readonly hasStart: boolean;
  readonly missingStart: boolean;
  readonly form: PlanForm;
  readonly onFormChange: (form: PlanForm) => void;
  readonly onSubmit: () => void;
  readonly pending: boolean;
  readonly error: unknown;
  readonly proposals: readonly Proposal[] | undefined;
  readonly selected: number;
  readonly onSelect: (index: number) => void;
}

/** Plan tab: where to start, what to look for, and the proposals. */
export function PlanPanel(props: PlanPanelProps) {
  const { t } = useTranslation('itineraries');
  const { form, onFormChange, proposals, selected } = props;
  const labels = useDomainLabels();
  const shown = proposals?.[selected];
  const { system } = useUnits();
  const gate = useRequestGate(system);

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (gate.mayAsk(form.kind) && !props.pending) {
      props.onSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <SegmentedControl
        label={t('kind.label')}
        value={form.kind}
        options={itineraryKinds}
        optionLabel={(kind) => t(`kind.${kind}`)}
        onChange={(kind) => {
          onFormChange({ ...form, kind });
        }}
      />

      <p className={cn('text-sm', props.hasStart ? 'text-ink' : 'text-ink-muted')}>
        {props.hasStart ? t('start.placed') : t('start.hint')}
      </p>

      <form noValidate onSubmit={submit} className="flex flex-col gap-3">
        {form.kind === 'uphill' && (
          <UphillFields
            criteria={form.uphill}
            onChange={(uphill) => {
              onFormChange({ ...form, uphill });
            }}
            onValidityChange={gate.validityOf('uphill')}
            showProblems={gate.showProblems}
          />
        )}
        {form.kind === 'loop' && (
          <LoopFields
            criteria={form.loop}
            onChange={(loop) => {
              onFormChange({ ...form, loop });
            }}
            onValidityChange={gate.validityOf('loop')}
            showProblems={gate.showProblems}
          />
        )}
        {form.kind === 'session' && (
          <SessionFields
            criteria={form.session}
            onChange={(session) => {
              onFormChange({ ...form, session });
            }}
            onValidityChange={gate.validityOf('session')}
            showProblems={gate.showProblems}
          />
        )}
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
              {/* Hill Sessions are for running only. */}
              {(form.kind === 'session' ? runningActivities : activities).map((activity) => (
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
          {props.pending ? t('submitting') : t(`${form.kind}.submit`)}
        </Button>
      </form>

      {props.error !== null && props.error !== undefined && (
        <ErrorNotice error={props.error} onRetry={props.onSubmit} />
      )}

      {proposals?.length === 0 && (
        <div className="rounded-lg bg-lichen p-4">
          <p className="font-semibold">{t('empty.title')}</p>
          <p className="text-sm text-ink-muted">{t(`empty.${form.kind}`)}</p>
        </div>
      )}

      {proposals && proposals.length > 0 && (
        <ul aria-label={t('results')} className="flex flex-col divide-y divide-pine/10">
          {proposals.map((proposal, index) => (
            <li key={index}>
              <ProposalCard
                proposal={proposal}
                selected={index === selected}
                onSelect={() => {
                  props.onSelect(index);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {shown && <Profile proposal={shown} />}
    </div>
  );
}

/** The Elevation Profile of a proposal: the path of an Itinerary, the Repeat of a session. */
function Profile({ proposal }: { readonly proposal: Proposal }) {
  const { t } = useTranslation('itineraries');
  const format = useFormatters();
  const { elevationProfile, length } = mainStretch(proposal);
  const elevations = elevationProfile.map((point) => point.elevation);

  return (
    <ElevationProfileChart
      profile={elevationProfile}
      length={length}
      description={
        proposal.kind === 'loop'
          ? t('profile.loop', {
              length: format.distance(length),
              lowest: format.elevation(Math.min(...elevations)),
              highest: format.elevation(Math.max(...elevations)),
            })
          : t('profile.uphill', {
              length: format.distance(length),
              start: format.elevation(elevations[0] ?? 0),
              top: format.elevation(elevations.at(-1) ?? 0),
            })
      }
    />
  );
}
