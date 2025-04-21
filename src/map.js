
import React, { useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';

export default function MapaBase() {
  const featureGroupRef = useRef(null);

  const handleCreated = (e) => {
    const layer = e.layer;
    const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
    const acres = area * 0.000247105;
    alert(`Área aproximada: ${acres.toFixed(2)} acres`);
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[-23.5, -46.6]}
        zoom={17}
        style={{ height: "100%", width: "100%" }}
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
