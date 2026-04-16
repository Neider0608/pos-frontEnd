export interface ReportFilters {
    companiaId: number;
    startDate: Date;
    endDate: Date;
    userId?: number | null;
    estadoId?: number | null;
}

export interface FinancialSummary {
    ventasBrutas: number;
    descuentos: number;
    ivaVentas: number;
    ventasNetas: number;
    comprasTotales: number;
    ivaCompras: number;
    utilidadBruta: number;
    carteraTotal: number;
    carteraVencida: number;
    recaudoCartera: number;
}

export interface CashFlowPoint {
    periodo: string;
    ingresos: number;
    egresos: number;
    neto: number;
}

export interface SalesReportRow {
    facturaId: number;
    numeroFactura: string;
    fechaFactura: string | Date;
    cliente: string;
    nitCliente: string;
    vendedorId: number;
    vendedorNombre?: string;
    subtotal: number;
    subtotalBruto: number;
    descuentoGeneral: number;
    totalIva: number;
    totalFactura: number;
    estadoId: number;
    estadoNombre?: string;
}

export interface PurchaseReportRow {
    doctoCompraId: number;
    consecutivo: number;
    facturaProveedor: string;
    fechaFactura: string | Date;
    proveedorId: number;
    proveedorNombre?: string;
    usuarioId: number;
    usuarioNombre?: string;
    subTotal: number;
    total: number;
    estadoId: number;
    estadoNombre?: string;
}

export interface FinancingReportRow {
    financiacionId: number;
    facturaId: number;
    clienteId: number;
    clienteNombre?: string;
    totalFinanciado: number;
    saldoActual: number;
    tasaInteres: number;
    cuotasTotales: number;
    fechaInicio: string | Date;
    fechaVencimiento: string | Date;
    estado: string;
    pagadoAcumulado: number;
}

export interface PagedResponse<T> {
    rows: T[];
    totalRows: number;
}

export interface CashDashboardSummary {
    ingresos: number;
    egresos: number;
    neto: number;
    efectivo: number;
    tarjetas: number;
    transferencias: number;
    financiado: number;
    transacciones: number;
    ticketPromedio: number;
}

export interface PaymentMixItem {
    metodo: string;
    valor: number;
    porcentaje: number;
}

export interface CashMovementRow {
    id: number | string;
    fecha: string | Date;
    descripcion: string;
    categoria: string;
    metodoPago: string;
    tipo: 'income' | 'expense';
    monto: number;
    referencia?: string;
    usuarioId?: number;
    usuarioNombre?: string;
}

export type ExportSection = 'summary' | 'cashflow' | 'sales' | 'purchases' | 'financing' | 'full';
export type ExportFormat = 'xlsx' | 'csv' | 'pdf';
