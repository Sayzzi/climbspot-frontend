import { http, HttpResponse, type JsonBodyType } from 'msw';

import type { components } from '@/shared/api/schema.gen';

import { server } from './server';

export type AscentSummary = components['schemas']['NearbyAscents']['ascents'][number];
export type Ascent = components['schemas']['Ascent'];
export type ApiError = components['schemas']['ApiError'];
export type UphillItinerary = components['schemas']['UphillItinerary'];
export type LoopItinerary = components['schemas']['LoopItinerary'];
export type HillSession = components['schemas']['HillSession'];

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
    heightGained: 96,
    averageGradient: 0.08,
    maximumGradient: 0.105,
    difficultyScore: 9600,
    category: 'cat4',
    effort: { kmEffort: 2.2, flatEquivalentDistance: 1811 },
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

export function anUphillItinerary(overrides: Partial<UphillItinerary> = {}): UphillItinerary {
  return {
    kind: 'uphill',
    exact: true,
    differences: [],
    path: {
      type: 'LineString',
      coordinates: [
        [6.001, 45.001],
        [6.001, 45.01],
        [6.002, 45.02],
        [6.002, 45.028],
      ],
    },
    elevationProfile: [
      { distance: 0, elevation: 450 },
      { distance: 1500, elevation: 520 },
      { distance: 3000, elevation: 585 },
    ],
    length: 3000,
    heightGained: 135,
    effort: { kmEffort: 4.4, flatEquivalentDistance: 4520 },
    start: { latitude: 45.001, longitude: 6.001, elevation: 450 },
    top: { latitude: 45.028, longitude: 6.002, elevation: 585 },
    elevationGain: 135,
    averageGradient: 0.045,
    maximumGradient: 0.08,
    difficultyScore: 13_500,
    category: 'cat4',
    distanceToStart: 800,
    ...overrides,
  };
}

export function aLoopItinerary(overrides: Partial<LoopItinerary> = {}): LoopItinerary {
  return {
    kind: 'loop',
    exact: true,
    differences: [],
    path: {
      type: 'LineString',
      coordinates: [
        [6, 45],
        [6.01, 45.01],
        [6.02, 45],
        [6, 45],
      ],
    },
    elevationProfile: [
      { distance: 0, elevation: 450 },
      { distance: 2800, elevation: 520 },
      { distance: 5600, elevation: 450 },
    ],
    length: 5600,
    heightGained: 105,
    effort: { kmEffort: 6.7, flatEquivalentDistance: 6300 },
    relief: 'rolling',
    ...overrides,
  };
}

export function aHillSession(overrides: Partial<HillSession> = {}): HillSession {
  return {
    kind: 'session',
    exact: true,
    differences: [],
    repeats: 8,
    repeat: {
      path: {
        type: 'LineString',
        coordinates: [
          [6.01, 45.01],
          [6.01, 45.0127],
        ],
      },
      elevationProfile: [
        { distance: 0, elevation: 450 },
        { distance: 150, elevation: 461 },
        { distance: 300, elevation: 472 },
      ],
      length: 300,
      averageGradient: 0.075,
      maximumGradient: 0.075,
      start: { latitude: 45.01, longitude: 6.01, elevation: 450 },
      top: { latitude: 45.0127, longitude: 6.01, elevation: 472 },
    },
    warmUp: {
      path: {
        type: 'LineString',
        coordinates: [
          [6, 45],
          [6.005, 45.005],
          [6.01, 45.01],
        ],
      },
      elevationProfile: [
        { distance: 0, elevation: 430 },
        { distance: 900, elevation: 440 },
        { distance: 1800, elevation: 450 },
      ],
      length: 1800,
    },
    totals: {
      length: 8400,
      heightGained: 245,
      effort: { kmEffort: 10.8, flatEquivalentDistance: 10_200 },
    },
    ...overrides,
  };
}

export type Account = components['schemas']['Account'];

export function anAccount(overrides: Partial<Account> = {}): Account {
  return { displayName: 'Ada', email: 'ada@example.com', flatPace: null, ...overrides };
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
  uphill: (
    respond: (request: Request) => HttpResponse<JsonBodyType> | Promise<HttpResponse<JsonBodyType>>,
  ) => http.post(apiUrl('/itineraries/uphill'), ({ request }) => respond(request)),
  loops: (
    respond: (request: Request) => HttpResponse<JsonBodyType> | Promise<HttpResponse<JsonBodyType>>,
  ) => http.post(apiUrl('/itineraries/loops'), ({ request }) => respond(request)),
  me: (
    respond: (request: Request) => HttpResponse<JsonBodyType> | Promise<HttpResponse<JsonBodyType>>,
  ) => http.get(apiUrl('/me'), ({ request }) => respond(request)),
  updateMe: (
    respond: (request: Request) => HttpResponse<JsonBodyType> | Promise<HttpResponse<JsonBodyType>>,
  ) => http.patch(apiUrl('/me'), ({ request }) => respond(request)),
  sessions: (
    respond: (request: Request) => HttpResponse<JsonBodyType> | Promise<HttpResponse<JsonBodyType>>,
  ) => http.post(apiUrl('/itineraries/sessions'), ({ request }) => respond(request)),
  createAscent: (
    respond: (request: Request) => HttpResponse<JsonBodyType> | Promise<HttpResponse<JsonBodyType>>,
  ) => http.post(apiUrl('/ascents'), ({ request }) => respond(request)),
};

export function nearbyResults(ascents: AscentSummary[]): HttpResponse<JsonBodyType> {
  const body: components['schemas']['NearbyAscents'] = { ascents };
  return HttpResponse.json(body);
}

export type SavedItinerary = components['schemas']['SavedItinerary'];
type SavedProposal = SavedItinerary['proposal'];

/** A Saved Itinerary as the API answers it. */
export function aSavedItinerary(
  overrides: Partial<SavedItinerary> & { proposal?: SavedProposal } = {},
): SavedItinerary {
  const proposal = overrides.proposal ?? aLoopItinerary();
  return {
    id: crypto.randomUUID(),
    name: 'Saved loop',
    kind: proposal.kind,
    length: proposal.kind === 'session' ? proposal.totals.length : proposal.length,
    savedAt: '2026-10-01T08:00:00.000Z',
    ...overrides,
    proposal,
  };
}

/**
 * The signed-in Visitor's Saved Itineraries, kept in memory behind the API's routes:
 * newest first, as the API lists them. Records what each request sent.
 */
export function savedItinerariesApi(initial: readonly SavedItinerary[] = []) {
  let saved = [...initial];
  const sent = recorder();
  let clock = Date.parse('2026-10-02T08:00:00.000Z');
  const summary = ({ proposal: _proposal, ...rest }: SavedItinerary) => rest;
  const notFound = () => apiErrorResponse(404, 'SAVED_ITINERARY_NOT_FOUND');

  server.use(
    http.get(apiUrl('/saved-itineraries'), ({ request }) => {
      sent.record(request);
      return HttpResponse.json({ savedItineraries: saved.map(summary) });
    }),
    http.post(apiUrl('/saved-itineraries'), async ({ request }) => {
      sent.record(request);
      const { name, proposal } = (await request.json()) as {
        name: string;
        proposal: SavedProposal;
      };
      clock += 60_000;
      const created = aSavedItinerary({ name, proposal, savedAt: new Date(clock).toISOString() });
      saved = [created, ...saved];
      return HttpResponse.json(created, { status: 201 });
    }),
    http.get(apiUrl('/saved-itineraries/:id'), ({ request, params }) => {
      sent.record(request);
      const found = saved.find((itinerary) => itinerary.id === params.id);
      return found ? HttpResponse.json(found) : notFound();
    }),
    http.patch(apiUrl('/saved-itineraries/:id'), async ({ request, params }) => {
      sent.record(request);
      const { name } = (await request.json()) as { name: string };
      const found = saved.find((itinerary) => itinerary.id === params.id);
      if (!found) {
        return notFound();
      }
      const renamed = { ...found, name };
      saved = saved.map((itinerary) => (itinerary === found ? renamed : itinerary));
      return HttpResponse.json(renamed);
    }),
    http.delete(apiUrl('/saved-itineraries/:id'), ({ request, params }) => {
      sent.record(request);
      saved = saved.filter((itinerary) => itinerary.id !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return { sent, saved: () => saved };
}
