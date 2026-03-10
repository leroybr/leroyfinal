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
    categoryImages: [] as { category: string, imageUrl: string }[],
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

  const [isProcessingImages, setIsProcessingImages] = useState(false);

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Export as JPEG with 0.7 quality to save significant space
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'main' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    try {
      if (field === 'main') {
        const resized = await resizeImage(files[0], 1600, 1200);
        setFormData(prev => ({ ...prev, imageUrl: resized }));
      } else {
        const fileList = Array.from(files);
        const newImages: { category: string, imageUrl: string }[] = [];
        
        for (let i = 0; i < fileList.length; i++) {
          const resized = await resizeImage(fileList[i], 1200, 900);
          newImages.push({ 
            category: `Imagen ${formData.categoryImages.length + i + 1}`, 
            imageUrl: resized 
          });
        }
        
        setFormData(prev => ({ 
          ...prev, 
          categoryImages: [...prev.categoryImages, ...newImages] 
        }));
      }
    } catch (error) {
      console.error('Error processing images:', error);
    } finally {
      setIsProcessingImages(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      categoryImages: prev.categoryImages.filter((_, i) => i !== index)
    }));
  };

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
      categoryImages: formData.categoryImages,
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Imagen Principal</label>
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  accept="image/*"
                  className="w-full text-[10px] text-gray-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-gray-50 file:text-black hover:file:bg-gray-100 cursor-pointer"
                  onChange={e => handleFileChange(e, 'main')}
                />
                <div className="flex gap-4 items-center">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest">O URL:</span>
                  <input 
                    type="text" 
                    placeholder="https://..."
                    className="flex-grow border-b border-gray-200 py-2 outline-none focus:border-black transition-colors text-[11px]"
                    value={formData.imageUrl}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                  />
                </div>
                {formData.imageUrl && (
                  <div className="mt-2 aspect-video w-full overflow-hidden bg-gray-50 border border-gray-100">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Galería de Imágenes (Opcional)</label>
              <div className="flex flex-col gap-4 p-4 border border-dashed border-gray-200 rounded-lg">
                <input 
                  type="file" 
                  multiple
                  accept="image/*"
                  className="w-full text-[10px] text-gray-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-black file:text-white hover:file:bg-orange-600 cursor-pointer transition-colors"
                  onChange={e => handleFileChange(e, 'gallery')}
                />
                <p className="text-[9px] text-gray-400 uppercase tracking-widest italic">
                  Nota: Las imágenes se guardan localmente. Evite subir archivos muy pesados para no exceder el límite del navegador.
                </p>
                
                {formData.categoryImages.length > 0 && (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                    {formData.categoryImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square group">
                        <img src={img.imageUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
          disabled={isProcessingImages}
          className={`w-full bg-black text-white py-4 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-orange-600 transition-colors flex items-center justify-center gap-4 ${isProcessingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessingImages ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Procesando Imágenes...
            </>
          ) : (
            <>
              <Plus size={18} />
              Publicar Propiedad
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AdminView;

