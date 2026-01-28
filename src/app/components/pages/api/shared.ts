export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

export interface Warehouse {
    id?: number;
    companiaId?: number;
    warehouseId: string;
    name: string;
    code: string;
    address?: string;
    city?: string;
    phone?: string;
    active?: boolean;
    createdAt?: Date;
}

export interface Category {
    id?: number;
    companiaId?: number;
    name: string;
    description?: string;
    active?: boolean;
    createdAt?: Date;
}

export interface IdentificationType {
    id?: number;
    code: string;
    description: string;
    active?: boolean;
}

export interface UnitOfMeasure {
    id?: number;
    code: string;
    description: string;
    active?: boolean;
}

export interface Product {
    id: number;
    companiaId: number;

    code: number;
    name: string;
    description: string;
    barcode: string;

    reference?: string;
    extension1?: string;
    extension2?: string;
    tag?: string;

    price: number;
    imageUrl?: string;

    categoryId: number;
    category?: string;

    unitMeasureId: number;
    unitMeasure?: string;

    active: boolean;
    manageStock: boolean;

    reservedStock: number;

    createdAt?: string;
    updatedAt?: string;

    hasPromotion?: boolean;
    hasDiscount?: boolean;
    discountPercent?: number;

    /** 🔥 NUEVO: min / max por bodega */
    maximosMinimos: ProductMinMaxByWarehouse[];

    /** 🔥 NUEVO: stock por bodega */
    existencias: ProductStockByWarehouse[];
}
export interface ProductMinMaxByWarehouse {
    wareHouse: string;
    wareHouseId: number;
    minStock: number;
    maxStock: number;
}

export interface ProductStockByWarehouse {
    wareHouse: string;
    wareHouseId: number;
    stock: number;
}
export interface ProductCreateRequest {
    id: number;
    userId: number;
    companiaId: number;

    name: string;
    description: string;
    barcode: string;

    reference?: string;
    extension1?: string;
    extension2?: string;
    tag?: string;

    price: number;
    imageUrl?: string;

    categoryId: number;
    unitMeasureId: number;

    active: boolean;
    manageStock: boolean;

    warehouses: ProductWarehouseRequest[];
}
export interface ProductWarehouseRequest {
    warehouseId: number;
    stock?: number;
    minStock?: number;
    maxStock?: number;
}

export interface Customer {
    id: number;
    companiaId: number;
    userId: number;
    identificationTypeId: number;
    document: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    secondLastName?: string;
    phone?: string;
    email: string;

    // 🏙️ Datos de ubicación
    city?: string;
    department?: string;
    country?: string;
    address?: string;

    // 🏢 Datos empresariales
    isCompany: boolean;
    nit?: string;
    businessName?: string;

    // 🕒 Auditoría
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PosProduct {
    id: number;
    code: number;
    reference: string;
    extension1?: string;
    extension2?: string;
    tag?: string | null;

    barcode: string;
    name: string;
    description: string;
    price: number;

    category: string;
    categoryId: number;

    unitMeasure: string;
    unitMeasureId: number;

    stock: number; // Disponible en bodega principal
    manageStock: boolean;

    hasDiscount: boolean | null;
    discountPercent: number;
}
