export interface Promotion {
  id?: number;
  companiaId?: number;
  userId?: number;
  name: string;
  description?: string;
  type: "percentage" | "fixed_amount" | "buy_x_get_y" | "bundle";
  value?: number;
  minPurchase?: number;
  maxDiscount?: number;
  buyY?: number; // Para buy_x_get_y: cantidad que se lleva gratis
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  usageLimit?: number;
  usageCount?: number;
  createdBy?: number;
  createdAt?: string;
  deleted?: boolean;
  categoryIds?: number[]; // IDs de categorías aplicables
  categories?: any[]; // Categorías completas (solo lectura desde BD)
  productIds?: number[]; // IDs de productos aplicables
  products?: any[]; // Productos completos (solo lectura desde BD)
  // Para buy_x_get_y: productos/categorías que se llevan gratis
  freeCategoryIds?: number[]; // Categorías que se llevan gratis
  freeProductIds?: number[]; // Productos que se llevan gratis
}