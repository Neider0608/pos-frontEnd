import { ProductWarehouseRequest } from './shared';

export interface StockStatus {
    status: string;
    severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
    tailwindClass: string;
}

export interface GetPurchase {
    purchaseId: number;
    purchaseOrder?: string;
    consecutive: number;
    supplierNit: string;
    supplier: string;

    supplierInvoice: string;
    invoiceDate?: Date | string;

    subTotal: number;
    total: number;
    stateId: number;
    state: string;
    createdAt: Date | string;
}

export interface GetPurchaseDetail {
    purchaseDetailId: number;

    sku: string;
    barcode: string;

    reference: string;
    extension1?: string;
    extension2?: string;

    productName: string;
    wareHouse: string;

    quantity: number;
    unitPrice: number;

    subTotal: number;
    tax: number;
    total: number;
}

export interface PurchaseDetail {
    productId?: number;
    productName: string;
    reference: string;
    sku: number | string;
    ean?: string;
    ext1?: string;
    ext2?: string;
    quantity: number;
    cost: number;
    taxPercent: number;
    total: number;
    categoryId?: number | null | undefined;
    unitMeasureId?: number | null | undefined;
    warehouseId?: number | null | undefined;
}

export interface Purchase {
    companiaId: number;
    stateId: number | null;
    purchaseOrder: string | null;
    userId: number;
    providerId: number | null;
    invoiceNumber: string;
    date: Date;
    details: PurchaseDetail[];
    subtotal: number;
    tax: number;
    total: number;
}

export interface PurchaseHistory {
    id: string;
    providerName: string;
    invoiceNumber: string;
    date: Date;
    total: number;
    status: 'COMPLETADO' | 'PENDIENTE' | 'CANCELADO';
    itemCount: number;
}

export interface WarehouseUI extends ProductWarehouseRequest {
    name: string; // Para mostrar el nombre en la lista del modal
}
