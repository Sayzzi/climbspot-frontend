# ClimbSpot — Frontend

Web app for ClimbSpot: find uphill paths (**Ascents**) near you for running, trail running and cycling, and catalogue new ones.

- Domain vocabulary and architecture decisions live in the backend: [`CONTEXT.md`](https://github.com/Sayzzi/climbspot-backend/blob/main/CONTEXT.md), [`docs/adr/`](https://github.com/Sayzzi/climbspot-backend/tree/main/docs/adr)
- API: [climbspot-backend](https://github.com/Sayzzi/climbspot-backend)

## Stack

| Concern      | Choice                                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Build        | Vite (single-page app)                                                                                                            |
| UI           | React 19 + TypeScript                                                                                                             |
| Styling      | Tailwind CSS v4, `cva` for variants, `cn()` (clsx + tailwind-merge)                                                               |
| Routing      | TanStack Router (file-based, type-safe params and search params)                                                                  |
| Server state | TanStack Query                                                                                                                    |
| API client   | `openapi-fetch`, typed from the backend's OpenAPI document                                                                        |
| i18n         | i18next + react-i18next, type-checked keys                                                                                        |
| Tests        | Vitest + Testing Library (jsdom)                                                                                                  |
| Quality      | TypeScript strict, ESLint (typescript-eslint strict, React, a11y, TanStack, boundaries), Prettier, husky, lint-staged, commitlint |
| Map          | MapLibre GL (react-map-gl) with OpenFreeMap tiles, behind `shared/map`                                                            |
| Hosting      | Vercel                                                                                                                            |

## Getting started

Requirements: Node.js ≥ 22.12 (see `.nvmrc`) and pnpm (`corepack enable`).

```bash
pnpm install
pnpm dev        # http://localhost:5173, talks to the API at VITE_API_URL
```

`.env.development` points at a local API (`http://localhost:3000`). Override it in `.env.development.local` if needed; see `.env.example` for every variable.

## Scripts

| Script                                       | Purpose                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`                                   | Start the dev server                                                       |
| `pnpm build` / `pnpm preview`                | Type-check, build to `dist/` and preview the build                         |
| `pnpm test` / `test:watch` / `test:coverage` | Run the test suite                                                         |
| `pnpm lint` / `lint:fix`                     | Lint, including architectural boundaries                                   |
| `pnpm format` / `format:check`               | Format with Prettier (also sorts Tailwind classes)                         |
| `pnpm typecheck`                             | Type-check the app and the tooling config                                  |
| `pnpm api:generate`                          | Regenerate API types from a running backend (`API_SCHEMA_URL` to override) |

## Architecture

Code is organised by feature first, then by technical role inside each feature:

```
src/
├── app/          # application shell: providers, router, query client, global styles
├── routes/       # pages (TanStack Router file-based routes): compose features, no business logic
├── features/
│   └── <feature>/
│       ├── api/         # API calls and TanStack Query hooks
│       ├── components/  # feature UI
│       ├── hooks/       # feature logic
│       └── index.ts     # the feature's public API
├── shared/
│   ├── api/      # typed API client, generated schema (schema.gen.ts), errors → translation keys
│   ├── config/   # environment validation
│   ├── hooks/    # React hooks over browser APIs (geolocation…)
│   ├── i18n/     # i18next setup and typed resources
│   ├── lib/      # framework-agnostic helpers and types (cn, Position…)
│   ├── map/      # the map adapter: the only code that knows the map library
│   ├── units/    # metric/imperial preference and formatters
│   └── ui/       # design-system primitives (Button…)
├── locales/      # translation files, one folder per language and namespace
├── test/         # test harness: app renderer, MSW API stand-in, fake map, browser stubs
└── main.tsx      # entry point
```

Dependency rules are enforced by `eslint-plugin-boundaries` (see `eslint.config.js`):

- Imports flow `app → routes → features → shared`, never backwards.
- A feature never imports another feature; routes compose them.
- `shared` knows nothing about features, routes or the app shell.

Principles applied:

- **Single responsibility**: components render, hooks hold logic, `api/` handles transport.
- **Open/closed**: components expose variants through `cva` instead of being edited for each new look.
- **Dependency inversion**: features consume the typed `apiClient`, never `fetch` directly; tests swap the router history and query client through factories (`createAppRouter`, `createQueryClient`).

## Testing

Tests act like a Visitor: they render the whole app at a URL (`renderApp` in `src/test/render-app.tsx`), interact through roles, labels and text with Testing Library, and assert on what is shown or what the URL becomes. Only three boundaries are replaced:

- **The API**, by [MSW](https://mswjs.io/) (`src/test/server.ts`; handlers and fixtures typed from the generated schema in `src/test/api.ts`). A request without a handler fails.
- **The browser**: geolocation (`stubGeolocation`), preferred languages (`stubLanguages`, en-GB by default) and the APIs jsdom lacks or tests must break: `scrollTo` (not implemented) and `localStorage` (made to fail when testing the fallback).
- **The map**: MapLibre needs WebGL, which jsdom lacks, so `shared/map` is replaced by a fake that renders markers as buttons; `fakeMap.moveTo()` simulates panning. The real map is checked by hand against a running API.

## Styling

Tailwind CSS v4 with design tokens declared once in `src/app/styles.css` (`@theme`). Components only use token-based utilities (`bg-brand-600`, `text-ink-muted`), never raw colour values. Why Tailwind over the alternatives:

- **vs. CSS Modules / BEM**: styles live next to the markup they affect, there is no naming to maintain and no dead CSS. Tokens prevent the one-off values that utilities are often blamed for.
- **vs. styled-components / CSS-in-JS**: no runtime cost, no extra bundle and no server-rendering pitfalls. Most CSS-in-JS libraries are in maintenance mode.
- **Variants** are declared with `class-variance-authority` (`src/shared/ui/button-variants.ts`), and `cn()` merges caller classes so later utilities win.
- Prettier sorts classes automatically (`prettier-plugin-tailwindcss`).
- Third-party stylesheets (e.g. the map library) are imported as plain CSS.

## Internationalisation

The UI ships in English; every user-facing string goes through a translation key, so adding a language means adding files only.

- Translations live in `src/locales/<language>/<namespace>.json`. English is the reference: other languages must provide the same keys.
- Keys are type-checked (`src/shared/i18n/i18next.d.ts`), so `t('home.titel')` fails to compile.
- The API never returns display text: it returns stable error codes (`ROUTE_NOT_FOUND`), translated under `errors.<CODE>` in the common namespace, including the Ascent-specific ones, so that one helper (`errorMessageKey`) can translate any failure.
- Numbers, distances and dates are formatted with `Intl`, from SI values stored by the API, in metric or imperial depending on the user.
- User-generated content (e.g. an Ascent's name) is not translated.

To add a language: create `src/locales/<lang>/common.json` with every key, register it in `src/shared/i18n/resources.ts`, then add language detection.

## API contract

The backend owns the contract ([ADR 0003](https://github.com/Sayzzi/climbspot-backend/blob/main/docs/adr/0003-backend-owns-the-api-contract.md)). After an API change, run the backend and `pnpm api:generate`, then commit `src/shared/api/schema.gen.ts`. Never write API types by hand.

## Conventions

- Code, identifiers, commits and documentation are written in English, using the domain vocabulary (`Ascent`, `Gradient`, `Surface`…). UI copy may say "climb" or "hill" through translations.
- Imports from `src` use the `@/` alias.
- Tests live next to the code they cover (`*.test.ts(x)`).
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint.
- `src/app/routeTree.gen.ts` and `src/shared/api/schema.gen.ts` are generated and committed; do not edit them.

## Deployment

Vercel detects Vite and pnpm automatically. Set `VITE_API_URL` in the project's environment variables, and add the Vercel domain to the backend's `CORS_ORIGINS`. `vercel.json` rewrites every path to `index.html` so client-side routes survive a refresh.
