
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import { supabase } from './supabaseClient';

export default function MapaDinamico() {
  const featureGroupRef = useRef(null);
  const [center, setCenter] = useState([-23.5, -46.6]); // fallback inicial (SP)
  const [zoom, setZoom] = useState(17);

  useEffect(() => {
    const fetchFazenda = async () => {
      const params = new URLSearchParams(window.location.search);
      const fazendaId = params.get('fazenda');
      if (!fazendaId) return;

      const { data, error } = await supabase
        .from('fazendas')
        .select('latitude, longitude')
        .eq('uuid', fazendaId)
        .single();

      if (data && data.latitude && data.longitude) {
        setCenter([data.latitude, data.longitude]);
        setZoom(18);
      }
    };

    fetchFazenda();
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
