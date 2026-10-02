import { distanceBetween } from '@/shared/lib/geodesy';

import type { Itinerary } from './types';

export const GPX_TYPE = 'application/gpx+xml';

/**
 * A GPX 1.1 track of an Itinerary: every point of its path, with the elevation of its
 * profile at that point's distance along the path.
 */
export function toGpx(itinerary: Itinerary, name: string): string {
  const elevations = elevationsAlong(itinerary);
  const points = itinerary.path.coordinates.map(
    ([longitude, latitude], index) =>
      `      <trkpt lat="${String(latitude)}" lon="${String(longitude)}"><ele>${(elevations[index] ?? 0).toFixed(1)}</ele></trkpt>`,
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="ClimbSpot" xmlns="http://www.topografix.com/GPX/1/1">',
    `  <metadata><name>${escapeXml(name)}</name></metadata>`,
    `  <trk>`,
    `    <name>${escapeXml(name)}</name>`,
    '    <trkseg>',
    ...points,
    '    </trkseg>',
    '  </trk>',
    '</gpx>',
    '',
  ].join('\n');
}

/** A file name from a description, without the characters file systems refuse. */
export function gpxFileName(name: string): string {
  return `${name.replace(/[/\\:*?"<>|]/g, '-')}.gpx`;
}

function elevationsAlong({ path, elevationProfile, length }: Itinerary): number[] {
  const positions = path.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
  let travelled = 0;
  const distances = positions.map((position, index) => {
    const previous = positions[index - 1];
    travelled += previous ? distanceBetween(previous, position) : 0;
    return travelled;
  });
  // The profile is measured along the same path; scale away rounding differences.
  const scale = length / Math.max(distances.at(-1) ?? 0, 1);
  return distances.map((distance) => elevationAt(elevationProfile, distance * scale));
}

function elevationAt(
  profile: readonly { readonly distance: number; readonly elevation: number }[],
  distance: number,
): number {
  const after = profile.findIndex((sample) => sample.distance >= distance);
  const next = profile[after];
  const previous = profile[after - 1];
  if (!next) {
    return profile.at(-1)?.elevation ?? 0;
  }
  if (!previous) {
    return next.elevation;
  }
  const fraction = (distance - previous.distance) / (next.distance - previous.distance);
  return previous.elevation + (next.elevation - previous.elevation) * fraction;
}

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
