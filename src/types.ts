export type ItemCategory =
  | 'medicamento'
  | 'material_curacion'
  | 'utensilio_instrumental'
  | 'antiseptico_higiene'
  | 'otro';

export interface MedicineBox {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineItem {
  id: string;
  boxId: string;
  name: string;
  tradeName?: string;
  activeIngredient?: string;
  laboratory?: string;
  category: ItemCategory;
  presentation: string;
  dosage?: string;
  quantity?: string;
  isOutOfStock?: boolean;
  outOfStockDate?: string;
  expirationDate?: string;
  batch?: string;
  indications?: string;
  administrationRoute?: string;
  storageRecommendation?: string;
  photoUrl?: string;
  photoUrls?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIAnalysisResultItem {
  name: string;
  tradeName?: string;
  activeIngredient?: string;
  laboratory?: string;
  category?: string;
  presentation?: string;
  dosage?: string;
  quantity?: string;
  expirationDate?: string;
  batch?: string;
  indications?: string;
  administrationRoute?: string;
  storageRecommendation?: string;
  confidenceNote?: string;
}

export interface AIAnalysisResponse {
  summary?: string;
  items: AIAnalysisResultItem[];
  error?: string;
  details?: string;
}
