import MapboxDraw from "@mapbox/mapbox-gl-draw";
import type { Map } from "mapbox-gl";
import React, { createContext, useContext, useState } from "react";

interface Context {
    map: Map | null
    setMap: (map: Map) => void
    drawTool: MapboxDraw | null
    setDrawTool: (drawTool: MapboxDraw) => void
}

const mapboxContext = createContext<Context>({
  map: null,
  setMap: (map: Map) => { },
  drawTool: null,
  setDrawTool: (drawTool: MapboxDraw) => {}
});

export function MapboxProvider({ children }: any) {
  const [map, setMap] = useState<Map | null>(null);
  const [drawTool, setDrawTool] = useState<MapboxDraw | null>(null);

  return (
    <mapboxContext.Provider
      value={{
        map,
        setMap,
        drawTool,
        setDrawTool
      }}
    >
      {children}
    </mapboxContext.Provider>
  );
}

export const useMap = () => useContext(mapboxContext);
