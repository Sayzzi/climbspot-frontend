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
      <div className="flex rounded-full bg-white p-0.5 shadow-sm ring-1 ring-pine/15">
        {systems.map((option) => (
          <label
            key={option}
            className="cursor-pointer rounded-full px-2.5 py-1 has-checked:bg-pine has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-pine sm:px-3"
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
            {/* Phones get the short form; the accessible name stays the full one. */}
            <span aria-hidden="true" className="sm:hidden">
              {t(`units.short.${option}`)}
            </span>
            <span className="sr-only sm:not-sr-only">{t(`units.${option}`)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
