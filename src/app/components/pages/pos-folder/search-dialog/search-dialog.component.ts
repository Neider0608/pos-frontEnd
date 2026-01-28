import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChild, ElementRef, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { LOCALE_ID } from '@angular/core';
import { PosProduct, Product } from '../../api/shared';

@Component({
    selector: 'app-search-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, InputTextModule, ButtonModule, BadgeModule, CurrencyPipe],
    templateUrl: './search-dialog.component.html',
    styleUrls: ['./search-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchDialogComponent {
    // 🧩 Inputs / Outputs
    @Input() visible!: boolean;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Input() products: PosProduct[] = [];
    @Output() selectProduct = new EventEmitter<PosProduct>();

    // ⚙️ Estado interno
    searchTerm: string = '';
    selectedIndex: number = 0;
    currencyCode: string = 'COP';
    @ViewChild('searchInputRef') searchInputRef!: ElementRef<HTMLInputElement>;

    constructor(@Inject(LOCALE_ID) public locale: string) {}

    // 🧠 Filtro completo
    get filteredProducts(): PosProduct[] {
        const term = this.searchTerm.trim().toLowerCase();
        if (!term) return this.products;

        return this.products.filter((p) => [p.name, p.code, p.reference, p.barcode, p.category, p.extension1, p.extension2, p.tag].filter(Boolean).some((val) => val!.toString().toLowerCase().includes(term)));
    }

    // 🧩 Selección
    handleSelectProduct(product: PosProduct): void {
        this.selectProduct.emit(product);
        this.closeDialog();
    }

    closeDialog(): void {
        this.visible = false;
        this.visibleChange.emit(this.visible);
        this.searchTerm = '';
    }

    // 🔎 Enfocar input al mostrar
    handleShow(): void {
        setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 100);
    }

    trackByProductId(index: number, product: PosProduct): number {
        return product.id;
    }

    // 🎹 Navegación con teclado
    handleKeyboardNavigation(event: KeyboardEvent): void {
        const products = this.filteredProducts;
        const max = products.length - 1;

        switch (event.key) {
            case 'ArrowDown':
                this.selectedIndex = this.selectedIndex < max ? this.selectedIndex + 1 : 0;
                event.preventDefault();
                break;
            case 'ArrowUp':
                this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : max;
                event.preventDefault();
                break;
            case 'Enter':
                const product = products[this.selectedIndex];
                if (product) this.handleSelectProduct(product);
                break;
            case 'Escape':
                this.closeDialog();
                break;
        }
    }
}
