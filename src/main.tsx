import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled app error in RootErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 max-w-md w-full rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold text-white">Hubo un problema al cargar la aplicación</h1>
            <p className="text-sm text-slate-300">
              Ocurrió un error inesperado durante el inicio. Puedes reiniciar la interfaz para continuar.
            </p>
            {this.state.error?.message && (
              <div className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-rose-300 text-left overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 active:scale-98 transition rounded-xl font-medium text-white shadow-lg"
            >
              Reiniciar aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Service Worker handling:
// Inside the Google AI Studio editor iframe preview, unregister service workers
// so developer code edits reload cleanly without service worker intercept.
// When running outside the iframe (e.g. installed on phone or mobile browser),
// register the service worker for 100% offline capability and instant launch.
if ('serviceWorker' in navigator) {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  if (isIframe) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().then((ok) => {
          if (ok) console.log('Cleaned up previous ServiceWorker for AI Studio editor iframe:', reg.scope);
        });
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('PWA ServiceWorker registrado con éxito (Offline activo):', reg.scope);
        })
        .catch((err) => {
          console.warn('Error al registrar ServiceWorker:', err);
        });
    });
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
}
