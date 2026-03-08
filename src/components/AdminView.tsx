import React, { useState } from 'react';
import { Property, PropertyType, ListingType } from '../types';
import { Plus, X } from 'lucide-react';
import { COMMUNES } from '../constants';

interface AdminViewProps {
  onAddProperty: (prop: Property) => void;
  onCancel: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onAddProperty, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    location: COMMUNES[0],
    price: '',
    currency: 'UF',
    imageUrl: '',
    bedrooms: '0',
    bathrooms: '0',
    area: '0',
    landArea: '0',
    parking: '0',
    type: PropertyType.HOUSE,
    listingType: ListingType.SALE,
    description: '',
    amenities: '',
    isPremium: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProperty: Property = {
      id: Date.now().toString(),
      title: formData.title,
      subtitle: formData.subtitle,
      location: `${formData.location}, Chile`,
      price: parseFloat(formData.price) || 0,
      currency: formData.currency,
      imageUrl: formData.imageUrl || 'https://picsum.photos/seed/new/1200/1500',
      bedrooms: parseInt(formData.bedrooms) || 0,
      bathrooms: parseInt(formData.bathrooms) || 0,
      area: parseInt(formData.area) || 0,
      landArea: parseInt(formData.landArea) || 0,
      parking: parseInt(formData.parking) || 0,
      type: formData.type,
      listingType: formData.listingType,
      description: formData.description,
      amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a !== ''),
      isPremium: formData.isPremium
    };
    onAddProperty(newProperty);
  };

  return (
    <div className="pt-24 pb-12 px-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-serif">Panel de Gestión</h1>
        <button onClick={onCancel} className="text-gray-400 hover:text-black">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500 mb-4">Información Pública</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Título</label>
              <input 
                required
                type="text" 
                className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Subtítulo</label>
              <input 
                required
                type="text" 
                className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors"
                value={formData.subtitle}
                onChange={e => setFormData({...formData, subtitle: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Comuna</label>
              <select 
                required
                className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors bg-transparent"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              >
                {COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Precio</label>
                <input 
                  required
                  type="number" 
                  className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Moneda</label>
                <select 
                  className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors bg-transparent"
                  value={formData.currency}
                  onChange={e => setFormData({...formData, currency: e.target.value})}
                >
                  <option value="UF">UF</option>
                  <option value="CLP">CLP</option>
                  <option value="USD">USD</option>
                  <option value="€">€</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">URL Imagen</label>
              <input 
                type="text" 
                className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors"
                value={formData.imageUrl}
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dorm.</label>
                <input type="number" className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Baños</label>
                <input type="number" className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">m²</label>
                <input type="number" className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Land m²</label>
                <input type="number" className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors" value={formData.landArea} onChange={e => setFormData({...formData, landArea: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Parking</label>
                <input type="number" className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors" value={formData.parking} onChange={e => setFormData({...formData, parking: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo</label>
              <select 
                className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors bg-transparent"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as PropertyType})}
              >
                {Object.values(PropertyType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Operación</label>
              <select 
                className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors bg-transparent"
                value={formData.listingType}
                onChange={e => setFormData({...formData, listingType: e.target.value as ListingType})}
              >
                {Object.values(ListingType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Amenidades (separadas por coma)</label>
            <input 
              type="text" 
              className="w-full border-b border-gray-200 py-3 outline-none focus:border-black transition-colors"
              value={formData.amenities}
              onChange={e => setFormData({...formData, amenities: e.target.value})}
            />
          </div>
          <div className="mt-4 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Descripción</label>
            <textarea 
              className="w-full border border-gray-200 p-4 h-32 outline-none focus:border-black transition-colors"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <input 
              type="checkbox" 
              id="isPremium"
              checked={formData.isPremium}
              onChange={e => setFormData({...formData, isPremium: e.target.checked})}
            />
            <label htmlFor="isPremium" className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Propiedad Premium</label>
          </div>
        </section>

        <button 
          type="submit"
          className="w-full bg-black text-white py-4 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-orange-600 transition-colors flex items-center justify-center gap-4"
        >
          <Plus size={18} />
          Publicar Propiedad
        </button>
      </form>
    </div>
  );
};

export default AdminView;
