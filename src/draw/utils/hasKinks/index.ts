import kinks from '@turf/kinks';
import type { Feature } from 'geojson';

function doesFeaturesHaveKinks(feature: Feature | Feature[]) {
  if (!Array.isArray(feature)) {
    return kinks(feature as any).features.length > 0;
  }
  if (Array.isArray(feature)) {
    return feature.some((f) => {
      if (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') {
        return kinks(f as any).features.length > 0;
      }

      return false;
    });
  }

  return false;
}

export default doesFeaturesHaveKinks;
