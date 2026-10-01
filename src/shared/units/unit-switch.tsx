import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { UnitSystem } from './format';
import { useUnits } from './use-units';

const systems: readonly UnitSystem[] = ['metric', 'imperial'];

/** Lets the Visitor choose between metric and imperial units. */
export function UnitSwitch() {
  const { t } = useTranslation();
  const { system, setSystem } = useUnits();
  const labelId = useId();
  const name = useId();

  return (
    <div role="radiogroup" aria-labelledby={labelId} className="flex items-center gap-2 text-sm">
      <span id={labelId} className="sr-only">
        {t('units.label')}
      </span>
      <div className="flex rounded-full border border-brand-200 p-0.5">
        {systems.map((option) => (
          <label
            key={option}
            className="cursor-pointer rounded-full px-3 py-1 has-checked:bg-brand-600 has-checked:text-white"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={system === option}
              onChange={() => {
                setSystem(option);
              }}
              className="sr-only"
            />
            {t(`units.${option}`)}
          </label>
        ))}
      </div>
    </div>
  );
}
