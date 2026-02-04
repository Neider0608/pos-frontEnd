import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PosService } from '../../services/pos.service';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

import * as pdfMakeModule from 'pdfmake/build/pdfmake';
import * as pdfFontsModule from 'pdfmake/build/vfs_fonts';
import { Permission } from '../api/permissions';
import { AuthService } from '../core/guards/auth.service';
import { LoginService } from '../../services/login.service';
const pdfMake: any = (pdfMakeModule as any).default || pdfMakeModule;
const pdfFonts: any = (pdfFontsModule as any).default || pdfFontsModule;
pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

@Component({
    selector: 'app-financing',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, DialogModule, ButtonModule, InputNumberModule, DropdownModule, ToastModule, BadgeModule, OverlayBadgeModule],
    templateUrl: './financing.component.html',
    styleUrls: ['./financing.component.scss'],
    providers: [MessageService]
})
export class FinancingComponent implements OnInit {
    financings: any[] = [];
    selectedFinancing: any | null = null;
    financingPayments: any[] = [];

    showPaymentDialog = false;
    newPayment = { amount: 0, method: '', notes: '' };
    filters = { customer: '', invoice: '' };
    showPaymentsDialog = false;
    filteredFinancings: any[] = [];
    paymentMethods = [
        { label: '💵 Efectivo', value: 'cash' },
        { label: '💳 Tarjeta', value: 'card' },
        { label: '🏦 Transferencia', value: 'transfer' },
        { label: '📅 Financiado', value: 'financed' },
        { label: '📝 Otro', value: 'other' }
    ];

    permissions: Permission[] = [];

    canView = false;
    canCreate = false;
    canEdit = false;
    canDelete = false;
    canExport = false;

    constructor(
        private posService: PosService,
        private messageService: MessageService,
        private authService: AuthService,
        private loginService: LoginService
    ) {}

    ngOnInit() {
        const session = this.authService.getSession();

        if (!session) {
            this.resetPermissions();
            return;
        }

        const { userId, companiaId } = session;

        this.loginService.getPermissions(userId, companiaId).subscribe({
            next: (permissions) => {
                this.permissions = permissions.data ?? [];
                this.applyPermissions();
            },
            error: () => this.resetPermissions()
        });
        this.loadFinancings();
    }

    private applyPermissions(): void {
        const moduleName = 'Financiaciones';

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
    // 📋 Cargar todas las financiaciones
    // ============================================================
    loadFinancings(showMessage = false, number: number = 0) {
        this.posService.getFinancings().subscribe({
            next: (res) => {
                this.financings = res.data || [];
                if (number === 1) {
                    this.selectedFinancing = this.financings.find((f) => f.id === this.selectedFinancing?.id) || null;
                    this.viewPayments(this.selectedFinancing);
                }
                this.filteredFinancings = [...this.financings];
                if (showMessage) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Datos actualizados',
                        detail: 'Se cargaron todas las financiaciones correctamente.'
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar las financiaciones.'
                });
            }
        });
    }

    // ============================================================
    // 💳 Ver pagos de una financiación
    // ============================================================
    viewPayments(financing: any) {
        this.selectedFinancing = financing;
        this.showPaymentsDialog = true;

        // Cargar pagos desde el servicio
        this.posService.getFinancingPayments(financing.id).subscribe({
            next: (res) => {
                this.financingPayments = res.data || [];
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los pagos del cliente.'
                });
            }
        });
    }

    // ============================================================
    // 💵 Abrir diálogo para registrar nuevo pago
    // ============================================================
    openPaymentDialog(financing: any) {
        this.selectedFinancing = financing;
        this.newPayment = { amount: 0, method: '', notes: '' };
        this.showPaymentDialog = true;
    }

    savePayment() {
        if (!this.newPayment.amount || this.newPayment.amount <= 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Campo requerido',
                detail: 'Debes ingresar un valor de abono válido.'
            });
            return;
        }

        // 🧮 Validar que el abono no supere el saldo pendiente
        const remainingBalance = this.selectedFinancing?.currentBalance || 0;
        if (this.newPayment.amount > remainingBalance) {
            this.messageService.add({
                severity: 'error',
                summary: 'Monto inválido',
                detail: `El valor ingresado (${this.formatCurrency(this.newPayment.amount)}) supera el saldo pendiente (${this.formatCurrency(remainingBalance)}).`
            });
            return;
        }

        const payload = {
            id: this.selectedFinancing.id,
            paymentAmount: this.newPayment.amount,
            paymentMethod: this.newPayment.method,
            notes: this.newPayment.notes,
            registeredByUser: 1
        };

        console.log('Payload de abono:', payload);

        this.posService.addFinancingPayment(payload).subscribe({
            next: (res) => {
                const data = res.data?.[0] || {};
                this.messageService.add({
                    severity: 'success',
                    summary: 'Abono registrado',
                    detail: res.message || 'Pago registrado correctamente.'
                });

                this.showPaymentDialog = false;
                this.loadFinancings(false, 1);
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo registrar el abono.'
                })
        });
    }

    // ============================================================
    // 🧾 Generar comprobante PDF del pago
    // ============================================================
    generateReceipt(payment: any) {
        const client = this.selectedFinancing?.customerName || 'Cliente';
        const invoice = this.selectedFinancing?.invoiceNumber || '-';
        const payments = this.financingPayments || [];
        const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.paymentAmount || 0), 0);
        const lastPayment = payment || payments[0];

        const docDefinition: any = {
            pageSize: 'A4',
            pageMargins: [40, 50, 40, 50],
            content: [
                // 🏢 Encabezado
                {
                    columns: [
                        [
                            { text: 'MI TIENDA POS', style: 'title' },
                            { text: 'Comprobante de Financiación', style: 'subtitle' },
                            { text: new Date().toLocaleString('es-CO'), style: 'date' }
                        ],
                        {
                            alignment: 'right',
                            stack: [
                                { text: `Recibo N° ${lastPayment.receiptNumber || '-'}`, style: 'receipt' },
                                { text: `Factura N° ${invoice}`, style: 'small' }
                            ]
                        }
                    ]
                },
                { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 515, y2: 10, lineWidth: 0.7, lineColor: '#ccc' }] },

                // 👤 Información del cliente
                {
                    margin: [0, 20, 0, 10],
                    table: {
                        widths: ['25%', '*'],
                        body: [
                            [
                                { text: 'Cliente:', style: 'label' },
                                { text: client, style: 'value' }
                            ],
                            [
                                { text: 'Factura:', style: 'label' },
                                { text: invoice, style: 'value' }
                            ],
                            [
                                { text: 'Método de Pago:', style: 'label' },
                                { text: this.getPaymentLabel(lastPayment.paymentMethod), style: 'value' }
                            ],
                            [
                                { text: 'Observaciones:', style: 'label' },
                                { text: lastPayment.notes || '-', style: 'value' }
                            ]
                        ]
                    },
                    layout: 'noBorders'
                },

                // 💵 Detalle del último pago
                {
                    margin: [0, 10, 0, 20],
                    stack: [
                        { text: 'Detalle del Último Pago', style: 'sectionTitle' },
                        {
                            columns: [
                                { text: `Monto Pagado: ${this.formatCurrency(lastPayment.paymentAmount)}`, style: 'amount' },
                                { text: `Saldo Restante: ${this.formatCurrency(lastPayment.remainingBalance)}`, style: 'amount', alignment: 'right' }
                            ]
                        }
                    ]
                },

                // 📊 Historial de Pagos
                { text: 'Historial de Pagos', style: 'sectionTitle', margin: [0, 10, 0, 6] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', 'auto', '*', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'Fecha', style: 'tableHeader' },
                                { text: 'Recibo', style: 'tableHeader' },
                                { text: 'Método', style: 'tableHeader' },
                                { text: 'Valor Pagado', style: 'tableHeader', alignment: 'right' },
                                { text: 'Saldo Restante', style: 'tableHeader', alignment: 'right' }
                            ],
                            ...payments.map((p: any) => [
                                { text: new Date(p.paymentDate).toLocaleDateString('es-CO'), style: 'tableCell' },
                                { text: p.receiptNumber || '-', style: 'tableCell' },
                                { text: this.getPaymentLabel(p.paymentMethod), style: 'tableCell' },
                                { text: this.formatCurrency(p.paymentAmount), style: ['tableCell', 'right'] },
                                { text: this.formatCurrency(p.remainingBalance), style: ['tableCell', 'right'] }
                            ])
                        ]
                    },
                    layout: {
                        fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f5f5f5' : null),
                        hLineColor: '#ddd',
                        vLineColor: '#ddd'
                    }
                },

                // 📈 Totales
                {
                    margin: [0, 15, 0, 0],
                    table: {
                        widths: ['*', 'auto'],
                        body: [
                            [
                                { text: 'Total Pagado:', style: 'totalsLabel' },
                                { text: this.formatCurrency(totalPaid), style: 'totalsValue' }
                            ],
                            [
                                { text: 'Saldo Pendiente:', style: 'totalsLabel' },
                                { text: this.formatCurrency(this.selectedFinancing?.currentBalance || 0), style: 'totalsValue' }
                            ]
                        ]
                    },
                    layout: 'noBorders'
                },

                // ✍️ Firma
                {
                    margin: [0, 40, 0, 0],
                    stack: [
                        { text: '____________________________', alignment: 'center' },
                        { text: 'Firma del Cliente', alignment: 'center', italics: true, fontSize: 9 }
                    ]
                }
            ],
            styles: {
                title: { fontSize: 16, bold: true, color: '#222' },
                subtitle: { fontSize: 11, color: '#555', margin: [0, 2, 0, 2] },
                date: { fontSize: 9, color: '#888' },
                receipt: { fontSize: 10, bold: true, color: '#333' },
                small: { fontSize: 9, color: '#777' },
                label: { bold: true, fontSize: 9, color: '#444' },
                value: { fontSize: 9, color: '#222' },
                sectionTitle: { fontSize: 11, bold: true, color: '#2c5282', margin: [0, 10, 0, 4] },
                tableHeader: { bold: true, fontSize: 9, color: '#333' },
                tableCell: { fontSize: 8.8, color: '#333' },
                right: { alignment: 'right' },
                amount: { fontSize: 10, bold: true, color: '#2d3748' },
                totalsLabel: { fontSize: 10, bold: true, color: '#444', alignment: 'right' },
                totalsValue: { fontSize: 10, bold: true, color: '#000', alignment: 'right' }
            }
        };

        pdfMake.createPdf(docDefinition).open();
    }

    // ============================================================
    // ✅ Generar Paz y Salvo
    // ============================================================
    generateClearance() {
        const client = this.selectedFinancing?.customerName || 'Cliente';
        const invoice = this.selectedFinancing?.invoiceNumber || '-';
        const total = this.formatCurrency(this.selectedFinancing?.totalFinanced || 0);
        const totalPaid = this.formatCurrency((this.financingPayments || []).reduce((sum: number, p: any) => sum + (p.paymentAmount || 0), 0));
        const date = new Date().toLocaleDateString('es-CO');

        // ✅ Documento PDF seguro sin rutas ni imágenes externas
        const docDefinition: any = {
            pageSize: 'A4',
            pageMargins: [60, 70, 60, 70],
            content: [
                // 🏢 ENCABEZADO
                {
                    stack: [
                        { text: 'MI TIENDA POS', style: 'headerTitle' },
                        { text: 'Certificado de Paz y Salvo', style: 'headerSubtitle' },
                        { text: `Fecha de emisión: ${date}`, style: 'headerDate' }
                    ],
                    alignment: 'center',
                    margin: [0, 0, 0, 10]
                },
                {
                    canvas: [{ type: 'line', x1: 0, y1: 5, x2: 475, y2: 5, lineWidth: 1, lineColor: '#2c5282' }],
                    margin: [0, 0, 0, 20]
                },

                // 👤 INFORMACIÓN DEL CLIENTE
                {
                    style: 'clientBox',
                    table: {
                        widths: ['30%', '*'],
                        body: [
                            [
                                { text: 'Cliente:', style: 'label' },
                                { text: client, style: 'value' }
                            ],
                            [
                                { text: 'Factura N°:', style: 'label' },
                                { text: invoice, style: 'value' }
                            ],
                            [
                                { text: 'Monto Financiado:', style: 'label' },
                                { text: total, style: 'value' }
                            ],
                            [
                                { text: 'Pagos Totales:', style: 'label' },
                                { text: totalPaid, style: 'value' }
                            ]
                        ]
                    },
                    layout: 'noBorders',
                    margin: [0, 0, 0, 30]
                },

                // ✅ TEXTO PRINCIPAL DEL CERTIFICADO
                {
                    text: [`Por medio del presente documento se certifica que el cliente `, { text: client, bold: true }, ` ha cancelado en su totalidad las obligaciones económicas derivadas de la factura `, { text: invoice, bold: true }, `. `],
                    style: 'paragraph'
                },
                {
                    text: 'De acuerdo con los registros del sistema, no presenta saldo pendiente ni compromisos financieros con la empresa a la fecha de emisión del presente certificado.',
                    style: 'paragraph',
                    margin: [0, 10, 0, 10]
                },
                {
                    text: 'Este certificado se expide a solicitud del interesado y para los fines que estime convenientes.',
                    style: 'paragraph',
                    margin: [0, 0, 0, 30]
                },

                // 💵 DETALLE FINAL
                {
                    table: {
                        widths: ['*', 'auto'],
                        body: [
                            [
                                { text: 'Saldo Actual', style: 'totalsLabel' },
                                { text: this.formatCurrency(0), style: 'totalsValue' }
                            ],
                            [
                                { text: 'Estado de la Financiación', style: 'totalsLabel' },
                                { text: 'Cancelada ✅', style: 'totalsValue' }
                            ]
                        ]
                    },
                    layout: 'noBorders',
                    margin: [0, 20, 0, 40]
                },

                // ✍️ FIRMA
                {
                    stack: [
                        { text: '_____________________________', alignment: 'center', margin: [0, 0, 0, 2] },
                        { text: 'Firma Autorizada', alignment: 'center', italics: true, fontSize: 10 }
                        /*  { text: '\nSello de la Empresa', alignment: 'center', color: '#2c5282', bold: true } */
                    ]
                }
            ],
            styles: {
                headerTitle: { fontSize: 18, bold: true, color: '#2c5282' },
                headerSubtitle: { fontSize: 13, color: '#444', margin: [0, 2, 0, 5] },
                headerDate: { fontSize: 9, color: '#777' },
                clientBox: { margin: [0, 10, 0, 20] },
                label: { bold: true, fontSize: 10, color: '#555' },
                value: { fontSize: 10, color: '#222' },
                paragraph: { fontSize: 11, color: '#333', lineHeight: 1.5, alignment: 'justify' },
                totalsLabel: { fontSize: 10, bold: true, color: '#555', alignment: 'right' },
                totalsValue: { fontSize: 10, bold: true, color: '#2c5282', alignment: 'right' }
            }
        };

        pdfMake.createPdf(docDefinition).open();
    }

    // ============================================================
    // 🔠 Obtener etiqueta del método de pago
    // ============================================================
    getPaymentLabel(value: string): string {
        return this.paymentMethods.find((p) => p.value === value)?.label || value;
    }

    // ============================================================
    // 🧮 Formateo de moneda
    // ============================================================
    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value);
    }

    applyFilters() {
        const c = this.filters.customer.toLowerCase().trim();
        const i = this.filters.invoice.toLowerCase().trim();

        this.filteredFinancings = this.financings.filter((f) => (!c || f.customerName.toLowerCase().includes(c)) && (!i || f.invoiceNumber.toLowerCase().includes(i)));
    }

    resetFilters() {
        this.filters = { customer: '', invoice: '' };
        this.filteredFinancings = [...this.financings];
    }
}
