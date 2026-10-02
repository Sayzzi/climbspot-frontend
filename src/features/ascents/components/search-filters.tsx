import { useTranslation } from 'react-i18next';

import { useFormatters } from '@/shared/units';

import { activities, categories } from '@/shared/domain/values';

import { DEFAULT_RADIUS, SEARCH_RADII } from '../domain';
import { useDomainLabels } from '@/shared/i18n/use-domain-labels';
import type { Activity, Category } from '@/shared/domain/values';

export interface SearchFilterValues {
  readonly radius?: number | undefined;
  readonly activities?: readonly Activity[] | undefined;
  readonly categories?: readonly Category[] | undefined;
}

interface SearchFiltersProps {
  readonly value: SearchFilterValues;
  readonly onChange: (value: SearchFilterValues) => void;
}

/** Radius, Activity and Category filters of the nearby search. */
export function SearchFilters({ value, onChange }: SearchFiltersProps) {
  const { t } = useTranslation('ascents');
  const format = useFormatters();
  const labels = useDomainLabels();
  const radius = value.radius ?? DEFAULT_RADIUS;
  // A shared URL may carry any radius: list it so the control shows what is searched.
  const radii = [...new Set([...SEARCH_RADII, radius])].sort((a, b) => a - b);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <label className="flex items-center gap-3 text-sm font-medium">
        {t('filters.radius')}
        <select
          className="rounded-md border border-pine/25 bg-white px-2 py-1 focus-visible:outline-2 focus-visible:outline-pine"
          value={radius}
          onChange={(event) => {
            const chosen = Number(event.target.value);
            onChange({ ...value, radius: chosen === DEFAULT_RADIUS ? undefined : chosen });
          }}
        >
          {radii.map((option) => (
            <option key={option} value={option}>
              {format.distance(option)}
            </option>
          ))}
        </select>
      </label>

      <CheckboxGroup
        legend={t('filters.activities')}
        options={activities}
        selected={value.activities}
        label={labels.activity}
        onChange={(selected) => {
          onChange({ ...value, activities: selected });
        }}
      />
      <CheckboxGroup
        legend={t('filters.categories')}
        options={categories}
        selected={value.categories}
        label={labels.category}
        onChange={(selected) => {
          onChange({ ...value, categories: selected });
        }}
      />
    </form>
  );
}

interface CheckboxGroupProps<T extends string> {
  readonly legend: string;
  readonly options: readonly T[];
  readonly selected: readonly T[] | undefined;
  readonly label: (option: T) => string;
  /** `undefined` when nothing is selected, so the filter disappears from the URL. */
  readonly onChange: (selected: T[] | undefined) => void;
}

function CheckboxGroup<T extends string>({
  legend,
  options,
  selected = [],
  label,
  onChange,
}: CheckboxGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-moss/60 px-3 py-1 text-sm has-checked:border-moss has-checked:bg-moss has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-pine"
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={selected.includes(option)}
              onChange={(event) => {
                const next = event.target.checked
                  ? options.filter(
                      (candidate) => candidate === option || selected.includes(candidate),
                    )
                  : selected.filter((candidate) => candidate !== option);
                onChange(next.length > 0 ? next : undefined);
              }}
            />
            {label(option)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
