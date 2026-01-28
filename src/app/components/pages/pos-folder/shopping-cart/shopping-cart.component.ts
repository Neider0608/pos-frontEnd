import { Component, ChangeDetectionStrategy, computed, input, model, output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- PrimeNG ---
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';

// --- Componentes hijos ---
import { CartItemComponent } from '../cart-item/cart-item.component';
import { CartItem, ViewMode } from '../../api/pos';

@Component({
    selector: 'app-shopping-cart',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, ButtonModule, DividerModule, InputNumberModule, CartItemComponent, CurrencyPipe],
    templateUrl: './shopping-cart.component.html',
    styleUrls: ['./shopping-cart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShoppingCartComponent {
    // --- ENTRADAS ---
    items = input.required<CartItem[]>();
    subtotal = input.required<number>();
    total = input.required<number>();
    viewMode = input<ViewMode>('desktop');
    totalPayments = input.required<number>();

    // --- ENTRADA/SALIDA CON TWO-WAY BINDING ---
    discount = model.required<number>(); // Se usa con [(discount)]

    // --- SALIDAS (Callbacks) ---
    updateQuantity = output<{ id: string; quantity: number }>();
    updateDiscount = output<{ id: string; discount: number }>();
    remove = output<string>();
    openPayment = output<void>();
    checkout = output<void>();
    clear = output<void>();

    // --- SEÑALES COMPUTADAS ---
    isTouchMode = computed(() => this.viewMode() === 'touch');

    discountAmount = computed(() => {
        const subtotal = this.subtotal();
        const discount = this.discount();
        return subtotal * (discount / 100);
    });

    canCheckout = computed(() => {
        const hasItems = this.items().length > 0;
        const diff = Math.abs(this.totalPayments() - this.total());
        return hasItems && diff < 0.01;
    });

    // --- MÉTODOS ---
    handleQuantityChange(id: string, quantity: number): void {
        this.updateQuantity.emit({ id, quantity });
    }

    handleDiscountChange(id: string, discount: number): void {
        this.updateDiscount.emit({ id, discount });
    }

    handleRemoveItem(id: string): void {
        this.remove.emit(id);
    }

    handleCheckout(): void {
        this.checkout.emit();
    }

    handleOpenPayment(): void {
        this.openPayment.emit();
    }

    handleClearCart(): void {
        this.clear.emit();
    }

    // --- TrackBy ---
    trackByItemId(index: number, item: CartItem): string {
        return item.id;
    }
}
