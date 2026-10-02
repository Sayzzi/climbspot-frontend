import { useId, type ReactNode } from 'react';

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
