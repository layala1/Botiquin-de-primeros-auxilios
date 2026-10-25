import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  X,
  Smartphone,
  Monitor,
  Download,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Share2,
  PlusSquare,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeDeviceTab, setActiveDeviceTab] = useState<'android' | 'ios' | 'pc'>('android');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.href.split('?')[0]
      : 'https://ais-pre-oby3bxfukbg6in44h3xsua-170806060293.us-east1.run.app';

  // Generate QR code URL using standard public QR API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    currentUrl
  )}&color=0d9488&bgcolor=ffffff`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeInstall = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-teal-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                Instalar en Teléfono o PC
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Pruébala a pantalla completa como una app nativa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* If already running standalone */}
          {isInstalled && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold text-xs">
                ¡Esta aplicación ya está instalada y ejecutándose en modo nativo!
              </span>
            </div>
          )}

          {/* Quick Install Action if browser supports beforeinstallprompt */}
          {isInstallable && (
            <div className="p-4 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl text-white shadow-md shadow-teal-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm">Instalación con 1 Clic disponible</h3>
                <p className="text-xs text-teal-100 mt-0.5">
                  Tu navegador permite instalar la app directamente a tu dispositivo.
                </p>
              </div>
              <button
                onClick={handleNativeInstall}
                className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-teal-50 text-teal-800 font-extrabold text-xs rounded-xl shadow-xs shrink-0 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Ahora</span>
              </button>
            </div>
          )}

          {/* Scannable QR Code section */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-32 h-32 bg-white p-2 rounded-2xl border border-gray-200 shrink-0 flex items-center justify-center shadow-2xs">
              <img
                src={qrCodeUrl}
                alt="Código QR para abrir en teléfono"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full mb-1.5">
                <QrCode className="w-3.5 h-3.5" />
                <span>Abrir directo en el teléfono</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900">
                Apunta con la cámara de tu móvil
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Escanea este código QR con la cámara de tu teléfono móvil para abrir la aplicación al
                instante.
              </p>

              <button
                onClick={handleCopyLink}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:border-teal-500 rounded-xl text-xs font-semibold text-gray-700 shadow-2xs transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">¡Enlace copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Copiar enlace web</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Device Tabs Selector */}
          <div>
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600">
              <button
                onClick={() => setActiveDeviceTab('android')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeDeviceTab === 'android'
                    ? 'bg-white text-teal-800 font-bold shadow-xs'
                    : 'hover:text-gray-900'
                }`}
              >
                <span>🤖 Android</span>
              </button>
              <button
                onClick={() => setActiveDeviceTab('ios')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeDeviceTab === 'ios'
                    ? 'bg-white text-teal-800 font-bold shadow-xs'
                    : 'hover:text-gray-900'
                }`}
              >
                <span>🍏 iPhone / iPad</span>
              </button>
              <button
                onClick={() => setActiveDeviceTab('pc')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeDeviceTab === 'pc'
                    ? 'bg-white text-teal-800 font-bold shadow-xs'
                    : 'hover:text-gray-900'
                }`}
              >
                <span>💻 PC / Mac</span>
              </button>
            </div>

            {/* Tab 1: Android Instructions */}
            {activeDeviceTab === 'android' && (
              <div className="mt-3 p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
                <h4 className="font-bold text-gray-900 text-xs">
                  Pasos para instalar en Android (Google Chrome):
                </h4>
                <ol className="space-y-2 text-xs text-gray-700 list-decimal list-inside pl-1">
                  <li className="leading-relaxed">
                    Abre el enlace en el navegador <strong>Google Chrome</strong> en tu móvil.
                  </li>
                  <li className="leading-relaxed">
                    Toca el botón de <strong>tres puntos verticales (⋮)</strong> en la esquina
                    superior derecha.
                  </li>
                  <li className="leading-relaxed">
                    Toca en <strong>"Instalar aplicación"</strong> o{' '}
                    <strong>"Agregar a la pantalla principal"</strong> (según la versión de tu Android).
                  </li>
                  <li className="leading-relaxed">
                    Pulsa <strong>"Agregar" / "Instalar"</strong> para confirmar.
                  </li>
                </ol>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-[11px] leading-relaxed">
                  <p className="font-bold mb-1 text-amber-900">
                    💡 Si Chrome te dice "No se puede instalar la aplicación, sólo acceso directo":
                  </p>
                  <p className="mb-1.5">
                    Esto ocurre porque esta URL de desarrollo está protegida con tu cuenta privada de Google, por lo que el servidor externo de Google Play no puede empaquetarla como APK en la nube.
                  </p>
                  <p className="font-semibold text-teal-800">
                    👉 ¡No te preocupes! Pulsa en <strong>"Agregar acceso directo"</strong>. Ese icono en tu pantalla de inicio funciona al 100%: se abre a pantalla completa y tienes acceso total a la cámara, IA y tus botiquines.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: iOS Instructions */}
            {activeDeviceTab === 'ios' && (
              <div className="mt-3 p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
                <h4 className="font-bold text-gray-900 text-xs">
                  Pasos para instalar en iPhone o iPad (Safari):
                </h4>
                <ol className="space-y-2 text-xs text-gray-700 list-decimal list-inside pl-1">
                  <li className="leading-relaxed">
                    Abre el enlace usando el navegador <strong>Safari</strong> de Apple.
                  </li>
                  <li className="leading-relaxed">
                    Toca el botón de <strong>Compartir</strong> (icono de cuadrado con flecha hacia
                    arriba <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> en la
                    barra inferior).
                  </li>
                  <li className="leading-relaxed">
                    Desliza hacia abajo en el menú y toca{' '}
                    <strong>
                      "Agregar al inicio" (Add to Home Screen{' '}
                      <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-gray-700" />)
                    </strong>
                    .
                  </li>
                  <li className="leading-relaxed">
                    Toca <strong>"Agregar"</strong> arriba a la derecha. La app quedará en tu pantalla
                    de inicio como una app normal.
                  </li>
                </ol>
              </div>
            )}

            {/* Tab 3: PC Instructions */}
            {activeDeviceTab === 'pc' && (
              <div className="mt-3 p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
                <h4 className="font-bold text-gray-900 text-xs">
                  Pasos para probar o instalar en PC (Chrome o Edge):
                </h4>
                <ol className="space-y-2 text-xs text-gray-700 list-decimal list-inside pl-1">
                  <li className="leading-relaxed">
                    Abre la aplicación en tu computadora con <strong>Google Chrome</strong> o{' '}
                    <strong>Microsoft Edge</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Observa el extremo derecho de la barra de direcciones (donde escribes las URLs).
                    Verás un icono con forma de <strong>pantalla con flecha (🖥️ / ⊕)</strong> que
                    dice <em>"Instalar Botiquín"</em>.
                  </li>
                  <li className="leading-relaxed">
                    Haz clic en él y pulsa <strong>"Instalar"</strong>.
                  </li>
                  <li className="leading-relaxed">
                    Se creará un acceso directo en tu escritorio y la aplicación se ejecutará en su
                    propia ventana limpia e independiente.
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            Tanto en PC como en móvil, tus fotos y cajas se guardan automáticamente.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-semibold"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
