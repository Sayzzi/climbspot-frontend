import { http, HttpResponse, type JsonBodyType } from 'msw';

import type { components } from '@/shared/api/schema.gen';

export type AscentSummary = components['schemas']['NearbyAscents']['ascents'][number];
export type Ascent = components['schemas']['Ascent'];
export type ApiError = components['schemas']['ApiError'];

const API_URL = 'http://localhost:3000';

export const apiUrl = (path: string) => `${API_URL}${path}`;

/** Records the requests a handler received, for assertions on what was sent. */
export function recorder() {
  const requests: Request[] = [];
  return {
    requests,
    record: (request: Request) => {
      requests.push(request.clone());
    },
    lastUrl: () => {
      const last = requests.at(-1);
      return last ? new URL(last.url) : undefined;
    },
  };
}

export function apiErrorResponse(status: number, code: string): HttpResponse<JsonBodyType> {
  const body: ApiError = { error: { code, message: `${code} (test)` } };
  return HttpResponse.json(body, { status });
}

export function anAscentSummary(overrides: Partial<AscentSummary> = {}): AscentSummary {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Côte de Test',
    surface: 'paved',
    activities: ['running', 'road_cycling'],
    start: { latitude: 45, longitude: 6, elevation: 200 },
    top: { latitude: 45.0108, longitude: 6, elevation: 296 },
    length: 1200,
    elevationGain: 96,
    averageGradient: 0.08,
    maximumGradient: 0.105,
    difficultyScore: 9600,
    category: 'cat4',
    createdAt: '2026-10-01T12:00:00.000Z',
    distanceToStart: 1500,
    ...overrides,
  };
}

export function anAscent(overrides: Partial<Ascent> = {}): Ascent {
  const { distanceToStart: _distance, ...summary } = anAscentSummary();
  return {
    ...summary,
    path: {
      type: 'LineString',
      coordinates: [
        [6, 45],
        [6, 45.0054],
        [6, 45.0108],
      ],
    },
    elevationProfile: [
      { distance: 0, elevation: 200 },
      { distance: 600, elevation: 245 },
      { distance: 1200, elevation: 296 },
    ],
    ...overrides,
  };
}

export const handlers = {
  nearby: (
    respond: (request: Request) => HttpResponse<JsonBodyType> | Promise<HttpResponse<JsonBodyType>>,
  ) => http.get(apiUrl('/ascents/nearby'), ({ request }) => respond(request)),
  ascent: (respond: (id: string) => HttpResponse<JsonBodyType>) =>
    // `/ascents/nearby` matches `/ascents/:id` too; leave it to its own handler.
    http.get(apiUrl('/ascents/:id'), ({ params }) =>
      params.id === 'nearby' ? undefined : respond(String(params.id)),
    ),
  createAscent: (
    respond: (request: Request) => HttpResponse<JsonBodyType> | Promise<HttpResponse<JsonBodyType>>,
  ) => http.post(apiUrl('/ascents'), ({ request }) => respond(request)),
};

export function nearbyResults(ascents: AscentSummary[]): HttpResponse<JsonBodyType> {
  const body: components['schemas']['NearbyAscents'] = { ascents };
  return HttpResponse.json(body);
}
