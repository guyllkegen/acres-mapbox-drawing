// Title: mapbox-gl-draw-circle source code
// Author: CARTO
// Date: 2019
// Code version: 1.0.1
// Availability: https://github.com/CartoDB/mapboxgl-draw-rectangle-drag

export default function createRectangle() {
  return {
    geometry: {
      coordinates: [[]],
      type: 'Polygon',
    },
    properties: {},
    type: 'Feature',
  };
}
