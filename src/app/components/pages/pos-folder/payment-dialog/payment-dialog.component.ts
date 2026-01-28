import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
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

// --- Componente hijo ---
import { CustomerSelectorComponent } from '../customer-selector/customer-selector.component';
import { CartItem, DeliveryInfo, PaymentMethod, ViewMode } from '../../api/pos';
import { LOCALE_ID, Inject } from '@angular/core';
import { Customer } from '../../api/shared';

@Component({
    selector: 'app-payment-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputNumberModule, InputTextModule, TextareaModule, DropdownModule, DividerModule, BadgeModule, CheckboxModule, CustomerSelectorComponent, CurrencyPipe],
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

    // --- ViewChild ---
    @ViewChild('firstPaymentInput') firstPaymentInputRef!: ElementRef<HTMLInputElement>;

    // --- Estado interno ---
    deliveryInfo: any = { isDelivery: false };
    currencyCode: string = 'COP';

    constructor(@Inject(LOCALE_ID) public locale: string) {}

    // --- Getters computados ---
    get totalPayments(): number {
        return this.paymentMethods.reduce((sum, pm) => sum + (pm.amount || 0), 0);
    }

    get difference(): number {
        return this.totalPayments - this.total;
    }

    get isTouchMode(): boolean {
        return this.viewMode === 'touch';
    }

    // --- Opciones ---
    paymentTypeOptions = [
        { label: '💵 Efectivo', value: 'cash' },
        { label: '💳 Tarjeta', value: 'card' },
        { label: '🏦 Transferencia', value: 'transfer' },
        { label: '📅 Financiado', value: 'financed' },
        { label: '📝 Otro', value: 'other' }
    ];
    financingMonthsOptions = [3, 6, 9, 12, 18, 24].map((m) => ({ label: `${m} meses`, value: m }));

    // --- Lifecycle hooks ---
    ngOnChanges(): void {
        if (this.visible) {
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

    // --- Métodos ---
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
        this.selectedCustomerChange.emit(customer);
    }
}
