import React, { useState } from 'react';
import { MedicineItem, MedicineBox } from '../types';
import { checkExpiryStatus, isItemOutOfStock } from '../services/storage';
import {
  X,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Pill,
  ShieldAlert,
  ZoomIn,
  Building2,
  ShoppingCart,
  Check,
} from 'lucide-react';

interface ItemDetailModalProps {
  isOpen?: boolean;
  item: MedicineItem | null;
  boxes: MedicineBox[];
  onClose: () => void;
  onEdit: (item: MedicineItem) => void;
  onDelete: (itemId: string) => void;
  onMoveBox: (itemId: string, newBoxId: string) => void;
  onToggleOutOfStock?: (itemId: string, isOutOfStock: boolean) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen = true,
  item,
  boxes,
  onClose,
  onEdit,
  onDelete,
  onMoveBox,
  onToggleOutOfStock,
}) => {
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (isOpen === false || !item) return null;

  const currentBox = boxes.find((b) => b.id === item.boxId);
  const expiry = checkExpiryStatus(item.expirationDate);
  const isOutOfStock = isItemOutOfStock(item);

  // Collect all photos
  const allPhotos: string[] = [];
  if (item.photoUrls && item.photoUrls.length > 0) {
    allPhotos.push(...item.photoUrls);
  } else if (item.photoUrl) {
    allPhotos.push(item.photoUrl);
  }

  const handleToggleStock = () => {
    const nextStatus = !isOutOfStock;
    onToggleOutOfStock?.(item.id, nextStatus);
    setFeedbackMessage(
      nextStatus
        ? '⚠️ ¡Marcado como AGOTADO! Se agregó a la pestaña Alertas y lista de compras.'
        : '✅ ¡Marcado como REPUESTO en caja! Se retiró de la lista de compras.'
    );
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-teal-50/30">
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentBox?.icon || '📦'}</span>
            <div>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                {currentBox?.name || 'Caja sin nombre'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(item)}
              className="p-2 text-gray-500 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Out of Stock Banner / Alert */}
          {isOutOfStock && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block">
                  Alerta de Reposición
                </span>
                <h4 className="text-xs font-bold text-rose-950">
                  Medicamento Agotado · Pendiente por comprar
                </h4>
                <p className="text-[11px] text-rose-800 mt-0.5 leading-snug">
                  Este artículo está en tu lista de compras de la farmacia para reponer la caja.
                </p>
              </div>
            </div>
          )}

          {/* Photos Carousel / Display */}
          {allPhotos.length > 0 ? (
            <div className="space-y-2">
              <div
                className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-gray-900 border border-gray-200 cursor-pointer group shadow-2xs"
                onClick={() => setZoomedPhoto(allPhotos[activePhotoIndex] || allPhotos[0])}
              >
                <img
                  src={allPhotos[activePhotoIndex] || allPhotos[0]}
                  alt={item.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold">
                  {allPhotos.length > 1
                    ? `Foto ${activePhotoIndex + 1} de ${allPhotos.length} (${activePhotoIndex === 0 ? 'Frente' : activePhotoIndex === 1 ? 'Reverso' : 'Detalle'})`
                    : 'Foto vinculada'}
                </div>
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <ZoomIn className="w-6 h-6" />
                </div>
              </div>

              {/* Thumbnails if more than 1 photo */}
              {allPhotos.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {allPhotos.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        activePhotoIndex === idx
                          ? 'border-teal-500 ring-2 ring-teal-400/40'
                          : 'border-gray-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={p} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center font-bold">
                        #{idx + 1}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Titles & Classifications */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                {item.category.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                {item.presentation}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug break-words">
              {item.name}
            </h2>

            {item.tradeName && item.tradeName !== item.name && (
              <p className="text-xs font-bold text-teal-700 mt-1">
                Marca comercial: {item.tradeName}
              </p>
            )}

            {item.activeIngredient && (
              <p className="text-xs text-gray-700 mt-1 break-words">
                <span className="font-semibold text-gray-400">Principio activo: </span>
                <span className="font-bold text-gray-900">{item.activeIngredient}</span>
              </p>
            )}

            {/* Laboratory Badge */}
            {item.laboratory && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                <Building2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Laboratorio: <strong className="text-slate-900">{item.laboratory}</strong></span>
              </div>
            )}

            {item.dosage && (
              <div className="mt-1.5 ml-1.5 inline-block text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                Dosis: {item.dosage}
              </div>
            )}
          </div>

          {/* Action Card: "Se agotó / Volver a Comprar" */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isOutOfStock
                ? 'bg-rose-50/70 border-rose-300'
                : 'bg-emerald-50/50 border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Control de Existencia
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isOutOfStock
                    ? 'bg-rose-200 text-rose-800'
                    : 'bg-emerald-200 text-emerald-800'
                }`}
              >
                {isOutOfStock ? 'Agotado' : 'Disponible en caja'}
              </span>
            </div>

            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              {isOutOfStock
                ? 'Marcaste este medicamento como gastado. Ya está en tu lista de alertas para la farmacia.'
                : 'Si te tomaste este medicamento o se terminó el contenido del frasco/blíster, pulsa el botón para agregarlo a la lista de compras.'}
            </p>

            {feedbackMessage && (
              <div className="mb-3 p-2.5 bg-white/90 border border-teal-300 rounded-xl text-xs font-bold text-teal-900 flex items-center gap-2 shadow-xs animate-in fade-in">
                <span>{feedbackMessage}</span>
              </div>
            )}

            {isOutOfStock ? (
              <button
                type="button"
                onClick={handleToggleStock}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya lo compré (Marcar como Repuesto en caja)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleStock}
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Se agotó (Volver a comprar)</span>
              </button>
            )}
          </div>

          {/* Expiry Badge */}
          {item.expirationDate ? (
            <div
              className={`p-3 rounded-2xl border flex items-center gap-3 ${
                expiry.status === 'expired'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : expiry.status === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {expiry.status === 'expired' ? (
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              ) : expiry.status === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{expiry.label}</span>
                  <span className="text-[11px] font-mono font-bold">{item.expirationDate}</span>
                </div>
                {item.batch && (
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    Lote / Serie: {item.batch}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Sin fecha de vencimiento registrada (no perecedero o no visible)</span>
            </div>
          )}

          {/* Indications / Para qué sirve */}
          {item.indications && (
            <div className="p-3.5 bg-teal-50/50 rounded-2xl border border-teal-100">
              <h4 className="text-[11px] font-bold text-teal-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Indicaciones y Uso en Primeros Auxilios</span>
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed">{item.indications}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {item.administrationRoute && (
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Vía de administración
                </span>
                <span className="font-bold text-gray-800">{item.administrationRoute}</span>
              </div>
            )}
            {item.storageRecommendation && (
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Conservación
                </span>
                <span className="font-medium text-gray-800">{item.storageRecommendation}</span>
              </div>
            )}
          </div>

          {/* User Notes */}
          {item.notes && (
            <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/60 text-amber-900">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-700">
                Nota personal
              </span>
              <p className="text-xs mt-0.5">{item.notes}</p>
            </div>
          )}

          {/* Move to another Box Section */}
          <div className="pt-2 border-t border-gray-100">
            {showMoveDropdown ? (
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <span className="text-xs font-bold text-gray-700 block">
                  Selecciona la caja de destino:
                </span>
                <div className="space-y-1.5">
                  {boxes
                    .filter((b) => b.id !== item.boxId)
                    .map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          onMoveBox(item.id, b.id);
                          setShowMoveDropdown(false);
                        }}
                        className="w-full text-left p-2.5 bg-white border border-gray-200 hover:border-teal-500 rounded-xl flex items-center justify-between text-xs font-semibold text-gray-800 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{b.icon}</span>
                          <span>{b.name}</span>
                        </span>
                        <span className="text-teal-600 font-bold">Mover aquí →</span>
                      </button>
                    ))}
                </div>
                <button
                  onClick={() => setShowMoveDropdown(false)}
                  className="w-full py-1 text-center text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowMoveDropdown(true)}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-teal-300 text-teal-700 hover:bg-teal-50 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Mover este artículo a otra caja (ej: Casa ↔ Viaje)</span>
              </button>
            )}
          </div>
        </div>

        {/* Photo Full Zoom */}
        {zoomedPhoto && (
          <div
            className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setZoomedPhoto(null)}
          >
            <img
              src={zoomedPhoto}
              alt={item.name}
              className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                ¿Eliminar este medicamento?
              </h3>
              <p className="text-xs text-gray-600 mb-5 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente{' '}
                <strong className="text-gray-900 font-bold">"{item.name}"</strong> de la caja{' '}
                <strong className="text-teal-700 font-bold">{currentBox?.name || 'seleccionada'}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete(item.id);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
