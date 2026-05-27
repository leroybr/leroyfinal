import React from 'react';
import { useMap } from 'react-leaflet';

export interface RolDescompuesto {
  comunaCode: string;
  manzana: string;
  predio: string;
  formatoSii: string; // Formato estándar: "08101-01172-00004"
  valido: boolean;
}

// 🗺️ Diccionario Unificado usando estrictamente la codificación de Comunas del SII (Requerido por MINVU GIS)
export const COMUNA_CODES_VALUATION: Record<string, string> = {
  "Concepción": "08101",
  "San Pedro de la Paz": "08110", // Corregido a Código SII (Antes mapeaba SUBDERE 14202)
  "Talcahuano": "08109",          // Corregido a Código SII
  "Chiguayante": "08103",
  "Hualpén": "08112",
  "Coronel": "08105",
  "Santiago": "01101",            // Código SII oficial
  "Providencia": "01112",          // Código SII oficial
  "Las Condes": "01108",           // Código SII oficial
  "Vitacura": "01116",            // Código SII oficial
  "Ñuñoa": "01113",               // Código SII oficial
  "Lo Barnechea": "01109"          // Código SII oficial
};

export const getComunaCodeForRol = (communeName: string): string => {
  if (!communeName) return "08101"; // Fallback predeterminado a Concepción Centro
  const matched = Object.keys(COMUNA_CODES_VALUATION).find(k => 
    k.toLowerCase() === communeName.toLowerCase() || 
    communeName.toLowerCase().includes(k.toLowerCase())
  );
  return matched ? COMUNA_CODES_VALUATION[matched] : "08101"; 
};

/**
 * Sanitiza y descompone un string de Rol chileno.
 * Fuerza el rellenado con ceros a la izquierda para calzar con la cartografía oficial del MINVU.
 */
export const sanitizarYDescomponerRol = (
  rolRaw: string,
  codigoComunaPredeterminado: string = "08101"
): RolDescompuesto => {
  // 1. Limpiar caracteres extraños, dejar solo números y guiones
  const limpio = rolRaw.replace(/[^0-9-]/g, "");

  // 2. Dividir por el guion
  const partes = limpio.split("-").filter(part => part.length > 0);

  const resultadoInvalido: RolDescompuesto = {
    comunaCode: "",
    manzana: "",
    predio: "",
    formatoSii: "",
    valido: false
  };

  if (partes.length === 2) {
    // Caso: El usuario ingresó "Manzana-Predio" (ej: "1172-4")
    const mzn = partes[0].trim();
    const prd = partes[1].trim();
    
    return {
      comunaCode: codigoComunaPredeterminado,
      manzana: mzn,
      predio: prd,
      formatoSii: `${codigoComunaPredeterminado}-${mzn.padStart(5, '0')}-${prd.padStart(5, '0')}`,
      valido: true
    };
  } else if (partes.length === 3) {
    // Caso: El usuario ingresó "Comuna-Manzana-Predio" (ej: "08101-1172-4")
    return {
      comunaCode: partes[0],
      manzana: partes[1],
      predio: partes[2],
      formatoSii: `${partes[0]}-${partes[1].padStart(5, '0')}-${partes[2].padStart(5, '0')}`,
      valido: true
    };
  }

  return resultadoInvalido;
};

/**
 * 📐 Calcula el centroide geográfico de un conjunto de polígonos devueltos por el WFS
 * para mover la cámara directamente al lote real.
 */
export const extraerCentroideDeFeatures = (features: any[]): [number, number] | null => {
  try {
    if (!features || features.length === 0) return null;
    
    let latSum = 0;
    let lngSum = 0;
    let totalPuntos = 0;

    // Buscamos coordenadas en la primera feature disponible
    const geom = features[0].geometry;
    if (!geom) return null;

    const poligonos = geom.type === "MultiPolygon" ? geom.coordinates[0][0] : geom.coordinates[0];

    poligonos.forEach((coord: number[]) => {
      if (coord && coord.length >= 2) {
        lngSum += coord[0]; // El estándar WFS entrega [Longitud, Latitud]
        latSum += coord[1];
        totalPuntos++;
      }
    });

    if (totalPuntos === 0) return null;
    return [latSum / totalPuntos, lngSum / totalPuntos];
  } catch (err) {
    console.error("Error al calcular coordenadas de encuadre:", err);
    return null;
  }
};

// Componente interno para controlar transiciones fluidas de cámara en Leaflet
export const ChangeView: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  const [lat, lng] = center;
  
  React.useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], zoom);
      // Evita problemas de renderizado parcial de mosaicos grises en el contenedor
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }
  }, [lat, lng, zoom, map]);
  
  return null;
};

/**
 * Consulta la API cartográfica para obtener todos los predios de la misma manzana.
 */
export const obtenerCartografiaManzana = async (comunaCode: string, manzana: string): Promise<any> => {
  try {
    // Forzamos que el parámetro manzana enviado al backend tenga los 5 dígitos que exige el MINVU
    const mznFormateada = String(manzana || "").trim().padStart(5, '0');
    const url = `/api/cartografia-manzana?comunaCode=${encodeURIComponent(comunaCode)}&manzana=${encodeURIComponent(mznFormateada)}`;
    
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`HTTP Error: ${respuesta.status}`);
    
    const rawText = await respuesta.text();
    if (!rawText || !rawText.trim().startsWith("{")) {
       throw new Error("El servidor cartográfico retornó una página de error o HTML en vez de GeoJSON.");
    }
    
    const data = JSON.parse(rawText);
    return data.features && data.features.length > 0 ? data.features : null;
  } catch (error: any) {
    console.warn("Info: El mapa de predios no se pudo cargar desde IDE Chile (usando fallback local integrado):", error.message || error);
    return null;
  }
};
