export type UnitSystem = 'metric' | 'imperial';

const METRES_PER_FOOT = 0.3048;
const METRES_PER_MILE = 1609.344;

export interface Formatters {
  /** A distance along the ground (length, distance to the Start), from metres. */
  distance(metres: number): string;
  /** A height (elevation, Elevation Gain), from metres. */
  elevation(metres: number): string;
  /** A Gradient, from a ratio (0.08 → 8%); the same in every unit system. */
  gradient(ratio: number): string;
  /** A plain number, e.g. a Difficulty Score. */
  number(value: number): string;
  /** A Km-Effort, with one decimal; a named unit, the same in every unit system. */
  kmEffort(value: number): string;
}

export function createFormatters(system: UnitSystem, locale: string): Formatters {
  const unit = (name: string, maximumFractionDigits: number) =>
    new Intl.NumberFormat(locale, { style: 'unit', unit: name, maximumFractionDigits });
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
  const plain = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const oneDecimal = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return {
    ...(system === 'imperial' ? imperial(unit) : metric(unit)),
    gradient: (ratio) => percent.format(ratio),
    number: (value) => plain.format(value),
    kmEffort: (value) => oneDecimal.format(value),
  };
}

type UnitFormat = (name: string, maximumFractionDigits: number) => Intl.NumberFormat;

function metric(unit: UnitFormat): Pick<Formatters, 'distance' | 'elevation'> {
  const [metres, kilometres] = [unit('meter', 0), unit('kilometer', 1)];
  return {
    distance: (value) => (value < 1000 ? metres.format(value) : kilometres.format(value / 1000)),
    elevation: (value) => metres.format(value),
  };
}

function imperial(unit: UnitFormat): Pick<Formatters, 'distance' | 'elevation'> {
  const [feet, miles] = [unit('foot', 0), unit('mile', 1)];
  return {
    distance: (value) => {
      const inMiles = value / METRES_PER_MILE;
      return inMiles < 0.1 ? feet.format(value / METRES_PER_FOOT) : miles.format(inMiles);
    },
    elevation: (value) => feet.format(value / METRES_PER_FOOT),
  };
}
