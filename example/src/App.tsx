import { useState } from "react";
import Mapbox from "./components/mapbox";
import { useMap } from "./providers/mapbox-provider";
import useDraw from "acres-mapbox-drawing";
import { Feature } from "geojson";
import zoomToBounds from "acres-mapbox-utils/dist/mapbox/zoomToBounds";

const removeFeature = (features: Feature[], id: string) => {
  const newFeatures: Feature[] = [];

  features.forEach((v) => {
    if (v.id !== id) newFeatures.push(v);
  });

  return newFeatures;
};

const updateFeature = (features: Feature[], id: string, f: Feature) => {
  const newFeatures: Feature[] = [];

  features.forEach((v) => {
    if (v.id !== id) {
      newFeatures.push(v);
    } else {
      v = f;
      newFeatures.push(v);
    }
  });

  return newFeatures;
};

export default function App() {
  const { map } = useMap();
  const [drawings, setDrawings] = useState<Feature[]>([]);
  const { isDrawing, label, drawTool } = useDraw(map!, drawings as any, {
    addFeature: (f) => setDrawings((prevState) => [...prevState, f]),
    removeFeature: (f) =>
      setDrawings((prevState) => removeFeature(prevState, f.id as string)),
    updateFeature: (f) =>
      setDrawings((prevState) => updateFeature(prevState, f.id as string, f)),
    errorModal(drawTool, hasKinks, tooBig, isOutside, hasNoCoords, features) {
      console.log({
        drawTool,
        hasKinks,
        tooBig,
        isOutside,
        hasNoCoords,
        features,
      });
    },
    areaSize: 100000000,
  });

  return (
    <div className="App">
      <div
        style={{
          backgroundColor: "gray",
          position: "absolute",
          bottom: 10,
          left: 10,
          zIndex: 999,
          padding: "12px",
          color: "white",
          minWidth: "40px",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {label && <p>{label}</p>}
        <button
          style={{
            height: '50px'
          }}
          onClick={() => {
            if (drawTool) {
              drawTool.changeMode("draw_circle" as any);
            }
          }}
        >
          Draw Circle
        </button>
        <h2>Drawings</h2>
        {drawings.map((v) => (
          <button onClick={() => zoomToBounds(map!, v.geometry)} key={v.id}>
            <p>{v.id}</p>
          </button>
        ))}
        {isDrawing && <p>Currently Drawing</p>}
      </div>
      <Mapbox />
    </div>
  );
}
