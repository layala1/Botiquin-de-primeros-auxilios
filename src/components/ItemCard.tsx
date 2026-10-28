import React from 'react';
import { MedicineItem, MedicineBox } from '../types';
import { checkExpiryStatus, isItemOutOfStock, isValidPhotoDataUrl } from '../services/storage';
import {
  Pill,
  Bandage,
  Scissors,
  Droplet,
  Package,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ShoppingCart,
} from 'lucide-react';

interface ItemCardProps {
  item: MedicineItem;
  box?: MedicineBox;
  onClick: () => void;
  onToggleOutOfStock?: (itemId: string, isOutOfStock: boolean) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  box,
  onClick,
  onToggleOutOfStock,
}) => {
  const expiry = checkExpiryStatus(item.expirationDate);
  const isOutOfStock = isItemOutOfStock(item);

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'medicamento':
        return <Pill className="w-4 h-4 text-blue-600" />;
      case 'material_curacion':
        return <Bandage className="w-4 h-4 text-emerald-600" />;
      case 'utensilio_instrumental':
        return <Scissors className="w-4 h-4 text-purple-600" />;
      case 'antiseptico_higiene':
        return <Droplet className="w-4 h-4 text-teal-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-3.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.99] flex flex-col justify-between gap-2.5 relative overflow-hidden ${
        isOutOfStock
          ? 'bg-rose-50/40 border-rose-300 hover:border-rose-400'
          : 'bg-white border-gray-200 hover:border-teal-300'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        {(() => {
          const displayPhoto = isValidPhotoDataUrl(item.photoUrl)
            ? item.photoUrl
            : item.photoUrls && item.photoUrls.length > 0 && isValidPhotoDataUrl(item.photoUrls[0])
            ? item.photoUrls[0]
            : null;

          if (displayPhoto) {
            return (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-2xs">
                <img src={displayPhoto} alt={item.name} className="w-full h-full object-cover" />
                {item.photoUrls && item.photoUrls.length > 1 && (
                  <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-white text-[9px] font-bold px-1 rounded-sm">
                    📷 {item.photoUrls.length}
                  </span>
                )}
              </div>
            );
          }

          return (
            <div className="w-16 h-16 rounded-xl bg-teal-50/70 border border-teal-100 flex items-center justify-center shrink-0">
              {getCategoryIcon()}
            </div>
          );
        })()}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {box && (
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded-md truncate max-w-[130px]">
                {box.icon} {box.name}
              </span>
            )}
            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded-md truncate">
              {item.presentation}
            </span>
          </div>

          <h3 className="font-bold text-sm text-gray-900 mt-0.5 truncate leading-tight">
            {item.name}
          </h3>

          {item.activeIngredient && (
            <p className="text-[11px] text-gray-600 truncate leading-tight mt-0.5 font-medium">
              {item.activeIngredient}
            </p>
          )}

          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            {item.dosage && (
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                {item.dosage}
              </span>
            )}
            {item.laboratory && (
              <span className="text-[10px] font-medium text-slate-600 truncate max-w-[130px]">
                Lab: {item.laboratory}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Status Row: Out of stock indicator + Expiry */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs gap-2">
        {/* Out of Stock vs Available Status Pill */}
        {isOutOfStock ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleOutOfStock?.(item.id, false);
            }}
            className="flex items-center gap-1.5 text-[11px] font-extrabold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-1 rounded-lg hover:bg-rose-200 active:scale-95 transition-all shadow-2xs"
            title="Toca para marcar como repuesto en caja"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Agotado · Comprar</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleOutOfStock?.(item.id, true);
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 border border-gray-200 hover:border-rose-300 px-2 py-1 rounded-lg transition-all active:scale-95 shadow-2xs"
            title="Toca si se agotó para volver a comprar"
          >
            <span className="text-emerald-600 font-extrabold text-xs">✓</span>
            <span>En caja</span>
            <span className="text-[10px] text-rose-700 font-extrabold bg-rose-50 border border-rose-200 px-1 py-0.2 rounded ml-0.5">
              ¿Agotó?
            </span>
          </button>
        )}

        {/* Expiration date */}
        {item.expirationDate ? (
          <div
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              expiry.status === 'expired'
                ? 'bg-rose-100 text-rose-700'
                : expiry.status === 'warning'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {expiry.status === 'expired' && <ShieldAlert className="w-3 h-3" />}
            {expiry.status === 'warning' && <AlertCircle className="w-3 h-3" />}
            {expiry.status === 'ok' && <CheckCircle2 className="w-3 h-3" />}
            <span className="truncate max-w-[110px]">{expiry.label}</span>
          </div>
        ) : (
          <span className="text-[10px] text-gray-400">Sin caducidad</span>
        )}
      </div>
    </div>
  );
};
