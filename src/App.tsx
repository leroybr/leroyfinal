import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';
import ListingView from './components/ListingView';
import AdminView from './components/AdminView';
import AdminLoginView from './components/AdminLoginView';
import PropertyDetailView from './components/PropertyDetailView';
import { Property, HeroSearchState, ListingType, PropertyType } from './types';
import { MOCK_PROPERTIES, COMMUNES } from './constants';
import { interpretSearchQuery } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'real_estate' | 'admin' | 'detail'>('home');
  const [listingCategory, setListingCategory] = useState<'sale' | 'rent' | 'all'>('all');
  const [selectedCommunes, setSelectedCommunes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);
  
  // Persistencia: Cargar propiedades desde el servidor al iniciar
  const [properties, setProperties] = useState<Property[]>([]);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch('/api/properties');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            if (data.length > 0) {
              setProperties(data);
            } else {
              // Si el servidor está vacío (primera vez), usamos los mocks
              setProperties(MOCK_PROPERTIES);
            }
            setIsInitialLoadDone(true);
          } else {
            throw new Error('Formato de datos inválido');
          }
        } else {
          throw new Error('Error al conectar con el servidor');
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        // Fallback a localStorage si el servidor falla
        const saved = localStorage.getItem('leroy_properties_v1');
        if (saved) {
          try {
            setProperties(JSON.parse(saved));
            setIsInitialLoadDone(true);
          } catch (e) {
            setProperties(MOCK_PROPERTIES);
            setIsInitialLoadDone(true);
          }
        } else {
          // Si no hay nada en server ni en local, usamos mocks
          setProperties(MOCK_PROPERTIES);
          setIsInitialLoadDone(true);
        }
        setLoadError('No se pudo sincronizar con el servidor. Los cambios se guardarán localmente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const contactTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleContactHover = (show: boolean) => {
    if (contactTimeoutRef.current) {
      clearTimeout(contactTimeoutRef.current);
    }

    if (show) {
      setShowContactForm(true);
    } else {
      contactTimeoutRef.current = setTimeout(() => {
        setShowContactForm(false);
      }, 300); // 300ms delay to allow moving mouse to the form
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2500); // Intro lasts 2.5 seconds (faster)
    return () => clearTimeout(timer);
  }, []);

  const saveToServer = async (props: Property[]) => {
    if (!isInitialLoadDone) return;
    
    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(props)
      });
      if (!response.ok) {
        throw new Error('Error al guardar en el servidor');
      }
    } catch (error) {
      console.error('Error saving to server:', error);
      // No alertamos cada vez para no molestar, pero el error queda en consola
    }
  };

  // Guardar propiedades cada vez que cambien
  useEffect(() => {
    if (isInitialLoadDone) {
      localStorage.setItem('leroy_properties_v1', JSON.stringify(properties));
      saveToServer(properties);
    }
  }, [properties, isInitialLoadDone]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, selectedPropertyId]);

  const handleSearch = async (searchState: HeroSearchState) => {
    setIsSearching(true);
    try {
      const filters = await interpretSearchQuery(searchState.location);
      console.log('Filtros interpretados por IA:', filters);
      
      if (filters.location) {
        setSelectedCommunes([filters.location]);
      }
      
      setListingCategory('all');
      setSelectedType(null);
      setView('real_estate');
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setSelectedCommunes([searchState.location]);
      setSelectedType(null);
      setView('real_estate');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickLink = (label: string) => {
    if (label === 'Casas espectaculares') {
      navigateToDetail('espectacular-1');
    } else if (label === 'Propiedades en Venta') {
      setListingCategory('sale');
      setSelectedCommunes([]);
      setSelectedType(null);
      setView('real_estate');
    } else if (label === 'Propiedades en Arriendo') {
      setListingCategory('rent');
      setSelectedCommunes([]);
      setSelectedType(null);
      setView('real_estate');
    } else if (COMMUNES.includes(label)) {
      setListingCategory('all');
      setSelectedCommunes([label]);
      setSelectedType(null);
      setView('real_estate');
    } else {
      setListingCategory('all');
      setSelectedCommunes([]);
      setSelectedType(null);
      setView('real_estate');
    }
  };

  const navigateToDetail = (id: string) => {
    setSelectedPropertyId(id);
    setView('detail');
  };

  const handleAddProperty = (newProp: Property) => {
    setProperties(prev => {
      const exists = prev.find(p => p.id === newProp.id);
      if (exists) {
        return prev.map(p => p.id === newProp.id ? newProp : p);
      }
      return [newProp, ...prev];
    });
    
    // Automatically set the category to match the new property's type
    if (newProp.listingType === ListingType.SALE || String(newProp.listingType).toLowerCase() === 'venta') {
      setListingCategory('sale');
    } else if (newProp.listingType === ListingType.RENT || String(newProp.listingType).toLowerCase() === 'arriendo') {
      setListingCategory('rent');
    }
    
    setSelectedCommunes([]); // Clear filters to ensure the new property is visible
    setSelectedType(null);
    setView('real_estate');
  };

  const handleDeleteProperty = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setView('admin');
    } else {
      setView('admin');
    }
  };

  const handleNavigate = (v: string) => {
    if (v === 'admin') {
      handleAdminAccess();
    } else if (v === 'real_estate_sale') {
      setListingCategory('sale');
      setSelectedCommunes([]);
      setSelectedType(null);
      setView('real_estate');
    } else if (v === 'real_estate_rent') {
      setListingCategory('rent');
      setSelectedCommunes([]);
      setSelectedType(null);
      setView('real_estate');
    } else if (v === 'real_estate') {
      setListingCategory('all');
      setSelectedCommunes([]);
      setSelectedType(null);
      setView('real_estate');
    } else {
      setView(v as any);
    }
  };

  const handleSecureLogout = () => {
    setIsAdminAuthenticated(false);
    setIsConfirmingLogout(false);
    setView('home');
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const getHeaderView = (): 'home' | 'listing' | 'admin' | 'detail' => {
    if (view === 'real_estate') return 'listing';
    if (view === 'admin') return 'admin';
    return view as 'home' | 'detail';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Helmet>
        <title>LeRoy Residence | Propiedades de Lujo en Chile</title>
        <meta name="description" content="Encuentra las mejores propiedades de lujo en venta y arriendo en las comunas más exclusivas de Chile. Casas, departamentos y villas espectaculares." />
        <meta name="keywords" content="propiedades de lujo chile, casas en venta lo barnechea, arriendo departamentos vitacura, corretaje de propiedades premium" />
        <meta property="og:title" content="LeRoy Residence | Propiedades de Lujo" />
        <meta property="og:description" content="Corretaje de propiedades exclusivo en Chile. Venta y arriendo de mansiones, villas y departamentos premium." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      {showIntro && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center text-center px-8">
          <div className="max-w-2xl">
            <h2 className="text-leroy-black font-serif text-3xl md:text-4xl mb-6 font-medium leading-[1.1] animate-slideInRight tracking-tight">
              Bienvenido LeRoy Residence
            </h2>
            <div className="flex justify-center gap-4 mb-8 animate-fadeIn text-leroy-black font-bold uppercase tracking-[0.4em] text-[8px] md:text-[9px] opacity-60">
              <span>Vender</span>
              <span className="text-leroy-orange">•</span>
              <span>Comprar</span>
              <span className="text-leroy-orange">•</span>
              <span>Arrendar</span>
            </div>
            <p className="text-leroy-orange font-serif italic text-xl md:text-2xl animate-fadeIn">
              Propiedades en Venta
            </p>
          </div>
          <div className="absolute bottom-12 w-32 h-px bg-leroy-black/10 overflow-hidden">
            <div className="h-full bg-leroy-orange animate-progress" />
          </div>
        </div>
      )}
      <Header 
        onNavigate={handleNavigate} 
        currentView={getHeaderView()} 
        onContactHover={handleContactHover}
        showContactForm={showContactForm}
      />
      
      <main className="flex-grow">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 animate-fadeIn">
            <div className="w-12 h-12 border-2 border-leroy-orange border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Cargando Propiedades...</p>
          </div>
        ) : (
          <>
            {loadError && (
              <div className="bg-orange-50 text-leroy-orange text-[10px] font-bold uppercase tracking-widest py-2 px-8 text-center animate-fadeIn">
                {loadError}
              </div>
            )}
            {view === 'home' && (
              <Hero 
                onSearch={handleSearch} 
                onQuickLinkClick={handleQuickLink} 
                isSearching={isSearching} 
              />
            )}

            {view === 'real_estate' && (
              <ListingView 
                category={listingCategory} 
                properties={properties} 
                selectedCommunes={selectedCommunes}
                selectedType={selectedType}
                onToggleCommune={(commune) => {
                  if (commune === null) {
                    setSelectedCommunes([]);
                  } else {
                    setSelectedCommunes(prev => 
                      prev.includes(commune) 
                        ? prev.filter(c => c !== commune) 
                        : [...prev, commune]
                    );
                  }
                }}
                onToggleType={(type) => setSelectedType(type)}
                onClearFilters={() => {
                  setSelectedCommunes([]);
                  setSelectedType(null);
                }} 
                onPropertyClick={navigateToDetail}
                onGoHome={() => { 
                  setView('home'); 
                  setSelectedCommunes([]); 
                  setSelectedType(null);
                }}
              />
            )}

            {view === 'admin' && (
              !isAdminAuthenticated ? (
                <AdminLoginView 
                  onSuccess={() => setIsAdminAuthenticated(true)} 
                  onCancel={() => setView('home')} 
                />
              ) : (
                <>
                  <AdminView 
                    properties={properties}
                    onAddProperty={handleAddProperty} 
                    onDeleteProperty={handleDeleteProperty}
                    onCancel={() => setIsConfirmingLogout(true)} 
                  />
                  {isConfirmingLogout && (
                    <AdminLoginView 
                      mode="logout"
                      onSuccess={handleSecureLogout} 
                      onCancel={() => setIsConfirmingLogout(false)} 
                    />
                  )}
                </>
              )
            )}

            {view === 'detail' && selectedProperty && (
              <PropertyDetailView 
                property={selectedProperty} 
                onGoHome={() => setView('home')} 
              />
            )}
          </>
        )}
      </main>

      <Footer />

      {/* Floating Admin Button - Hidden behind a white circle */}
      <button 
        onClick={() => handleAdminAccess()}
        className="fixed bottom-4 left-4 w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center group z-[100] hover:w-20 hover:h-8 transition-all duration-500 border border-gray-50 overflow-hidden"
        aria-label="Admin Access"
      >
        <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold uppercase tracking-widest text-gray-400 transition-all duration-300 whitespace-nowrap">
          Admin
        </span>
      </button>
    </div>
  );
};

export default App;