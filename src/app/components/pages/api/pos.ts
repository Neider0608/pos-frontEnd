import { Customer, PosProduct, Product } from './shared';

export interface Invoice {
    id?: string;
    index: number;
    items: CartItem[];
    customer: Customer | null;
    generalDiscount: number;
    detailDiscount: number;
    grossSubtotal: number;
    totalVat: number; // ✅ nuevo
    subtotal: number;
    total: number;
    paymentMethods: PaymentMethod[];
    deliveryInfo?: DeliveryInfo;
    invoiceNumber?: string;
    date?: Date;
    tempId?: string;
}

export interface PaymentMethod {
    type: 'cash' | 'card' | 'transfer' | 'financed' | 'other';
    amount: number;
    months?: number;
}

export interface DeliveryInfo {
    isDelivery: boolean;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    notes?: string;
}

export interface AvailableProduct {
    id: string;
    name: string;
    barcode: string;
    price: number;
    hasDiscount: boolean;
    discountPercent: number;
    category: string;
    stock: number;
    image?: string;
}

export interface CartItem extends PosProduct {
    quantity: number;
    prevQuantity: number;
    discount: number;
    subtotal: number;
    discountValue: number;
    total: number;
}

export interface LastSale {
    invoiceNumber: string;
    date: Date;
    customer: Customer | null;
    items: CartItem[];
    subtotal: number;
    grossSubtotal: number;
    detailDiscount: number;
    generalDiscount: number;
    totalVat: number;
    total: number;
    paymentMethods: PaymentMethod[];
    deliveryInfo?: DeliveryInfo;
}

export type ViewMode = 'desktop' | 'touch';

export interface StockReservationRequest {
    action: 'RESERVAR' | 'CANCELAR' | 'RESTAR';
    productId: number;
    quantity: number;
    companiaId: number;
    userId: number;
    facturaTempId?: string;
}

export interface StockReservationResponse {
    success: number;
    stockDisponible: number;
    motivo: string;
}

export interface IInvoiceClients {
    id: number;
    invoice_Number?: string;
    client_Name?: string;
    client_Nit?: string;

    subtotal?: number;
    subtotal_Bruto?: number;
    descuento_General?: number;
    total_Iva?: number;
    invoice_Total?: number;
    invoice_Status?: string;
    created_At?: Date;
    // 🔹 Detalle de productos
    items?: InvoiceItem[];
    customer?: InvoiceCustomer;

    // 🔹 Pagos
    payments?: InvoicePayment[];

    // 🔹 Datos de entrega
    delivery?: InvoiceDelivery;
}

export interface InvoiceItem {
    product_Id?: number;
    reference?: string;
    extension1?: string;
    extension2?: string;
    product_Sku?: string;
    barcode?: string;
    name?: string;
    quantity?: number;
    price?: number;
    discount?: number;
    discount_Value?: number;
    subtotal?: number;
    total?: number;
}

export interface InvoicePayment {
    type?: string;
    amount?: number;
    months?: number;
}

export interface InvoiceDelivery {
    address?: string;
    city?: string;
    state?: string;
    zip_Code?: string;
    phone?: string;
    notes?: string;
}

export interface InvoiceCustomer {
    document?: string; // c.documento
    nit?: string; // c.nit
    firstName?: string; // c.nombre1
    middleName?: string; // c.nombre2
    lastName?: string; // c.apellido1
    secondLastName?: string; // c.apellido2
    companyName?: string; // c.razon_social
    phone?: string; // c.telefono
    isCompany: boolean; // c.es_empresa
}
