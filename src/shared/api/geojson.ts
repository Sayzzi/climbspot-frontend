/**
 * openapi-fetch widens GeoJSON `[longitude, latitude]` pairs to `number[][]`; the
 * API contract guarantees pairs, so restore them, checking each one.
 */
export function toPairs(coordinates: readonly (readonly number[])[]): [number, number][] {
  return coordinates.map(([longitude, latitude]) => {
    if (longitude === undefined || latitude === undefined) {
      throw new TypeError('The API sent a path point without two coordinates.');
    }
    return [longitude, latitude];
  });
}
