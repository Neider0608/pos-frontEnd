export interface Sending {
    rowid: number;
    companiaOrigen: number;
    companiaOrigenNombre: string;
    companiaDestino: number;
    companiaDestinoNombre: string;
    estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
    usuario: number;
    usuarioNombre: string;
    observacion: string;
    fechaCreacion: Date | string;
    fechaAprobacion?: Date | string;
    totalItems: number;
    totalUnidades: number;
}

export interface SendingDetail {
    rowidRemision: number;
    rowidProducto: number;
    productoNombre: string;
    productoCodigo: string;
    cantidad: number;
    disponible?: number;
}

export interface SendingDetailResponse {
    rowid: number;
    companiaOrigen: number;
    companiaDestino: number;
    estado: string;
    observacion: string;
    fechaCreacion: Date | string;
    fechaAprobacion?: Date | string;
    detalle: SendingDetalleItem[];
}

// Para mostrar detalle (del GET)
export interface SendingDetalleItem {
    rowid: number;
    rowidRemision: number;
    rowidProducto: number;
    cantidad: number;
    codigo: string;
    nombreProducto: string;
    precio: number;
    codigoBarras: string;
    extension1: string;
    extension2: string;
}

// Para crear remisión (del CREATE)
export interface SendingDetailItem {
    rowidProducto: number;
    cantidad: number;
    productName?: string;
    productCode?: string;
    disponible?: number;
}

export interface SendingCreateRequest {
    companiaOrigen: number;
    companiaDestino: number;
    usuario: number;
    observacion: string;
    detalle: SendingDetailItem[];
}

export interface SendingActionRequest {
    rowid: number;
    usuario: number;
}

export interface CompanyWithStock {
    id: number;
    razonSocial: string;
    nit: string;
    stockTotal?: number;
}

export interface SendingCompany {
    id: number;
    nit: string;
    razonSocial: string;
}

export interface SendingProduct {
    id: number;
    code: number;
    reference: string;
    name: string;
    extension1?: string;
    extension2?: string;
    barcode?: string;
    stock: number;
}