export interface Promotion {
    id: string;
    name: string;
    description: string;
    type: "percentage" | "fixed_amount" | "buy_x_get_y" | "bundle";
    value: number;
    minPurchase?: number;
    maxDiscount?: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    applicableProducts: string[];
    applicableCategories: string[];
    usageLimit?: number;
    usageCount: number;
    createdBy: string;
    createdAt: string;
  }