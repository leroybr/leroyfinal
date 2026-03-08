import React, { useState } from 'react';

interface AdminLoginViewProps {
  onSuccess: () => void;
  onCancel: () => void;
  mode?: 'login' | 'logout';
}

const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onSuccess, onCancel, mode = 'login' }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // CONTRASEÑA PRIVADA: TR$1208
    if (password === 'TR$1208') {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Background Blur Overlay */}
      <div className="absolute inset-0 bg-leroy-black/40 backdrop-blur-md" onClick={onCancel}></div>
      
      {/* Login Card */}
      <div className="relative bg-white w-full max-w-md p-6 shadow-2xl border border-gray-100 animate-fadeIn">
        <div className="text-center mb-5">
          <h2 className="font-serif text-3xl text-leroy-black mb-2">
            {mode === 'login' ? 'Acceso Privado' : 'Confirmar Salida'}
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {mode === 'login' ? 'Solo Personal Autorizado' : 'Ingresa la clave para cerrar sesión'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-[9px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Contraseña de Administrador</label>
            <input 
              autoFocus
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full border-b-2 py-3 text-center text-lg outline-none transition-all ${error ? 'border-red-500 text-red-500' : 'border-gray-100 focus:border-leroy-orange'}`}
            />
            {error && (
              <p className="absolute -bottom-6 left-0 w-full text-center text-[9px] font-bold text-red-500 uppercase tracking-widest animate-bounce">
                Clave incorrecta
              </p>
            )}
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <button 
              type="submit" 
              className={`w-full text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-lg ${mode === 'login' ? 'bg-leroy-black hover:bg-leroy-orange' : 'bg-leroy-orange hover:bg-leroy-black'}`}
            >
              {mode === 'login' ? 'Entrar al Panel' : 'Cerrar Sesión'}
            </button>
            <button 
              type="button"
              onClick={onCancel}
              className="w-full text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-leroy-black transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-50 text-center">
          <span className="font-serif italic text-gray-300 text-sm italic">LeRoy Residence Security System</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginView;
