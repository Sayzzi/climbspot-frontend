import { useTranslation } from 'react-i18next';

import { reliefs } from '@/shared/domain/values';
import { useDomainLabels } from '@/shared/i18n/use-domain-labels';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { useFormatters } from '@/shared/units';

import {
  GRADIENT_CHOICES,
  LOOP_DISTANCE,
  RADII,
  REPEAT_COUNTS,
  REPEAT_LENGTH,
  UPHILL_LENGTH,
  type LoopCriteria,
  type SessionCriteria,
  type UphillCriteria,
} from '../domain';
import { Choice, DistanceField } from './fields';

interface CriteriaFieldsProps<Criteria> {
  readonly criteria: Criteria;
  readonly onChange: (criteria: Criteria) => void;
  /** Whether every typed distance is valid, so that the request may be sent. */
  readonly onValidityChange: (valid: boolean) => void;
  readonly showProblems: boolean;
}

/** Gradient range, length and how far from the starting point to look. */
export function UphillFields({
  criteria,
  onChange,
  onValidityChange,
  showProblems,
}: CriteriaFieldsProps<UphillCriteria>) {
  const { t } = useTranslation('itineraries');

  return (
    <div className="grid grid-cols-2 gap-3">
      <GradientRange criteria={criteria} onChange={onChange} />
      <DistanceField
        label={t('uphill.length')}
        value={criteria.length}
        bounds={UPHILL_LENGTH}
        onChange={(length) => {
          onChange({ ...criteria, length });
        }}
        onValidityChange={onValidityChange}
        showProblem={showProblems}
      />
      <RadiusField criteria={criteria} onChange={onChange} />
    </div>
  );
}

/** How many Repeats, how long, how steep, and how far from the starting point to look. */
export function SessionFields({
  criteria,
  onChange,
  onValidityChange,
  showProblems,
}: CriteriaFieldsProps<SessionCriteria>) {
  const { t } = useTranslation('itineraries');
  const format = useFormatters();

  return (
    <div className="grid grid-cols-2 gap-3">
      <Choice
        label={t('session.repeats')}
        value={criteria.repeats}
        options={REPEAT_COUNTS}
        format={(value) => format.number(value)}
        onChange={(repeats) => {
          onChange({ ...criteria, repeats });
        }}
      />
      <DistanceField
        label={t('session.repeatLength')}
        value={criteria.repeatLength}
        bounds={REPEAT_LENGTH}
        onChange={(repeatLength) => {
          onChange({ ...criteria, repeatLength });
        }}
        onValidityChange={onValidityChange}
        showProblem={showProblems}
      />
      <GradientRange criteria={criteria} onChange={onChange} />
      <RadiusField criteria={criteria} onChange={onChange} />
    </div>
  );
}

interface GradientRangeCriteria {
  readonly minGradient: number;
  readonly maxGradient: number;
}

/** The average Gradient range asked for; each bound keeps the other consistent. */
function GradientRange<Criteria extends GradientRangeCriteria>({
  criteria,
  onChange,
}: {
  readonly criteria: Criteria;
  readonly onChange: (criteria: Criteria) => void;
}) {
  const { t } = useTranslation('itineraries');
  const format = useFormatters();

  return (
    <>
      <Choice
        label={t('criteria.minGradient')}
        value={criteria.minGradient}
        options={GRADIENT_CHOICES}
        format={(value) => format.gradient(value)}
        onChange={(minGradient) => {
          onChange({
            ...criteria,
            minGradient,
            maxGradient: Math.max(criteria.maxGradient, minGradient),
          });
        }}
      />
      <Choice
        label={t('criteria.maxGradient')}
        value={criteria.maxGradient}
        options={GRADIENT_CHOICES}
        format={(value) => format.gradient(value)}
        onChange={(maxGradient) => {
          onChange({
            ...criteria,
            maxGradient,
            minGradient: Math.min(criteria.minGradient, maxGradient),
          });
        }}
      />
    </>
  );
}

/** How far from the starting point to look. */
function RadiusField<Criteria extends { readonly radius: number }>({
  criteria,
  onChange,
}: {
  readonly criteria: Criteria;
  readonly onChange: (criteria: Criteria) => void;
}) {
  const { t } = useTranslation('itineraries');
  const format = useFormatters();

  return (
    <Choice
      label={t('criteria.radius')}
      value={criteria.radius}
      options={RADII}
      format={(value) => format.distance(value)}
      onChange={(radius) => {
        onChange({ ...criteria, radius });
      }}
    />
  );
}

/** Distance and Relief of a Loop. */
export function LoopFields({
  criteria,
  onChange,
  onValidityChange,
  showProblems,
}: CriteriaFieldsProps<LoopCriteria>) {
  const { t } = useTranslation('itineraries');
  const labels = useDomainLabels();

  return (
    <div className="flex flex-col gap-3">
      <DistanceField
        label={t('loop.distance')}
        value={criteria.distance}
        bounds={LOOP_DISTANCE}
        onChange={(distance) => {
          onChange({ ...criteria, distance });
        }}
        onValidityChange={onValidityChange}
        showProblem={showProblems}
      />
      <SegmentedControl
        label={t('loop.relief')}
        value={criteria.relief}
        options={reliefs}
        optionLabel={labels.relief}
        onChange={(relief) => {
          onChange({ ...criteria, relief });
        }}
      />
    </div>
  );
}
