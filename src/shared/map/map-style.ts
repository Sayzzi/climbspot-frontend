import type {
  LayerSpecification,
  RasterDEMSourceSpecification,
  StyleSpecification,
} from 'maplibre-gl';

/** OpenFreeMap's vector style: free, no API key. Its colours give way to Balise's. */
export const BASE_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * The map's colours: lichen land and muted greens, so that waymarks and itineraries
 * (in the theme's waymark red, drawn above) stand out. Kept with the theme tokens.
 */
export const BALISE = {
  land: '#eef1ea',
  wood: '#d6e0c9',
  grass: '#e0e7d4',
  park: '#dbe5ce',
  settlement: '#e5e7e0',
  water: '#c3d4d8',
  waterway: '#a7c1c7',
  waterLabel: '#4f6e74',
  casing: '#d2d7cb',
  minorRoad: '#ffffff',
  majorRoad: '#f7f2e1',
  rail: '#c2c7bc',
  building: '#dfe2da',
  boundary: '#a2a99b',
  place: '#17332a',
  label: '#525a50',
} as const;

export const RELIEF_SOURCE = 'relief';

/** AWS Terrain Tiles (Tilezen), Terrarium-encoded: free, no key, credited as asked. */
const relief: RasterDEMSourceSpecification = {
  type: 'raster-dem',
  tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
  encoding: 'terrarium',
  tileSize: 256,
  maxzoom: 14,
  attribution:
    '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md">Terrain Tiles</a>',
};

/** Relief shading shows from this zoom, where it helps read the hills, and costs little. */
const RELIEF_MINZOOM = 8;

const reliefLayer: LayerSpecification = {
  id: 'relief',
  type: 'hillshade',
  source: RELIEF_SOURCE,
  minzoom: RELIEF_MINZOOM,
  paint: {
    'hillshade-exaggeration': 0.22,
    'hillshade-shadow-color': '#3d5a4c',
    'hillshade-highlight-color': '#ffffff',
    'hillshade-accent-color': '#56683a',
  },
};

/** What crowds the map without helping find a climb. */
const LEFT_OUT = [/^poi_/, /^building-3d$/];

type Paint = Record<string, unknown>;

/** Colours by layer, the first matching rule winning. */
const COLOURS: readonly (readonly [RegExp, Paint])[] = [
  [/^background$/, { 'background-color': BALISE.land }],
  [/^park/, { 'fill-color': BALISE.park, 'line-color': BALISE.park }],
  [/^landcover_wood/, { 'fill-color': BALISE.wood }],
  [/^landcover_(grass|wetland)/, { 'fill-color': BALISE.grass }],
  [/^landuse_/, { 'fill-color': BALISE.settlement }],
  [/^waterway/, { 'line-color': BALISE.waterway }],
  [/^water$/, { 'fill-color': BALISE.water }],
  [/casing$/, { 'line-color': BALISE.casing }],
  [/(major|transit)_rail/, { 'line-color': BALISE.rail }],
  [/(motorway|trunk|primary|secondary|tertiary|link)/, { 'line-color': BALISE.majorRoad }],
  [/(minor|street|service|track|path|pedestrian)/, { 'line-color': BALISE.minorRoad }],
  [/^building$/, { 'fill-color': BALISE.building }],
  [/^boundary/, { 'line-color': BALISE.boundary }],
];

/** Text colours: places in pine, water in its blue, everything else in granite. */
function labelPaint(layer: LayerSpecification): Paint {
  const colour = layer.id.startsWith('label_')
    ? BALISE.place
    : layer.id.startsWith('water')
      ? BALISE.waterLabel
      : BALISE.label;
  return { 'text-color': colour, 'text-halo-color': BALISE.land, 'text-halo-width': 1.5 };
}

/** Keeps of `paint` only the properties the layer's type has. */
function forType(layer: LayerSpecification, paint: Paint): Paint {
  const prefix = layer.type === 'background' ? 'background-' : `${layer.type}-`;
  return Object.fromEntries(Object.entries(paint).filter(([key]) => key.startsWith(prefix)));
}

function recoloured(layer: LayerSpecification): LayerSpecification {
  if (layer.type === 'symbol') {
    return { ...layer, paint: { ...layer.paint, ...labelPaint(layer) } };
  }
  const rule = COLOURS.find(([pattern]) => pattern.test(layer.id));
  if (!rule || !('paint' in layer)) {
    return layer;
  }
  return { ...layer, paint: { ...layer.paint, ...forType(layer, rule[1]) } } as LayerSpecification;
}

/**
 * OpenFreeMap's style in Balise colours, with relief shading under water, roads and
 * labels. The base style is left untouched.
 */
export function baliseStyle(base: StyleSpecification): StyleSpecification {
  const layers = base.layers
    .filter((layer) => !LEFT_OUT.some((pattern) => pattern.test(layer.id)))
    .map(recoloured);
  // Above the land and its covers, below the first water, road or label.
  const firstAbove = layers.findIndex(
    (layer) =>
      layer.id.startsWith('water') ||
      ('source-layer' in layer && layer['source-layer'] === 'transportation') ||
      layer.type === 'symbol',
  );
  const at = firstAbove === -1 ? layers.length : firstAbove;
  return {
    ...base,
    sources: { ...base.sources, [RELIEF_SOURCE]: relief },
    layers: [...layers.slice(0, at), reliefLayer, ...layers.slice(at)],
  };
}

let loading: Promise<StyleSpecification | string> | undefined;

/** The Balise style, fetched once; OpenFreeMap's own when it cannot be adapted. */
export function loadBaliseStyle(): Promise<StyleSpecification | string> {
  loading ??= fetch(BASE_STYLE_URL)
    .then((response) => response.json() as Promise<StyleSpecification>)
    .then(baliseStyle)
    .catch(() => BASE_STYLE_URL);
  return loading;
}
