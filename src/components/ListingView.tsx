import React from 'react';
import { Property, ListingType } from '../types';
import { MapPin, ArrowLeft } from 'lucide-react';
import { COMMUNES } from '../constants';

interface ListingViewProps {
  category: 'sale' | 'rent' | 'all';
  properties: Property[];
  selectedCommunes: string[];
  onToggleCommune: (commune: string | null) => void;
  onClearFilters: () => void;
  onPropertyClick: (id: string) => void;
  onGoHome: () => void;
}

const ListingView: React.FC<ListingViewProps> = ({ 
  category, 
  properties, 
  selectedCommunes,
  onToggleCommune,
  onPropertyClick, 
  onGoHome 
}) => {
  const normalizeString = (str: string | undefined | null) => 
    (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredProperties = properties.filter(p => {
    // Robust category matching
    const isSale = p.listingType === ListingType.SALE || String(p.listingType).toLowerCase() === 'venta' || String(p.listingType).toLowerCase() === 'sale';
    const isRent = p.listingType === ListingType.RENT || String(p.listingType).toLowerCase() === 'arriendo' || String(p.listingType).toLowerCase() === 'rent';

    const matchesCategory = category === 'sale' ? isSale : 
                           category === 'rent' ? isRent : true;
    
    if (!matchesCategory) return false;

    const normalizedLocation = normalizeString(p.location);
    
    // If communes are selected, filter by them. Otherwise, show all properties of the category.
    if (selectedCommunes && selectedCommunes.length > 0) {
      return selectedCommunes.some(commune => 
        normalizedLocation.includes(normalizeString(commune))
      );
    }
    
    return true;
  });

  const heroConfig = {
    sale: {
      title: 'Propiedades en Venta',
      subtitle: 'Descubre las residencias más exclusivas del mercado',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920&auto=format&fit=crop'
    },
    rent: {
      title: 'Propiedades en Arriendo',
      subtitle: 'Vive la experiencia del lujo temporal',
      image: 'https://images.unsplash.com/photo-1600607687940-4e524cb35797?q=80&w=1920&auto=format&fit=crop'
    },
    all: {
      title: 'Propiedades en Venta',
      subtitle: 'Explora nuestra colección completa de propiedades',
      image: 'https://images.unsplash.com/photo-1600596542815-2a434f678417?q=80&w=1920&auto=format&fit=crop'
    }
  };

  const currentHero = heroConfig[category] || heroConfig.all;

  return (
    <div className="bg-white min-h-screen">
      {/* Header Section for Listing - Clean White */}
      <div className="relative pt-20 pb-4 flex flex-col items-start border-b border-gray-50 max-w-7xl mx-auto px-8 w-full">
        <div className="relative z-10 text-left mb-6">
          <button 
            onClick={onGoHome} 
            className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 hover:text-leroy-orange transition-colors mb-2 group"
          >
            <ArrowLeft size={14} className="mr-2 transition-transform group-hover:-translate-x-1" />
            Volver al inicio
          </button>
          <h1 className="text-2xl md:text-3xl font-serif font-medium text-leroy-black mb-1 animate-slideInRight leading-[1.1]">
            {currentHero.title}
          </h1>
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.5em] text-leroy-orange animate-fadeIn">
            {currentHero.subtitle}
          </p>
        </div>

        {/* Commune Filter */}
        <div className="flex flex-wrap justify-start gap-x-8 gap-y-3 py-4 w-full relative">
          <button 
            onClick={() => onToggleCommune(null)}
            className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${selectedCommunes.length === 0 ? 'border-leroy-orange text-leroy-black' : 'border-transparent text-gray-400 hover:text-leroy-black'}`}
          >
            Todas las comunas
          </button>
          {COMMUNES.map(commune => (
            <button 
              key={commune}
              onClick={() => onToggleCommune(commune)}
              className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${selectedCommunes.includes(commune) ? 'border-leroy-orange text-leroy-black' : 'border-transparent text-gray-400 hover:text-leroy-black'}`}
            >
              {commune}
            </button>
          ))}
          
          {selectedCommunes.length > 0 && (
            <button 
              onClick={() => onToggleCommune(null)}
              className="ml-auto text-[8px] font-bold uppercase tracking-widest text-leroy-orange hover:text-leroy-black transition-colors"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid Section */}
      <div className="py-6 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
          {filteredProperties.map((p) => (
            <div 
              key={p.id} 
              className="group cursor-pointer fade-in"
              onClick={() => onPropertyClick(p.id)}
            >
              <div className="aspect-[4/5] overflow-hidden mb-4 relative bg-white">
                <img 
                  src={p.imageUrl} 
                  alt={p.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-leroy-black shadow-sm">
                  {p.currency} {p.price.toLocaleString()}
                </div>
                {p.isPremium && (
                  <div className="absolute top-6 right-6 bg-leroy-orange text-white px-3 py-1 text-[8px] font-bold uppercase tracking-widest shadow-sm">
                    Premium
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-serif mb-1 group-hover:text-leroy-orange transition-colors duration-500">{p.title}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{p.subtitle}</p>
              <div className="flex items-center gap-2 text-gray-400 border-t border-gray-50 pt-4">
                <MapPin size={14} className="text-leroy-orange" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{p.location}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-20">
            <p className="font-serif text-2xl text-gray-300 mb-6">No se encontraron propiedades en esta categoría.</p>
            <button 
              onClick={() => {
                localStorage.removeItem('leroy_properties_v1');
                window.location.reload();
              }}
              className="text-[10px] font-bold uppercase tracking-[0.3em] text-leroy-orange hover:text-leroy-black transition-colors border border-leroy-orange/20 px-6 py-3 rounded-full"
            >
              Restablecer base de datos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingView;

