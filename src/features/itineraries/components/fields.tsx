import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import {
  distanceBounds,
  parseDistance,
  useFormatters,
  useUnits,
  type DistanceBounds,
} from '@/shared/units';

export const selectClassName =
  'w-full rounded-md border border-pine/25 bg-white px-2 py-1.5 focus-visible:outline-2 focus-visible:outline-pine';

export function Field({
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

/** A select over numeric choices, shown formatted. */
export function Choice({ label, value, options, format, onChange }: ChoiceProps) {
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

interface DistanceFieldProps {
  readonly label: string;
  /** Metres. */
  readonly value: number;
  /** Accepted range, in metres. */
  readonly bounds: DistanceBounds;
  /** Called with whole metres whenever the typed distance is valid. */
  readonly onChange: (metres: number) => void;
  readonly onValidityChange: (valid: boolean) => void;
  /** Shows the problem with the typed distance, e.g. once the Visitor tried to send it. */
  readonly showProblem: boolean;
}

/**
 * A distance typed freely in km, or miles with imperial units, within bounds. When the
 * Visitor switches units, the field starts again from the distance it holds, written in
 * the new unit.
 */
export function DistanceField(props: DistanceFieldProps) {
  const { system } = useUnits();
  return <DistanceInput key={system} {...props} />;
}

function DistanceInput({
  label,
  value,
  bounds,
  onChange,
  onValidityChange,
  showProblem,
}: DistanceFieldProps) {
  const { t } = useTranslation();
  const { system } = useUnits();
  const format = useFormatters();
  const [text, setText] = useState(() => format.distanceInput(value));
  const [valid, setValid] = useState(true);
  const [blurred, setBlurred] = useState(false);
  const inputId = useId();
  const problemId = useId();
  const unit = t(`units.short.${system}`);
  const range = distanceBounds(bounds, system);
  const problemShown = !valid && (showProblem || blurred);

  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={inputId} className="font-medium">
        {t('distance.label', { label, unit })}
      </label>
      <input
        id={inputId}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          const metres = parseDistance(event.target.value, system, bounds);
          setValid(metres !== undefined);
          onValidityChange(metres !== undefined);
          if (metres !== undefined) {
            onChange(metres);
          }
        }}
        onBlur={() => {
          setBlurred(true);
        }}
        aria-invalid={problemShown}
        aria-describedby={problemShown ? problemId : undefined}
        className={selectClassName}
      />
      {problemShown && (
        <p id={problemId} role="alert" className="text-danger">
          {t('distance.range', {
            minimum: format.distanceBound(range.minimum),
            maximum: format.distanceBound(range.maximum),
            unit,
          })}
        </p>
      )}
    </div>
  );
}
