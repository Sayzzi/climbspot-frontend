import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';

import { BALISE, baliseStyle, RELIEF_SOURCE } from './map-style';

/** A trimmed copy of OpenFreeMap's Liberty style: its kinds of layers, in its order. */
const liberty: StyleSpecification = {
  version: 8,
  sources: { openmaptiles: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#f8f4f0' } },
    {
      id: 'park',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'park',
      paint: { 'fill-color': '#d8e8c8' },
    },
    {
      id: 'landcover_wood',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'landcover',
      paint: { 'fill-color': 'hsla(98,61%,72%,0.7)' },
    },
    {
      id: 'waterway_river',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'waterway',
      paint: { 'line-color': '#a0c8f0' },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: { 'fill-color': 'rgb(158,189,255)' },
    },
    {
      id: 'road_minor_casing',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      paint: { 'line-color': '#cfcdca' },
    },
    {
      id: 'road_trunk_primary',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'transportation',
      paint: { 'line-color': '#fea' },
    },
    {
      id: 'building',
      type: 'fill',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: { 'fill-color': 'hsl(35,8%,85%)' },
    },
    {
      id: 'building-3d',
      type: 'fill-extrusion',
      source: 'openmaptiles',
      'source-layer': 'building',
      paint: {},
    },
    {
      id: 'poi_r1',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'poi',
      paint: { 'text-color': '#666' },
    },
    {
      id: 'label_town',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'place',
      paint: { 'text-color': '#000' },
    },
  ],
};

const layer = (style: StyleSpecification, id: string) =>
  style.layers.find((each) => each.id === id);
const ids = (style: StyleSpecification) => style.layers.map((each) => each.id);

describe('The Balise map style', () => {
  it('draws the land, water and roads in Balise colours', () => {
    const style = baliseStyle(liberty);

    expect(layer(style, 'background')).toMatchObject({
      paint: { 'background-color': BALISE.land },
    });
    expect(layer(style, 'water')).toMatchObject({ paint: { 'fill-color': BALISE.water } });
    expect(layer(style, 'road_trunk_primary')).toMatchObject({
      paint: { 'line-color': BALISE.majorRoad },
    });
    expect(layer(style, 'label_town')).toMatchObject({
      paint: { 'text-color': BALISE.place, 'text-halo-color': BALISE.land },
    });
  });

  it('leaves out what crowds the map: points of interest and 3D buildings', () => {
    const style = baliseStyle(liberty);

    expect(ids(style)).not.toContain('poi_r1');
    expect(ids(style)).not.toContain('building-3d');
  });

  it('shades the relief from AWS Terrain Tiles, under water, roads and labels', () => {
    const style = baliseStyle(liberty);

    expect(style.sources[RELIEF_SOURCE]).toMatchObject({
      type: 'raster-dem',
      encoding: 'terrarium',
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      attribution: expect.stringContaining('Terrain Tiles') as unknown,
    });
    const relief = layer(style, 'relief');
    expect(relief).toMatchObject({ type: 'hillshade', source: RELIEF_SOURCE });
    expect(relief?.minzoom).toBeGreaterThan(0);
    expect(ids(style).indexOf('relief')).toBeGreaterThan(ids(style).indexOf('landcover_wood'));
    expect(ids(style).indexOf('relief')).toBeLessThan(ids(style).indexOf('waterway_river'));
  });

  it('leaves the original style untouched', () => {
    const before = JSON.stringify(liberty);

    baliseStyle(liberty);

    expect(JSON.stringify(liberty)).toBe(before);
  });
});
