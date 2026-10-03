import { useTranslation } from 'react-i18next';

import { reliefs } from '@/shared/domain/values';
import { useDomainLabels } from '@/shared/i18n/use-domain-labels';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { useFormatters } from '@/shared/units';

import {
  GRADIENT_CHOICES,
  LOOP_DISTANCE,
  RADII,
  UPHILL_LENGTH,
  type LoopCriteria,
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
  const format = useFormatters();

  return (
    <div className="grid grid-cols-2 gap-3">
      <Choice
        label={t('uphill.minGradient')}
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
        label={t('uphill.maxGradient')}
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
      <Choice
        label={t('uphill.radius')}
        value={criteria.radius}
        options={RADII}
        format={(value) => format.distance(value)}
        onChange={(radius) => {
          onChange({ ...criteria, radius });
        }}
      />
    </div>
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
