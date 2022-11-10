import centroid from 'acres-mapbox-utils/dist/geometry/centroid';
import type { Geometry } from 'geojson';

function isOutsideArea(geometry: Geometry, area?: [number, number, number, number]) {
  try {
    if (!area) return false;

    // -124.736342, 24.521208, -66.945392, 49.382808,
    const [minX, minY, maxX, maxY] = area;
    const center = centroid(geometry);

    if (!center) return true;

    const [x, y] = center.geometry.coordinates;

    return !(
      (x || 0) >= minX
      && (x || 0) <= maxX
      && (y || 0) >= minY
      && (y || 0) <= maxY
    );
  } catch (err) {
    return true;
  }
}

export default isOutsideArea;
