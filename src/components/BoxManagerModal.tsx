import React, { useState } from 'react';
import { MedicineBox, MedicineItem } from '../types';
import { X, Plus, Trash2, Edit2, Package, Check, AlertTriangle, ArrowRight } from 'lucide-react';

interface BoxManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  boxes: MedicineBox[];
  items: MedicineItem[];
  onSaveBox: (box: MedicineBox) => void;
  onDeleteBox: (boxId: string) => void;
  onSelectBox: (boxId: string) => void;
}

const EMOJI_OPTIONS = ['📦', '✈️', '🏠', '🚗', '🎒', '👶', '🧰', '💊', '🩹', '🩺', '⛺', '🏊'];
const COLOR_OPTIONS = [
  { name: 'Teal', class: 'bg-teal-500' },
  { name: 'Azul', class: 'bg-blue-500' },
  { name: 'Esmeralda', class: 'bg-emerald-500' },
  { name: 'Ámbar', class: 'bg-amber-500' },
  { name: 'Rojo', class: 'bg-rose-500' },
  { name: 'Índigo', class: 'bg-indigo-500' },
  { name: 'Púrpura', class: 'bg-purple-500' },
];

export const BoxManagerModal: React.FC<BoxManagerModalProps> = ({
  isOpen,
  onClose,
  boxes,
  items,
  onSaveBox,
  onDeleteBox,
  onSelectBox,
}) => {
  const [editingBox, setEditingBox] = useState<MedicineBox | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('teal');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && boxes.length === 0) {
      setIsCreating(true);
      setName('');
      setDescription('');
      setIcon('✈️');
    }
  }, [isOpen, boxes.length]);

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
    setDescription(box.description);
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

  const handleDelete = (boxId: string) => {
    if (deleteConfirmId !== boxId) {
      setDeleteConfirmId(boxId);
      return;
    }
    onDeleteBox(boxId);
    setDeleteConfirmId(null);
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
                  onClick={() => setIsCreating(false)}
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
                  const isConfirming = deleteConfirmId === box.id;

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
                            title="Editar nombre"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(box.id)}
                            className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Eliminar caja"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Confirmation alert if items exist */}
                      {isConfirming && (
                        <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-2 animate-in fade-in">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              Esta caja contiene {boxItems.length} artículos. ¿Seguro que deseas
                              eliminarla?
                            </span>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                            >
                              No
                            </button>
                            <button
                              onClick={() => handleDelete(box.id)}
                              className="px-2 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700"
                            >
                              Sí, borrar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
