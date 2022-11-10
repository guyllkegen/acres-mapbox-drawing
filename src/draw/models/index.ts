import { Feature, Geometry } from 'geojson';

export type DrawProperties = {};

export interface IDrawPropertiesWithType
  extends DrawProperties {}
export default interface IDrawFeature
  extends Feature<Geometry, IDrawPropertiesWithType> {}
