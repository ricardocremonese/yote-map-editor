
import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, LayersControl, useMap } from 'react-leaflet';
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
      const { type, color, label } = event.data;
      if (type === 'applyColorToSelected' && color) {
        featureGroupRef.current?.eachLayer(layer => {
          if (layer.options?.selected) {
            layer.setStyle({ color, fillOpacity: 0.4, weight: 2 });
            if (label && layer.options.centerLatLng) {
              const labelMarker = createLabel(layer.options.centerLatLng, label);
              labelMarker.addTo(labelLayerGroup.current);
            }
          }
        });
      }
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
      html: `<div style="font-size:12px;font-weight:bold;background:white;padding:2px 4px;border-radius:4px;border:1px solid #ccc;">${text}</div>`,
    });
    return L.marker(latlng, { icon: label, interactive: false });
  };

  const handleCreated = (e) => {
    const layer = e.layer;
    const geojson = layer.toGeoJSON();
    const areaM2 = turf.area(geojson);
    const areaAcres = (areaM2 / 4046.86).toFixed(2);
    const center = turf.centerOfMass(geojson).geometry.coordinates;
    const labelText = prompt("Nome do bloco:", "Bloco A") || "Bloco";
    const latlng = [center[1], center[0]];

    const label = createLabel(latlng, `${labelText}<br>${areaAcres} ac`);
    label.addTo(labelLayerGroup.current);

    layer.setStyle({ color: "#4caf50", fillOpacity: 0.4, weight: 2 });
    layer.options.centerLatLng = latlng;
    layer.options.selected = false;

    layer.bindPopup(`<b>${labelText}</b><br>Área: ${areaAcres} acres<br>Lat: ${latlng[0].toFixed(6)}, Lng: ${latlng[1].toFixed(6)}`);

    layer.on("click", () => {
      layer.options.selected = !layer.options.selected;
      layer.setStyle({
        ...layer.options,
        dashArray: layer.options.selected ? "4,4" : null,
        weight: layer.options.selected ? 4 : 2
      });
    });
  };

  const handleSearch = () => {
    const query = document.getElementById("search-location").value;
    if (!query || !mapRef) return;
    if (query.includes(",")) {
      const [lat, lng] = query.split(',').map(Number);
      mapRef.setView([lat, lng], 18);
    } else {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
        .then(res => res.json())
        .then(data => {
          if (data?.length > 0) {
            const { lat, lon } = data[0];
            mapRef.setView([parseFloat(lat), parseFloat(lon)], 18);
          } else {
            alert("Endereço não encontrado.");
          }
        });
    }
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 9999, background: '#fff', padding: 10, borderRadius: 6 }}>
        <input id="search-location" type="text" placeholder="Endereço ou coordenadas" style={{ width: 220, marginRight: 6, padding: 4 }} />
        <button onClick={handleSearch}>🔍 Ir</button>
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
            <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' maxZoom={22} />
          </BaseLayer>
          <BaseLayer name="Satélite">
            <TileLayer url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' maxZoom={22} />
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
