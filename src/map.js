
import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, LayersControl } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import * as turf from '@turf/turf';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from './supabaseClient';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const { BaseLayer } = LayersControl;

export default function MapEditor() {
  const featureGroupRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const mapContainerRef = useRef(null);

  const gerarPDF = async () => {
    if (!mapRef.current || !tileLayerRef.current) return;

    mapRef.current.removeLayer(tileLayerRef.current);
    await new Promise(resolve => setTimeout(resolve, 500));

    html2canvas(mapContainerRef.current, { useCORS: true }).then(async (canvas) => {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(canvas.toDataURL("image/png"), 'PNG', 0, 0);

      const blob = pdf.output("blob");
      const path = `relatorios/fazenda123/blocoA_${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage.from('relatorios').upload(path, blob, {
        contentType: 'application/pdf'
      });

      if (uploadError) {
        alert("Erro ao enviar PDF");
      } else {
        const { publicURL } = supabase.storage.from('relatorios').getPublicUrl(path);
        await supabase.from('relatorios_fazenda').insert({
          fazenda_id: '123',
          bloco_nome: 'Bloco A',
          pdf_url: publicURL
        });
        alert("PDF gerado e salvo!");
      }

      tileLayerRef.current.addTo(mapRef.current);
    });
  };

  const handleCreated = (e) => {
    const layer = e.layer;
    const geojson = layer.toGeoJSON();

    if (geojson.geometry.type === "Polygon") {
      const area = (turf.area(geojson) / 10000).toFixed(2);
      const acres = (area * 2.47105).toFixed(2);
      const perimeter = turf.length(geojson, { units: "kilometers" }).toFixed(2);
      const nome = prompt("Nome do bloco:", "Bloco A") || "Bloco";

      layer.setStyle({ color: "#4caf50", fillOpacity: 0.4, weight: 2 });
      layer.bindTooltip(`📐 \${area} ha | 📏 ${perimeter} km`, {
        permanent: true,
        direction: "center",
        className: "tooltip-label"
      }).openTooltip();

      layer._blocoData = { nome, area, acres, perimeter };

      const form = document.createElement("div");
      form.innerHTML = `
        <b>${nome}</b><br>
        🌱 Plantio: <input type="date" id="plantio" /><br>
        💧 Aplicação: <input type="date" id="aplicacao" /><br>
        🚜 Colheita: <input type="date" id="colheita" /><br><br>
        📏 ${perimeter} km<br>
        📐 ${area} ha (${acres} acres)
      `;

      const btn = document.createElement("button");
      btn.innerText = "Salvar";
      btn.onclick = () => {
        layer._blocoData.plantio = form.querySelector("#plantio").value;
        layer._blocoData.aplicacao = form.querySelector("#aplicacao").value;
        layer._blocoData.colheita = form.querySelector("#colheita").value;
        mapRef.current.closePopup();
      };
      form.appendChild(btn);

      layer.bindPopup(form);

      layer.on("click", () => {
        layer.options.selected = !layer.options.selected;
        layer.setStyle({
          ...layer.options,
          dashArray: layer.options.selected ? "4,4" : null,
          fillOpacity: layer.options.selected ? 0.2 : 0.4
        });
      });
    }
  };

  return (
    <div ref={mapContainerRef} style={{ height: "100vh", width: "100%" }}>
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
        style={{ height: "100%", width: "100%" }}
        whenCreated={(map) => {
          mapRef.current = map;
          const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxNativeZoom: 19,
            maxZoom: 22
          });
          osm.addTo(map);
          tileLayerRef.current = osm;
        }}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="Padrão">
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
            edit={{ edit: true, remove: true }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
