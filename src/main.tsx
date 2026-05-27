import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Silent handling for noisy Firebase errors in sandbox - MUST BE AT THE TOP
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason;
      const message = reason?.message || String(reason) || '';
      const code = reason?.code || '';
      const name = reason?.name || '';
      const stack = reason?.stack || '';
      
      const isSuppressedError = 
        message.toLowerCase().includes('installations') || 
        message.toLowerCase().includes('permission') ||
        message.toLowerCase().includes('403') ||
        message.toLowerCase().includes('interaction') ||
        message.toLowerCase().includes('not allowed') ||
        message.toLowerCase().includes('indexeddb') ||
        message.toLowerCase().includes('identitytoolkit') ||
        message.toLowerCase().includes('getprojectconfig') ||
        message.toLowerCase().includes('projectconfigservice') ||
        message.toLowerCase().includes('securetoken') ||
        message.toLowerCase().includes('googleapis') ||
        message.toLowerCase().includes('heartbeat') ||
        message.toLowerCase().includes('appcheck') ||
        message.toLowerCase().includes('blocked') ||
        message.toLowerCase().includes('cross-origin') ||
        message.toLowerCase().includes('failed to fetch') ||
        message.toLowerCase().includes('networkerror') ||
        message.toLowerCase().includes('resizeobserver') ||
        message.toLowerCase().includes('resize observer') ||
        message.toLowerCase().includes('analytics') ||
        message.toLowerCase().includes('extension') ||
        message.toLowerCase().includes('maps.googleapis') ||
        message.toLowerCase().includes('quota') ||
        message.toLowerCase().includes('storage') ||
        code.includes('installations') ||
        code.includes('permission') ||
        code.includes('auth/network-error') ||
        code.includes('auth/requests-to-this-api-identitytoolkit-method') ||
        code.includes('identitytoolkit') ||
        code.includes('failed-precondition') ||
        name.includes('Installations') ||
        stack.toLowerCase().includes('extension');

      if (isSuppressedError) {
        console.warn('[Suppressed Rejection] Firebase Background:', message || code || 'No message');
        event.preventDefault();
        event.stopPropagation();
      }
    } catch (err) {
      // Fallback
    }
  });

  window.addEventListener('error', (event) => {
    try {
      const message = event.message || '';
      if (message.toLowerCase().includes('identitytoolkit') || 
          message.toLowerCase().includes('getprojectconfig') ||
          message.toLowerCase().includes('googleapis') ||
          message.toLowerCase().includes('securetoken') ||
          message.toLowerCase().includes('blocked') ||
          message.toLowerCase().includes('resizeobserver') ||
          message.toLowerCase().includes('extension') ||
          message.toLowerCase().includes('failed to fetch') ||
          message.toLowerCase().includes('networkerror')) {
        console.warn('[Suppressed Error] Background Platform:', message);
        event.preventDefault();
        event.stopPropagation();
      }
    } catch (err) {
      // Fallback
    }
  }, true);
}

import { FirebaseProvider } from './components/FirebaseProvider';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <FirebaseProvider>
          <App />
        </FirebaseProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}