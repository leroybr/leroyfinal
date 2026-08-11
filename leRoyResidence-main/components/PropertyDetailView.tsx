import React, { useState } from 'react';
import { Property } from '../types';

interface PropertyDetailViewProps {
  property: Property;
  onGoHome: () => void;
}

const UF_VALUE_CLP = 37800;
const USD_VALUE_CLP = 950;
const EUR_VALUE_CLP = 1020;

const getPriceDisplay = (price: number, currency: string) => {
  let priceUF = 0;
  let priceCLP = 0;
  const cleanCurrency = currency.trim();

  if (cleanCurrency === 'UF') {
    priceUF = price;
    priceCLP = price * UF_VALUE_CLP;
  } else if (cleanCurrency === '$' || cleanCurrency === 'USD') {
    priceCLP = price * USD_VALUE_CLP;
    priceUF = priceCLP / UF_VALUE_CLP;
  } else if (cleanCurrency === '€') {
    priceCLP = price * EUR_VALUE_CLP;
    priceUF = priceCLP / UF_VALUE_CLP;
  } else {
    priceCLP = price;
    priceUF = price / UF_VALUE_CLP;
  }

  return {
    uf: `UF ${priceUF.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`,
    clp: `$ ${priceCLP.toLocaleString('es-CL')}`
  };
};

const ADDITIONAL_IMAGES = [
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=800&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop"  
];

const PropertyDetailView: React.FC<PropertyDetailViewProps> = ({ property, onGoHome }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState('');
  
  const galleryImages = [property.imageUrl, ...ADDITIONAL_IMAGES];
  const { uf, clp } = getPriceDisplay(property.price, property.currency);
  
  const amenities = property.amenities && property.amenities.length > 0 
    ? property.amenities 
    : ['Seguridad', 'Estacionamiento', 'Jardines'];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-digit characters
    const rawValue = e.target.value.replace(/\D/g, '');
    
    // Limit to 8 digits (Chilean mobile number length after +56 9)
    const truncated = rawValue.slice(0, 8);
    
    // Format as XXXX XXXX
    let formatted = truncated;
    if (truncated.length > 4) {
      formatted = `${truncated.slice(0, 4)} ${truncated.slice(4)}`;
    }
    
    setContactPhone(formatted);
  };

  return (
    <div className="pt-40 pb-20 bg-white min-h-screen font-sans relative">
      <style>{`
        .gallery {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr; 
          grid-template-rows: 250px 250px;
          gap: 10px;
          height: 510px;
        }
        @media (max-width: 768px) {
          .gallery {
            display: flex;
            flex-direction: column;
            height: auto;
          }
          .gallery img {
            height: 250px;
          }
        }
        .gallery img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 0px;
          cursor: pointer;
          transition: filter 0.3s ease;
        }
        .gallery img:hover {
            filter: brightness(0.9);
        }
        .gallery img:nth-child(1) {
          grid-column: 1 / 2;
          grid-row: 1 / 3;
        }
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.95);
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: zoom-out;
          z-index: 9999;
          animation: fadeIn 0.3s ease;
        }
        .modal img {
          max-width: 90%;
          max-height: 90%;
          border-radius: 2px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .contact-container {
          width: 50%;
          border: 2px solid rgb(0, 108, 117);
          border-radius: 0px;
          margin-top: 4rem;
          margin-left: 0;
          overflow: hidden;
        }
        @media (max-width: 768px) {
           .contact-container {
             width: 100%;
             margin-top: 2rem;
             border-width: 1px;
           }
        }
        .contact-header {
          background-color: rgb(0, 108, 117);
          color: white;
          padding: 1rem;
          text-align: left;
        }
        .contact-body {
          padding: 1.5rem;
          background-color: white;
        }
        @media (max-width: 768px) {
          .contact-body {
            padding: 1.25rem;
          }
        }
        .teal-input {
          width: 100%;
          background-color: white;
          color: black;
          border: 1px solid rgb(0, 108, 117);
          padding: 10px 12px;
          font-size: 0.85rem;
          margin-bottom: 12px;
          outline: none;
          border-radius: 0;
          transition: border-color 0.2s;
        }
        @media (max-width: 768px) {
          .teal-input {
            font-size: 16px; /* Prevents iOS zoom */
            padding: 12px 14px;
            margin-bottom: 16px;
          }
        }
        .teal-input:focus {
          border-color: #004d55;
          background-color: #fcfcfc;
        }
        .teal-input::placeholder {
          color: #999;
        }
        .phone-row {
           display: flex;
           margin-bottom: 12px;
           width: 100%;
        }
        @media (max-width: 768px) {
          .phone-row {
            margin-bottom: 16px;
          }
        }
        .phone-prefix {
           background-color: rgb(0, 108, 117);
           color: white;
           padding: 10px 12px;
           font-size: 0.85rem;
           border: 1px solid rgb(0, 108, 117);
           display: flex;
           align-items: center;
           white-space: nowrap;
           font-weight: bold;
        }
        @media (max-width: 768px) {
          .phone-prefix {
            font-size: 16px;
            padding: 12px 14px;
          }
        }
        .teal-btn {
          width: 100%;
          background-color: rgb(0, 108, 117);
          color: white;
          font-weight: bold;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 1rem;
          margin-top: 0.5rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .teal-btn:hover {
           background-color: #005a61;
        }
        @media (max-width: 768px) {
          .teal-btn {
            padding: 1.2rem;
            font-size: 0.9rem;
          }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <nav className="text-xs text-gray-400 mb-6 uppercase tracking-wider font-sans">
          <span>Inicio</span> <span className="mx-2">/</span>
          <span>Bienes Raíces</span> <span className="mx-2">/</span>
          <span>{property.location.split(',')[0]}</span> <span className="mx-2">/</span>
          <span className="text-leroy-black font-semibold">{property.id}</span>
        </nav>
        
        <div className="flex flex-col justify-start items-start gap-4">
          <div className="w-full">
            <h1 className="font-serif font-semibold text-3xl md:text-4xl text-leroy-black mb-3 leading-tight">
              {property.title}
            </h1>
            <div className="flex items-center text-sm font-bold uppercase tracking-widest text-gray-500 font-sans">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              {property.location}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="gallery">
           {galleryImages.map((imgUrl, index) => (
             <img 
               key={index}
               src={imgUrl} 
               alt={`Vista de propiedad ${property.title} ${index + 1}`}
               onClick={() => setSelectedImage(imgUrl)}
               loading="lazy"
             />
           ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex flex-col items-start">
          <div className="flex items-baseline gap-4 mb-4">
            <span className="font-serif font-semibold text-5xl text-leroy-black">
              {uf}
            </span>
            <span className="font-sans text-xl text-gray-500 font-normal">
              ({clp})
            </span>
          </div>
          <p className="font-prata font-normal text-[24px] text-leroy-black leading-tight max-w-5xl">
            {property.subtitle || property.title}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-8 py-6 border-y border-gray-100 font-inter text-[16px] font-bold text-black mb-12">
            <div className="flex items-center gap-2">
                <span>{property.bedrooms}</span> <span>Dormitorios</span>
            </div>
            <div className="flex items-center gap-2">
                <span>{property.bathrooms}</span> <span>Baños</span>
            </div>
            <div className="flex items-center gap-2">
                <span>{property.area}</span> <span>m² (aprox)</span>
            </div>
        </div>

        <div className="mb-12">
            <h3 className="font-prata text-[28px] mb-4 font-normal text-leroy-black">Sobre esta propiedad</h3>
            <p className="font-inter text-[14px] text-[#151515] leading-relaxed mb-4 max-w-4xl whitespace-pre-wrap">
            {property.description}
            </p>
        </div>

        <div className="mb-12">
            <h3 className="font-serif text-2xl mb-6 font-normal">Comodidades</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {amenities.map((amenity, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-600 text-sm">
                <svg className="w-4 h-4 text-leroy-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {amenity}
                </div>
            ))}
            </div>
        </div>
        
        <div className="contact-container">
            <div className="contact-header">
                <h3>Contacto</h3>
            </div>
            <div className="contact-body">
                <form className="flex flex-col" onSubmit={(e) => e.preventDefault()}>
                    <input type="text" placeholder="Tu Nombre" className="teal-input" />
                    <input type="email" placeholder="Tu Email" className="teal-input" />
                    <div className="phone-row">
                        <div className="phone-prefix">+56 9</div>
                        <input 
                          type="tel" 
                          value={contactPhone}
                          onChange={handlePhoneChange}
                          placeholder="1234 5678" 
                          className="teal-input" 
                          style={{ marginBottom: 0, borderLeft: 'none' }} 
                          maxLength={9} // 8 digits + 1 space
                        />
                    </div>
                    <textarea rows={4} placeholder="Me interesa esta propiedad..." className="teal-input resize-none"></textarea>
                    <button className="teal-btn">Enviar Mensaje</button>
                    <p className="text-[10px] text-center text-black mt-3">Al enviar, aceptas nuestros términos de servicio.</p>
                </form>
            </div>
        </div>
      </div>

      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <img 
             src={selectedImage} 
             alt="Fullscreen View" 
             onClick={(e) => e.stopPropagation()} 
             loading="lazy" 
          />
          <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 text-white hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailView;