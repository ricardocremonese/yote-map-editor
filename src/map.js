
import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, LayersControl, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import * as turf from '@turf/turf';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const { BaseLayer } = LayersControl;

const colorOptions = {
  "vermelho": "#f44336",
  "rosa": "#e91e63",
  "roxo": "#9c27b0",
  "roxoEscuro": "#673ab7",
  "azulEscuro": "#3f51b5",
  "azul": "#2196f3",
  "azulClaro": "#03a9f4",
  "turquesa": "#00bcd4",
  "verde": "#4caf50",
  "verdeClaro": "#8bc34a",
  "lima": "#cddc39",
  "amareloClaro": "#ffeb3b",
  "amarelo": "#ffc107",
  "laranja": "#ff9800",
  "laranjaEscuro": "#ff5722",
  "marrom": "#795548",
  "cinza": "#9e9e9e",
  "cinzaClaro": "#cfd8dc",
  "bege": "#d7ccc8"
};

export default function MapEditor() {
  const featureGroupRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      const { type, color, label } = event.data;
      if (type === "applyColorToSelected" && color) {
        const layerGroup = featureGroupRef.current;
        if (!layerGroup) return;

        layerGroup.eachLayer(layer => {
          if (layer.options && layer.options.selected) {
            layer.setStyle({ color, fillOpacity: 0.4 });
            if (label) {
              layer.bindPopup(`<b>${label}</b>`).openPopup();
            }
          }
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleCreated = (e) => {
    const layer = e.layer;
    const geojson = layer.toGeoJSON();
    const areaM2 = turf.area(geojson);
    const areaHa = (areaM2 / 10000).toFixed(2);
    const areaAcres = (areaHa * 2.47105).toFixed(2);
    const color = "#4caf50";

    layer.setStyle({ color, fillOpacity: 0.4 });
    layer.options.selected = false;
    layer.bindPopup(`📏 ${areaHa} ha (${areaAcres} acres)`).openPopup();

    layer.on("click", function () {
      layer.options.selected = !layer.options.selected;
      layer.setStyle({
        ...layer.options,
        weight: layer.options.selected ? 4 : 2,
        dashArray: layer.options.selected ? "5,5" : null
      });
    });
  };

  return (
    <MapContainer center={[-23.5, -46.6]} zoom={17} maxZoom={22} style={{ height: '100vh' }}>
      <LayersControl position="topright">
        <BaseLayer checked name="Mapa Padrão">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            tileSize={256}
            maxNativeZoom={19}
            maxZoom={22}
          />
        </BaseLayer>
        <BaseLayer name="Satélite">
          <TileLayer
            attribution='Tiles &copy; Esri'
            url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            maxZoom={22}
          />
        </BaseLayer>
      </LayersControl>

      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position="topright"
          onCreated={handleCreated}
          draw={{
            polygon: true,
            rectangle: true,
            polyline: false,
            circle: false,
            marker: false,
            circlemarker: false,
          }}
          edit={{
            edit: true,
            remove: true,
          }}
        />
      </FeatureGroup>
    </MapContainer>
  );
}
