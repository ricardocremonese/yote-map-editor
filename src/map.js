
import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';

export default function MapaComReposicionamento() {
  const mapRef = useRef(null);
  const featureGroupRef = useRef(null);
  const [center, setCenter] = useState([-23.5, -46.6]); // Fallback inicial
  const [zoom, setZoom] = useState(17);

  // Atualiza centro dinamicamente via postMessage
  useEffect(() => {
    window.addEventListener("message", (event) => {
      if (event.data.type === "setFazendaLocalizacao") {
        const { latitude, longitude } = event.data;
        if (latitude && longitude) {
          setCenter([latitude, longitude]);
          setZoom(18);
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 18);
          }
        }
      }
    });
  }, []);

  const handleCreated = (e) => {
    const layer = e.layer;
    const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
    const acres = area * 0.000247105;
    alert(`Área aproximada: ${acres.toFixed(2)} acres`);
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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
            edit={{ edit: true, remove: true }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
