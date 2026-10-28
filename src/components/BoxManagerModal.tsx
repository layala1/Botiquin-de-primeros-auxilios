import React, { useState, useEffect } from 'react';
import { MedicineBox, MedicineItem } from '../types';
import { X, Plus, Trash2, Edit2, Package, Check, AlertTriangle } from 'lucide-react';

interface BoxManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  boxes: MedicineBox[];
  items: MedicineItem[];
  onSaveBox: (box: MedicineBox) => void;
  onDeleteBox: (boxId: string) => void;
  onSelectBox: (boxId: string) => void;
  initialEditBox?: MedicineBox | null;
}

const EMOJI_OPTIONS = ['📦', '✈️', '🏠', '🚗', '🎒', '👶', '🧰', '💊', '🩹', '🩺', '⛺', '🏊'];

export const BoxManagerModal: React.FC<BoxManagerModalProps> = ({
  isOpen,
  onClose,
  boxes,
  items,
  onSaveBox,
  onDeleteBox,
  onSelectBox,
  initialEditBox,
}) => {
  const [editingBox, setEditingBox] = useState<MedicineBox | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('teal');
  const [boxPendingDelete, setBoxPendingDelete] = useState<MedicineBox | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialEditBox) {
        setEditingBox(initialEditBox);
        setName(initialEditBox.name);
        setDescription(initialEditBox.description || '');
        setIcon(initialEditBox.icon || '📦');
        setColor(initialEditBox.color || 'teal');
        setIsCreating(true);
      } else if (boxes.length === 0) {
        setIsCreating(true);
        setName('');
        setDescription('');
        setIcon('✈️');
      } else {
        setIsCreating(false);
        setEditingBox(null);
      }
    }
  }, [isOpen, initialEditBox, boxes.length]);

  if (!isOpen) return null;

  const startCreate = () => {
    setEditingBox(null);
    setName('');
    setDescription('');
    setIcon('✈️');
    setColor('teal');
    setIsCreating(true);
  };

  const startEdit = (box: MedicineBox) => {
    setEditingBox(box);
    setName(box.name);
    setDescription(box.description || '');
    setIcon(box.icon || '📦');
    setColor(box.color || 'teal');
    setIsCreating(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newBox: MedicineBox = {
      id: editingBox ? editingBox.id : `box-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
      createdAt: editingBox ? editingBox.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveBox(newBox);
    setIsCreating(false);
    setEditingBox(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-teal-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isCreating
                  ? editingBox
                    ? 'Editar Caja / Botiquín'
                    : 'Nueva Caja de Medicinas'
                  : 'Tus Cajas y Botiquines'}
              </h2>
              <p className="text-xs text-gray-500">
                {isCreating
                  ? 'Define el nombre, ubicación e icono para clasificar'
                  : 'Organiza por lugar: Casa, Viaje, Auto, etc.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isCreating) {
                setIsCreating(false);
                setEditingBox(null);
              } else {
                onClose();
              }
            }}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isCreating ? (
            /* Create / Edit Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nombre de la Caja o Botiquín *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Botiquín de Viaje, Caja Casa Baño, Auto..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Ubicación o Propósito
                </label>
                <input
                  type="text"
                  placeholder="Ej: Maleta de mano, Guantera del coche, Armario..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Icono representativo
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                        icon === emoji
                          ? 'bg-teal-100 ring-2 ring-teal-600 scale-105'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingBox(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium text-xs hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBox ? 'Actualizar Caja' : 'Crear Caja'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Box List */
            <div className="space-y-3">
              <button
                onClick={startCreate}
                className="w-full py-3 px-4 border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-2xl bg-teal-50/50 hover:bg-teal-50 text-teal-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Crear Nueva Caja o Botiquín</span>
              </button>

              <div className="space-y-2.5">
                {boxes.map((box) => {
                  const boxItems = items.filter((i) => i.boxId === box.id);

                  return (
                    <div
                      key={box.id}
                      className="p-3.5 border border-gray-200 rounded-2xl hover:border-teal-200 transition-all bg-white shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => {
                            onSelectBox(box.id);
                            onClose();
                          }}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-2xl shadow-2xs">
                            {box.icon || '📦'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 text-sm">{box.name}</h3>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                                {boxItems.length} {boxItems.length === 1 ? 'artículo' : 'artículos'}
                              </span>
                            </div>
                            {box.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                {box.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(box)}
                            className="p-2 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
                            title="Editar caja"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setBoxPendingDelete(box)}
                            className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Eliminar caja"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Explicit Box Deletion Confirmation Modal */}
      {boxPendingDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 border border-rose-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900">¿Eliminar esta caja?</h3>
              <p className="text-xs text-gray-600 mt-1">
                ¿Seguro que deseas eliminar{' '}
                <strong className="text-gray-900">
                  {boxPendingDelete.icon} {boxPendingDelete.name}
                </strong>
                ?
              </p>
            </div>

            {(() => {
              const count = items.filter((i) => i.boxId === boxPendingDelete.id).length;
              return (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {count > 0
                        ? `Contiene ${count} medicamento${count === 1 ? '' : 's'} o insumos`
                        : 'Esta caja está actualmente vacía'}
                    </span>
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    {count > 0
                      ? 'Tus medicamentos NO se borrarán. Se trasladarán automáticamente a tu otra caja para que nunca pierdas datos ni fotos.'
                      : 'Se eliminará la caja sin afectar a las demás.'}
                  </p>
                </div>
              );
            })()}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBoxPendingDelete(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBox(boxPendingDelete.id);
                  setBoxPendingDelete(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
