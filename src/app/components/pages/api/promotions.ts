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
  // Productos/categorías por cuya COMPRA aplica la promoción (para descuentos: a cuáles aplica; para buy_x_get_y: "por compra de cuáles")
  categoryIds?: number[];
  categories?: any[]; // Solo lectura desde BD
  productIds?: number[];
  products?: any[]; // Solo lectura desde BD
  // Solo para buy_x_get_y: productos/categorías que se REGALAN (lo que el cliente se lleva gratis)
  freeCategoryIds?: number[];
  freeProductIds?: number[];
}