import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// --- Componentes hijos ---
import { ProductCardComponent } from '../product-card/product-card.component';
import { ViewMode } from '../../api/pos';
import { Product } from '../../api/shared';

@Component({
    selector: 'app-product-grid',
    standalone: true,
    imports: [CommonModule, ProductCardComponent],
    templateUrl: './product-grid.component.html',
    styleUrl: './product-grid.component.scss'
})
export class ProductGridComponent {
    // --- ENTRADAS ---
    @Input() products: Product[] = [];
    @Input() viewMode: ViewMode = 'desktop';

    // --- SALIDAS ---
    @Output() selectProduct = new EventEmitter<Product>();

    // --- MÉTODOS ---
    onProductSelected(product: Product): void {
        this.selectProduct.emit(product);
    }

    trackByProductId(index: number, product: Product): number {
        return product.id;
    }
}
