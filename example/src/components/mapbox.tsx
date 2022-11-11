import mapboxgl, { Map } from "mapbox-gl";
import { useRef, useEffect, useCallback } from "react";
import { useMap } from "../providers/mapbox-provider";

const accessToken =
  "";

const Mapbox = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);
  const { setMap } = useMap();

  const setupMap = useCallback(() => {
    if (map.current) return;
    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current || '', // container ID
      style: "mapbox://styles/mapbox/streets-v11", // style URL
      center: [-74.5, 40], // starting position [lng, lat]
      zoom: 9, // starting zoom
    });
  }, []);

  useEffect(() => {
    if (!map.current) return;

    setMap(map.current);
  }, [map, setMap]);

  useEffect(() => {
    setupMap();
  }, [setupMap]);

  return <div ref={mapContainer} className="map-container" />;
};

export default Mapbox;
