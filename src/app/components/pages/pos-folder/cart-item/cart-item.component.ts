import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { InputNumberModule } from 'primeng/inputnumber';
import { CartItem } from '../../api/pos';

export type ViewMode = 'desktop' | 'touch';

@Component({
    selector: 'app-cart-item',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, ButtonModule, BadgeModule, InputNumberModule],
    templateUrl: './cart-item.component.html',
    styleUrls: ['./cart-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartItemComponent {
    // --- ENTRADAS ---
    @Input({ required: true }) item!: CartItem;
    @Input() viewMode: ViewMode = 'desktop';

    // --- SALIDAS ---
    @Output() updateQuantity = new EventEmitter<{ id: string; quantity: number }>();
    @Output() updateDiscount = new EventEmitter<{ id: string; discount: number }>();
    @Output() remove = new EventEmitter<string>();

    // --- GETTERS COMPUTADOS ---
    get isTouchMode(): boolean {
        return this.viewMode === 'touch';
    }

    get finalPrice(): number {
        return this.item.price * this.item.quantity * (1 - this.item.discount / 100);
    }

    // --- MÉTODOS ---
    onUpdateQuantity(quantity: number): void {
        if (quantity >= 0) {
            this.updateQuantity.emit({ id: this.item.id, quantity });
        }
    }

    onUpdateDiscount(discount: number | null): void {
        this.updateDiscount.emit({ id: this.item.id, discount: discount ?? 0 });
    }

    onRemove(): void {
        this.remove.emit(this.item.id);
    }
}
