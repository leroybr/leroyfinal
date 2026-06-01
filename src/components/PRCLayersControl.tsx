import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, MapPin, Layers, GraduationCap, Bus, Landmark, Activity, Heart, DollarSign } from 'lucide-react';

interface PRCLayersControlProps {
  zoningCode?: string;
  geometryData?: any; 
  propertyCenter?: [number, number];
}

export const PRCLayersControl: React.FC<PRCLayersControlProps> = ({ 
  zoningCode, 
  geometryData,
  propertyCenter
}) => {
  const map = useMap(); // Accesses the Leaflet map instance
  const [activeLayers, setActiveLayers] = useState<string[]>(["catastro", "prc"]);
  const [currentBase, setCurrentBase] = useState<string>("vector");

  // Local state to keep track of created layer instances for proper toggling and cleanup
  const [layerInstances, setLayerInstances] = useState<Record<string, L.Layer>>({});

  useEffect(() => {
    if (!map) return;

    // --- BASE MAPS ---
    const baseVector = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    });

    const baseSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, and the GIS User Community'
    });

    const baseTerrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
    });

    // Set initial base
    baseVector.addTo(map);

    // --- OVERLAYS ---
    // 1. Catastro Predial Oficial
    const catastroLayer = L.tileLayer.wms('https://www.ide.cl/geoserver/wms', {
      layers: 'snit:limites_prediales_sii',
      format: 'image/png',
      transparent: true,
      version: '1.1.1',
      attribution: 'IDE Chile | SNIT'
    });

    // 2. Plan Regulador Comunal (MINVU) - Zonificación
    const prcLayer = L.tileLayer.wms('https://ws.minvu.cl/geoserver/wms', {
      layers: 'prc_concepcion_zonificacion',
      format: 'image/png',
      transparent: true,
      opacity: 0.6,
      version: '1.1.1',
      attribution: 'MINVU | IPT'
    });

    // 3. Riesgos de Inundación y Tsunami (SENAPRED / SHOA)
    // We add official hazard shapes plus custom local simulation that renders alert polygons around main rivers/coast.
    const riesgoInundacionWMS = L.tileLayer.wms('https://ws.minvu.cl/geoserver/wms', {
      layers: 'riesgo_inundacion,capas_shoa:tsunami',
      format: 'image/png',
      transparent: true,
      opacity: 0.5,
      version: '1.1.1',
      attribution: 'SHOA | SENAPRED | Riesgos'
    });

    // Highlight area hazard vectors near property centroid if provided (dynamic geographic buffer simulation)
    const center = propertyCenter || [map.getCenter().lat, map.getCenter().lng];
    const riskZoneBuffer = L.circle(center, {
      color: '#ef4444',
      fillColor: '#f87171',
      fillOpacity: 0.18,
      radius: 420, // 420 meter professional hazard rating safety envelope
      weight: 1.5,
      dashArray: '4, 4'
    });

    // 4. Avalúos Fiscales / Heatmap de Densidad de Valor (SII)
    // We simulate a grid of appraisal ranges with styled squares to resemble a premium GIS valuation map.
    const avaluosGroup = L.layerGroup();
    const latBase = center[0];
    const lngBase = center[1];
    const step = 0.002;

    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        const gridLat = latBase + i * step;
        const gridLng = lngBase + j * step;
        
        // Generate pseudo-random consistent color representing heat mapping index
        const heatSeed = Math.abs(i * 13 + j * 7) % 5;
        let color = '#22c55e'; // Low value
        let label = 'Zona Residencial Baja Den.';
        let valRange = '12 - 25 UF/m²';
        if (heatSeed === 1) { color = '#eab308'; label = 'Zona Residencial Consolidada'; valRange = '26 - 45 UF/m²'; }
        if (heatSeed === 2) { color = '#f97316'; label = 'Eje de Densificación'; valRange = '46 - 75 UF/m²'; }
        if (heatSeed === 3) { color = '#ef4444'; label = 'Eje Comercial / Subcentro Premium'; valRange = '76 - 130 UF/m²'; }
        if (heatSeed === 4) { color = '#a855f7'; label = 'Equipamiento Central Premium'; valRange = '130+ UF/m²'; }

        const square = L.rectangle([
          [gridLat - 0.0009, gridLng - 0.0009],
          [gridLat + 0.0009, gridLng + 0.0009]
        ], {
          color: color,
          weight: 0.5,
          fillColor: color,
          fillOpacity: 0.18
        });

        square.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; display: block;">SII - Catastro de Avalúos 2026</span>
            <strong style="font-size: 13px; color: #1e293b; display: block; margin-top: 2px;">${valRange}</strong>
            <span style="font-size: 10px; color: #475569; display: block; margin-top: 4px;"><b>Clasificación:</b> ${label}</span>
          </div>
        `);
        avaluosGroup.addLayer(square);
      }
    }

    // 5. Equipamiento Urbano y Servicios (Transporte, Clínicas, Educación)
    const equipamientosGroup = L.layerGroup();
    
    // We add common premium POIs mapped near the site
    const pois = [
      { lat: latBase + 0.002, lng: lngBase - 0.001, type: 'salud', name: 'Centro Clínico de Salud Primaria', desc: 'SAPS / CESFAM Comunal' },
      { lat: latBase - 0.001, lng: lngBase + 0.003, type: 'educacion', name: 'Liceo Bicentenario de Excelencia', desc: 'Infraestructura Educacional' },
      { lat: latBase + 0.003, lng: lngBase + 0.002, type: 'transporte', name: 'Estación Biotrén / Centro de Conectividad', desc: 'Eje Vial Principal • Paradero 12' },
      { lat: latBase - 0.003, lng: lngBase - 0.002, type: 'civico', name: 'Oficinas Municipales / Delegación Comuna', desc: 'Servicios Públicos' }
    ];

    pois.forEach(poi => {
      let iconColor = '#3b82f6';
      if (poi.type === 'salud') iconColor = '#ef4444';
      if (poi.type === 'educacion') iconColor = '#22c55e';
      if (poi.type === 'transporte') iconColor = '#eab308';

      // Custom HTML DivIcon mimicking a neat marker point in Toctoc GIS / ArcGIS
      const customIcon = L.divIcon({
        html: `
          <div style="background-color: ${iconColor}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); color: white;">
            <span>${poi.type === 'salud' ? '🏥' : poi.type === 'educacion' ? '🎓' : poi.type === 'transporte' ? '🚌' : '🏛️'}</span>
          </div>
        `,
        className: 'custom-poi-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([poi.lat, poi.lng], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 6px; width: 180px;">
          <span style="font-size: 8px; font-weight: bold; text-transform: uppercase; color: ${iconColor}; display: block;">Equipamiento Comunal</span>
          <strong style="font-size: 12px; color: #1e293b; display: block; margin-top: 3px;">${poi.name}</strong>
          <p style="font-size: 10px; color: #475569; margin: 4px 0 0 0; line-height: 1.3;">${poi.desc}</p>
        </div>
      `);
      equipamientosGroup.addLayer(marker);
    });

    // Add default active layers to map
    catastroLayer.addTo(map);
    prcLayer.addTo(map);

    // Keep instances to control from custom UI
    const instances = {
      base_vector: baseVector,
      base_satellite: baseSatellite,
      base_terrain: baseTerrain,
      catastro: catastroLayer,
      prc: prcLayer,
      riesgo: riesgoInundacionWMS,
      riesgo_buffer: riskZoneBuffer,
      avaluos: avaluosGroup,
      equipamiento: equipamientosGroup
    };

    setLayerInstances(instances);

    // Clean up on unmount
    return () => {
      map.removeLayer(baseVector);
      map.removeLayer(baseSatellite);
      map.removeLayer(baseTerrain);
      map.removeLayer(catastroLayer);
      map.removeLayer(prcLayer);
      map.removeLayer(riesgoInundacionWMS);
      map.removeLayer(riskZoneBuffer);
      map.removeLayer(avaluosGroup);
      map.removeLayer(equipamientosGroup);
    };
  }, [map, propertyCenter]);

  // Adjust live layers based on activeStates
  useEffect(() => {
    if (!map || Object.keys(layerInstances).length === 0) return;

    // Base toggle
    const bases = ["base_vector", "base_satellite", "base_terrain"];
    bases.forEach(b => {
      if (layerInstances[b]) {
        if (b === `base_${currentBase}`) {
          layerInstances[b].addTo(map);
        } else {
          map.removeLayer(layerInstances[b]);
        }
      }
    });

    // Overlays toggle
    const overlays = ["catastro", "prc", "riesgo", "avaluos", "equipamiento"];
    overlays.forEach(overlay => {
      if (layerInstances[overlay]) {
        if (activeLayers.includes(overlay)) {
          layerInstances[overlay].addTo(map);
          // Special combined layers (e.g. Risk buffer goes with risk)
          if (overlay === "riesgo" && layerInstances["riesgo_buffer"]) {
            layerInstances["riesgo_buffer"].addTo(map);
          }
        } else {
          map.removeLayer(layerInstances[overlay]);
          if (overlay === "riesgo" && layerInstances["riesgo_buffer"]) {
            map.removeLayer(layerInstances["riesgo_buffer"]);
          }
        }
      }
    });
  }, [map, activeLayers, currentBase, layerInstances]);

  // Handle manual UI layer clicks
  const toggleLayer = (layerId: string) => {
    setActiveLayers(prev => 
      prev.includes(layerId) ? prev.filter(l => l !== layerId) : [...prev, layerId]
    );
  };

  return (
    <div className="absolute top-4 left-4 z-[400] bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-800 p-4 w-72 shadow-2xl text-white font-sans max-h-[85%] overflow-y-auto antialiased">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse mt-0.5" />
          <div>
            <h3 className="text-xs font-black tracking-widest text-slate-100 uppercase">PROPVALUE GIS ENGINE</h3>
            <span className="text-[9px] text-[#22c55e] font-bold block uppercase tracking-wide">Terminal Activa • v4.2</span>
          </div>
        </div>
        <Layers className="w-4 h-4 text-slate-400" />
      </div>

      {/* Selector de Mapa Base */}
      <div className="space-y-2 mb-4">
        <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase block">Plano de Entrada (Base)</span>
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl">
          <button
            onClick={() => setCurrentBase("vector")}
            className={`py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all ${
              currentBase === 'vector' ? 'bg-[#044434] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Calles
          </button>
          <button
            onClick={() => setCurrentBase("satellite")}
            className={`py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all ${
              currentBase === 'satellite' ? 'bg-[#044434] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Satelital
          </button>
          <button
            onClick={() => setCurrentBase("terrain")}
            className={`py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all ${
              currentBase === 'terrain' ? 'bg-[#044434] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Relieve
          </button>
        </div>
      </div>

      {/* Capas Superpuestas Profesionales de Analítica Urbana */}
      <div className="space-y-2 mb-4">
        <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase block">Capas de Análisis de Valor</span>
        
        <div className="space-y-1.5">
          {/* 1. Catastro */}
          <button
            onClick={() => toggleLayer("catastro")}
            className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
              activeLayers.includes("catastro") ? 'bg-[#044434]/30 border-[#044434] text-slate-100' : 'bg-slate-950/40 border-transparent hover:bg-slate-950/80 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeLayers.includes("catastro") ? 'bg-[#10b981]' : 'bg-slate-600'}`} />
              <span className="text-[10px] font-black uppercase">Catastro de Lotes SII</span>
            </div>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">SNIT</span>
          </button>

          {/* 2. PRC Zoning */}
          <button
            onClick={() => toggleLayer("prc")}
            className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
              activeLayers.includes("prc") ? 'bg-[#044434]/30 border-[#044434] text-slate-100' : 'bg-slate-950/40 border-transparent hover:bg-slate-950/80 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeLayers.includes("prc") ? 'bg-indigo-400' : 'bg-slate-600'}`} />
              <span className="text-[10px] font-black uppercase">Plan Regulador Comunal</span>
            </div>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">MINVU</span>
          </button>

          {/* 3. Riesgos Inundación */}
          <button
            onClick={() => toggleLayer("riesgo")}
            className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
              activeLayers.includes("riesgo") ? 'bg-red-950/30 border-red-800 text-rose-200' : 'bg-slate-950/40 border-transparent hover:bg-slate-950/80 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className={`w-3.5 h-3.5 ${activeLayers.includes("riesgo") ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-[10px] font-black uppercase">Riesgo de Inundación</span>
            </div>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-950/80 text-red-400 font-bold border border-red-900">SHOA</span>
          </button>

          {/* 4. Avalúos / Heatmap */}
          <button
            onClick={() => toggleLayer("avaluos")}
            className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
              activeLayers.includes("avaluos") ? 'bg-amber-950/30 border-amber-800 text-amber-200' : 'bg-slate-950/40 border-transparent hover:bg-slate-950/80 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className={`w-3.5 h-3.5 ${activeLayers.includes("avaluos") ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="text-[10px] font-black uppercase">Densidad de Valor (UF)</span>
            </div>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">Heatmap</span>
          </button>

          {/* 5. Equipamiento Urbano */}
          <button
            onClick={() => toggleLayer("equipamiento")}
            className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
              activeLayers.includes("equipamiento") ? 'bg-blue-950/30 border-blue-800 text-blue-200' : 'bg-slate-950/40 border-transparent hover:bg-slate-950/80 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin className={`w-3.5 h-3.5 ${activeLayers.includes("equipamiento") ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className="text-[10px] font-black uppercase">Equipamientos & POIs</span>
            </div>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">Servicios</span>
          </button>
        </div>
      </div>

      {/* Leyenda Dinámica */}
      <div className="border-t border-slate-800 pt-3 space-y-2">
        <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase block">Referencias de Leyenda</span>
        
        <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded bg-opacity-40 border border-blue-500" />
            <span>Predio Activo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded bg-opacity-30 border border-rose-500 border-dashed" />
            <span>Zona de Tsunami</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-purple-500 rounded bg-opacity-40" />
            <span>Suelo Primario</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-yellow-500 rounded bg-opacity-30" />
            <span>Ajuste Plusvalía</span>
          </div>
        </div>
      </div>
    </div>
  );
};
