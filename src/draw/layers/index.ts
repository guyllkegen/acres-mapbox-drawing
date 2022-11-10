import type { AnyLayer } from 'mapbox-gl';

const drawFillLayer: AnyLayer = {
  id: 'draw-fill',
  layout: {},
  paint: {
    'fill-color': '#00FFFF',
    'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      0.25,
      0,
    ],
  },
  source: {
    data: {
      features: [],
      type: 'FeatureCollection',
    },
    type: 'geojson',
  },
  type: 'fill',
};

export default drawFillLayer;
