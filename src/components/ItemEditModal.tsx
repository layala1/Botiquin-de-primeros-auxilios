import React, { useState, useEffect } from 'react';
import { MedicineBox, MedicineItem, ItemCategory } from '../types';
import { isItemOutOfStock } from '../services/storage';
import {
  X,
  Check,
  Sparkles,
  AlertTriangle,
  Pill,
  Bandage,
  Scissors,
  Droplet,
  Package,
  Calendar,
  Layers,
  ZoomIn,
  Building2,
  Trash2,
  ShoppingCart,
} from 'lucide-react';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  boxes: MedicineBox[];
  initialItem?: Partial<MedicineItem> | null;
  photoUrl?: string;
  photos?: string[];
  defaultBoxId?: string;
  confidenceNote?: string;
  onSave: (item: MedicineItem) => void;
}

const CATEGORIES: { id: ItemCategory; label: string; icon: any; color: string }[] = [
  { id: 'medicamento', label: 'Medicamento', icon: Pill, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'material_curacion', label: 'Material de Curación', icon: Bandage, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'utensilio_instrumental', label: 'Utensilio / Instrumental', icon: Scissors, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'antiseptico_higiene', label: 'Antiséptico / Higiene', icon: Droplet, color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'otro', label: 'Otro Insumo', icon: Package, color: 'bg-gray-50 text-gray-700 border-gray-200' },
];

const COMMON_PRESENTATIONS = [
  'Tabletas sublinguales',
  'Pastillas / Comprimidos',
  'Cápsulas',
  'Jarabe / Suspensión',
  'Crema / Pomada',
  'Gotas',
  'Inyectable / Ampolla',
  'Inyectadora / Jeringa',
  'Gasas / Apósitos',
  'Algodón',
  'Venda / Vendaje',
  'Tijeras médicas',
  'Bisturí',
  'Termómetro',
  'Curitas / Parches',
  'Solución antiséptica',
  'Otro',
];

export const ItemEditModal: React.FC<ItemEditModalProps> = ({
  isOpen,
  onClose,
  boxes,
  initialItem,
  photoUrl,
  photos,
  defaultBoxId,
  confidenceNote,
  onSave,
}) => {
  const [boxId, setBoxId] = useState<string>(
    initialItem?.boxId || defaultBoxId || (boxes[0]?.id ?? '')
  );
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [laboratory, setLaboratory] = useState('');
  const [category, setCategory] = useState<ItemCategory>('medicamento');
  const [presentation, setPresentation] = useState('Tabletas sublinguales');
  const [dosage, setDosage] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isOutOfStock, setIsOutOfStock] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [batch, setBatch] = useState('');
  const [indications, setIndications] = useState('');
  const [administrationRoute, setAdministrationRoute] = useState('Oral');
  const [storageRecommendation, setStorageRecommendation] = useState('');
  const [notes, setNotes] = useState('');

  // Multi-photo state
  const [itemPhotos, setItemPhotos] = useState<string[]>([]);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  useEffect(() => {
    // Resolve initial photos
    const resolvedPhotos: string[] = [];
    if (initialItem?.photoUrls && initialItem.photoUrls.length > 0) {
      resolvedPhotos.push(...initialItem.photoUrls);
    } else if (initialItem?.photoUrl) {
      resolvedPhotos.push(initialItem.photoUrl);
    } else if (photos && photos.length > 0) {
      resolvedPhotos.push(...photos);
    } else if (photoUrl) {
      resolvedPhotos.push(photoUrl);
    }

    if (initialItem) {
      setBoxId(initialItem.boxId || defaultBoxId || (boxes[0]?.id ?? ''));
      setName(initialItem.name || '');
      setTradeName(initialItem.tradeName || '');
      setActiveIngredient(initialItem.activeIngredient || '');
      setLaboratory(initialItem.laboratory || '');
      setCategory(initialItem.category || 'medicamento');
      setPresentation(initialItem.presentation || 'Pastillas / Comprimidos');
      setDosage(initialItem.dosage || '');
      setQuantity(initialItem.quantity || 'Disponible');
      setIsOutOfStock(isItemOutOfStock(initialItem as MedicineItem));
      setExpirationDate(initialItem.expirationDate || '');
      setBatch(initialItem.batch || '');
      setIndications(initialItem.indications || '');
      setAdministrationRoute(initialItem.administrationRoute || 'Oral');
      setStorageRecommendation(initialItem.storageRecommendation || '');
      setNotes(initialItem.notes || '');
      setItemPhotos(resolvedPhotos);
    } else {
      setBoxId(defaultBoxId || (boxes[0]?.id ?? ''));
      setName('');
      setTradeName('');
      setActiveIngredient('');
      setLaboratory('');
      setCategory('medicamento');
      setPresentation('Tabletas sublinguales');
      setDosage('');
      setQuantity('Disponible');
      setIsOutOfStock(false);
      setExpirationDate('');
      setBatch('');
      setIndications('');
      setAdministrationRoute('Oral');
      setStorageRecommendation('');
      setNotes('');
      setItemPhotos(resolvedPhotos);
    }
  }, [initialItem, photoUrl, photos, defaultBoxId, boxes, isOpen]);

  if (!isOpen) return null;

  const handleRemovePhoto = (index: number) => {
    setItemPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalIsOutOfStock = isOutOfStock || isItemOutOfStock({ quantity, isOutOfStock } as any);

    const item: MedicineItem = {
      id: initialItem?.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      boxId: boxId || boxes[0]?.id || 'box-default',
      name: name.trim(),
      tradeName: tradeName.trim() || undefined,
      activeIngredient: activeIngredient.trim() || undefined,
      laboratory: laboratory.trim() || undefined,
      category,
      presentation: presentation.trim(),
      dosage: dosage.trim() || undefined,
      quantity: quantity.trim() || 'Disponible',
      isOutOfStock: finalIsOutOfStock,
      outOfStockDate: finalIsOutOfStock ? (initialItem?.outOfStockDate || new Date().toISOString()) : undefined,
      expirationDate: expirationDate.trim() || undefined,
      batch: batch.trim() || undefined,
      indications: indications.trim() || undefined,
      administrationRoute: administrationRoute.trim() || undefined,
      storageRecommendation: storageRecommendation.trim() || undefined,
      notes: notes.trim() || undefined,
      photoUrl: itemPhotos[0] || undefined,
      photoUrls: itemPhotos.length > 0 ? itemPhotos : undefined,
      createdAt: initialItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-teal-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              {itemPhotos.length > 0 ? (
                <Sparkles className="w-5 h-5 text-amber-200" />
              ) : (
                <Package className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {initialItem?.id ? 'Editar Artículo' : 'Revisar y Guardar en Caja'}
              </h2>
              <p className="text-xs text-gray-500">
                {itemPhotos.length > 0
                  ? `Verifica o corrige los datos extraídos de ${itemPhotos.length} foto${itemPhotos.length > 1 ? 's' : ''}`
                  : 'Completa los datos del medicamento o artículo de curación'}
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
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Target Box Selection */}
          <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-200">
            <label className="block text-xs font-bold text-teal-900 uppercase tracking-wider mb-1.5">
              📦 Caja / Botiquín donde se guardará *
            </label>
            <select
              required
              value={boxId}
              onChange={(e) => setBoxId(e.target.value)}
              className="w-full bg-white border border-teal-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-teal-950 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
            >
              {boxes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.icon} {b.name} ({b.description || 'Sin notas'})
                </option>
              ))}
            </select>
          </div>

          {/* AI Caveat / Confidence Note if any */}
          {confidenceNote && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold">Resumen de la IA: </span>
                <span>{confidenceNote}</span>
              </div>
            </div>
          )}

          {/* Photos Carousel / Thumbnails if exists */}
          {itemPhotos.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span>Fotos Vinculadas ({itemPhotos.length})</span>
                </span>
                <span className="text-[10px] text-gray-500">
                  Toca una foto para ampliarla
                </span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {itemPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-900 shrink-0 border border-gray-300 group shadow-2xs"
                  >
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform cursor-pointer"
                      onClick={() => setZoomedPhoto(photo)}
                    />
                    <div className="absolute top-1 left-1 bg-black/70 text-[9px] text-white px-1.5 py-0.2 rounded-md font-bold">
                      {index === 0 ? 'Frente' : index === 1 ? 'Reverso' : `#${index + 1}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                      title="Quitar foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div
                      className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer pointer-events-none"
                    >
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classification / Category selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Tipo / Clasificación *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      if (cat.id === 'utensilio_instrumental') {
                        setAdministrationRoute('Uso externo / No aplica');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600 text-white font-bold shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-teal-600'}`} />
                    <span className="text-xs truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & Commercial Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Nombre del Remedio / Artículo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Ketorolaco Trometamina, Dolox, Paracetamol..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-[10px] text-gray-400">
                Si no tiene nombre comercial, usa el principio activo.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Marca comercial registrada (si la tiene)
              </label>
              <input
                type="text"
                placeholder="Ej: Dolox, Advil, Aspirina (o dejar vacío)"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Active Chemical Ingredient & Manufacturer Laboratory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Componente Químico / Principio Activo
              </label>
              <input
                type="text"
                placeholder="Ej: Ketorolaco Trometamina, Ibuprofeno, Amoxicilina..."
                value={activeIngredient}
                onChange={(e) => setActiveIngredient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-[10px] text-gray-400">
                Fórmula activa para saber exactamente qué es.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Laboratorio o Casa Farmacéutica</span>
              </label>
              <input
                type="text"
                placeholder="Ej: La Santé, Farmacéutica Labs, Genfar, Bayer, MK..."
                value={laboratory}
                onChange={(e) => setLaboratory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-[10px] text-gray-400">
                Casa que fabrica o distribuye el medicamento.
              </span>
            </div>
          </div>

          {/* Presentation & Quick pills */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Presentación *
              </label>
            </div>
            <input
              type="text"
              list="presentations-list"
              value={presentation}
              onChange={(e) => setPresentation(e.target.value)}
              placeholder="Tabletas sublinguales, Cápsulas, Jarabe, Jeringa..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
            />
            <datalist id="presentations-list">
              {COMMON_PRESENTATIONS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>

            {/* Quick Presentation Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 pt-1.5 no-scrollbar">
              {[
                'Tabletas sublinguales',
                'Tabletas',
                'Cápsulas',
                'Jarabe',
                'Crema',
                'Jeringa 5ml',
                'Gasas',
                'Vendas',
                'Algodón',
                'Termómetro',
                'Tijeras',
              ].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPresentation(p)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                    presentation.toLowerCase().includes(p.toLowerCase())
                      ? 'bg-teal-100 text-teal-800 font-bold border border-teal-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Dosage / Measurements & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Dosis / Medida (mg, ml, calibre, cm)
              </label>
              <input
                type="text"
                placeholder="Ej: 30 mg, 500 mg, 100 ml, 5 ml aguja 21G, 10x10 cm..."
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
              />
              <span className="text-[10px] text-gray-400">
                Miligramos de la medicina o mililitros del utensilio.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Contenido / Cantidad (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: 4 tabletas, 1 frasco o Disponible"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuantity(val);
                  if (isItemOutOfStock({ quantity: val } as any)) {
                    setIsOutOfStock(true);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
              />
            </div>
          </div>

          {/* Out of Stock Checkbox / Toggle */}
          <div
            onClick={() => setIsOutOfStock(!isOutOfStock)}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between select-none active:scale-[0.99] ${
              isOutOfStock
                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
                : 'bg-gray-50/80 border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 transition-colors ${
                  isOutOfStock ? 'bg-rose-600 shadow-xs' : 'bg-gray-400'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  ¿Este medicamento está agotado / pendiente por comprar?
                </span>
                <span className="text-[10px] text-gray-500">
                  {isOutOfStock
                    ? '⚠️ SÍ, ESTÁ AGOTADO (Aparece en Alertas y lista de compras)'
                    : 'Toca aquí si ya se terminó para agregarlo a la lista de compras.'}
                </span>
              </div>
            </div>
            <div className="relative inline-flex items-center ml-2 shrink-0 pointer-events-none">
              <div
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  isOutOfStock ? 'bg-rose-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-[2px] transition-transform shadow-xs ${
                    isOutOfStock ? 'left-[22px]' : 'left-[2px]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Expiration Date & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Fecha de Caducidad / Vencimiento
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
              <span className="text-[10px] text-gray-400">
                Si no tiene vencimiento (ej. tijeras o bisturí), déjalo en blanco.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Lote / Serie (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: LOT 4920B"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Indications / Para qué sirve */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Indicaciones / Para qué sirve (Primeros Auxilios / Dolor)
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Analgésico y antiinflamatorio para dolor agudo severo, o desinfección de heridas..."
              value={indications}
              onChange={(e) => setIndications(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Administration & Storage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Vía de administración
              </label>
              <select
                value={administrationRoute}
                onChange={(e) => setAdministrationRoute(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Sublingual">Sublingual (debajo de la lengua)</option>
                <option value="Oral">Oral (Pastillas, jarabes, cápsulas)</option>
                <option value="Tópica">Tópica (Cremas, pomadas, geles)</option>
                <option value="Inyectable">Inyectable (Ampollas, jeringas)</option>
                <option value="Oftálmica">Oftálmica (Colirios / ojos)</option>
                <option value="Nasal">Nasal (Gotas o spray)</option>
                <option value="Uso externo / No aplica">Uso externo / No aplica (Utensilios, vendajes)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Conservación / Almacenamiento
              </label>
              <input
                type="text"
                placeholder="Ej: Proteger de la luz solar, conservar a menos de 30°C..."
                value={storageRecommendation}
                onChange={(e) => setStorageRecommendation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Notas adicionales del usuario
            </label>
            <input
              type="text"
              placeholder="Ej: Comprado para el viaje, guardar en bolsillo lateral..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="pt-3 border-t border-gray-100 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-2 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Guardar en Caja</span>
            </button>
          </div>
        </form>

        {/* Big Photo Zoom Modal */}
        {zoomedPhoto && (
          <div
            className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setZoomedPhoto(null)}
          >
            <img
              src={zoomedPhoto}
              alt="Zoom"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        )}
      </div>
    </div>
  );
};
