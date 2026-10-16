import { useTranslation } from 'react-i18next';

import { useWidth } from '@/shared/hooks/use-width';
import { useFormatters } from '@/shared/units';

/** Laid out at the width it is shown, at least this wide. */
const MINIMUM_WIDTH = 280;
const HEIGHT = 200;
const PADDING = { top: 36, right: 64, bottom: 40, left: 64 };

/** One of the Visitor's Ascent Times, as the API gives it. */
export interface AscentTime {
  /** When the Visitor left the Start. */
  readonly startedAt: string;
  readonly seconds: number;
}

interface ProgressChartProps {
  /** At least two Ascent Times, in any order. */
  readonly times: readonly AscentTime[];
  readonly best: AscentTime;
  readonly latest: AscentTime;
  /** Text alternative summarising the chart. */
  readonly description: string;
}

/** Ascent Times against dates, faster higher: progress reads as going up, like the climb. */
export function ProgressChart({ times, best, latest, description }: ProgressChartProps) {
  const { t } = useTranslation('ascents');
  const format = useFormatters();
  const { ref, width } = useWidth<HTMLDivElement>(640);
  const chartWidth = Math.max(width, MINIMUM_WIDTH);

  const chronological = [...times].sort(
    (a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt),
  );
  const first = Date.parse(chronological[0]?.startedAt ?? latest.startedAt);
  const last = Date.parse(latest.startedAt);
  const slowest = Math.max(...times.map((time) => time.seconds));
  const plotWidth = chartWidth - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (time: AscentTime) =>
    last === first
      ? PADDING.left + plotWidth / 2
      : PADDING.left + ((Date.parse(time.startedAt) - first) / (last - first)) * plotWidth;
  // The fastest time at the top.
  const y = (time: AscentTime) =>
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
    <div ref={ref}>
      <svg
        role="img"
        aria-label={description}
        viewBox={`0 0 ${String(chartWidth)} ${String(HEIGHT)}`}
        className="h-auto w-full"
      >
        <g aria-hidden="true" className="text-xs">
          <polyline
            points={line}
            className="fill-none stroke-granite"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {chronological.map((time, index) => (
            <circle
              // Two Recorded Runs of one outing (watch and phone) may start together.
              key={`${time.startedAt}-${String(index)}`}
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
              {/* The latest is never above the best: its label goes beside it, clear of the best's. */}
              <text
                x={time === best ? x(time) : x(time) - 12}
                y={time === best ? y(time) - 14 : y(time) + 4}
                textAnchor={time === best ? 'middle' : 'end'}
                // A white halo keeps the label legible over the line.
                paintOrder="stroke"
                strokeWidth={4}
                strokeLinejoin="round"
                className="fill-ink stroke-white font-semibold"
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
          <text
            x={chartWidth - PADDING.right}
            y={HEIGHT - 12}
            textAnchor="end"
            className="fill-ink-muted"
          >
            {format.date(latest.startedAt)}
          </text>
        </g>
      </svg>
      {/* Below the chart, where it never meets the marks' labels. */}
      <p aria-hidden="true" className="text-xs text-ink-muted">
        {t('myTimes.timeAxis')}
      </p>
    </div>
  );
}
