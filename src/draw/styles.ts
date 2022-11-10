interface Options {
  /** Set to true to hide the blue lines of a "done" polygon  */
  hideIdleLines?: boolean;
}

const getMapboxDrawStyles = (options?: Options) => {
  const hideIdleLines = options?.hideIdleLines ?? false;

  // When the polygon is complete
  const styles = [
    {
      filter: [
        'all',
        ['==', 'active', 'false'],
        ['==', '$type', 'Polygon'],
        ['!=', 'mode', 'static'],
      ],
      id: 'gl-draw-polygon-fill-inactive',
      // TODO: Need to mock a hover since MapboxDraw does not support feature state
      paint: {
        'fill-color': 'red',
        'fill-opacity': 0,
        'fill-outline-color': 'red',
      },
      type: 'fill',
    },
    // When the polygon is drawning
    {
      filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
      id: 'gl-draw-polygon-fill-active',
      paint: {
        'fill-color': '#FFC700',
        'fill-opacity': 0.1,
        'fill-outline-color': '#FFC700',
      },
      type: 'fill',
    },
    {
      filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
      id: 'gl-draw-polygon-midpoint',
      paint: {
        'circle-color': '#FFC700',
        'circle-radius': 6,
      },
      type: 'circle',
    },
    // The lines of a complete polygon
    {
      filter: [
        'all',
        ['==', 'active', 'false'],
        ['==', '$type', 'Polygon'],
        ['!=', 'mode', 'static'],
      ],
      id: 'gl-draw-polygon-stroke-inactive',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
        visibility: hideIdleLines ? 'none' : 'visible',
      },
      paint: {
        'line-color': '#00FFFF',
        'line-width': 3,
      },
      type: 'line',
    },
    {
      filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
      id: 'gl-draw-polygon-stroke-active',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#FFC700',
        'line-width': 3,
      },
      type: 'line',
    },
    // Line
    {
      filter: [
        'all',
        ['==', 'active', 'false'],
        ['==', '$type', 'LineString'],
        ['!=', 'mode', 'static'],
      ],
      id: 'gl-draw-line-inactive',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#3bb2d0',
        'line-width': 2,
      },
      type: 'line',
    },
    // This is the first line when using the polygon tool
    {
      filter: ['all', ['==', '$type', 'LineString'], ['==', 'active', 'true']],
      id: 'gl-draw-line-active',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#FFC700',
        // 'line-dasharray': [0.2, 2],
        'line-width': 3,
      },
      type: 'line',
    },
    // This is the white stroke around vertices when drawing
    {
      filter: [
        'all',
        ['==', 'meta', 'vertex'],
        ['==', '$type', 'Point'],
        ['!=', 'mode', 'static'],
      ],
      id: 'gl-draw-polygon-and-line-vertex-stroke-inactive',
      paint: {
        'circle-color': '#fff',
        'circle-radius': 7,
      },
      type: 'circle',
    },
    // This is the dot inside the stroke when drawing
    {
      filter: [
        'all',
        ['==', 'meta', 'vertex'],
        ['==', '$type', 'Point'],
        ['!=', 'mode', 'static'],
      ],
      id: 'gl-draw-polygon-and-line-vertex-inactive',
      paint: {
        'circle-color': '#FFC700',
        'circle-radius': 5,
      },
      type: 'circle',
    },
    // Point
    {
      filter: [
        'all',
        ['==', 'active', 'false'],
        ['==', '$type', 'Point'],
        ['==', 'meta', 'feature'],
        ['!=', 'mode', 'static'],
      ],
      id: 'gl-draw-point-point-stroke-inactive',
      paint: {
        'circle-color': '#fff',
        'circle-opacity': 1,
        'circle-radius': 5,
      },
      type: 'circle',
    },
    // Point
    {
      filter: [
        'all',
        ['==', 'active', 'false'],
        ['==', '$type', 'Point'],
        ['==', 'meta', 'feature'],
        ['!=', 'mode', 'static'],
      ],
      id: 'gl-draw-point-inactive',
      paint: {
        'circle-color': '#3bb2d0',
        'circle-radius': 3,
      },
      type: 'circle',
    },
    // Point
    {
      filter: [
        'all',
        ['==', '$type', 'Point'],
        ['==', 'active', 'true'],
        ['!=', 'meta', 'midpoint'],
      ],
      id: 'gl-draw-point-stroke-active',
      paint: {
        'circle-color': '#fff',
        'circle-radius': 7,
      },
      type: 'circle',
    },
    // Point
    {
      filter: [
        'all',
        ['==', '$type', 'Point'],
        ['!=', 'meta', 'midpoint'],
        ['==', 'active', 'true'],
      ],
      id: 'gl-draw-point-active',
      paint: {
        'circle-color': '#fbb03b',
        'circle-radius': 5,
      },
      type: 'circle',
    },
    // Not intractable
    {
      filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
      id: 'gl-draw-polygon-fill-static',
      paint: {
        'fill-color': 'red',
        'fill-opacity': 0.1,
        'fill-outline-color': '#404040',
      },
      type: 'fill',
    },
    // Not intractable
    {
      filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
      id: 'gl-draw-polygon-stroke-static',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#404040',
        'line-width': 2,
      },
      type: 'line',
    },
    // Not intractable
    {
      filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'LineString']],
      id: 'gl-draw-line-static',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#404040',
        'line-width': 2,
      },
      type: 'line',
    },
    // Not intractable
    {
      filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Point']],
      id: 'gl-draw-point-static',
      paint: {
        'circle-color': '#404040',
        'circle-radius': 5,
      },
      type: 'circle',
    },
  ];
  return styles;
};

export default getMapboxDrawStyles;
