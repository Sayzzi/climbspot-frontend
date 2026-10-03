import { Decoder, Stream } from '@garmin/fitsdk';
import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { aHillSession, handlers, nearbyResults } from '@/test/api';
import { savedFiles } from '@/test/downloads';
import { fakeMap } from '@/test/fake-map-control';
import { renderApp } from '@/test/render-app';
import { server } from '@/test/server';

const plan = () => within(screen.getByRole('tabpanel', { name: 'Plan' }));

async function sessionProposed() {
  server.use(
    handlers.nearby(() => nearbyResults([])),
    handlers.sessions(() => HttpResponse.json({ sessions: [aHillSession()] }) as never),
  );
  const { user } = await renderApp('/?latitude=45.9&longitude=6.13');
  await user.click(await screen.findByRole('tab', { name: 'Plan' }));
  await user.click(plan().getByRole('radio', { name: 'Hill session' }));
  fakeMap.click({ latitude: 45.9, longitude: 6.13 });
  await user.click(plan().getByRole('button', { name: 'Find hill sessions' }));
  await plan().findByRole('list', { name: 'Proposed itineraries' });
  return user;
}

function lastSaved() {
  const file = savedFiles().at(-1);
  if (!file) {
    throw new Error('a saved file expected');
  }
  return file;
}

describe('Exporting a Hill Session', () => {
  it('saves the whole session as a GPX track with elevations', async () => {
    const user = await sessionProposed();

    await user.click(plan().getByRole('button', { name: 'Download GPX' }));

    const file = lastSaved();
    expect(file.name).toBe('ClimbSpot hill session 8 × 300 m at 7.5%.gpx');
    const gpx = new DOMParser().parseFromString(await file.content(), 'application/xml');
    const points = [...gpx.getElementsByTagName('trkpt')].map((point) => ({
      longitude: Number(point.getAttribute('lon')),
      latitude: Number(point.getAttribute('lat')),
      elevation: Number(point.getElementsByTagName('ele')[0]?.textContent),
    }));
    // Warm-up (3 points), 8 × (2 up, 2 down), Cool-down (3 points).
    expect(points).toHaveLength(3 + 8 * 4 + 3);
    expect(points[0]).toEqual({ longitude: 6, latitude: 45, elevation: 430 });
    expect(points[3]).toEqual({ longitude: 6.01, latitude: 45.01, elevation: 450 });
    expect(points[4]).toEqual({ longitude: 6.01, latitude: 45.0127, elevation: 472 });
    expect(points[5]).toEqual({ longitude: 6.01, latitude: 45.0127, elevation: 472 });
    expect(points[6]).toEqual({ longitude: 6.01, latitude: 45.01, elevation: 450 });
    expect(points.at(-1)).toEqual({ longitude: 6, latitude: 45, elevation: 430 });
  });

  it('saves the session as a structured FIT workout a watch follows step by step', async () => {
    const user = await sessionProposed();

    await user.click(plan().getByRole('button', { name: 'Download workout (FIT)' }));
    // The FIT SDK loads on demand.
    await waitFor(() => {
      expect(savedFiles()).toHaveLength(1);
    });

    const file = lastSaved();
    expect(file.name).toBe('ClimbSpot hill session 8 × 300 m at 7.5%.fit');
    const { messages, errors } = new Decoder(Stream.fromByteArray(await file.bytes())).read();
    expect(errors).toEqual([]);
    expect(messages.fileIdMesgs?.[0]).toMatchObject({ type: 'workout' });
    expect(messages.workoutMesgs?.[0]).toMatchObject({
      sport: 'running',
      numValidSteps: 18,
      wktName: '8 × 300 m at 7.5%',
    });
    const steps = (messages.workoutStepMesgs ?? []).map((step) => ({
      name: step.wktStepName,
      type: step.durationType,
      metres: step.durationDistance,
      intensity: step.intensity,
      target: step.targetType,
    }));
    expect(steps[0]).toEqual({
      name: 'Warm-up',
      type: 'distance',
      metres: 1800,
      intensity: 'warmup',
      target: 'open',
    });
    expect(steps[1]).toEqual({
      name: 'Repeat 1/8',
      type: 'distance',
      metres: 300,
      intensity: 'active',
      target: 'open',
    });
    expect(steps[2]).toEqual({
      name: 'Recovery',
      type: 'distance',
      metres: 300,
      intensity: 'recovery',
      target: 'open',
    });
    expect(steps[15]).toMatchObject({ name: 'Repeat 8/8' });
    expect(steps.at(-1)).toEqual({
      name: 'Cool-down',
      type: 'distance',
      metres: 1800,
      intensity: 'cooldown',
      target: 'open',
    });
    expect(steps).toHaveLength(18);
  });
});
