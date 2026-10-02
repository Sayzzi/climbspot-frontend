import { useId } from 'react';

interface SegmentedControlProps<Value extends string> {
  readonly label: string;
  readonly value: Value;
  readonly options: readonly Value[];
  readonly optionLabel: (option: Value) => string;
  readonly onChange: (value: Value) => void;
}

/** A small set of mutually exclusive choices shown side by side, as radio buttons. */
export function SegmentedControl<Value extends string>({
  label,
  value,
  options,
  optionLabel,
  onChange,
}: SegmentedControlProps<Value>) {
  const labelId = useId();
  const name = useId();

  return (
    <div role="radiogroup" aria-labelledby={labelId} className="flex flex-col gap-1 text-sm">
      <span id={labelId} className="font-medium">
        {label}
      </span>
      <div className="flex rounded-full bg-white p-0.5 shadow-sm ring-1 ring-pine/15">
        {options.map((option) => (
          <label
            key={option}
            className="flex-1 cursor-pointer rounded-full px-3 py-1 text-center has-checked:bg-pine has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-pine"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => {
                onChange(option);
              }}
              className="sr-only"
            />
            {optionLabel(option)}
          </label>
        ))}
      </div>
    </div>
  );
}
