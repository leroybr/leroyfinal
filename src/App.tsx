import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ValuationForm } from './components/ValuationForm';
import { MarketTrends } from './components/MarketTrends';
import { MarketMap } from './components/MarketMap';
import { ProjectList } from './components/ProjectList';
import { LandingPage } from './components/LandingPage';
import { ExpertAnalysisTab } from './components/ExpertAnalysisTab';
import { PropertyData, ValuationResult, MarketStat, Project } from './types';
import { useFirebase } from './components/FirebaseProvider';
import { db, auth, handleFirestoreError, OperationType, collection, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from './firebase';
import { Building2, TrendingUp, MapPin, Calculator, Info, LogOut, LogIn, Download, FileText, X, CheckCircle2, Map as MapIcon, History, Layout, Settings, Sparkles, ExternalLink, ShieldAlert, ShieldCheck, Scale, Calendar, Instagram, Link as LinkIcon, RefreshCw, Menu, Library, Activity, Copy } from 'lucide-react';
import { PRCViewerModal } from './components/PRCViewerModal';
import ErrorBoundary from './components/ErrorBoundary';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Edificio Parque Laguna',
    developer: 'Inmobiliaria LeRoy residence',
    property_type: 'Departamento',
    region: 'Biobío',
    commune: 'San Pedro de la Paz',
    sector: 'Andalué',
    zoning_code: 'H2',
    address: 'Av. Las Condes 12300',
    status: 'En Verde',
    floors: 14,
    total_units: 84,
    amenities: ['Piscina', 'Quincho panorámico', 'Gimnasio', 'Bicicletero'],
    sustainability_features: ['Eficiencia Energética', 'Cargador auto eléctrico'],
    avg_price_uf_m2: 56.5,
    coordinates: { lat: -36.852, lng: -73.064 }
  },
  {
    id: 'p2',
    name: 'Condominio Lomas de San Andrés',
    developer: 'Inmobiliaria Biobío S.A.',
    property_type: 'Casa',
    region: 'Biobío',
    commune: 'Concepción',
    sector: 'Lomas de San Andrés',
    zoning_code: 'HE',
    address: 'Camino del Sol 452',
    status: 'Entrega Inmediata',
    floors: 2,
    total_units: 24,
    amenities: ['Sala Multiuso', 'Conserjería 24/7', 'Áreas Verdes'],
    sustainability_features: ['Paneles Solares', 'Aislación térmica avanzada'],
    avg_price_uf_m2: 52.0,
    coordinates: { lat: -36.790, lng: -73.051 }
  },
  {
    id: 'p3',
    name: 'Edificio O\'Higgins Plaza',
    developer: 'Inmobiliaria Concepción Centro',
    property_type: 'Departamento',
    region: 'Biobío',
    commune: 'Concepción',
    sector: 'Centro',
    zoning_code: 'ZH-1',
    address: 'Av. O\'Higgins 1045',
    status: 'En Venta',
    floors: 18,
    total_units: 120,
    amenities: ['Cowork', 'Gimnasio', 'Lavandería', 'Conserjería 24/7'],
    sustainability_features: ['Ventanas de Termopanel', 'Grifería de bajo consumo'],
    avg_price_uf_m2: 63.8,
    coordinates: { lat: -36.827, lng: -73.050 }
  }
];

export default function App() {
  const { user, loading: authLoading, authActionLoading, login, loginAsGuest, logout, error: firebaseError, setError: setFirebaseError } = useFirebase();
  const [valuation, setValuation] = useState<ValuationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [marketStats, setMarketStats] = useState<MarketStat[]>([]);
  const [ufValue, setUfValue] = useState(37350); // Fallback value
  const [history, setHistory] = useState<ValuationResult[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'intro' | 'valuation' | 'projects' | 'analysis'>('intro');
  const [showSplash, setShowSplash] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPRCModalOpen, setIsPRCModalOpen] = useState(false);
  const [draftPropertyData, setDraftPropertyData] = useState<any>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [datosRol, setDatosRol] = useState<{
    comuna: string;
    manzana: string;
    predio: string;
  } | null>(null);
  const [zonaAutomatica, setZonaAutomatica] = useState<string>("");
  const [tipoInforme, setTipoInforme] = useState<'simple' | 'completo'>('simple');
  const [triggerUnlockPremiumTime, setTriggerUnlockPremiumTime] = useState(0);
  const [activeProgressiveStage, setActiveProgressiveStage] = useState<number>(2); // 0 = Physical, 1 = Normative, 2 = Market Crossover


  const handleRolValidado = React.useCallback((comuna: string, manzana: string, predio: string) => {
    setDatosRol(prev => {
      if (prev && prev.comuna === comuna && prev.manzana === manzana && prev.predio === predio) {
        return prev;
      }
      return { comuna, manzana, predio };
    });
  }, []);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isReportMapMounted, setIsReportMapMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showReport) {
      const timer = setTimeout(() => setIsReportMapMounted(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsReportMapMounted(false);
    }
  }, [showReport]);

  useEffect(() => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      setApiKeyError("Falta la clave de API de Gemini (GEMINI_API_KEY). Asegúrate de que esté configurada en el panel de Settings > Secrets.");
    }
  }, []);

  const formatCurrency = (uf: number) => {
    const clp = uf * ufValue;
    return (
      <div className="flex flex-col">
        <span className="font-bold text-blue-600">{uf.toLocaleString()} UF</span>
        <span className="text-[10px] text-slate-400">$ {clp.toLocaleString('es-CL')} CLP</span>
      </div>
    );
  };

  const formatCurrencyInline = (uf: number) => {
    const clp = uf * ufValue;
    return `${uf.toLocaleString()} UF / $${clp.toLocaleString('es-CL')} CLP`;
  };


  // Fetch real-time UF value with better error handling and silent fallback
  useEffect(() => {
    const fetchUF = async () => {
      try {
        const response = await fetch('/api/uf', { 
          cache: 'no-store',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.serie && data.serie.length > 0) {
          const val = data.serie[0].valor;
          if (typeof val === 'number' && val > 0) {
            setUfValue(val);
          }
        }
      } catch (error) {
        // Silently use fallback value (38500) if fetch fails
        console.warn('UF fetch failed, using fallback value. This is expected if the external indicator service is unavailable in this environment.');
      }
    };
    fetchUF();
  }, []);

  useEffect(() => {
    fetch('/api/market-stats')
      .then(res => {
        if (!res.ok) throw new Error('Market stats fetch failed');
        return res.json();
      })
      .then(setMarketStats)
      .catch(err => console.error('Error fetching market stats:', err));
  }, []);

  // Sync projects from Firestore
  useEffect(() => {
    let unsubscribe: () => void;
    
    if (!user || user.uid === 'guest-local') {
      if (!user) setProjects([]);
      return;
    }
    
    try {
      const q = query(collection(db, 'projects'), limit(50));
      unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const projectList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as unknown as Project[];
          
          setProjects(projectList);
        } catch (innerError) {
          console.error("Error processing projects snapshot:", innerError);
        }
      }, (error: any) => {
        if (!error.message?.includes('offline')) {
          handleFirestoreError(error, OperationType.LIST, 'projects');
        }
      });
    } catch (outerError) {
      console.error("Error setting up projects subscription:", outerError);
      return;
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Load guest history locally
  useEffect(() => {
    if (user && user.uid === 'guest-local') {
      try {
        const stored = localStorage.getItem('prop_value_history');
        if (stored) {
          setHistory(JSON.parse(stored));
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error("Error loading local history:", err);
        setHistory([]);
      }
    }
  }, [user]);

  // Sync valutations (history) from Firestore
  useEffect(() => {
    let unsubscribe: () => void;
    
    if (!user || user.uid === 'guest-local') {
      if (!user) setHistory([]);
      return;
    }
    
    try {
      const q = query(
        collection(db, 'valuations'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const valuationList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as unknown as ValuationResult[];
          
          setHistory(valuationList);
        } catch (innerError) {
          console.error("Error processing valuations snapshot:", innerError);
        }
      }, (error: any) => {
        // Ignore "failed-precondition" error which usually means an index is being built
        if (error.code === 'failed-precondition') {
          console.warn("Valuations index is likely being built. History might not be available yet.");
          return;
        }
        if (!error.message?.includes('offline')) {
          console.error("Firestore snapshot error:", error);
          setAppError("Error al cargar el historial de tasaciones.");
          handleFirestoreError(error, OperationType.LIST, 'valuations');
        }
      });
    } catch (outerError) {
      console.error("Error setting up history subscription:", outerError);
      return;
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Lógica de Tasación (IA de Gemini con Registro Obligatorio)
  const handleValuation = async (data: PropertyData) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      setAppError("Error: No se ha configurado la clave de API de Gemini. Asegúrate de agregarla en el panel de Settings > Secrets.");
      return;
    }

    // 1. VERIFICACIÓN DE USUARIO: Si no hay usuario, forzamos el login primero
    if (!user) {
      try {
        await login(); // Llama a la función de login de tu FirebaseProvider
        // El código se detendrá aquí hasta que el usuario complete el login
      } catch (error) {
        setAppError("Es necesario ingresar con Google para realizar la tasación.");
        return; // Si cancela el login, no continuamos con la tasación
      }
    }

    // 2. Una vez que tenemos al usuario (existente o recién logueado), procedemos
    setIsLoading(true);
    setValuation(null);
    try {
      // Usamos el flujo directo a través de nuestra API segura que procesa con Gemini en el backend
      const response = await fetch("/api/estimate-property-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, ufValue })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Error al realizar la tasación con el motor de IA");
      }

      const result = await response.json();
      
      const finalResult = {
        ...result,
        property_data: data
      };
      
      setValuation(finalResult);
      setShowReport(true);
      
      // 3. Guardado automático en Firebase (Ahora 'user' es seguro que existe o auth.currentUser)
      const currentUser = auth.currentUser;
      if (currentUser) {
        await addDoc(collection(db, 'valuations'), { 
          ...data, 
          ...result, 
          userId: currentUser.uid, 
          userEmail: currentUser.email, // Guardamos el mail para tu base de leads
          createdAt: serverTimestamp() 
        });
      } else if (user && user.uid === 'guest-local') {
        const newHistoryItem: any = {
          id: 'local-' + Date.now(),
          ...data,
          ...result,
          userId: 'guest-local',
          createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
        };
        const stored = localStorage.getItem('prop_value_history');
        const currentStoredList = stored ? JSON.parse(stored) : [];
        const updatedList = [newHistoryItem, ...currentStoredList].slice(0, 20);
        localStorage.setItem('prop_value_history', JSON.stringify(updatedList));
        setHistory(updatedList);
      }
    } catch (error: any) {
      console.error("Valuation error:", error);
      const errorMessage = error?.message || "Hubo un error al procesar la tasación.";
      setAppError(errorMessage);
      try {
        handleFirestoreError(error, OperationType.CREATE, 'valuations');
      } catch (e) {
        // Log the error that was thrown by handleFirestoreError (which is already a JSON)
        console.error("Caught rethrown firestore error:", e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!valuation) return;
    const shareText = `
RESUMEN DE TASACIÓN INTELIGENTE
--------------------------------
Propiedad: ${valuation.property_data?.address_street} ${valuation.property_data?.address_number}, ${valuation.property_data?.commune}
Rol: ${valuation.property_data?.rol_manzana}-${valuation.property_data?.rol_predio}
Valor de Mercado: ${valuation.estimated_price_uf?.toLocaleString()} UF ($${valuation.estimated_price_clp?.toLocaleString('es-CL')} CLP)
Confianza: ${(valuation.confidence_score * 100).toFixed(0)}%

Análisis: ${valuation.market_context}
--------------------------------
Referencia: PROPIEDADES 3.1
    `.trim();
    
    navigator.clipboard.writeText(shareText).then(() => {
      alert("Resultado copiado al portapapeles");
    }).catch(err => {
      console.error("Error al copiar:", err);
      alert("No se pudo copiar automáticamente. Por favor, selecciona el texto manualmente.");
    });
  };

  const downloadPDF = async () => {
    if (!reportRef.current || !valuation) {
      console.error("Cannot download PDF: reportRef or valuation missing", { reportRef: !!reportRef.current, valuation: !!valuation });
      return;
    }
    
    setIsDownloading(true);
    console.log("Starting PDF generation...");

    try {
      const element = reportRef.current;
      
      // Wait for any animations or images to settle
      await new Promise(resolve => setTimeout(resolve, 800));

      // Use html2canvas with optimized options
      const canvas = await html2canvas(element, {
        scale: 2, // Scale 2 is a good balance between quality and performance
        useCORS: true,
        allowTaint: false, // Set to false when using useCORS to avoid tainting the canvas
        logging: true,
        backgroundColor: "#ffffff",
        imageTimeout: 15000,
        removeContainer: true,
      });
      
      console.log("Canvas captured successfully");
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Multi-page logic
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add subsequent pages if content is long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
      
      const fileName = `Tasacion_${valuation.estimated_price_uf}UF_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      console.log("PDF saved successfully:", fileName);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      setAppError("Hubo un error al generar el PDF. Por favor, inténtalo de nuevo. Si el error persiste, intenta usar la opción de Imprimir.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Main render logic
  if (authLoading && !valuation) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Iniciando Prop Value 1...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans" translate="no">
      {/* Global Status/Error Banners - Always visible atop everything */}
      <div className="fixed top-0 left-0 right-0 z-[110] pointer-events-none">
        <div className="pointer-events-auto">
          {(appError || firebaseError) && (
            <div className="bg-red-600 text-white px-4 py-2 text-center text-xs font-bold shadow-lg flex flex-col sm:flex-row items-center justify-center gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>{String(appError || firebaseError)}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-white text-red-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors text-[10px] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Recargar
                </button>
                <button 
                  onClick={() => { setAppError(null); setFirebaseError(null); }}
                  className="bg-white/20 px-2 py-1 rounded hover:bg-white/30 text-[10px]"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {firestoreError && (
            <div className="bg-amber-600 text-white px-4 py-2 text-center text-xs font-bold shadow-lg flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>Error de Base de Datos</span>
                <button 
                  onClick={() => setFirestoreError(null)}
                  className="ml-4 bg-white/20 px-2 py-1 rounded hover:bg-white/30 text-[10px]"
                >
                  Ignorar
                </button>
              </div>
              <p className="text-[10px] opacity-90 font-mono max-w-2xl truncate px-4">
                {(() => {
                  if (!firestoreError?.message) return "Error desconocido";
                  try {
                    const parsed = JSON.parse(firestoreError.message);
                    const isOffline = parsed.error?.toLowerCase().includes('offline');
                    return (
                      <div className="flex flex-col items-center">
                        <span>{parsed.operationType?.toUpperCase() || 'ERROR'} en {parsed.path || 'ruta'}: {parsed.error || 'Mensaje no disponible'}</span>
                        {isOffline && (
                          <div className="mt-2 flex flex-col items-center gap-1">
                            <span className="text-amber-200 animate-pulse">
                              Tip: Asegúrate de que la base de datos (default) esté activa en tu consola.
                            </span>
                            <a 
                              href={`https://console.firebase.google.com/project/gen-lang-client-0280785590/firestore`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-1 px-3 py-1 bg-white text-amber-700 rounded-full font-black uppercase text-[9px] hover:bg-amber-50 transition-colors shadow-sm"
                            >
                              Abrir Consola de Firebase →
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  } catch (e) {
                    return firestoreError.message;
                  }
                })()}
              </p>
            </div>
          )}

          {apiKeyError && (
            <div className="bg-red-600 text-white px-4 py-2 text-center text-xs font-bold shadow-lg flex items-center justify-center gap-2">
              <Info className="w-4 h-4" />
              <span>{apiKeyError}</span>
              <button 
                onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
                className="underline hover:text-white/80 ml-2"
              >
                Configurar
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div 
            key="splash-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center cursor-pointer"
            onClick={() => setShowSplash(false)}
          >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center mt-0 w-full"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-zinc-800 px-4">
            Prop Value <span className="text-blue-600 font-normal">1</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-[0.3em] uppercase text-sm mt-4 px-4">
            Valoración de bienes raíces
          </p>
          <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] mt-2 font-light">
            Herramienta de LeRoy Residence
          </p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-40 text-slate-600 text-base md:text-lg max-w-5xl mx-auto leading-relaxed px-4 font-light"
          >
            Prop Value 1 es una herramienta que analiza variables clave como mercado, plusvalía y normativa para estimar con precisión el valor de tu propiedad.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-24 w-full border-y border-zinc-200 py-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-zinc-800 text-xs font-medium tracking-[0.3em] uppercase"
          >
            <span className="animate-pulse">Valoriza tu propiedad hoy</span>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (user) {
                    setShowSplash(false);
                  } else {
                    login();
                  }
                }}
                disabled={authActionLoading}
                className="border border-zinc-800 px-8 py-3 hover:bg-zinc-800 hover:text-white transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                {authActionLoading ? (
                  <div className="w-4 h-4 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin" />
                ) : user ? (
                  <>Continuar <CheckCircle2 className="w-4 h-4" /></>
                ) : (
                  <>Ingresar con Google <LogIn className="w-4 h-4" /></>
                )}
              </button>

              {!user && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    loginAsGuest();
                    setShowSplash(false);
                  }}
                  className="border border-dashed border-zinc-400 text-slate-500 hover:text-zinc-800 px-8 py-3 hover:bg-slate-50 transition-all duration-300 flex items-center gap-2 font-medium"
                >
                  Modo Invitado <ShieldCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    ) : (
      <motion.div
        key="app-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col min-h-screen"
      >
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-900/40 backdrop-blur-md"
          >
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm mx-4">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <Calculator className="absolute inset-0 m-auto w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Calculando Tasación</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Nuestra IA está analizando el mercado, normativas urbanas y comparables para entregarte el valor más preciso.
              </p>
              <div className="mt-6 flex gap-1 justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="text-blue-600 w-8 h-8 flex-shrink-0" />
            <div className="flex flex-col">
              <h1 className="text-xl md:text-3xl font-bold tracking-tight leading-none text-zinc-800">Prop Value <span className="text-blue-600 font-normal">1</span></h1>
              <div className="flex items-baseline gap-1">
                <span className="text-[7px] md:text-[9px] text-gray-400 uppercase tracking-wider font-light">Herramienta de</span>
                <a 
                  href="https://leroyresidence.cl" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[8px] md:text-[10px] text-gray-400 font-medium tracking-widest hover:text-blue-600 transition-colors"
                >
                  LeRoy Residence
                </a>
              </div>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            {firebaseError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs animate-shake">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{firebaseError}</span>
                <button onClick={() => setFirebaseError(null)} className="ml-1 hover:text-red-800"><X className="w-3 h-3" /></button>
              </div>
            )}
            <button 
              onClick={() => setActiveTab('intro')}
              className={`flex flex-col items-center hover:text-blue-600 transition-colors ${activeTab === 'intro' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
            >
              <span>Inicio</span>
            </button>
            <button 
              onClick={() => setActiveTab('valuation')}
              className={`flex flex-col items-center hover:text-blue-600 transition-colors ${activeTab === 'valuation' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
            >
              <span>Tasación</span>
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`flex flex-col items-center hover:text-blue-600 transition-colors ${activeTab === 'analysis' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
            >
              <span className="flex items-center gap-1">
                Estudio de Experto
                <span className="text-[9px] uppercase font-black tracking-widest text-emerald-650 bg-emerald-100/60 px-1.5 py-0.2 rounded scale-90">IA</span>
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 hover:text-blue-600 transition-colors ${activeTab === 'projects' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
            >
              <span>Nuevos Proyectos</span>
              <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {projects.length > 0 ? projects.length : DEFAULT_PROJECTS.length}
              </span>
            </button>

            <div className="h-6 w-px bg-gray-200 mx-2" />

            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-2">
              <span className="text-[10px] text-blue-400 uppercase tracking-tighter">UF Hoy:</span>
              ${ufValue.toLocaleString('es-CL')}
            </div>

            {user ? (
               <div className="flex items-center gap-3">
                 <div className="flex flex-col items-end">
                   <span className="text-[10px] text-gray-400 uppercase tracking-tighter">Usuario</span>
                   <span className="text-xs font-bold text-slate-800">{user.displayName || user.email}</span>
                 </div>
                 <div className="relative group">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'U')}&background=random`} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                 </div>
                 {valuation && (
                    <button 
                      onClick={() => setValuation(null)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all shadow-md active:scale-95"
                    >
                      Nueva Tasación
                    </button>
                 )}
                 <button 
                   onClick={logout}
                   className="p-2 text-gray-400 hover:text-red-600 transition-colors bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md"
                   title="Cerrar Sesión"
                 >
                   <LogOut className="w-5 h-5" />
                 </button>
               </div>
            ) : (
              <button 
                onClick={login}
                disabled={authActionLoading}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {authActionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Ingresar</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="flex flex-col p-4 gap-4">
                <button 
                  onClick={() => { setActiveTab('intro'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 p-3 rounded-md ${activeTab === 'intro' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <Info className="w-5 h-5" />
                  <span className="font-semibold">Inicio</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('valuation'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 p-3 rounded-md ${activeTab === 'valuation' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <Calculator className="w-5 h-5" />
                  <span className="font-semibold">Tasación</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('analysis'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 p-3 rounded-md ${activeTab === 'analysis' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold flex items-center gap-1.5">
                    Estudio de Experto
                    <span className="text-[9px] uppercase font-black text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">IA</span>
                  </span>
                </button>
                <button 
                  onClick={() => { setActiveTab('projects'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center justify-between p-3 rounded-md ${activeTab === 'projects' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5" />
                    <span className="font-semibold">Nuevos Proyectos</span>
                  </div>
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
                    {projects.length > 0 ? projects.length : DEFAULT_PROJECTS.length}
                  </span>
                </button>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-sm font-bold text-gray-500 tracking-wider">Valor UF Hoy</span>
                  <span className="text-blue-700 font-bold">${ufValue.toLocaleString('es-CL')}</span>
                </div>
                {user ? (
                  <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-3 p-2">
                       <div className="relative">
                        <img 
                          src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'U')}&background=random`} 
                          alt={user.displayName || ''} 
                          className="w-10 h-10 rounded-full border border-gray-200 shadow-sm" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                       </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{user.displayName || (user.email?.split('@')[0])}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    
                    {valuation && (
                      <button 
                        onClick={() => { setValuation(null); setIsMobileMenuOpen(false); }}
                        className="flex items-center justify-center gap-2 p-3 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-md shadow-lg"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Nueva Tasación
                      </button>
                    )}

                    <button 
                      onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                      disabled={authActionLoading}
                      className="flex items-center justify-center gap-2 p-3 text-red-600 font-semibold bg-red-50 rounded-md disabled:opacity-50"
                    >
                      <LogOut className="w-5 h-5" />
                      {authActionLoading ? 'Cargando...' : 'Cerrar Sesión'}
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { login(); setIsMobileMenuOpen(false); }}
                    disabled={authActionLoading}
                    className="flex items-center justify-center gap-2 p-2 bg-blue-600 text-white font-semibold rounded-md shadow-lg disabled:opacity-50"
                  >
                    {authActionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )}
                    {authActionLoading ? 'Cargando...' : 'Ingresar con Google'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'intro' && (
          <LandingPage 
            setActiveTab={setActiveTab}
            marketStats={marketStats}
          />
        )}

        {activeTab === 'valuation' && (
          <motion.div
            key="valuation-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-0"
          >
            {/* Form Section - Full Width */}
            <section id="valuation-form" className="w-full bg-white border-b border-gray-100">
              <ValuationForm 
                onSubmit={handleValuation} 
                isLoading={isLoading} 
                isPRCModalOpen={isPRCModalOpen}
                setIsPRCModalOpen={setIsPRCModalOpen}
                setDraftPropertyData={setDraftPropertyData}
                setAppError={setAppError}
                ufValue={ufValue}
                onRolValidado={handleRolValidado}
                datosRol={datosRol}
                zonaAutomatica={zonaAutomatica}
                tipoInforme={tipoInforme}
                setTipoInforme={setTipoInforme}
                triggerUnlockPremiumTime={triggerUnlockPremiumTime}
              />
            </section>

            <main className="max-w-7xl mx-auto px-6 py-8">
              <div className="space-y-8">
                {valuation && (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-blue-600 text-white p-6 rounded-xl shadow-xl relative overflow-hidden"
                  >
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-orange-leroy/80 text-sm font-medium tracking-wider">Estimación Prop Value 1</p>
                          <h2 className="text-5xl font-bold mt-1">
                            {valuation.estimated_price_uf?.toLocaleString() || "0"} <span className="text-2xl font-normal">UF</span>
                          </h2>
                          <p className="text-white mt-1 text-lg">
                            ≈ ${valuation.estimated_price_clp?.toLocaleString('es-CL') || "0"} CLP
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <div className="bg-white/20 backdrop-blur-md p-3 rounded-lg text-center min-w-[100px]">
                            <p className="text-xs font-bold">Confianza</p>
                            <p className="text-2xl font-bold">{(valuation.confidence_score ? valuation.confidence_score * 100 : 0).toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg mb-6">
                        <div className="flex gap-2 items-start mb-2">
                          <Scale className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-400" />
                          <p className="text-sm font-bold uppercase tracking-widest text-amber-200">Justificación Técnica (4 Dimensiones)</p>
                        </div>
                        <p className="text-sm leading-relaxed mb-4">{valuation.market_context || "Sin contexto de mercado disponible"}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="bg-white/5 p-2 rounded border border-white/10 text-[9px]">
                            <p className="font-bold text-blue-300 uppercase mb-1">1. Legal (ROL/SII)</p>
                            <p className="opacity-80">Identificación clara del predio y validación de superficies fiscales.</p>
                          </div>
                          <div className="bg-white/5 p-2 rounded border border-white/10 text-[9px]">
                            <p className="font-bold text-blue-300 uppercase mb-1">2. Normativo (PRC/OGUC)</p>
                            <p className="opacity-80">Análisis del potencial de constructibilidad y mejor uso del suelo.</p>
                          </div>
                          <div className="bg-white/5 p-2 rounded border border-white/10 text-[9px]">
                            <p className="font-bold text-blue-300 uppercase mb-1">3. Cualitativo</p>
                            <p className="opacity-80">Ajuste por estado, materiales y plusvalía del sector Biobío.</p>
                          </div>
                          <div className="bg-white/5 p-2 rounded border border-white/10 text-[9px]">
                            <p className="font-bold text-blue-300 uppercase mb-1">4. ACM (Mercado)</p>
                            <p className="opacity-80">Análisis comparativo de ofertas y transacciones efectivas.</p>
                          </div>
                        </div>
                      </div>

                      {/* NUEVA SECCIÓN: BIBLIOTECA TÉCNICA Y DINÁMICA URBANA */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                          <div className="flex items-center gap-2 mb-3 text-blue-400">
                            <Library size={16} />
                            <h3 className="text-[11px] font-bold uppercase tracking-wider">Evolución del Mercado (24 meses)</h3>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[9px] text-slate-400 uppercase font-semibold">Plusvalía Sectorial</p>
                              <p className="text-xs text-slate-200">{valuation.market_evolution?.plusvalia_2yr || "Análisis en curso..."}</p>
                            </div>
                            <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                              <p className="text-[9px] text-blue-300 uppercase font-bold">Tendencia Futura</p>
                              <p className="text-[11px] text-blue-100">{valuation.market_evolution?.sector_trend_analysis || "Definiendo tendencia..."}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                          <div className="flex items-center gap-2 mb-3 text-amber-400">
                            <Activity size={16} />
                            <h3 className="text-[11px] font-bold uppercase tracking-wider">Proyectos e Impacto</h3>
                          </div>
                          <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
                            {valuation.nearby_projects && valuation.nearby_projects.length > 0 ? (
                              valuation.nearby_projects.map((proj, idx) => (
                                <div key={idx} className="bg-white/5 p-2 rounded text-[10px] border-l-2 border-amber-500/50">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-amber-200 truncate">{proj.name}</span>
                                    <span className="bg-amber-500/20 text-amber-300 px-1 rounded text-[8px] shrink-0">{proj.status}</span>
                                  </div>
                                  <p className="text-slate-300"><span className="text-amber-500/80 font-bold uppercase text-[8px]">Impacto:</span> {proj.impact}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">No se detectaron macro-proyectos en la zona inmediata.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* NOTA DE RIGOR TÉCNICO */}
                      <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg flex gap-3 items-start">
                        <ShieldCheck className="text-blue-400 shrink-0 mt-0.5" size={18} />
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[11px] font-bold text-blue-200 uppercase">Rigor Técnico e Inteligencia de Entorno</p>
                            {valuation.safety_factor && (
                              <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] font-mono border border-blue-500/30">
                                Margen de Error: {valuation.safety_factor}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-blue-100/80 leading-tight">
                            Este análisis integra una biblioteca técnica de normativas municipales (PRC) y datos históricos de mercado (24 meses). 
                            Si bien no sustituye a un Certificado de Informaciones Previas (CIP) oficial, los valores y proyecciones de plusvalía 
                            tienen un rango de precisión técnica de mercado basado en el desarrollo urbano actual del Biobío.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-center mb-6">
                        <button 
                          onClick={() => setShowReport(true)}
                          className="bg-white text-blue-600 px-6 py-1 rounded-md font-bold hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2"
                        >
                          <FileText className="w-5 h-5" />
                          Ver Informe Completo
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {valuation.comparables?.map((comp, idx) => (
                          <div key={`comp-${idx}-${comp.price_uf}`} className="bg-white/10 p-3 rounded-md border border-white/10">
                            <p className="text-xs text-white mb-1">{comp.source}</p>
                            <p className="font-bold">{comp.price_uf || 0} UF</p>
                            <p className="text-xs text-white">{comp.m2 || 0} m² • {comp.distance_km || 0} km</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-50"></div>
                  </motion.div>
                )}

                {/* VISUALIZADOR DE VALORACIÓN EVOLUTIVA POR IA (MAYOR Y MEJOR USO) */}
                {valuation && (
                  <motion.div
                    key="progressive-valuation"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6"
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase bg-violet-100 text-violet-700 px-3 py-1 rounded-full tracking-wider">
                        Sinergia Normativa e Inteligencia de Entorno
                      </span>
                      <h3 className="text-xl font-bold text-slate-800 mt-2 flex items-center gap-2">
                        <Sparkles className="text-violet-600 w-5 h-5 shrink-0" />
                        Progresión de Valoración Evolutiva por IA
                      </h3>
                      <p className="text-xs text-slate-550 leading-relaxed max-w-3xl mt-1">
                        Estudio dinámico del comportamiento del valor predial. Descubra cómo la inteligencia artificial optimiza y recalifica el valor comercial
                        cruzando el estado actual, el potencial técnico regulado (PRC) y las dinámicas transaccionales activas del Biobío.
                      </p>
                    </div>

                    {/* Stepper Pipeline */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                      {/* Fase 1 */}
                      <button
                        onClick={() => setActiveProgressiveStage(0)}
                        className={`text-left p-4 rounded-xl border-2 transition-all transition-duration-300 relative ${
                          activeProgressiveStage === 0
                            ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-500/5 shadow-md scale-[1.01]'
                            : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Fase 1</span>
                          <Building2 className={`w-4 h-4 ${activeProgressiveStage === 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                        </div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-tight">Tasación Física Base</h4>
                        <p className="text-[10px] text-slate-500 leading-normal mt-1 mb-3">Valor de la propiedad tal cual se encuentra hoy.</p>
                        <div className="mt-auto">
                          <span className="text-lg font-extrabold text-blue-700">
                            {(valuation.base_physical_price_uf || Math.round(valuation.estimated_price_uf * 0.78)).toLocaleString()} UF
                          </span>
                          <span className="text-[10px] text-slate-450 block font-mono">
                            ≈ ${((valuation.base_physical_price_uf || Math.round(valuation.estimated_price_uf * 0.78)) * ufValue).toLocaleString('es-CL')} CLP
                          </span>
                        </div>
                      </button>

                      {/* Fase 2 */}
                      <button
                        onClick={() => setActiveProgressiveStage(1)}
                        className={`text-left p-4 rounded-xl border-2 transition-all transition-duration-300 relative ${
                          activeProgressiveStage === 1
                            ? 'border-violet-600 bg-violet-50/70 ring-4 ring-violet-500/5 shadow-md scale-[1.01]'
                            : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black uppercase text-violet-400 bg-violet-100/80 px-2 py-0.5 rounded">Fase 2</span>
                          </div>
                          <Scale className={`w-4 h-4 ${activeProgressiveStage === 1 ? 'text-violet-600' : 'text-slate-400'}`} />
                        </div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-tight">Optimización Normativa</h4>
                        <p className="text-[10px] text-slate-500 leading-normal mt-1 mb-3">Integración de coeficientes del Plan Regulador (PRC).</p>
                        <div className="mt-auto">
                          <span className="text-lg font-extrabold text-violet-700">
                            {(valuation.normative_optimized_price_uf || Math.round(valuation.estimated_price_uf * 0.90)).toLocaleString()} UF
                          </span>
                          <span className="text-[10px] text-slate-450 block font-mono">
                            ≈ ${((valuation.normative_optimized_price_uf || Math.round(valuation.estimated_price_uf * 0.90)) * ufValue).toLocaleString('es-CL')} CLP
                          </span>
                        </div>
                      </button>

                      {/* Fase 3 */}
                      <button
                        onClick={() => setActiveProgressiveStage(2)}
                        className={`text-left p-4 rounded-xl border-2 transition-all transition-duration-300 relative ${
                          activeProgressiveStage === 2
                            ? 'border-emerald-600 bg-emerald-50/50 ring-4 ring-emerald-500/5 shadow-md scale-[1.01]'
                            : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded">Fase 3</span>
                          <TrendingUp className={`w-4 h-4 ${activeProgressiveStage === 2 ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-tight">Cruce de Mercado Activo</h4>
                        <p className="text-[10px] text-slate-500 leading-normal mt-1 mb-3">Valor comercial final según transacciones y ofertas.</p>
                        <div className="mt-auto">
                          <span className="text-lg font-extrabold text-emerald-700 font-black">
                            {(valuation.market_crossed_price_uf || valuation.estimated_price_uf).toLocaleString()} UF
                          </span>
                          <span className="text-[10px] text-slate-450 block font-mono font-medium">
                            ≈ ${((valuation.market_crossed_price_uf || valuation.estimated_price_uf) * ufValue).toLocaleString('es-CL')} CLP
                          </span>
                        </div>
                      </button>
                    </div>

                    {/* Stage Details Card */}
                    <AnimatePresence mode="wait">
                      {activeProgressiveStage === 0 && (
                        <motion.div
                          key="stage-0"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-blue-50/60 p-5 rounded-xl border border-blue-200/50 text-left grid grid-cols-1 md:grid-cols-4 gap-4"
                        >
                          <div className="md:col-span-3 space-y-3">
                            <div className="flex items-center gap-2 text-blue-800 font-bold uppercase text-xs tracking-wider">
                              <Building2 className="w-4 h-4 text-blue-700" />
                              Fase 1: Tasación Física de la Propiedad "Tal cual se encuentra"
                            </div>
                            <p className="text-xs text-slate-650 leading-relaxed font-sans">
                              Representa la valoración directa de la propiedad atendiendo únicamente a sus características edilicias físicas, calidad estructural
                              y las dimensiones del terreno informado. En esta fase preliminar actúan los desgloses tradicionales del método del costo de reposición depreciado:
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700 font-medium font-sans">
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                Terreno útil base: {valuation.valuation_breakdown?.land?.m2 || valuation.property_data?.m2_total} m² evaluados.
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                Construcciones existentes: {valuation.valuation_breakdown?.buildings?.m2 || valuation.property_data?.m2_useful || 0} m² techados.
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                Estado de Conservación: {valuation.property_data?.conservation_state || 'Bueno'} / {valuation.property_data?.construction_quality || 'Media'}.
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                Materialidad principal de muros: {valuation.property_data?.structure_muros || 'Mampostería/Hormigón'}.
                              </li>
                            </ul>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-blue-200 flex flex-col justify-center items-center text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tasación Física</span>
                            <span className="text-2xl font-black text-blue-700 mt-1">
                              {(valuation.base_physical_price_uf || Math.round(valuation.estimated_price_uf * 0.78)).toLocaleString()} UF
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono mt-1">
                              ${((valuation.base_physical_price_uf || Math.round(valuation.estimated_price_uf * 0.78)) * ufValue).toLocaleString('es-CL')}
                            </span>
                            <span className="bg-blue-150 text-blue-750 px-2 py-0.5 rounded text-[8px] font-bold uppercase mt-3">Estado Líquido Actual</span>
                          </div>
                        </motion.div>
                      )}

                      {activeProgressiveStage === 1 && (
                        <motion.div
                          key="stage-1"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-violet-50/60 p-5 rounded-xl border border-violet-200/50 text-left grid grid-cols-1 md:grid-cols-4 gap-4"
                        >
                          <div className="md:col-span-3 space-y-3">
                            <div className="flex items-center gap-2 text-violet-800 font-bold uppercase text-xs tracking-wider">
                              <Scale className="w-4 h-4 text-violet-700" />
                              Fase 2: Mayor y Mejor Uso mediante Parámetros del Plan Regulador Comunal
                            </div>
                            <p className="text-xs text-slate-650 leading-relaxed font-sans">
                              En esta etapa de redefinición dinámica, la IA incorpora los indicadores urbanísticos del Plan Regulador de la comuna 
                              (como la Zona <strong>{valuation.property_data?.zoning_code || 'ESC1 / ZM1'}</strong>). Al analizar el máximo potencial teórico construible,
                              el predio experimenta una recalificación positiva en su m² de suelo comercial:
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700 font-medium font-sans">
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-violet-600 rounded-full" />
                                Coeficiente Ocupación Suelo: {(valuation.property_data?.land_use_coefficient || 0.6) * 100}% de ocupación máxima.
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-violet-600 rounded-full" />
                                Coeficiente Constructibilidad: {valuation.property_data?.constructability_index || 3.5}x veces la superficie del terreno.
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-violet-600 rounded-full" />
                                Altura Máxima Edificación: {valuation.property_data?.max_height || 18} metros ({valuation.cabida_informe?.max_floors || 6} pisos).
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-violet-600 rounded-full" />
                                Cabida Teórica Máxima: {valuation.cabida_informe?.max_m2_buildable || Math.round((valuation.property_data?.m2_total) * 3.5)} m² totales.
                              </li>
                            </ul>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-violet-200 flex flex-col justify-center items-center text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Potencial Técnico</span>
                            <span className="text-2xl font-black text-violet-700 mt-1">
                              {(valuation.normative_optimized_price_uf || Math.round(valuation.estimated_price_uf * 0.90)).toLocaleString()} UF
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono mt-1">
                              ${((valuation.normative_optimized_price_uf || Math.round(valuation.estimated_price_uf * 0.90)) * ufValue).toLocaleString('es-CL')}
                            </span>
                            <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-[8px] font-bold uppercase mt-3">Sinergia PRC + OGUC</span>
                          </div>
                        </motion.div>
                      )}

                      {activeProgressiveStage === 2 && (
                        <motion.div
                          key="stage-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-200/50 text-left grid grid-cols-1 md:grid-cols-4 gap-4"
                        >
                          <div className="md:col-span-3 space-y-3">
                            <div className="flex items-center gap-2 text-emerald-800 font-bold uppercase text-xs tracking-wider">
                              <TrendingUp className="w-4 h-4 text-emerald-700" />
                              Fase 3: Cruce Comercial Dinámico e Inteligencia de Mercado Activa
                            </div>
                            <p className="text-xs text-slate-650 leading-relaxed font-sans">
                              La valuación comercial final se consolida al cruzar el potencial teórico de la propiedad con el entorno directo real vuestro. 
                              En esta etapa de optimización, el motor pondera ofertas de portales activos, cartera de proyectos locales en construcción y registros transaccionales
                              efectivos del Conservador de Bienes Raíces (CBR):
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700 font-medium font-sans">
                              <li className="flex items-center gap-1.5 text-slate-800">
                                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                                Comparables Activos en Zona: {valuation.comparables?.length || 2} referencias directas analizadas.
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                                Velocidad de Desarrollo: {valuation.market_evolution?.development_speed || 'Estable/Dinámico'}.
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                                Proyección Plusvalía Sectorial: <strong>{valuation.plusvalia_calculo?.estimated_annual_appreciation || 5.2}% anual</strong>.
                              </li>
                              <li className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                                Calce Comercial en Mercado: Coincidencia óptima y alta deseabilidad.
                              </li>
                            </ul>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-emerald-200 flex flex-col justify-center items-center text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Valor Final</span>
                            <span className="text-2xl font-black text-emerald-700 mt-1 font-sans">
                              {(valuation.market_crossed_price_uf || valuation.estimated_price_uf).toLocaleString()} UF
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono mt-1 font-medium">
                              ${((valuation.market_crossed_price_uf || valuation.estimated_price_uf) * ufValue).toLocaleString('es-CL')}
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[8px] font-bold uppercase mt-3 font-sans">Valor Transaccional</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
                
                <div id="market-trends">
                  <MarketTrends />
                </div>
                
                <div className="space-y-6">
                  <div id="market-map" className="w-full">
                    <MarketMap 
                      comuna={datosRol?.comuna} 
                      manzana={datosRol?.manzana} 
                      predio={datosRol?.predio} 
                      onZonaDetectada={(zona) => setZonaAutomatica(zona)}
                    />
                  </div>

                  {user && (
                    <div id="valuation-history" className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="text-blue-600 w-5 h-5" />
                        Tasaciones Recientes
                      </h2>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {(history || []).length === 0 ? (
                          <p className="text-gray-500 text-sm italic">No hay registros recientes.</p>
                        ) : (
                          (history || []).map((item, idx) => (
                            <div key={item?.id || `hist-${idx}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-100 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 text-sm">{(item?.estimated_price_uf || 0).toLocaleString()} UF</p>
                                  <p className="text-[10px] text-gray-500">
                                    {(item?.property_data?.address_street && item?.property_data?.address_number) ? `${item.property_data.address_street} ${item.property_data.address_number} • ` : ''}
                                    Confianza: {(item?.confidence_score ? item.confidence_score * 100 : 0).toFixed(0)}%
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-blue-600 font-bold">
                                  {item?.estimated_price_clp ? `$${(item.estimated_price_clp / 1000000).toFixed(1)}M` : '---'}
                                </p>
                                <button 
                                  onClick={() => {
                                    setValuation(item);
                                    setShowReport(true);
                                  }}
                                  className="text-[9px] font-bold text-blue-600 hover:underline"
                                >
                                  VER REPORTE
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </motion.div>
        )}

        {activeTab === 'analysis' && (
          <motion.div
            key="analysis-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto px-6 py-4"
          >
            <ExpertAnalysisTab valuation={valuation} ufValue={ufValue} />
          </motion.div>
        )}

        {activeTab === 'projects' && (
          <motion.div
            key="projects-page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto px-6 py-8"
          >
            <div id="projects-list">
              <ProjectList projects={projects.length > 0 ? projects : DEFAULT_PROJECTS} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-200 mt-12 text-center text-slate-500 text-xs">
        <p>© 2026 <span className="font-bold text-zinc-800">Prop Value <span className="text-blue-600 font-normal">1</span></span>. <a href="https://leroyresidence.cl" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors underline underline-offset-2">LeRoy Residence</a>.</p>
        <p className="mt-1">Datos procesados de SII, CBRS y Portales Inmobiliarios.</p>
      </footer>

    </motion.div>
  )}
</AnimatePresence>

      {/* Report Modal - "Hoja Nueva" */}
      <AnimatePresence>
        {showReport && valuation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl relative"
            >
              <div className="sticky top-0 bg-white/80 backdrop-blur-md z-30 p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={downloadPDF}
                    disabled={isDownloading}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isDownloading ? 'Generando...' : 'Descargar PDF'}
                  </button>
                  <button 
                    onClick={() => {
                      if (!valuation) return;
                      const content = `Tasación Prop Value 1\n\nPropiedad: ${valuation.property_data?.address_street || ''} ${valuation.property_data?.address_number || ''}, ${valuation.property_data?.commune || ''}\nValor Estimado: ${(valuation.estimated_price_uf || 0).toLocaleString()} UF\nValor en CLP: $${(valuation.estimated_price_clp || 0).toLocaleString('es-CL')}\nConfianza: ${(valuation.confidence_score ? valuation.confidence_score * 100 : 0).toFixed(0)}%\n\nContexto: ${valuation.market_context || ''}`;
                      navigator.clipboard.writeText(content);
                      alert('Contenido copiado al portapapeles');
                    }}
                    className="bg-purple-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-purple-700 transition-all shadow-md"
                  >
                    <FileText className="w-4 h-4" />
                    Copiar
                  </button>
                  <button 
                    onClick={() => {
                      if (!valuation) return;
                      const text = `Hola, envío tasación de Prop Value 1 para la propiedad en ${valuation.property_data?.commune}. Valor estimado: ${(valuation.estimated_price_uf || 0).toLocaleString()} UF.`;
                      const phone = valuation.property_data?.client_phone?.replace(/\D/g, '') || '';
                      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-green-700 transition-all shadow-md"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.319 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.735-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    WhatsApp
                  </button>
                  <button 
                    onClick={() => {
                      if (!valuation) return;
                      const subject = `Tasación Prop Value 1 - ${valuation.property_data?.commune}`;
                      const body = `Hola, adjunto los detalles de la tasación realizada en Prop Value 1.\n\nValor Estimado: ${(valuation.estimated_price_uf || 0).toLocaleString()} UF\nComuna: ${valuation.property_data?.commune}\n\nPuedes ver más detalles en el informe adjunto.`;
                      const email = valuation.property_data?.client_email || '';
                      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }}
                    className="bg-slate-800 text-white px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-slate-900 transition-all shadow-md"
                  >
                    <FileText className="w-4 h-4" />
                    Enviar Email
                  </button>
                </div>
                <button 
                  onClick={() => setShowReport(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div ref={reportRef} className="p-4 md:p-6 bg-white report-pdf-container">
                {/* Header of the report */}
                <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="text-blue-600 w-6 h-6" />
                      <div className="flex flex-col">
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-800">Prop Value <span className="text-blue-600 font-normal">1</span></h1>
                        <a 
                          href="https://leroyresidence.cl" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-gray-400 font-medium -mt-1 tracking-widest hover:text-blue-600 transition-colors"
                        >
                          LeRoy Residence
                        </a>
                      </div>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Informe de Tasación Inmobiliaria</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-slate-500 font-medium text-xs uppercase tracking-wider">Generado el {new Date().toLocaleDateString('es-CL')}</p>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${valuation.valuation_type === 'professional' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'}`}>
                        Nivel {valuation.valuation_type === 'professional' ? 'Profesional' : 'Básico'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-md inline-block font-bold mb-1 text-xs">
                      CONFIDENCIAL
                    </div>
                    <p className="text-[10px] text-gray-400">ID: {Math.random().toString(36).substring(2, 9).toUpperCase()}</p>
                  </div>
                </div>

                {/* Identificación del Cliente, Propietario y Propiedad Base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 border-b border-gray-50 pb-3">
                  <div className="space-y-3">
                    <div className="border-l-2 border-blue-600 pl-2">
                      <h4 className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Antecedentes del Solicitante (Cliente)</h4>
                      <p className="text-[11px] font-black text-slate-800 leading-none">{valuation.property_data?.client_name || "Particular"}</p>
                      <div className="flex gap-4 mt-1">
                        {valuation.property_data?.client_rut && (
                          <div className="text-[9px]"><span className="text-gray-400 font-bold uppercase">RUT:</span> <span className="text-slate-600">{valuation.property_data?.client_rut}</span></div>
                        )}
                        <div className="text-[9px]"><span className="text-gray-400 font-bold uppercase">Tipo Informe:</span> <span className="text-slate-600 font-bold">{valuation.property_data?.report_type || 'TASACIÓN'}</span></div>
                      </div>
                    </div>

                    <div className="border-l-2 border-emerald-600 pl-2">
                      <h4 className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Antecedentes del Propietario</h4>
                      <p className="text-[11px] font-black text-slate-800 leading-none">{valuation.property_data?.owner_name || valuation.property_data?.client_name || "Sin especificar"}</p>
                      <div className="flex gap-4 mt-1">
                        <div className="text-[9px]"><span className="text-gray-400 font-bold uppercase">RUT:</span> <span className="text-slate-600">{valuation.property_data?.owner_rut || "---"}</span></div>
                        <div className="text-[9px]"><span className="text-gray-400 font-bold uppercase">Contacto:</span> <span className="text-slate-600">{valuation.property_data?.owner_phone || "---"}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <h4 className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Antecedentes de la Propiedad (Identificación Física)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-[9px]"><span className="text-gray-400 font-bold uppercase">Con Edificación:</span> <span className="text-slate-800 font-black">{valuation.property_data?.has_construction ? 'SÍ' : 'NO'}</span></div>
                        <div className="text-[9px]"><span className="text-gray-400 font-bold uppercase">Tipo Propiedad:</span> <span className="text-slate-800 font-black uppercase text-[8px]">{valuation.property_data?.property_type}</span></div>
                        <div className="text-[9px] md:col-span-2"><span className="text-gray-400 font-bold uppercase">Dirección (Calle):</span> <span className="text-slate-800 font-black">{valuation.property_data?.address_street}</span></div>
                        <div className="text-[9px]"><span className="text-gray-400 font-bold uppercase">Bloque:</span> <span className="text-slate-800 font-black">{valuation.property_data?.block_info || '---'}</span></div>
                        <div className="text-[9px]"><span className="text-gray-400 font-bold uppercase">Clasificación:</span> <span className="text-slate-800 font-black uppercase">{valuation.property_data?.street_classification || '---'}</span></div>
                      </div>
                    </div>
                    
                    {/* Mapa de Localización en el Informe */}
                    {isReportMapMounted && valuation.property_data?.latitude && valuation.property_data?.longitude && (
                      <div className="h-[180px] min-h-[180px] w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative z-0">
                        <ErrorBoundary>
                          <MapContainer 
                            key={`${valuation.property_data.latitude}-${valuation.property_data.longitude}`}
                            center={[valuation.property_data.latitude, valuation.property_data.longitude]} 
                            zoom={16} 
                            style={{ height: '180px', width: '100%' }}
                            zoomControl={false}
                            scrollWheelZoom={false}
                            dragging={false}
                          >
                            <TileLayer
                              attribution='&copy; OpenStreetMap'
                              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            />
                            <Marker position={[valuation.property_data.latitude, valuation.property_data.longitude]} />
                            <div className="absolute top-2 left-2 z-[1000] bg-white/90 px-2 py-0.5 rounded text-[8px] font-black text-blue-600 border border-blue-200 shadow-sm uppercase">
                              Localización Obra
                            </div>
                          </MapContainer>
                        </ErrorBoundary>
                      </div>
                    )}
                  </div>
                </div>

                {valuation.property_data?.sector_description && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Descripción del Entorno</h4>
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        {valuation.property_data?.sector_description}
                      </p>
                    </div>
                  )}

                {/* DESCRIPCION DEL SECTOR - REPLICA IMAGEN REF */}
                {valuation.valuation_type === 'professional' && valuation.sector_analysis && (
                  <div className="mt-4 mb-4 border-2 border-slate-900 rounded-sm overflow-hidden flex flex-col md:flex-row shadow-xl text-xs">
                    {/* Sidebar Label */}
                    <div className="bg-slate-200 border-b-2 md:border-b-0 md:border-r-2 border-slate-900 py-3 px-3 flex items-center justify-center min-w-[50px]">
                      <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.4em] md:[writing-mode:vertical-rl] md:rotate-180 flex items-center gap-2">
                        Identificacion
                      </h3>
                    </div>

                    <div className="flex-1 bg-white">
                      {/* Main Header */}
                      <div className="bg-violet-100 border-b-2 border-slate-900 py-0.5 text-center font-black text-[11px] uppercase tracking-widest text-violet-900">
                        Descripción del Sector
                      </div>

                      {/* Content Area */}
                      <div className="p-2 space-y-2">
                        {/* Typology & Header Info */}
                        <div className="text-[9px] leading-tight">
                          <p className="font-black inline mr-1">TIPOLOGIA {valuation.sector_analysis?.typology?.toUpperCase() || 'N/A'},</p>
                          <span className="text-slate-700">{valuation.sector_analysis?.observations || '---'}</span>
                        </div>

                        {/* Middle Grids Container */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-2 gap-y-3">
                          {/* Mercado Column */}
                          <div className="lg:col-span-4 space-y-2">
                            <h4 className="font-black text-[9px] border-b border-slate-900 pb-0.5 mb-1.5">Mercado</h4>
                            <div className="space-y-0.5">
                              {[
                                { l: 'Mercado objetivo', v: valuation.sector_analysis?.market?.target_market || '---' },
                                { l: 'Oferta bienes similares', v: valuation.sector_analysis?.market?.similar_goods_offer || '---' },
                                { l: 'Tendencia valor', v: valuation.sector_analysis?.market?.value_trend || '---' },
                                { l: 'Transparencia mercado', v: valuation.sector_analysis?.market?.market_transparency || '---' },
                                { l: 'Demanda bienes similares', v: valuation.sector_analysis?.market?.similar_goods_demand || '---' },
                                { l: 'Plusvalía med/long plazo', v: valuation.sector_analysis?.market?.plusvalia_prospect || '---' },
                                { l: 'Bien adecuado para mercado', v: valuation.sector_analysis?.market?.market_suitability || '---' },
                                { l: 'Riesgo obtener valor menor', v: valuation.sector_analysis?.market?.low_value_risk || '---' }
                              ].map((item, idx) => (
                                <div key={idx} className="grid grid-cols-2 gap-2 text-[8px] items-center">
                                  <span className="text-slate-600 font-medium leading-tight">{item.l}</span>
                                  <span className="bg-slate-50 border border-slate-900 font-black px-1.5 py-0.25 text-center uppercase">{item.v}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Sector & Poblacion Column */}
                          <div className="lg:col-span-4 space-y-6">
                            <div className="space-y-3">
                                <h4 className="font-black text-[10px] border-b border-slate-900 pb-0.5 mb-2">Sector</h4>
                                <div className="space-y-1">
                                  {[
                                    { l: 'Calidad ambiental', v: valuation.sector_analysis?.sector?.environmental_quality || '---' },
                                    { l: 'Velocidad de cambio', v: valuation.sector_analysis?.sector?.change_speed || '---' },
                                    { l: 'Grado consolidación', v: valuation.sector_analysis?.sector?.consolidation_degree || '---' }
                                  ].map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-2 gap-2 text-[9px] items-center">
                                      <span className="text-slate-600 font-medium">{item.l}</span>
                                      <span className="bg-slate-50 border border-slate-900 font-black px-1.5 py-0.5 text-center uppercase">{item.v}</span>
                                    </div>
                                  ))}
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-black text-[10px] border-b border-slate-900 pb-0.5 mb-2">Población</h4>
                                <div className="space-y-1">
                                  {[
                                    { l: 'Nivel Socioeconómico', v: valuation.sector_analysis?.population?.socioeconomic_level || '---' },
                                    { l: 'Densidad Población', v: valuation.sector_analysis?.population?.population_density || '---' },
                                    { l: 'Tendencia', v: valuation.sector_analysis?.population?.trend || '---' }
                                  ].map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-2 gap-2 text-[9px] items-center">
                                      <span className="text-slate-600 font-medium">{item.l}</span>
                                      <span className="bg-slate-50 border border-slate-900 font-black px-1.5 py-0.5 text-center uppercase">{item.v}</span>
                                    </div>
                                  ))}
                                </div>
                            </div>
                          </div>

                          {/* Edificacion Column */}
                          <div className="lg:col-span-4 space-y-3">
                            <h4 className="font-black text-[10px] border-b border-slate-900 pb-0.5 mb-2">Edificación</h4>
                            <div className="space-y-1">
                              {[
                                { l: 'Calidad', v: valuation.sector_analysis?.edificios?.quality || '---' },
                                { l: 'Densidad', v: valuation.sector_analysis?.edificios?.density || '---' },
                                { l: 'Agrupamiento predom.', v: valuation.sector_analysis?.edificios?.predominant_grouping || '---' },
                                { l: 'Conservación general', v: valuation.sector_analysis?.edificios?.general_conservation || '---' },
                                { l: 'Edad media', v: `${valuation.sector_analysis?.edificios?.average_age || '---'} años` },
                                { l: 'Tipo diseño', v: valuation.sector_analysis?.edificios?.design_type || '---' },
                                { l: 'Grado de desarrollo', v: valuation.sector_analysis?.edificios?.development_degree || '---' }
                              ].map((item, idx) => (
                                <div key={idx} className="grid grid-cols-2 gap-2 text-[9px] items-center">
                                  <span className="text-slate-600 font-medium">{item.l}</span>
                                  <span className="bg-slate-50 border border-slate-900 font-black px-1.5 py-0.5 text-center uppercase">{item.v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Equipamiento Subsection */}
                        <div className="pt-2">
                           <h4 className="font-black text-[10px] mb-2">Equipamiento</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="flex justify-between items-center bg-slate-50 border border-slate-300 p-1.5 text-[9px]">
                                <span className="font-bold">Educacional</span>
                                <span className="font-black">{valuation.sector_analysis?.equipment?.educational_m || '---'} m</span>
                              </div>
                              <div className="flex justify-between items-center bg-slate-50 border border-slate-300 p-1.5 text-[9px]">
                                <span className="font-bold">Área Verde</span>
                                <span className="font-black">{valuation.sector_analysis?.equipment?.green_areas_m || '---'} m</span>
                              </div>
                              <div className="flex justify-between items-center bg-slate-50 border border-slate-300 p-1.5 text-[9px]">
                                <span className="font-bold">C. Comercial</span>
                                <span className="font-black">{valuation.sector_analysis?.equipment?.shopping_center_m || '---'} m</span>
                              </div>
                              <div className="flex justify-between items-center bg-violet-50 border border-slate-900 p-1.5 text-[9px]">
                                <span className="font-bold">Calidad Movil.</span>
                                <span className="font-black uppercase">{valuation.sector_analysis?.equipment?.mobilization_quality || '---'} ({valuation.sector_analysis?.equipment?.mobilization_m || '---'} m)</span>
                              </div>
                           </div>
                        </div>

                        {/* Urbanizacion Subsection */}
                        <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-slate-200">
                           <div className="space-y-3">
                              <h4 className="font-black text-[10px]">Urbanización</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  {[
                                    { l: 'Urbanización', v: valuation.sector_analysis?.urbanization?.completion || '---' },
                                    { l: 'Calidad', v: valuation.sector_analysis?.urbanization?.quality || '---' },
                                    { l: 'Estado conserv.', v: valuation.sector_analysis?.urbanization?.conservation || '---' },
                                    { l: 'Calzada', v: valuation.sector_analysis?.urbanization?.pavement || '---' },
                                    { l: 'Aceras', v: valuation.sector_analysis?.urbanization?.sidewalks || '---' }
                                  ].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[9px]">
                                      <span className="text-slate-500">{item.l}</span>
                                      <span className="bg-slate-50 border border-slate-900 font-black px-2 py-0.5 min-w-[80px] text-center uppercase">{item.v}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-1">
                                  {[
                                    { l: 'Alcantarillado', v: valuation.sector_analysis?.services?.sewage || '---' },
                                    { l: 'Gas', v: valuation.sector_analysis?.services?.gas || '---' },
                                    { l: 'Electricidad', v: valuation.sector_analysis?.services?.electricity || '---' },
                                    { l: 'Agua potable', v: valuation.sector_analysis?.services?.water || '---' },
                                    { l: 'Aguas lluvia', v: valuation.sector_analysis?.services?.rain_water || '---' },
                                    { l: 'Arbolización', v: valuation.sector_analysis?.services?.trees || '---' }
                                  ].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[9px]">
                                      <span className="text-slate-500">{item.l}</span>
                                      <span className="bg-slate-50 border border-slate-900 font-black px-2 py-0.5 min-w-[80px] text-center uppercase">{item.v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <h4 className="font-black text-[10px]">Observaciones Administrativas</h4>
                              <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-md">
                                <p className="text-[9px] text-slate-700 leading-relaxed font-medium italic">
                                  {valuation.sector_analysis?.urbanization_observations || 'No se registran observaciones adicionales.'}
                                </p>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* DESCRIPCION DEL SECTOR - REPLICA IMAGEN REF */}
                {/* ... existing code ... */}

                {/* DESCRIPCION GENERAL - PROPIEDAD - REPLICA IMAGEN REF */}
                {valuation.valuation_type === 'professional' && (
                  <div className="mt-4 mb-4 border-2 border-slate-900 rounded-sm overflow-hidden flex flex-col md:flex-row shadow-xl">
                    {/* Sidebar Label */}
                    <div className="bg-slate-200 border-b-2 md:border-b-0 md:border-r-2 border-slate-900 py-3 px-3 flex items-center justify-center min-w-[50px]">
                      <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.4em] md:[writing-mode:vertical-rl] md:rotate-180 flex items-center gap-2">
                        Descripción
                      </h3>
                    </div>

                    <div className="flex-1 bg-white">
                      {/* Main Header */}
                      <div className="bg-violet-100 border-b-2 border-slate-900 py-0.5 text-center font-black text-[11px] uppercase tracking-widest text-violet-900">
                         Descripción General - Propiedad
                      </div>

                      {/* Content Area - Main Desc */}
                      <div className="text-[9px]">
                         {[
                           { l: 'ACCESO PROPIEDAD', v: valuation.property_data?.access_description || valuation.market_context },
                           { l: 'USO O ACTIVIDAD', v: valuation.property_data?.property_usage === 'Habitacional' ? 'Vivienda, Habitacional.' : 'Comercial, Oficinas, Equipamiento.' },
                           { l: 'EMPLAZAMIENTO', v: valuation.property_data?.emplacement_description || `Zona ${valuation.property_data?.sector || 'urbana'} consolidada.` },
                           { l: 'DESCRIPCIÓN', v: valuation.property_data?.general_description || `Construcción de ${valuation.property_data?.materiality_walls || 'hormigón y albañilería'} en buen estado de conservación.` },
                           { l: 'DISTRIBUCIÓN', v: valuation.property_data?.distribution_description || `${valuation.property_data?.bedrooms || 0} dormitorios, ${valuation.property_data?.bathrooms || 0} baños, cocina y estares.` }
                         ].map((item, idx) => (
                           <div key={idx} className="flex border-b border-slate-300">
                             <div className="w-[120px] bg-slate-50 p-1.5 font-black uppercase border-r border-slate-300">
                               {item.l}
                             </div>
                             <div className="flex-1 p-1.5 text-slate-700 font-medium whitespace-pre-wrap leading-tight">
                               {item.v}
                             </div>
                           </div>
                         ))}
                      </div>

                      {/* Summary Grid - Terrain & Construction */}
                      <div className="grid grid-cols-1 md:grid-cols-2 border-b-2 border-slate-900">
                         {/* Terrain Side */}
                         <div className="p-3 border-r-2 border-slate-900">
                            <h4 className="font-black text-[9px] uppercase border-b border-slate-900 mb-2 py-0.5 bg-violet-50 px-2">Casas, Oficinas y Construcciones en General</h4>
                            <div className="space-y-4">
                               <div>
                                  <h5 className="font-black text-[8px] text-slate-400 uppercase mb-1">Terreno</h5>
                                  <div className="space-y-0.5">
                                     {[
                                       { l: 'RELACION FRENTE FONDO', v: valuation.property_data?.front_depth_ratio || '1:2' },
                                       { l: 'FORMA', v: valuation.property_data?.land_shape || 'REGULAR' },
                                       { l: 'TOPOGRAFIA', v: valuation.property_data?.land_topography || 'PLANA' },
                                       { l: 'USO ALTERNATIVO', v: valuation.property_data?.property_usage || 'HABITACIONAL' }
                                     ].map((it, i) => (
                                       <div key={i} className="flex justify-between text-[9px]">
                                          <span className="font-medium text-slate-600">{it.l}</span>
                                          <span className="font-black uppercase">{it.v}</span>
                                       </div>
                                     ))}
                                  </div>
                               </div>
                               <div>
                                  <h5 className="font-black text-[8px] text-slate-400 uppercase mb-1">Construccion</h5>
                                  <div className="space-y-0.5">
                                     {[
                                       { l: 'ANTIGÜEDAD', v: valuation.property_data?.year_built ? (new Date().getFullYear() - valuation.property_data.year_built) : '20' },
                                       { l: 'TIPO CONSTRUCCION', v: valuation.property_data?.construction_quality || 'CONVENCIONAL' },
                                       { l: 'ARQUITECTURA', v: 'ESTANDAR' },
                                       { l: 'ORIENTACION', v: valuation.property_data?.orientation || 'NORTE' },
                                       { l: 'TERMINACIONES', v: valuation.property_data?.conservation_state || 'BUENO' },
                                       { l: 'ADOSAMIENTO', v: valuation.property_data?.adosamiento || 'NO' }
                                     ].map((it, i) => (
                                       <div key={i} className="flex justify-between text-[9px]">
                                          <span className="font-medium text-slate-600">{it.l}</span>
                                          <span className="font-black uppercase">{it.v}</span>
                                       </div>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         </div>

                         {/* Apartment Side */}
                         <div className="p-3">
                            <h4 className="font-black text-[9px] uppercase border-b border-slate-900 mb-2 py-0.5 bg-violet-50 px-2">Departamentos (y Oficinas) en Edificios</h4>
                            <div className="space-y-0.5">
                               {[
                                 { l: 'ANTIGÜEDAD', v: valuation.property_data?.year_built ? (new Date().getFullYear() - valuation.property_data.year_built) : '----' },
                                 { l: 'PISO', v: valuation.property_data?.apartment_floor || '----' },
                                 { l: 'TOTAL PISOS', v: valuation.property_data?.total_building_floors || valuation.property_data?.floors || '----' },
                                 { l: 'ORIENTACION', v: valuation.property_data?.orientation || '----' },
                                 { l: 'NRO_DPTOS_POR_PISO', v: valuation.property_data?.units_per_floor || '----' },
                                 { l: 'NRO_DPTOS_EDIFICIO', v: valuation.property_data?.total_building_units || '----' }
                               ].map((it, i) => (
                                 <div key={i} className="flex justify-between text-[9px]">
                                    <span className="font-medium text-slate-600">{it.l}</span>
                                    <span className="font-black uppercase">{it.v}</span>
                                 </div>
                               ))}
                               <div className="mt-6 bg-slate-50 border border-dashed border-slate-300 h-20 flex items-center justify-center">
                                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Esquema / Croquis Depto</span>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Technical Specs Matrix */}
                      <div className="bg-slate-50 border-b border-slate-900">
                         <div className="bg-violet-100 py-1 border-b border-slate-900 text-center font-black text-[9px] uppercase">
                            Especificaciones Técnicas Edificación Principal
                         </div>
                         <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-6 text-[8px]">
                            {/* Col 1 */}
                            <div className="space-y-1">
                               {[
                                 { l: 'MUROS', v: valuation.property_data?.structure_muros || 'ALBAÑILERIA' },
                                 { l: 'ENTREPISO', v: valuation.property_data?.structure_entrepiso || 'HORMIGON' },
                                 { l: 'ESCALERA', v: valuation.property_data?.structure_escalera || 'MADERA' },
                                 { l: 'TECHUMBRE', v: valuation.property_data?.structure_techumbre || 'MADERA' },
                                 { l: 'CUBIERTA', v: valuation.property_data?.structure_cubierta || 'TEJA' },
                                 { l: 'PUERTAS', v: valuation.property_data?.doors_description || 'MADERA' },
                                 { l: 'VENTANAS', v: valuation.property_data?.windows_description || 'ALUMINIO' }
                               ].map((it, i) => (
                                 <div key={i} className="flex justify-between border-b border-slate-200 pb-0.5">
                                    <span className="text-slate-500 font-bold">{it.l}</span>
                                    <span className="font-black uppercase text-right">{it.v}</span>
                                 </div>
                               ))}
                            </div>
                            {/* Col 2 */}
                            <div className="space-y-1">
                               {[
                                 { l: 'REVESTIMIENTO INT.', v: valuation.property_data?.finishes_walls || 'PINTURA' },
                                 { l: 'REV. INT. Z. SECAS', v: valuation.property_data?.dry_zone_lining || 'PAPEL MURAL' },
                                 { l: 'REV. INT. Z. HUMEDAS', v: valuation.property_data?.wet_zone_lining || 'CERAMICOS' },
                                 { l: 'PAVIMENTO Z. SECAS', v: valuation.property_data?.dry_zone_floors || 'FLOTANTE' },
                                 { l: 'CIELOS', v: valuation.property_data?.finishes_ceilings || 'YESO' },
                                 { l: 'ARTEFACTOS SANIT.', v: valuation.property_data?.sanitary_artifacts || 'LOZA BLANCA' }
                               ].map((it, i) => (
                                 <div key={i} className="flex justify-between border-b border-slate-200 pb-0.5">
                                    <span className="text-slate-500 font-bold">{it.l}</span>
                                    <span className="font-black uppercase text-right">{it.v}</span>
                                 </div>
                               ))}
                            </div>
                            {/* Col 3 */}
                            <div className="space-y-1">
                               {[
                                 { l: 'MOBILIARIO', v: valuation.property_data?.furniture_quality || 'BUEN NIVEL' },
                                 { l: 'TABIQUERIA', v: valuation.property_data?.partition_walls || 'VOLCANITA' },
                                 { l: 'A. POTABLE', v: valuation.property_data?.potable_water_status || 'RED PUBLICA' },
                                 { l: 'ALCANTARILLADO', v: valuation.property_data?.sewage_status || 'RED PUBLICA' },
                                 { l: 'ELECTRICIDAD', v: valuation.property_data?.electricity_status || 'RED RED' },
                                 { l: 'GAS', v: valuation.property_data?.gas_status || 'RED CAÑERIA' },
                                 { l: 'AGRUPAMIENTO', v: valuation.property_data?.grouping || 'AISLADO' }
                               ].map((it, i) => (
                                 <div key={i} className="flex justify-between border-b border-slate-200 pb-0.5">
                                    <span className="text-slate-500 font-bold">{it.l}</span>
                                    <span className="font-black uppercase text-right">{it.v}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>

                      {/* Observations Bottom */}
                      <div className="p-2">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Observaciones Generales de la Propiedad:</span>
                         <p className="text-[9px] text-slate-600 italic font-medium leading-tight">
                            {valuation.property_data?.notes || "Carga de datos técnicos completada tras inspección ocular."}
                         </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Líneas Oficiales / Clasificación Vial - Professional Only */}
                {valuation.valuation_type === 'professional' && (
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-2 uppercase tracking-widest">
                      <MapIcon className="w-4 h-4 text-blue-600" />
                      Líneas Oficiales y Clasificación Vial
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200">
                            <th className="p-1.5 text-left font-bold text-slate-600 uppercase tracking-tighter">Por Calle</th>
                            <th className="p-1.5 text-left font-bold text-slate-600 uppercase tracking-tighter">Clasificación</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100">
                            <td className="p-2 font-bold text-slate-800 uppercase">{valuation.property_data?.address_street || "Principal"}</td>
                            <td className="p-2 font-bold text-blue-600 uppercase">{valuation.property_data?.street_classification || "SERVICIO"}</td>
                          </tr>
                          {valuation.property_data?.is_corner && (
                            <tr>
                              <td className="p-2 font-bold text-slate-800 uppercase">{valuation.property_data?.corner_street || "Esquina"}</td>
                              <td className="p-2 font-bold text-blue-600 uppercase">{valuation.property_data?.corner_street_classification || "SERVICIO"}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* GIS Verification Box */}
                <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <MapPin className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Verificación Geoespacial</h4>
                    <p className="text-[10px] text-slate-700 font-medium leading-tight">
                      Ubicación y deslindes verificados mediante cartografía satelital con referencia {valuation.property_data?.gis_reference_id || "11791"}.
                    </p>
                  </div>
                </div>

                {/* Main Value Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-blue-600 tracking-widest mb-1">Valor Estimado de Mercado</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-gray-900">{valuation.estimated_price_uf?.toLocaleString() || "0"}</span>
                      <span className="text-xl font-bold text-gray-400">UF</span>
                    </div>
                    <p className="text-xl font-bold text-gray-600">
                      ${valuation.estimated_price_clp?.toLocaleString('es-CL') || "0"} CLP
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[9px] font-bold text-gray-400 tracking-widest mb-1">Índice de Confianza</h4>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(valuation.confidence_score || 0) * 100}%` }}
                          className="h-full bg-blue-600"
                        />
                      </div>
                      <p className="text-right text-[10px] font-bold mt-0.5 text-blue-600">{(valuation.confidence_score ? valuation.confidence_score * 100 : 0).toFixed(0)}%</p>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <h4 className="text-[9px] font-bold text-blue-800 mb-1 leading-tight">Análisis Técnico de Valoración</h4>
                      <p className="text-[10px] text-blue-900 leading-tight italic">
                        "{valuation.market_context || "Sin observaciones adicionales."}"
                      </p>
                    </div>

                    {/* NUEVA SECCIÓN: DINÁMICA DE MERCADO Y PROYECTOS */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                        <h4 className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Dinamismo y Plusvalía (24m)</h4>
                        <p className="text-[9px] text-gray-800 leading-tight mb-1">
                          <span className="font-bold text-blue-700">Plusvalía:</span> {valuation.market_evolution?.plusvalia_2yr || "Análisis en curso..."}
                        </p>
                        <p className="text-[9px] text-gray-800 leading-tight italic">
                          <span className="font-bold text-blue-700">Tendencia:</span> {valuation.market_evolution?.sector_trend_analysis || "Definiendo..."}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                        <h4 className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Proyectos Detectados</h4>
                        <div className="space-y-1">
                          {valuation.nearby_projects && valuation.nearby_projects.length > 0 ? (
                            valuation.nearby_projects.slice(0, 2).map((p, i) => (
                              <div key={i} className="text-[8px] leading-tight flex justify-between border-b border-gray-100 last:border-0 pb-0.5">
                                <span className="font-bold text-gray-700 truncate mr-1">{p.name}</span>
                                <span className="text-blue-600 font-bold shrink-0">{p.status}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-[8px] text-gray-400 italic">Sin registros inmediatos.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {valuation.regulatory_analysis && (
                      <div className={`p-4 rounded-lg border ${valuation.regulatory_analysis?.is_consistent ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${valuation.regulatory_analysis?.is_consistent ? 'bg-green-500' : 'bg-amber-500'}`} />
                          <h4 className={`text-xs font-bold ${valuation.regulatory_analysis?.is_consistent ? 'text-green-800' : 'text-amber-800'}`}>
                            Verificación Normativa (PRC)
                          </h4>
                        </div>
                        <p className={`text-sm leading-relaxed ${valuation.regulatory_analysis?.is_consistent ? 'text-green-900' : 'text-amber-900'}`}>
                          {valuation.regulatory_analysis?.observations || 'No se registran observaciones regulatorias adicionales.'}
                        </p>
                        <div className="mt-2 text-[10px] font-bold opacity-60">
                          Consistencia: {((valuation.regulatory_analysis?.compliance_score || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}

                    {/* Technical Normative Details */}
                    <div className="bg-slate-50 p-3 rounded-lg border-2 border-slate-900 border-dashed">
                      <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Scale className="w-3 h-3 text-blue-600" />
                          ANÁLISIS NORMATIVO TÉCNICO
                        </div>
                      </h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px]">
                        <div className="text-slate-500 font-bold uppercase">Zona PRC:</div>
                        <div className="text-blue-700 font-black text-right border-b border-blue-100">{valuation.property_data?.zoning_code || "---"}</div>

                        <div className="col-span-2 bg-white rounded border border-slate-200 p-1.5 flex items-center justify-between my-0.5">
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Referencia Mapa Plano Regulador</p>
                            <p className="text-[9px] font-black text-slate-800 leading-tight">Zonificación Territorial Vigente</p>
                          </div>
                          <button 
                            onClick={() => setIsPRCModalOpen(true)}
                            className="bg-blue-600 text-white p-1 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                            title="Abrir Visor Territorial"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="text-slate-500 font-bold uppercase">Número Municipal:</div>
                        <div className="text-slate-800 font-black text-right border-b border-slate-200">{valuation.property_data?.address_number || "---"}</div>

                        <div className="text-slate-500 font-bold uppercase">Es Esquina:</div>
                        <div className="text-slate-800 font-black text-right border-b border-slate-200 italic">
                          {valuation.property_data?.is_corner ? valuation.property_data?.corner_street : 'NO'}
                        </div>

                        <div className="text-slate-500 font-bold uppercase">Clasificación:</div>
                        <div className="text-slate-800 font-black text-right border-b border-slate-200">{valuation.property_data?.street_classification || "---"}</div>

                        <div className="text-slate-500 font-bold uppercase">Sector:</div>
                        <div className="text-slate-800 font-black text-right border-b border-slate-200">{valuation.property_data?.sector || "---"}</div>

                        <div className="text-slate-500 font-bold uppercase">Comuna:</div>
                        <div className="text-slate-800 font-black text-right border-b border-slate-200 uppercase">{valuation.property_data?.commune || "---"}</div>

                        <div className="text-slate-500 font-bold uppercase">Ciudad:</div>
                        <div className="text-slate-800 font-black text-right border-b border-slate-200 uppercase">CONCEPCIÓN</div>

                        <div className="text-slate-500 font-bold uppercase">Ubicación:</div>
                        <div className="text-slate-800 font-black text-right border-b border-slate-200 uppercase tracking-tighter">{valuation.property_data?.location_type === 'Urbana' ? 'URBANA (CONSOLIDADA)' : 'RURAL'}</div>

                        <div className="col-span-2 py-0.5"></div>

                        <div className="text-blue-900 font-black uppercase text-[10px] bg-blue-50 px-2 py-0.5 border-l-4 border-blue-600">ROL:</div>
                        <div className="text-blue-900 font-black text-right text-[10px] bg-blue-50 px-2 py-0.5 border-r-4 border-blue-600">{valuation.property_data?.rol_manzana}-{valuation.property_data?.rol_predio}</div>

                        <div className="col-span-2 py-1 border-t border-slate-200 mt-1 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-slate-500 font-bold uppercase text-[7px]">Superficie Construida</span>
                            <span className="text-slate-800 font-black text-[10px]">{valuation.property_data?.m2_useful?.toLocaleString() || '---'} m²</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-slate-500 font-bold uppercase text-[7px]">Superficie Terreno</span>
                            <span className="text-slate-800 font-black text-[10px]">{valuation.property_data?.m2_total?.toLocaleString()} m²</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {(valuation.property_data?.cip_status || valuation.property_data?.expropriation_status) && (
                      <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 italic">Observaciones Legales/CIP:</h4>
                        <div className="space-y-1">
                          {valuation.property_data?.cip_status && <p className="text-[9px] text-amber-600 font-medium">⚠️ CIP: {valuation.property_data.cip_status}</p>}
                          {valuation.property_data?.expropriation_status && <p className="text-[9px] text-amber-600 font-medium">⚠️ Expropiación: {valuation.property_data.expropriation_status}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* New Analysis Sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {(valuation.property_data?.height_by_surface || valuation.property_data?.allowed_buildable_surface) && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 col-span-full">
                      <h3 className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-2 uppercase tracking-widest">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        Análisis de Altura y Superficie Máxima
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {valuation.property_data?.height_by_surface && (
                          <div className="space-y-2">
                            <h4 className="text-[9px] font-bold text-blue-800 uppercase">Altura Máxima según Superficie</h4>
                            <div className="bg-white p-2 rounded-lg border border-blue-100">
                              <p className="text-xs text-blue-900 font-bold leading-tight">
                                {valuation.property_data?.height_by_surface || 'Cálculo pendiente'}
                              </p>
                              {valuation.property_data?.continuous_building_details && (
                                <div className="mt-1 pt-1 border-t border-blue-50 flex items-start gap-2">
                                  <div className="w-1 h-1 rounded-full bg-orange-400 mt-1 shrink-0" />
                                  <p className="text-[8px] text-orange-700 font-medium">
                                    <span className="font-bold">E. Continua:</span> {valuation.property_data?.continuous_building_details}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {valuation.property_data?.allowed_buildable_surface && (
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-green-800 uppercase">Superficie Permitida</h4>
                            <div className="bg-white p-3 rounded-lg border border-green-100">
                              <p className="text-sm text-green-900 font-bold leading-relaxed">
                                {valuation.property_data?.allowed_buildable_surface || 'Dato no disponible'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {valuation.cabida_informe && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <h3 className="text-[10px] font-bold text-slate-800 mb-2 flex items-center gap-2 uppercase">
                        <Building2 className="w-3 h-3 text-blue-600" />
                        Informe de Cabida
                      </h3>
                      <div className="space-y-1.5 text-[9px]">
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-500">Pisos Máx:</span>
                          <span className="font-bold text-slate-800">{valuation.cabida_informe?.max_floors || '---'}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-500">m² Edificables:</span>
                          <span className="font-bold text-slate-800">{(valuation.cabida_informe?.max_m2_buildable || 0).toLocaleString()} m²</span>
                        </div>
                        <p className="text-[8px] text-slate-600 leading-tight italic mt-1 border-t border-slate-200 pt-1">
                          {valuation.cabida_informe?.observations || 'Informe técnico preliminar de cabida.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {valuation.restricciones_analisis && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <h3 className="text-[10px] font-bold text-amber-900 mb-2 flex items-center gap-2 uppercase">
                        <Info className="w-3 h-3 text-amber-600" />
                        Restricciones
                      </h3>
                      <div className="space-y-1 text-[8px]">
                        <p><span className="font-bold text-amber-800 uppercase">Riesgo:</span> {valuation.restricciones_analisis?.risk_zones || 'No detectados'}</p>
                        <p><span className="font-bold text-amber-800 uppercase">Expropiación:</span> {valuation.restricciones_analisis?.expropriations || 'Sin registros'}</p>
                        <p><span className="font-bold text-amber-800 uppercase">Patrimonio:</span> {valuation.restricciones_analisis?.heritage_protection || 'No aplica'}</p>
                        <p className="text-amber-700 italic border-t border-amber-100 pt-1">
                          {valuation.restricciones_analisis?.observations || 'Evaluación de restricciones territoriales según PRC.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {valuation.plusvalia_calculo && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <h3 className="text-[10px] font-bold text-green-900 mb-2 flex items-center gap-2 uppercase">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        Plusvalía
                      </h3>
                      <div className="space-y-1.5 text-[9px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Aprecio Anual:</span>
                          <span className="font-bold text-green-700">{valuation.plusvalia_calculo?.estimated_annual_appreciation || 0}%</span>
                        </div>
                        <p className="text-[8px] text-slate-600 leading-tight">
                          <span className="font-bold text-green-800">Crecimiento:</span> {valuation.plusvalia_calculo?.future_factors || 'Tendencias de mercado estables.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Factores de Valoración Section */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Factores de Valoración y Estado
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Año Construcción</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.year_built || "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Niveles / Pisos</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.floors || "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cocina</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.kitchen_description || "Estándar"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Baño</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.bathrooms_description || "Estándar"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">RTV / Recepción</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.rtv_status || "Pendiente"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Materiales Predominantes</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.materiality_walls || "No especificado"}</p>
                    </div>
                  </div>
                </div>

                {/* Condiciones de Edificación Section (CIP) */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-widest">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    Condiciones de Edificación (CIP)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Superficie Predial Mínima</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.min_lot_size ? `${valuation.property_data.min_lot_size} m²` : "N/A"}</p>
                    </div>
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Coeficiente de Uso de Suelo</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.land_use_coefficient || "N/A"}</p>
                    </div>
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Coeficiente de Constructibilidad</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.constructability_index || "N/A"}</p>
                    </div>
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Altura Máxima de Edificación</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.max_height ? `${valuation.property_data.max_height} m` : "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Sistema de Agrupamiento</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.grouping || "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Retranqueo</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.retranqueo || "No aplica"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Adosamiento</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.adosamiento || "N/A"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Antejardín</p>
                      <p className="text-sm font-bold text-slate-800">{valuation.property_data?.antejardin || valuation.property_data?.setback || "N/A"}</p>
                    </div>
                    {valuation.property_data?.incentivos && (
                      <div className="bg-green-50/50 p-3 rounded-xl border border-green-100 col-span-2">
                        <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Incentivos (Art. 40)</p>
                        <p className="text-xs font-medium text-slate-700">{valuation.property_data.incentivos}</p>
                      </div>
                    )}
                    {valuation.property_data?.condicion_incentivo && (
                      <div className="bg-green-50/50 p-3 rounded-xl border border-green-100 col-span-2">
                        <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Condición Incentivo</p>
                        <p className="text-xs font-medium text-slate-700">{valuation.property_data.condicion_incentivo}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Specifications and Municipal Status (Moved to end) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-600" />
                      Especificaciones Técnicas
                    </h3>
                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estructura Muros</p>
                          <p className="font-medium text-slate-700">{valuation.property_data?.structure_muros || "No especificado"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entrepiso</p>
                          <p className="font-medium text-slate-700">{valuation.property_data?.structure_entrepiso || "No especificado"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Techumbre</p>
                          <p className="font-medium text-slate-700">{valuation.property_data?.structure_techumbre || "No especificado"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Terminaciones</p>
                          <p className="text-xs text-slate-600">
                            {valuation.property_data?.finishes_walls ? `Muros: ${valuation.property_data.finishes_walls}. ` : ""}
                            {valuation.property_data?.finishes_floors ? `Pisos: ${valuation.property_data.finishes_floors}. ` : ""}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Distribución</p>
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                          {valuation.property_data?.distribution_description || "No especificado"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Situación Municipal
                    </h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Permiso Edificación</p>
                          <p className="text-sm font-bold text-slate-800">{valuation.property_data?.permit_number || "S/N"}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{valuation.property_data?.permit_date || "Fecha no registrada"}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Recepción Final</p>
                          <p className="text-sm font-bold text-slate-800">{valuation.property_data?.reception_number || "S/N"}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{valuation.property_data?.reception_date || "Fecha no registrada"}</p>
                        </div>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Observaciones Legales
                        </p>
                        <p className="text-[10px] text-amber-900 leading-relaxed italic">
                          {valuation.property_data?.cip_status ? `CIP: ${valuation.property_data.cip_status}. ` : ""}
                          {valuation.property_data?.expropriation_status ? `Expropiación: ${valuation.property_data.expropriation_status}. ` : ""}
                          Se recomienda validación en DOM Concepción.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Professional Analysis Section */}
                {valuation.valuation_type === 'professional' && valuation.professional_analysis && (
                  <div className="space-y-4 mb-6">
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 border-b border-white/10 pb-4">
                          <TrendingUp className="w-8 h-8 text-blue-400" />
                          Análisis Estratégico Profesional
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h4 className="text-green-400 font-bold text-sm uppercase tracking-widest mb-4">Fortalezas</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                              {(valuation.professional_analysis?.swot?.strengths || []).map((s, i) => <li key={i} className="flex gap-2"><span>•</span> {s}</li>)}
                            </ul>
                          </div>
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h4 className="text-red-400 font-bold text-sm uppercase tracking-widest mb-4">Debilidades</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                              {(valuation.professional_analysis?.swot?.weaknesses || []).map((w, i) => <li key={i} className="flex gap-2"><span>•</span> {w}</li>)}
                            </ul>
                          </div>
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h4 className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-4">Oportunidades</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                              {(valuation.professional_analysis?.swot?.opportunities || []).map((o, i) => <li key={i} className="flex gap-2"><span>•</span> {o}</li>)}
                            </ul>
                          </div>
                          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <h4 className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-4">Amenazas</h4>
                            <ul className="space-y-2 text-sm text-slate-300">
                              {(valuation.professional_analysis?.swot?.threats || []).map((t, i) => <li key={i} className="flex gap-2"><span>•</span> {t}</li>)}
                            </ul>
                          </div>
                        </div>

                        <div className="bg-blue-600/20 p-8 rounded-2xl border border-blue-500/30">
                          <h4 className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-4">Recomendación Final</h4>
                          <p className="text-lg text-white leading-relaxed italic">
                            "{valuation.professional_analysis?.final_recommendation}"
                          </p>
                        </div>

                        {/* Market Analysis Tables - REPLICA IMAGEN REF */}
                        <div className="mt-12 space-y-12">
                          {/* Ofertas Table */}
                          <div>
                            <div className="bg-slate-900 text-white p-2 text-xs font-black uppercase tracking-widest flex items-center justify-between">
                              <span>Ofertas de Propiedades similares en el sector</span>
                              <div className="flex gap-4">
                                <span className="flex items-center gap-1 opacity-70"><LinkIcon className="w-3 h-3" /> Portales</span>
                                <span className="flex items-center gap-1 opacity-70"><Instagram className="w-3 h-3" /> Redes</span>
                              </div>
                            </div>
                            <div className="border-x-2 border-b-2 border-slate-900 overflow-x-auto custom-scrollbar">
                              <table className="w-full text-[9px] border-collapse min-w-[1000px]">
                                <thead>
                                  <tr className="bg-violet-100 border-b-2 border-slate-900">
                                    <th className="p-1 border-r border-slate-400 font-black">N°</th>
                                    <th className="p-1 border-r border-slate-400 font-black">FECHA</th>
                                    <th className="p-1 border-r border-slate-400 font-black text-left">Direccion referencial</th>
                                    <th className="p-1 border-r border-slate-400 font-black">Distancia (Km)</th>
                                    <th className="p-1 border-r border-slate-400 font-black">Zona norm.</th>
                                    <th className="p-1 border-r border-slate-400 font-black">m2 terreno</th>
                                    <th className="p-1 border-r border-slate-400 font-black">m2 Constr.</th>
                                    <th className="p-1 border-r border-slate-400 font-black">Valor en UF (VUF)</th>
                                    <th className="p-1 border-r border-slate-400 font-black">VUF / m2 terreno</th>
                                    <th className="p-1 border-r border-slate-400 font-black">VUF / m2 Constr.</th>
                                    <th className="p-1 border-r border-slate-400 font-black">Fuente</th>
                                    <th className="p-1 font-black">Relacion*</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(valuation.professional_analysis?.offers || []).map((offer, idx) => (
                                    <tr key={idx} className="border-b border-slate-300 hover:bg-slate-50 text-slate-800">
                                      <td className="p-1 border-r border-slate-300 text-center">{offer.id_nro || idx + 1}</td>
                                      <td className="p-1 border-r border-slate-300 text-center">{offer.date ? new Date(offer.date).toLocaleDateString('es-CL') : '---'}</td>
                                      <td className="p-1 border-r border-slate-300 font-bold uppercase">{offer.address}</td>
                                      <td className="p-1 border-r border-slate-300 text-center font-black">{offer.distance_km}</td>
                                      <td className="p-1 border-r border-slate-300 text-center uppercase">{offer.norm_zone || 'HAB'}</td>
                                      <td className="p-1 border-r border-slate-300 text-center">{offer.m2_land ? `${offer.m2_land} m²` : '-'}</td>
                                      <td className="p-1 border-r border-slate-300 text-center">{offer.m2_built ? `${offer.m2_built} m²` : '-'}</td>
                                      <td className="p-1 border-r border-slate-300 text-center font-bold text-blue-600">{offer.price_uf?.toLocaleString()} UF</td>
                                      <td className="p-1 border-r border-slate-300 text-center">{offer.uf_m2_land?.toFixed(2) || '-'}</td>
                                      <td className="p-1 border-r border-slate-300 text-center font-black">{offer.uf_m2_built?.toFixed(2) || '-'}</td>
                                      <td className="p-1 border-r border-slate-300 text-center">
                                        <a href={offer.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline truncate max-w-[80px] inline-block">
                                          {offer.source_name}
                                        </a>
                                      </td>
                                      <td className="p-1 text-center font-black text-[8px] uppercase">{offer.relationship}</td>
                                    </tr>
                                  ))}
                                  {/* Summary Rows - REPLICA IMAGEN REF */}
                                  {valuation.professional_analysis?.market_summary && (
                                    <>
                                      <tr className="bg-slate-50 font-black border-t-2 border-slate-900 text-slate-900">
                                        <td colSpan={3} className="p-1 border-r border-slate-400 text-right">PROMEDIO GENERAL</td>
                                        <td className="p-1 border-r border-slate-400 text-center">---</td>
                                        <td className="p-1 border-r border-slate-400"></td>
                                        <td className="p-1 border-r border-slate-400 text-center">-</td>
                                        <td className="p-1 border-r border-slate-400 text-center">---</td>
                                        <td className="p-1 border-r border-slate-400 text-center">{(valuation.professional_analysis?.market_summary?.general_avg_uf || 0).toLocaleString()} UF</td>
                                        <td className="p-1 border-r border-slate-400 text-center">-</td>
                                        <td className="p-1 border-r border-slate-400 text-center text-violet-900">{(valuation.professional_analysis?.market_summary?.general_avg_uf_m2 || 0).toFixed(0)} UF/m²</td>
                                        <td colSpan={2}></td>
                                      </tr>
                                      <tr className="bg-slate-50 font-black text-slate-900">
                                        <td colSpan={3} className="p-1 border-r border-slate-400 text-right">PROMEDIO DE SIMILARES</td>
                                        <td className="p-1 border-r border-slate-400"></td>
                                        <td className="p-1 border-r border-slate-400"></td>
                                        <td className="p-1 border-r border-slate-400 text-center">-</td>
                                        <td className="p-1 border-r border-slate-400 text-center">---</td>
                                        <td className="p-1 border-r border-slate-400 text-center">{(valuation.professional_analysis?.market_summary?.similar_avg_uf || 0).toLocaleString()} UF</td>
                                        <td className="p-1 border-r border-slate-400 text-center">-</td>
                                        <td className="p-1 border-r border-slate-400 text-center text-violet-900">{(valuation.professional_analysis?.market_summary?.similar_avg_uf_m2 || 0).toFixed(0)} UF/m²</td>
                                        <td colSpan={2}></td>
                                      </tr>
                                      <tr className="bg-slate-50 font-black text-slate-900">
                                        <td colSpan={3} className="p-1 border-r border-slate-400 text-right">PROMEDIO SIMILARES. ajuste 5%</td>
                                        <td className="p-1 border-r border-slate-400"></td>
                                        <td className="p-1 border-r border-slate-400"></td>
                                        <td className="p-1 border-r border-slate-400 text-center">-</td>
                                        <td className="p-1 border-r border-slate-400 text-center">---</td>
                                        <td className="p-1 border-r border-slate-400 text-center">{(valuation.professional_analysis?.market_summary?.adjusted_avg_uf || 0).toLocaleString()} UF</td>
                                        <td className="p-1 border-r border-slate-400 text-center">-</td>
                                        <td className="p-1 border-r border-slate-400 text-center text-violet-900">{(valuation.professional_analysis?.market_summary?.adjusted_avg_uf_m2 || 0).toFixed(0)} UF/m²</td>
                                        <td colSpan={2}></td>
                                      </tr>
                                      <tr className="bg-violet-100 font-black border-t border-slate-900 text-slate-900">
                                        <td colSpan={3} className="p-1 border-r border-slate-400 text-right uppercase italic">BIEN ANALIZADO</td>
                                        <td className="p-1 border-r border-slate-400"></td>
                                        <td className="p-1 border-r border-slate-400"></td>
                                        <td className="p-1 border-r border-slate-400 text-center bg-violet-200">{(valuation.property_data?.m2_total) || '-'}</td>
                                        <td className="p-1 border-r border-slate-400 text-center bg-violet-200">{(valuation.property_data?.m2_useful) || '-'}</td>
                                        <td className="p-1 border-r border-slate-400 text-center bg-violet-200 text-blue-700">{(valuation.professional_analysis?.market_summary?.subject_value_uf || 0).toLocaleString()} UF</td>
                                        <td className="p-1 border-r border-slate-400 text-center bg-violet-200">-</td>
                                        <td className="p-1 border-r border-slate-400 text-center text-violet-900 bg-violet-200">{(valuation.professional_analysis?.market_summary?.subject_value_uf_m2 || 0).toFixed(0)} UF/m²</td>
                                        <td colSpan={2}></td>
                                      </tr>
                                    </>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            <p className="text-[8px] mt-1 italic font-medium text-slate-400">*Relacion contra el bien analizado (Similar, Inferior, Superior).</p>
                          </div>

                          {/* Ventas CBR Table */}
                          <div>
                            <div className="bg-slate-900 text-white p-2 text-xs font-black uppercase tracking-widest">
                              Ventas efectivas - Conservador de Bienes Raíces (CBR)
                            </div>
                            <div className="border-x-2 border-b-2 border-slate-900 overflow-x-auto custom-scrollbar">
                              <table className="w-full text-[9px] border-collapse min-w-[1000px]">
                                <thead>
                                  <tr className="bg-violet-100 border-b-2 border-slate-900 text-slate-900">
                                    <th className="p-1 border-r border-slate-400 font-black">N°</th>
                                    <th className="p-1 border-r border-slate-400 font-black">FECHA</th>
                                    <th className="p-1 border-r border-slate-400 font-black text-left">Direccion referencial</th>
                                    <th className="p-1 border-r border-slate-400 font-black">Distancia</th>
                                    <th className="p-1 border-r border-slate-400 font-black">Zona norm.</th>
                                    <th className="p-1 border-r border-slate-400 font-black">m2 terreno</th>
                                    <th className="p-1 border-r border-slate-400 font-black">m2 Constr.</th>
                                    <th className="p-1 border-r border-slate-400 font-black">Valor en UF</th>
                                    <th className="p-1 border-r border-slate-400 font-black">VUF / m2 terreno</th>
                                    <th className="p-1 border-r border-slate-400 font-black">VUF / m2 Constr.</th>
                                    <th className="p-1 border-r border-slate-400 font-black">Fojas/Nº/Rol</th>
                                    <th className="p-1 font-black">Relacion*</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(valuation.professional_analysis?.effective_sales || []).length > 0 ? (
                                    valuation.professional_analysis.effective_sales.map((sale, idx) => (
                                      <tr key={idx} className="border-b border-slate-300 hover:bg-slate-50 text-slate-800">
                                        <td className="p-1 border-r border-slate-300 text-center">{idx + 7}</td>
                                        <td className="p-1 border-r border-slate-300 text-center">{sale.date ? new Date(sale.date).toLocaleDateString('es-CL') : '---'}</td>
                                        <td className="p-1 border-r border-slate-300 font-bold uppercase">{sale.address}</td>
                                        <td className="p-1 border-r border-slate-300 text-center">{sale.distance_km || '---'}</td>
                                        <td className="p-1 border-r border-slate-300 text-center uppercase">{sale.norm_zone || 'HAB'}</td>
                                        <td className="p-1 border-r border-slate-300 text-center">{sale.m2_land || '-'}</td>
                                        <td className="p-1 border-r border-slate-300 text-center">{sale.m2_built || '-'}</td>
                                        <td className="p-1 border-r border-slate-300 text-center font-bold">{sale.price_uf?.toLocaleString()}</td>
                                        <td className="p-1 border-r border-slate-300 text-center">---</td>
                                        <td className="p-1 border-r border-slate-300 text-center font-black">---</td>
                                        <td className="p-1 border-r border-slate-300 text-center text-[8px] italic">{sale.cbr_data || '---'}</td>
                                        <td className="p-1 text-center font-black uppercase text-slate-700">{sale.relationship}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    [...Array(6)].map((_, i) => (
                                      <tr key={i} className="border-b border-slate-200 h-6">
                                        {[...Array(11)].map((__, j) => <td key={j} className="border-r border-slate-200"></td>)}
                                        <td className="text-center font-black uppercase text-[8px] text-slate-400">SIMILAR</td>
                                      </tr>
                                    ))
                                  )}
                                  <tr className="bg-slate-50 font-black border-t-2 border-slate-900 text-slate-900 uppercase">
                                    <td colSpan={3} className="p-1 border-r border-slate-400 text-right italic">PROMEDIO GENERAL</td>
                                    {[...Array(9)].map((_, i) => <td key={i} className="border-r border-slate-400 text-center">---</td>)}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DETALLE VALORIZACION - GRID STYLE (Imagen Ref) */}
                    {valuation.valuation_breakdown && (
                      <div className="mt-12 mb-8 border-2 border-slate-900 rounded-sm overflow-hidden flex flex-col md:flex-row shadow-xl">
                        {/* Sidebar Label */}
                        <div className="bg-violet-100 border-b-2 md:border-b-0 md:border-r-2 border-slate-900 py-6 px-3 flex items-center justify-center min-w-[50px]">
                          <h3 className="text-[14px] font-black text-violet-900 uppercase tracking-[0.4em] md:[writing-mode:vertical-rl] md:rotate-180 flex items-center gap-2">
                             Detalle Valorización
                          </h3>
                        </div>
                        
                        <div className="flex-1 bg-white">
                          {/* Table Header Info - Top Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border-b-2 border-slate-900 text-[9px] font-bold uppercase bg-slate-50/50">
                            <div className="p-2 border-b sm:border-b-0 sm:border-r border-slate-300 flex justify-between">
                              <span className="text-slate-400">Cliente:</span> 
                              <span className="text-slate-900 truncate ml-1">{valuation.property_data?.client_name?.toUpperCase() || '---'}</span>
                            </div>
                            <div className="p-2 border-b sm:border-b-0 sm:border-r border-slate-300 flex justify-between">
                              <span className="text-slate-400">Comuna:</span> 
                              <span className="text-slate-900 ml-1">{valuation.property_data?.commune?.toUpperCase() || '---'}</span>
                            </div>
                            <div className="p-2 border-b sm:border-b-0 sm:border-r border-slate-300 flex justify-between">
                              <span className="text-slate-400">Tipo:</span> 
                              <span className="text-slate-900 ml-1">{valuation.property_data?.property_type?.toUpperCase() || '---'}</span>
                            </div>
                            <div className="p-2 flex justify-between bg-slate-100">
                              <span className="text-slate-400">Cod.Banco:</span> 
                              <span className="text-slate-900 font-black">4410</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 border-b-2 border-slate-900 text-[9px] font-bold uppercase">
                            <div className="p-2 border-b md:border-b-0 md:border-r border-slate-300 col-span-2 flex justify-between">
                              <span className="text-slate-400">Dirección:</span> 
                              <span className="text-slate-900 ml-1">{(valuation.property_data?.address_street || '').toUpperCase()} {valuation.property_data?.address_number}</span>
                            </div>
                            <div className="p-2 border-b md:border-b-0 md:border-r border-slate-300 flex justify-between">
                              <span className="text-slate-400">Rol:</span> 
                              <span className="text-slate-900 font-black ml-1">{valuation.property_data?.rol_manzana}-{valuation.property_data?.rol_predio}</span>
                            </div>
                            <div className="p-2 flex justify-between bg-slate-100">
                              <span className="text-slate-400">Región:</span> 
                              <span className="text-slate-900 ml-1">VIII DEL BIO BIO</span>
                            </div>
                          </div>

                          {/* 1. TERRENO SECTION */}
                          <div className="bg-slate-800 text-white px-2 py-0.5 font-bold text-[9px] uppercase">Terreno</div>
                          <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse text-[8px] leading-tight min-w-[900px]">
                              <thead className="bg-slate-100 font-bold uppercase text-center border-b border-slate-400">
                                <tr>
                                  <th rowSpan={2} className="border border-slate-300 p-1 w-6">Item</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1 text-left">Zonas en Lote</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">Rol</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">Superficie</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">Z.Normat.</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">Topografía</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1 text-blue-600">UF/m2</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">Total UF</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">% Liq</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">Liquid.</th>
                                  <th colSpan={3} className="border border-slate-900 p-0.5 bg-slate-700 text-white text-center">Garantía</th>
                                </tr>
                                <tr className="bg-slate-200">
                                  <th className="border border-slate-900 p-1">% Ajust</th>
                                  <th className="border border-slate-900 p-1">Total (UF)</th>
                                  <th className="border border-slate-900 p-1">Total (CLP)</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="text-center font-bold">
                                  <td className="border border-slate-300 p-1 bg-slate-50 italic">A</td>
                                  <td className="border border-slate-300 p-1 text-left uppercase">PRINCIPAL / {valuation.property_data?.zoning_code || 'ESC1'}</td>
                                  <td className="border border-slate-300 p-1">{valuation.property_data?.rol_manzana}-{valuation.property_data?.rol_predio}</td>
                                  <td className="border border-slate-300 p-1 font-mono">{valuation.valuation_breakdown?.land?.m2?.toLocaleString()} m2</td>
                                  <td className="border border-slate-300 p-1">{valuation.property_data?.zoning_code || 'N/A'}</td>
                                  <td className="border border-slate-300 p-1 font-normal">{valuation.property_data?.topography || 'PLANO'}</td>
                                  <td className="border border-slate-300 p-1 text-blue-700">{valuation.valuation_breakdown?.land?.uf_m2}</td>
                                  <td className="border border-slate-300 p-1 bg-blue-50/50">{valuation.valuation_breakdown?.land?.total_uf?.toLocaleString()}</td>
                                  <td className="border border-slate-300 p-1 text-slate-400">0,3</td>
                                  <td className="border border-slate-300 p-1 text-slate-500">{( (valuation.valuation_breakdown?.land?.total_uf || 0) * 0.7).toFixed(1)}</td>
                                  <td className="border border-slate-900 p-1 bg-slate-50 text-slate-400">0</td>
                                  <td className="border border-slate-900 p-1 bg-slate-100 font-black">{valuation.valuation_breakdown?.land?.total_uf?.toLocaleString()}</td>
                                  <td className="border border-slate-900 p-1 bg-slate-200 font-black text-right pr-2">${((valuation.valuation_breakdown?.land?.total_uf || 0) * ufValue).toLocaleString('es-CL')}</td>
                                </tr>
                                {/* Empty rows to match visual style */}
                                {[1, 2, 3].map(i => (
                                  <tr key={i} className="h-4 border-b border-slate-100">
                                    <td className="border-r border-slate-300 bg-slate-50"></td>
                                    {Array.from({length: 12}).map((_, j) => <td key={j} className="border-r border-slate-300"></td>)}
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-slate-300 font-black uppercase text-[9px] border-t-2 border-slate-900">
                                <tr>
                                  <td colSpan={3} className="border border-slate-300 p-1.5 text-right italic pr-4">Sub Total Terreno</td>
                                  <td className="border border-slate-300 p-1 text-center">{valuation.valuation_breakdown?.land?.m2?.toLocaleString()} m2</td>
                                  <td colSpan={2} className="border border-slate-300"></td>
                                  <td className="border border-slate-300 p-1 text-blue-800 text-center">{valuation.valuation_breakdown?.land?.uf_m2} UF/m2</td>
                                  <td className="border border-slate-300 p-1 text-center bg-blue-100">{valuation.valuation_breakdown?.land?.total_uf?.toLocaleString()} UF</td>
                                  <td className="border border-slate-300"></td>
                                  <td className="border border-slate-300 p-1 text-center font-normal text-slate-500">{( (valuation.valuation_breakdown?.land?.total_uf || 0) * 0.7).toFixed(0)} UF</td>
                                  <td className="border border-slate-900"></td>
                                  <td className="border border-slate-900 p-1.5 text-center bg-slate-800 text-white">{valuation.valuation_breakdown?.land?.total_uf?.toLocaleString()} UF</td>
                                  <td className="border border-slate-900 p-1.5 text-right font-black bg-slate-800 text-white pr-2">${((valuation.valuation_breakdown?.land?.total_uf || 0) * ufValue).toLocaleString('es-CL')}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* 2. CONSTRUCCIONES SECTION */}
                          <div className="bg-slate-800 text-white px-2 py-0.5 font-bold text-[9px] uppercase border-t border-slate-900">Construcciones</div>
                          <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse text-[8px] leading-tight min-w-[900px]">
                              <thead className="bg-slate-100 font-bold uppercase text-center border-b border-slate-400">
                                <tr>
                                  <th rowSpan={2} className="border border-slate-300 p-1 w-6">Item</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1 text-left">Nombre / Recinto</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">Rol</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">Superficie</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">Material</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">Año</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1 text-blue-600">UF/m2</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">Total (UF)</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">% Liq</th>
                                  <th rowSpan={2} className="border border-slate-300 p-1">Liquid.</th>
                                  <th colSpan={3} className="border border-slate-900 p-0.5 bg-slate-700 text-white text-center">Garantía</th>
                                </tr>
                                <tr className="bg-slate-200">
                                  <th className="border border-slate-900 p-1">% Ajust</th>
                                  <th className="border border-slate-900 p-1">Total (UF)</th>
                                  <th className="border border-slate-900 p-1">Total (CLP)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {valuation.valuation_breakdown?.buildings?.details?.map((detail, idx) => (
                                  <tr key={idx} className="text-center font-bold">
                                    <td className="border border-slate-300 p-1 bg-slate-50">{idx + 1}</td>
                                    <td className="border border-slate-300 p-1 text-left uppercase pl-2 font-black">{detail.description || 'CONSTRUCTION'}</td>
                                    <td className="border border-slate-300 p-1">{valuation.property_data?.rol_manzana}-{valuation.property_data?.rol_predio}</td>
                                    <td className="border border-slate-300 p-1 font-mono">{detail.m2?.toLocaleString()} m2</td>
                                    <td className="border border-slate-300 p-1">{valuation.property_data?.materiality_walls?.charAt(0) || 'B'}</td>
                                    <td className="border border-slate-300 p-1">{valuation.property_data?.year_built || '2016'}</td>
                                    <td className="border border-slate-300 p-1 text-blue-700">{detail.uf_m2}</td>
                                    <td className="border border-slate-300 p-1 bg-blue-50/50">{detail.total_uf?.toLocaleString()}</td>
                                    <td className="border border-slate-300 p-1 text-slate-400">0,3</td>
                                    <td className="border border-slate-300 p-1 text-slate-500">{((detail.total_uf || 0) * 0.7).toFixed(1)}</td>
                                    <td className="border border-slate-900 p-1 bg-slate-50 text-slate-400">0</td>
                                    <td className="border border-slate-900 p-1 bg-slate-100 font-black">{detail.total_uf?.toLocaleString()}</td>
                                    <td className="border border-slate-900 p-1 bg-slate-200 font-black text-right pr-2">${((detail.total_uf || 0) * ufValue).toLocaleString('es-CL')}</td>
                                  </tr>
                                ))}
                                {/* Empty rows for aesthetic consistency */}
                                {[1, 2].map(i => (
                                  <tr key={`empty-c-${i}`} className="h-4 border-b border-slate-100">
                                    <td className="border-r border-slate-300 bg-slate-50"></td>
                                    {Array.from({length: 12}).map((_, j) => <td key={j} className="border-r border-slate-300"></td>)}
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-slate-800 text-white font-black uppercase text-[9px] border-t-2 border-slate-900">
                                <tr>
                                  <td colSpan={3} className="border border-slate-700 p-1.5 text-right italic pr-4">Sub Total Construcciones</td>
                                  <td className="border border-slate-700 p-1 text-center bg-slate-700">{valuation.valuation_breakdown?.buildings?.m2?.toLocaleString()} m2</td>
                                  <td colSpan={2} className="border border-slate-700 text-slate-400 font-normal">m2</td>
                                  <td className="border border-slate-700 p-1 text-blue-300 text-center">{valuation.valuation_breakdown?.buildings?.uf_m2_avg || 0} UF/m2</td>
                                  <td className="border border-slate-700 p-1 text-center bg-slate-700 font-black">{valuation.valuation_breakdown?.buildings?.total_uf?.toLocaleString()} UF</td>
                                  <td className="border border-slate-700"></td>
                                  <td className="border border-slate-700 p-1 text-center font-normal text-slate-400">{((valuation.valuation_breakdown?.buildings?.total_uf || 0) * 0.7).toFixed(0)} UF</td>
                                  <td className="border border-slate-900"></td>
                                  <td className="border border-slate-900 p-1.5 text-center bg-slate-900 text-blue-400 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">{valuation.valuation_breakdown?.buildings?.total_uf?.toLocaleString()} UF</td>
                                  <td className="border border-slate-900 p-1.5 text-right font-black bg-slate-900 text-blue-400 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] pr-2">${((valuation.valuation_breakdown?.buildings?.total_uf || 0) * ufValue).toLocaleString('es-CL')}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Total Project Summary - High Visibility */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl relative overflow-hidden mb-6">
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#1e3a8a_0%,transparent_50%)] opacity-30"></div>
                      <div className="relative z-10 text-center md:text-left">
                        <p className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center justify-center md:justify-start gap-2">
                           <Sparkles className="w-4 h-4" />
                           Resumen Garantía Total
                        </p>
                        <h2 className="text-4xl font-black tracking-tighter">Valor Total Combinado</h2>
                      </div>
                      <div className="relative z-10 text-center md:text-right border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-12">
                        <p className="text-3xl font-black text-blue-400">{formatCurrencyInline(valuation.valuation_breakdown?.total_uf || 0)}</p>
                        <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest font-bold">Tasación Final con Fines de Garantía</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comparables Table (Only for Basic or as fallback) */}
                {(!valuation.valuation_type || valuation.valuation_type === 'basic') && valuation.comparables && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                      Análisis de Comparables
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-gray-100">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 text-slate-500 text-xs font-bold">
                          <tr>
                            <th className="px-6 py-4">Fuente / Ubicación</th>
                            <th className="px-6 py-4 text-right">Precio (UF)</th>
                            <th className="px-6 py-4 text-right">Superficie (m²)</th>
                            <th className="px-6 py-4 text-right">Distancia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {valuation.comparables?.map((comp, idx) => (
                            <tr key={idx} className="text-sm hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-800">{comp.source || "N/A"}</td>
                              <td className="px-6 py-4 text-right font-bold text-blue-600">{(comp.price_uf || 0).toLocaleString()} UF</td>
                              <td className="px-6 py-4 text-right">{comp.m2 || 0} m²</td>
                              <td className="px-6 py-4 text-right text-slate-500">{comp.distance_km || 0} km</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3D Expert Appraiser Weighting Block - Printable */}
                <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50 text-left space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    Estudio de Modelación y Ponderación Científica de Valor
                  </h4>
                  <p className="text-[10px] text-slate-650 leading-relaxed font-sans">
                    Para este estudio de tasación, el algoritmo homogeneizador ha ponderado de forma progresiva tres etapas técnicas fundamentales, imitando las metodologías aplicadas por ingenieros y arquitectos tasadores certificados:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] leading-relaxed">
                    <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                      <span className="font-bold text-blue-700 uppercase tracking-wider block">Fase 1: Física Intrínseca</span>
                      <p className="text-slate-500">
                        Suelo base ajustado por clasificación de vía <strong>({valuation.property_data?.street_classification || 'Colectora'})</strong> y topografía <strong>({valuation.property_data?.topography || 'Plano'})</strong>. Edificación depreciada logarítmicamente bajo el modelo Ross-Heidecke utilizando antigüedad de <strong>{valuation.property_data?.year_built ? (2026 - Number(valuation.property_data.year_built)) : 10} años</strong> y estado <strong>"{valuation.property_data?.conservation_state || 'Bueno'}"</strong>.
                      </p>
                      <span className="font-bold text-slate-800 font-mono italic block pt-1 border-t border-slate-100">
                        Subtotal Físico: {(valuation.base_physical_price_uf || Math.round((valuation.estimated_price_uf || 0) * 0.85)).toLocaleString()} UF
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                      <span className="font-bold text-violet-700 uppercase tracking-wider block">Fase 2: Sinergia Normativa</span>
                      <p className="text-slate-500">
                        Incentivo constructivo por altura permitida de <strong>{valuation.property_data?.max_height || 18}m</strong> e índice de constructibilidad de <strong>{valuation.property_data?.constructability_index || 3.0}x</strong> en Zona Plan Regulador Comunal <strong>{valuation.property_data?.zoning_code || 'ESC1'}</strong>, optimizando la utilidad potencial de suelo.
                      </p>
                      <span className="font-bold text-slate-800 font-mono italic block pt-1 border-t border-slate-100">
                        Subtotal Normativo: {(valuation.normative_optimized_price_uf || Math.round((valuation.estimated_price_uf || 0) * 0.95)).toLocaleString()} UF
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                      <span className="font-bold text-emerald-700 uppercase tracking-wider block">Fase 3: Cruce Comercial</span>
                      <p className="text-slate-500">
                        Cotejo, ponderación y ajuste final de valor contrastado contra la cartera activa de publicaciones en venta e inteligencia del Biobío, equilibrando transacciones reales efectivas para minimizar la varianza de error.
                      </p>
                      <span className="font-bold text-emerald-700 font-mono text-xs block pt-1 border-t border-slate-100">
                        Tasación Final: {(valuation.market_crossed_price_uf || valuation.estimated_price_uf || 0).toLocaleString()} UF
                      </span>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-500 bg-white p-2 rounded border border-slate-150">
                    <strong>Resumen Explicativo de la Metodología:</strong> Esta progresión permite defender razonablemente el valor determinado frente a contrapartes financieras. La propiedad se valora en <strong>{(valuation.estimated_price_uf || 0).toLocaleString()} UF</strong> porque equilibra la depreciación de sus materiales construidos con el alto rendimiento de su normativa urbana y las referencias activas negociadas en el sector.
                  </div>
                </div>

                {/* Footer / Disclaimer */}
                <div className="pt-8 border-t border-gray-100 text-[10px] text-gray-400 leading-relaxed">
                  <p className="mb-2 font-bold">Aviso Legal:</p>
                  <p>
                    Este informe es una estimación generada mediante modelos de inteligencia artificial y análisis de datos masivos (Big Data). 
                    No constituye una tasación bancaria oficial ni legal. Los valores pueden variar según condiciones específicas del inmueble 
                    no detectadas por el modelo. Se recomienda la validación por un tasador certificado para operaciones financieras críticas.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center sticky bottom-0 z-20">
                <button 
                  onClick={() => setShowReport(false)}
                  className="text-gray-500 font-semibold hover:text-gray-700 transition-colors"
                >
                  Cerrar Vista
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={handleCopyResult}
                    className="flex items-center gap-2 bg-slate-800 text-white border border-slate-700 px-6 py-3 rounded-md font-semibold hover:bg-slate-900 transition-all"
                  >
                    <Copy className="w-5 h-5" />
                    Copiar Datos
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-6 py-3 rounded-md font-semibold hover:bg-slate-50 transition-all"
                  >
                    <FileText className="w-5 h-5" />
                    Imprimir
                  </button>
                  <button 
                    onClick={downloadPDF}
                    disabled={isDownloading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    {isDownloading ? "Procesando..." : "Descargar PDF"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PRCViewerModal 
        isOpen={isPRCModalOpen}
        onClose={() => setIsPRCModalOpen(false)}
        tipoInforme={tipoInforme}
        onUnlockPremium={() => {
          setIsPRCModalOpen(false);
          setTipoInforme('completo');
        }}
        propertyData={draftPropertyData || (valuation ? {
          address: valuation.property_data?.address_street,
          number: valuation.property_data?.address_number,
          commune: valuation.property_data?.commune,
          rol_manzana: valuation.property_data?.rol_manzana,
          rol_predio: valuation.property_data?.rol_predio,
          m2_total: valuation.property_data?.m2_total,
          gis_id: valuation.property_data?.gis_reference_id,
          zoning: valuation.property_data?.zoning_code,
          latitude: valuation.property_data?.latitude,
          longitude: valuation.property_data?.longitude,
          max_height: valuation.property_data?.max_height,
          constructability: valuation.property_data?.constructability_index,
          land_use: valuation.property_data?.land_use_coefficient,
          street_class: valuation.property_data?.street_classification
        } : {
          address: '',
          number: '',
          commune: '',
          rol_manzana: '',
          rol_predio: '',
          m2_total: 0,
          gis_id: '',
          zoning: '',
          latitude: undefined,
          longitude: undefined,
          max_height: undefined,
          constructability: undefined,
          land_use: undefined,
          street_class: undefined
        })}
      />
    </div>
  );
}
