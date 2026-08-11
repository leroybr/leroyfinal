import React, { useState } from 'react';

interface ShowroomViewProps {
  onGoHome: () => void;
}

const KITCHEN_TRENDS = [
  {
    id: 1,
    title: "Cocinas de Inducción",
    category: "TE MOSTRAMOS AHORA",
    image: "", // Text only
    description: "Descubre la revolución de la cocina invisible. Superficies de porcelanato que cocinan, limpian y decoran. Una integración perfecta entre tecnología y diseño para el hogar moderno."
  },
  {
    id: 2,
    title: "Inducción Invisible TPB Tech",
    category: "Innovación",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800&auto=format&fit=crop",
    description: "La encimera desaparece. Cocina directamente sobre la superficie porcelánica, ganando espacio de trabajo y facilitando la limpieza absoluta."
  },
  {
    id: 3,
    title: "Minimalismo Orgánico",
    category: "Diseño",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
    description: "Uso de maderas nobles, piedras naturales sin tratar y líneas curvas que conectan la cocina con la naturaleza."
  },
  {
    id: 4,
    title: "Hornos de Vapor Combinado",
    category: "Electrodomésticos",
    image: "https://images.unsplash.com/photo-1590791182857-96acb4528994?q=80&w=800&auto=format&fit=crop",
    description: "La técnica de los restaurantes Michelin ahora en casa. Cocción sous-vide y control de humedad preciso desde tu smartphone."
  },
  {
    id: 5,
    title: "Grifería con Agua Filtrada y Gasificada",
    category: "Sustentabilidad",
    image: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?q=80&w=800&auto=format&fit=crop",
    description: "Adiós a las botellas de plástico. Obtén agua hirviendo, fría o con gas directamente del grifo de tu cocina."
  },
  {
    id: 6,
    title: "Iluminación Domótica Integrada",
    category: "Ambiente",
    image: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?q=80&w=800&auto=format&fit=crop",
    description: "Escenas de luz programables que se adaptan desde la preparación de alimentos hasta una cena romántica con un solo comando de voz."
  }
];

const INDUCTION_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1200&auto=format&fit=crop"
];

const FEATURES_LIST = [
  "Inducción invisible",
  "Seguridad avanzada",
  "50 % menos de consumo",
  "Solo se activa con utensilios aptos",
  "Reduce riesgo de quemaduras",
  "Superficie tibia, no caliente",
  "Apagado automático por tiempo o sobrecalentamiento"
];

const ShowroomView: React.FC<ShowroomViewProps> = ({ onGoHome }) => {
  const [showInductionGallery, setShowInductionGallery] = useState(false);

  return (
    <div className="pt-24 md:pt-40 pb-20 min-h-screen bg-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Back */}
        <div className="mb-8 md:mb-12">
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

        {/* Header Section */}
        <div className="mb-10 md:mb-16 border-b border-gray-100 pb-8 md:pb-10">
          <span className="text-xs font-bold text-leroy-gold tracking-[0.2em] uppercase mb-4 block">
            Showroom & Tendencias
          </span>
          
          <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-leroy-black mb-6 leading-tight">
            Nuevas tecnologías en la cocina
          </h1>
          
          <p className="font-prata text-lg md:text-2xl text-gray-600 max-w-4xl leading-relaxed text-left">
            Tu cocina, más eficiente, cómoda, y linda con todos los avances que te contamos.
          </p>
        </div>

        {/* Featured Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 md:gap-y-16">
          {KITCHEN_TRENDS.map((item, index) => {
            const isFirstItem = index === 0;
            const isSecondItem = item.id === 2;

            // Special layout for the first item (Text Only + Modal Trigger)
            if (isFirstItem) {
               return (
                 <article 
                   key={item.id}
                   onClick={() => setShowInductionGallery(true)} 
                   className="md:col-span-1 border-2 border-leroy-gold bg-gray-50 flex flex-col justify-center items-center p-6 md:p-8 text-center cursor-pointer hover:shadow-xl transition-shadow duration-300 min-h-[350px] md:min-h-[400px]"
                 >
                   <div className="bg-leroy-gold text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest mb-6 animate-pulse">
                     {item.category}
                   </div>
                   
                   <h3 className="font-serif text-3xl md:text-4xl text-leroy-black mb-6 leading-tight">
                     {item.title}
                   </h3>
                   
                   <p className="font-prata text-base md:text-lg text-gray-600 leading-relaxed mb-8">
                     {item.description}
                   </p>

                   <div className="mt-auto border-b-2 border-leroy-black pb-1 text-xs font-bold uppercase tracking-widest text-leroy-black group hover:text-leroy-gold hover:border-leroy-gold transition-colors">
                     Ver Galería de Imágenes
                   </div>
                 </article>
               );
            }

            // Special layout for Item 2: Features overlay on image
            if (isSecondItem) {
                return (
                    <article 
                        key={item.id} 
                        className="group cursor-pointer relative overflow-hidden h-[400px] md:h-full"
                    >
                        <img 
                            src={item.image} 
                            alt={item.title} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-6 md:p-8">
                            <span className="text-[10px] font-bold uppercase tracking-widest mb-2 text-leroy-gold">
                                {item.category}
                            </span>
                            <h3 className="font-serif text-2xl md:text-3xl text-white mb-4">
                                Inducción Invisible
                            </h3>
                            
                            {/* Feature List Overlay */}
                            <ul className="space-y-2 mb-4">
                                {FEATURES_LIST.map((feat, i) => (
                                    <li key={i} className="flex items-start text-white/90 font-inter text-xs md:text-sm font-medium">
                                        <svg className="w-4 h-4 text-leroy-gold mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </article>
                );
            }

            // Standard layout for other items
            return (
              <article 
                key={item.id} 
                className="group cursor-pointer relative flex flex-col"
              >
                <div className="overflow-hidden mb-6 aspect-[4/3]">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  {item.category}
                </span>
                
                <h3 className="font-serif text-xl md:text-2xl text-leroy-black mb-3 group-hover:underline decoration-1 underline-offset-4">
                  {item.title}
                </h3>
                
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  {item.description}
                </p>

                <div className="mt-auto pt-4 flex items-center text-xs font-bold uppercase tracking-widest text-leroy-black opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                  Leer más <span className="ml-2">&rarr;</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Modal for Induction Gallery */}
      {showInductionGallery && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex justify-center items-center p-4 overflow-y-auto"
          onClick={() => setShowInductionGallery(false)}
        >
          <div 
            className="w-full max-w-7xl relative my-4 md:my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowInductionGallery(false)}
              className="absolute -top-12 right-0 md:-right-4 z-10 text-white hover:text-leroy-gold transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Gallery Grid: Stack on mobile, 3-in-row on PC */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-0 md:px-4 pb-12 md:pb-0">
               {INDUCTION_GALLERY_IMAGES.map((img, idx) => (
                  <div key={idx} className="bg-white p-2 md:p-4 shadow-2xl border border-gray-100">
                      <div className="h-[300px] md:h-[600px] w-full overflow-hidden">
                          <img 
                             src={img} 
                             alt={`Induction Frame ${idx + 1}`} 
                             className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                          />
                      </div>
                  </div>
               ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ShowroomView;