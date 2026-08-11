import React, { useState, useEffect } from 'react';
import { HeroSearchState } from '../types';
import { COMMUNES } from '../constants';

interface HeroProps {
  onSearch: (filters: HeroSearchState) => void;
  isSearching: boolean;
}

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2560&auto=format&fit=crop", // Grand Modern Estate White
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2560&auto=format&fit=crop", // Resort Style Luxury Pool
  "https://images.unsplash.com/photo-1600596542815-2a434f678417?q=80&w=2560&auto=format&fit=crop", // Architectural Clean Lines
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2560&auto=format&fit=crop", // Poolside Luxury
  "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?q=80&w=2560&auto=format&fit=crop"  // Classic Spanish/Mediterranean
];

const Hero: React.FC<HeroProps> = ({ onSearch, isSearching }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  
  // Search States
  const [location, setLocation] = useState('');
  const [bedrooms, setBedrooms] = useState('any');
  const [priceRange, setPriceRange] = useState('any');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        setPrevIndex(prev);
        return (prev + 1) % HERO_IMAGES.length;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      location,
      bedrooms,
      priceRange
    });
  };

  const handleManualNavigation = (index: number) => {
    setPrevIndex(currentIndex);
    setCurrentIndex(index);
  };

  return (
    <div className="relative h-[80vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        {HERO_IMAGES.map((img, index) => {
           let zIndex = 'z-0';
           let opacity = 'opacity-0';
           
           if (index === currentIndex) {
             zIndex = 'z-10';
             opacity = 'opacity-100';
           } else if (index === prevIndex) {
             zIndex = 'z-0'; 
             opacity = 'opacity-100'; 
           }

           return (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${zIndex} ${opacity}`}
            >
              <img 
                src={img} 
                alt={`Luxury Property Background ${index + 1}`} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black/30"></div>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-6xl px-4 text-center">
        {/* Updated Title: Slightly smaller font size */}
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-8 md:mb-10 leading-tight drop-shadow-2xl px-2 max-w-5xl mx-auto">
          Vende o compra tu propiedad con acompañamiento profesional y seguro.
        </h1>
        
        {/* Multi-field Search Bar (Responsive Pill Style) */}
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-stretch md:items-center bg-white rounded-3xl md:rounded-full shadow-2xl p-2 md:p-1 transition-all duration-300 hover:shadow-white/10 gap-2 md:gap-0">
            
            {/* Field 1: Location Dropdown */}
            <div className="flex-grow flex items-center px-4 py-3 md:py-2 border-b md:border-b-0 md:border-r border-gray-200">
               <div className="text-gray-400 mr-2 flex-shrink-0">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-4 md:h-4">
                   <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                 </svg>
               </div>
               <select
                 value={location}
                 onChange={(e) => setLocation(e.target.value)}
                 className="w-full bg-transparent border-none focus:ring-0 text-gray-800 text-sm md:text-xs font-bold uppercase tracking-wide h-6 outline-none cursor-pointer appearance-none"
               >
                 <option value="">Ubicación (Cualquiera)</option>
                 {COMMUNES.map((commune) => (
                   <option key={commune} value={commune}>{commune}</option>
                 ))}
               </select>
            </div>

            {/* Field 2: Bedrooms (Visible on mobile now) */}
            <div className="flex flex-shrink-0 items-center px-4 py-3 md:py-2 border-b md:border-b-0 md:border-r border-gray-200 md:w-32">
               <div className="text-gray-400 mr-2 flex-shrink-0">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-4 md:h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                 </svg>
               </div>
               <select 
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-gray-800 text-sm md:text-xs font-bold uppercase tracking-wide h-6 outline-none cursor-pointer appearance-none w-full"
               >
                 <option value="any">Dormitorios</option>
                 <option value="1">1+ D</option>
                 <option value="2">2+ D</option>
                 <option value="3">3+ D</option>
                 <option value="4">4+ D</option>
                 <option value="5">5+ D</option>
               </select>
            </div>

            {/* Field 3: Price (CLP) (Visible on mobile now) */}
            <div className="flex flex-shrink-0 items-center px-4 py-3 md:py-2 md:w-48">
               <div className="text-gray-400 mr-2 flex-shrink-0">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-4 md:h-4">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                 </svg>
               </div>
               <select 
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-gray-800 text-sm md:text-xs font-bold uppercase tracking-wide h-6 outline-none cursor-pointer appearance-none w-full"
               >
                 <option value="any">Precio (CLP)</option>
                 <option value="0-100000000">Hasta $100M</option>
                 <option value="100000000-300000000">$100M - $300M</option>
                 <option value="300000000-600000000">$300M - $600M</option>
                 <option value="600000000-1000000000">$600M - $1.000M</option>
                 <option value="1000000000-plus">+ $1.000M</option>
               </select>
            </div>
            
            {/* Search Button */}
            <button 
              type="submit"
              disabled={isSearching}
              className="bg-leroy-black text-white px-8 py-3.5 md:py-2.5 rounded-full md:rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 flex-shrink-0 w-full md:w-auto"
            >
              {isSearching ? '...' : 'Buscar'}
            </button>
          </div>
          
          <div className="mt-6 flex justify-center space-x-2">
            {HERO_IMAGES.map((_, index) => (
              <button
                key={index}
                onClick={() => handleManualNavigation(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentIndex 
                    ? 'w-6 h-1 bg-white' 
                    : 'w-1 h-1 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Hero;