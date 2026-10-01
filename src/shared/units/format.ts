export type UnitSystem = 'metric' | 'imperial';

const METRES_PER_FOOT = 0.3048;
const METRES_PER_MILE = 1609.344;

export interface Formatters {
  /** A distance along the ground (length, distance to the Start), from metres. */
  distance(metres: number): string;
  /** A height (elevation, Elevation Gain), from metres. */
  elevation(metres: number): string;
  /** A Gradient, from a ratio (0.08 → 8%). */
  gradient(ratio: number): string;
  /** A plain number, e.g. a Difficulty Score. */
  number(value: number): string;
}

export function createFormatters(system: UnitSystem, locale: string): Formatters {
  const unit = (name: string, maximumFractionDigits: number) =>
    new Intl.NumberFormat(locale, { style: 'unit', unit: name, maximumFractionDigits });

  const metres = unit('meter', 0);
  const kilometres = unit('kilometer', 1);
  const feet = unit('foot', 0);
  const miles = unit('mile', 1);
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
  const plain = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  if (system === 'imperial') {
    return {
      distance: (value) => {
        const inMiles = value / METRES_PER_MILE;
        return inMiles < 0.1 ? feet.format(value / METRES_PER_FOOT) : miles.format(inMiles);
      },
      elevation: (value) => feet.format(value / METRES_PER_FOOT),
      gradient: (ratio) => percent.format(ratio),
      number: (value) => plain.format(value),
    };
  }

  return {
    distance: (value) => (value < 1000 ? metres.format(value) : kilometres.format(value / 1000)),
    elevation: (value) => metres.format(value),
    gradient: (ratio) => percent.format(ratio),
    number: (value) => plain.format(value),
  };
}
