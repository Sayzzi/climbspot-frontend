import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { aLoopItinerary, anUphillItinerary, handlers, nearbyResults } from '@/test/api';
import { savedFiles } from '@/test/downloads';
import { fakeMap } from '@/test/fake-map-control';
import { stubLanguages } from '@/test/languages';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const plan = () => within(screen.getByRole('tabpanel', { name: 'Plan' }));

async function proposals(kind: 'uphill' | 'loop') {
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.uphill(() =>
      HttpResponse.json({
        itineraries: [
          anUphillItinerary(),
          anUphillItinerary({ length: 5000, averageGradient: 0.03 }),
        ],
      }),
    ),
    handlers.loops(() => HttpResponse.json({ itineraries: [aLoopItinerary()] })),
  );
  const { user } = await renderApp('/?latitude=45.9&longitude=6.13');
  await user.click(await screen.findByRole('tab', { name: 'Plan' }));
  if (kind === 'loop') {
    await user.click(plan().getByRole('radio', { name: 'Loop' }));
  }
  fakeMap.click({ latitude: 45.9, longitude: 6.13 });
  await user.click(
    plan().getByRole('button', {
      name: kind === 'loop' ? 'Find loops' : 'Find uphill itineraries',
    }),
  );
  await plan().findByRole('list', { name: 'Proposed itineraries' });
  return user;
}

async function savedGpx() {
  const [file] = savedFiles();
  if (!file) {
    throw new Error('a saved file expected');
  }
  const gpx = new DOMParser().parseFromString(await file.content(), 'application/xml');
  const points = [...gpx.getElementsByTagName('trkpt')].map((point) => ({
    latitude: Number(point.getAttribute('lat')),
    longitude: Number(point.getAttribute('lon')),
    elevation: Number(point.getElementsByTagName('ele')[0]?.textContent),
  }));
  return { file, gpx, points };
}

describe('Exporting an Itinerary as GPX', () => {
  it('offers the download on the selected proposal only', async () => {
    const user = await proposals('uphill');

    expect(plan().getAllByRole('button', { name: 'Download GPX' })).toHaveLength(1);

    const [, second] = plan().getAllByRole('listitem');
    if (!second) {
      throw new Error('a second proposal expected');
    }
    await user.click(within(second).getByRole('button', { name: /^Show/ }));

    expect(within(second).getByRole('button', { name: 'Download GPX' })).toBeInTheDocument();
  });

  it('saves an Uphill Itinerary as a GPX track with every point and its elevation', async () => {
    const user = await proposals('uphill');

    await user.click(plan().getByRole('button', { name: 'Download GPX' }));

    const { file, gpx, points } = await savedGpx();
    expect(file.name).toBe('ClimbSpot uphill 3 km at 4.5%.gpx');
    expect(file.type).toBe('application/gpx+xml');
    expect(gpx.getElementsByTagName('parsererror')).toHaveLength(0);
    expect(gpx.documentElement.getAttribute('version')).toBe('1.1');
    expect(gpx.getElementsByTagName('trk')[0]?.getElementsByTagName('name')[0]?.textContent).toBe(
      'ClimbSpot uphill 3 km at 4.5%',
    );
    expect(points.map(({ latitude, longitude }) => [longitude, latitude])).toEqual([
      [6.001, 45.001],
      [6.001, 45.01],
      [6.002, 45.02],
      [6.002, 45.028],
    ]);
    // Elevations come from the profile, at each point's distance along the path.
    expect(points.map((point) => point.elevation)).toEqual([450, 496.6, 546.5, 585]);
  });

  it('saves a Loop', async () => {
    const user = await proposals('loop');

    await user.click(plan().getByRole('button', { name: 'Download GPX' }));

    const { file, points } = await savedGpx();
    expect(file.name).toBe('ClimbSpot loop 5.6 km.gpx');
    expect(points).toHaveLength(4);
    expect(points[0]?.elevation).toBe(450);
    expect(points.at(-1)?.elevation).toBe(450);
  });

  it('names the file in the Visitor’s units', async () => {
    stubLanguages('en-US');
    const user = await proposals('loop');

    await user.click(plan().getByRole('button', { name: 'Download GPX' }));

    expect(savedFiles()[0]?.name).toBe('ClimbSpot loop 3.5 mi.gpx');
  });
});
