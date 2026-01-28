import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';

// --- Módulos de PrimeNG ---
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { Product } from '../../api/shared';

export type ViewMode = 'desktop' | 'touch';

@Component({
    selector: 'app-product-card',
    standalone: true,
    imports: [CommonModule, CardModule, BadgeModule],
    templateUrl: './product-card.component.html',
    styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
    // --- ENTRADAS ---
    @Input() product!: Product;
    @Input() viewMode: ViewMode = 'desktop';

    // --- SALIDAS ---
    @Output() select = new EventEmitter<Product>();

    // --- GETTERS (reemplazan signals computados) ---
    get isTouchMode(): boolean {
        return this.viewMode === 'touch';
    }

    // --- MÉTODOS ---
    onSelectProduct(): void {
        this.select.emit(this.product);
    }
}
