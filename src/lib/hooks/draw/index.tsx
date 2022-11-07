/* eslint-disable max-len */
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { v4 as uuidv4 } from 'uuid';
import { Feature, FeatureCollection } from 'geojson';
import type { GeoJSONSource, Map, PointLike } from 'mapbox-gl';
import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import drawFillLayer from './layers';
import IDrawFeature from './models';
import doesFeaturesHaveKinks from './utils/hasKinks';
import isAreaTooLarge from './utils/isAreaTooLarge';
import isOutsideArea from './utils/isOutsideArea';

interface Options {
  allowKinks?: boolean
  areaSize?: number
  allowOutsideArea?: [number, number, number, number]
  addFeature: (feature: Feature) => void,
  removeFeature: (feature: Feature) => void,
  updateFeature: (feature: Feature) => void,
  errorModal: (
    drawTool: MapboxDraw,
    hasKinks: boolean,
    tooBig: boolean,
    isOutside: boolean,
    hasNoCoords?: boolean,
    features?: Feature[]
  ) => void
  featureType?: string | number
}

type DrawMode = 'polygon' | 'rectangle' | 'circle' | 'edit' | 'delete' | null;

const useDraw = (
  map: Map,
  drawTool: MapboxDraw | undefined,
  draws: IDrawFeature[],
  options: Options,
) => {
  const defaultOptions: Options = {
    ...options,
    allowKinks: false,
    allowOutsideArea: undefined,
    featureType: 4,
    areaSize: 5000,
  };
  const [directSelection, setDirectSelection] = useState<Feature[] | null>(
    null,
  );
  const [originalSelection, setOriginalSelection] = useState<Feature[] | null>(
    null,
  );
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [mode, setMode] = useState<DrawMode>(null);
  const [isHoveringOverVertex, setIsHoveringOverVertex] = useState<boolean>(false);
  const [errors, setErrors] = useState<any[]>([]);
  const [polygonClicks, setPolygonClicks] = useState<number>(0);
  const directSelectionRef = useRef<Feature[] | null>(directSelection);
  const originalSelectionRef = useRef<Feature[] | null>(originalSelection);
  const isDrawingRef = useRef(isDrawing);
  const isHoveringOverVertexRef = useRef(isHoveringOverVertex);

  useEffect(() => {
    directSelectionRef.current = directSelection;
  }, [directSelection]);

  useEffect(() => {
    originalSelectionRef.current = originalSelection;
  }, [originalSelection]);

  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  useEffect(() => {
    isHoveringOverVertexRef.current = isHoveringOverVertex;
  }, [isHoveringOverVertex]);

  useEffect(() => {
    if (!drawTool || !map) return;

    try {
      const allBoundaries: FeatureCollection = {
        features: draws,
        type: 'FeatureCollection' as const,
      };

      try {
        if (!map) return;

        (map.getSource(drawFillLayer.id) as GeoJSONSource).setData(
          allBoundaries,
        );
      } catch (err) {
        setErrors((prevErr) => [err, ...prevErr]);
      }
    } catch (err) {
      setErrors((prevErr) => [err, ...prevErr]);
    }
  }, [draws, drawTool, map]);

  useEffect(() => {
    if (drawTool) {
      if (drawTool.getMode() === 'simple_select') {
        setIsDrawing(false);
      }
    }
  }, [drawTool]);

  const onDrawCreate = useCallback(
    (e: { features: Feature[] }) => {
      if (!map || !drawTool) return;

      const tooBig = isAreaTooLarge(e.features, defaultOptions.areaSize);
      const hasKinks = doesFeaturesHaveKinks(e.features);
      const isOutside = e.features.some((f) => isOutsideArea(f.geometry, options?.allowOutsideArea));
      const ids: string[] = [];

      e.features.forEach((f) => {
        if (f.id) {
          const id = String(f.id);

          ids.push(id);
        }
      });

      drawTool.trash();
      setIsDrawing(false);

      // TODO: Need to display a message saying the area is too big or has kinks
      if (!tooBig && !hasKinks && !isOutside && drawTool) {
        // Hacky solution to autocomplete
        setTimeout(() => {
          e.features.forEach((f) => {
            const id = uuidv4();
            const drawFeature: IDrawFeature = {
              ...f,
              // Mapbox allows for ids to be integers or strings that can be parsed as an integer
              id,
              properties: {
                type: defaultOptions.featureType,
              },
            };

            defaultOptions.addFeature(drawFeature);
            drawTool.add(drawFeature); // Adds back to draw tool for customizability
          });
        }, 10);
      } else {
        defaultOptions.errorModal(
          drawTool,
          hasKinks,
          tooBig,
          isOutside,
          undefined,
          e.features,
        );
      }
    },
    [drawTool, map],
  );

  const onDrawSelectionChange = useCallback(
    (e: { features: any[] }) => {
      const drawMode = drawTool?.getMode();
      const inDrawingMode = drawMode === ('draw_polygon' as any)
        || drawMode === ('draw_circle' as any)
        || drawMode === ('draw_rectangle' as any);

      const isInDrawMode = !!e.features.length || inDrawingMode;

      if (e.features.length && drawMode === 'simple_select') {
        setMode('delete');
      }

      if (e.features.length === 0) {
        setOriginalSelection(null);
      } else if (e.features.length > 0 && !originalSelectionRef.current) {
        setOriginalSelection(e.features);
      }

      setIsDrawing(isInDrawMode);

      switch (drawMode) {
        case 'direct_select': {
          setDirectSelection(e.features);
          break;
        }
        default: {
          setDirectSelection(null);
          break;
        }
      }
    },
    [drawTool],
  );

  const onDrawDelete = useCallback(
    (e: { features: Feature[] }) => {
      if (drawTool) {
        const l = drawTool.getAll().features.length;

        setIsDrawing(!l);
      }

      setIsDrawing(false);
      setOriginalSelection(null);

      e.features.forEach((f) => {
        if (f.id) {
          defaultOptions.removeFeature(f);
        }
      });
    },
    [drawTool],
  );

  // When the draw feature updates the geometry
  const onDrawUpdate = useCallback(
    (e: { features: Feature[] }) => {
      if (!drawTool) return;

      const hasKinks = doesFeaturesHaveKinks(e.features);
      const tooBig = isAreaTooLarge(e.features, defaultOptions.areaSize);
      const isOutside = e.features.some((f) => isOutsideArea(f.geometry, defaultOptions.allowOutsideArea));
      // Prevent having lines
      const hasNoCoords = e.features.some((f) => {
        if (
          f.geometry.type === 'Polygon'
          || f.geometry.type === 'MultiPolygon'
        ) {
          return f.geometry.coordinates.length === 0;
        }

        return true;
      });

      if (hasKinks || hasNoCoords || tooBig || isOutside) {
        defaultOptions.errorModal(
          drawTool,
          hasKinks,
          tooBig,
          isOutside,
          hasNoCoords,
          e.features,
        );

        if (directSelectionRef.current) {
          directSelectionRef.current.forEach((f) => {
            drawTool.add(f);
          });
        }

        setDirectSelection(null);
        drawTool.changeMode('simple_select');
        setMode(null);
        setIsDrawing(false);
      } else {
        setDirectSelection(e.features);

        const { features } = drawTool.getAll();

        features.forEach((f) => {
          if (f.id) {
            const id = String(f.id);
            const drawFeature: IDrawFeature = {
              ...f,
              id,
              properties: {
                type: defaultOptions.featureType,
              },
            };
            defaultOptions.updateFeature(drawFeature);
          }
        });
      }
    },
    [drawTool],
  );

  const onMapClick = useCallback(() => {
    if (isDrawingRef.current) {
      setPolygonClicks(polygonClicks + 1);
    }
  }, []);

  const onMapMove = useCallback(
    (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
      if (!map || !isDrawingRef.current) {
        if (isHoveringOverVertexRef.current) {
          setIsHoveringOverVertex(false);
        }

        return;
      }

      const rad = 16;
      const bbox: [PointLike, PointLike] = [
        [e.point.x - rad, e.point.y - rad],
        [e.point.x + rad, e.point.y + rad],
      ];

      const res = map.queryRenderedFeatures(bbox, {
        layers: ['gl-draw-polygon-and-line-vertex-inactive.hot'],
      });

      if (isHoveringOverVertexRef.current !== !!res.length) {
        setIsHoveringOverVertex(!!res.length);
      }
    },
    [map],
  );

  const onDrawModeChange = useCallback(() => {
    setDirectSelection(null);

    if (!drawTool) return;

    if (drawTool.getMode() === 'direct_select') {
      setMode('edit');
    }

    const { features } = drawTool.getAll();

    features.forEach((f) => {
      if (f.id) {
        const id = String(f.id);
        const drawFeature: IDrawFeature = {
          ...f,
          id,
          properties: {
            type: defaultOptions.featureType,
          },
        };
        defaultOptions.updateFeature(drawFeature);
      }
    });
  }, [drawTool]);

  // Will cancel the current selection and update selection to original before any modifications
  const undoDraw = useCallback(() => {
    if (!drawTool) return;

    if (originalSelectionRef.current) {
      // Deletes the current feature and re-adds original drawing to draw tool
      const ids: string[] = [];
      originalSelectionRef.current.forEach((f) => {
        if (f.id) {
          const id = String(f.id);

          ids.push(id);
        }
      });

      drawTool.delete(ids);

      originalSelectionRef.current.forEach((f) => {
        drawTool.add(f);
      });

      // Updates boundaries with original selection
      const { features } = drawTool.getAll();

      features.forEach((f) => {
        if (f.id) {
          const id = String(f.id);
          const drawFeature: IDrawFeature = {
            ...f,
            id,
            properties: {
              type: defaultOptions.featureType,
            },
          };
          defaultOptions.updateFeature(drawFeature);
        }
      });
    }

    setOriginalSelection(null);
    setIsDrawing(false);
  }, [drawTool]);

  const onWindowKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!drawTool) return;

      switch (e.key) {
        // Will cancel the current selection
        case 'Escape': {
          undoDraw();

          break;
        }
        // Will add the selection
        case 'Enter': {
          const { features } = drawTool.getAll();

          features.forEach((f) => {
            if (f.id) {
              const id = String(f.id);
              const drawFeature: IDrawFeature = {
                ...f,
                id,
                properties: {
                  type: defaultOptions.featureType,
                },
              };
              defaultOptions.updateFeature(drawFeature);
            }
          });
          drawTool.changeMode('simple_select');
          setMode(null);
          setIsDrawing(false);
          break;
        }
        default:
          break;
      }
    },
    [drawTool, undoDraw],
  );

  useEffect(() => {
    if (!map || !drawTool) return () => {};

    map
      .on('draw.create', onDrawCreate)
      .on('draw.selectionchange', onDrawSelectionChange)
      .on('draw.update', onDrawUpdate)
      .on('draw.modechange', onDrawModeChange)
      .on('draw.delete', onDrawDelete)
      .on('click', onMapClick)
      .on('mousemove', onMapMove);

    window.addEventListener('keydown', onWindowKeyDown, false);

    return () => {
      map
        .off('draw.create', onDrawCreate)
        .off('draw.selectionchange', onDrawSelectionChange)
        .off('draw.update', onDrawUpdate)
        .off('draw.modechange', onDrawModeChange)
        .off('draw.delete', onDrawDelete)
        .off('click', onMapClick)
        .off('mousemove', onMapMove);

      window.removeEventListener('keydown', onWindowKeyDown, false);
    };
  }, [
    map,
    drawTool,
    onDrawCreate,
    onDrawSelectionChange,
    onDrawUpdate,
    onDrawModeChange,
    onDrawDelete,
    onMapClick,
    onMapMove,
    onWindowKeyDown,
  ]);

  return {
    mode,
    isDrawing: isDrawingRef,
    draws,
    errors,
    directSelection: directSelectionRef,
    originalSelection: originalSelectionRef,
    isHoveringOverVertex: isHoveringOverVertexRef,
    polygonClicks,
  };
};

export default useDraw;
