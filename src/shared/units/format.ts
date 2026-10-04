export type UnitSystem = 'metric' | 'imperial';

const METRES_PER_FOOT = 0.3048;
export const METRES_PER_MILE = 1609.344;

/** The long unit distances and paces are typed in: a kilometre, or a mile with imperial units. */
export const metresPerDistanceUnit = (system: UnitSystem) =>
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
  /** A time taken, to the second, as a stopwatch shows it: "5:12", "1:02:05". */
  clock(seconds: number): string;
  /** A day, from an ISO date-time: "Oct 2, 2026". */
  date(isoDateTime: string): string;
  /** A distance as typed in a field, in km or miles, up to two decimals and no unit. */
  distanceInput(metres: number): string;
  /** A bound of a typed distance, in km or miles, up to two decimals. */
  distanceBound(value: number): string;
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
  const typed = new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false });
  const bound = new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false });
  const [hours, minutes] = [unit('hour', 0), unit('minute', 0)];
  const day = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });

  return {
    ...(system === 'imperial' ? imperial(unit) : metric(unit)),
    pace: (secondsPerKm) => {
      const seconds = Math.round((secondsPerKm * metresPerDistanceUnit(system)) / 1000);
      return `${plain.format(Math.floor(seconds / 60))}:${twoDigits.format(seconds % 60)}`;
    },
    distanceInput: (metres) => typed.format(metres / metresPerDistanceUnit(system)),
    distanceBound: (value) => bound.format(value),
    date: (isoDateTime) => day.format(new Date(isoDateTime)),
    clock: (total) => {
      const seconds = Math.round(total);
      const [h, m, s] = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60];
      return h > 0
        ? `${plain.format(h)}:${twoDigits.format(m)}:${twoDigits.format(s)}`
        : `${plain.format(m)}:${twoDigits.format(s)}`;
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

/** A range of distances, in metres or in the Visitor's unit. */
export interface DistanceBounds {
  readonly minimum: number;
  readonly maximum: number;
}

/**
 * The range a distance may be typed in, in km or miles, from bounds in metres; rounded
 * inwards to a hundredth, so that what the Visitor reads is exactly what is accepted.
 */
export function distanceBounds(bounds: DistanceBounds, system: UnitSystem): DistanceBounds {
  const unit = metresPerDistanceUnit(system);
  return {
    minimum: Math.ceil((bounds.minimum / unit) * 100 - 1e-9) / 100,
    maximum: Math.floor((bounds.maximum / unit) * 100 + 1e-9) / 100,
  };
}

/**
 * Reads a distance typed in km or miles ("7.5" or "7,5") into whole metres, if it is a
 * number within the bounds (in metres).
 */
export function parseDistance(
  text: string,
  system: UnitSystem,
  bounds: DistanceBounds,
): number | undefined {
  const normalised = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalised)) {
    return undefined;
  }
  const typed = Number(normalised);
  const range = distanceBounds(bounds, system);
  return typed >= range.minimum && typed <= range.maximum
    ? Math.round(typed * metresPerDistanceUnit(system))
    : undefined;
}
