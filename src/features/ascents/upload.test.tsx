import { screen, within } from '@testing-library/react';
import { delay, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { anAscent, apiErrorResponse, handlers } from '@/test/api';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const NEW_ID = '00000000-0000-4000-8000-0000000000aa';

const gpxFile = (name = 'le-mur.gpx', size?: number) =>
  new File([size === undefined ? '<gpx/>' : new Uint8Array(size)], name, {
    type: 'application/gpx+xml',
  });

interface SentUpload {
  name: FormDataEntryValue | null;
  surface: FormDataEntryValue | null;
  gpx: FormDataEntryValue | null;
}

function createApi(
  respond: () => Response | Promise<Response> = () =>
    HttpResponse.json(anAscent({ id: NEW_ID, name: 'Le Mur' }), { status: 201 }),
) {
  const sent: SentUpload[] = [];
  server.use(
    handlers.createAscent(async (request) => {
      const form = await request.formData();
      sent.push({ name: form.get('name'), surface: form.get('surface'), gpx: form.get('gpx') });
      return (await respond()) as never;
    }),
    handlers.ascent(() => HttpResponse.json(anAscent({ id: NEW_ID, name: 'Le Mur' }))),
  );
  return sent;
}

async function openForm() {
  const app = await renderApp('/ascents/new');
  await screen.findByRole('heading', { level: 1, name: 'Add a climb' });
  return app;
}

async function fill(
  user: Awaited<ReturnType<typeof renderApp>>['user'],
  {
    name = 'Le Mur',
    surface = 'Gravel',
    file = gpxFile(),
  }: { name?: string; surface?: string; file?: File } = {},
) {
  if (name) {
    await user.type(screen.getByRole('textbox', { name: 'Name' }), name);
  }
  if (surface) {
    await user.click(screen.getByRole('radio', { name: new RegExp(`^${surface}`) }));
  }
  await user.upload(screen.getByLabelText('GPX file'), file);
}

const submit = () => screen.getByRole('button', { name: 'Add the climb' });

describe('Adding an Ascent', () => {
  it('is reachable from the header', async () => {
    const { router, user } = await renderApp('/does-not-exist');

    await user.click(await screen.findByRole('link', { name: 'Add a climb' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Add a climb' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/ascents/new');
  });

  it('tells which Activities each Surface allows', async () => {
    await openForm();

    const surfaces = within(screen.getByRole('radiogroup', { name: 'Surface' }));
    expect(
      surfaces.getByRole('radio', { name: 'Paved Running, Road cycling' }),
    ).toBeInTheDocument();
    expect(
      surfaces.getByRole('radio', {
        name: 'Gravel Running, Trail running, Gravel cycling, Mountain biking',
      }),
    ).toBeInTheDocument();
    expect(
      surfaces.getByRole('radio', { name: 'Trail Trail running, Mountain biking' }),
    ).toBeInTheDocument();
  });

  it('uploads the file with its name and Surface, then opens the new Ascent', async () => {
    const sent = createApi();
    const { router, user } = await openForm();

    await fill(user, { name: '  Le Mur  ', surface: 'Gravel', file: gpxFile('le-mur.gpx') });
    await user.click(submit());

    expect(await screen.findByRole('heading', { level: 1, name: 'Le Mur' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/ascents/${NEW_ID}`);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.name).toBe('Le Mur');
    expect(sent[0]?.surface).toBe('gravel');
    expect(await (sent[0]?.gpx as File).text()).toBe('<gpx/>');
  });

  it('catches missing information before sending anything', async () => {
    const sent = createApi();
    const { user } = await openForm();

    await user.click(submit());

    expect(screen.getByText('Give the climb a name.')).toBeInTheDocument();
    expect(screen.getByText('Choose a surface.')).toBeInTheDocument();
    expect(screen.getByText('Choose a GPX file.')).toBeInTheDocument();
    expect(sent).toHaveLength(0);
  });

  it('refuses a name over 100 characters before sending', async () => {
    const sent = createApi();
    const { user } = await openForm();

    await fill(user, { name: 'a'.repeat(101) });
    await user.click(submit());

    expect(screen.getByText('Keep the name under 100 characters.')).toBeInTheDocument();
    expect(sent).toHaveLength(0);
  });

  it('refuses a file over 5 MB before sending', async () => {
    const sent = createApi();
    const { user } = await openForm();

    await fill(user, { file: gpxFile('huge.gpx', 5 * 1024 * 1024 + 1) });
    await user.click(submit());

    expect(screen.getByText('This file is larger than 5 MB.')).toBeInTheDocument();
    expect(sent).toHaveLength(0);
  });

  it('shows the upload in progress and sends it once', async () => {
    const sent = createApi(async () => {
      await delay(50);
      return HttpResponse.json(anAscent({ id: NEW_ID, name: 'Le Mur' }), { status: 201 });
    });
    const { user } = await openForm();
    await fill(user);

    await user.click(submit());

    const pending = screen.getByRole('button', { name: 'Adding…' });
    expect(pending).toBeDisabled();
    await user.click(pending);
    await screen.findByRole('heading', { level: 1, name: 'Le Mur' });
    expect(sent).toHaveLength(1);
  });

  it.each([
    [422, 'GPX_INVALID', 'This file is not a valid GPX file.'],
    [422, 'GPX_EMPTY', 'This file has no track or route with at least two points.'],
    [
      413,
      'GPX_TOO_LARGE',
      'This file is too large. Use a file under 5 MB with at most 20,000 points.',
    ],
    [422, 'ASCENT_TOO_LONG', 'This path is too long. A climb is at most 50 km.'],
    [422, 'ASCENT_TOO_FLAT', 'This path is too flat. A climb averages at least 3 %.'],
    [422, 'ASCENT_TOO_LOW', 'This path does not gain enough height. A climb gains at least 10 m.'],
    [
      422,
      'ASCENT_DIP_TOO_LARGE',
      'This path goes down too much along the way. Split it into two climbs.',
    ],
    [
      503,
      'ELEVATION_UNAVAILABLE',
      'Elevation data is temporarily unavailable. Please try again in a moment.',
    ],
    [400, 'VALIDATION_FAILED', 'Some information is missing or invalid.'],
    [403, 'ASCENT_CREATION_DISABLED', 'Adding climbs is not open yet. Check back soon!'],
  ])('explains a %s %s refusal and keeps the form filled', async (status, code, message) => {
    createApi(() => apiErrorResponse(status, code));
    const { router, user } = await openForm();
    await fill(user, { name: 'Le Mur' });

    await user.click(submit());

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Le Mur');
    expect(screen.getByRole('radio', { name: /^Gravel/ })).toBeChecked();
    expect(router.state.location.pathname).toBe('/ascents/new');
    expect(submit()).toBeEnabled();
  });

  it('explains when ClimbSpot cannot be reached', async () => {
    createApi(() => Response.error());
    const { user } = await openForm();
    await fill(user);

    await user.click(submit());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not reach ClimbSpot. Check your connection.',
    );
  });
});
