import React, { useState, useEffect } from 'react';
import { Property, PropertyType } from '../types';
import PropertyCard from './PropertyCard';

interface ListingViewProps {
  category: string;
  properties: Property[];
  onPropertyClick: (property: Property) => void;
  onGoHome: () => void;
  onClearFilters: () => void;
}

const UF_VALUE_CLP = 37800;
const USD_VALUE_CLP = 950;
const EUR_VALUE_CLP = 1020;

const ListingView: React.FC<ListingViewProps> = ({ category, properties, onPropertyClick, onGoHome, onClearFilters }) => {
  const knownCities = ['Concepción', 'Chiguayante', 'San Pedro de la Paz', 'Talcahuano', 'Coronel', 'Penco', 'Los Ángeles'];
  const isCity = knownCities.includes(category);
  
  // --- Local Filter State ---
  const [filterMinPrice, setFilterMinPrice] = useState<string>('');
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>('');
  const [filterBedrooms, setFilterBedrooms] = useState<number>(0);
  const [filterType, setFilterType] = useState<string>('all');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(properties);

  // Reset local filters when category changes
  useEffect(() => {
    setFilterMinPrice('');
    setFilterMaxPrice('');
    setFilterBedrooms(0);
    setFilterType('all');
  }, [category]);

  // Apply filters whenever inputs or properties change
  useEffect(() => {
    let result = properties;

    // 1. Filter by Type
    if (filterType !== 'all') {
      result = result.filter(p => p.type === filterType);
    }

    // 2. Filter by Bedrooms
    if (filterBedrooms > 0) {
      result = result.filter(p => p.bedrooms >= filterBedrooms);
    }

    // 3. Filter by Price (Normalize everything to CLP for comparison)
    if (filterMinPrice || filterMaxPrice) {
      const min = filterMinPrice ? parseInt(filterMinPrice) : 0;
      const max = filterMaxPrice ? parseInt(filterMaxPrice) : Number.MAX_SAFE_INTEGER;

      result = result.filter(p => {
        let priceInCLP = 0;
        const currency = p.currency.trim();
        
        if (currency === 'UF') priceInCLP = p.price * UF_VALUE_CLP;
        else if (currency === '$' || currency === 'USD') priceInCLP = p.price * USD_VALUE_CLP;
        else if (currency === '€') priceInCLP = p.price * EUR_VALUE_CLP;
        else priceInCLP = p.price; // Assuming CLP if undefined or other

        return priceInCLP >= min && priceInCLP <= max;
      });
    }

    setFilteredProperties(result);
  }, [properties, filterMinPrice, filterMaxPrice, filterBedrooms, filterType]);

  const handleClearLocalFilters = () => {
    setFilterMinPrice('');
    setFilterMaxPrice('');
    setFilterBedrooms(0);
    setFilterType('all');
    onClearFilters(); // Also reset global filters if needed
  };
  
  // --- Title Logic ---
  let title = category;
  let subtitle = `Explora nuestra selección exclusiva. ${filteredProperties.length} propiedades encontradas.`;

  if (isCity) {
    title = `Inmuebles de lujo en ${category}`;
  } else if (category === 'Bienes Raíces') {
    title = 'Bienes Raíces de Lujo';
  } else if (category === 'Show room Cocinas') {
    title = 'Nuevas tecnologías en la Cocina ¡¡';
    subtitle = 'Innovación, diseño de vanguardia y funcionalidad para el corazón del hogar.';
  } else if (category === 'Desarrollos') {
    title = 'Nuevos Desarrollos';
  } else if (category === 'Premium Property') {
    title = 'Propiedades Premium';
  } else if (category.includes('Dorm') || category.includes('Precio')) {
     title = `Resultados: ${category}`;
  } else if (!category || category === 'Resultados de Búsqueda') {
     title = 'Resultados de Búsqueda';
  }

  return (
    <div className="pt-40 pb-20 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <button 
            onClick={onGoHome}
            className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-leroy-black transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Volver a Inicio
          </button>
        </div>

        <nav className="flex text-xs text-gray-400 mb-6 uppercase tracking-wider">
          <span className="hover:text-leroy-black cursor-pointer" onClick={onGoHome}>Home</span>
          <span className="mx-2">/</span>
          <span className="text-leroy-black font-semibold truncate max-w-xs">{category}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-8 mb-10">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl text-leroy-black mb-4 capitalize">
              {title}
            </h1>
            <p className="text-gray-500 font-light max-w-2xl">
              {subtitle}
            </p>
          </div>
          
          <div className="mt-6 md:mt-0 flex items-center space-x-4">
             {/* Sort/Actions Placeholder */}
             <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                {filteredProperties.length} Resultados
             </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- SIDEBAR FILTERS --- */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
            <div className="bg-gray-50 p-6 rounded-sm border border-gray-100">
              <h3 className="font-serif text-lg text-leroy-black mb-4 border-b border-gray-200 pb-2">Filtros</h3>
              
              {/* Price Filter */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Precio (CLP)</label>
                <div className="space-y-2">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={filterMinPrice}
                    onChange={(e) => setFilterMinPrice(e.target.value)}
                    className="w-full text-sm border-gray-200 focus:border-leroy-gold focus:ring-0 p-2 bg-white"
                  />
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                    className="w-full text-sm border-gray-200 focus:border-leroy-gold focus:ring-0 p-2 bg-white"
                  />
                </div>
              </div>

              {/* Bedrooms Filter */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Dormitorios</label>
                <select 
                  value={filterBedrooms}
                  onChange={(e) => setFilterBedrooms(Number(e.target.value))}
                  className="w-full text-sm border-gray-200 focus:border-leroy-gold focus:ring-0 p-2 bg-white"
                >
                  <option value={0}>Cualquiera</option>
                  <option value={1}>1+</option>
                  <option value={2}>2+</option>
                  <option value={3}>3+</option>
                  <option value={4}>4+</option>
                  <option value={5}>5+</option>
                </select>
              </div>

              {/* Property Type Filter */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Tipo de Propiedad</label>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full text-sm border-gray-200 focus:border-leroy-gold focus:ring-0 p-2 bg-white"
                >
                  <option value="all">Todos</option>
                  {Object.values(PropertyType).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Clear Button */}
              <button 
                onClick={handleClearLocalFilters}
                className="w-full border border-gray-300 text-gray-600 py-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </aside>

          {/* --- MAIN GRID --- */}
          <div className="flex-1">
            {filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {filteredProperties.map(property => (
                  <div key={property.id} className="h-full">
                    <PropertyCard property={property} onClick={() => onPropertyClick(property)} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-100 h-full flex flex-col justify-center items-center">
                <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                   </svg>
                </div>
                <h3 className="font-serif text-xl text-leroy-black mb-2">No se encontraron resultados</h3>
                <p className="text-gray-500 mb-6 text-sm">Intenta ajustar los filtros de la barra lateral.</p>
                <button 
                  onClick={handleClearLocalFilters}
                  className="border border-leroy-black px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-leroy-black hover:text-white transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            )}
          </div>
        </div>
        
        {filteredProperties.length > 0 && (
          <div className="mt-20 pt-10 border-t border-gray-100">
             <h2 className="font-serif text-2xl text-leroy-black mb-4">Sobre esta colección</h2>
             <p className="text-gray-500 text-sm leading-relaxed max-w-4xl columns-1 md:columns-2 gap-12">
               Descubra las mejores propiedades en {category === 'Premium Property' ? 'nuestra colección Premium' : category}. 
               Nuestra colección incluye desde modernas villas hasta penthouses históricos, todos seleccionados rigurosamente 
               para satisfacer los estándares más altos. LeRoy Residence es su socio confiable en el mercado inmobiliario de lujo.
             </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default ListingView;