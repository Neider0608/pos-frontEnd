import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { CalendarModule } from 'primeng/calendar';
import { AuthService } from '../core/guards/auth.service';
import { AuthSession } from '../api/login';
import { ReportsService } from '../../services/reports.service';
import { MasterService } from '../../services/master.service';
import { User } from '../api/permissions';
import { CashDashboardSummary, CashMovementRow, PaymentMixItem, ReportFilters } from '../api/reports';

@Component({
    selector: 'app-cash',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, ButtonModule, DropdownModule, TableModule, TagModule, ToastModule, CalendarModule],
    templateUrl: './cash.component.html',
    styleUrl: './cash.component.scss',
    providers: [MessageService]
})
export class CashComponent implements OnInit {
    companiaId = 0;

    loading = false;
    exporting = false;

    startDate: Date = new Date();
    endDate: Date = new Date();
    selectedUserId: number | null = null;

    users: User[] = [];
    userOptions: { label: string; value: number | null }[] = [{ label: 'Todos los vendedores', value: null }];

    summary: CashDashboardSummary = {
        ingresos: 0,
        egresos: 0,
        neto: 0,
        efectivo: 0,
        tarjetas: 0,
        transferencias: 0,
        financiado: 0,
        transacciones: 0,
        ticketPromedio: 0
    };

    paymentMix: PaymentMixItem[] = [];
    transactions: CashMovementRow[] = [];

    constructor(
        private authService: AuthService,
        private reportsService: ReportsService,
        private masterService: MasterService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        const session = this.authService.getSession() as AuthSession;
        if (!session) {
            this.messageService.add({ severity: 'warn', summary: 'Sesión', detail: 'No hay sesión activa para consultar caja.' });
            return;
        }

        this.companiaId = session.companiaId;

        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 2);
        this.startDate = threeDaysAgo;
        this.endDate = today;

        this.loadUsers();
        this.loadDashboard();
    }

    onSearch(): void {
        if (!this.validateFilters()) return;
        this.loadDashboard();
    }

    applyQuickRange(days: number): void {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        this.startDate = start;
        this.endDate = end;
    }

    exportCashReport(format: 'xlsx' | 'pdf' | 'csv'): void {
        if (!this.validateFilters()) return;

        this.exporting = true;
        this.reportsService.exportReport(this.buildFilters(), 'cashflow', format).subscribe({
            next: (blob) => {
                this.exporting = false;
                const filename = `caja-contabilidad-${new Date().toISOString().slice(0, 10)}.${format}`;
                this.downloadBlob(blob, filename);
                this.messageService.add({ severity: 'success', summary: 'Exportación', detail: `Se generó ${filename}` });
            },
            error: () => {
                this.exporting = false;
                this.messageService.add({ severity: 'error', summary: 'Exportación', detail: 'No se pudo exportar el reporte de caja.' });
            }
        });
    }

    get mixTotal(): number {
        return this.paymentMix.reduce((acc, item) => acc + (item.valor || 0), 0);
    }

    getTransactionSeverity(type: 'income' | 'expense'): 'success' | 'danger' {
        return type === 'income' ? 'success' : 'danger';
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

    private loadDashboard(): void {
        this.loading = true;
        const filters = this.buildFilters();

        forkJoin({
            summary: this.reportsService.getCashDashboardSummary(filters).pipe(catchError(() => of({ code: -1, message: 'error', data: null as any }))),
            mix: this.reportsService.getPaymentMix(filters).pipe(catchError(() => of({ code: -1, message: 'error', data: [] }))),
            movements: this.reportsService.getRecentCashMovements(filters).pipe(catchError(() => of({ code: -1, message: 'error', data: [] })))
        }).subscribe({
            next: ({ summary, mix, movements }) => {
                this.loading = false;
                this.summary = this.normalizeSummary(summary.data);
                this.paymentMix = (mix.data || []).map((x: any) => this.normalizeMix(x));
                this.transactions = (movements.data || []).map((x: any) => this.normalizeMovement(x));

                if (summary.code !== 0 && mix.code !== 0 && movements.code !== 0) {
                    this.messageService.add({ severity: 'error', summary: 'Caja', detail: 'No se pudo cargar el dashboard de caja.' });
                }
            },
            error: () => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'Caja', detail: 'Error consultando datos de caja.' });
            }
        });
    }

    private validateFilters(): boolean {
        if (!this.startDate || !this.endDate) {
            this.messageService.add({ severity: 'warn', summary: 'Filtros', detail: 'Seleccione fecha inicial y fecha final.' });
            return false;
        }

        if (this.startDate > this.endDate) {
            this.messageService.add({ severity: 'warn', summary: 'Filtros', detail: 'La fecha inicial no puede ser mayor a la final.' });
            return false;
        }

        return true;
    }

    private buildFilters(): ReportFilters {
        return {
            companiaId: this.companiaId,
            startDate: this.startDate,
            endDate: this.endDate,
            userId: this.selectedUserId
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

    private normalizeSummary(raw: any): CashDashboardSummary {
        return {
            ingresos: this.readNumber(raw, ['ingresos', 'totalIngresos']),
            egresos: this.readNumber(raw, ['egresos', 'totalEgresos']),
            neto: this.readNumber(raw, ['neto', 'flujoNeto']),
            efectivo: this.readNumber(raw, ['efectivo', 'cash']),
            tarjetas: this.readNumber(raw, ['tarjetas', 'card']),
            transferencias: this.readNumber(raw, ['transferencias', 'transfer']),
            financiado: this.readNumber(raw, ['financiado', 'financed']),
            transacciones: this.readNumber(raw, ['transacciones', 'transactions']),
            ticketPromedio: this.readNumber(raw, ['ticketPromedio', 'avgTicket'])
        };
    }

    private normalizeMix(raw: any): PaymentMixItem {
        return {
            metodo: String(this.readValue(raw, ['metodo', 'paymentMethod']) || 'N/A'),
            valor: this.readNumber(raw, ['valor', 'amount']),
            porcentaje: this.readNumber(raw, ['porcentaje', 'percentage'])
        };
    }

    private normalizeMovement(raw: any): CashMovementRow {
        const typeText = String(this.readValue(raw, ['tipo', 'type']) || '').toLowerCase();
        const type: 'income' | 'expense' = typeText === 'income' || typeText === 'ingreso' ? 'income' : 'expense';

        return {
            id: this.readValue(raw, ['id', 'rowid']) || '',
            fecha: this.readValue(raw, ['fecha', 'date', 'fecha_creacion']) || '',
            descripcion: String(this.readValue(raw, ['descripcion', 'description']) || ''),
            categoria: String(this.readValue(raw, ['categoria', 'category']) || ''),
            metodoPago: String(this.readValue(raw, ['metodoPago', 'paymentMethod']) || ''),
            tipo: type,
            monto: this.readNumber(raw, ['monto', 'amount', 'total']),
            referencia: String(this.readValue(raw, ['referencia', 'reference']) || ''),
            usuarioId: this.readNumber(raw, ['usuarioId', 'rowid_usuario']),
            usuarioNombre: String(this.readValue(raw, ['usuarioNombre', 'nombre_usuario']) || '')
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
