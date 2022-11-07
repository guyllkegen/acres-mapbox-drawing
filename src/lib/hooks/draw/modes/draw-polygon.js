/* eslint-disable func-names */
import * as Draw from '@mapbox/mapbox-gl-draw';

const DrawPolygon = { ...Draw.modes.draw_polygon };

DrawPolygon.toDisplayFeatures = function (state, geojson, display) {
  this.map.fire('draw.liveUpdate', {
    feature: geojson,
  });

  return Draw.modes.draw_polygon.toDisplayFeatures(state, geojson, display);
};

export default DrawPolygon;
