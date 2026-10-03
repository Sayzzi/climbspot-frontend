export type UnitSystem = 'metric' | 'imperial';

const METRES_PER_FOOT = 0.3048;
export const METRES_PER_MILE = 1609.344;

/** The distance a pace is given per: a kilometre, or a mile with imperial units. */
export const metresPerPaceUnit = (system: UnitSystem) =>
  system === 'imperial' ? METRES_PER_MILE : 1000;

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
  /** A pace as minutes and seconds per km, or per mile with imperial units ("5:30"). */
  pace(secondsPerKm: number): string;
  /** A duration in whole minutes: "23 min", or hours and minutes beyond an hour. */
  duration(minutes: number): string;
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

  const twoDigits = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 });
  const [hours, minutes] = [unit('hour', 0), unit('minute', 0)];

  return {
    ...(system === 'imperial' ? imperial(unit) : metric(unit)),
    pace: (secondsPerKm) => {
      const seconds = Math.round((secondsPerKm * metresPerPaceUnit(system)) / 1000);
      return `${plain.format(Math.floor(seconds / 60))}:${twoDigits.format(seconds % 60)}`;
    },
    duration: (total) =>
      total <= 60
        ? minutes.format(total)
        : `${hours.format(Math.floor(total / 60))} ${minutes.format(total % 60)}`,
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
