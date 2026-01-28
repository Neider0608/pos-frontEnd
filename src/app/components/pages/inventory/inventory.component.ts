import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

// Services & Interfaces
import { InventoryService } from '../../services/inventory.service';
import { MasterService } from '../../services/master.service';
import { AuthService } from '../core/guards/auth.service';
import { Product, ProductCreateRequest, ProductWarehouseRequest, UnitOfMeasure, Warehouse } from '../api/shared';
import { AuthSession } from '../api/login';

interface WarehouseUI extends ProductWarehouseRequest {
    name: string; // Para mostrar el nombre en la lista del modal
}

@Component({
    selector: 'app-inventory',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, InputNumberModule, DropdownModule, DialogModule, TableModule, ToggleSwitchModule, ToastModule],
    templateUrl: './inventory.component.html',
    providers: [MessageService]
})
export class InventoryComponent implements OnInit {
    inventory: Product[] = [];
    filteredInventory: Product[] = [];
    categories: any[] = [];
    masterWarehouses: Warehouse[] = [];
    unitsMeasure: UnitOfMeasure[] = [];

    // UI unificada para el formulario de bodegas
    warehousesUI: WarehouseUI[] = [];

    companiaId: number = 0;
    userId: number = 0;

    totalItems = 0;
    totalValue = 0;
    lowStockItems: Product[] = [];

    showAddDialog = false;
    showEditDialog = false;

    filters = {
        nameOrReference: '',
        category: null,
        extension1: '',
        extension2: '',
        unitMeasure: '',
        active: true,
        minPrice: null,
        maxPrice: null
    };

    newProduct: any = {};

    constructor(
        private inventoryService: InventoryService,
        private masterService: MasterService,
        private messageService: MessageService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        const session = this.authService.getSession() as AuthSession;
        if (session) {
            this.companiaId = session.companiaId;
            this.userId = session.userId;
        }

        this.loadInventory();
        this.loadCategories();
        this.loadMasterWarehouses();
        this.loadUnitOfMeasure();
    }

    loadMasterWarehouses() {
        this.masterService.getWarehouses(this.companiaId).subscribe((res) => {
            this.masterWarehouses = res.data || [];
        });
    }

    loadInventory() {
        this.inventoryService.getProducts(this.companiaId).subscribe({
            next: (res) => {
                this.inventory = (res.data || []).map((item: any) => ({
                    ...item,
                    maximosMinimos: item.maximosMinimos ? JSON.parse(item.maximosMinimos) : [],
                    existencias: item.existencias ? JSON.parse(item.existencias) : []
                }));

                this.filteredInventory = [...this.inventory];

                this.calculateTotals();
            }
        });
    }

    loadCategories() {
        this.masterService.getCategories(this.companiaId).subscribe((res) => {
            this.categories = res.data?.map((c) => ({ label: c.name, value: c.id })) || [];
        });
    }

    loadUnitOfMeasure() {
        this.masterService.getUnitOfMeasure().subscribe((res) => {
            this.unitsMeasure = res.data || [];
        });
    }

    getProductTotalStock(product: Product): number {
        if (!product.existencias) return 0;
        return product.existencias.reduce((acc, curr) => acc + (curr.stock || 0), 0);
    }

    calculateTotals() {
        this.totalItems = 0;
        this.totalValue = 0;
        this.lowStockItems = [];

        this.inventory.forEach((item) => {
            const stockTotal = this.getProductTotalStock(item);
            this.totalItems += stockTotal;
            this.totalValue += stockTotal * (item.price || 0);

            // Si maneja stock y la suma total es baja (ej. menor a 5)
            if (item.manageStock && stockTotal <= 5) {
                this.lowStockItems.push(item);
            }
        });
    }

    filterProducts() {
        this.filteredInventory = this.inventory.filter((item) => {
            const matchesSearch =
                !this.filters.nameOrReference ||
                item.name.toLowerCase().includes(this.filters.nameOrReference.toLowerCase()) ||
                item.reference?.toLowerCase().includes(this.filters.nameOrReference.toLowerCase()) ||
                item.barcode?.toLowerCase().includes(this.filters.nameOrReference.toLowerCase());

            const matchesCategory = !this.filters.category || item.categoryId === this.filters.category;
            const matchesExtension = !this.filters.extension1 || item.extension1?.toLowerCase().includes(this.filters.extension1.toLowerCase());
            const matchesActive = item.active === this.filters.active;

            return matchesSearch && matchesCategory && matchesExtension && matchesActive;
        });
    }

    resetFilters() {
        this.filters = { nameOrReference: '', category: null, extension1: '', extension2: '', unitMeasure: '', active: true, minPrice: null, maxPrice: null };
        this.filterProducts();
    }

    // Unifica Bodegas Maestras con los datos del producto (Stock, Min, Max)
    prepareWarehouseUI(product?: Product) {
        console.log('Producto recibido:', product);

        this.warehousesUI = this.masterWarehouses.map((wh) => {
            const stockRecord = product?.existencias?.find((e) => e.wareHouseId === wh.id);

            const limitRecord = product?.maximosMinimos?.find((m) => m.wareHouseId === wh.id);

            return {
                warehouseId: wh.id!,
                name: wh.name,
                stock: stockRecord?.stock ?? 0,
                minStock: limitRecord?.minStock ?? 0,
                maxStock: limitRecord?.maxStock ?? 0
            };
        });
    }

    openAddDialog() {
        this.newProduct = { active: true, manageStock: true, price: 0 };
        this.prepareWarehouseUI();
        this.showAddDialog = true;
    }

    editProduct(product: Product) {
        this.newProduct = { ...product };
        this.prepareWarehouseUI(product);
        this.showEditDialog = true;
    }

    closeDialog() {
        this.showAddDialog = false;
        this.showEditDialog = false;
        this.newProduct = {};
    }

    onImageSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => (this.newProduct.imageUrl = e.target.result);
            reader.readAsDataURL(file);
        }
    }

    saveProduct() {
        const request: ProductCreateRequest = {
            id: this.newProduct.id,
            userId: this.userId,
            companiaId: this.companiaId,
            name: this.newProduct.name,
            description: this.newProduct.description || '',
            barcode: this.newProduct.barcode,
            reference: this.newProduct.reference,
            extension1: this.newProduct.extension1,
            extension2: this.newProduct.extension2,
            price: this.newProduct.price,
            imageUrl: this.newProduct.imageUrl,
            categoryId: this.newProduct.categoryId,
            unitMeasureId: this.newProduct.unitMeasureId,
            active: this.newProduct.active,
            manageStock: this.newProduct.manageStock,
            warehouses: this.warehousesUI.map((w) => ({
                warehouseId: w.warehouseId,
                stock: w.stock,
                minStock: w.minStock,
                maxStock: w.maxStock
            }))
        };

        const action = this.inventoryService.createProduct(request);

        action.subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto guardado' });
                this.closeDialog();
                this.loadInventory();
            }
        });
    }

    deleteProduct(item: Product) {
        // Implementar lógica de eliminación
    }
}
