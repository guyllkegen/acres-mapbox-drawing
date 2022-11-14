import {
  useRef, useState, useEffect, useCallback,
} from 'react';
/* eslint-disable max-len */
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Feature } from 'geojson';
import type { Map, PointLike } from 'mapbox-gl';
import { v4 as uuidv4 } from 'uuid';

import addLayers from 'acres-mapbox-utils/dist/mapbox/addLayers';
import IDrawFeature from './models';
import drawFillLayer from './layers';
import isAreaTooLarge from './utils/isAreaTooLarge';
import doesFeaturesHaveKinks from './utils/hasKinks';
import isOutsideArea from './utils/isOutsideArea';
import {
  CircleMode, DrawPolygon, DrawRectangleDrag, ExtendDrawBar,
} from './modes';
import getMapboxDrawStyles from './styles';

interface Options {
  allowKinks?: boolean
  areaSize?: number
  allowOutsideArea?: [number, number, number, number]
  addFeature: (feature: Feature) => void,
  removeFeature: (feature: Feature) => void,
  updateFeature: (feature: Feature) => void,
  errorModal: (
    drawTool: MapboxDraw | null,
    hasKinks: boolean,
    tooBig: boolean,
    isOutside: boolean,
    hasNoCoords?: boolean,
    features?: Feature[]
  ) => void
  featureType?: string | number
  customMessage?: {
    start?: string
    close?: string
    rectangle?: string
    circle?: string
    edit?: string
    delete?: string
    empty?: string | null
  }
}

export type Mode = 'polygon' | 'rectangle' | 'circle' | 'edit' | 'delete' | null;

export type DrawMode = 'draw_circle' | 'draw_polygon' | 'draw_rectangle' | 'static' | 'simple_select' | 'draw_line_string' | 'draw_point' | 'direct_select' | string;

const useDraw = (
  map: Map | null | undefined,
  draws: Feature[],
  options: Options,
) => {
  const defaultOptions: Options = {
    allowKinks: false,
    allowOutsideArea: undefined,
    featureType: 4,
    areaSize: 5000,
    customMessage: {
      start: options.customMessage?.start || 'Select a starting point',
      close: options.customMessage?.close || 'Press enter to close shape',
      rectangle: options.customMessage?.rectangle || 'Click and drag to draw a rectangle',
      circle: options.customMessage?.circle || 'Click and drag to draw a pivot',
      edit: options.customMessage?.edit || 'Press enter to finish editing',
      delete: options.customMessage?.delete || 'Press delete to remove shape',
      empty: options.customMessage?.empty || null,
    },
    ...options,
  };

  const [directSelection, setDirectSelection] = useState<Feature[] | null>(
    null,
  );
  const [originalSelection, setOriginalSelection] = useState<Feature[] | null>(
    null,
  );
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>('simple_select');
  const [isHoveringOverVertex, setIsHoveringOverVertex] = useState<boolean>(false);
  const [errors, setErrors] = useState<any[]>([]);
  const [polygonClicks, setPolygonClicks] = useState<number>(0);
  const [label, setLabel] = useState<string | null | undefined>(null);
  const directSelectionRef = useRef<Feature[] | null>(directSelection);
  const originalSelectionRef = useRef<Feature[] | null>(originalSelection);
  const isDrawingRef = useRef(isDrawing);
  const isHoveringOverVertexRef = useRef(isHoveringOverVertex);
  const [drawToolState, setDrawTool] = useState<MapboxDraw | null>(null);
  const drawTool = useRef<MapboxDraw | null>(null);

  useEffect(() => {
    if (!map) return;

    addLayers(map, [drawFillLayer]);
  }, [map]);

  useEffect(() => {
    if (!drawTool.current) return;

    drawTool.current.changeMode(drawMode);
  }, [drawMode, drawTool]);

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
    try {
      if (!map) return;
      draws.forEach((f) => {
        if (!drawTool.current) return;

        drawTool.current.add(f);
      });
    } catch (err) {
      setErrors((prevErr) => [err, ...prevErr]);
    }
  }, [draws, drawTool, map]);

  useEffect(() => {
    if (!map) return;

    drawTool.current = new MapboxDraw({
      clickBuffer: 16,
      controls: {
        combine_features: true,
        polygon: true,
        trash: true,
      },
      modes: {
        ...MapboxDraw.modes,
        draw_circle: CircleMode,
        draw_polygon: DrawPolygon,
        draw_rectangle: DrawRectangleDrag as any,
      },
      styles: getMapboxDrawStyles(),
      userProperties: true,
    });

    setDrawTool(drawTool.current);
  }, [map]);

  useEffect(() => {
    if (!map || !drawTool.current) return;

    function save() {
      if (!drawTool.current) return;
      drawTool.current.changeMode('draw_circle');
    }

    const drawBar = new ExtendDrawBar({
      draw: drawTool.current,
      buttons: [{
        on: 'click',
        action: save,
        classes: [
          'mapbox-gl-draw_circle',
        ],
        content: '<span>⭕</span>',
      }],
    });

    map.on('load', () => {
      map.addControl(drawBar, 'top-left');
    });
  }, [map, drawTool]);

  const getDrawTooltipLabel = useCallback(() => {
    if (!isDrawing) {
      setLabel(defaultOptions.customMessage!.empty);
      return;
    }

    if (
      isHoveringOverVertex
      && polygonClicks > 2
      && mode === 'polygon'
    ) {
      setLabel(defaultOptions.customMessage!.close);
    }

    switch (mode) {
      case 'polygon': {
        if (polygonClicks === 0) {
          setLabel(defaultOptions.customMessage!.start);
          break;
        }

        if (polygonClicks > 2) {
          setLabel(defaultOptions.customMessage!.close);
          break;
        }
        setLabel(defaultOptions.customMessage!.empty);
        break;
      }
      case 'rectangle': {
        setLabel(defaultOptions.customMessage!.rectangle);
        break;
      }
      case 'circle': {
        setLabel(defaultOptions.customMessage!.circle);
        break;
      }
      case 'edit': {
        setLabel(defaultOptions.customMessage!.edit);
        break;
      }
      case 'delete': {
        setLabel(defaultOptions.customMessage!.delete);
        break;
      }
      default: {
        setLabel(defaultOptions.customMessage!.empty);
        break;
      }
    }
  }, [mode, isHoveringOverVertex, polygonClicks, isDrawing]);

  useEffect(() => {
    getDrawTooltipLabel();
  }, [getDrawTooltipLabel]);

  const onDrawCreate = useCallback(
    (e: { features: Feature[] }) => {
      if (!map || !drawTool.current) return;

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

      drawTool.current.trash();
      setIsDrawing(false);

      // TODO: Need to display a message saying the area is too big or has kinks
      if (!tooBig && !hasKinks && !isOutside && drawTool) {
        // Hacky solution to autocomplete
        setTimeout(() => {
          e.features.forEach((f) => {
            if (!drawTool.current) return;
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
            drawTool.current.add(drawFeature); // Adds back to draw tool for customizability
          });
        }, 10);
      } else {
        defaultOptions.errorModal(
          drawTool.current,
          hasKinks,
          tooBig,
          isOutside,
          undefined,
          e.features,
        );
      }
      setPolygonClicks(0);
    },
    [drawTool, map],
  );

  const onDrawSelectionChange = useCallback(
    (e: { features: any[] }) => {
      if (!drawTool.current) return;
      const dMode = drawTool.current.getMode();
      const inDrawingMode = dMode === ('draw_polygon' as any)
        || dMode === ('draw_circle' as any)
        || dMode === ('draw_rectangle' as any);

      const isInDrawMode = !!e.features.length || inDrawingMode;

      if (e.features.length && dMode === 'simple_select') {
        setMode('delete');
      }

      if (e.features.length === 0) {
        setOriginalSelection(null);
      } else if (e.features.length > 0 && !originalSelectionRef.current) {
        setOriginalSelection(e.features);
      }

      setIsDrawing(isInDrawMode);

      switch (dMode) {
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
      if (drawTool.current) {
        const l = drawTool.current.getAll().features.length;

        setIsDrawing(!l);
      }

      setIsDrawing(false);
      setOriginalSelection(null);

      e.features.forEach((f) => {
        if (f.id) {
          defaultOptions.removeFeature(f);
        }
      });
      setPolygonClicks(0);
      setLabel(defaultOptions.customMessage!.empty);
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
        if (!drawTool.current) return;
        defaultOptions.errorModal(
          drawTool.current,
          hasKinks,
          tooBig,
          isOutside,
          hasNoCoords,
          e.features,
        );

        if (directSelectionRef.current) {
          directSelectionRef.current.forEach((f) => {
            if (!drawTool.current) return;
            drawTool.current.add(f);
          });
        }

        setDirectSelection(null);
        drawTool.current.changeMode('simple_select');
        setMode(null);
        setIsDrawing(false);
      } else {
        if (!drawTool.current) return;
        setDirectSelection(e.features);

        const { features } = drawTool.current.getAll();

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
      setPolygonClicks((prevState) => prevState + 1);
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

      if (res.length) {
        setIsHoveringOverVertex(false);
      } else {
        setIsHoveringOverVertex(true);
      }
    },
    [map],
  );

  const onDrawModeChange = useCallback(() => {
    setDirectSelection(null);

    if (!drawTool.current) return;

    if (drawTool.current.getMode() === 'draw_polygon') {
      setMode('polygon');
    }

    if (drawTool.current.getMode() === 'draw_rectangle') {
      setMode('rectangle');
    }

    if (drawTool.current.getMode() === 'draw_circle') {
      setMode('circle');
    }

    if (drawTool.current.getMode().includes('draw')) {
      setIsDrawing(true);
    } else {
      setIsDrawing(false);
    }

    if (drawTool.current.getMode() === 'direct_select') {
      setMode('edit');
    }

    setDrawMode(drawTool.current.getMode());

    const { features } = drawTool.current.getAll();

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
    if (!drawTool.current) return;

    if (originalSelectionRef.current) {
      // Deletes the current feature and re-adds original drawing to draw tool
      const ids: string[] = [];
      originalSelectionRef.current.forEach((f) => {
        if (f.id) {
          const id = String(f.id);

          ids.push(id);
        }
      });

      drawTool.current.delete(ids);

      originalSelectionRef.current.forEach((f) => {
        if (!drawTool.current) return;
        drawTool.current.add(f);
      });

      // Updates boundaries with original selection
      const { features } = drawTool.current.getAll();

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
    setMode(null);
    setLabel(defaultOptions.customMessage!.empty);
    setPolygonClicks(0);
  }, [drawTool]);

  const onWindowKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!drawTool.current) return;

      switch (e.key) {
        // Will cancel the current selection
        case 'Escape': {
          undoDraw();

          break;
        }
        // Will add the selection
        case 'Enter': {
          const { features } = drawTool.current.getAll();

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
          drawTool.current.changeMode('simple_select');
          setMode(null);
          setIsDrawing(false);
          setLabel(defaultOptions.customMessage!.empty);
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
    isDrawing: isDrawingRef.current,
    draws,
    errors,
    directSelection: directSelectionRef.current,
    originalSelection: originalSelectionRef.current,
    isHoveringOverVertex: isHoveringOverVertexRef.current,
    polygonClicks,
    label,
    drawTool: drawToolState,
    drawMode,
    setDrawMode,
  };
};

export default useDraw;
