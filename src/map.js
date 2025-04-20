
import React, { useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import * as turf from '@turf/turf';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const colorOptions = {
  "Verde": "#4CAF50",
  "Amarelo": "#FFEB3B",
  "Vermelho": "#F44336",
  "Laranja": "#FF9800",
  "Roxo": "#9C27B0",
  "Branco": "#FFFFFF",
  "Azul": "#2196F3",
  "Rosa": "#E91E63",
  "Turquesa": "#00BCD4"
};

function LegendIfPDF() {
  const map = useMap();

  React.useEffect(() => {
    const showLegend = window.location.search.includes("pdf");

    if (!showLegend) return;

    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      div.style.background = "#fff";
      div.style.padding = "10px";
      div.style.border = "1px solid #ccc";
      div.style.fontSize = "12px";
      div.innerHTML += "<strong>Legenda</strong><br>";
      Object.entries(colorOptions).forEach(([name, hex]) => {
        div.innerHTML += `<i style="background:${hex}; width:12px; height:12px; display:inline-block; margin-right:5px;"></i> ${name}<br>`;
      });
      return div;
    };
    legend.addTo(map);
  }, [map]);

  return null;
}

export default function MapEditor() {
  const featureGroupRef = useRef(null);

  const handleCreated = (e) => {
    const layer = e.layer;
    const geojson = layer.toGeoJSON();

    const areaM2 = turf.area(geojson);
    const areaHa = (areaM2 / 10000).toFixed(2);
    const areaAcres = (areaHa * 2.47105).toFixed(2);

    const nomeBloco = prompt("Nome do bloco:", "Bloco A") || "Bloco sem nome";
    const colorName = prompt("Cor (Verde, Amarelo, etc):", "Verde") || "Verde";
    const color = colorOptions[colorName] || "#3388ff";

    layer.setStyle({ color, fillOpacity: 0.4, weight: 2 });
    layer.bindPopup(`<b>${nomeBloco}</b><br>📏 ${areaHa} ha (${areaAcres} acres)`).openPopup();

    layer.feature = {
      type: "Feature",
      properties: {
        nome: nomeBloco,
        color,
        areaHa,
        areaAcres
      },
      geometry: geojson.geometry
    };
  };

  return (
    <MapContainer
      center={[-23.5, -46.6]}
      zoom={17}
      maxZoom={22}
      style={{ height: '100vh' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <LegendIfPDF />
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
