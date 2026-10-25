import React from 'react';
import { MedicineBox, MedicineItem } from '../types';
import { checkExpiryStatus, isItemOutOfStock } from '../services/storage';
import {
  Package,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShoppingCart,
} from 'lucide-react';

interface SummaryCardsProps {
  boxes: MedicineBox[];
  items: MedicineItem[];
  onSelectBox: (boxId: string) => void;
  onNavigateToAlerts: (filter?: 'all' | 'stock' | 'expiry') => void;
  onShowAllItems: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  boxes,
  items,
  onSelectBox,
  onNavigateToAlerts,
  onShowAllItems,
}) => {
  // 1. Total items count & breakdown
  const totalItems = items.length;
  const medicineCount = items.filter((i) => i.category === 'medicamento').length;
  const suppliesCount = totalItems - medicineCount;

  // 2. Out of stock / items to buy
  const outOfStockItems = items.filter((i) => isItemOutOfStock(i));

  // 3. Box with most elements
  const boxItemCounts = boxes.map((box) => ({
    box,
    count: items.filter((item) => item.boxId === box.id).length,
  }));
  boxItemCounts.sort((a, b) => b.count - a.count);
  const topBox = boxItemCounts[0];

  // 4. Items expiring in 30 days or less & already expired
  const expiringSoon30Days = items.filter((item) => {
    const exp = checkExpiryStatus(item.expirationDate);
    return exp.daysRemaining !== undefined && exp.daysRemaining >= 0 && exp.daysRemaining <= 30;
  });

  const alreadyExpired = items.filter((item) => {
    const exp = checkExpiryStatus(item.expirationDate);
    return exp.daysRemaining !== undefined && exp.daysRemaining < 0;
  });

  return (
    <section className="mb-3.5" aria-label="Resumen de estadísticas">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-teal-600" />
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Resumen Rápido
          </h2>
        </div>
        <span className="text-[11px] text-gray-500 font-medium">
          {boxes.length} {boxes.length === 1 ? 'caja' : 'cajas'} activas
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Card 1: Total de Artículos */}
        <div
          onClick={onShowAllItems}
          className="bg-white rounded-2xl border border-teal-100 hover:border-teal-300 p-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.99] flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Artículos
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {totalItems}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">en cajas</span>
            </div>
            <p className="text-[10px] text-teal-700 font-medium truncate mt-0.5">
              {medicineCount} med · {suppliesCount} ins
            </p>
          </div>
        </div>

        {/* Card 2: Agotados / Volver a Comprar */}
        <div
          onClick={() => onNavigateToAlerts('stock')}
          className={`rounded-2xl border p-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.99] flex flex-col justify-between group ${
            outOfStockItems.length > 0
              ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400'
              : 'bg-white border-gray-200 hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider block ${
                outOfStockItems.length > 0 ? 'text-rose-700 font-extrabold' : 'text-gray-400'
              }`}
            >
              Por Comprar
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                outOfStockItems.length > 0
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-500 group-hover:bg-rose-50 group-hover:text-rose-600'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span
                className={`text-xl sm:text-2xl font-black tracking-tight ${
                  outOfStockItems.length > 0 ? 'text-rose-700' : 'text-gray-900'
                }`}
              >
                {outOfStockItems.length}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">agotados</span>
            </div>
            <p
              className={`text-[10px] font-semibold truncate mt-0.5 ${
                outOfStockItems.length > 0 ? 'text-rose-700' : 'text-gray-400'
              }`}
            >
              {outOfStockItems.length > 0 ? '⚠️ Toca para ver lista' : 'Ninguno agotado'}
            </p>
          </div>
        </div>

        {/* Card 3: Caja con más elementos */}
        <div
          onClick={() => {
            if (topBox?.box) {
              onSelectBox(topBox.box.id);
            }
          }}
          className="bg-white rounded-2xl border border-indigo-100 hover:border-indigo-300 p-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.99] flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Caja Mayor
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1">
            {topBox && topBox.count > 0 ? (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-base">{topBox.box.icon || '📦'}</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {topBox.box.name}
                  </span>
                </div>
                <p className="text-[10px] text-indigo-700 font-semibold truncate mt-0.5">
                  {topBox.count} artículos
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Sin cajas</p>
            )}
          </div>
        </div>

        {/* Card 4: Vencimientos */}
        <div
          onClick={() => onNavigateToAlerts('expiry')}
          className={`rounded-2xl border p-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.99] flex flex-col justify-between group ${
            alreadyExpired.length > 0
              ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
              : expiringSoon30Days.length > 0
              ? 'bg-amber-50/70 border-amber-200 hover:border-amber-300'
              : 'bg-white border-emerald-100 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Caducidades
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                alreadyExpired.length > 0
                  ? 'bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white'
                  : expiringSoon30Days.length > 0
                  ? 'bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white'
                  : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
              }`}
            >
              {alreadyExpired.length > 0 || expiringSoon30Days.length > 0 ? (
                <Clock className="w-4 h-4 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-1">
            <div className="flex items-baseline gap-1">
              <span
                className={`text-xl sm:text-2xl font-black tracking-tight ${
                  alreadyExpired.length > 0
                    ? 'text-rose-700'
                    : expiringSoon30Days.length > 0
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }`}
              >
                {alreadyExpired.length > 0 ? alreadyExpired.length : expiringSoon30Days.length}
              </span>
              <span className="text-[11px] text-gray-600 font-medium">
                {alreadyExpired.length > 0 ? 'vencidos' : '≤ 30 días'}
              </span>
            </div>
            <p className="text-[10px] font-semibold mt-0.5 truncate">
              {alreadyExpired.length > 0 ? (
                <span className="text-rose-600 font-bold">⚠️ Requiere descarte</span>
              ) : expiringSoon30Days.length > 0 ? (
                <span className="text-amber-700">Por vencer pronto</span>
              ) : (
                <span className="text-emerald-600">Al día</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
