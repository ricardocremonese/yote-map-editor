
import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, LayersControl, Polyline } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const { BaseLayer } = LayersControl;

export default function MapEditor() {
  const featureGroupRef = useRef(null);
  const [mapRef, setMapRef] = useState(null);
  const tileLayerRef = useRef(null);
  const labelLayerGroup = useRef(null);

  useEffect(() => {
    window.addEventListener('message', (event) => {
      const { type } = event.data;

      if (type === 'toggleBaseMap' && mapRef && tileLayerRef.current) {
        if (mapRef.hasLayer(tileLayerRef.current)) {
          mapRef.removeLayer(tileLayerRef.current);
        } else {
          tileLayerRef.current.addTo(mapRef);
        }
      }
    });
  }, [mapRef]);

  const createLabel = (latlng, text) => {
    const label = L.divIcon({
      className: 'map-label',
      html: `<div style="font-size:12px; font-weight:bold; background:white; padding:2px 4px; border-radius:4px; border:1px solid #ccc;">${text}</div>`,
    });
    return L.marker(latlng, { icon: label, interactive: false });
  };

  const handleCreated = (e) => {
    const layer = e.layer;
    const geojson = layer.toGeoJSON();

    if (geojson.geometry.type === "Polygon") {
      const areaM2 = turf.area(geojson);
      const areaHa = areaM2 / 10000;
      const areaAcres = (areaHa * 2.47105).toFixed(2);

      const center = turf.centerOfMass(geojson).geometry.coordinates;
      const labelText = prompt("Nome do bloco:", "Bloco A") || "Bloco";
      const latlng = [center[1], center[0]];

      const label = createLabel(latlng, `${labelText}<br>${areaAcres} ac`);
      label.addTo(labelLayerGroup.current);

      layer.setStyle({ color: "#4caf50", fillOpacity: 0.4, weight: 2 });
      layer.bindPopup(`
        <b>${labelText}</b><br>
        Área: ${areaAcres} acres<br>
        Coordenadas: ${latlng[0].toFixed(6)}, ${latlng[1].toFixed(6)}
      `);
    }

    if (geojson.geometry.type === "LineString") {
      const coords = geojson.geometry.coordinates;
      const middle = coords[Math.floor(coords.length / 2)];
      const labelText = prompt("Nome da linha:", "Dreno") || "Linha";
      const latlng = [middle[1], middle[0]];
      const label = createLabel(latlng, labelText);
      label.addTo(labelLayerGroup.current);

      layer.setStyle({ color: "#000000", weight: 5, dashArray: "5,5" });
      layer.bindPopup(`<b>${labelText}</b><br>Coordenadas: ${latlng[0].toFixed(6)}, ${latlng[1].toFixed(6)}`);
    }
  };

  const handleSearchLocation = () => {
    const input = document.getElementById("search-location").value;
    if (!input || !mapRef) return;

    if (input.includes(',')) {
      const [lat, lng] = input.split(',').map(Number);
      mapRef.setView([lat, lng], 18);
    } else {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=\${input}`)
        .then(res => res.json())
        .then(data => {
          if (data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            mapRef.setView([lat, lon], 18);
          } else {
            alert("Localização não encontrada.");
          }
        });
    }
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 9999, background: '#fff', padding: 10, borderRadius: 6, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
        <input id="search-location" type="text" placeholder="Endereço ou coordenadas" style={{ width: 220, marginRight: 6, padding: 4 }} />
        <button onClick={handleSearchLocation}>🔍 Ir</button>
      </div>

      <MapContainer
        center={[-23.5, -46.6]}
        zoom={17}
        maxZoom={22}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxNativeZoom: 19,
            maxZoom: 22
          });
          osm.addTo(map);
          tileLayerRef.current = osm;
          setMapRef(map);

          const labels = L.layerGroup().addTo(map);
          labelLayerGroup.current = labels;
        }}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="Mapa Padrão">
            <TileLayer
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              maxZoom={22}
            />
          </BaseLayer>
          <BaseLayer name="Satélite">
            <TileLayer
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
              polygon: {
                shapeOptions: { allowIntersection: false, showArea: true }
              },
              rectangle: true,
              polyline: {
                shapeOptions: {
                  color: "#000000",
                  weight: 5,
                  dashArray: "5,5"
                }
              },
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
