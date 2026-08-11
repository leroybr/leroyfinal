import React from 'react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
}

const UF_VALUE_CLP = 37800;
const USD_VALUE_CLP = 950;
const EUR_VALUE_CLP = 1020;

const formatCLP = (amount: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
  let mainPriceDisplay = '';
  let secondaryPriceDisplay = '';
  
  const cleanCurrency = property.currency.trim();
  const price = property.price;

  if (cleanCurrency === 'UF') {
    mainPriceDisplay = `UF ${price.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
    secondaryPriceDisplay = formatCLP(price * UF_VALUE_CLP);
  } else if (cleanCurrency === '$') {
    const clp = price * USD_VALUE_CLP;
    const uf = clp / UF_VALUE_CLP;
    mainPriceDisplay = `UF ${uf.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
    secondaryPriceDisplay = formatCLP(clp);
  } else if (cleanCurrency === '€') {
    const clp = price * EUR_VALUE_CLP;
    const uf = clp / UF_VALUE_CLP;
    mainPriceDisplay = `UF ${uf.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
    secondaryPriceDisplay = formatCLP(clp);
  } else {
    mainPriceDisplay = `${cleanCurrency} ${price.toLocaleString()}`;
  }

  return (
    <div onClick={onClick} className="group cursor-pointer flex flex-col h-full">
      <div className="relative overflow-hidden aspect-[4/3] bg-gray-200">
        <img 
          src={property.imageUrl} 
          alt={`${property.type} en ${property.location} - ${property.title}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold tracking-widest uppercase text-leroy-black">
          {property.type}
        </div>
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div className="pt-6 pb-2 flex-grow flex flex-col">
        <h3 className="font-serif text-xl text-leroy-black line-clamp-2 mb-2 group-hover:underline decoration-1 underline-offset-4">
          {property.title}
        </h3>
        <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-4">
          {property.location}
        </p>

        <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col items-start">
          <div className="flex flex-col w-full items-baseline">
            <span className="text-lg font-semibold text-leroy-black">
               {property.price === 0 ? 'Precio a consultar' : mainPriceDisplay}
            </span>
            {secondaryPriceDisplay && property.price > 0 && (
              <span className="text-sm text-gray-400 font-medium">
                {secondaryPriceDisplay}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 text-gray-400 text-xs mt-3">
             <span title="Habitaciones">{property.bedrooms} hab.</span>
             <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
             <span title="Área">{property.area} m²</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;