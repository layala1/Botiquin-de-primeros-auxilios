import React from 'react';
import { MedicineBox } from '../types';
import { Plus, HeartPulse, Sparkles, Smartphone } from 'lucide-react';

interface HeaderProps {
  boxes: MedicineBox[];
  activeBoxId: string | 'all';
  onSelectBox: (boxId: string | 'all') => void;
  onOpenManageBoxes: () => void;
  onOpenNewItem: () => void;
  onOpenInstallModal: () => void;
  expiredCount?: number;
  expiringCount?: number;
  outOfStockCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  boxes,
  activeBoxId,
  onSelectBox,
  onOpenManageBoxes,
  onOpenNewItem,
  onOpenInstallModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs w-full max-w-full overflow-hidden">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5">
        {/* Top brand & actions row - Guaranteed to fit 100% on any mobile screen */}
        <div className="flex items-center justify-between gap-2 w-full">
          {/* Brand Info */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight leading-tight truncate">
                  Botiquín Visual
                </h1>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-teal-100 text-teal-800 tracking-wider shrink-0">
                  IA
                </span>
              </div>
              <p className="text-[10px] text-gray-400 truncate leading-none mt-0.5 hidden xs:block">
                Inventario inteligente de medicinas
              </p>
            </div>
          </div>

          {/* Action Buttons: Instalar & + Foto IA */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenInstallModal}
              className="px-2.5 py-1.5 border border-teal-200 bg-teal-50/80 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-2xs active:scale-95"
              title="Instalar en teléfono o PC"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <span className="text-[11px]">Instalar</span>
            </button>

            <button
              onClick={onOpenNewItem}
              className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1 shrink-0"
              title="Tomar foto a medicina con IA"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span className="text-[11px]">+ Foto IA</span>
            </button>
          </div>
        </div>

        {/* Box Selector Horizontal Bar */}
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs w-full">
          <span className="text-gray-400 font-bold whitespace-nowrap text-[10px] uppercase tracking-wider pl-0.5 shrink-0">
            Caja:
          </span>

          <button
            onClick={() => onSelectBox('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all text-xs flex items-center gap-1 shrink-0 ${
              activeBoxId === 'all'
                ? 'bg-teal-700 text-white shadow-xs font-bold'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🗂️</span>
            <span>Todas</span>
          </button>

          {boxes.map((box) => (
            <button
              key={box.id}
              onClick={() => onSelectBox(box.id)}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all text-xs flex items-center gap-1 shrink-0 ${
                activeBoxId === box.id
                  ? 'bg-teal-700 text-white shadow-xs font-bold ring-2 ring-teal-500/30'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{box.icon || '📦'}</span>
              <span className="truncate max-w-[120px]">{box.name}</span>
            </button>
          ))}

          <button
            onClick={onOpenManageBoxes}
            className="px-2 py-1 rounded-lg text-teal-700 border border-dashed border-teal-300 hover:bg-teal-50 font-semibold whitespace-nowrap transition-colors flex items-center gap-1 text-xs shrink-0"
            title="Crear o gestionar cajas"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Caja</span>
          </button>
        </div>
      </div>
    </header>
  );
};
