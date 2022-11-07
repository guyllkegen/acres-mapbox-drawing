import { getArea } from 'acres-mapbox-utils/dist/geometry/getAcres';
import type { Feature } from 'geojson';

function isAreaTooLarge(features: Feature[], MAX_DRAW_ACRES?:number) {
  // Filter out any points, they have no area

  if (!MAX_DRAW_ACRES) return false;

  const filteredFeatures = features.filter((f) => f.geometry.type !== 'Point');
  if (filteredFeatures.length === 0) return false;

  try {
    const totalArea = filteredFeatures.reduce(
      (prev, curr) => getArea(curr.geometry) + prev,
      0,
    );

    return totalArea > MAX_DRAW_ACRES;
  } catch (err) {
    return true;
  }
}

export default isAreaTooLarge;
