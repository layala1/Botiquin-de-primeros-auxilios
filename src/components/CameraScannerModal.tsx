import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MedicineBox, AIAnalysisResultItem } from '../types';
import { compressImage } from '../utils/imageCompressor';
import {
  Camera,
  X,
  FlipHorizontal,
  Upload,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Zap,
  Plus,
  Trash2,
  ZoomIn,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  boxes: MedicineBox[];
  activeBoxId: string | 'all';
  onAnalysisSuccess: (
    items: AIAnalysisResultItem[],
    photos: string[],
    targetBoxId: string,
    summary?: string
  ) => void;
  onOpenManualEntry: (targetBoxId: string) => void;
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  boxes,
  activeBoxId,
  onAnalysisSuccess,
  onOpenManualEntry,
}) => {
  const [selectedBoxId, setSelectedBoxId] = useState<string>(
    activeBoxId === 'all' ? (boxes[0]?.id || '') : activeBoxId
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Multi-photo state: array of captured base64 images
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [isCapturingMore, setIsCapturingMore] = useState<boolean>(false);

  const [userHint, setUserHint] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  // Update selected box if activeBoxId changes or boxes change
  useEffect(() => {
    if (activeBoxId !== 'all') {
      setSelectedBoxId(activeBoxId);
    } else if (boxes.length > 0 && (!selectedBoxId || !boxes.some((b) => b.id === selectedBoxId))) {
      setSelectedBoxId(boxes[0].id);
    }
  }, [activeBoxId, boxes, selectedBoxId]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setIsLoadingCamera(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'Tu navegador no soporta la cámara en vivo. Puedes usar la cámara nativa con el botón de abajo.'
        );
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video autoPlay was deferred:', playErr);
        }
      }

      setCameraActive(true);
      setIsLoadingCamera(false);

      // Check torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities ? (track.getCapabilities() as any) : {};
      setHasTorch(!!capabilities?.torch);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsLoadingCamera(false);
      setCameraActive(false);
      setCameraError(
        'No se pudo activar el visor en vivo (permiso no concedido o cámara ocupada). Puedes usar el botón de "Cámara Nativa" para tomar las fotos.'
      );
    }
  }, [facingMode, stopCamera]);

  // Callback ref guarantees stream is attached as soon as the video element is mounted in DOM
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && streamRef.current && element.srcObject !== streamRef.current) {
      element.srcObject = streamRef.current;
      element.muted = true;
      element.play().catch(() => {});
    }
  }, []);

  // Whenever the modal opens (isOpen becomes true), reset ALL state completely
  useEffect(() => {
    if (isOpen) {
      setCapturedPhotos([]);
      setActivePreviewIndex(0);
      setIsCapturingMore(false);
      setUserHint('');
      setAnalysisError(null);
      setIsAnalyzing(false);
      setZoomedPhoto(null);
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, startCamera, stopCamera]);

  // Manage camera on/off during capture mode
  useEffect(() => {
    if (!isOpen) return;
    if (capturedPhotos.length === 0 || isCapturingMore) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen, capturedPhotos.length, isCapturingMore, startCamera, stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Torch constraint error:', e);
      }
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture snapshot from video element with size optimization
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const rawWidth = video.videoWidth || 1280;
    const rawHeight = video.videoHeight || 720;
    const maxDim = 1024;
    let width = rawWidth;
    let height = rawHeight;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);

    setCapturedPhotos((prev) => {
      const next = [...prev, dataUrl];
      setActivePreviewIndex(next.length - 1);
      return next;
    });
    setIsCapturingMore(false);
    setAnalysisError(null);
  };

  // Handle single or multiple file upload (native camera or gallery) with automatic compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    try {
      const compressedList = await Promise.all(
        fileList.map((file) => compressImage(file, 1024, 1024, 0.75))
      );

      setCapturedPhotos((prev) => {
        const next = [...prev, ...compressedList];
        setActivePreviewIndex(next.length - 1);
        return next;
      });
      setIsCapturingMore(false);
      setAnalysisError(null);
    } catch (err) {
      console.error('Error compressing uploaded photos:', err);
    }

    // Reset input so same file can be re-selected if needed
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setCapturedPhotos((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setIsCapturingMore(false);
        setActivePreviewIndex(0);
      } else if (activePreviewIndex >= next.length) {
        setActivePreviewIndex(next.length - 1);
      }
      return next;
    });
  };

  const clearAllPhotos = () => {
    setCapturedPhotos([]);
    setActivePreviewIndex(0);
    setIsCapturingMore(false);
    setAnalysisError(null);
    setUserHint('');
  };

  // Send to AI endpoint with all images
  const analyzeWithAI = async () => {
    if (capturedPhotos.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    // Timeout alert after 6 seconds to reassure user if Cloud Run is cold-starting
    const coldStartTimer = setTimeout(() => {
      setAnalysisError('Conectando con el servidor de IA (despertando tras reposo)... Un momento por favor.');
    }, 6000);

    try {
      const response = await fetch('/api/analyze-medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: capturedPhotos,
          userHint: userHint.trim() || undefined,
        }),
      });

      clearTimeout(coldStartTimer);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${response.status})`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error(
          'La IA no logró identificar datos médicos claros en las fotos. Puedes añadir otra foto con mejor luz o llenar los datos manualmente.'
        );
      }

      // Successful analysis: clone photos and reset state immediately
      const photosToSend = [...capturedPhotos];
      stopCamera();
      setCapturedPhotos([]);
      setActivePreviewIndex(0);
      setIsCapturingMore(false);
      setUserHint('');
      setAnalysisError(null);
      setIsAnalyzing(false);
      onAnalysisSuccess(data.items, photosToSend, selectedBoxId, data.summary);
      onClose();
    } catch (err: any) {
      clearTimeout(coldStartTimer);
      console.error('Analysis error:', err);
      const isNetworkErr = err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('Network');
      setAnalysisError(
        isNetworkErr
          ? 'No se pudo conectar con el servidor de análisis (posiblemente esté en reposo o el dispositivo sin internet). Puedes reintentar o ingresar los datos manualmente con el botón "Llenar a mano".'
          : (err.message || 'Ocurrió un error al analizar las fotos con la IA. Por favor intenta de nuevo.')
      );
    } finally {
      clearTimeout(coldStartTimer);
      setIsAnalyzing(false);
    }
  };

  const handleModalClose = () => {
    stopCamera();
    setCapturedPhotos([]);
    setActivePreviewIndex(0);
    setIsCapturingMore(false);
    setUserHint('');
    setAnalysisError(null);
    setIsAnalyzing(false);
    onClose();
  };

  if (!isOpen) return null;

  const showLiveCamera = capturedPhotos.length === 0 || isCapturingMore;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="bg-gray-900 text-white p-3 sm:p-4 flex items-center justify-between border-b border-gray-800 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center shadow-xs">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span>Capturar Medicina o Insumo</span>
              {capturedPhotos.length > 0 && (
                <span className="text-[11px] font-bold bg-teal-500 text-white px-2 py-0.5 rounded-full">
                  {capturedPhotos.length} foto{capturedPhotos.length > 1 ? 's' : ''}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-300">
              <span className="text-gray-400">Guardar en:</span>
              {boxes.length > 0 ? (
                <select
                  value={selectedBoxId}
                  onChange={(e) => setSelectedBoxId(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-md px-2 py-0.5 text-teal-400 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-400"
                >
                  {boxes.map((box) => (
                    <option key={box.id} value={box.id}>
                      {box.icon} {box.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-amber-400 font-semibold">Sin cajas (se creará una)</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleModalClose}
          className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 bg-black flex flex-col items-center justify-center overflow-hidden">
        {showLiveCamera ? (
          /* Live Camera View */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {/* The video element is ALWAYS mounted to guarantee ref binding */}
            <video
              ref={setVideoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
              onLoadedMetadata={(e) => {
                const target = e.currentTarget;
                target.play().catch(() => {});
              }}
            />

            {/* If currently taking an additional photo (e.g. rear or blister), show notice banner */}
            {isCapturingMore && (
              <div className="absolute top-4 left-4 right-16 z-20 bg-teal-900/90 border border-teal-500/50 backdrop-blur-md px-3.5 py-2 rounded-xl text-white text-xs flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                  <span className="font-semibold">
                    Tomando Foto {capturedPhotos.length + 1}: Enfoca reverso, componentes o blíster
                  </span>
                </div>
                <button
                  onClick={() => setIsCapturingMore(false)}
                  className="text-[11px] underline text-teal-200 hover:text-white"
                >
                  Volver a fotos
                </button>
              </div>
            )}

            {/* Loading indicator */}
            {isLoadingCamera && !cameraError && (
              <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-10 text-white">
                <div className="w-12 h-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin mb-3" />
                <p className="text-xs font-semibold text-teal-200">Activando cámara...</p>
              </div>
            )}

            {/* Camera Error / Permission Fallback View */}
            {cameraError && (
              <div className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center p-6 text-center z-15">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">Aviso de la cámara</h3>
                <p className="text-xs text-gray-300 max-w-xs mx-auto mb-4 leading-relaxed">
                  {cameraError}
                </p>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Abrir Cámara Nativa del Teléfono</span>
                  </button>
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Elegir Foto(s) de la Galería</span>
                  </button>
                  <button
                    onClick={startCamera}
                    className="w-full py-2 text-xs text-teal-400 hover:text-teal-300 underline"
                  >
                    Reintentar visor en vivo
                  </button>
                </div>
              </div>
            )}

            {/* Guide overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="w-72 h-72 sm:w-80 sm:h-80 border-2 border-dashed border-teal-400/80 rounded-3xl relative flex items-center justify-center shadow-lg">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-xl" />

                  <span className="text-[11px] font-semibold text-white bg-black/60 backdrop-blur-xs px-3.5 py-1.5 rounded-full shadow-xs">
                    {capturedPhotos.length === 0
                      ? 'Centra la cara frontal (Nombre / Marca)'
                      : `Foto ${capturedPhotos.length + 1}: Centra reverso, blíster o componentes`}
                  </span>
                </div>
              </div>
            )}

            {/* Camera Controls inside overlay (Flip / Torch) */}
            {cameraActive && (
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                {hasTorch && (
                  <button
                    onClick={toggleTorch}
                    className={`p-3 rounded-full backdrop-blur-md transition-all ${
                      torchOn ? 'bg-amber-400 text-black' : 'bg-black/50 text-white'
                    }`}
                    title="Linterna / Flash"
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={switchCamera}
                  className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all"
                  title="Girar cámara"
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Multi-Photo Review Gallery View */
          <div className="relative w-full h-full flex flex-col items-center justify-between p-3 sm:p-4">
            {/* Main preview of selected image */}
            <div className="relative flex-1 w-full flex items-center justify-center min-h-0">
              <img
                src={capturedPhotos[activePreviewIndex] || capturedPhotos[0]}
                alt={`Foto ${activePreviewIndex + 1}`}
                className="max-h-[50vh] sm:max-h-[55vh] max-w-full rounded-2xl object-contain shadow-2xl border border-gray-800"
              />

              {/* Tag indicator on image */}
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-semibold border border-white/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  {activePreviewIndex === 0
                    ? 'Foto 1 (Cara Frontal / Marca)'
                    : activePreviewIndex === 1
                    ? 'Foto 2 (Reverso / Composición)'
                    : `Foto ${activePreviewIndex + 1} (Detalle)`}
                </span>
              </div>

              {/* Zoom & Delete buttons */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <button
                  onClick={() => setZoomedPhoto(capturedPhotos[activePreviewIndex])}
                  className="p-2 bg-black/70 backdrop-blur-md rounded-full text-white hover:bg-black/90"
                  title="Ampliar foto"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removePhoto(activePreviewIndex)}
                  className="p-2 bg-rose-600/90 backdrop-blur-md rounded-full text-white hover:bg-rose-700"
                  title="Eliminar esta foto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thumbnail carousel strip */}
            <div className="w-full max-w-md mt-2 mb-1">
              <div className="flex items-center justify-between text-xs text-gray-300 mb-1.5 px-1">
                <span className="font-semibold text-teal-400">
                  Fotos listas para el análisis ({capturedPhotos.length}):
                </span>
                <span className="text-[11px] text-gray-400">
                  Toca para seleccionar o agrega más
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                {capturedPhotos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePreviewIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      activePreviewIndex === idx
                        ? 'border-teal-400 ring-2 ring-teal-400/50 scale-105'
                        : 'border-gray-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5 font-bold">
                      #{idx + 1}
                    </div>
                  </button>
                ))}

                {/* Add another photo card */}
                <button
                  type="button"
                  onClick={() => setIsCapturingMore(true)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-teal-500/80 bg-teal-950/40 hover:bg-teal-900/60 text-teal-300 flex flex-col items-center justify-center gap-1 shrink-0 transition-colors"
                  title="Tomar otra foto (Reverso / Blíster)"
                >
                  <Plus className="w-5 h-5 text-teal-400" />
                  <span className="text-[9px] font-bold text-center leading-tight">
                    + Otra foto
                  </span>
                </button>
              </div>
            </div>

            {/* Analysis Loading Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30">
                <div className="relative w-20 h-20 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-teal-500/30 animate-ping" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-teal-400 border-r-teal-500 border-b-emerald-400 border-l-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-teal-400">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Analizando {capturedPhotos.length} foto{capturedPhotos.length > 1 ? 's' : ''} con IA...
                </h3>
                <p className="text-xs text-teal-200 max-w-xs leading-relaxed">
                  Extrayendo nombre del remedio, principio activo (químico), laboratorio fabricante (ej: La Santé),
                  dosis (mg/ml), contenido neto, presentación y caducidad...
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden File Input for Native Phone Camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Hidden File Input for Gallery (allows multiple) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Error Banner */}
      {analysisError && (
        <div className="mx-4 mb-2 p-3 bg-rose-900/90 border border-rose-700 text-rose-100 rounded-xl text-xs flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{analysisError}</span>
          </div>
          <button
            onClick={() => {
              onOpenManualEntry(selectedBoxId);
              onClose();
            }}
            className="text-xs font-bold text-white underline shrink-0 hover:text-teal-300"
          >
            Llenar a mano
          </button>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="bg-gray-900 border-t border-gray-800 p-3 sm:p-4 z-10">
        {showLiveCamera ? (
          /* Live Shutter & Native Camera Controls */
          <div className="max-w-md mx-auto flex items-center justify-around">
            {/* Native camera direct launcher */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-teal-400 flex flex-col items-center gap-1 text-[11px]"
              title="Abrir cámara del teléfono"
            >
              <Camera className="w-5 h-5 text-teal-400" />
              <span>Cámara nativa</span>
            </button>

            {/* Big Shutter Button */}
            <button
              onClick={takeSnapshot}
              className="w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-teal-500/30"
              title="Capturar foto"
            >
              <div className="w-full h-full rounded-full bg-white hover:bg-teal-400 transition-colors" />
            </button>

            {/* Gallery Picker (allows multiple selection) */}
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-teal-400 flex flex-col items-center gap-1 text-[11px]"
              title="Elegir de fotos"
            >
              <ImageIcon className="w-5 h-5" />
              <span>Galería</span>
            </button>
          </div>
        ) : (
          /* Multi-photo Actions: Add more sides OR Run AI Analysis */
          <div className="max-w-md mx-auto space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Pista opcional (ej: Dosis 30 mg o jeringa de 5 ml)"
                value={userHint}
                onChange={(e) => setUserHint(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white text-xs px-3.5 py-2 rounded-xl placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>

            <div className="flex gap-2">
              {/* Button to snap another photo for the same medicine */}
              <button
                type="button"
                onClick={() => setIsCapturingMore(true)}
                disabled={isAnalyzing}
                className="flex-1 py-2.5 px-3 rounded-xl border border-teal-500/70 bg-teal-950/40 text-teal-300 hover:bg-teal-900/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                title="Tomar otra foto de la misma medicina por detrás o del blíster"
              >
                <Plus className="w-4 h-4" />
                <span>+ Otra foto (Reverso/Blíster)</span>
              </button>

              {/* Clear / Restart button */}
              <button
                type="button"
                onClick={clearAllPhotos}
                disabled={isAnalyzing}
                className="p-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 text-xs transition-colors"
                title="Descartar fotos y empezar de nuevo"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Main AI Button */}
            <button
              type="button"
              onClick={analyzeWithAI}
              disabled={isAnalyzing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>
                {isAnalyzing
                  ? 'Analizando con IA...'
                  : `Analizar las ${capturedPhotos.length} foto${capturedPhotos.length > 1 ? 's' : ''} y Crear Ficha`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedPhoto(null)}
        >
          <img
            src={zoomedPhoto}
            alt="Foto ampliada"
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
