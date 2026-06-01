import dotenv from "dotenv";
// 1. Force environment loading before any other imports
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { getRegulatoryData, estimatePropertyValue, runMarketAnalysis } from "./src/services/geminiService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Lightweight CORS middleware to avoid external package requirements
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Global Exception Handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    market: "Chile", 
    currency: "UF",
    geminiKeyLoaded: !!process.env.GEMINI_API_KEY 
  });
});

app.post("/api/get-regulatory-data", async (req, res) => {
  try {
    const {
      commune,
      sector,
      rol,
      street,
      number,
      rolManzana,
      rolPredio,
      currentZoningCode,
      m2_total,
      is_corner,
      corner_street,
      street_classification,
      corner_street_classification,
      tipoInforme,
    } = req.body;

    if (!commune) {
      return res.status(400).json({ error: "Falta la comuna requerida." });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("[Backend SDK Warning] Call made while GEMINI_API_KEY is not defined in process.env.");
    }

    const data = await getRegulatoryData(
      commune,
      sector || "",
      rol || "",
      street,
      number,
      rolManzana,
      rolPredio,
      currentZoningCode,
      m2_total,
      is_corner,
      corner_street,
      street_classification,
      corner_street_classification,
      tipoInforme
    );

    res.json(data);
  } catch (error: any) {
    console.error("Error in /api/get-regulatory-data:", error);
    res.status(500).json({ error: "Error al procesar la normativa con IA", message: error.message });
  }
});

app.post("/api/estimate-property-value", async (req, res) => {
  try {
    const { data, ufValue } = req.body;

    if (!data) {
      return res.status(400).json({ error: "Faltan los datos de la propiedad para la tasación." });
    }
    if (!ufValue) {
      return res.status(400).json({ error: "Falta el valor de la UF para la tasación." });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("[Backend SDK Warning] Call made while GEMINI_API_KEY is not defined in process.env.");
    }

    const result = await estimatePropertyValue(data, ufValue);
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/estimate-property-value:", error);
    res.status(500).json({ error: "Error al realizar la tasación con IA", message: error.message });
  }
});

app.post("/api/analisis-mercado", async (req, res) => {
  try {
    const payload = req.body;
    console.log("[Backend] Recibido para análisis en cascada:", payload);

    if (!payload.comuna) {
      return res.status(400).json({ error: "Falta la comuna requerida." });
    }

    const data = await runMarketAnalysis(payload);
    res.json(data);
  } catch (error: any) {
    console.error("Error in /api/analisis-mercado:", error);
    res.status(500).json({ error: "Error al realizar el análisis experto con IA", message: error.message });
  }
});

// Mock Market Data API
app.get("/api/market-stats", (req, res) => {
  res.json([]);
});

// Proxy for Commune Block Cartography (IDE Chile WFS Layer) - Safe and resilient
app.get("/api/cartografia-manzana", async (req, res) => {
  const { comunaCode, manzana } = req.query;
  
  if (!comunaCode || !manzana) {
    return res.status(400).json({ error: "Faltan parámetros comunaCode o manzana" });
  }

  const mznFormateada = String(manzana).padStart(5, '0');
  
  // Robust coordinate retrieval with srsName and maxFeatures limit
  const urlWFS = `https://ide.minvu.cl/geoserver/wfs?` + 
    `service=WFS&version=1.1.0&request=GetFeature&` +
    `typeName=minvu:capa_predios_sii&` + 
    `outputFormat=application/json&` +
    `srsName=EPSG:4326&maxFeatures=100&` +
    `cql_filter=comuna='${comunaCode}'%20AND%20manzana='${mznFormateada}'`;

  try {
    console.log(`[WFS Proxy] Solicitando entorno de manzana: ${mznFormateada} para comuna: ${comunaCode}`);
    
    const respuesta = await fetch(urlWFS, {
      headers: { 'Accept': 'application/json' },
      method: "GET"
    });

    if (!respuesta.ok) {
      throw new Error(`Servidor cartográfico de IDE Chile retornó status: ${respuesta.status}`);
    }
    
    const textBody = await respuesta.text();
    if (!textBody || !textBody.trim().startsWith("{")) {
      throw new Error("El servidor cartográfico de IDE Chile no retornó un JSON válido (posible mantenimiento o bloqueo temporal).");
    }

    const data = JSON.parse(textBody);
    res.json(data);
  } catch (error: any) {
    console.error("Error al rescatar el entorno de la manzana en backend:", error.message || error);
    // Suppress network crash with a structured empty response so maps stay functional
    res.status(200).json({ 
      type: "FeatureCollection", 
      features: [], 
      message: "No se encontraron predios disponibles en la consulta o falla temporal de red." 
    });
  }
});

// Proxy for UF value to avoid browser CORS and external lag
app.get("/api/uf", async (req, res) => {
  const FALLBACK_UF = 37350; // Respaldo oficial chileno
  
  try {
    if (typeof fetch !== 'function') {
      console.warn("Global fetch no está disponible, usando fallback.");
      return res.json({ serie: [{ valor: FALLBACK_UF }] });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch('https://mindicador.cl/api/uf', { 
        signal: controller.signal,
        headers: { 'User-Agent': 'PropValue-1-App/1.0' }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return res.json({ serie: [{ valor: FALLBACK_UF }] });
      }
      
      const data = await response.json();
      
      if (data && data.serie && data.serie.length > 0 && typeof data.serie[0].valor === 'number') {
        return res.json(data);
      } else {
        return res.json({ serie: [{ valor: FALLBACK_UF }] });
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      return res.json({ serie: [{ valor: FALLBACK_UF }] });
    }
  } catch (error: any) {
    return res.json({ serie: [{ valor: FALLBACK_UF }] });
  }
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

async function setupServer() {
  console.log("Iniciando configuración del servidor PropValue...");
  console.log("Entorno detectado:", process.env.NODE_ENV || "development");
  const keyTemp = process.env.GEMINI_API_KEY || "";
  console.log(`¿Clave de Gemini API cargada globalmente?: ${!!keyTemp} (Length: ${keyTemp.length}, Prefix: ${keyTemp.substring(0, 6)})`);

  // Vite middleware for development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static mapping
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.VERCEL !== "1") {
    const PORT = parseInt(process.env.PORT || "3000", 10);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Prop Value 1 en línea de forma segura: http://localhost:${PORT}`);
    });
  }
}

setupServer().catch(err => {
  console.error("Fallo crítico en la inicialización de server.ts:", err);
});

export default app;
