import { act } from '@testing-library/react';

import type { MapPosition, MapViewProps } from '@/shared/map/types';

let current: MapViewProps | undefined;

/** Lets tests drive the fake map rendered in place of the WebGL one. */
export const fakeMap = {
  register(props: MapViewProps | undefined) {
    current = props;
  },
  /** Simulates the Visitor panning the map to `center`. */
  moveTo(center: MapPosition) {
    act(() => {
      current?.onAreaChange?.(center);
    });
  },
  props: () => current,
};
