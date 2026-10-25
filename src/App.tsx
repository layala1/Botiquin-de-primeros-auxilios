import React, { useState, useEffect, useMemo } from 'react';
import { MedicineBox, MedicineItem, AIAnalysisResultItem, ItemCategory } from './types';
import {
  getStoredBoxes,
  saveStoredBoxes,
  getStoredItems,
  saveStoredItems,
  checkExpiryStatus,
  isItemOutOfStock,
} from './services/storage';
import { Header } from './components/Header';
import { BoxManagerModal } from './components/BoxManagerModal';
import { CameraScannerModal } from './components/CameraScannerModal';
import { ItemEditModal } from './components/ItemEditModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ExportModal } from './components/ExportModal';
import { ItemCard } from './components/ItemCard';
import { SummaryCards } from './components/SummaryCards';
import { InstallModal } from './components/InstallModal';
import {
  Search,
  Camera,
  Package,
  Pill,
  Bandage,
  Scissors,
  Droplet,
  Layers,
  Sparkles,
  AlertTriangle,
  FileText,
  Plus,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
  ShoppingCart,
  Copy,
  Check,
} from 'lucide-react';

export default function App() {
  const [boxes, setBoxes] = useState<MedicineBox[]>(() => getStoredBoxes());
  const [items, setItems] = useState<MedicineItem[]>(() => getStoredItems());

  const [activeBoxId, setActiveBoxId] = useState<string | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'inventario' | 'cajas' | 'alertas'>('inventario');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expired' | 'warning' | 'ok'>('all');

  // Modals state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isBoxManagerOpen, setIsBoxManagerOpen] = useState(false);
  const [isItemEditOpen, setIsItemEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  // Active item in detail / edit
  const [detailItem, setDetailItem] = useState<MedicineItem | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<MedicineItem> | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<string | undefined>(undefined);
  const [editingPhotos, setEditingPhotos] = useState<string[]>([]);
  const [editingConfidenceNote, setEditingConfidenceNote] = useState<string | undefined>(undefined);

  // Sub-filter for Alertas tab ('all' | 'stock' | 'expiry')
  const [alertsSubTab, setAlertsSubTab] = useState<'all' | 'stock' | 'expiry'>('all');
  const [copiedShoppingList, setCopiedShoppingList] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'stock' | 'restored' | 'info' } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveStoredBoxes(boxes);
  }, [boxes]);

  useEffect(() => {
    saveStoredItems(items);
  }, [items]);

  // Overall counts: Out of Stock (Volver a comprar) & Expiry
  const outOfStockItems = useMemo(
    () => items.filter((i) => isItemOutOfStock(i)),
    [items]
  );
  const expiredItems = useMemo(
    () => items.filter((i) => checkExpiryStatus(i.expirationDate).status === 'expired'),
    [items]
  );
  const warningItems = useMemo(
    () => items.filter((i) => checkExpiryStatus(i.expirationDate).status === 'warning'),
    [items]
  );

  // Filtered Items for Main Inventory View
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Box filter
      if (activeBoxId !== 'all' && item.boxId !== activeBoxId) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // Expiry filter
      if (expiryFilter !== 'all') {
        const exp = checkExpiryStatus(item.expirationDate);
        if (exp.status !== expiryFilter) return false;
      }

      // Search query (matches name, tradeName, activeIngredient, presentation, dosage, indications)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchTrade = item.tradeName?.toLowerCase().includes(q) ?? false;
        const matchActive = item.activeIngredient?.toLowerCase().includes(q) ?? false;
        const matchPres = item.presentation.toLowerCase().includes(q);
        const matchDosage = item.dosage?.toLowerCase().includes(q) ?? false;
        const matchIndications = item.indications?.toLowerCase().includes(q) ?? false;

        if (!matchName && !matchTrade && !matchActive && !matchPres && !matchDosage && !matchIndications) {
          return false;
        }
      }

      return true;
    });
  }, [items, activeBoxId, categoryFilter, expiryFilter, searchQuery]);

  // Handler: Box Saved (Create / Update)
  const handleSaveBox = (newBox: MedicineBox) => {
    setBoxes((prev) => {
      const exists = prev.some((b) => b.id === newBox.id);
      if (exists) {
        return prev.map((b) => (b.id === newBox.id ? newBox : b));
      }
      return [...prev, newBox];
    });
    setActiveBoxId(newBox.id);
  };

  // Handler: Box Deleted
  const handleDeleteBox = (boxId: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== boxId));
    // Also delete or reassign items
    setItems((prev) => prev.filter((i) => i.boxId !== boxId));
    if (activeBoxId === boxId) {
      setActiveBoxId('all');
    }
  };

  // Handler: Item Saved (Create / Update)
  const handleSaveItem = (item: MedicineItem) => {
    const normalizedItem: MedicineItem = {
      ...item,
      isOutOfStock: isItemOutOfStock(item),
    };
    setItems((prev) => {
      const exists = prev.some((i) => i.id === normalizedItem.id);
      const next = exists
        ? prev.map((i) => (i.id === normalizedItem.id ? normalizedItem : i))
        : [normalizedItem, ...prev];
      saveStoredItems(next);
      return next;
    });

    if (detailItem && detailItem.id === normalizedItem.id) {
      setDetailItem(normalizedItem);
    }
  };

  // Handler: Item Deleted
  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== itemId);
      saveStoredItems(next);
      return next;
    });
    setIsDetailOpen(false);
    setDetailItem(null);
  };

  // Handler: Move Item between Boxes
  const handleMoveBox = (itemId: string, newBoxId: string) => {
    setItems((prev) => {
      const next = prev.map((i) =>
        i.id === itemId ? { ...i, boxId: newBoxId, updatedAt: new Date().toISOString() } : i
      );
      saveStoredItems(next);
      return next;
    });
    if (detailItem && detailItem.id === itemId) {
      setDetailItem((prev) => (prev ? { ...prev, boxId: newBoxId } : null));
    }
  };

  // Handler: Toggle Out of Stock (Se agotó / Volver a comprar)
  const handleToggleOutOfStock = (itemId: string, isOutOfStock: boolean) => {
    let affectedItemName = '';
    const normalized = Boolean(isOutOfStock);

    setItems((prev) => {
      const next = prev.map((i) => {
        if (i.id === itemId) {
          affectedItemName = i.name;
          return {
            ...i,
            isOutOfStock: normalized,
            outOfStockDate: normalized ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return i;
      });
      // Synchronously write to localStorage
      saveStoredItems(next);
      return next;
    });

    if (detailItem && detailItem.id === itemId) {
      setDetailItem((prev) =>
        prev
          ? {
              ...prev,
              isOutOfStock: normalized,
              outOfStockDate: normalized ? new Date().toISOString() : undefined,
            }
          : null
      );
    }

    setToastMessage({
      text: normalized
        ? `🛒 "${affectedItemName || 'Medicamento'}" marcado como AGOTADO. Agregado a Alertas (Por Comprar).`
        : `✅ "${affectedItemName || 'Medicamento'}" marcado como REPUESTO en caja.`,
      type: normalized ? 'stock' : 'restored',
    });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handler: Copy Out-of-Stock Shopping List for WhatsApp / Note
  const handleCopyShoppingList = () => {
    if (outOfStockItems.length === 0) return;
    const lines = [
      `🛒 LISTA DE COMPRAS DE FARMACIA (Botiquín)`,
      `Fecha: ${new Date().toLocaleDateString('es-ES')}`,
      `Total pendientes: ${outOfStockItems.length}`,
      ``,
      ...outOfStockItems.map((item, idx) => {
        const box = boxes.find((b) => b.id === item.boxId);
        const parts = [
          item.dosage,
          item.activeIngredient && item.activeIngredient !== item.name ? `Comp: ${item.activeIngredient}` : '',
          item.laboratory ? `Lab: ${item.laboratory}` : '',
          box ? `Caja: ${box.name}` : '',
        ].filter(Boolean);

        return `${idx + 1}. ${item.name}${parts.length > 0 ? ` (${parts.join(' · ')})` : ''}`;
      }),
      ``,
      `Generado desde mi aplicación de Botiquín Médico.`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedShoppingList(true);
    setTimeout(() => setCopiedShoppingList(false), 3000);
  };

  // Handler: Successful AI Scan Analysis
  const handleAnalysisSuccess = (
    detectedItems: AIAnalysisResultItem[],
    photos: string[],
    targetBoxId: string,
    summary?: string
  ) => {
    const firstItem = detectedItems[0];
    if (!firstItem) return;

    // Convert AI extracted item into draft MedicineItem
    // If tradeName is absent or equal, use active ingredient as primary name
    const primaryName = firstItem.name || firstItem.activeIngredient || 'Medicamento o Insumo';

    const draft: Partial<MedicineItem> = {
      boxId: targetBoxId || (boxes[0]?.id ?? 'box-1'),
      name: primaryName,
      tradeName: firstItem.tradeName || '',
      activeIngredient: firstItem.activeIngredient || '',
      laboratory: firstItem.laboratory || '',
      category: (firstItem.category as ItemCategory) || 'medicamento',
      presentation: firstItem.presentation || 'Pastillas / Comprimidos',
      dosage: firstItem.dosage || '',
      quantity: firstItem.quantity || '1 unidad',
      expirationDate: firstItem.expirationDate || '',
      batch: firstItem.batch || '',
      indications: firstItem.indications || '',
      administrationRoute: firstItem.administrationRoute || 'Oral',
      storageRecommendation: firstItem.storageRecommendation || '',
      photoUrl: photos[0],
      photoUrls: photos,
    };

    setEditingItem(draft);
    setEditingPhoto(photos[0]);
    setEditingPhotos(photos);
    setEditingConfidenceNote(firstItem.confidenceNote || summary);
    setIsItemEditOpen(true);
  };

  // Handler: Open Manual Entry
  const handleOpenManualEntry = (targetBoxId?: string) => {
    setEditingItem({
      boxId: targetBoxId || (activeBoxId === 'all' ? boxes[0]?.id : activeBoxId),
    });
    setEditingPhoto(undefined);
    setEditingPhotos([]);
    setEditingConfidenceNote(undefined);
    setIsItemEditOpen(true);
  };

  // Handler: Import Data Backup
  const handleImportData = (newBoxes: MedicineBox[], newItems: MedicineItem[]) => {
    setBoxes(newBoxes);
    setItems(newItems);
  };

  const handleOpenScan = () => {
    if (boxes.length === 0) {
      setIsBoxManagerOpen(true);
    } else {
      setIsCameraOpen(true);
    }
  };

  const activeBox = boxes.find((b) => b.id === activeBoxId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-24 selection:bg-teal-100 w-full max-w-full overflow-x-hidden">
      {/* Top Header */}
      <Header
        boxes={boxes}
        activeBoxId={activeBoxId}
        onSelectBox={(id) => setActiveBoxId(id)}
        onOpenManageBoxes={() => setIsBoxManagerOpen(true)}
        onOpenNewItem={handleOpenScan}
        onOpenInstallModal={() => setIsInstallOpen(true)}
        expiredCount={expiredItems.length}
        expiringCount={warningItems.length}
        outOfStockCount={outOfStockItems.length}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full max-w-full px-3 sm:px-4 pt-2.5 flex-1 overflow-x-hidden">
        {/* Resumen Estadístico Rápido */}
        <SummaryCards
          boxes={boxes}
          items={items}
          onSelectBox={(boxId) => {
            setActiveBoxId(boxId);
            setActiveTab('inventario');
          }}
          onNavigateToAlerts={(filter) => {
            setActiveTab('alertas');
            setAlertsSubTab(filter || 'all');
          }}
          onShowAllItems={() => {
            setActiveBoxId('all');
            setActiveTab('inventario');
            setCategoryFilter('all');
            setExpiryFilter('all');
          }}
        />

        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex bg-gray-200/80 p-1 rounded-xl text-xs font-bold text-gray-600 shadow-2xs">
            <button
              onClick={() => setActiveTab('inventario')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'inventario'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'hover:text-gray-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventario</span>
              <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full">
                {filteredItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('cajas')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'cajas' ? 'bg-white text-teal-800 shadow-xs' : 'hover:text-gray-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cajas ({boxes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('alertas')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'alertas'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'hover:text-gray-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Alertas</span>
              {outOfStockItems.length > 0 ? (
                <span className="text-[10px] bg-rose-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                  {outOfStockItems.length}
                </span>
              ) : (expiredItems.length > 0 || warningItems.length > 0) ? (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              ) : null}
            </button>
          </div>

          {/* Quick Export/Share button */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="p-2 text-gray-500 hover:text-teal-700 bg-white border border-gray-200 hover:border-teal-300 rounded-xl transition-all shadow-2xs"
            title="Exportar inventario / Imprimir para viaje"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>

        {/* TAB 1: INVENTARIO */}
        {activeTab === 'inventario' && (
          <div className="space-y-3.5">
            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar medicina, síntoma, jeringa, gasas, marca o componente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Chips Horizontal Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              <span className="text-gray-400 text-[11px] font-bold uppercase tracking-wider pl-1 shrink-0">
                Categoría:
              </span>
              {[
                { id: 'all', label: 'Todo' },
                { id: 'medicamento', label: '💊 Medicinas' },
                { id: 'material_curacion', label: '🩹 Curación' },
                { id: 'utensilio_instrumental', label: '🩺 Utensilios / Inyectadoras' },
                { id: 'antiseptico_higiene', label: '🧴 Antisépticos' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id)}
                  className={`px-2.5 py-1 rounded-xl font-medium whitespace-nowrap transition-colors ${
                    categoryFilter === f.id
                      ? 'bg-teal-600 text-white font-bold shadow-2xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Active Box Banner if a single box is selected */}
            {activeBoxId !== 'all' && activeBox && (
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{activeBox.icon}</span>
                  <div>
                    <h3 className="font-bold text-xs text-teal-950">{activeBox.name}</h3>
                    <p className="text-[11px] text-teal-700">{activeBox.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveBoxId('all')}
                  className="text-[11px] font-semibold text-teal-700 bg-white border border-teal-300 px-2.5 py-1 rounded-lg hover:bg-teal-50"
                >
                  Ver todas las cajas
                </button>
              </div>
            )}

            {/* Item List / Cards Grid */}
            {boxes.length === 0 ? (
              <div className="text-center py-10 px-5 bg-white rounded-3xl border border-dashed border-teal-300 shadow-2xs">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-teal-500/20 text-3xl">
                  📦
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  ¡Empieza creando tu primer botiquín o caja!
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4 leading-relaxed">
                  Para poder registrar tus medicinas o utensilios con la cámara, crea primero tu primera caja (por ejemplo: <strong>Botiquín de Viaje</strong> o <strong>Caja del Hogar</strong>).
                </p>
                <button
                  onClick={() => setIsBoxManagerOpen(true)}
                  className="px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 inline-flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Crear Mi Primera Caja Ahora</span>
                </button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'No se encontraron artículos con ese criterio'
                    : 'Esta caja no tiene medicinas registradas aún'}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  Toma una foto a la caja, jarabe, inyectadora, gasas o blíster con tu cámara y la
                  IA completará los datos automáticamente.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleOpenScan}
                    className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>+ Escanear con Cámara</span>
                  </button>
                  <button
                    onClick={() => handleOpenManualEntry()}
                    className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
                  >
                    Ingresar a mano
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems.map((item) => {
                  const box = boxes.find((b) => b.id === item.boxId);
                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      box={box}
                      onClick={() => {
                        setDetailItem(item);
                        setIsDetailOpen(true);
                      }}
                      onToggleOutOfStock={handleToggleOutOfStock}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GESTIÓN DE CAJAS */}
        {activeTab === 'cajas' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Tus Cajas de Medicinas</h2>
                <p className="text-xs text-gray-500">
                  Organiza botiquines para viaje, casa, coche o emergencias
                </p>
              </div>
              <button
                onClick={() => setIsBoxManagerOpen(true)}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nueva Caja</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {boxes.map((box) => {
                const boxItems = items.filter((i) => i.boxId === box.id);
                const expiredInBox = boxItems.filter(
                  (i) => checkExpiryStatus(i.expirationDate).status === 'expired'
                );

                return (
                  <div
                    key={box.id}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-teal-300 p-4 shadow-2xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl shadow-2xs">
                            {box.icon || '📦'}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-gray-900">{box.name}</h3>
                            <p className="text-xs text-gray-500 line-clamp-1">{box.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                          {boxItems.length} artículos
                        </span>
                        {expiredInBox.length > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                            {expiredInBox.length} vencidos
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-gray-100 flex gap-2">
                      <button
                        onClick={() => {
                          setActiveBoxId(box.id);
                          setActiveTab('inventario');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-gray-50 hover:bg-teal-50 text-gray-800 hover:text-teal-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>Ver contenido</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveBoxId(box.id);
                          setIsCameraOpen(true);
                        }}
                        className="py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs"
                        title="Tomar foto y añadir a esta caja"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>+ Foto</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: ALERTAS Y REPOSICIÓN */}
        {activeTab === 'alertas' && (
          <div className="space-y-4">
            {/* Header with Sub-filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>Alertas y Reposición</span>
                  {outOfStockItems.length > 0 && (
                    <span className="text-xs bg-rose-100 text-rose-800 border border-rose-300 font-extrabold px-2 py-0.5 rounded-full">
                      {outOfStockItems.length} agotado{outOfStockItems.length > 1 ? 's' : ''}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500">
                  Medicinas agotadas para reponer y control de fechas de caducidad
                </p>
              </div>

              {/* Sub-filter chips */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setAlertsSubTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    alertsSubTab === 'all'
                      ? 'bg-white text-gray-900 shadow-2xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Todo ({outOfStockItems.length + expiredItems.length + warningItems.length})
                </button>
                <button
                  onClick={() => setAlertsSubTab('stock')}
                  className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                    alertsSubTab === 'stock'
                      ? 'bg-white text-rose-700 shadow-2xs font-bold'
                      : 'text-gray-600 hover:text-rose-700'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Por Comprar ({outOfStockItems.length})</span>
                </button>
                <button
                  onClick={() => setAlertsSubTab('expiry')}
                  className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                    alertsSubTab === 'expiry'
                      ? 'bg-white text-teal-800 shadow-2xs font-bold'
                      : 'text-gray-600 hover:text-teal-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Caducidades ({expiredItems.length + warningItems.length})</span>
                </button>
              </div>
            </div>

            {/* SECTION 1: MEDICAMENTOS AGOTADOS / LISTA DE COMPRAS DE FARMACIA */}
            {(alertsSubTab === 'all' || alertsSubTab === 'stock') && (
              <div className="bg-white rounded-3xl border border-rose-200/80 p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span>Medicamentos Agotados (Volver a Comprar)</span>
                        <span className="text-xs bg-rose-100 text-rose-700 font-extrabold px-2 py-0.5 rounded-full">
                          {outOfStockItems.length}
                        </span>
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        Lista lista para llevar a la farmacia y reponer tus botiquines
                      </p>
                    </div>
                  </div>

                  {outOfStockItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCopyShoppingList}
                      className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition-colors shrink-0 active:scale-95 shadow-2xs"
                    >
                      {copiedShoppingList ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700">¡Copiado al portapapeles!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-teal-600" />
                          <span>Copiar Lista para WhatsApp</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {outOfStockItems.length === 0 ? (
                  <div className="py-6 px-4 text-center text-xs text-gray-500">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-gray-800 text-sm">
                      ¡No tienes ningún medicamento agotado!
                    </p>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                      Cuando uses o te tomes un medicamento, pulsa <strong>"Se agotó (Volver a comprar)"</strong> en su ficha y la aplicación te lo recordará aquí.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {outOfStockItems.map((item) => {
                      const box = boxes.find((b) => b.id === item.boxId);
                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-rose-50/40 rounded-2xl border border-rose-200 flex flex-col justify-between gap-2.5 hover:border-rose-300 transition-colors"
                        >
                          <div className="flex items-start gap-2.5">
                            {item.photoUrl ? (
                              <img
                                src={item.photoUrl}
                                alt={item.name}
                                className="w-14 h-14 rounded-xl object-cover border border-rose-200 shrink-0 cursor-pointer"
                                onClick={() => {
                                  setDetailItem(item);
                                  setIsDetailOpen(true);
                                }}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                <Pill className="w-6 h-6" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {box && (
                                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded-md truncate">
                                    {box.icon} {box.name}
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold text-gray-500 bg-white px-1.5 py-0.2 rounded-md">
                                  {item.presentation}
                                </span>
                              </div>

                              <h4
                                className="font-bold text-sm text-gray-900 mt-0.5 truncate cursor-pointer hover:text-teal-700"
                                onClick={() => {
                                  setDetailItem(item);
                                  setIsDetailOpen(true);
                                }}
                              >
                                {item.name}
                              </h4>

                              {item.activeIngredient && (
                                <p className="text-[11px] text-gray-600 truncate mt-0.5">
                                  Comp: <strong>{item.activeIngredient}</strong>
                                </p>
                              )}

                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[10px]">
                                {item.dosage && (
                                  <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                    {item.dosage}
                                  </span>
                                )}
                                {item.laboratory && (
                                  <span className="text-gray-600">Lab: {item.laboratory}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-rose-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDetailItem(item);
                                setIsDetailOpen(true);
                              }}
                              className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 underline"
                            >
                              Ver detalles
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleOutOfStock(item.id, false)}
                              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Ya lo compré (Marcar repuesto)</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: CADUCIDADES */}
            {(alertsSubTab === 'all' || alertsSubTab === 'expiry') && (
              <div className="space-y-3 pt-1">
                {/* Expired list */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                      Medicinas Vencidas ({expiredItems.length})
                    </h3>
                  </div>

                  {expiredItems.length === 0 ? (
                    <div className="p-3.5 bg-white rounded-2xl border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>¡Excelente! No tienes medicamentos vencidos en ninguna caja.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {expiredItems.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          box={boxes.find((b) => b.id === item.boxId)}
                          onClick={() => {
                            setDetailItem(item);
                            setIsDetailOpen(true);
                          }}
                          onToggleOutOfStock={handleToggleOutOfStock}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Warning list (< 90 days) */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Vencen en los próximos 90 días ({warningItems.length})
                    </h3>
                  </div>

                  {warningItems.length === 0 ? (
                    <div className="p-3.5 bg-white rounded-2xl border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>No hay medicamentos a punto de vencer.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {warningItems.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          box={boxes.find((b) => b.id === item.boxId)}
                          onClick={() => {
                            setDetailItem(item);
                            setIsDetailOpen(true);
                          }}
                          onToggleOutOfStock={handleToggleOutOfStock}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Action Bar (Ergonomic for Mobile) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30 shadow-lg pb-safe">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => setActiveTab('cajas')}
            className={`flex flex-col items-center gap-1 p-1 text-[11px] font-semibold transition-colors ${
              activeTab === 'cajas' ? 'text-teal-700' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>Cajas</span>
          </button>

          <button
            onClick={() => setActiveTab('inventario')}
            className={`flex flex-col items-center gap-1 p-1 text-[11px] font-semibold transition-colors ${
              activeTab === 'inventario' ? 'text-teal-700' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Inventario</span>
          </button>

          {/* Big Center Shutter Button: Escanear Foto con IA */}
          <button
            onClick={handleOpenScan}
            className="-mt-5 w-14 h-14 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex flex-col items-center justify-center shadow-lg shadow-teal-500/30 border-4 border-white active:scale-90 transition-transform"
            title="Tomar foto a una medicina o material"
          >
            <Camera className="w-6 h-6" />
          </button>

          <button
            onClick={() => setActiveTab('alertas')}
            className={`flex flex-col items-center gap-1 p-1 text-[11px] font-semibold transition-colors relative ${
              activeTab === 'alertas' ? 'text-teal-700' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Alertas</span>
            {outOfStockItems.length > 0 ? (
              <span className="absolute -top-0.5 right-1 text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.2 rounded-full">
                {outOfStockItems.length}
              </span>
            ) : (expiredItems.length > 0 || warningItems.length > 0) ? (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500" />
            ) : null}
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex flex-col items-center gap-1 p-1 text-[11px] font-semibold text-gray-400 hover:text-gray-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span>Reporte</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <BoxManagerModal
        isOpen={isBoxManagerOpen}
        onClose={() => setIsBoxManagerOpen(false)}
        boxes={boxes}
        items={items}
        onSaveBox={handleSaveBox}
        onDeleteBox={handleDeleteBox}
        onSelectBox={(id) => {
          setActiveBoxId(id);
          setActiveTab('inventario');
        }}
      />

      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        boxes={boxes}
        activeBoxId={activeBoxId}
        onAnalysisSuccess={handleAnalysisSuccess}
        onOpenManualEntry={(boxId) => handleOpenManualEntry(boxId)}
      />

      <ItemEditModal
        isOpen={isItemEditOpen}
        onClose={() => {
          setIsItemEditOpen(false);
          setEditingItem(null);
          setEditingPhotos([]);
        }}
        boxes={boxes}
        initialItem={editingItem}
        photoUrl={editingPhoto}
        photos={editingPhotos}
        defaultBoxId={activeBoxId === 'all' ? boxes[0]?.id : activeBoxId}
        confidenceNote={editingConfidenceNote}
        onSave={handleSaveItem}
      />

      <ItemDetailModal
        isOpen={isDetailOpen}
        item={detailItem}
        boxes={boxes}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailItem(null);
        }}
        onEdit={(item) => {
          setIsDetailOpen(false);
          setDetailItem(null);
          setEditingItem(item);
          setEditingPhoto(item.photoUrl);
          setEditingPhotos(item.photoUrls || (item.photoUrl ? [item.photoUrl] : []));
          setEditingConfidenceNote(undefined);
          setIsItemEditOpen(true);
        }}
        onDelete={handleDeleteItem}
        onMoveBox={handleMoveBox}
        onToggleOutOfStock={handleToggleOutOfStock}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        boxes={boxes}
        items={items}
        activeBoxId={activeBoxId}
        onImportData={handleImportData}
      />

      <InstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />

      {/* Floating Toast Notification for Stock Actions */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center justify-between gap-2.5 animate-in slide-in-from-bottom-5 duration-200 border bg-slate-900 text-white border-slate-700">
          <div className="flex items-center gap-2">
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-white p-1 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
