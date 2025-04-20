
import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import * as turf from '@turf/turf';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

function LayersControl() {
  const map = useMap();

  const baseLayers = {
    "Mapa Padrão": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
    "Satélite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')
  };

  L.control.layers(baseLayers).addTo(map);
  baseLayers["Mapa Padrão"].addTo(map);

  useEffect(() => {
    map.on("click", function (e) {
      const { lat, lng } = e.latlng;
      L.popup()
        .setLatLng([lat, lng])
        .setContent(`📍 Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`)
        .openOn(map);
    });
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
    const color = prompt("Cor do bloco (ex: #ff0000):", "#3388ff") || "#3388ff";

    layer.setStyle({ color });

    layer.bindPopup(`<b>${nomeBloco}</b><br>📏 ${areaHa} ha (${areaAcres} acres)`).openPopup();

    // Salvar nos properties do GeoJSON (para uso futuro com Supabase)
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
    <MapContainer center={[-23.5, -46.6]} zoom={17} maxZoom={22} style={{ height: '100vh' }}>
      <LayersControl />
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
