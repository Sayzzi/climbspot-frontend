import { useTranslation } from 'react-i18next';

import { useFormatters } from '@/shared/units';

import type { Ascent } from '../types';

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 28, right: 16, bottom: 44, left: 64 };

interface ElevationProfileChartProps {
  readonly ascent: Pick<
    Ascent,
    'elevationProfile' | 'length' | 'start' | 'top' | 'maximumGradient'
  >;
}

/** Elevation against distance from the Start, with a text alternative. */
export function ElevationProfileChart({ ascent }: ElevationProfileChartProps) {
  const { t } = useTranslation('ascents');
  const format = useFormatters();
  const { elevationProfile: profile, length } = ascent;

  const elevations = profile.map((point) => point.elevation);
  const lowest = Math.floor(Math.min(...elevations) / 10) * 10;
  const highest = Math.ceil(Math.max(...elevations) / 10) * 10;
  const span = Math.max(highest - lowest, 1);

  const x = (distance: number) =>
    PADDING.left + (distance / Math.max(length, 1)) * (WIDTH - PADDING.left - PADDING.right);
  const y = (elevation: number) =>
    HEIGHT -
    PADDING.bottom -
    ((elevation - lowest) / span) * (HEIGHT - PADDING.top - PADDING.bottom);

  const line = profile.map((point) => `${String(x(point.distance))},${String(y(point.elevation))}`);
  const baseline = String(HEIGHT - PADDING.bottom);
  const area = `M${String(PADDING.left)},${baseline} L${line.join(' L')} L${String(x(length))},${baseline} Z`;

  return (
    <svg
      role="img"
      aria-label={t('detail.profile.summary', {
        length: format.distance(length),
        start: format.elevation(ascent.start.elevation),
        top: format.elevation(ascent.top.elevation),
        steepest: format.gradient(ascent.maximumGradient),
      })}
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      className="h-auto w-full"
    >
      <g aria-hidden="true" className="text-xs">
        <path d={area} className="fill-brand-100" />
        <polyline
          points={line.join(' ')}
          className="fill-none stroke-brand-600"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <line
          x1={PADDING.left}
          x2={WIDTH - PADDING.right}
          y1={baseline}
          y2={baseline}
          className="stroke-brand-200"
        />
        <text x={PADDING.left - 8} y={y(highest)} textAnchor="end" className="fill-ink-muted">
          {format.elevation(highest)}
        </text>
        <text x={PADDING.left - 8} y={y(lowest)} textAnchor="end" className="fill-ink-muted">
          {format.elevation(lowest)}
        </text>
        <text x={PADDING.left} y={HEIGHT - 26} className="fill-ink-muted">
          {format.distance(0)}
        </text>
        <text x={x(length)} y={HEIGHT - 26} textAnchor="end" className="fill-ink-muted">
          {format.distance(length)}
        </text>
        <text x={PADDING.left} y={14} className="fill-ink font-medium">
          {t('detail.profile.elevationAxis')}
        </text>
        <text x={x(length)} y={HEIGHT - 6} textAnchor="end" className="fill-ink font-medium">
          {t('detail.profile.distanceAxis')}
        </text>
      </g>
    </svg>
  );
}
