import React, { useState, useEffect } from 'react';
import { COMMUNES } from '../constants';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, category?: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const communeItems = COMMUNES;

  const categoryItems = [
    { label: 'Bienes Raíces', action: () => onNavigate('listing', 'Bienes Raíces') },
    { label: 'Show room Cocinas', action: () => onNavigate('showroom') },
    { label: 'Desarrollos', action: () => onNavigate('listing', 'Desarrollos') },
    { label: 'Premium Property', action: () => onNavigate('listing', 'Premium Property') }
  ];

  const isHome = currentView === 'home';
  
  const headerBaseClass = isHome && !scrolled && !isMobileMenuOpen
    ? 'bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white'
    : 'bg-white text-leroy-black shadow-sm border-b border-gray-100';

  const buttonBorderClass = isHome && !scrolled && !isMobileMenuOpen ? 'border-white hover:bg-white/10' : 'border-leroy-black hover:bg-black/5';
  const logoColorClass = isHome && !scrolled && !isMobileMenuOpen ? 'text-white' : 'text-leroy-black';
  const hamburgerColorClass = isHome && !scrolled && !isMobileMenuOpen ? 'text-white' : 'text-leroy-black';

  const handleNav = (action: () => void) => {
    setIsMobileMenuOpen(false);
    action();
  };

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out py-4 md:py-6 ${headerBaseClass}`}>
      <div className="w-full px-6 md:px-12">
        <div className="flex flex-col items-start">
          
          <div className="flex justify-between items-end w-full mb-0 md:mb-3">
            <div className={`flex-shrink-0 cursor-pointer group ${logoColorClass}`} onClick={() => handleNav(() => onNavigate('home'))}>
              <div className="font-serif font-semibold tracking-tighter flex items-baseline hover:opacity-90 transition-opacity select-none">
                <span className="text-4xl md:text-5xl">L</span>
                <span className="text-2xl md:text-3xl">e</span>
                <span className="text-4xl md:text-5xl -ml-0.5">R</span>
                <span className="text-2xl md:text-3xl">oy</span>
                <span className="text-2xl md:text-3xl ml-2">Residence</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-6 mb-2">
              <button onClick={() => handleNav(() => onNavigate('admin'))} className={`text-xs font-bold tracking-widest uppercase hover:text-leroy-gold transition-colors ${isHome && !scrolled ? 'text-white' : 'text-gray-500'}`}>
                Ingresar
              </button>
            </div>
            
            <div className="md:hidden mb-1">
               <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`p-1 focus:outline-none ${hamburgerColorClass}`}>
                {isMobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className="hidden md:flex flex-col w-full items-start gap-y-2">
            <div className="flex flex-wrap gap-x-6">
              {communeItems.map((commune) => (
                <button key={commune} onClick={() => handleNav(() => onNavigate('listing', commune))} className={`text-[11px] font-bold tracking-[0.1em] uppercase hover:text-leroy-gold transition-colors ${isHome && !scrolled ? 'text-gray-200' : 'text-gray-600'}`}>
                  {commune}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4">
              {categoryItems.map((item) => (
                <button key={item.label} onClick={() => handleNav(item.action)} className={`bg-transparent border px-6 py-2 text-[11px] font-bold tracking-[0.15em] uppercase transition-all ${buttonBorderClass}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-100 flex flex-col p-6 animate-in slide-in-from-top-5 duration-300 h-screen overflow-y-auto pb-32">
          <div className="mb-8">
            <h4 className="text-xs font-bold uppercase tracking-widest text-leroy-gold mb-4">Ubicaciones</h4>
            <div className="grid grid-cols-1 gap-3 pl-2">
              {communeItems.map((commune) => (
                <button key={commune} onClick={() => handleNav(() => onNavigate('listing', commune))} className="text-left text-sm font-semibold text-leroy-black hover:text-leroy-gold py-1">
                  {commune}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-8 border-t border-gray-100 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-leroy-gold mb-4">Categorías</h4>
            <div className="flex flex-col gap-4">
              {categoryItems.map((item) => (
                <button key={item.label} onClick={() => handleNav(item.action)} className="w-full text-left bg-gray-50 border border-gray-200 px-4 py-3 text-xs font-bold tracking-widest uppercase text-leroy-black active:bg-gray-100">
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;