import React, { useState, useEffect, useRef } from 'react';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentView: 'home' | 'listing' | 'admin' | 'detail';
  onContactHover: (show: boolean) => void;
  showContactForm: boolean;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView, onContactHover, showContactForm }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showRealEstateDropdown, setShowRealEstateDropdown] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '', type: 'comprar' });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Mensaje enviado con éxito para: ${formData.type}`);
    setFormData({ name: '', email: '', phone: '', message: '', type: 'comprar' });
    onContactHover(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRealEstateDropdown(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isHome = currentView === 'home';
  // El fondo negro llega exactamente hasta la línea divisoria
  const headerBaseClass = 'bg-black text-white shadow-xl';

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${headerBaseClass}`}>
      <div className="w-full px-6 md:px-10 pt-2.5 md:pt-3 pb-2 bg-black">
        {/* Top Row: Logo & Search */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-baseline gap-16 md:gap-24">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => onNavigate('home')}>
              <h1 className="font-serif text-xl md:text-3xl tracking-[0.18em] uppercase flex items-center group text-white">
                LeRoy <span className="ml-2 md:ml-3 font-light text-leroy-orange group-hover:text-amber-400 transition-colors duration-300">Residence</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button 
              onClick={() => onNavigate('real_estate_sale')}
              aria-label="Buscar propiedades" 
              className="p-2 text-white/80 hover:text-leroy-orange hover:bg-white/5 rounded-full transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Separator Line */}
        <div className="w-full h-[1px] bg-white/15"></div>

        {/* Middle Row: Contact & Primary Navigation */}
        <div className="flex justify-between items-center py-2 relative">
          <div className="flex flex-wrap gap-4 md:gap-8 items-center">
            <button 
              onMouseEnter={() => onContactHover(true)}
              onMouseLeave={() => onContactHover(false)}
              onClick={() => onContactHover(!showContactForm)}
              className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em] text-white/90 hover:text-leroy-orange transition-colors"
            >
              ¿QUIERES: VENDER / COMPRAR / ARRENDAR?
            </button>
            
            <div className="w-px h-3.5 bg-white/20 hidden md:block"></div>

            <div className="flex items-center gap-4 md:gap-6">
              <button 
                onClick={() => onNavigate('real_estate_sale')} 
                className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em] text-leroy-orange hover:text-white px-2.5 py-1 rounded bg-white/5 hover:bg-leroy-orange/20 border border-leroy-orange/30 transition-all shadow-sm"
              >
                En Venta
              </button>
              <button 
                onClick={() => onNavigate('real_estate_rent')} 
                className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em] text-white/90 hover:text-leroy-orange px-2.5 py-1 rounded hover:bg-white/5 border border-transparent hover:border-white/20 transition-all"
              >
                En Arriendo
              </button>
            </div>
          </div>


          {/* Dropdown Contact Form */}
          <div 
            className={`absolute top-full left-0 mt-1 z-[110] transition-all duration-500 ${showContactForm ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
            onMouseEnter={() => onContactHover(true)}
            onMouseLeave={() => onContactHover(false)}
          >
            <div className="bg-white p-3 rounded shadow-2xl border border-gray-100 w-64">
              <div className="flex items-baseline gap-2 mb-3">
                <h3 className="text-leroy-black font-serif text-sm">Contáctame:</h3>
                <div className="relative flex items-center group/select">
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="bg-transparent border-none pr-4 text-[11px] font-serif text-leroy-orange outline-none cursor-pointer appearance-none relative z-10"
                  >
                    <option value="vender" className="text-leroy-black">Quiero vender</option>
                    <option value="comprar" className="text-leroy-black">Quiero comprar</option>
                    <option value="arrendar" className="text-leroy-black">Quiero arrendar</option>
                  </select>
                  <div className="absolute right-0 pointer-events-none z-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2 h-2 text-leroy-orange">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </div>
              <form onSubmit={handleContactSubmit} className="space-y-2">
                <input 
                  required
                  type="text" 
                  placeholder="Nombre" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded px-2 py-1.5 text-[10px] outline-none focus:border-leroy-orange transition-all text-leroy-black"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    required
                    type="email" 
                    placeholder="Correo" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded px-2 py-1.5 text-[10px] outline-none focus:border-leroy-orange transition-all text-leroy-black"
                  />
                  <input 
                    required
                    type="tel" 
                    placeholder="Teléfono" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded px-2 py-1.5 text-[10px] outline-none focus:border-leroy-orange transition-all text-leroy-black"
                  />
                </div>
                <textarea 
                  required
                  placeholder="Comentario" 
                  rows={2}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded px-2 py-1.5 text-[10px] outline-none focus:border-leroy-orange transition-all text-leroy-black resize-none"
                ></textarea>
                <button 
                  type="submit"
                  className="w-full bg-leroy-black text-white py-2 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-leroy-orange transition-all"
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Línea divisoria exacta: El fondo negro termina exactamente en esta línea */}
      <div className="w-full h-[1px] bg-white/20"></div>
    </header>
  );
};

export default Header;
