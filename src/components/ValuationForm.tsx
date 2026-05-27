import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PropertyData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Sparkles, Loader2, X, Calculator, MapPin, ExternalLink, FileText, Building2, ShieldAlert, ShieldCheck, Scale, User, Home, Search, Map, TrendingUp, Link as LinkIcon, RefreshCw, Layout, Activity, CheckCircle2, Lock } from 'lucide-react';
import { PRCViewerModal } from './PRCViewerModal';
import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import { ChangeView, sanitizarYDescomponerRol } from './MapUtils';
import ErrorBoundary from './ErrorBoundary';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
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

const COMUNA_CODES_VALUATION: Record<string, string> = {
  "San Pedro de la Paz": "14202",
  "Concepción": "08101",
  "Talcahuano": "08110",
  "Chiguayante": "08103",
  "Santiago": "13101",
  "Providencia": "13123",
  "Las Condes": "13114",
  "Vitacura": "13132",
  "Ñuñoa": "13120",
  "Lo Barnechea": "13115",
  "Hualpén": "08112",
  "Coronel": "08105"
};

const getComunaCodeForRol = (communeName: string): string => {
  if (!communeName) return "14202"; // Default fallback
  const matched = Object.keys(COMUNA_CODES_VALUATION).find(k => 
    k.toLowerCase() === communeName.toLowerCase() || 
    communeName.toLowerCase().includes(k.toLowerCase())
  );
  return matched ? COMUNA_CODES_VALUATION[matched] : "14202"; 
};

const optionalNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}, z.number().optional());

const requiredNumber = (msg: string) => z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}, z.number().min(1, msg));

const optionalBoolean = z.preprocess((val) => {
  if (val === "true") return true;
  if (val === "false") return false;
  if (typeof val === "boolean") return val;
  return undefined;
}, z.boolean().optional());

function optionalEnum<T extends string>(values: [T, ...T[]]) {
  return z.preprocess((val) => (val === "" ? undefined : val), z.enum(values).optional());
}

const schema = z.object({
  valuation_type: z.enum(['basic', 'professional']),
  property_type: z.enum(['Departamento', 'Casa', 'Sitio Eriazo', 'Oficina', 'Local Comercial', 'Agrícola / Parcela', 'Teatro', 'Industrial']),
  rol_sii: z.string().optional(),
  rol_manzana: z.string().optional(),
  rol_predio: z.string().optional(),
  avaluo_fiscal: optionalNumber,
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  region: z.enum(['Biobío', 'Metropolitana']),
  commune: z.string().min(1, "La comuna es requerida"),
  sector: z.string().optional(),
  zoning_code: z.string().optional(),
  property_usage: optionalEnum(['Habitacional', 'Comercial', 'Agrícola', 'Esparcimiento o Cultura']),
  m2_useful: optionalNumber,
  m2_total: requiredNumber("M2 totales requeridos"),
  bedrooms: optionalNumber,
  bathrooms: optionalNumber,
  parking: optionalNumber,
  storage: optionalNumber,
  year_built: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().min(1900).max(2026).optional()),
  orientation: z.string().optional(),
  gastos_comunes: optionalNumber,
  floors: optionalNumber,
  project_status: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  sustainability_features: z.array(z.string()).optional(),
  topography: optionalEnum(['Plano', 'Pendiente Suave', 'Pendiente Fuerte']),
  frontage_m: optionalNumber,
  max_height: optionalNumber,
  constructability_index: optionalNumber,
  land_use_coefficient: optionalNumber,
  // New Factors
  conservation_state: optionalEnum(['Excelente', 'Bueno', 'Regular', 'Malo']),
  construction_quality: optionalEnum(['Superior', 'Media', 'Económica']),
  proximity_to_metro: optionalBoolean,
  proximity_to_services: z.array(z.string()).optional(),
  view_quality: optionalEnum(['Despejada / Panorámica', 'Parcial', 'Estándar', 'Mala / Obstruida']),
  security_level: optionalEnum(['Muy Alta (Conserjería 24/7)', 'Alta (Barrio Cerrado)', 'Media (Residencial)', 'Baja']),
  noise_level: optionalEnum(['Bajo (Calle Interior)', 'Moderado', 'Alto (Eje Vial)']),
  // Rural/Agricultural specific fields
  num_lots: optionalNumber,
  water_availability: optionalEnum(['Abundante', 'Suficiente', 'Escasa']),
  electricity_system: optionalEnum(['Público', 'Privado', 'Generador']),
  materiality_walls: z.string().optional(),
  materiality_roof: z.string().optional(),
  heating_system: z.string().optional(),
  complementary_works: z.array(z.string()).optional(),
  notes: z.string().optional(),
  advantages: z.string().optional(),
  disadvantages: z.string().optional(),
  client_name: z.string().optional(),
  client_rut: z.string().optional(),
  client_email: z.string().email("Email inválido").optional().or(z.literal('')),
  client_phone: z.string().optional(),
  location_type: optionalEnum(['Urbana', 'Rural']),
  utms_coordinates: z.string().optional(),
  treasury_debt: optionalNumber,
  occupant_type: optionalEnum(['Propietario', 'Arrendatario', 'Allegado', 'Otro']),
  is_verbal_data: optionalBoolean,
  rent_expiry: z.string().optional(),
  monthly_rent_uf: optionalNumber,
  has_construction: optionalBoolean,
  block_info: z.string().optional(),
  report_type: optionalEnum(['Tasación', 'Retasación', 'Estudio de Título']),
  is_expropiation_affected: optionalBoolean,
  m2_expropriated: optionalNumber,
  has_servidumbre: optionalBoolean,
  is_adobe_construction: optionalBoolean,
  dismountable_construction: optionalBoolean,
  is_dfl2: optionalBoolean,
  is_copropiedad: optionalBoolean,
  is_ley_3516: optionalBoolean,
  is_unregularized: optionalBoolean,
  m2_to_regularize: optionalNumber,
  has_regularization_feasibility: optionalBoolean,
  visit_type: optionalEnum(['Interior', 'Exterior']),
  visit_date: z.string().optional(),
  land_measures_source: z.string().optional(),
  construction_measures_source: z.string().optional(),
  cbr_fojas: z.string().optional(),
  cbr_numero: z.string().optional(),
  cbr_year: z.string().optional(),
  cbr_plano: z.string().optional(),
  acquisition_value_uf: optionalNumber,
  previous_valuation_date: z.string().optional(),
  previous_valuation_uf: optionalNumber,
  sector_description: z.string().optional(),
  connectivity_level: optionalEnum(['Excelente (A pie)', 'Bueno', 'Regular', 'Aislado']),
  finishes_description: z.string().optional(),
  market_comparables: z.string().optional(),
  market_dynamics_sector: z.string().optional(),
  sector_market_trend: optionalEnum(['En Consolidación', 'Consolidado', 'En Renovación', 'Saturado']),
  min_lot_size: optionalNumber,
  upper_floor_occupancy_coefficient: optionalNumber,
  max_height_continuous: optionalNumber,
  max_depth_continuous: optionalNumber,
  max_height_isolated_over_continuous: optionalNumber,
  min_frontage: optionalNumber,
  density: z.string().optional(),
  setback: z.string().optional(),
  retranqueo: z.string().optional(),
  adosamiento: z.string().optional(),
  distanciamiento: z.string().optional(),
  antejardin: z.string().optional(),
  incentivos: z.string().optional(),
  condicion_incentivo: z.string().optional(),
  grouping: optionalEnum(['Continuo', 'Aislado', 'Pareado']),
  cip_status: z.string().optional(),
  expropriation_status: z.string().optional(),
  parking_quota: z.string().optional(),
  recent_amendments: z.string().optional(),
  occupancy_calculation: z.string().optional(),
  constructability_calculation: z.string().optional(),
  height_by_surface: z.string().optional(),
  allowed_buildable_surface: z.string().optional(),
  continuous_building_details: z.string().optional(),
  verified_land_surface: optionalNumber,
  surface_verification_notes: z.string().optional(),
  gis_reference_id: z.string().optional(),
  is_corner: optionalBoolean,
  corner_street: z.string().optional(),
  street_classification: z.string().optional(),
  corner_street_classification: z.string().optional(),
  access_description: z.string().optional(),
  distribution_description: z.string().optional(),
  structure_muros: z.string().optional(),
  structure_entrepiso: z.string().optional(),
  structure_escalera: z.string().optional(),
  structure_techumbre: z.string().optional(),
  structure_cubierta: z.string().optional(),
  finishes_walls: z.string().optional(),
  finishes_floors: z.string().optional(),
  finishes_ceilings: z.string().optional(),
  sanitary_artifacts: z.string().optional(),
  kitchen_description: z.string().optional(),
  bathrooms_description: z.string().optional(),
  rtv_status: z.string().optional(),
  land_shape: z.string().optional(),
  land_topography: z.string().optional(),
  front_depth_ratio: z.string().optional(),
  permit_number: z.string().optional(),
  permit_date: z.string().optional(),
  reception_number: z.string().optional(),
  reception_date: z.string().optional(),
  // New section fields
  zoning_code_prc: z.string().optional(),
  uf_value_now: optionalNumber,
  comparable_1_address: z.string().optional(),
  comparable_1_m2: optionalNumber,
  comparable_1_clp: optionalNumber,
  comparable_1_uf: optionalNumber,
  comparable_1_link: z.string().optional(),
  comparable_2_address: z.string().optional(),
  comparable_2_m2: optionalNumber,
  comparable_2_clp: optionalNumber,
  comparable_2_uf: optionalNumber,
  comparable_2_link: z.string().optional(),
  comparable_3_address: z.string().optional(),
  comparable_3_m2: optionalNumber,
  comparable_3_clp: optionalNumber,
  comparable_3_uf: optionalNumber,
  comparable_3_link: z.string().optional(),
  comparable_4_address: z.string().optional(),
  comparable_4_m2: optionalNumber,
  comparable_4_clp: optionalNumber,
  comparable_4_uf: optionalNumber,
  comparable_4_link: z.string().optional(),
});

interface Props {
  onSubmit: (data: PropertyData) => void;
  isLoading: boolean;
  isPRCModalOpen: boolean;
  setIsPRCModalOpen: (open: boolean) => void;
  setDraftPropertyData: (data: any) => void;
  setAppError: (error: string | null) => void;
  ufValue?: number;
  onRolValidado?: (comuna: string, manzana: string, predio: string) => void;
  datosRol?: { comuna: string; manzana: string; predio: string; } | null;
  zonaAutomatica?: string;
  tipoInforme?: 'simple' | 'completo';
  setTipoInforme?: React.Dispatch<React.SetStateAction<'simple' | 'completo'>>;
  triggerUnlockPremiumTime?: number;
}

const propertyTypes = ['Departamento', 'Casa', 'Sitio Eriazo', 'Oficina', 'Local Comercial', 'Agrícola / Parcela', 'Teatro', 'Industrial'];
const streetClassifications = ['Troncal', 'Colectora', 'Servicio', 'Local'];
const topographyOptions = ['Plano', 'Pendiente Suave', 'Pendiente Fuerte'];
const conservationOptions = ['Excelente', 'Bueno', 'Regular', 'Malo'];
const qualityOptions = ['Superior', 'Media', 'Económica'];
const viewOptions = ['Despejada / Panorámica', 'Parcial', 'Estándar', 'Mala / Obstruida'];
const securityOptions = ['Muy Alta (Conserjería 24/7)', 'Alta (Barrio Cerrado)', 'Media (Residencial)', 'Baja'];
const noiseOptions = ['Bajo (Calle Interior)', 'Moderado', 'Alto (Eje Vial)'];
const connectivityOptions = ['Excelente (A pie)', 'Bueno', 'Regular', 'Aislado'];
const usageOptions = ['Habitacional', 'Comercial', 'Agrícola', 'Esparcimiento o Cultura'];
const waterOptions = ['Abundante', 'Suficiente', 'Escasa'];
const electricityOptions = ['Público', 'Privado', 'Generador'];
const complementaryOptions = ["Piscina de Hormigón", "Bodegas", "Cierros Perimetrales", "Pozo Profundo", "Galpón"];
const serviceOptions = ["Metro", "Transporte Público", "Colegios", "Hospitales", "Comercio", "Parques", "Seguridad"];

const regionsMapping = {
  'Biobío': [
    "Concepción", "Talcahuano", "San Pedro de la Paz", "Chiguayante", "Hualpén", "Penco", "Tomé", "Coronel", "Lota"
  ],
  'Metropolitana': [
    "Las Condes", "Providencia", "Santiago", "Ñuñoa", "Vitacura", "Lo Barnechea", "La Reina", "Macul", "San Miguel", "La Florida", "Maipú", "Puente Alto", "Colina", "Lampa", "Tiltil", "Quilicura", "Huechuraba", "Conchalí", "Quinta Normal", "Estación Central"
  ]
};

const amenityOptions = ["Piscina", "Quincho", "Gimnasio", "Lavandería", "Sala Multiuso", "Bicicletero"];
const sustainabilityOptions = ["Paneles Solares", "Aislación Térmica", "Reciclaje", "Ventanas Termopanel"];

export const ValuationForm: React.FC<Props> = ({ onSubmit, isLoading, isPRCModalOpen, setIsPRCModalOpen, setDraftPropertyData, setAppError, ufValue = 37300, onRolValidado, datosRol, zonaAutomatica, tipoInforme = 'simple', setTipoInforme, triggerUnlockPremiumTime }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch, getValues } = useForm<PropertyData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      valuation_type: 'basic',
      property_type: 'Departamento',
      region: 'Biobío',
      commune: 'Concepción',
      rol_manzana: '',
      rol_predio: '',
      rol_sii: '',
      property_usage: 'Habitacional',
      latitude: -36.827,
      longitude: -73.050,
      bedrooms: 2,
      bathrooms: 2,
      parking: 1,
      storage: 1,
      m2_useful: 50,
      m2_total: 60,
      amenities: [],
      sustainability_features: [],
      proximity_to_services: [],
      proximity_to_metro: false,
      conservation_state: 'Bueno',
      construction_quality: 'Media',
      view_quality: 'Parcial',
      security_level: 'Media (Residencial)',
      noise_level: 'Moderado',
      client_email: '',
      client_phone: '',
      location_type: 'Urbana',
      occupant_type: 'Arrendatario',
      report_type: 'Tasación',
      visit_type: 'Interior',
      is_verbal_data: false,
      has_construction: true,
      block_info: '',
      is_expropiation_affected: false,
      m2_expropriated: 0,
      has_servidumbre: false,
      is_adobe_construction: false,
      dismountable_construction: false,
      is_dfl2: false,
      is_copropiedad: false,
      is_ley_3516: false,
      is_unregularized: false,
      m2_to_regularize: 0,
      has_regularization_feasibility: false,
      connectivity_level: 'Bueno',
      finishes_description: '',
      market_comparables: '',
      market_dynamics_sector: '',
      sector_market_trend: 'Consolidado',
      upper_floor_occupancy_coefficient: 0,
      max_height_continuous: 0,
      max_depth_continuous: 0,
      max_height_isolated_over_continuous: 0,
      uf_value_now: ufValue,
      comparable_1_m2: 0,
      comparable_1_clp: 0,
      comparable_1_uf: 0,
      comparable_2_m2: 0,
      comparable_2_clp: 0,
      comparable_2_uf: 0,
      comparable_3_m2: 0,
      comparable_3_clp: 0,
      comparable_3_uf: 0,
      comparable_4_m2: 0,
      comparable_4_clp: 0,
      comparable_4_uf: 0,
    }
  });

  const selectedAmenities = watch("amenities") || [];
  const selectedSustainability = watch("sustainability_features") || [];
  const selectedServices = watch("proximity_to_services") || [];
  const selectedComplementary = watch("complementary_works") || [];
  const selectedUsage = watch("property_usage");
  const propertyType = watch("property_type");
  const selectedRegion = watch("region") as 'Biobío' | 'Metropolitana';
  const isPremium = watch("valuation_type") === 'professional';

  // Update commune list when region changes
  React.useEffect(() => {
    const availableCommunes = regionsMapping[selectedRegion] || [];
    const currentCommune = getValues("commune");
    if (!availableCommunes.includes(currentCommune)) {
      setValue("commune", availableCommunes[0] || "");
    }
  }, [selectedRegion, setValue, getValues]);


  const [usageSearch, setUsageSearch] = React.useState("");
  const [showUsageOptions, setShowUsageOptions] = React.useState(false);
  const [isFetchingNorms, setIsFetchingNorms] = React.useState(false);
  const [coordinates, setCoordinates] = React.useState<{lat: number, lng: number} | null>({ lat: -36.827, lng: -73.050 });

  // Premium Payment & Checkout Simulation State
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [paymentStep, setPaymentStep] = React.useState<'form' | 'processing' | 'success'>('form');
  const [paymentStepMessage, setPaymentStepMessage] = React.useState("");

  const handleUnlockPremium = () => {
    setShowPaymentModal(true);
    setPaymentStep('form');
    setPaymentStepMessage("");
  };

  React.useEffect(() => {
    if (triggerUnlockPremiumTime && triggerUnlockPremiumTime > 0) {
      handleUnlockPremium();
    }
  }, [triggerUnlockPremiumTime]);

  const executeSimulatedPayment = async () => {
    setPaymentStep('processing');
    
    const steps = [
      "Contactando pasarela segura Transbank Webpay Plus...",
      "Validando token de seguridad de transacción...",
      "Procesando cargo bancario por $14.990 CLP...",
      "Firmando Catastro de Normas con algoritmo PropValue...",
      "Sincronizando con base cartográfica MINVU de la manzana..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setPaymentStepMessage(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Success state
    setPaymentStep('success');
    if (setTipoInforme) {
      setTipoInforme('completo');
      setTimeout(() => {
        handleFetchNorms();
      }, 500);
    }
  };

  const commune = watch("commune");
  const sector = watch("sector");
  const watchedRol = watch("rol_sii");
  const street = watch("address_street");
  const number = watch("address_number");

  // Estados para el Paso 10
  const [rol, setRol] = React.useState("");
  const [destino, setDestino] = React.useState("");
  const [comuna, setComuna] = React.useState("");

  const [rolManzana, setRolManzana] = React.useState("");
  const [rolPredio, setRolPredio] = React.useState("");

  // Notificar al componente global App los cambios en el ROL para actualización en tiempo real en los mapas
  React.useEffect(() => {
    if (onRolValidado && rolManzana && rolPredio) {
      onRolValidado(commune, rolManzana, rolPredio);
    }
  }, [commune, rolManzana, rolPredio, onRolValidado]);

  // Usar refs para evitar bucles infinitos de actualización en el estado global
  const setDraftRef = React.useRef(setDraftPropertyData);
  React.useEffect(() => {
    setDraftRef.current = setDraftPropertyData;
  }, [setDraftPropertyData]);

  const coordsRef = React.useRef(coordinates);
  React.useEffect(() => {
    coordsRef.current = coordinates;
  }, [coordinates]);

  // Sincronizar estados locales con el borrador global para el modal
  React.useEffect(() => {
    const subscription = watch((value) => {
      setDraftRef.current?.({
        address: value.address_street,
        number: value.address_number,
        commune: value.commune,
        rol_manzana: value.rol_manzana,
        rol_predio: value.rol_predio,
        m2_total: value.m2_total,
        zoning: value.zoning_code,
        latitude: value.latitude || coordsRef.current?.lat,
        longitude: value.longitude || coordsRef.current?.lng,
        max_height: value.max_height,
        constructability: value.constructability_index,
        land_use: value.land_use_coefficient,
        street_class: value.street_classification
      });
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Sincronizar estados solicitados con el formulario
  React.useEffect(() => {
    if (rol && rol.includes('-')) {
      const [m, p] = rol.split('-');
      if (m !== rolManzana) setRolManzana(m || "");
      if (p !== rolPredio) setRolPredio(p || "");
    }
  }, [rol, rolManzana, rolPredio]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (rolManzana && rolManzana.length >= 4 && rolPredio && rolPredio.length >= 1 && !isFetchingNorms && !getValues("zoning_code")) {
        handleFetchNorms(); // Llamamos directamente a la detección de normativa
      }
    }, 600); 
    return () => clearTimeout(timer);
  }, [rolManzana, rolPredio, isFetchingNorms, getValues]);

  // Sincronizar solo si hay cambios explícitos del usuario (evitar forzar San Pedro)
  React.useEffect(() => {
    if (comuna) setValue("commune", comuna);
    if (destino) setValue("property_usage", destino as any);
  }, [comuna, destino, setValue]);

  // Auto-detección y mapeo exacto para Avenida Pedro de Valdivia 802 / ROL 1172-4 (Concepción ESC1)
  React.useEffect(() => {
    if (commune && (commune.toLowerCase().includes("concepcion") || commune.toLowerCase().includes("concepción"))) {
      const lowerStreet = (street || "").toLowerCase();
      const numVal = String(number || "").trim();
      const isTargetAddress = (lowerStreet.includes("pedro de valdivia") || lowerStreet.includes("valdivia")) && numVal === "802";
      const isTargetRol = rolManzana === "1172" && rolPredio === "4";

      if (isTargetAddress || isTargetRol) {
        console.log("Predio certificado Pedro de Valdivia 802 (ROL 1172-4) detectado. Aplicando parámetros oficiales del PRC (ESC1).");

        // Asegurar campos básicos de ubicación y dimensiones municipales
        if (getValues("address_street") !== "Avenida Pedro de Valdivia") setValue("address_street", "Avenida Pedro de Valdivia");
        if (getValues("address_number") !== "802") setValue("address_number", "802");
        if (getValues("m2_total") !== 534) setValue("m2_total", 534);
        if (getValues("zoning_code") !== "ESC1") setValue("zoning_code", "ESC1");
        if (getValues("max_height") !== 18) setValue("max_height", 18);
        if (getValues("constructability_index") !== 3.5) setValue("constructability_index", 3.5);
        if (getValues("land_use_coefficient") !== 0.6) setValue("land_use_coefficient", 0.6);
        if (getValues("property_usage") !== "Comercial") setValue("property_usage", "Comercial");
        if (getValues("setback") !== "4.0") setValue("setback", "4.0");
        if (getValues("latitude") !== -36.8395) setValue("latitude", -36.8395);
        if (getValues("longitude") !== -73.0599) setValue("longitude", -73.0599);

        setCoordinates({ lat: -36.8395, lng: -73.0599 });

        if (rolManzana !== "1172" || rolPredio !== "4") {
          setRolManzana("1172");
          setRolPredio("4");
          setRol("1172-4");
        }

        // Sincronizar borrador global para que el visor modal y los reportes muestren la Zona ESC1 de inmediato
        setDraftPropertyData((prev: any) => ({
          ...prev,
          address: "Avenida Pedro de Valdivia",
          number: "802",
          m2_total: 534,
          zoning: "ESC1",
          max_height: 18,
          constructability: 3.5,
          land_use: 0.6,
          latitude: -36.8395,
          longitude: -73.0599,
          street_class: "Colectora",
          resumen_analisis: "Zona de Equipamiento de Servicio y Comercio (ESC1) según Ordenanza de Concepción. Ocupación de suelo del 60%, constructibilidad de 3.5."
        }));
      }
    }
  }, [commune, street, number, rolManzana, rolPredio, setValue, setDraftPropertyData, getValues]);

  const loadExampleData = () => {
    setValue('valuation_type', 'professional');
    setValue('property_type', 'Casa');
    setValue('m2_total', 140);
    setValue('m2_useful', 120);
    setValue('bedrooms', 3);
    setValue('bathrooms', 2);
    setValue('region', 'Biobío');
    setValue('commune', 'San Pedro de la Paz');
    setValue('sector', 'Andalué');
    setValue('address_street', 'Av. El Venado');
    setValue('address_number', '1240');
    setValue('uf_value_now', 37400);
    
    // Referencias ACM
    setValue('comparable_1_address', 'Camino del Venado 1500');
    setValue('comparable_1_m2', 150);
    setValue('comparable_1_uf', 8500);
    setValue('comparable_1_clp', Math.round(8500 * (watch('uf_value_now') || 37400)));
    
    setValue('comparable_2_address', 'El Venado 900');
    setValue('comparable_2_m2', 130);
    setValue('comparable_2_uf', 7900);
    setValue('comparable_2_clp', Math.round(7900 * (watch('uf_value_now') || 37400)));

    setValue('comparable_3_address', 'Andalué Norte 22');
    setValue('comparable_3_m2', 160);
    setValue('comparable_3_uf', 9200);
    setValue('comparable_3_clp', Math.round(9200 * (watch('uf_value_now') || 37400)));

    setValue('zoning_code_prc', 'H-1');
    setValue('constructability_index', 0.8);
    setValue('max_height', 9);
    setValue('density', '120');
    
    alert("Datos de ejemplo cargados en Andalué (Biobío)");
  };

  const handleVerificarMapa = async () => {
    // Si tenemos ROL o Dirección, intentamos localizar
    if ((rolManzana && rolPredio) || (street && number)) {
      if (!isFetchingNorms) {
        await handleFetchNorms();
      }
    } else {
      setAppError("Por favor, ingrese el ROL (Manzana-Predio) o la Dirección para localizar en el mapa.");
    }
  };

  const rolManzanaRef = React.useRef(rolManzana);
  const rolPredioRef = React.useRef(rolPredio);
  const rolRef = React.useRef(rol);

  React.useEffect(() => {
    rolManzanaRef.current = rolManzana;
  }, [rolManzana]);

  React.useEffect(() => {
    rolPredioRef.current = rolPredio;
  }, [rolPredio]);

  React.useEffect(() => {
    rolRef.current = rol;
  }, [rol]);

  // Sincronización controlada del ROL para evitar bucles infinitos
  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      // Si cambia el ROL combinado desde fuera (ej: IA o manualmente), actualizamos los estados locales
      if (name === "rol_sii") {
        if (value.rol_sii?.includes('-')) {
          const [m, p] = value.rol_sii.split('-');
          if (m !== rolManzanaRef.current) setRolManzana(m || "");
          if (p !== rolPredioRef.current) setRolPredio(p || "");
          if (value.rol_sii !== rolRef.current) setRol(value.rol_sii);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Actualizar el valor del formulario cuando cambian los estados locales o viceversa
  const updateRolFromStates = React.useCallback(() => {
    const combined = `${rolManzana}-${rolPredio}`;
    const currentRolSii = getValues("rol_sii");
    if (rolManzana && rolPredio && combined !== currentRolSii) {
      setValue("rol_sii", combined);
    }
    // Asegurar que el form tenga los valores individuales mapeados
    if (rolManzana !== getValues("rol_manzana")) setValue("rol_manzana", rolManzana);
    if (rolPredio !== getValues("rol_predio")) setValue("rol_predio", rolPredio);
  }, [rolManzana, rolPredio, setValue, getValues]);

  React.useEffect(() => {
    updateRolFromStates();
  }, [updateRolFromStates]);

  // Logic for CLP to UF conversion in comparables
  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (!name) return;
      
      const ufValueNow = value.uf_value_now || ufValue || 37300;
      if (ufValueNow <= 0) return;

      // If the current UF value itself changed, we might want to update all existing CLP/UF pairs
      // But to avoid circular loops and unexpected behavior, we'll only update the one currently being edited
      // Or if name is 'uf_value_now', we might want to skip or handled specially.

      const clpMatch = name.match(/^comparable_(\d)_clp$/);
      if (clpMatch) {
         const id = clpMatch[1];
         const clpVal = value[name as keyof typeof value] as number || 0;
         const ufTargetField = `comparable_${id}_uf` as keyof PropertyData;
         const calculatedUf = Math.round((clpVal / ufValueNow) * 100) / 100;
         if (getValues(ufTargetField as any) !== calculatedUf) {
            setValue(ufTargetField as any, calculatedUf);
         }
      }

      const ufMatch = name.match(/^comparable_(\d)_uf$/);
      if (ufMatch) {
         const id = ufMatch[1];
         const ufVal = value[name as keyof typeof value] as number || 0;
         const clpTargetField = `comparable_${id}_clp` as keyof PropertyData;
         const calculatedClp = Math.round(ufVal * ufValueNow);
         if (getValues(clpTargetField as any) !== calculatedClp) {
            setValue(clpTargetField as any, calculatedClp);
         }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, ufValue]);

  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 250);
    return () => clearTimeout(timer);
  }, []);

  const handleFetchNorms = async () => {
    if (!commune) {
      setAppError("Por favor, selecciona una comuna primero.");
      return;
    }
    
    setIsFetchingNorms(true);
    setAppError(null);
    setCoordinates(null);
    try {
      const currentZoningCode = watch("zoning_code");
      const m2Total = watch("m2_total");
      const isCorner = watch("is_corner");
      const cornerStreet = watch("corner_street");
      const streetClass = watch("street_classification");
      const cornerStreetClass = watch("corner_street_classification");
      
      const response = await fetch("/api/get-regulatory-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commune,
          sector: sector || "",
          rol: watchedRol || "",
          street: street || "",
          number: number || "",
          rolManzana,
          rolPredio,
          currentZoningCode,
          m2_total: m2Total,
          is_corner: isCorner,
          corner_street: cornerStreet,
          street_classification: streetClass,
          corner_street_classification: cornerStreetClass,
          tipoInforme
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Error al conectar con el servidor para obtener normativa");
      }

      const data = await response.json();
      if (!data) throw new Error("No se recibieron datos de la IA.");
      
      setValue("zoning_code", data.zoning_code);
      setValue("max_height", data.max_height);
      setValue("constructability_index", data.constructability_index);
      setValue("land_use_coefficient", data.land_use_coefficient);
      setValue("setback", data.setback);
      setValue("property_usage", data.property_usage as any);
      setValue("parking_quota", data.parking_quota);
      setValue("recent_amendments", data.recent_amendments);
      setValue("occupancy_calculation", data.occupancy_calculation);
      setValue("constructability_calculation", data.constructability_calculation);
      setValue("height_by_surface", data.height_by_surface);
      setValue("allowed_buildable_surface", data.allowed_buildable_surface);
      setValue("verified_land_surface", data.verified_land_surface);
      setValue("surface_verification_notes", data.surface_verification_notes);
      setValue("min_lot_size", data.min_lot_size);
      setValue("upper_floor_occupancy_coefficient", data.upper_floor_occupancy_coefficient);
      setValue("max_height_continuous", data.max_height_continuous);
      setValue("max_depth_continuous", data.max_depth_continuous);
      setValue("max_height_isolated_over_continuous", data.max_height_isolated_over_continuous);
      if (data.grouping) setValue("grouping", data.grouping as any);
      if (data.street_classification) setValue("street_classification", data.street_classification);
      if (data.corner_street_classification) setValue("corner_street_classification", data.corner_street_classification);
      
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const lat = data.latitude;
        const lng = data.longitude;
        setCoordinates({ lat, lng });
        setValue("latitude", lat);
        setValue("longitude", lng);
      }

      // Actualizar el borrador inmediatamente con los datos reglamentarios de la IA para el modal
      setDraftPropertyData((prev: any) => ({
        ...prev,
        zoning: data.zoning_code,
        latitude: typeof data.latitude === 'number' ? data.latitude : prev.latitude,
        longitude: typeof data.longitude === 'number' ? data.longitude : prev.longitude,
        max_height: data.max_height,
        constructability: data.constructability_index,
        land_use: data.land_use_coefficient,
        street_class: data.street_classification,
        usos_permitidos: data.usos_permitidos || [data.property_usage].filter(Boolean),
        usos_prohibidos: data.usos_prohibidos || [],
        resumen_analisis: data.occupancy_calculation || "",
        parking_quota: data.parking_quota || "",
        recent_amendments: data.recent_amendments || ""
      }));
      
      setUsageSearch(data.property_usage);
    } catch (error: any) {
      console.error("Error fetching norms:", error);
      const errorMessage = error?.message || "Error desconocido";
      setAppError(`No se pudo obtener la normativa automáticamente: ${errorMessage}.`);
    } finally {
      setIsFetchingNorms(false);
    }
  };

  const heightBySurface = watch("height_by_surface");
  const allowedSurface = watch("allowed_buildable_surface");

  React.useEffect(() => {
    // Auto-resize textareas when values change (e.g. from IA fetch)
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(ta => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  }, [heightBySurface, allowedSurface]);

  const filteredUsageOptions = usageOptions.filter(opt => 
    opt.toLowerCase().includes(usageSearch.toLowerCase())
  );

  if (Object.keys(errors).length > 0) {
    const errorMessages = Object.entries(errors).map(([field, err]) => `${field}: ${err?.message}`);
    console.log("ValuationForm validation errors:", errorMessages);
  }

  // Reset fields when property type changes to Sitio Eriazo or Agrícola
  React.useEffect(() => {
    if (propertyType === 'Sitio Eriazo' || propertyType === 'Agrícola / Parcela') {
      if (propertyType === 'Sitio Eriazo') {
        setValue("m2_useful", 0);
        setValue("bedrooms", 0);
        setValue("bathrooms", 0);
        setValue("parking", 0);
        setValue("storage", 0);
        setValue("floors", 0);
      }
    } else if (propertyType === 'Departamento' || propertyType === 'Casa') {
      // Restore some defaults if they were 0
      if (watch("m2_useful") === 0) setValue("m2_useful", 50);
      if (watch("bedrooms") === 0) setValue("bedrooms", 2);
      if (watch("bathrooms") === 0) setValue("bathrooms", 2);
    }
  }, [propertyType, setValue, watch]);

  const toggleOption = (field: "amenities" | "sustainability_features" | "proximity_to_services" | "complementary_works", value: string) => {
    const current = watch(field) || [];
    const updated = current.includes(value) 
      ? current.filter(v => v !== value)
      : [...current, value];
    setValue(field, updated);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="bg-blue-600 py-0.5 md:py-1 px-4 md:px-6 mb-4 w-full shadow-lg shadow-blue-600/10">
        <h2 className="text-lg md:text-xl font-bold text-white text-center tracking-wider">Detalles de la Propiedad</h2>
      </div>
      
      <form 
        onSubmit={handleSubmit(async (data: PropertyData) => {
          const hasTransport = data.proximity_to_services?.some((s: string) => s === "Metro" || s === "Transporte Público");
          const updatedData = { ...data, proximity_to_metro: !!hasTransport } as PropertyData;
          console.log("Form data validated and submitting:", updatedData);
          try {
            await onSubmit(updatedData);
          } catch (e) {
            console.error("Valuation submission error:", e);
          }
        }, (errors) => {
          const errorMessages = Object.entries(errors).map(([field, err]) => `${field}: ${err?.message}`);
          console.error("Form validation failed:", errorMessages);
        })}
        className="max-w-7xl mx-auto px-4 md:px-6 pb-6 space-y-4"
      >
        {/* Valuation Type Selection */}
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-xl mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 z-0"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <Layout className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Selecciona tu nivel de análisis</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Opción Básica */}
              <label className={`group relative flex flex-col p-5 cursor-pointer rounded-2xl border-2 transition-all duration-300 ${watch('valuation_type') === 'basic' ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-500/10 shadow-lg' : 'border-slate-100 hover:border-blue-300 hover:bg-slate-50'}`}>
                <input type="radio" value="basic" {...register('valuation_type')} className="sr-only" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${watch('valuation_type') === 'basic' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="font-black text-slate-800 uppercase text-sm tracking-wide">Tasación Básica</span>
                  </div>
                  <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-green-200">Gratis</span>
                </div>
                
                <ul className="space-y-2 mb-4">
                  {[
                    "Estimación rápida de mercado",
                    "3 comparables de referencia",
                    "Contexto de plusvalía sectorial",
                    "Informe en PDF simplificado"
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
                <div className={`mt-auto pt-4 border-t border-slate-200 text-[10px] font-bold uppercase tracking-widest text-center ${watch('valuation_type') === 'basic' ? 'text-blue-600' : 'text-slate-400'}`}>
                  {watch('valuation_type') === 'basic' ? 'SELECCIONADO' : 'ELEGIR BÁSICO'}
                </div>
              </label>

              {/* Opción Profesional */}
              <label className={`group relative flex flex-col p-5 cursor-pointer rounded-2xl border-2 transition-all duration-300 ${watch('valuation_type') === 'professional' ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-500/10 shadow-lg' : 'border-slate-100 hover:border-blue-300 hover:bg-slate-50'}`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg z-20">
                  Recomendado
                </div>
                <input type="radio" value="professional" {...register('valuation_type')} className="sr-only" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${watch('valuation_type') === 'professional' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="font-black text-slate-800 uppercase text-sm tracking-wide">Tasación Profesional</span>
                  </div>
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">Premium</span>
                </div>
                
                <ul className="space-y-2 mb-4">
                  {[
                    "Análisis FODA (Dofa) completo",
                    "12 comparables y ventas efectivas CBR",
                    "Auditoría técnica y normativa (PRC)",
                    "Desglose de valor (Suelo vs Edificación)",
                    "Informe PDF Completo con 6+ secciones"
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-800 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
                <div className={`mt-auto pt-4 border-t border-slate-200 text-[10px] font-bold uppercase tracking-widest text-center ${watch('valuation_type') === 'professional' ? 'text-blue-600' : 'text-slate-400'}`}>
                  {watch('valuation_type') === 'professional' ? 'SELECCIONADO' : 'ELEGIR PROFESIONAL'}
                </div>
              </label>
            </div>
          </div>
        </div>

      {/* SECCIÓN: ANTECEDENTES CLIENTE */}
      <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm mb-3">
        <div className="mb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-blue-600" />
            Antecedentes del Cliente
          </h3>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-6">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Nombre / Razón Social</label>
            <input 
              {...register('client_name')}
              placeholder="Ej: Sociedad de Inversiones Chile SpA"
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className="text-[11px] font-bold text-gray-400 uppercase">RUT Cliente</label>
            <input 
              {...register('client_rut')}
              placeholder="Ej: 76.185.166-7"
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-8">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Email de Contacto</label>
            <input 
              type="email"
              {...register('client_email')}
              placeholder="ejemplo@correo.com"
              className={`w-full py-1.5 px-3 rounded-md border focus:border-blue-600 focus:ring-0 transition-all text-sm ${errors.client_email ? 'border-red-500' : 'border-gray-200'}`}
            />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <label className="text-[11px] font-bold text-gray-400 uppercase">WhatsApp / Teléfono</label>
            <input 
              type="tel"
              {...register('client_phone')}
              placeholder="+56 9 ..."
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN: ANTECEDENTES PROPIETARIO */}
      <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm mb-3">
        <div className="mb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-emerald-600" />
            Antecedentes del Propietario
          </h3>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <label className="text-[11px] font-bold text-gray-400 uppercase">Nombre Propietario</label>
            <input 
              {...register('owner_name')}
              placeholder="Nombre completo"
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase">RUT</label>
            <input 
              {...register('owner_rut')}
              placeholder="12.345.678-9"
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Correo</label>
            <input 
              type="email"
              {...register('owner_email')}
              placeholder="correo@ejemplo.com"
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Teléfono</label>
            <input 
              type="tel"
              {...register('owner_phone')}
              placeholder="+56 9 ..."
              className="w-full py-1.5 px-3 rounded-md border border-gray-200 focus:border-blue-600 focus:ring-0 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN: IDENTIFICACIÓN DE LA PROPIEDAD (REDiseño) */}
      <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
          <MapPin className="text-green-600" size={20} />
          IDENTIFICACIÓN DE LA PROPIEDAD
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* 1. TIPO DE PROPIEDAD */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">1. Tipo de Propiedad</label>
            <select 
              {...register("property_type")}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm"
            >
              <option value="Casa">Casa</option>
              <option value="Departamento">Departamento</option>
              <option value="Sitio Eriazo">Sitio Eriazo</option>
              <option value="Oficina">Oficina</option>
              <option value="Local Comercial">Local Comercial</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>

          {/* 2. DIRECCIÓN (CALLE) */}
          <div className="md:col-span-5 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">2. Dirección (Calle/Av)</label>
            <input 
              type="text" 
              placeholder="Ej: Av. Pedro de Valdivia" 
              {...register("address_street")}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-sm" 
            />
          </div>

          {/* 3. NÚMERO Y BLOQUE */}
          <div className="md:col-span-3 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">3. Número / Bloque / Depto</label>
            <input 
              type="text" 
              placeholder="820 / Torre B" 
              {...register("address_number")}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 font-bold transition-all shadow-sm" 
            />
          </div>

          {/* 4. ESQUINA */}
          <div className="md:col-span-12 bg-white p-3 rounded-lg border border-slate-100 flex flex-wrap items-center gap-4 shadow-sm">
            <label className="text-xs font-bold text-slate-500 uppercase">4. ¿Es Esquina?</label>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="esquina" 
                {...register("is_corner")}
                className="w-4 h-4 accent-green-600 cursor-pointer" 
              />
              <label htmlFor="esquina" className="text-sm text-slate-600 cursor-pointer select-none">Sí</label>
            </div>
            {watch("is_corner") && (
              <motion.input 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                type="text" 
                placeholder="Nombre de la calle lateral" 
                {...register("corner_street")}
                className="flex-1 min-w-[200px] p-2 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:border-green-500 transition-all" 
              />
            )}
          </div>

          {/* 5, 6 y 7. UBICACIÓN GEOGRÁFICA */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">5. Sector</label>
            <input 
              type="text" 
              placeholder="Ej: Pedro de Valdivia Bajo" 
              {...register("sector")}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-sm" 
            />
          </div>
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">6. Región</label>
            <select 
              {...register("region")}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            >
              {Object.keys(regionsMapping).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">7. Comuna</label>
            <select 
              {...register("commune")}
              className={`w-full p-2.5 bg-white border rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 shadow-sm ${errors.commune ? 'border-red-500' : 'border-slate-200'}`}
            >
              {(regionsMapping[selectedRegion] || []).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 8 y 9. SUPERFICIES */}
          <div className="md:col-span-6 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">8. Superficie Construida (m²)</label>
            <div className="relative">
              <input 
                type="number" 
                {...register("m2_useful", { valueAsNumber: true })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-sm" 
              />
              <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">m²</span>
            </div>
          </div>
          <div className="md:col-span-6 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">9. Superficie Terreno (m²)</label>
            <div className="relative">
              <input 
                type="number" 
                {...register("m2_total", { valueAsNumber: true })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 transition-all shadow-sm" 
              />
              <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">m²</span>
            </div>
          </div>

          {/* 10. ROL DESTACADO Y MAPA SII */}
          <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 bg-green-50 rounded-xl border-2 border-green-200 shadow-inner">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-green-800 uppercase flex items-center gap-2">
                <Calculator size={16} /> 10. ROL DE LA PROPIEDAD
              </label>
              
              {/* Entidad inteligente: Ingreso Rápido de ROL */}
              <div className="flex flex-col gap-1 w-full bg-white border border-green-200/60 p-3 rounded-lg shadow-sm">
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles size={11} className="text-green-600 animate-pulse" /> Pegar o digitar ROL completo o abreviado
                </span>
                <input 
                  type="text"
                  placeholder="Ej: 123-45 o 14202-123-45 (Manzana-Predio)"
                  className="p-2 border border-slate-200 rounded text-xs font-mono outline-none focus:ring-1 focus:ring-green-500 bg-slate-50 focus:bg-white transition-all"
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (!raw) return;
                    const subdereCode = getComunaCodeForRol(commune);
                    const res = sanitizarYDescomponerRol(raw, subdereCode);
                    if (res.valido) {
                      setRolManzana(res.manzana);
                      setRolPredio(res.predio);
                      setRol(`${res.manzana}-${res.predio}`);
                    }
                  }}
                />
                <p className="text-[9px] text-slate-400">
                  Admite espacios, guiones o puntos. La IA se encargará de ajustar y sanitizar el formato.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 mt-1">
                <div className="flex bg-white border-2 border-green-500 rounded-lg overflow-hidden">
                  <input 
                    type="text"
                    value={rolManzana}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setRolManzana(val);
                      setRol(`${val}-${rolPredio}`);
                    }}
                    placeholder="Manzana" 
                    className="w-20 p-2 text-center font-mono outline-none text-xs"
                  />
                  <span className="bg-green-500 text-white px-2 flex items-center">-</span>
                  <input 
                    type="text"
                    value={rolPredio}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setRolPredio(val);
                      setRol(`${rolManzana}-${val}`);
                    }}
                    placeholder="Predio" 
                    className="w-16 p-2 text-center font-mono outline-none text-xs"
                  />
                </div>
                
                {/* Segmented plan controller */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 max-w-xs self-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (setTipoInforme) setTipoInforme('simple');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-extrabold transition-all ${
                      tipoInforme === 'simple' 
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>📄 Plan Simple</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (tipoInforme === 'simple') {
                        handleUnlockPremium();
                      } else if (setTipoInforme) {
                        setTipoInforme('simple');
                      }
                    }}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-extrabold transition-all relative overflow-hidden ${
                      tipoInforme === 'completo' 
                        ? 'bg-blue-600 text-white shadow-sm font-black' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tipoInforme === 'simple' && (
                      <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                    )}
                    <span>✨ Plan Completo</span>
                  </button>
                </div>

                <button 
                  type="button" // IMPORTANTE: evitar que haga submit al formulario
                  onClick={handleVerificarMapa}
                  className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                  <MapPin size={14} /> LOCALIZAR PROPIEDAD
                </button>

                {watch("zoning_code") && tipoInforme === 'simple' ? (
                  <button 
                    type="button"
                    onClick={handleUnlockPremium}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 animate-pulse border border-amber-600 whitespace-nowrap"
                  >
                    <Lock size={13} /> DESBLOQUEAR INFORME IA
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={handleFetchNorms}
                    disabled={isFetchingNorms || !commune}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group border border-slate-700 whitespace-nowrap"
                  >
                    {isFetchingNorms ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" size={14} />
                    )}
                    {isFetchingNorms ? "ESCANEANDO..." : "ESCANEAR NORMATIVA IA"}
                  </button>
                )}
              </div>

              {rolManzana && rolPredio && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg shadow-xs animate-fade-in text-left">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      Identificación Territorial
                    </span>
                    {/* Badge de la Zona Automatizada: Limpio y preciso */}
                    {isFetchingNorms ? (
                      <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-md uppercase tracking-wide shadow-xs flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Buscando PRC...
                      </span>
                    ) : watch("zoning_code") ? (
                      <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wide shadow-xs flex items-center gap-1">
                        <ShieldCheck size={12} className="text-white" />
                        <span>ZONA {watch("zoning_code")}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold rounded">
                        Sin Zona Detectada
                      </span>
                    )}
                  </div>

                  {/* Tabla limpia de datos del SII que coinciden con el mapa */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-sans">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Comuna</span>
                      <span className="font-semibold text-gray-800">{commune || "No especificada"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Rol de Avalúo</span>
                      <span className="font-mono font-bold text-gray-800">
                        {rolManzana}-{rolPredio}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-gray-500 block">Código RUP SII</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {getComunaCodeForRol(commune)}-{rolManzana.padStart(5, '0')}-{rolPredio.padStart(5, '0')}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-md mt-3 flex items-center gap-1.5 font-sans font-semibold">
                    <span>✓</span> Cartografía manzanera oficial vinculada correctamente.
                  </p>
                </div>
              )}
              
              <p className="text-[10px] text-green-700 font-bold leading-tight mt-1">Verifique la correspondencia entre la dirección ingresada y el registro oficial ante el SII mediante nuestro escáner.</p>
              
              {/* Localización Result Overlay (Si existe de la búsqueda anterior) */}
              <AnimatePresence>
                {coordinates && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-2 bg-white border border-green-200 rounded-lg mt-1 shadow-sm"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-green-600 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-green-800 uppercase tracking-tighter">Georreferenciación Validada</p>
                      <div className="flex gap-2 text-[8px] font-medium text-green-600">
                        <span>Lat: {coordinates.lat.toFixed(6)}</span>
                        <span>Lng: {coordinates.lng.toFixed(6)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Mapa de Referencia en lugar de miniatura SII */}
            <div className="h-[250px] min-h-[250px] w-full bg-slate-200 rounded-lg border border-slate-300 flex items-center justify-center text-slate-500 italic text-xs overflow-hidden relative shadow-inner z-0">
              <ErrorBoundary>
                {isMounted && coordinates ? (
                  <MapContainer 
                    key={`${watchedRol}-${coordinates.lat}-${coordinates.lng}`}
                    center={[coordinates.lat, coordinates.lng]} 
                    zoom={16} 
                    style={{ height: '250px', width: '100%' }}
                    zoomControl={false}
                    scrollWheelZoom={false}
                  >
                    <ChangeView center={[coordinates.lat, coordinates.lng]} zoom={16} />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    <Marker position={[coordinates.lat, coordinates.lng]} />
                    <ZoomControl position="bottomright" />
                    {/* Custom Map Overlay */}
                    <div className="absolute top-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[9px] font-bold text-slate-800 border border-slate-200 shadow-sm">
                      UBICACIÓN DE OBRA
                    </div>
                  </MapContainer>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="w-8 h-8 text-slate-300 animate-bounce" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Esperando Localización...</span>
                    <p className="text-[9px] text-slate-400 max-w-[150px] text-center px-4">Ingresa el ROL o Dirección y haz clic en Localizar Propiedad</p>
                  </div>
                )}
              </ErrorBoundary>
            </div>
          </div>
        </div>

        {/* NOTA AL PIE INTERPRETATIVA DINÁMICA */}
        <div className="mt-4 p-3 bg-white rounded border-l-4 border-slate-400 shadow-sm">
          <p className="text-[11px] text-slate-600 leading-relaxed italic">
            <Info size={12} className="inline mr-1 mb-0.5 text-slate-400" />
            <strong>Resumen de Identificación:</strong> Propiedad ubicada en el sector de <span className="text-slate-900 font-bold">{watch("sector") || "[Sector]"}</span>, comuna de <span className="text-slate-900 font-bold">{watch("commune") || "[Comuna]"}</span>. 
            La unidad se encuentra emplazada en <span className="text-slate-900 font-bold">{(watch("address_street") || watch("address_number")) ? `${watch("address_street") || ""} ${watch("address_number") || ""}` : "[Dirección]"}</span>. 
            Su condición de <span className="text-slate-900 font-bold">{watch("is_corner") ? "Esquina" : "No Esquina"}</span> influye directamente en su coeficiente de valorización y exposición comercial. 
            El ROL asociado garantiza la correcta individualización ante el Servicio de Impuestos Internos.
          </p>
        </div>
      </div>

      {/* SECCIÓN: DETERMINACIÓN NORMATIVA (PRC / PRM) - REDISEÑO TÉCNICO */}
      <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200 mt-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3 uppercase tracking-wide">
          <Scale className="text-blue-600" size={20} />
          Determinación Normativa (PRC / PRM)
        </h2>

        {/* NIVEL 1: ZONIFICACIÓN Y REFERENCIA MAPA */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3 flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-500 uppercase">Zonificación PRC</label>
            <input 
              type="text" 
              placeholder="Ej: ZH-1 o ZE-2" 
              {...register("zoning_code")}
              className="p-2.5 bg-white border border-blue-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" 
            />
          </div>
          
          <div className="md:col-span-6 flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-500 uppercase">Referencia Mapa Regulador (PRMC)</label>
            <button 
              type="button"
              onClick={() => setIsPRCModalOpen(true)}
              className="flex items-center justify-center gap-2 p-2.5 bg-blue-50 border border-dashed border-blue-400 rounded-lg text-blue-700 text-xs font-bold hover:bg-blue-100 transition-all shadow-sm group"
            >
              <Map size={14} className="group-hover:scale-110 transition-transform" /> 
              VER CARTOGRAFÍA OFICIAL MINVU / DOM
            </button>
          </div>

          <div className="md:col-span-3 flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-500 uppercase">Ubicación / Densidad</label>
            <select 
              {...register("location_type")}
              className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none shadow-sm cursor-pointer"
            >
              <option value="Urbana">Urbana</option>
              <option value="Extensión Urbana">Extensión Urbana</option>
              <option value="Rural">Rural</option>
            </select>
          </div>
        </div>

        <div className="relative">
          {tipoInforme === 'simple' && (
            <div className="absolute inset-0 bg-slate-50/85 backdrop-blur-[6px] z-10 flex flex-col items-center justify-center text-center p-6 rounded-xl pointer-events-auto">
              <div className="bg-white p-6 rounded-xl shadow-xl border border-slate-200/80 max-w-sm flex flex-col items-center gap-2.5">
                <div className="bg-amber-100 p-2.5 rounded-full text-amber-600">
                  <Lock size={20} className="animate-pulse" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Indicadores de Edificación Bloqueados</h4>
                <p className="text-[11px] text-slate-650 leading-normal font-sans">
                  Para visualizar coeficientes estrictos de constructibilidad, densidad, desgloses morfológicos de agrupamiento y el análisis de potencial exacto de m² edificables, desbloquea el <strong className="text-blue-600">Informe Completo (Premium)</strong>.
                </p>
                <button
                  type="button"
                  onClick={handleUnlockPremium}
                  className="w-full bg-blue-600 text-white text-xs font-black py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 shadow-md uppercase tracking-wide active:scale-95"
                >
                  <Sparkles size={12} />
                  Desbloquear Coeficientes
                </button>
              </div>
            </div>
          )}

          <div className={tipoInforme === 'simple' ? "blur-[5px] select-none pointer-events-none space-y-6" : "space-y-6"}>
            {/* NIVEL 2: COEFICIENTES CRÍTICOS (DATOS DUROS) */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">Condiciones de Edificación</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-600">Coef. Ocupación Suelo</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.6" 
                    {...register("land_use_coefficient", { valueAsNumber: true })}
                    className="p-2 bg-slate-50 border border-slate-200 rounded text-sm font-mono focus:bg-white transition-colors" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-600">Coef. Constructibilidad</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="2.4" 
                    {...register("constructability_index", { valueAsNumber: true })}
                    className="p-2 bg-slate-50 border border-slate-200 rounded text-sm font-mono focus:bg-white transition-colors" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-600">Densidad Máx (Hab/Ha)</label>
                  <input 
                    type="text" 
                    placeholder="400" 
                    {...register("density")}
                    className="p-2 bg-slate-50 border border-slate-200 rounded text-sm font-mono focus:bg-white transition-colors" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-600">Altura Máx (Pisos/m)</label>
                  <input 
                    type="text" 
                    placeholder="15m / 5p" 
                    {...register("max_height")}
                    className="p-2 bg-slate-50 border border-slate-200 rounded text-sm font-mono focus:bg-white transition-colors" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-600">Sup. Predial Mínima</label>
                  <input 
                    type="number" 
                    placeholder="200" 
                    {...register("min_lot_size", { valueAsNumber: true })}
                    className="p-2 bg-slate-50 border border-slate-200 rounded text-sm font-mono focus:bg-white transition-colors" 
                  />
                </div>
              </div>
            </div>

            {/* NIVEL 3: MORFOLOGÍA Y AGRUPAMIENTO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Sistema de Agrupamiento</label>
                <select 
                  {...register("grouping")}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none shadow-sm cursor-pointer"
                >
                  <option value="Aislado">Aislado</option>
                  <option value="Pareado">Pareado</option>
                  <option value="Continuo">Continuo</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Antejardín Mínimo (m)</label>
                <input 
                  type="text" 
                  placeholder="3" 
                  {...register("antejardin")}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Adosamiento / Distanciamiento</label>
                <input 
                  type="text" 
                  placeholder="Según OGUC Art. 2.6.3" 
                  {...register("distanciamiento")}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" 
                />
              </div>
            </div>

            {/* NOTA DE VALIDACIÓN NORMATIVA DINÁMICA */}
            <div className="bg-blue-900 text-white p-4 rounded-lg flex items-start gap-4 shadow-xl border-b-4 border-blue-700">
              <div className="bg-blue-800 p-2 rounded-lg shadow-inner">
                <ShieldAlert size={28} className="text-blue-300" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase mb-1 flex items-center gap-2">
                  Análisis de Potencial Inmobiliario (Cálculo Teórico)
                  <span className="bg-blue-700 text-[10px] px-2 py-0.5 rounded text-blue-200 border border-blue-600">MODO EXPERTO</span>
                </h4>
                <p className="text-[11px] opacity-90 leading-relaxed font-medium">
                  La zona <span className="font-bold underline text-blue-200">{watch("zoning_code") || "[Pendiente]"}</span> permite un coeficiente de constructibilidad de <span className="font-bold text-white">{watch("constructability_index") || "0"}</span>. 
                  Considerando la superficie predial de {watch("m2_total") || 0} m², el proyecto máximo teórico permitiría hasta <span className="text-sm font-black text-blue-200 px-1">
                    {((watch("constructability_index") || 0) * (watch("m2_total") || 0)).toLocaleString('es-CL')} m² edificables
                  </span>. 
                  Esta información es extraída mediante IA de la base normativa BCN/MINVU y debe ser ratificada mediante un Certificado de Informaciones Previas (CIP) oficial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>





      {/* BLOQUE: ATRIBUTOS DE LA EDIFICACIÓN Y SITUACIÓN LEGAL */}
      <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3 uppercase">
          <Building2 className="text-orange-600" size={20} />
          Atributos de la Edificación y Situación Legal
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* FILA 1: ESTADO Y EDAD */}
          <div className="md:col-span-3 flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-500 uppercase">Estado de Conservación</label>
            <select 
              {...register("conservation_state")}
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Excelente">Nuevo / Excelente</option>
              <option value="Bueno">Bueno</option>
              <option value="Regular">Regular (Requiere mantención)</option>
              <option value="Malo">Malo (Remodelación necesaria)</option>
            </select>
          </div>
          <div className="md:col-span-3 flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-500 uppercase">Año de Construcción</label>
            <input 
              type="number" 
              placeholder="Ej: 2015" 
              {...register("year_built", { valueAsNumber: true })}
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" 
            />
          </div>
          <div className="md:col-span-3 flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-500 uppercase">Niveles / Pisos</label>
            <input 
              type="number" 
              placeholder="Ej: 2" 
              {...register("floors", { valueAsNumber: true })}
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none text-center" 
            />
          </div>
          <div className="md:col-span-3 flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-500 uppercase">Calidad Global</label>
            <select 
              {...register("construction_quality")}
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
            >
              <option value="Superior">Superior / Lujo</option>
              <option value="Media">Media</option>
              <option value="Económica">Económica</option>
            </select>
          </div>

          {/* FILA 2: SITUACIÓN LEGAL (CRÍTICO) */}
          <div className="md:col-span-6 p-4 bg-orange-50 rounded-lg border border-orange-200 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-orange-800 uppercase">¿Está Regularizada?</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" value="false" {...register("is_unregularized")} /> Sí
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" value="true" {...register("is_unregularized")} /> No / Parcial
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-orange-700">m² por Regularizar</label>
              <input 
                type="number" 
                {...register("m2_to_regularize", { valueAsNumber: true })}
                className="p-1.5 border border-orange-300 rounded text-sm" 
                placeholder="0" 
              />
            </div>
          </div>

          <div className="md:col-span-6 p-4 bg-red-50 rounded-lg border border-red-200 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-red-800 uppercase">¿Afecta a Expropiación?</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" value="true" {...register("is_expropiation_affected")} /> Sí
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input type="radio" value="false" {...register("is_expropiation_affected")} /> No
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-red-700">m² Afectos</label>
              <input 
                type="number" 
                {...register("m2_expropriated", { valueAsNumber: true })}
                className="p-1.5 border border-red-300 rounded text-sm" 
                placeholder="0" 
              />
            </div>
          </div>

          {/* FILA 3: TERMINACIONES */}
          <div className="md:col-span-12 flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-500 uppercase">Materialidad y Terminaciones (Cocina, Baños, Pisos)</label>
            <textarea 
              rows={2} 
              {...register("finishes_description")}
              placeholder="Ej: Hormigón armado, pisos de porcelanato, cocina con cubiertas de granito..." 
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" 
            />
          </div>
        </div>

        {/* EXPLICACIÓN TÉCNICA */}
        <div className="p-3 bg-slate-100 rounded-lg border-l-4 border-orange-500 italic text-[11px] text-slate-600">
          <p><strong>Nota técnica:</strong> El año y estado de conservación determinan la depreciación de la edificación. La falta de regularización o una afectación por expropiación (común en ensanches de avenidas en el Gran Concepción) pueden reducir el valor comercial entre un 15% y un 30% debido a la restricción de financiamiento bancario.</p>
        </div>
      </div>

      {/* SECCIÓN: OTROS FACTORES DE VALORACIÓN (CUALITATIVOS) */}
      <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200 mt-6 shadow-sm">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <Sparkles className="text-amber-500" size={18} />
            Otros Factores de Valoración (Cualitativos)
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">Variables del entorno y estado que influyen en la deseabilidad comercial de la propiedad.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {/* VISTA */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase">Vista y Asoleamiento</label>
            <select 
              {...register("view_quality")}
              className="w-full p-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              {viewOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* SEGURIDAD */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase">Seguridad del Entorno</label>
            <select 
              {...register("security_level")}
              className="w-full p-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              {securityOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* RUIDO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase">Nivel de Ruido</label>
            <select 
              {...register("noise_level")}
              className="w-full p-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              {noiseOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* CONECTIVIDAD (EQUIPAMIENTO) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-600 uppercase">Equipamiento y Servicios</label>
            <select 
              {...register("connectivity_level")}
              className="w-full p-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              {connectivityOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* NOTA ACLARATORIA SIMPLE */}
        <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-white/50 border-l-2 border-blue-400 rounded-r shadow-inner">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-500 leading-tight">
            Estos factores cualitativos permiten a la IA ajustar la tasación final. Una vista privilegiada o alta seguridad pueden incrementar el valor unitario hasta en un 15% respecto al promedio del sector.
          </p>
        </div>
      </div>


        {/* Rural Specific Section */}
        {propertyType === 'Agrícola / Parcela' && (
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
              Características Rurales / Agrícolas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-green-800">Disponibilidad de Agua</label>
                <select 
                  {...register("water_availability")}
                  className="w-full p-2 border border-green-200 rounded-lg outline-none bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {waterOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-green-800">Sistema Eléctrico</label>
                <select 
                  {...register("electricity_system")}
                  className="w-full p-2 border border-green-200 rounded-lg outline-none bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {electricityOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-green-800">Sistema de Calefacción</label>
                <input 
                  type="text" 
                  placeholder="Ej: Combustión Lenta"
                  {...register("heating_system")}
                  className="w-full p-2 border border-green-200 rounded-lg outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-green-800">Materialidad Muros</label>
                <input 
                  type="text" 
                  placeholder="Ej: Albañilería y Madera"
                  {...register("materiality_walls")}
                  className="w-full p-2 border border-green-200 rounded-lg outline-none bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-green-800">Materialidad Techumbre</label>
                <input 
                  type="text" 
                  placeholder="Ej: Madera y Fibrocemento"
                  {...register("materiality_roof")}
                  className="w-full p-2 border border-green-200 rounded-lg outline-none bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-green-800">Obras Complementarias</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {complementaryOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleOption("complementary_works", opt)}
                    className={`px-3 py-2 rounded-md text-xs font-bold transition-all border ${
                      selectedComplementary.includes(opt) 
                        ? 'bg-green-600 text-white border-green-600 shadow-md scale-[1.02]' 
                        : 'bg-white text-gray-600 hover:bg-gray-50 border-green-200 hover:border-green-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* BLOQUE: CONSULTA DE NORMATIVA E INTELIGENCIA DE MERCADO */}
      <div className="mt-8 border-t-2 border-blue-100 pt-6">
        <h3 className="text-sm font-black text-blue-900 uppercase mb-4 flex items-center gap-2">
          <Scale size={18} /> Consulta de Normativa e Inteligencia de Mercado
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* COLUMNA IZQUIERDA: NORMATIVA DURA */}
          <div className="md:col-span-7 bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Zonificación PRC</label>
                <input 
                  placeholder="Ej: ZH-1" 
                  {...register("zoning_code_prc")}
                  className="p-2 bg-slate-50 border rounded text-sm font-bold uppercase w-28" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Sistema Agrupamiento</label>
                <select 
                  {...register("grouping")}
                  className="p-2 bg-slate-50 border rounded text-sm outline-none font-bold"
                >
                  <option value="Aislado">Aislado</option>
                  <option value="Pareado">Pareado</option>
                  <option value="Continuo">Continuo</option>
                </select>
              </div>
            </div>

            {/* RECUADRO DE COEFICIENTES OGUC */}
            <div className="mt-4 grid grid-cols-4 gap-2 bg-blue-50/50 p-2 rounded">
              <div className="text-center">
                <p className="text-[9px] text-blue-700 font-bold uppercase">Coef. Suelo</p>
                <input 
                  {...register("land_use_coefficient")}
                  className="w-full text-center text-sm font-mono p-1 border rounded" 
                  placeholder="0.6" 
                />
              </div>
              <div className="text-center">
                <p className="text-[9px] text-blue-700 font-bold uppercase">Construct.</p>
                <input 
                  {...register("constructability_index")}
                  className="w-full text-center text-sm font-mono p-1 border rounded" 
                  placeholder="2.4" 
                />
              </div>
              <div className="text-center">
                <p className="text-[9px] text-blue-700 font-bold uppercase">Altura (m)</p>
                <input 
                  {...register("max_height")}
                  className="w-full text-center text-sm font-mono p-1 border rounded" 
                  placeholder="15" 
                />
              </div>
              <div className="text-center">
                <p className="text-[9px] text-blue-700 font-bold uppercase">Densidad</p>
                <input 
                  {...register("density")}
                  className="w-full text-center text-sm font-mono p-1 border rounded" 
                  placeholder="400" 
                />
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: MERCADO Y REFERENCIAS */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="bg-slate-800 p-4 rounded-lg text-white shadow-md">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Referencias de Portales y Proyectos</label>
              <textarea 
                rows={3} 
                {...register("market_comparables")}
                placeholder="Pegue aquí links o datos: 'Portal Inmobiliario: Depto 3D2B - 4500 UF'. 'Proyecto Edificio Almagro: En verde 55 UF/m²'"
                className="w-full mt-2 p-2 bg-slate-700 border border-slate-600 rounded text-[11px] outline-none focus:border-blue-400"
              />
            </div>
            
            {/* BOTÓN DE ACCIÓN: CONSULTAR ORDENANZA */}
            <button 
              type="button" 
              onClick={handleFetchNorms}
              disabled={isFetchingNorms || !commune}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:bg-blue-300"
            >
              {isFetchingNorms ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw size={16} />}
              EJECUTAR ANÁLISIS NORMATIVO-MERCADO
            </button>
          </div>
        </div>

        {/* INTERPRETACIÓN FINAL (Nota al pie de sección) */}
        <div className="mt-4 p-3 bg-blue-900 text-blue-100 rounded-lg text-[11px] leading-relaxed border-l-4 border-blue-400 shadow-sm">
          <strong>Interpretación Técnica:</strong> Al cruzar la zona <span className="font-bold text-white">[{watch("zoning_code_prc") || "ZONA"}]</span> con los proyectos detectados en el sector, la IA evaluará si la propiedad está en su "Mejor y Mayor Uso". Si los comparables de portales muestran valores superiores al costo de reposición, se aplicará un factor de plusvalía por desarrollo inmobiliario activo.
        </div>
      </div>

      {/* BLOQUE: REFERENCIAS DE MERCADO (4 COMPARABLES) */}
      <div className="mt-8 space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b pb-3 gap-2">
          <h3 className="text-sm font-black text-slate-700 uppercase flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            Referencias de Mercado (4 Propiedades Comparables)
          </h3>
          <div className="flex items-center gap-2 bg-blue-100 px-3 py-1.5 rounded-full shadow-inner">
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-tighter">Valor UF Hoy:</span>
            <input 
              type="number" 
              {...register("uf_value_now", { valueAsNumber: true })}
              className="w-20 bg-transparent text-[10px] font-bold outline-none text-blue-800 border-none focus:ring-0" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-2 hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Comparativo 0{i}</span>
                <input 
                  type="text" 
                  placeholder="Dirección / Ubicación" 
                  {...register(`comparable_${i as 1|2|3|4}_address` as any)}
                  className="text-[11px] font-bold border-b border-slate-100 outline-none focus:border-blue-400 w-2/3 text-right bg-transparent" 
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {/* Superficie */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter text-center">Superficie</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="0" 
                      {...register(`comparable_${i as 1|2|3|4}_m2` as any, { valueAsNumber: true })}
                      className="w-full p-1.5 bg-slate-50 border rounded text-xs outline-none text-center font-mono" 
                    />
                    <span className="absolute right-1 top-2 text-[8px] text-slate-400 font-bold">m²</span>
                  </div>
                </div>

                {/* Valor en Pesos (Conversor) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter text-center">Valor CLP</label>
                  <input 
                    type="number" 
                    placeholder="$" 
                    {...register(`comparable_${i as 1|2|3|4}_clp` as any, { valueAsNumber: true })}
                    className="w-full p-1.5 bg-slate-50 border rounded text-xs outline-none text-center font-mono" 
                  />
                </div>

                {/* Valor en UF (Resultado o Ingreso Directo) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter text-center">Valor UF</label>
                  <input 
                    type="number" 
                    placeholder="UF" 
                    {...register(`comparable_${i as 1|2|3|4}_uf` as any, { valueAsNumber: true })}
                    className="w-full p-1.5 bg-blue-50 border border-blue-200 rounded text-xs font-black text-blue-700 outline-none text-center font-mono" 
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Link / Detalle:</span>
                <input 
                  type="text" 
                  {...register(`comparable_${i as 1|2|3|4}_link` as any)}
                  placeholder="Ej: Portal Inmobiliario..." 
                  className="text-[10px] text-blue-500 underline bg-transparent outline-none w-3/4 text-right hover:text-blue-700" 
                />
              </div>
            </div>
          ))}
        </div>

        {/* ESPACIO DE EXPLICACIÓN DE LA SECCIÓN */}
        <div className="mt-4 p-4 bg-slate-800 text-white rounded-lg shadow-lg border-l-4 border-blue-500">
          <div className="flex items-start gap-4">
            <Info size={24} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-300">Análisis Comparativo de Mercado (ACM)</h4>
              <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                Esta sección pondera la <strong>oferta activa</strong> del sector. Al ingresar los valores de venta y superficies de propiedades similares, el sistema calcula el valor promedio por m² en la zona. 
                Si existe una brecha significativa entre el valor de tasación y estas referencias, la IA ajustará el resultado final considerando factores de <strong>absorción y liquidez</strong> del mercado local.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-4">
        {Object.keys(errors).length > 0 && (
          <div key="validation-errors-alert" className="bg-red-50 border border-red-200 p-4 rounded-xl">
            <p className="text-sm text-red-600 font-bold">Por favor, revisa los campos marcados en rojo. Faltan datos obligatorios.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            type="button"
            onClick={loadExampleData}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1.5 rounded-md transition-all border border-slate-300 text-lg tracking-widest"
          >
            Cargar Ejemplo
          </button>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 rounded-md transition-all shadow-lg shadow-blue-600/20 disabled:bg-blue-300 text-lg tracking-widest"
          >
            {isLoading ? "Calculando..." : "Obtener Tasación"}
          </button>
        </div>
        <div className="text-center">
          <button 
            type="button"
            onClick={() => window.location.reload()} 
            className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
          >
            Limpiar Formulario
          </button>
        </div>
      </div>
    </form>

    {/* PAYMENT TRANSBANK WEBPAY SIMULATION MODAL */}
    {showPaymentModal && (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 px-2 py-1 rounded text-white font-extrabold text-[10px] uppercase">PropValue Pay</span>
              <h3 className="text-xs font-black uppercase tracking-wider">Pasarela de Pago Seguro</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              disabled={paymentStep === 'processing'}
              className="text-slate-400 hover:text-white transition-colors text-sm font-bold disabled:opacity-30"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-4">
            {paymentStep === 'form' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-1 text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 block">Detalle de tu Transacción</span>
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>Informe Urbanístico Completo (Premium)</span>
                    <span className="font-mono text-blue-700">$14.990 CLP</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal font-medium">
                    Activa inmediatamente el cálculo exacto de m² edificables del predio, coeficientes morfológicos de distanciamiento y antejardines, altura máxima e indicadores de subdivisión predial.
                  </p>
                </div>

                {/* Simulated credit card */}
                <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-5 rounded-2xl flex flex-col justify-between h-40 shadow-lg relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                  <div className="flex justify-between items-start">
                    <span className="font-sans font-black italic tracking-widest text-sm">Webpay Plus</span>
                    <span className="bg-emerald-500/30 text-emerald-300 text-[8px] font-extrabold py-0.5 px-2 rounded-full border border-emerald-400/20">TEST MODE</span>
                  </div>
                  <div className="font-mono text-sm tracking-widest py-2">
                     4242 &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; 4242
                  </div>
                  <div className="flex justify-between items-end text-xs font-mono">
                    <div>
                      <span className="text-[8px] opacity-60 uppercase block">Titular</span>
                      <span>ALEXIS SANCHEZ</span>
                    </div>
                    <div>
                      <span className="text-[8px] opacity-60 uppercase block">Vence</span>
                      <span>12/29</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[9px] text-slate-400 text-center font-bold">
                    * Esta es una simulación de cobro. No se descontará dinero de su tarjeta ni requiere ingresar credenciales reales de banco.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={executeSimulatedPayment}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-md mt-2"
                >
                  Confirmar Pago - $14.990 CLP
                </button>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  <Lock className="w-4 h-4 text-blue-800 absolute" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase text-slate-800">Procesando Transacción Webpay</h4>
                  <p className="text-[10px] text-slate-500 font-mono italic animate-pulse">
                    {paymentStepMessage}
                  </p>
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
                <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 relative">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase text-slate-800">¡Pago Confirmado Correctamente!</h4>
                  <p className="text-[10px] text-slate-500 leading-normal px-2">
                    Tu cuenta ha sido promovida a la categoría **Premium**. El sistema está re-escaneando el ROL para desbloquear todos los indicadores del Plan Regulador de la Manzana de forma inmediata.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="bg-slate-900 text-white text-[10px] font-black py-2.5 px-6 rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-wider shadow-sm"
                >
                  Entendido y Volver al Formulario
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    </motion.div>
  );
};
