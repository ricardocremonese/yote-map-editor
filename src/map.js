
import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, LayersControl, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import * as turf from '@turf/turf';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const { BaseLayer } = LayersControl;

export default function MapEditor() {
  const featureGroupRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [mapRef, setMapRef] = useState(null);
  const tileLayerRef = useRef(null);

  useEffect(() => {
    window.addEventListener("message", (event) => {
      const { type, color } = event.data;
      if (type === "applyColorToSelected" && color) {
        featureGroupRef.current?.eachLayer((layer) => {
          if (layer.options?.selected) {
            layer.setStyle({ color, fillOpacity: 0.6, weight: 2 });
          }
        });
      }
    });
  }, []);

  const gerarPDF = async () => {
    if (!mapRef || !tileLayerRef.current) return;

    mapRef.removeLayer(tileLayerRef.current);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mapCanvas = mapContainerRef.current;
    html2canvas(mapCanvas, { useCORS: true }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0);
      pdf.save("mapa.pdf");

      tileLayerRef.current.addTo(mapRef);
    });
  };

  const handleCreated = (e) => {
    const layer = e.layer;
    const geojson = layer.toGeoJSON();
    if (geojson.geometry.type === "Polygon") {
      const areaM2 = turf.area(geojson);
      const areaHa = (areaM2 / 10000).toFixed(2);
      const areaAcres = (areaHa * 2.47105).toFixed(2);
      const perimeter = turf.length(geojson, { units: "kilometers" }).toFixed(2);
      const nome = prompt("Nome do bloco:", "Bloco A") || "Bloco";

      layer.setStyle({ color: "#4caf50", fillOpacity: 0.6, weight: 2 });
      layer.bindPopup(
        `<b>\${nome}</b><br>
        🌱 Plantio: <input type="date"><br>
        💧 Aplicação: <input type="date"><br>
        🚜 Colheita: <input type="date"><br><br>
        📏 Perímetro: \${perimeter} km<br>
        📐 Área: \${areaHa} ha (\${areaAcres} acres)`
      );

      layer.on("click", () => {
        layer.options.selected = !layer.options.selected;
        layer.setStyle({
          ...layer.options,
          dashArray: layer.options.selected ? "4,4" : null,
          weight: layer.options.selected ? 4 : 2
        });
      });
    }
  };

  return (
    <div ref={mapContainerRef}>
      <button
        onClick={gerarPDF}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 9999,
          background: "#007BFF",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 6,
          border: "none"
        }}
      >
        📄 Gerar PDF
      </button>

      <MapContainer
        center={[-23.5, -46.6]}
        zoom={17}
        maxZoom={22}
        style={{ height: "100vh", width: "100%" }}
        whenCreated={(map) => {
          const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxNativeZoom: 19,
            maxZoom: 22
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
    </div>
  );
}
