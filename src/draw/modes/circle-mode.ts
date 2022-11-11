/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
/* eslint-disable no-multi-assign */
// Title: mapbox-gl-draw-circle source code
// Author: Anvesh Arrabochu
// Date: 2020
// Code version: 1.1
// Availability: https://github.com/iamanvesh/mapbox-gl-draw-circle

const MapboxDraw = require('@mapbox/mapbox-gl-draw');
const circle = require('@turf/circle').default;
const distance = require('@turf/distance').default;
const turfHelpers = require('@turf/helpers');
const { enable, disable } = require('./utils/drag-pan');

const DragCircleMode = { ...MapboxDraw.modes.draw_polygon };

// These come from @mapbox/mapbox-gl-draw/src/constants, but importing from there
// causes a build error (don't know exact reason why )
const constants = {
  ACTIVE: 'true',
  ADD: 'add',
  FEATURE: 'Feature',
  INACTIVE: 'false',
  POLYGON: 'Polygon',
  SIMPLE_SELECT: 'simple_select',
};

DragCircleMode.onSetup = function () {
  const polygon = this.newFeature({
    geometry: {
      coordinates: [[]],
      type: constants.POLYGON,
    },
    properties: {
      center: [],
      isCircle: true,
    },
    type: constants.FEATURE,
  });

  this.addFeature(polygon);

  this.clearSelectedFeatures();
  disable(this);
  this.updateUIClasses({ mouse: constants.ADD });
  this.activateUIButton(constants.POLYGON);
  this.setActionableState({
    trash: true,
  });

  return {
    currentVertexPosition: 0,
    polygon,
  };
};

DragCircleMode.onMouseDown = DragCircleMode.onTouchStart = function (state:any, e:any) {
  const currentCenter = state.polygon.properties.center;
  if (currentCenter.length === 0) {
    state.polygon.properties.center = [e.lngLat.lng, e.lngLat.lat];
  }
};

DragCircleMode.onDrag = DragCircleMode.onMouseMove = function (state:any, e:any) {
  const { center } = state.polygon.properties;

  if (center.length > 0) {
    const distanceInKm = distance(
      turfHelpers.point(center),
      turfHelpers.point([e.lngLat.lng, e.lngLat.lat]),
      { units: 'kilometers' },
    );
    const circleFeature = circle(center, distanceInKm);
    state.polygon.incomingCoords(circleFeature.geometry.coordinates);
    state.polygon.properties.radiusInKm = distanceInKm;
  }
};

DragCircleMode.onMouseUp = DragCircleMode.onTouchEnd = function (state:any) {
  enable(this);
  return this.changeMode(constants.SIMPLE_SELECT, {
    featureIds: [state.polygon.id],
  });
};

DragCircleMode.onClick = DragCircleMode.onTap = function (state:any) {
  state.polygon.properties.center = [];
};

DragCircleMode.toDisplayFeatures = function (state:any, geojson:any, display:any) {
  const isActivePolygon = geojson.properties.id === state.polygon.id;
  const newGeoJSON = { ...geojson };

  newGeoJSON.properties.active = isActivePolygon
    ? constants.ACTIVE
    : constants.INACTIVE;

  return display(newGeoJSON);
};

export default DragCircleMode;
