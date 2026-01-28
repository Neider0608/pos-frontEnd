import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { CartItem, DeliveryInfo, PaymentMethod } from '../../api/pos';
import { LOCALE_ID, Inject } from '@angular/core';
import { InvoicePdfService } from '../../../services/invoice-pdf.service';
import { Customer } from '../../api/shared';
import { AuthSession, ICompanySession } from '../../api/login';
import { AuthService } from '../../core/guards/auth.service';
import { LoginService } from '../../../services/login.service';

@Component({
    selector: 'app-invoice-dialog',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule, BadgeModule, DividerModule, CurrencyPipe],
    providers: [DatePipe, InvoicePdfService],
    templateUrl: './invoice-dialog.component.html',
    styleUrls: ['./invoice-dialog.component.scss']
})
export class InvoiceDialogComponent {
    // --- Inputs ---
    @Input() visible: boolean = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    @Input() invoiceNumber!: string;
    @Input() date!: Date;
    @Input() customer: Customer | null = null;
    @Input() items: CartItem[] = [];
    @Input() subtotal: number = 0;
    @Input() generalDiscount = 0;
    @Input() detailDiscount = 0;
    @Input() grossSubtotal = 0;
    @Input() total: number = 0;
    @Input() paymentMethods: PaymentMethod[] = [];
    @Input() deliveryInfo?: DeliveryInfo;
    @Input() totalDiscount!: number;
    @Input() totalVat!: number;
    currencyCode: string = 'COP';
    session: AuthSession = {} as AuthSession;
    companies: ICompanySession[] = [];
    selectedCompany: ICompanySession = {} as ICompanySession;
    constructor(
        @Inject(LOCALE_ID) public locale: string,
        private invoicePdfService: InvoicePdfService,
        private authService: AuthService,
        private loginService: LoginService
    ) {
        this.session = this.authService.getSession() as AuthSession;
        this.loadCompanies(this.session.userId, this.session.companiaId);
    }

    // --- Getters calculados ---
    get generalDiscountAmount(): number {
        return this.subtotal * (this.generalDiscount / 100);
    }

    get totalFinanced(): number {
        return this.paymentMethods.filter((pm) => pm.type === 'financed').reduce((sum, pm) => sum + pm.amount, 0);
    }

    // --- Métodos ---
    handlePrint(): void {
        this.invoicePdfService.generatePOS({
            invoiceNumber: this.invoiceNumber,
            date: this.date,
            customer: this.customer,
            items: this.items,
            subtotal: this.subtotal,
            detailDiscount: this.detailDiscount,
            generalDiscount: this.generalDiscount,
            grossSubtotal: this.grossSubtotal,
            discount: this.detailDiscount + ((this.grossSubtotal - this.detailDiscount) * this.generalDiscount) / 100,
            total: this.total,
            deliveryInfo: this.deliveryInfo,
            paymentMethods: this.paymentMethods,
            session: this.selectedCompany
        });
    }

    handleDownload() {
        this.invoicePdfService.generate({
            invoiceNumber: this.invoiceNumber,
            date: this.date,
            customer: this.customer,
            items: this.items,
            subtotal: this.subtotal,
            detailDiscount: this.detailDiscount,
            generalDiscount: this.generalDiscount,
            grossSubtotal: this.grossSubtotal,
            discount: this.detailDiscount + ((this.grossSubtotal - this.detailDiscount) * this.generalDiscount) / 100,
            total: this.total,
            deliveryInfo: this.deliveryInfo,
            paymentMethods: this.paymentMethods,
            session: this.selectedCompany
        });
    }

    getPaymentMethodDetails(type: PaymentMethod['type']): { label: string; icon: string } {
        const map = {
            cash: { label: 'Efectivo', icon: 'pi pi-money-bill' },
            card: { label: 'Tarjeta', icon: 'pi pi-credit-card' },
            transfer: { label: 'Transferencia', icon: 'pi pi-building-columns' },
            financed: { label: 'Financiado', icon: 'pi pi-calendar' },
            other: { label: 'Otro', icon: 'pi pi-file-edit' }
        };
        return map[type] || map.other;
    }

    trackByItemId(index: number, item: CartItem): number {
        return item.id;
    }

    getFullName(customer: any): string {
        return [customer.firstName, customer.middleName, customer.lastName, customer.secondLastName].filter((v) => !!v).join(' ');
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
}
