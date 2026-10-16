import { useTranslation } from 'react-i18next';

import { useFormatters } from '@/shared/units';

const WIDTH = 640;
const HEIGHT = 200;
const PADDING = { top: 36, right: 64, bottom: 40, left: 64 };

export interface TimedRun {
  /** When the Visitor left the Start. */
  readonly startedAt: string;
  readonly seconds: number;
}

interface ProgressChartProps {
  /** At least two Ascent Times, in any order. */
  readonly times: readonly TimedRun[];
  readonly best: TimedRun;
  readonly latest: TimedRun;
  /** Text alternative summarising the chart. */
  readonly description: string;
}

/** Ascent Times against dates, faster higher: progress reads as going up, like the climb. */
export function ProgressChart({ times, best, latest, description }: ProgressChartProps) {
  const { t } = useTranslation('ascents');
  const format = useFormatters();

  const chronological = [...times].sort(
    (a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt),
  );
  const first = Date.parse(chronological[0]?.startedAt ?? latest.startedAt);
  const last = Date.parse(latest.startedAt);
  const slowest = Math.max(...times.map((time) => time.seconds));
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (time: TimedRun) =>
    last === first
      ? PADDING.left + plotWidth / 2
      : PADDING.left + ((Date.parse(time.startedAt) - first) / (last - first)) * plotWidth;
  // The fastest time at the top.
  const y = (time: TimedRun) =>
    slowest === best.seconds
      ? PADDING.top + plotHeight / 2
      : PADDING.top + ((time.seconds - best.seconds) / (slowest - best.seconds)) * plotHeight;

  const line = chronological.map((time) => `${String(x(time))},${String(y(time))}`).join(' ');
  const marks =
    latest === best
      ? [{ time: best, label: t('myTimes.best') }]
      : [
          { time: best, label: t('myTimes.best') },
          { time: latest, label: t('myTimes.latestMark') },
        ];

  return (
    <svg
      role="img"
      aria-label={description}
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      className="h-auto w-full"
    >
      <g aria-hidden="true" className="text-xs">
        <polyline
          points={line}
          className="fill-none stroke-pine/40"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {chronological.map((time) => (
          <circle
            key={time.startedAt}
            cx={x(time)}
            cy={y(time)}
            r={4}
            className="fill-white stroke-pine"
            strokeWidth={2}
          />
        ))}
        {marks.map(({ time, label }) => (
          <g key={label}>
            <circle
              cx={x(time)}
              cy={y(time)}
              r={7}
              className={time === best ? 'fill-signpost stroke-pine' : 'fill-blaze stroke-white'}
              strokeWidth={2}
            />
            <text
              x={x(time)}
              y={y(time) - 14}
              textAnchor="middle"
              className="fill-ink font-semibold"
            >
              {`${label} ${format.clock(time.seconds)}`}
            </text>
          </g>
        ))}
        <text x={PADDING.left - 10} y={y(best) + 4} textAnchor="end" className="fill-ink-muted">
          {format.clock(best.seconds)}
        </text>
        {slowest !== best.seconds && (
          <text
            x={PADDING.left - 10}
            y={PADDING.top + plotHeight + 4}
            textAnchor="end"
            className="fill-ink-muted"
          >
            {format.clock(slowest)}
          </text>
        )}
        <text x={PADDING.left} y={HEIGHT - 12} className="fill-ink-muted">
          {format.date(new Date(first).toISOString())}
        </text>
        <text x={WIDTH - PADDING.right} y={HEIGHT - 12} textAnchor="end" className="fill-ink-muted">
          {format.date(latest.startedAt)}
        </text>
        <text x={PADDING.left - 10} y={14} textAnchor="start" className="fill-ink font-medium">
          {t('myTimes.timeAxis')}
        </text>
      </g>
    </svg>
  );
}
