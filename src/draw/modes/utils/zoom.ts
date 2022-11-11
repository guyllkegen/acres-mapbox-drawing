// Title: mapbox-gl-draw-circle source code
// Author: CARTO
// Date: 2019
// Code version: 1.0.1
// Availability: https://github.com/CartoDB/mapboxgl-draw-rectangle-drag

export function enableZoom(context:any) {
  setTimeout(() => {
    // eslint-disable-next-line
    const store = context._ctx && context._ctx.store;
    const map = context.map && context.map;

    if (!map && !store.getInitialValue) {
      return;
    }

    if (!store.getInitialConfigValue('doubleClickZoom')) {
      return;
    }

    map.doubleClickZoom.enable();
  }, 0);
}

export function disableZoom(context:any) {
  setTimeout(() => {
    const { map } = context;
    const doubleClickZoom = map && map.doubleClickZoom;

    if (!map || !doubleClickZoom) {
      return;
    }

    // Always disable here, as it's necessary in some cases.
    doubleClickZoom.disable();
  }, 0);
}
