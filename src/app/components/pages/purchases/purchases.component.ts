import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { PopoverModule } from 'primeng/popover'; // PrimeNG 18+
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { MasterService } from '../../services/master.service';
import { InventoryService } from '../../services/inventory.service';
import { Category, Product, UnitOfMeasure } from '../api/shared';
import { AuthService } from '../core/guards/auth.service';
import { AuthSession } from '../api/login';

import { AutoCompleteModule } from 'primeng/autocomplete';
import { ISupplier } from '../api/master';

interface PurchaseDetail {
    productId?: number;
    productName: string;
    reference: string;
    sku: number | string;
    ean?: string;
    ext1?: string;
    ext2?: string;
    quantity: number;
    cost: number;
    taxPercent: number;
    total: number;
}

interface Purchase {
    providerId: number | null;
    invoiceNumber: string;
    date: Date;
    details: PurchaseDetail[];
    subtotal: number;
    tax: number;
    total: number;
}

interface PurchaseHistory {
    id: string;
    providerName: string;
    invoiceNumber: string;
    date: Date;
    total: number;
    status: 'COMPLETADO' | 'PENDIENTE' | 'CANCELADO';
    itemCount: number;
}

@Component({
    selector: 'app-purchases',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule, ButtonModule, InputTextModule, DropdownModule, AutoCompleteModule, CalendarModule, InputNumberModule, TableModule, PopoverModule, TooltipModule, DialogModule, TagModule],
    providers: [MessageService],

    templateUrl: './purchases.component.html',
    styleUrls: ['./purchases.component.scss']
})
export class PurchaseComponent implements OnInit {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
    activeView: 'form' | 'history' | 'new' = 'new';
    // Filtros de Historial
    startDate: Date = new Date();
    endDate: Date = new Date();

    // Modal de Detalle
    displayDetail: boolean = false;
    selectedPurchase: any = null;

    // Datos simulados de Historial
    history: PurchaseHistory[] = [
        { id: '1', providerName: 'Distribuidora Global Tech', invoiceNumber: 'FAC-882', date: new Date(), total: 1540000, status: 'COMPLETADO', itemCount: 12 },
        { id: '2', providerName: 'Importaciones Express', invoiceNumber: 'INV-001', date: new Date(), total: 850000, status: 'COMPLETADO', itemCount: 5 }
    ];
    // Modelos
    purchase: Purchase = {
        providerId: null,
        invoiceNumber: '',
        date: new Date(),
        details: [],
        subtotal: 0,
        tax: 0,
        total: 0
    };

    /* Maestros */
    products: Product[] = [];
    categories: Category[] = [];
    unitsMeasure: UnitOfMeasure[] = [];
    companiaId: number = 0;
    userId: number = 0;

    acceptedTypes = '';

    /* Search */
    filteredProducts: any[] = []; // Resultados de búsqueda
    selectedProduct: any; // Producto seleccionado en el buscador

    // Datos de ejemplo para los dropdowns
    suppliers: ISupplier[] = [];

    constructor(
        private messageService: MessageService,
        private masterService: MasterService,
        private inventoryService: InventoryService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        const session = this.authService.getSession() as AuthSession;
        if (session) {
            this.companiaId = session.companiaId;
            this.userId = session.userId;
        }
        this.loadUnitOfMeasure();
        this.loadInventory();
        this.loadCategories();
        this.loadSuppliers();
    }

    filterProducts(event: any) {
        const query = event.query.toLowerCase();

        this.filteredProducts = this.products.filter(
            (p) =>
                p.name?.toLowerCase().includes(query) ||
                p.barcode?.toLowerCase().includes(query) ||
                p.reference?.toLowerCase().includes(query) ||
                p.extension1?.toLowerCase().includes(query) ||
                p.extension2?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
        );
    }

    loadSuppliers() {
        this.masterService.getSuppliers(this.companiaId).subscribe({
            next: (res) => {
                this.suppliers = res.data || [];
            },

            error: (err) => {
                console.error('Error cargando proveedores:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error de conexión' });
            }
        });
    }

    // Acción al seleccionar un producto del buscador
    onProductSelect(product: any) {
        debugger;
        // Evitar duplicados si lo deseas, o simplemente agregar
        this.purchase.details.push({
            productId: product.value.id,
            productName: product.value.name,
            reference: product.value.reference,
            sku: product.value.code,
            ean: product.value.barcode,
            ext1: product.value.extension1,
            ext2: product.value.extension2,
            quantity: 1,
            cost: 0,
            taxPercent: 19,
            total: 0
        });

        this.calculateTotals();

        // Limpiar el buscador para la siguiente entrada
        this.selectedProduct = null;
    }

    viewPurchaseDetail(purchase: PurchaseHistory) {
        this.selectedPurchase = purchase;
        // Aquí cargarías el detalle real desde tu API
        this.displayDetail = true;
    }

    getSeverity(status: string) {
        switch (status) {
            case 'COMPLETADO':
                return 'success';
            case 'PENDIENTE':
                return 'warning';
            case 'CANCELADO':
                return 'danger';
            default:
                return 'info';
        }
    }

    // Cálculos automáticos
    calculateTotals() {
        this.purchase.subtotal = this.purchase.details.reduce((acc, item) => acc + item.quantity * item.cost, 0);
        this.purchase.tax = this.purchase.details.reduce((acc, item) => acc + item.quantity * item.cost * (item.taxPercent / 100), 0);
        this.purchase.total = this.purchase.subtotal + this.purchase.tax;
    }

    removeItem(index: number) {
        this.purchase.details.splice(index, 1);
        this.calculateTotals();
    }
    openFile(type: 'pdf' | 'img' | 'doc') {
        switch (type) {
            case 'pdf':
                this.acceptedTypes = 'application/pdf';
                break;
            case 'img':
                this.acceptedTypes = 'image/*';
                break;
            case 'doc':
                this.acceptedTypes = 'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
        }

        this.fileInput.nativeElement.value = '';
        this.fileInput.nativeElement.click();
    }

    // Lógica de carga de archivos (IA Simulation)
    handleFileUpload(event: any) {
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        this.inventoryService.getDetailPurchases(formData).subscribe({
            next: (res) => {
                if (res.data) {
                    console.log('Detalle de compra cargado desde archivo:', res.data);
                }
            }
        });

        /*  this.http.post<PurchaseDetail[]>(`/api/purchases/process-document?companyId=${this.companiaId}`, formData).subscribe((res) => {
            this.purchase.details = res;
            this.calculateTotals();
        }); */
    }

    openQuickCreate() {
        // Aquí dispararías el modal que diseñamos antes
        this.messageService.add({ severity: 'warn', summary: 'Acción', detail: 'Abriendo Formulario de Producto Nuevo...' });
    }

    savePurchase() {
        if (this.purchase.details.length === 0) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No hay productos en la compra' });
            return;
        }
        console.log('Guardando Compra:', this.purchase);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Compra registrada en inventario' });
    }

    filterHistory() {
        console.log('Filtrando desde:', this.startDate, 'hasta:', this.endDate);
        this.messageService.add({
            severity: 'info',
            summary: 'Filtrando',
            detail: `Buscando compras entre fechas seleccionadas`
        });
    }

    /* Maestros */

    loadInventory() {
        this.inventoryService.getProducts(this.companiaId).subscribe({
            next: (res) => {
                this.products = res.data || [];
                console.log('Productos cargados:', this.products);
            }
        });
    }

    loadCategories() {
        this.masterService.getCategories(this.companiaId).subscribe((res) => {
            this.categories = res.data || [];
        });
    }

    loadUnitOfMeasure() {
        this.masterService.getUnitOfMeasure().subscribe((res) => {
            this.unitsMeasure = res.data || [];
        });
    }
}
