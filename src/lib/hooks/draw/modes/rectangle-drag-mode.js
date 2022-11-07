// Title: mapbox-gl-draw-circle source code
// Author: CARTO
// Date: 2019
// Code version: 1.0.1
// Availability: https://github.com/CartoDB/mapboxgl-draw-rectangle-drag

import createRectangle from './utils/create-rectangle';
import { disableZoom, enableZoom } from './utils/zoom';

const DrawRectangleDrag = {
  onDrag(state, event) {
    if (!state.startPoint) {
      return;
    }

    // Upper right vertex - maxX, minY
    state.rectangle.updateCoordinate(
      '0.1',
      event.lngLat.lng,
      state.startPoint[1]
    );

    // Lower right vertex - maxX, maxY
    state.rectangle.updateCoordinate('0.2', event.lngLat.lng, event.lngLat.lat);

    // Lower left vertex - minX, maxY
    state.rectangle.updateCoordinate(
      '0.3',
      state.startPoint[0],
      event.lngLat.lat
    );

    // Starting point again
    state.rectangle.updateCoordinate(
      '0.4',
      state.startPoint[0],
      state.startPoint[1]
    );
  },

  onMouseDown(state, event) {
    event.preventDefault();

    const startPoint = [event.lngLat.lng, event.lngLat.lat];
    state.startPoint = startPoint;

    // Starting point - minX,minY
    state.rectangle.updateCoordinate(
      '0.0',
      state.startPoint[0],
      state.startPoint[1]
    );
  },

  onMouseUp(state, event) {
    state.endPoint = [event.lngLat.lng, event.lngLat.lat];

    this.updateUIClasses({ mouse: 'pointer' });
    this.changeMode('simple_select', { featuresId: state.rectangle.id });
  },

  onSetup() {
    const rectangle = this.newFeature(createRectangle());
    this.addFeature(rectangle);

    this.clearSelectedFeatures();

    // UI Tweaks
    this.updateUIClasses({ mouse: 'add' });
    this.setActionableState({ trash: true });
    disableZoom(this);

    return { rectangle };
  },

  onStop(state) {
    enableZoom(this);
    this.updateUIClasses({ mouse: 'none' });

    if (!this.getFeature(state.rectangle.id)) {
      return;
    }

    // Remove latest coordinate
    state.rectangle.removeCoordinate('0.4');

    if (state.rectangle.isValid()) {
      this.map.fire('draw.create', {
        features: [state.rectangle.toGeoJSON()],
      });
      return;
    }

    this.deleteFeature([state.rectangle.id], { silent: true });
    this.changeMode('simple_select', {}, { silent: true });
  },

  onTrash(state) {
    this.deleteFeature([state.rectangle.id], { silent: true });
    this.changeMode('simple_select');
  },

  toDisplayFeatures(state, geojson, display) {
    const isActivePolygon = geojson.properties.id === state.rectangle.id;
    // eslint-disable-next-line no-param-reassign
    geojson.properties.active = isActivePolygon.toString();

    if (!isActivePolygon) {
      display(geojson);
      return;
    }

    if (!state.startPoint) {
      return;
    }

    display(geojson);
  },
};

export default DrawRectangleDrag;
