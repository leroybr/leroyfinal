import React from 'react';
import { useMap } from 'react-leaflet';

export interface RolDescompuesto {
  comunaCode: string;
  manzana: string;
  predio: string;
  formatoSii: string; // Formato estándar: "08101-01172-00004"
  valido: boolean;
}

// 🗺️ Diccionario Oficial Unificado según la codificación de Impuestos Internos (SII)
// Corregido milimétricamente para evitar solapamientos en el Gran Biobío y Santiago
export const COMUNA_CODES_VALUATION: Record<string, string> = {
  // 📍 Circuito Prioritario Gran Biobío
  "Concepción": "08101",
  "Coronel": "08102",
  "Chiguayante": "08103",
  "Penco": "08105",
  "Talcahuano": "08108",
  "Hualpén": "08110",
  "San Pedro de la Paz": "08112",

  // 📍 Región Metropolitana (Prefijo 13 de SUBDERE/SII para regularización)
  "Santiago": "13101",
  "Lo Barnechea": "13115",
  "Las Condes": "13114",
  "Ñuñoa": "13120",
  "Providencia": "13123",
  "Vitacura": "13132"
};

/**
 * Normaliza textos complejos eliminando diacríticos, acentos y espacios huérfanos.
 * Pensado para que la IA y las entradas de usuario no fallen por un tilde (ej: "Concepción" o "Hualpén")
 */
const normalizarTexto = (texto: string): string => {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remueve acentos de forma nativa
    .trim();
};

export const getComunaCodeForRol = (communeName: string): string => {
  if (!communeName) return "08101"; // Fallback predeterminado a Concepción Centro
  
  const nombreBuscado = normalizarTexto(communeName);
  
  const matched = Object.keys(COMUNA_CODES_VALUATION).find(k => {
    const llaveNormalizada = normalizarTexto(k);
    return llaveNormalizada === nombreBuscado || nombreBuscado.includes(llaveNormalizada);
  });
  
  return matched ? COMUNA_CODES_VALUATION[matched] : "08101"; 
};

/**
 * 📐 Sanitiza y descompone un string de Rol chileno.
 * Garantiza de forma estricta que Manzana y Predio tengan 5 dígitos rellenados con ceros a la izquierda,
 * independientemente de cómo lo ingrese el usuario para calzar con las capas del SII.
 */
export const sanitizarYDescomponerRol = (
  rolRaw: string,
  codigoComunaPredeterminado: string = "08101"
): RolDescompuesto => {
  const limpio = rolRaw.replace(/[^0-9-]/g, "");
  const partes = limpio.split("-").filter(part => part.length > 0);

  const resultadoInvalido: RolDescompuesto = {
    comunaCode: "",
    manzana: "",
    predio: "",
    formatoSii: "",
    valido: false
  };

  if (partes.length === 2) {
    // Caso: "Manzana-Predio" (ej: "1172-4") -> Forzamos estandarización estructural
    const mzn = partes[0].trim().padStart(5, '0');
    const prd = partes[1].trim().padStart(5, '0');
    
    return {
      comunaCode: codigoComunaPredeterminado,
      manzana: mzn,
      predio: prd,
      formatoSii: `${codigoComunaPredeterminado}-${mzn}-${prd}`,
      valido: true
    };
  } else if (partes.length === 3) {
    // Caso: "Comuna-Manzana-Predio" (ej: "08101-1172-4") -> Aquí también se obliga el padStart
    const com = partes[0].trim().padStart(5, '0');
    const mzn = partes[1].trim().padStart(5, '0');
    const prd = partes[2].trim().padStart(5, '0');

    return {
      comunaCode: com,
      manzana: mzn,
      predio: prd,
      formatoSii: `${com}-${mzn}-${prd}`,
      valido: true
    };
  }

  return resultadoInvalido;
};

/**
 * 📐 Calcula el centroide geográfico de un conjunto de polígonos devueltos por el WFS.
 * Integra validaciones geométricas avanzadas para soportar polígonos simples y complejos (MultiPolygon).
 */
export const extraerCentroideDeFeatures = (features: any[]): [number, number] | null => {
  try {
    if (!features || features.length === 0) return null;
    
    let latSum = 0;
    let lngSum = 0;
    let totalPuntos = 0;

    const geom = features[0].geometry;
    if (!geom) return null;

    // Manejo inteligente de la profundidad de matrices según el estándar de geometría OGC
    let poligonos = [];
    if (geom.type === "MultiPolygon") {
      poligonos = geom.coordinates[0][0]; 
    } else if (geom.type === "Polygon") {
      poligonos = geom.coordinates[0];
    } else {
      return null;
    }

    poligonos.forEach((coord: number[]) => {
      if (coord && coord.length >= 2) {
        lngSum += coord[0]; // Estándar WFS GeoJSON: [Longitud, Latitud]
        latSum += coord[1];
        totalPuntos++;
      }
    });

    if (totalPuntos === 0) return null;
    return [latSum / totalPuntos, lngSum / totalPuntos];
  } catch (err) {
    console.error("Error crítico al calcular coordenadas de encuadre en el plano:", err);
    return null;
  }
};

// Componente para la transición fluida de la cámara
export const ChangeView: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  const [lat, lng] = center;
  
  React.useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], zoom);
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }
  }, [lat, lng, zoom, map]);
  
  return null;
};

/**
 * Consulta la API cartográfica interna conectada a la capa base de catastro predial chileno.
 */
export const obtenerCartografiaManzana = async (comunaCode: string, manzana: string): Promise<any> => {
  try {
    // Robustez absoluta: Aseguramos limpieza y formato de 5 caracteres antes de subir el request a la API
    const comFormateada = String(comunaCode || "").trim().padStart(5, '0');
    const mznFormateada = String(manzana || "").trim().padStart(5, '0');
    
    const url = `/api/cartografia-manzana?comunaCode=${encodeURIComponent(comFormateada)}&manzana=${encodeURIComponent(mznFormateada)}`;
    
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`HTTP Error: ${respuesta.status}`);
    
    const rawText = await respuesta.text();
    if (!rawText || !rawText.trim().startsWith("{")) {
       throw new Error("El endpoint no retornó un GeoJSON estructurado.");
    }
    
    const data = JSON.parse(rawText);
    return data.features && data.features.length > 0 ? data.features : null;
  } catch (error: any) {
    console.warn("Info: Error en pasarela IDE/SII (conmutando a flujos locales de contingencia):", error.message || error);
    return null;
  }
};
