import React, { useState } from 'react';
import { Property, PropertyType } from '../types';
import { COMMUNES } from '../constants';

interface AdminViewProps {
  onAddProperty: (property: Property) => void;
  onCancel: () => void;
}

const COMMON_AMENITIES = [
  'Seguridad 24/7', 'Piscina Privada', 'Piscina Temperada', 'Quincho / BBQ', 
  'Jardines', 'Estacionamiento', 'Vista Panorámica', 'Calefacción Central', 
  'Bodega', 'Gimnasio', 'Spa', 'Domótica', 'Cava de Vinos', 'Cine en Casa'
];

const AdminView: React.FC<AdminViewProps> = ({ onAddProperty, onCancel }) => {
  // Public Data State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [location, setLocation] = useState(COMMUNES[0]);
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState('UF'); // Default to UF
  const [type, setType] = useState<PropertyType>(PropertyType.VILLA);
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [area, setArea] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isPremium, setIsPremium] = useState(false); // New state for Premium flag

  // Private Data State
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [legalDescription, setLegalDescription] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newProperty: Property = {
      id: `custom-${Date.now()}`,
      title,
      subtitle: subtitle || title, // Fallback if empty
      location: `${location}, Chile`,
      price,
      currency,
      type,
      bedrooms,
      bathrooms,
      area,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=800&auto=format&fit=crop', 
      description,
      amenities: selectedAmenities,
      isPremium, // Include flag
      privateData: {
        ownerName,
        ownerPhone,
        legalDescription,
        privateNotes
      }
    };

    onAddProperty(newProperty);
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-serif text-3xl text-leroy-black">Nueva Ficha de Propiedad</h1>
          <button onClick={onCancel} className="text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-black">
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Public Data Section */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center border-b pb-2 mb-6">
                <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-leroy-gold">
                Datos Públicos (Visible en Web)
                </h2>
                
                {/* Premium Toggle */}
                <label className="flex items-center space-x-3 cursor-pointer select-none">
                    <span className="text-xs font-bold uppercase tracking-widest text-leroy-black">Clasificación Premium</span>
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            checked={isPremium} 
                            onChange={(e) => setIsPremium(e.target.checked)} 
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-leroy-gold"></div>
                    </div>
                </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Título Principal</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border-gray-200 bg-gray-50 p-3 rounded text-sm focus:border-leroy-gold focus:ring-0" placeholder="Ej: Espectacular Casa en El Venado" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Subtítulo / Bajada (Estilo Elegante)</label>
                <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full border-gray-200 bg-gray-50 p-3 rounded text-sm focus:border-leroy-gold focus:ring-0" placeholder="Ej: Propiedad heredada poco común en las fincas..." />
                <p className="text-[10px] text-gray-400 mt-1">Este texto aparecerá debajo del precio en letra cursiva elegante.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Ubicación (Comuna)</label>
                <select value={location} onChange={e => setLocation(e.target.value)} className="w-full border-gray-200 bg-gray-50 p-3 rounded text-sm focus:border-leroy-gold focus:ring-0">
                  {COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tipo de Propiedad</label>
                <select value={type} onChange={e => setType(e.target.value as PropertyType)} className="w-full border-gray-200 bg-gray-50 p-3 rounded text-sm focus:border-leroy-gold focus:ring-0">
                  {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Precio</label>
                <input required type="number" min="0" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full border-gray-200 bg-gray-50 p-3 rounded text-sm focus:border-leroy-gold focus:ring-0" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Moneda</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full border-gray-200 bg-gray-50 p-3 rounded text-sm focus:border-leroy-gold focus:ring-0">
                  <option value="UF">UF</option>
                  <option value="$">Pesos (CLP)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4 col-span-2 md:col-span-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Dormitorios</label>
                  <input type="number" min="0" value={bedrooms} onChange={e => setBedrooms(Number(e.target.value))} className="w-full border-gray-200 bg-gray-50 p-3 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Baños</label>
                  <input type="number" min="0" value={bathrooms} onChange={e => setBathrooms(Number(e.target.value))} className="w-full border-gray-200 bg-gray-50 p-3 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">M2 Totales</label>
                  <input type="number" min="0" value={area} onChange={e => setArea(Number(e.target.value))} className="w-full border-gray-200 bg-gray-50 p-3 rounded text-sm" />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">URL de Imagen Principal</label>
                <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full border-gray-200 bg-gray-50 p-3 rounded text-sm" placeholder="https://..." />
                <p className="text-[10px] text-gray-400 mt-1">Si se deja vacío, se usará una imagen genérica.</p>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Descripción Detallada</label>
                <textarea required rows={5} value={description} onChange={e => setDescription(e.target.value)} className="w-full border-gray-200 bg-gray-50 p-3 rounded text-sm" placeholder="Describa la propiedad, el entorno y los detalles de lujo..."></textarea>
              </div>

              <div className="col-span-2">
                 <label className="block text-xs font-bold uppercase text-gray-500 mb-3">Comodidades / Amenities</label>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {COMMON_AMENITIES.map(amenity => (
                      <label key={amenity} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedAmenities.includes(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                          className="rounded text-leroy-black focus:ring-0" 
                        />
                        <span>{amenity}</span>
                      </label>
                    ))}
                 </div>
              </div>
            </div>
          </div>

          {/* Private Data Section */}
          <div className="bg-red-50 p-8 rounded-lg shadow-sm border border-red-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-100 px-3 py-1 rounded-bl-lg text-[10px] font-bold text-red-800 uppercase tracking-widest">
              Confidencial
            </div>
            <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-red-800 mb-6 border-b border-red-200 pb-2">
              Datos Privados (Uso Interno)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Nombre Propietario</label>
                <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} className="w-full border-red-100 bg-white p-3 rounded text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Teléfono / Contacto</label>
                <input type="text" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} className="w-full border-red-100 bg-white p-3 rounded text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Datos Legales (Rol, Inscripción)</label>
                <input type="text" value={legalDescription} onChange={e => setLegalDescription(e.target.value)} className="w-full border-red-100 bg-white p-3 rounded text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Notas Internas</label>
                <textarea rows={3} value={privateNotes} onChange={e => setPrivateNotes(e.target.value)} className="w-full border-red-100 bg-white p-3 rounded text-sm" placeholder="Acuerdos de comisión, disponibilidad de llaves, etc."></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
             <button type="submit" className="bg-leroy-black text-white px-10 py-4 rounded text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg">
               Guardar y Publicar
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminView;