/* eslint-disable func-names */
const Draw = require('@mapbox/mapbox-gl-draw');

const DrawPolygon = { ...Draw.modes.draw_polygon };

DrawPolygon.toDisplayFeatures = function (state:any, geojson:any, display:any) {
  this.map.fire('draw.liveUpdate', {
    feature: geojson,
  });

  return (Draw.modes.draw_polygon as any).toDisplayFeatures(state, geojson, display);
};

export default DrawPolygon;
