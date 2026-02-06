import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PosService } from '../../services/pos.service';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

import * as pdfMakeModule from 'pdfmake/build/pdfmake';
import * as pdfFontsModule from 'pdfmake/build/vfs_fonts';
import { CardModule } from 'primeng/card';
import { InvoicePdfService } from '../../services/invoice-pdf.service';
import { RouterLink, RouterModule } from '@angular/router';
import { IInvoiceClients } from '../api/pos';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AuthSession, ICompanySession } from '../api/login';
import { LoginService } from '../../services/login.service';
import { AuthService } from '../core/guards/auth.service';
import { Permission } from '../api/permissions';
const pdfMake: any = (pdfMakeModule as any).default || pdfMakeModule;
const pdfFonts: any = (pdfFontsModule as any).default || pdfFontsModule;
pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

@Component({
    selector: 'app-invoices',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ConfirmDialogModule, TableModule, DialogModule, ButtonModule, DropdownModule, CalendarModule, InputTextModule, ToastModule, BadgeModule, OverlayBadgeModule, CardModule, RouterLink],
    templateUrl: './invoices.component.html',
    styleUrls: ['./invoices.component.scss'],
    providers: [MessageService, ConfirmationService, PosService, InvoicePdfService]
})
export class InvoicesComponent implements OnInit {
    invoices: IInvoiceClients[] = [];
    filteredInvoices: IInvoiceClients[] = [];
    selectedInvoice: IInvoiceClients | null = null;
    session: AuthSession = {} as AuthSession;
    companies: ICompanySession[] = [];
    selectedCompany: ICompanySession = {} as ICompanySession;
    showInvoiceDialog = false;

    filterClient = '';
    filterDate: Date | null = null;
    filterStatus = null;

    statusOptions = [
        { label: 'APROBADA', value: 'APROBADA' },
        { label: 'RECHAZADA', value: 'RECHAZADA' },
        { label: 'ANULADA', value: 'ANULADA' }
    ];
    startDate: Date = new Date(new Date().setHours(0, 0, 0, 0));

    endDate: Date = new Date(new Date().setHours(0, 0, 0, 0));

    permissions: Permission[] = [];

    canView = false;
    canCreate = false;
    canEdit = false;
    canDelete = false;
    canExport = false;

    constructor(
        private posService: PosService,
        private messageService: MessageService,
        private invoicePdfService: InvoicePdfService,
        private confirmationService: ConfirmationService,
        private loginService: LoginService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.session = this.authService.getSession() as AuthSession;

        if (!this.session) {
            this.resetPermissions();
            return;
        }

        const { userId, companiaId } = this.session;

        this.loginService.getPermissions(userId, companiaId).subscribe({
            next: (permissions) => {
                this.permissions = permissions.data ?? [];
                this.applyPermissions();
            },
            error: () => this.resetPermissions()
        });

        this.loadCompanies(this.session.userId, this.session.companiaId);
    }

    private applyPermissions(): void {
        const moduleName = 'Facturas';

        const permission = this.permissions.find((p) => p.module === moduleName);

        if (!permission) {
            this.resetPermissions();
            return;
        }

        this.canView = permission.canView;
        this.canCreate = permission.canCreate;
        this.canEdit = permission.canEdit;
        this.canDelete = permission.canDelete;
        this.canExport = permission.canExport;
    }

    private resetPermissions(): void {
        this.canView = false;
        this.canCreate = false;
        this.canEdit = false;
        this.canDelete = false;
        this.canExport = false;
    }

    // ============================================================
    // 📋 Cargar todas las facturas
    // ============================================================
    loadInvoices() {
        let companyId = 1; // Reemplaza con el ID de la compañía actual según tu lógica
        this.invoices = [];
        this.posService.getInvoices(this.startDate, this.endDate, companyId).subscribe({
            next: (res) => {
                this.invoices = res.data || [];
                console.log('Facturas cargadas:', this.invoices);
                this.filteredInvoices = [...this.invoices];
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar las facturas.'
                })
        });
    }

    cancelInvoice() {
        let companyId = 1;
        this.confirmationService.confirm({
            message: `¿Está seguro de anular la factura ${this.selectedInvoice?.invoice_Number}?`,
            header: 'Confirmación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // Llamamos al servicio para anular la factura
                this.posService.cancelInvoice(this.selectedInvoice?.id, companyId).subscribe({
                    next: (res) => {
                        this.loadInvoices;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: `Factura ${this.selectedInvoice?.invoice_Number} anulada correctamente`
                        });
                        this.loadInvoices(); // recargar la lista
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: `No se pudo anular la factura ${this.selectedInvoice?.invoice_Number}`
                        });
                    }
                });
            },
            reject: () => {
                // Si cancela, no hace nada
                this.messageService.add({
                    severity: 'info',
                    summary: 'Cancelado',
                    detail: 'Acción de anular cancelada'
                });
            }
        });
    }

    loadCompanies(userId: number, companiaId?: number) {
        this.loginService.getPermissionsCompanies(userId).subscribe({
            next: (res) => {
                if (res.code === 200) {
                    this.selectedCompany = res.data?.find((c) => c.companiaId === companiaId) || (res.data ? res.data[0] : ({} as ICompanySession));
                    this.companies = res.data || [];
                }
            }
        });
    }

    // ============================================================
    // 🔍 Filtrar facturas
    // ============================================================
    applyLocalFilters() {
        this.filteredInvoices = this.invoices.filter((inv) => {
            const matchText = !this.filterClient || inv.client_Name?.toLowerCase().includes(this.filterClient.toLowerCase()) || inv.invoice_Number?.toString().includes(this.filterClient);

            const matchStatus = !this.filterStatus || inv.invoice_Status === this.filterStatus;

            return matchText && matchStatus;
        });
    }

    getStats() {
        const stats = {
            totalAprobada: 0,
            countAprobada: 0,
            totalAnulada: 0,
            countAnulada: 0,
            totalRechazada: 0,
            countRechazada: 0
        };

        // Usamos filteredInvoices para que los totales cambien al filtrar en la tabla
        this.filteredInvoices.forEach((inv) => {
            const total = inv.invoice_Total || 0;
            const status = inv.invoice_Status?.toUpperCase();

            if (status === 'APROBADA') {
                stats.totalAprobada += total;
                stats.countAprobada++;
            } else if (status === 'ANULADA') {
                stats.totalAnulada += total;
                stats.countAnulada++;
            } else if (status === 'RECHAZADA') {
                stats.totalRechazada += total;
                stats.countRechazada++;
            }
        });

        return stats;
    }

    clearLocalFilters() {
        this.filterClient = '';
        /* this.filterStatus = ''; */
        this.applyLocalFilters();
    }

    clearFilters() {
        this.filterClient = '';
        this.filterDate = null;
        this.filterStatus = null;
        this.filteredInvoices = [...this.invoices];
    }

    // ============================================================
    // 👁️ Ver detalle de factura
    // ============================================================
    viewInvoice(invoice: IInvoiceClients) {
        this.selectedInvoice = {} as IInvoiceClients;
        let companyId = 1; // Reemplaza con el ID de la compañía actual según tu lógica
        this.posService.getInvoiceDetail(invoice.id, companyId).subscribe({
            next: (res) => {
                this.selectedInvoice = res.data;
                this.showInvoiceDialog = true;
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar las facturas.'
                })
        });
    }

    // ============================================================
    // 🧾 Generar PDF de factura
    // ============================================================
    // --- Métodos ---
    handlePrint(): void {
        let detailDiscount = this.selectedInvoice?.items?.reduce((sum, item) => sum + (item.discount_Value || 0), 0) || 0;

        this.invoicePdfService.generatePOS({
            invoiceNumber: this.selectedInvoice?.invoice_Number || '',
            date: this.selectedInvoice?.created_At || new Date(),
            customer: this.selectedInvoice?.customer || null,
            items: this.selectedInvoice?.items || [],
            subtotal: this.selectedInvoice?.subtotal || 0,
            detailDiscount: this.selectedInvoice?.items?.reduce((acc, item) => acc + (item.discount_Value ?? 0), 0) ?? 0,
            generalDiscount: this.selectedInvoice?.descuento_General || 0,
            grossSubtotal: this.selectedInvoice?.subtotal_Bruto || 0,
            discount: detailDiscount + (((this.selectedInvoice?.subtotal || 0) - detailDiscount) * (this.selectedInvoice?.descuento_General || 0)) / 100,
            total: this.selectedInvoice?.invoice_Total || 0,
            deliveryInfo: this.selectedInvoice?.delivery,
            paymentMethods: this.selectedInvoice?.payments || [],
            session: this.selectedCompany
        });
    }

    handleDownload() {
        let detailDiscount = this.selectedInvoice?.items?.reduce((sum, item) => sum + (item.discount_Value || 0), 0) || 0;
        this.invoicePdfService.generate({
            invoiceNumber: this.selectedInvoice?.invoice_Number || '',
            date: this.selectedInvoice?.created_At || new Date(),
            customer: this.selectedInvoice?.customer || null,
            items: this.selectedInvoice?.items || [],
            subtotal: this.selectedInvoice?.subtotal || 0,
            detailDiscount: this.selectedInvoice?.items?.reduce((acc, item) => acc + (item.discount_Value ?? 0), 0) ?? 0,
            generalDiscount: this.selectedInvoice?.descuento_General || 0,
            grossSubtotal: this.selectedInvoice?.subtotal_Bruto || 0,
            discount: detailDiscount + (((this.selectedInvoice?.subtotal || 0) - detailDiscount) * (this.selectedInvoice?.descuento_General || 0)) / 100,
            total: this.selectedInvoice?.invoice_Total || 0,
            deliveryInfo: this.selectedInvoice?.delivery,
            paymentMethods: this.selectedInvoice?.payments || [],
            session: this.selectedCompany
        });
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value);
    }

    getDiscounts() {
        const general = this.selectedInvoice?.descuento_General ?? 0;

        const itemsDiscount = this.selectedInvoice?.items?.reduce((acc, item) => acc + (item.discount_Value ?? 0), 0) ?? 0;

        return general + itemsDiscount;
    }
}
