import React, { useState, useRef } from 'react';
import { MedicineBox, MedicineItem } from '../types';
import { checkExpiryStatus } from '../services/storage';
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  Printer,
  FileText,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  boxes: MedicineBox[];
  items: MedicineItem[];
  activeBoxId: string | 'all';
  onImportData: (boxes: MedicineBox[], items: MedicineItem[]) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  boxes,
  items,
  activeBoxId,
  onImportData,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedBoxFilter, setSelectedBoxFilter] = useState<string>(activeBoxId);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const filteredItems =
    selectedBoxFilter === 'all'
      ? items
      : items.filter((i) => i.boxId === selectedBoxFilter);

  const targetBox = boxes.find((b) => b.id === selectedBoxFilter);

  // Generate plain text report
  const generateTextReport = () => {
    let title = selectedBoxFilter === 'all' ? 'INVENTARIO GENERAL DE BOTIQUINES' : `BOTIQUÍN: ${targetBox?.name?.toUpperCase()}`;
    let text = `========================================\n${title}\nGenerado el: ${new Date().toLocaleDateString('es-ES')}\nTotal de artículos: ${filteredItems.length}\n========================================\n\n`;

    filteredItems.forEach((item, index) => {
      const box = boxes.find((b) => b.id === item.boxId);
      const exp = checkExpiryStatus(item.expirationDate);
      text += `${index + 1}. ${item.name.toUpperCase()}\n`;
      if (item.isOutOfStock) {
        text += `   ⚠️ ESTADO: AGOTADO (VOLVER A COMPRAR)\n`;
      }
      if (item.laboratory) {
        text += `   Laboratorio: ${item.laboratory}\n`;
      } else if (item.tradeName && item.tradeName !== item.name) {
        text += `   Marca/Lab: ${item.tradeName}\n`;
      }
      if (item.activeIngredient) {
        text += `   Principio activo: ${item.activeIngredient}\n`;
      }
      text += `   Presentación: ${item.presentation}\n`;
      if (item.dosage) text += `   Dosis/Medida: ${item.dosage}\n`;
      if (item.quantity) text += `   Contenido: ${item.quantity}\n`;
      if (selectedBoxFilter === 'all') text += `   Caja: ${box?.name || 'Desconocida'}\n`;
      if (item.expirationDate) text += `   Vencimiento: ${item.expirationDate} (${exp.label})\n`;
      if (item.indications) text += `   Uso/Indicación: ${item.indications}\n`;
      text += `\n`;
    });

    return text;
  };

  const handleCopy = () => {
    const text = generateTextReport();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      boxes,
      items,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo_botiquines_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed.boxes && Array.isArray(parsed.boxes) && parsed.items && Array.isArray(parsed.items)) {
          onImportData(parsed.boxes, parsed.items);
          alert('¡Respaldo importado con éxito!');
          onClose();
        } else {
          alert('El archivo no tiene el formato correcto de respaldo.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-teal-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Exportar y Compartir Inventario</h2>
              <p className="text-xs text-gray-500">
                Lleva tu lista médica para viajes, emergencias o respalda tus datos
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Box Selector for Report */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Caja a Exportar o Imprimir:
            </label>
            <select
              value={selectedBoxFilter}
              onChange={(e) => setSelectedBoxFilter(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">🗂️ Todas las cajas ({items.length} artículos)</option>
              {boxes.map((b) => {
                const count = items.filter((i) => i.boxId === b.id).length;
                return (
                  <option key={b.id} value={b.id}>
                    {b.icon} {b.name} ({count} artículos)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Text preview box */}
          <div className="relative">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Vista previa del texto:
            </label>
            <pre className="w-full h-44 p-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-mono text-gray-800 overflow-y-auto whitespace-pre-wrap select-all">
              {generateTextReport()}
            </pre>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto para WhatsApp/Email'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-gray-600" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>

          {/* Backup Section */}
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-xs font-bold text-gray-900 mb-2">Copia de Seguridad (Backup)</h4>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadJSON}
                className="flex-1 py-2 px-3 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-teal-600" />
                <span>Descargar Respaldo JSON</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Restaurar Respaldo</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
