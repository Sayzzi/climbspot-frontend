import { setupServer } from 'msw/node';

/** Stands in for the ClimbSpot API; tests register handlers with `server.use(...)`. */
export const server = setupServer();
