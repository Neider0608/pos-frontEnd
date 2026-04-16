import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../core/guards/auth.service';
import { AuthSession } from '../api/login';
import { MasterService } from '../../services/master.service';
import { ReportsService } from '../../services/reports.service';
import { CashFlowPoint, ExportFormat, ExportSection, FinancialSummary, FinancingReportRow, PurchaseReportRow, ReportFilters, SalesReportRow } from '../api/reports';
import { User } from '../api/permissions';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, ButtonModule, DropdownModule, TableModule, TagModule, CalendarModule, ToastModule],
    templateUrl: './reports.component.html',
    styleUrl: './reports.component.scss',
    providers: [MessageService]
})
export class ReportsComponent implements OnInit {
    companiaId = 0;

    loading = false;
    exporting = false;

    startDate: Date = new Date();
    endDate: Date = new Date();
    selectedUserId: number | null = null;
    selectedEstadoId: number | null = null;

    users: User[] = [];
    userOptions: { label: string; value: number | null }[] = [{ label: 'Todos los vendedores', value: null }];

    estadoOptions = [
        { label: 'Todos los estados', value: null },
        { label: 'Activas', value: 1 },
        { label: 'Anuladas', value: 2 }
    ];

    exportSectionOptions: { label: string; value: ExportSection }[] = [
        { label: 'Reporte completo', value: 'full' },
        { label: 'Resumen financiero', value: 'summary' },
        { label: 'Flujo de caja', value: 'cashflow' },
        { label: 'Ventas', value: 'sales' },
        { label: 'Compras', value: 'purchases' },
        { label: 'Cartera / Financiación', value: 'financing' }
    ];

    exportFormatOptions: { label: string; value: ExportFormat }[] = [
        { label: 'Excel (.xlsx)', value: 'xlsx' },
        { label: 'PDF (.pdf)', value: 'pdf' },
        { label: 'CSV (.csv)', value: 'csv' }
    ];

    selectedExportSection: ExportSection = 'full';
    selectedExportFormat: ExportFormat = 'xlsx';

    summary: FinancialSummary = {
        ventasBrutas: 0,
        descuentos: 0,
        ivaVentas: 0,
        ventasNetas: 0,
        comprasTotales: 0,
        ivaCompras: 0,
        utilidadBruta: 0,
        carteraTotal: 0,
        carteraVencida: 0,
        recaudoCartera: 0
    };

    cashFlow: CashFlowPoint[] = [];
    salesRows: SalesReportRow[] = [];
    purchaseRows: PurchaseReportRow[] = [];
    financingRows: FinancingReportRow[] = [];

    constructor(
        private authService: AuthService,
        private masterService: MasterService,
        private reportsService: ReportsService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        const session = this.authService.getSession() as AuthSession;
        if (!session) {
            this.messageService.add({ severity: 'warn', summary: 'Sesión', detail: 'No hay sesión activa para consultar reportes.' });
            return;
        }

        this.companiaId = session.companiaId;

        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 2);
        this.startDate = threeDaysAgo;
        this.endDate = today;

        this.loadUsers();
        this.loadReports();
    }

    applyQuickRange(days: number): void {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        this.startDate = start;
        this.endDate = end;
    }

    onSearch(): void {
        if (!this.validateFilters()) return;
        this.loadReports();
    }

    onExport(): void {
        if (!this.validateFilters()) return;
        this.exporting = true;

        this.reportsService.exportReport(this.buildFilters(), this.selectedExportSection, this.selectedExportFormat).subscribe({
            next: (blob) => {
                this.exporting = false;
                const extension = this.selectedExportFormat;
                const section = this.selectedExportSection;
                const dateStamp = new Date().toISOString().slice(0, 10);
                const filename = `reporte-${section}-${dateStamp}.${extension}`;
                this.downloadBlob(blob, filename);
                this.messageService.add({ severity: 'success', summary: 'Exportación', detail: `Archivo ${filename} generado.` });
            },
            error: () => {
                this.exporting = false;
                this.messageService.add({ severity: 'error', summary: 'Exportación', detail: 'No se pudo exportar el reporte.' });
            }
        });
    }

    get margenBrutoPorcentaje(): number {
        if (!this.summary.ventasNetas) return 0;
        return (this.summary.utilidadBruta / this.summary.ventasNetas) * 100;
    }

    get flujoNetoTotal(): number {
        return this.cashFlow.reduce((acc, row) => acc + (row.neto || 0), 0);
    }

    get carteraVencidaRatio(): number {
        if (!this.summary.carteraTotal) return 0;
        return (this.summary.carteraVencida / this.summary.carteraTotal) * 100;
    }

    get cashFlowPositiveDays(): number {
        return this.cashFlow.filter((r) => (r.neto || 0) >= 0).length;
    }

    get cashFlowNegativeDays(): number {
        return this.cashFlow.filter((r) => (r.neto || 0) < 0).length;
    }

    get ventasVsComprasRatio(): number {
        if (!this.summary.comprasTotales) return this.summary.ventasNetas > 0 ? 999 : 0;
        return this.summary.ventasNetas / this.summary.comprasTotales;
    }

    get decisionSignal(): { label: string; severity: 'success' | 'warn' | 'danger' } {
        const margin = this.margenBrutoPorcentaje;
        const cartera = this.carteraVencidaRatio;
        const netFlow = this.flujoNetoTotal;

        if (margin >= 20 && cartera <= 25 && netFlow >= 0) {
            return { label: 'Operacion saludable', severity: 'success' };
        }

        if (margin < 10 || cartera > 45 || netFlow < 0) {
            return { label: 'Atencion inmediata', severity: 'danger' };
        }

        return { label: 'Monitoreo recomendado', severity: 'warn' };
    }

    private loadUsers(): void {
        this.masterService.getUsers(this.companiaId).subscribe({
            next: (res) => {
                const users = res.data || [];
                this.users = users;
                this.userOptions = [
                    { label: 'Todos los vendedores', value: null },
                    ...users.map((u) => ({
                        label: u.fullName || [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || `Usuario ${u.id}`,
                        value: u.id
                    }))
                ];
            },
            error: () => {
                this.messageService.add({ severity: 'warn', summary: 'Usuarios', detail: 'No se pudieron cargar los vendedores para filtrar.' });
            }
        });
    }

    private loadReports(): void {
        this.loading = true;
        const filters = this.buildFilters();

        forkJoin({
            summary: this.reportsService.getFinancialSummary(filters).pipe(catchError(() => of({ code: -1, message: 'error', data: null as any }))),
            cashFlow: this.reportsService.getCashFlow(filters).pipe(catchError(() => of({ code: -1, message: 'error', data: [] }))),
            sales: this.reportsService.getSalesReport(filters, 1, 5000).pipe(catchError(() => of({ code: -1, message: 'error', data: { rows: [], totalRows: 0 } }))),
            purchases: this.reportsService.getPurchasesReport(filters, 1, 5000).pipe(catchError(() => of({ code: -1, message: 'error', data: { rows: [], totalRows: 0 } }))),
            financing: this.reportsService.getFinancingReport(filters).pipe(catchError(() => of({ code: -1, message: 'error', data: [] })))
        }).subscribe({
            next: ({ summary, cashFlow, sales, purchases, financing }) => {
                this.loading = false;

                this.summary = this.normalizeSummary(summary.data);
                this.cashFlow = (cashFlow.data || []).map((r: any) => this.normalizeCashFlowRow(r));

                const salesData = sales.data as any;
                const salesRows = salesData?.rows ?? salesData?.Rows ?? (Array.isArray(salesData) ? (salesData as any[]) : []);
                this.salesRows = salesRows.map((r: any) => this.normalizeSalesRow(r));

                const purchaseData = purchases.data as any;
                const purchaseRows = purchaseData?.rows ?? purchaseData?.Rows ?? (Array.isArray(purchaseData) ? (purchaseData as any[]) : []);
                this.purchaseRows = purchaseRows.map((r: any) => this.normalizePurchaseRow(r));

                this.financingRows = (financing.data || []).map((r: any) => this.normalizeFinancingRow(r));

                if (summary.code !== 0 && cashFlow.code !== 0 && sales.code !== 0 && purchases.code !== 0 && financing.code !== 0) {
                    this.messageService.add({ severity: 'error', summary: 'Reportes', detail: 'No se pudieron cargar los reportes financieros.' });
                }
            },
            error: () => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Reportes', detail: 'Error al consultar reportes.' });
            }
        });
    }

    private validateFilters(): boolean {
        if (!this.startDate || !this.endDate) {
            this.messageService.add({ severity: 'warn', summary: 'Filtros', detail: 'Seleccione fecha inicial y fecha final.' });
            return false;
        }

        if (this.startDate > this.endDate) {
            this.messageService.add({ severity: 'warn', summary: 'Filtros', detail: 'La fecha inicial no puede ser mayor a la fecha final.' });
            return false;
        }

        return true;
    }

    private buildFilters(): ReportFilters {
        return {
            companiaId: this.companiaId,
            startDate: this.startDate,
            endDate: this.endDate,
            userId: this.selectedUserId,
            estadoId: this.selectedEstadoId
        };
    }

    private downloadBlob(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    private normalizeSummary(raw: any): FinancialSummary {
        return {
            ventasBrutas: this.readNumber(raw, ['ventasBrutas', 'ventas_brutas']),
            descuentos: this.readNumber(raw, ['descuentos', 'totalDescuentos', 'descuentos_totales']),
            ivaVentas: this.readNumber(raw, ['ivaVentas', 'iva_ventas']),
            ventasNetas: this.readNumber(raw, ['ventasNetas', 'ventas_netas']),
            comprasTotales: this.readNumber(raw, ['comprasTotales', 'compras_totales']),
            ivaCompras: this.readNumber(raw, ['ivaCompras', 'iva_compras']),
            utilidadBruta: this.readNumber(raw, ['utilidadBruta', 'utilidad_bruta']),
            carteraTotal: this.readNumber(raw, ['carteraTotal', 'cartera_total']),
            carteraVencida: this.readNumber(raw, ['carteraVencida', 'cartera_vencida']),
            recaudoCartera: this.readNumber(raw, ['recaudoCartera', 'recaudo_cartera'])
        };
    }

    private normalizeCashFlowRow(raw: any): CashFlowPoint {
        return {
            periodo: String(this.readValue(raw, ['periodo', 'fecha', 'day']) || ''),
            ingresos: this.readNumber(raw, ['ingresos', 'totalIngresos']),
            egresos: this.readNumber(raw, ['egresos', 'totalEgresos']),
            neto: this.readNumber(raw, ['neto', 'flujoNeto'])
        };
    }

    private normalizeSalesRow(raw: any): SalesReportRow {
        return {
            facturaId: this.readNumber(raw, ['facturaId', 'FacturaId', 'id', 'rowid']),
            numeroFactura: String(this.readValue(raw, ['numeroFactura', 'NumeroFactura', 'numero_factura']) || ''),
            fechaFactura: this.readValue(raw, ['fechaFactura', 'FechaFactura', 'fecha_factura']) || '',
            cliente: String(this.readValue(raw, ['cliente', 'Cliente', 'nombre_cliente']) || ''),
            nitCliente: String(this.readValue(raw, ['nitCliente', 'NitCliente', 'nit_cliente']) || ''),
            vendedorId: this.readNumber(raw, ['vendedorId', 'VendedorId', 'rowid_usuario']),
            vendedorNombre: String(this.readValue(raw, ['vendedorNombre', 'VendedorNombre', 'nombre_vendedor']) || ''),
            subtotal: this.readNumber(raw, ['subtotal', 'Subtotal']),
            subtotalBruto: this.readNumber(raw, ['subtotalBruto', 'SubtotalBruto', 'subtotal_bruto']),
            descuentoGeneral: this.readNumber(raw, ['descuentoGeneral', 'DescuentoGeneral', 'descuento_general']),
            totalIva: this.readNumber(raw, ['totalIva', 'TotalIva', 'total_iva']),
            totalFactura: this.readNumber(raw, ['totalFactura', 'TotalFactura', 'total_factura', 'total']),
            estadoId: this.readNumber(raw, ['estadoId', 'EstadoId', 'rowid_estado']),
            estadoNombre: String(this.readValue(raw, ['estadoNombre', 'EstadoNombre', 'estado']) || '')
        };
    }

    private normalizePurchaseRow(raw: any): PurchaseReportRow {
        return {
            doctoCompraId: this.readNumber(raw, ['doctoCompraId', 'DoctoCompraId', 'rowid_docto_compra', 'rowid']),
            consecutivo: this.readNumber(raw, ['consecutivo', 'Consecutivo']),
            facturaProveedor: String(this.readValue(raw, ['facturaProveedor', 'FacturaProveedor', 'factura_proveedor']) || ''),
            fechaFactura: this.readValue(raw, ['fechaFactura', 'FechaFactura', 'fecha_factura']) || '',
            proveedorId: this.readNumber(raw, ['proveedorId', 'ProveedorId', 'rowid_proveedor']),
            proveedorNombre: String(this.readValue(raw, ['proveedorNombre', 'ProveedorNombre', 'nombre_proveedor']) || ''),
            usuarioId: this.readNumber(raw, ['usuarioId', 'UsuarioId', 'rowid_usuario']),
            usuarioNombre: String(this.readValue(raw, ['usuarioNombre', 'UsuarioNombre', 'nombre_usuario']) || ''),
            subTotal: this.readNumber(raw, ['subTotal', 'SubTotal', 'subtotal']),
            total: this.readNumber(raw, ['total', 'Total']),
            estadoId: this.readNumber(raw, ['estadoId', 'EstadoId', 'rowid_estado']),
            estadoNombre: String(this.readValue(raw, ['estadoNombre', 'EstadoNombre', 'estado']) || '')
        };
    }

    private normalizeFinancingRow(raw: any): FinancingReportRow {
        return {
            financiacionId: this.readNumber(raw, ['financiacionId', 'rowid', 'id']),
            facturaId: this.readNumber(raw, ['facturaId', 'rowid_factura']),
            clienteId: this.readNumber(raw, ['clienteId', 'rowid_cliente']),
            clienteNombre: String(this.readValue(raw, ['clienteNombre', 'nombre_cliente']) || ''),
            totalFinanciado: this.readNumber(raw, ['totalFinanciado', 'total_financiado']),
            saldoActual: this.readNumber(raw, ['saldoActual', 'saldo_actual']),
            tasaInteres: this.readNumber(raw, ['tasaInteres', 'tasa_interes']),
            cuotasTotales: this.readNumber(raw, ['cuotasTotales', 'cuotas_totales']),
            fechaInicio: this.readValue(raw, ['fechaInicio', 'fecha_inicio']) || '',
            fechaVencimiento: this.readValue(raw, ['fechaVencimiento', 'fecha_vencimiento']) || '',
            estado: String(this.readValue(raw, ['estado']) || ''),
            pagadoAcumulado: this.readNumber(raw, ['pagadoAcumulado', 'pagado_acumulado'])
        };
    }

    private readNumber(raw: any, keys: string[]): number {
        const value = this.readValue(raw, keys);
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
    }

    private readValue(raw: any, keys: string[]): any {
        if (!raw) return null;
        for (const key of keys) {
            if (raw[key] !== undefined && raw[key] !== null) {
                return raw[key];
            }
        }
        return null;
    }
}
