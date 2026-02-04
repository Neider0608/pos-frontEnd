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
import { Category, Product, ProductCreateRequest, ProductWarehouseRequest, UnitOfMeasure, Warehouse } from '../api/shared';
import { AuthSession } from '../api/login';
import * as XLSX from 'xlsx';
import { Permission } from '../api/permissions';
import { LoginService } from '../../services/login.service';

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
    categories: Category[] = [];
    masterWarehouses: Warehouse[] = [];
    unitsMeasure: UnitOfMeasure[] = [];

    // UI unificada para el formulario de bodegas
    warehousesUI: WarehouseUI[] = [];
    loading: boolean = false;
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

    permissions: Permission[] = [];

    canView = false;
    canCreate = false;
    canEdit = false;
    canDelete = false;
    canExport = false;

    constructor(
        private inventoryService: InventoryService,
        private masterService: MasterService,
        private messageService: MessageService,
        private authService: AuthService,
        private loginService: LoginService
    ) {}

    ngOnInit() {
        const session = this.authService.getSession() as AuthSession;
        if (session) {
            this.companiaId = session.companiaId;
            this.userId = session.userId;
        }

        if (!session) {
            this.resetPermissions();
            return;
        }

        const { userId, companiaId } = session;

        this.loginService.getPermissions(userId, companiaId).subscribe({
            next: (permissions) => {
                this.permissions = permissions.data ?? [];
                this.applyPermissions();
            },
            error: () => this.resetPermissions()
        });

        this.loadInventory();
        this.loadCategories();
        this.loadMasterWarehouses();
        this.loadUnitOfMeasure();
    }

    private applyPermissions(): void {
        const moduleName = 'Inventario';

        const permission = this.permissions.find((p) => p.module === moduleName);

        if (!permission) {
            this.resetPermissions();
            return;
        }

        this.canView = permission.canView;
        this.canCreate = permission.canCreate;
        this.canEdit = permission.canEdit;
        this.canDelete = permission.canDelete;
        this.canExport = permission.canExport;
    }

    private resetPermissions(): void {
        this.canView = false;
        this.canCreate = false;
        this.canEdit = false;
        this.canDelete = false;
        this.canExport = false;
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
            this.categories = res.data;
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

    exportToExcel() {
        // 1. Preparamos los datos "aplanados" para que el Excel sea legible
        const dataToExport = this.filteredInventory.map((p) => {
            const row: any = {
                ID: p.id,
                Código: p.code,
                Nombre: p.name,
                Referencia: p.reference || '',
                'Código Barras': p.barcode || '',
                'Categoría ID': p.categoryId,
                'Extension 1': p.extension1 || '',
                'Extension 2': p.extension2 || '',
                Precio: p.price,
                'Unidad Medida ID': p.unitMeasureId,
                'Maneja Stock': p.manageStock ? 'SI' : 'NO',
                Activo: p.active ? 'SI' : 'NO'
            };

            // Añadimos columnas dinámicas por cada bodega para el stock actual
            this.masterWarehouses.forEach((wh) => {
                const stock = p.existencias?.find((e) => e.wareHouseId === wh.id)?.stock || 0;
                const min = p.maximosMinimos?.find((m) => m.wareHouseId === wh.id)?.minStock || 0;
                const max = p.maximosMinimos?.find((m) => m.wareHouseId === wh.id)?.maxStock || 0;

                row[`Stock - ${wh.name}`] = stock;
                row[`Min - ${wh.name}`] = min;
                row[`Max - ${wh.name}`] = max;
            });

            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

        // Descargar
        XLSX.writeFile(workbook, `Inventario_Compania_${this.companiaId}.xlsx`);
    }

    /**
     * IMPORTAR: Lee el archivo y prepara los objetos ProductCreateRequest
     */
    importExcel(event: any) {
        this.loading = true;
        try {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e: any) => {
                const bstr = e.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data: any[] = XLSX.utils.sheet_to_json(ws);

                this.processBulkData(data);
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            this.loading = false;
        }
    }
    processBulkData(rows: any[]) {
        if (!rows || rows.length === 0) return;

        // 1. Mapeamos cada fila del Excel al formato ProductCreateRequest
        const requests: ProductCreateRequest[] = rows.map((row) => {
            // Mapeo de bodegas dinámico basado en las columnas del Excel
            const warehousesForThisProduct = this.masterWarehouses.map((wh) => ({
                warehouseId: wh.id!,
                // Buscamos en el Excel columnas como "Stock - NombreBodega"
                stock: Number(row[`Stock - ${wh.name}`] || 0),
                minStock: Number(row[`Min - ${wh.name}`] || 0),
                maxStock: Number(row[`Max - ${wh.name}`] || 0)
            }));

            return {
                id: Number(row['ID'] || 0), // Si es 0 o no existe, el API crea uno nuevo
                userId: this.userId,
                companiaId: this.companiaId,
                name: row['Nombre'],
                description: row['Descripción'] || '',
                barcode: String(row['Código Barras'] || ''),
                reference: String(row['Referencia'] || ''),
                extension1: row['Extension 1'] || '',
                extension2: row['Extension 2'] || '',
                price: Number(row['Precio'] || 0),
                imageUrl: row['Imagen URL'] || '',
                categoryId: Number(row['Categoría ID']),
                unitMeasureId: Number(row['Unidad Medida ID']),
                active: row['Activo'] === 'SI',
                manageStock: row['Maneja Stock'] === 'SI',
                warehouses: warehousesForThisProduct
            };
        });

        // 2. Ejecución (Recomendación: Enviar uno por uno o usar un forkJoin)
        // Aquí lo haremos uno por uno para asegurar que el MessageService muestre el progreso

        this.inventoryService.createProductBulk(requests).subscribe({
            next: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Carga Masiva',
                    detail: `Se procesaron ${requests.length} productos exitosamente.`
                });
                this.loadInventory(); // Recargar la tabla
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error en fila',
                    detail: `No se pudo cargar el archivo: ${err.message}`
                });
            }
        });
    }
}
