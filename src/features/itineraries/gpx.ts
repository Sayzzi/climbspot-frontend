import { distanceBetween } from '@/shared/lib/geodesy';

import type { HillSession, Itinerary } from './types';

export const GPX_TYPE = 'application/gpx+xml';

type Profile = readonly { readonly distance: number; readonly elevation: number }[];

/** A stretch of a track: its path, and the profile measured along it. */
interface TrackPart {
  readonly coordinates: readonly (readonly [number, number])[];
  readonly elevationProfile: Profile;
  readonly length: number;
}

/** An Itinerary as one track part. */
export const itineraryTrack = (itinerary: Itinerary): TrackPart[] => [
  { coordinates: itinerary.path.coordinates, ...itinerary },
];

/** A Hill Session as track parts: Warm-up, each Repeat up and back down, Cool-down. */
export function sessionTrack(session: HillSession): TrackPart[] {
  const warmUp = { coordinates: session.warmUp.path.coordinates, ...session.warmUp };
  const repeat = { coordinates: session.repeat.path.coordinates, ...session.repeat };
  return [
    warmUp,
    ...Array.from({ length: session.repeats }, () => [repeat, backwards(repeat)]).flat(),
    backwards(warmUp),
  ];
}

/**
 * A GPX 1.1 track: every point of its parts' paths, with the elevation of each part's
 * profile at that point's distance along it.
 */
export function toGpx(parts: readonly TrackPart[], name: string): string {
  const points = parts.flatMap((part) => {
    const elevations = elevationsAlong(part);
    return part.coordinates.map(
      ([longitude, latitude], index) =>
        `      <trkpt lat="${String(latitude)}" lon="${String(longitude)}"><ele>${(elevations[index] ?? 0).toFixed(1)}</ele></trkpt>`,
    );
  });

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

/** The same part travelled the other way. */
function backwards(part: TrackPart): TrackPart {
  return {
    coordinates: part.coordinates.toReversed(),
    elevationProfile: part.elevationProfile
      .toReversed()
      .map((point) => ({ ...point, distance: part.length - point.distance })),
    length: part.length,
  };
}

function elevationsAlong({ coordinates, elevationProfile, length }: TrackPart): number[] {
  const positions = coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
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

function elevationAt(profile: Profile, distance: number): number {
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
