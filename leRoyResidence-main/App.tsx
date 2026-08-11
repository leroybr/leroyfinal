import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';
import PropertyCard from './components/PropertyCard';
import ListingView from './components/ListingView';
import AdminView from './components/AdminView';
import PropertyDetailView from './components/PropertyDetailView';
import ShowroomView from './components/ShowroomView';
import { MOCK_PROPERTIES } from './constants';
import { Property, HeroSearchState } from './types';

const UF_VALUE_CLP = 37800;

const App: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [currentView, setCurrentView] = useState('home'); 
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchFilters, setSearchFilters] = useState<HeroSearchState | null>(null);

  // Restore simple query param reading on mount (for external links/sitemap compatibility)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    const category = params.get('category');
    
    if (page === 'listing' && category) {
      setCurrentView('listing');
      setSelectedCategory(category);
    } else if (page === 'showroom') {
      setCurrentView('showroom');
    } else if (page === 'admin') {
      setCurrentView('admin');
    }
  }, []);

  // Dynamic Title Management
  useEffect(() => {
    let title = 'LeRoy Residence | Corretaje de Propiedades de Lujo';

    if (currentView === 'home') title = 'LeRoy Residence | Inicio - Compra y Venta';
    else if (currentView === 'showroom') title = 'Nuevas Tecnologías en Cocina | LeRoy';
    else if (currentView === 'listing') {
      if (selectedCategory === 'premium') title = 'Propiedades Premium | LeRoy';
      else if (selectedCategory === 'bienes-raices') title = 'Bienes Raíces | LeRoy';
      else title = `${selectedCategory} | LeRoy`;
    }
    else if (currentView === 'detail' && selectedProperty) title = `${selectedProperty.title} | LeRoy`;
    else if (currentView === 'admin') title = 'Administración | LeRoy';

    document.title = title;
  }, [currentView, selectedCategory, selectedProperty]);

  const handleNavigate = (view: string, category: string = '') => {
    setCurrentView(view);
    setSelectedCategory(category);
    setSearchFilters(null);
    window.scrollTo(0, 0);
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setCurrentView('detail');
    window.scrollTo(0, 0);
  };

  const handleHeroSearch = (filters: HeroSearchState) => {
    setSearchFilters(filters);
    
    // Logic to switch to listing view
    if (filters.location && filters.bedrooms === 'any' && filters.priceRange === 'any') {
       // Direct location navigation
       handleNavigate('listing', filters.location);
    } else {
       // Complex search
       handleNavigate('listing', 'Resultados de Búsqueda');
    }
  };

  const handleAddProperty = (newProperty: Property) => {
    const updatedProperties = [newProperty, ...properties];
    setProperties(updatedProperties);
    handleNavigate('listing', 'Bienes Raíces');
  };

  // Filter Logic
  const getFilteredProperties = () => {
    let filtered = properties;

    // 1. Filter by Category / Location
    if (selectedCategory && selectedCategory !== 'Resultados de Búsqueda') {
      if (selectedCategory === 'Bienes Raíces' || selectedCategory === 'Desarrollos') {
        // Show all for now, or add specific logic
      } else if (selectedCategory === 'Premium Property') {
         filtered = filtered.filter(p => p.isPremium);
      } else {
        // Assume category is a location name
        filtered = filtered.filter(p => p.location.includes(selectedCategory));
      }
    }

    // 2. Filter by Search State
    if (searchFilters) {
      if (searchFilters.location) {
        filtered = filtered.filter(p => p.location.includes(searchFilters.location));
      }
      if (searchFilters.bedrooms !== 'any') {
        const minBeds = parseInt(searchFilters.bedrooms);
        filtered = filtered.filter(p => p.bedrooms >= minBeds);
      }
      if (searchFilters.priceRange !== 'any') {
        const [minStr, maxStr] = searchFilters.priceRange.split('-');
        let min = parseInt(minStr);
        let max = maxStr === 'plus' ? Number.MAX_SAFE_INTEGER : parseInt(maxStr);

        filtered = filtered.filter(p => {
             let priceInCLP = 0;
             const currency = p.currency.trim();
             // Normalize to CLP for filtering
             if (currency === 'UF') priceInCLP = p.price * UF_VALUE_CLP;
             else if (currency === '$' || currency === 'USD') priceInCLP = p.price * 950; 
             else if (currency === '€') priceInCLP = p.price * 1020; 
             else priceInCLP = p.price; 
             
             return priceInCLP >= min && priceInCLP <= max;
        });
      }
    }

    return filtered;
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <>
            <Hero onSearch={handleHeroSearch} isSearching={false} />
            
            {/* Home Sections */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-100 pb-6">
                  <div>
                    <h2 className="font-serif text-3xl md:text-4xl text-leroy-black mb-2">Propiedades Destacadas</h2>
                    <p className="text-gray-500 font-light">Oportunidades únicas seleccionadas por nuestros expertos.</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-4 md:mt-0">
                     <button onClick={() => handleNavigate('listing', 'Bienes Raíces')} className="text-xs font-bold uppercase tracking-widest text-leroy-black hover:opacity-70 transition-opacity">
                       Ver cartera completa &rarr;
                     </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                  {properties.slice(0, 6).map(property => (
                    <div key={property.id} className="h-full">
                      <PropertyCard 
                        property={property} 
                        onClick={() => handlePropertyClick(property)} 
                      />
                    </div>
                  ))}
                </div>
            </div>

            {/* Sellers Section */}
            <section className="bg-leroy-black text-white py-24 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-leroy-gold opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
               <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                  <span className="text-leroy-gold text-xs font-bold uppercase tracking-[0.2em] mb-4 block">Gestión de Venta Exclusiva</span>
                  <h2 className="font-serif text-3xl md:text-5xl mb-6 leading-tight">¿Posee una propiedad extraordinaria?</h2>
                  <p className="font-prata text-lg text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto">En LeRoy Residence, sabemos que su propiedad no es solo un inmueble, es un legado. Garantizamos confidencialidad absoluta, estrategia de precio experta y acceso a una cartera global.</p>
                  <div className="flex flex-col md:flex-row justify-center gap-4">
                     <button className="bg-leroy-gold text-white px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-leroy-black transition-colors duration-300 border border-leroy-gold">Solicitar Evaluación Privada</button>
                  </div>
               </div>
            </section>

            {/* Trust Section */}
            <section className="py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-16">
                      <h2 className="font-serif text-3xl md:text-4xl text-leroy-black mb-4">Excelencia Comprobada</h2>
                      <div className="w-24 h-1 bg-leroy-gold mx-auto"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
                      <div className="px-4 py-4">
                          <div className="font-serif text-5xl md:text-6xl text-leroy-black mb-2">+15</div>
                          <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Años de Experiencia</div>
                      </div>
                      <div className="px-4 py-4">
                          <div className="font-serif text-5xl md:text-6xl text-leroy-black mb-2">98%</div>
                          <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Tasa de Cierre</div>
                      </div>
                      <div className="px-4 py-4">
                          <div className="font-serif text-5xl md:text-6xl text-leroy-black mb-2">24/7</div>
                          <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Atención Personalizada</div>
                      </div>
                  </div>
              </div>
            </section>

            {/* Lifestyle Section */}
            <section className="bg-gray-50 py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="order-2 md:order-1 relative">
                    <div className="absolute -top-4 -left-4 w-full h-full border-2 border-leroy-black/10 z-0"></div>
                    <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop" alt="Luxury Living" className="w-full h-auto shadow-xl relative z-10"/>
                  </div>
                  <div className="order-1 md:order-2">
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 block">Filosofía LeRoy</span>
                    <h3 className="font-serif text-3xl md:text-4xl mb-6 text-leroy-black">Más que una propiedad, un legado.</h3>
                    <button onClick={() => handleNavigate('listing', 'Bienes Raíces')} className="inline-block border-b border-leroy-black pb-1 text-sm font-bold uppercase tracking-widest hover:text-leroy-gold hover:border-leroy-gold transition-colors">Comenzar la búsqueda</button>
                  </div>
                </div>
              </div>
            </section>
          </>
        );
      
      case 'listing':
        return (
          <ListingView 
            category={selectedCategory} 
            properties={getFilteredProperties()} 
            onPropertyClick={handlePropertyClick}
            onGoHome={() => handleNavigate('home')}
            onClearFilters={() => handleNavigate('listing', 'Bienes Raíces')}
          />
        );

      case 'detail':
        return selectedProperty ? (
          <PropertyDetailView 
            property={selectedProperty} 
            onGoHome={() => handleNavigate('home')}
          />
        ) : null;
      
      case 'showroom':
        return <ShowroomView onGoHome={() => handleNavigate('home')} />;
      
      case 'admin':
        return <AdminView onAddProperty={handleAddProperty} onCancel={() => handleNavigate('home')} />;

      default:
        return <div>Página no encontrada</div>;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header currentView={currentView} onNavigate={handleNavigate} />
      <main className="flex-grow">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;