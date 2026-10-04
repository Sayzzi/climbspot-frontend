import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const API_URL = 'http://localhost:3000';

/**
 * What every test starts with: Visitors have no Strava Connection. Signing in
 * synchronises it, whatever page a test opens.
 */
const noStravaConnection = () =>
  HttpResponse.json({
    status: 'none',
    athlete: null,
    connectedAt: null,
    lastSyncAt: null,
    recordedRuns: 0,
  });

/** Stands in for the ClimbSpot API; tests register handlers with `server.use(...)`. */
export const server = setupServer(
  http.get(`${API_URL}/strava/connection`, noStravaConnection),
  http.post(`${API_URL}/strava/sync`, noStravaConnection),
);
