import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChild, ElementRef, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { LOCALE_ID } from '@angular/core';
import { PosProduct, Product } from '../../api/shared';

export type PriceMode = 'DETAL' | 'CURVA' | 'PAQUETE';
export type SelectProductPayload = { product: PosProduct; priceMode: PriceMode; unitPrice: number };

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
    @Output() selectProduct = new EventEmitter<SelectProductPayload>();

    // ⚙️ Estado interno
    searchTerm: string = '';
    selectedIndex: number = 0;
    currencyCode: string = 'COP';
    @ViewChild('searchInputRef') searchInputRef!: ElementRef<HTMLInputElement>;

    constructor(@Inject(LOCALE_ID) public locale: string) {}

    private normalizePrice(value: unknown): number {
        const n = Number(value ?? 0);
        return Number.isFinite(n) ? n : 0;
    }

    getPrice(product: PosProduct, mode: PriceMode): number {
        switch (mode) {
            case 'CURVA':
                return this.normalizePrice(product.priceCurva);
            case 'PAQUETE':
                return this.normalizePrice(product.pricePaquete);
            default:
                return this.normalizePrice(product.price);
        }
    }

    hasPrice(product: PosProduct, mode: PriceMode): boolean {
        return this.getPrice(product, mode) > 0;
    }

    priceText(mode: PriceMode): string {
        switch (mode) {
            case 'CURVA':
                return 'Curva';
            case 'PAQUETE':
                return 'Paquete';
            default:
                return 'Detal';
        }
    }

    // 🧠 Filtro completo
    get filteredProducts(): PosProduct[] {
        const term = this.searchTerm.trim().toLowerCase();
        if (!term) return this.products;

        return this.products.filter((p) => [p.name, p.code, p.reference, p.barcode, p.category, p.extension1, p.extension2, p.tag].filter(Boolean).some((val) => val!.toString().toLowerCase().includes(term)));
    }

    // 🧩 Selección
    handleSelectProduct(product: PosProduct): void {
        // fallback: si hacen click en la tarjeta, elegimos el primer precio disponible
        const mode: PriceMode =
            this.hasPrice(product, 'DETAL') ? 'DETAL' : this.hasPrice(product, 'CURVA') ? 'CURVA' : this.hasPrice(product, 'PAQUETE') ? 'PAQUETE' : 'DETAL';
        this.handleSelectPrice(product, mode);
    }

    handleSelectPrice(product: PosProduct, mode: PriceMode): void {
        const unitPrice = this.getPrice(product, mode);
        this.selectProduct.emit({ product, priceMode: mode, unitPrice });
        this.closeDialog();
    }

    handleConfirmSelection(): void {
        const products = this.filteredProducts;
        if (products.length > 0 && this.selectedIndex < products.length) {
            this.handleSelectProduct(products[this.selectedIndex]);
        }
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
