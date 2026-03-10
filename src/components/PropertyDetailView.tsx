
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Property } from '../types';
import { ENV } from '../env';
import { Share2, Instagram, MessageCircle, Copy, Check } from 'lucide-react';

interface PropertyDetailViewProps {
  property: Property;
  onGoHome?: () => void;
}

const UF_VALUE_CLP = 37800;
const USD_VALUE_CLP = 950;
const EUR_VALUE_CLP = 1020;

const getPriceDisplay = (price: number, currency: string = 'UF') => {
  const safePrice = price || 0;
  let priceUF = 0;
  let priceCLP = 0;
  const cleanCurrency = (currency || 'UF').trim();

  if (cleanCurrency === 'UF') {
    priceUF = safePrice;
    priceCLP = safePrice * UF_VALUE_CLP;
  } else if (cleanCurrency === '$' || cleanCurrency === 'USD') {
    priceCLP = safePrice * USD_VALUE_CLP;
    priceUF = priceCLP / UF_VALUE_CLP;
  } else if (cleanCurrency === '€') {
    priceCLP = safePrice * EUR_VALUE_CLP;
    priceUF = priceCLP / UF_VALUE_CLP;
  } else {
    priceCLP = safePrice;
    priceUF = safePrice / UF_VALUE_CLP;
  }

  return {
    uf: `UF ${priceUF.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`,
    clp: `$ ${priceCLP.toLocaleString('es-CL')}`
  };
};

const ADDITIONAL_IMAGES = [
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop", // Comedor Madera
  "https://images.unsplash.com/photo-1600607687644-c7171b42498f?q=80&w=1200&auto=format&fit=crop", // Cocina Isla Blanca
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop", // Terraza Exterior
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200&auto=format&fit=crop"  // Baño Lujo
];

const PropertyDetailView: React.FC<PropertyDetailViewProps> = ({ property, onGoHome }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // JSON-LD for Google SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": property.description,
    "url": window.location.href,
    "image": property.imageUrl,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": property.location,
      "addressCountry": "CL"
    },
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": property.currency
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = `Hola! Mira esta propiedad en LeRoy Residence: ${property.title} en ${property.location}. ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Use property.imageUrl as the first image, then add category images, then fallback to additional if needed
  const propertyGalleryImages = property.categoryImages?.map(ci => ci.imageUrl) || [];
  const galleryImages = [property.imageUrl, ...propertyGalleryImages];
  
  // If we still have very few images, add some fallbacks for a better look
  if (galleryImages.length < 5) {
    galleryImages.push(...ADDITIONAL_IMAGES.slice(0, 5 - galleryImages.length));
  }
  
  const { uf, clp } = getPriceDisplay(property.price, property.currency);
  const amenities = property.amenities && property.amenities.length > 0 
    ? property.amenities 
    : ['Seguridad 24/7', 'Estacionamiento', 'Vista Panorámica', 'Piscina'];

  return (
    <div className="pt-16 pb-4 bg-white min-h-screen">
      <Helmet>
        <title>{`${property.title} | LeRoy Residence`}</title>
        <meta name="description" content={`${property.title} en ${property.location}. ${property.bedrooms} dorm, ${property.bathrooms} baños. ${property.description.substring(0, 150)}...`} />
        <meta property="og:title" content={property.title} />
        <meta property="og:description" content={property.subtitle} />
        <meta property="og:image" content={property.imageUrl} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>
      {/* Navigation Bar */}
      <div className="max-w-7xl mx-auto px-8 mb-2 flex justify-between items-center">
        {onGoHome && (
          <button onClick={onGoHome} className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-leroy-orange transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Volver
          </button>
        )}
        <div className="flex space-x-4">
            <button 
              onClick={shareOnWhatsApp}
              className="p-2 border border-gray-100 rounded-full hover:border-green-500 hover:text-green-500 transition-all group relative"
              title="Compartir en WhatsApp"
            >
              <MessageCircle size={16} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">WhatsApp</span>
            </button>
            <button 
              onClick={handleCopyLink}
              className="p-2 border border-gray-100 rounded-full hover:border-leroy-orange hover:text-leroy-orange transition-all group relative"
              title="Copiar Link"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {copied ? 'Copiado!' : 'Copiar Link'}
              </span>
            </button>
            <button className="p-2 border border-gray-100 rounded-full hover:border-leroy-orange hover:text-leroy-orange transition-all"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg></button>
        </div>
      </div>

      {/* Main Gallery Grid */}
      <div className="max-w-7xl mx-auto px-8 mb-3 grid grid-cols-1 md:grid-cols-4 gap-1.5 h-[350px]">
          <div className="md:col-span-2 overflow-hidden cursor-pointer" onClick={() => setSelectedImage(galleryImages[0])}>
            <img src={galleryImages[0]} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" referrerPolicy="no-referrer" />
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-1.5">
            {galleryImages.slice(1, 5).map((img, i) => (
              <div key={i} className="overflow-hidden cursor-pointer" onClick={() => setSelectedImage(img)}>
                <img src={img} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Header Info */}
            <div className="mb-3">
              <div className="flex items-baseline gap-4 mb-1">
                <span className="font-serif text-4xl text-leroy-black">{uf}</span>
                <span className="text-lg text-gray-400">{clp}</span>
              </div>
              <h1 className="font-serif text-4xl text-leroy-black mb-2 leading-tight">{property.title}</h1>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-leroy-black font-medium mb-2">
                <span>{property.bedrooms} Habitaciones</span>
                <span className="text-gray-300">•</span>
                <span>{property.bathrooms} Baños</span>
                <span className="text-gray-300">•</span>
                <span>{property.area} Sqm</span>
                {property.landArea && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span>{property.landArea} Sqm lot</span>
                  </>
                )}
              </div>

              <div className="flex items-center text-sm font-medium text-[#008489] mb-3">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {property.location}
              </div>

              <div className="flex items-center gap-6 text-[11px] text-gray-400 font-medium border-t border-gray-100 pt-3">
                <div className="flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Actualizado: Ayer
                </div>
                <div className="flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  2,921
                </div>
                <div className="flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  226
                </div>
              </div>
            </div>

            {/* Galería por Categorías (JamesEdition Style) */}
            <div className="border-t border-gray-100 pt-6 mb-8 relative">
              <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-hide">
                {(property.categoryImages || [
                  { category: 'Exterior', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=400&auto=format&fit=crop' },
                  { category: 'Living', imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=400&auto=format&fit=crop' },
                  { category: 'Kitchen', imageUrl: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?q=80&w=400&auto=format&fit=crop' },
                  { category: 'Bedrooms', imageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=400&auto=format&fit=crop' },
                  { category: 'Bathrooms', imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=400&auto=format&fit=crop' },
                  { category: 'Other', imageUrl: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?q=80&w=400&auto=format&fit=crop' }
                ]).map((cat, idx) => (
                  <div key={idx} className="flex-shrink-0 w-40 group cursor-pointer" onClick={() => setSelectedImage(cat.imageUrl)}>
                    <div className="aspect-[4/5] overflow-hidden mb-1 bg-gray-100">
                      <img 
                        src={cat.imageUrl} 
                        alt={cat.category} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="text-[13px] text-center text-leroy-black font-medium">{cat.category}</p>
                  </div>
                ))}
              </div>
              {/* Navigation Arrow */}
              <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center z-10 hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
            </div>

            <div className="mb-5">
              <h3 className="font-serif text-2xl mb-3">Descripción</h3>
              <p className="text-gray-600 text-base leading-relaxed mb-3 whitespace-pre-wrap">{property.description}</p>
            </div>
            
            <div className="mb-5">
              <h3 className="font-serif text-2xl mb-3">Comodidades</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2">
                {amenities.map(a => (
                  <div key={a} className="flex items-center text-gray-500 text-sm font-medium">
                    <svg className="w-4 h-4 mr-2 text-leroy-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {a}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="relative">
            <div className="sticky top-32 bg-white p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden mr-4 bg-gray-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  </div>
                  <div>
                    <p className="font-bold text-base text-leroy-black uppercase tracking-[0.1em]">Janice Le Roy</p>
                    <p className="text-[10px] text-leroy-orange font-bold uppercase tracking-widest">Agente Exclusivo</p>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <a 
                    href={`https://wa.me/56994443591?text=Hola%20Janice,%20me%20interesa%20esta%20propiedad:%20${encodeURIComponent(property.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-leroy-black font-bold text-sm hover:text-leroy-orange transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                  <a href={`tel:${ENV.CONTACT_PHONE.replace(/\s/g, '')}`} className="flex items-center text-leroy-black font-bold text-sm hover:text-leroy-orange transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {ENV.CONTACT_PHONE}
                  </a>
                  <a href={`mailto:${ENV.CONTACT_EMAIL}`} className="flex items-center text-leroy-black font-bold text-sm hover:text-leroy-orange transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {ENV.CONTACT_EMAIL}
                  </a>
                </div>

                <form className="space-y-2">
                  <input type="text" placeholder="Tu nombre" className="w-full border border-gray-200 p-2 text-sm focus:border-[#008489] outline-none transition-colors" />
                  <input type="email" placeholder="Tu dirección de correo electrónico" className="w-full border border-gray-200 p-2 text-sm focus:border-[#008489] outline-none transition-colors" />
                  
                  <div className="flex">
                    <div className="w-20 border border-gray-200 border-r-0 p-2 text-sm flex items-center justify-between cursor-pointer">
                      <span>+56</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    <input type="tel" placeholder="Número de teléfono (opcional)" className="flex-grow border border-gray-200 p-2 text-sm focus:border-[#008489] outline-none transition-colors" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Su mensaje</label>
                    <textarea 
                      rows={4} 
                      className="w-full border border-gray-200 p-2 text-sm focus:border-[#008489] outline-none transition-colors resize-none"
                      defaultValue={`Por favor, contáctame sobre ${property.title}`}
                    ></textarea>
                  </div>

                  <button className="w-full bg-[#00666a] text-white py-4 text-sm font-bold transition-all hover:bg-[#004d50]">
                    Enviar mensaje
                  </button>
                </form>
            </div>
          </aside>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex justify-center items-center p-8 cursor-zoom-out" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} className="max-w-full max-h-full object-contain shadow-2xl" referrerPolicy="no-referrer" />
        </div>
      )}
    </div>
  );
};

export default PropertyDetailView;
