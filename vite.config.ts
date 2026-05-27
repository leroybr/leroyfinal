import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({mode}) => {
  // Cargamos las variables de entorno del sistema y archivos locales
  const env = loadEnv(mode, process.cwd(), '');
  
  // Consolidamos la API Key de Gemini buscando en todas las fuentes posibles
  const GEMINI_KEY = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Mantenemos tus definiciones específicas para Gemini para asegurar que siempre estén disponibles
      'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_KEY),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(GEMINI_KEY),
      
      // Aseguramos que todas las variables de Firebase estén disponibles en el cliente
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || env.VITE_FIREBASE_FIRESTOR || env.FIREBASE_API_KEY),
      'import.meta.env.VITE_FIREBASE_FIRESTOR': JSON.stringify(env.VITE_FIREBASE_FIRESTOR),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || env.VITE_FIREBASE_AUTH_DO),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET || env.VITE_FIREBASE_STORAGE),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.VITE_FIREBASE_MESSAGI),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
      'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID || env.VITE_FIREBASE_MEASURE),
      'import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID': JSON.stringify(env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || env.VITE_FIREBASE_FIRESTORE),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // Se agrega esta sección para que Vercel encuentre la dependencia de Recharts
    optimizeDeps: {
      include: ['react-is'],
    },
    build: {
      chunkSizeWarningLimit: 2000,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});