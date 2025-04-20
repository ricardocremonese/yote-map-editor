
import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, LayersControl } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import * as turf from '@turf/turf';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const { BaseLayer } = LayersControl;

export default function MapEditor() {
  const featureGroupRef = useRef(null);
  const [mapRef, setMapRef] = useState(null);
  const tileLayerRef = useRef(null);

  useEffect(() => {
    window.addEventListener("message", (event) => {
      const { type, color, label } = event.data;
      if (type === "applyColorToSelected" && color) {
        featureGroupRef.current?.eachLayer((layer) => {
          if (layer.options?.selected) {
            layer.setStyle({ color, fillOpacity: 0.4, weight: 2 });
          }
        });
      }
    });
  }, []);

  const handleCreated = (e) => {
    const layer = e.layer;
    const geojson = layer.toGeoJSON();

    if (geojson.geometry.type === "Polygon") {
      const areaM2 = turf.area(geojson);
      const areaHa = (areaM2 / 10000).toFixed(2);
      const areaAcres = (areaHa * 2.47105).toFixed(2);
      const perimeter = turf.length(geojson, { units: "kilometers" }).toFixed(2);
      const nome = prompt("Nome do bloco:", "Bloco A") || "Bloco";

      layer.setStyle({ color: "#4caf50", fillOpacity: 0.4, weight: 2 });
      layer.options.selected = false;

      const popupContent = document.createElement("div");
      popupContent.innerHTML = `
        <b>${nome}</b><br><br>
        <div id="form-bloco">
          <label>🌱 Plantado em:</label><br>
          <input type="date" id="plantio" /><br>
          <label>💧 Última aplicação:</label><br>
          <input type="date" id="aplicacao" /><br>
          <label>🚜 Próxima colheita:</label><br>
          <input type="date" id="colheita" /><br><br>
          <button id="confirmar">✅ Confirmar</button>
        </div>
        <div id="resumo" style="display:none"></div>
        <button id="editar" style="display:none; margin-top:5px;">✏️ Editar</button>
      `;

      const popup = L.popup().setContent(popupContent);
      layer.bindPopup(popup);

      layer.on("popupopen", () => {
        const form = popupContent.querySelector("#form-bloco");
        const resumo = popupContent.querySelector("#resumo");
        const editar = popupContent.querySelector("#editar");

        popupContent.querySelector("#confirmar").onclick = () => {
          const d1 = popupContent.querySelector("#plantio").value;
          const d2 = popupContent.querySelector("#aplicacao").value;
          const d3 = popupContent.querySelector("#colheita").value;
          resumo.innerHTML = `
            <b>${nome}</b><br>
            🌱 Plantio: ${d1}<br>
            💧 Aplicação: ${d2}<br>
            🚜 Colheita: ${d3}<br><br>
            📏 Perímetro: ${perimeter} km<br>
            📐 Área: ${areaHa} ha (${areaAcres} acres)
          `;
          form.style.display = "none";
          resumo.style.display = "block";
          editar.style.display = "block";
        };

        editar.onclick = () => {
          form.style.display = "block";
          resumo.style.display = "none";
          editar.style.display = "none";
        };
      });

      layer.on("click", () => {
        layer.options.selected = !layer.options.selected;
        layer.setStyle({
          ...layer.options,
          dashArray: layer.options.selected ? "4,4" : null,
          weight: layer.options.selected ? 4 : 2,
        });
      });
    }
  };

  return (
    <MapContainer
      center={[-23.5, -46.6]}
      zoom={17}
      maxZoom={22}
      style={{ height: "100vh", width: "100%" }}
      whenCreated={(map) => {
        const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxNativeZoom: 19,
          maxZoom: 22,
        });
        osm.addTo(map);
        tileLayerRef.current = osm;
        setMapRef(map);
      }}
    >
      <LayersControl position="topright">
        <BaseLayer checked name="Mapa Padrão">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={22} />
        </BaseLayer>
        <BaseLayer name="Satélite">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={22} />
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
