import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- PrimeNG ---
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';

// --- Componente hijo ---
import { CustomerSelectorComponent } from '../customer-selector/customer-selector.component';
import { CartItem, DeliveryInfo, PaymentMethod, ViewMode } from '../../api/pos';
import { LOCALE_ID, Inject } from '@angular/core';
import { Customer } from '../../api/shared';

@Component({
    selector: 'app-payment-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputNumberModule, InputTextModule, TextareaModule, DropdownModule, DividerModule, BadgeModule, CheckboxModule, TagModule, CustomerSelectorComponent],
    templateUrl: './payment-dialog.component.html',
    styleUrl: './payment-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentDialogComponent {
    Math = Math;

    // --- Inputs ---
    @Input() visible = false;
    @Input() cartItems: CartItem[] = [];
    @Input() paymentMethods: PaymentMethod[] = [];
    @Input() selectedCustomer: Customer | null = null;
    @Input() generalDiscount = 0;
    @Input() detailDiscount = 0;
    @Input() grossSubtotal = 0;
    @Input() totalVat = 0;
    @Input() subtotal = 0;
    @Input() total = 0;
    @Input() customers: Customer[] = [];
    @Input() viewMode: ViewMode = 'desktop';

    // --- Outputs ---
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() cartItemsChange = new EventEmitter<CartItem[]>();
    @Output() paymentMethodsChange = new EventEmitter<PaymentMethod[]>();
    @Output() selectedCustomerChange = new EventEmitter<Customer | null>();
    @Output() generalDiscountChange = new EventEmitter<number>();
    @Output() checkout = new EventEmitter<void>();
    @Output() deliveryInfoChange = new EventEmitter<DeliveryInfo>();
    @Output() customerCreated = new EventEmitter<Customer>();

    // --- ViewChild ---
    @ViewChild('firstPaymentInput') firstPaymentInputRef!: ElementRef<HTMLInputElement>;

    // --- Estado interno ---
    deliveryInfo: any = { isDelivery: false };
    currencyCode: string = 'COP';
    customerPayment = 0;

    constructor(@Inject(LOCALE_ID) public locale: string) {}

    // --- Getters computados ---
    get totalPayments(): number {
        return this.paymentMethods.reduce((sum, pm) => sum + (pm.amount || 0), 0);
    }

    get difference(): number {
        if (this.customerPayment > 0) {
            return this.customerPayment - this.total;
        }
        return this.totalPayments - this.total;
    }

    get changeToReturn(): number {
        return Math.max(0, this.difference);
    }

    get amountOwed(): number {
        return Math.max(0, -this.difference);
    }

    get isConsumidorFinal(): boolean {
        const customer = this.selectedCustomer;
        if (!customer) return true;
        return customer.document === '2222222222' || customer.nit === '2222222222' || customer.displayName === 'Consumidor Final';
    }

    get isTouchMode(): boolean {
        return this.viewMode === 'touch';
    }

    get paymentStatusClass(): string {
        if (this.difference < -0.01) {
            return 'bg-rose-500 text-white';
        } else if (this.difference > 0.01) {
            return 'bg-amber-500 text-white';
        } else {
            return 'bg-emerald-500 text-white';
        }
    }

    get totalDiscountValue(): number {
        const generalDiscountAmount = (this.grossSubtotal - this.detailDiscount) * (this.generalDiscount / 100);
        return this.detailDiscount + generalDiscountAmount;
    }

    // --- Opciones ---
    paymentTypeOptions = [
        { label: '💵 Efectivo', value: 'cash' },
        { label: '💳 Tarjeta Débito/Crédito', value: 'card' },
        { label: '🏦 Transferencia', value: 'transfer' },
        { label: '📅 Financiado', value: 'financed' },
        { label: '📝 Otro', value: 'other' }
    ];

    get availablePaymentTypeOptions() {
        return this.isConsumidorFinal ? this.paymentTypeOptions.filter((x) => x.value !== 'financed') : this.paymentTypeOptions;
    }

    financingMonthsOptions = [3, 6, 9, 12, 18, 24, 36].map((m) => ({ label: `${m} meses`, value: m }));

    // --- Lifecycle hooks ---
    ngOnChanges(): void {
        if (this.visible) {
            this.deliveryInfo = { isDelivery: false };
            this.customerPayment = 0;

            if (!this.selectedCustomer) {
                const consumidorFinal = this.customers.find((c) => c.document === '2222222222' || c.nit === '2222222222');
                if (consumidorFinal) {
                    this.selectedCustomer = consumidorFinal;
                    this.selectedCustomerChange.emit(consumidorFinal);
                } else {
                    const defaultCustomer: Customer = {
                        id: 0,
                        companiaId: 0,
                        userId: 0,
                        identificationTypeId: 1,
                        document: '2222222222',
                        firstName: 'Consumidor',
                        lastName: 'Final',
                        isCompany: false,
                        isWholesale: false,
                        displayName: 'Consumidor Final',
                        email: '',
                        phone: '',
                        address: '',
                        city: ''
                    };
                    this.selectedCustomer = defaultCustomer;
                    this.selectedCustomerChange.emit(defaultCustomer);
                }
            }

            setTimeout(() => this.firstPaymentInputRef?.nativeElement?.focus(), 100);
        }
    }

    // --- Listeners ---
    @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent): void {
        if (!this.visible) return;

        if (event.key === 'Enter' && Math.abs(this.difference) <= 0.01 && this.cartItems.length > 0) {
            event.preventDefault();
            this.checkout.emit();
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            this.visibleChange.emit(false);
        }
    }

    // --- Métodos de Pago Rápido ---
    payExact(): void {
        this.customerPayment = this.total;
        this.paymentMethods = [{ type: 'cash', amount: this.total }];
        this.paymentMethodsChange.emit(this.paymentMethods);
    }

    applyCustomerPayment(): void {
        if (this.customerPayment >= this.total) {
            this.paymentMethods = [{ type: 'cash', amount: this.customerPayment }];
            this.paymentMethodsChange.emit(this.paymentMethods);
        }
    }

    calculateChange(): void {
        if (this.customerPayment >= this.total) {
            this.paymentMethods = [{ type: 'cash', amount: this.customerPayment }];
            this.paymentMethodsChange.emit(this.paymentMethods);
        }
    }

    payWithCash(): void {
        const remaining = this.total - this.totalPayments;
        if (remaining > 0) {
            this.updatePaymentMethod(0, 'amount', (this.paymentMethods[0]?.amount || 0) + remaining);
        } else if (this.paymentMethods.length === 1 && this.paymentMethods[0].type !== 'cash') {
            this.addPaymentMethod();
            this.updatePaymentMethod(0, 'type', 'cash');
            this.updatePaymentMethod(0, 'amount', this.total);
        }
    }

    payWithCard(): void {
        const existingCard = this.paymentMethods.find((p) => p.type === 'card');
        if (existingCard) {
            this.updatePaymentMethod(this.paymentMethods.indexOf(existingCard), 'amount', this.total);
        } else {
            if (this.paymentMethods.length === 1 && this.paymentMethods[0].type === 'cash') {
                this.updatePaymentMethod(0, 'type', 'card');
                this.updatePaymentMethod(0, 'amount', this.total);
            } else {
                this.addPaymentMethod();
                this.updatePaymentMethod(this.paymentMethods.length - 1, 'type', 'card');
                this.updatePaymentMethod(this.paymentMethods.length - 1, 'amount', this.total);
            }
        }
    }

    payWithTransfer(): void {
        const existingTransfer = this.paymentMethods.find((p) => p.type === 'transfer');
        if (existingTransfer) {
            this.updatePaymentMethod(this.paymentMethods.indexOf(existingTransfer), 'amount', this.total);
        } else {
            if (this.paymentMethods.length === 1 && this.paymentMethods[0].type === 'cash') {
                this.updatePaymentMethod(0, 'type', 'transfer');
                this.updatePaymentMethod(0, 'amount', this.total);
            } else {
                this.addPaymentMethod();
                this.updatePaymentMethod(this.paymentMethods.length - 1, 'type', 'transfer');
                this.updatePaymentMethod(this.paymentMethods.length - 1, 'amount', this.total);
            }
        }
    }

    // --- Métodos principales ---
    addPaymentMethod(): void {
        this.paymentMethods = [...this.paymentMethods, { type: 'cash', amount: 0 }];
        this.paymentMethodsChange.emit(this.paymentMethods);
    }

    removePaymentMethod(index: number): void {
        if (this.paymentMethods.length > 1) {
            this.paymentMethods = this.paymentMethods.filter((_, i) => i !== index);
            this.paymentMethodsChange.emit(this.paymentMethods);
        }
    }

    updatePaymentMethod(index: number, field: keyof PaymentMethod, value: any): void {
        if (field === 'type' && value === 'financed' && this.isConsumidorFinal) {
            return;
        }
        const updated = [...this.paymentMethods];
        updated[index] = { ...updated[index], [field]: value };
        this.paymentMethods = updated;
        this.paymentMethodsChange.emit(this.paymentMethods);
    }

    fillExactAmount(): void {
        const remaining = this.total - (this.totalPayments - (this.paymentMethods[0]?.amount || 0));
        this.updatePaymentMethod(0, 'amount', remaining > 0 ? remaining : this.total);
    }

    updateItemDiscount(itemId: number, discount: number | null): void {
        const validDiscount = Math.max(0, Math.min(100, discount ?? 0));
        this.cartItems = this.cartItems.map((item) => (item.id === itemId ? { ...item, discount: validDiscount, subtotal: item.price * item.quantity * (1 - validDiscount / 100) } : item));
        this.cartItemsChange.emit(this.cartItems);
    }

    updateDeliveryInfoField(field: string, value: any): void {
        this.deliveryInfo = { ...this.deliveryInfo, [field]: value };
        this.deliveryInfoChange.emit(this.deliveryInfo);
    }

    closeDialog(): void {
        this.visibleChange.emit(false);
    }

    onCheckout(): void {
        if (Math.abs(this.difference) <= 0.01 && this.cartItems.length > 0) {
            this.checkout.emit();
            this.visibleChange.emit(false);
        }
    }

    onDiscountChange(value: number): void {
        this.generalDiscountChange.emit(value);
    }

    onCustomerSelect(customer: Customer | null): void {
        if ((customer?.document === '2222222222' || customer?.nit === '2222222222' || !customer) && this.paymentMethods.some((p) => p.type === 'financed')) {
            this.paymentMethods = this.paymentMethods.map((p) => (p.type === 'financed' ? { ...p, type: 'cash', months: undefined } : p));
            this.paymentMethodsChange.emit(this.paymentMethods);
        }
        this.selectedCustomerChange.emit(customer);
    }

    onCustomerCreated(customer: Customer): void {
        this.customers = [...this.customers, customer];
        this.selectedCustomerChange.emit(customer);
        this.customerCreated.emit(customer);
    }
}
