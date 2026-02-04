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
import { Table, TableModule } from 'primeng/table';
import { PopoverModule } from 'primeng/popover'; // PrimeNG 18+
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { MasterService } from '../../services/master.service';
import { InventoryService } from '../../services/inventory.service';
import { ApiResponse, Category, Product, ProductCreateRequest, ProductWarehouseRequest, UnitOfMeasure, Warehouse } from '../api/shared';
import { AuthService } from '../core/guards/auth.service';
import { AuthSession } from '../api/login';
// Si usas PrimeNG 18+
import { ToggleSwitchModule } from 'primeng/toggleswitch';

// Si usas versiones anteriores
import { InputSwitchModule } from 'primeng/inputswitch';

import { AutoCompleteModule } from 'primeng/autocomplete';
import { ISupplier } from '../api/master';
import { GetPurchase, GetPurchaseDetail, Purchase, PurchaseDetail, PurchaseHistory, WarehouseUI } from '../api/inventory';
import { Permission } from '../api/permissions';
import { LoginService } from '../../services/login.service';

@Component({
    selector: 'app-purchases',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ToastModule,
        ButtonModule,
        ToggleSwitchModule,
        InputSwitchModule,
        InputTextModule,
        DropdownModule,
        AutoCompleteModule,
        CalendarModule,
        InputNumberModule,
        TableModule,
        PopoverModule,
        TooltipModule,
        DialogModule,
        TagModule
    ],
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
    masterWarehouses: Warehouse[] = [];
    showAddDialog: boolean = false;
    // Modal de Detalle
    displayDetail: boolean = false;

    purchasesHistory: GetPurchase[] = [];
    purchaseDetails: GetPurchaseDetail[] = []; // Se llena al abrir el modal
    selectedPurchase: GetPurchase | null = null;
    displayDetailDialog: boolean = false;
    statusOptions = [
        { label: 'PAGADA', value: 4 },
        { label: 'PENDIENTE DE PAGO', value: 5 },
        { label: 'PARCIAL', value: 6 }
    ];
    // Datos simulados de Historial

    // Modelos
    purchase: Purchase = {
        companiaId: 0,
        userId: 0,
        stateId: null,
        purchaseOrder: null,
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
    newProduct: any = {};
    acceptedTypes = '';
    warehousesUI: WarehouseUI[] = [];
    /* Search */
    filteredProducts: any[] = []; // Resultados de búsqueda
    selectedProduct: any; // Producto seleccionado en el buscador
    globalWarehouseId: number | null = null;
    // Datos de ejemplo para los dropdowns
    suppliers: ISupplier[] = [];

    permissions: Permission[] = [];

    canView = false;
    canCreate = false;
    canEdit = false;
    canDelete = false;
    canExport = false;
    // Variables para controlar el proceso de vinculación
    displayLinker: boolean = false;
    selectedItemToLink: any = null;
    linkSearchQuery: string = '';
    public selectedStatusFilter: string | null = null;
    constructor(
        private messageService: MessageService,
        private masterService: MasterService,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private loginService: LoginService
    ) {}

    ngOnInit(): void {
        const session = this.authService.getSession() as AuthSession;

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
        if (session) {
            this.companiaId = session.companiaId;
            this.userId = session.userId;
        }
        this.loadUnitOfMeasure();
        this.loadInventory();
        this.loadCategories();
        this.loadSuppliers();
        this.loadMasterWarehouses();
    }

    private applyPermissions(): void {
        const moduleName = 'Compras';

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

    filterProducts(event: any) {
        const query = event.query.toLowerCase().trim();

        if (!query) {
            this.filteredProducts = [...this.products];
            return;
        }

        this.filteredProducts = this.products.filter((p) => {
            return p.name?.toLowerCase().includes(query) || p.reference?.toLowerCase().includes(query) || p.barcode?.toLowerCase().includes(query) || p.extension1?.toLowerCase().includes(query) || p.extension2?.toLowerCase().includes(query);
        });
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
        if (this.purchase.details.some((item) => item.productId === product.value.id)) {
            this.purchase.details.forEach((item) => {
                if (item.productId === product.value.id) {
                    item.quantity += 1;
                    item.total = item.quantity * item.cost;
                }
            });
        } else {
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
                taxPercent: 0,
                categoryId: product.value.categoryId,
                unitMeasureId: product.value.unitMeasureId,
                warehouseId: this.globalWarehouseId || null,
                total: 0
            });
        }

        this.calculateTotals();

        // Limpiar el buscador para la siguiente entrada
        this.selectedProduct = null;
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
        /*  this.purchase.subtotal = this.purchase.details.reduce((acc, item) => acc + item.quantity * item.cost, 0);
        this.purchase.tax = this.purchase.details.reduce((acc, item) => acc + item.quantity * item.cost * (item.taxPercent / 100), 0);
        this.purchase.total = this.purchase.subtotal + this.purchase.tax; */
        this.purchase.subtotal = this.purchase.details.reduce((acc, item) => acc + item.quantity * item.cost, 0);
        this.purchase.tax = this.purchase.details.reduce((acc, item) => acc + item.quantity * item.cost, 0);
        this.purchase.total = this.purchase.subtotal;
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
        formData.append('companiaId', this.companiaId.toString());

        this.inventoryService.getDetailPurchases(formData).subscribe({
            next: (res) => {
                if (!res.data || res.data.length === 0) {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Aviso',
                        detail: 'No se detectaron productos en el documento'
                    });
                    return;
                }

                const purchaseDetails: PurchaseDetail[] = res.data.map((item: any) => {
                    const normalize = (v?: string) => v?.trim().toLowerCase() ?? '';

                    const existingProduct = this.products.find((p) => {
                        // 1️⃣ BARCODE manda
                        if (item.barcode && p.barcode) {
                            return normalize(p.barcode) === normalize(item.barcode);
                        }

                        // 2️⃣ Sin barcode → usar referencia (obligatoria)
                        if (!item.barcode && item.reference && normalize(p.reference) === normalize(item.reference)) {
                            // Si item trae talla, debe coincidir
                            if (item.extension1 && normalize(p.extension1) !== normalize(item.extension1)) {
                                return false;
                            }

                            // Si item trae color, debe coincidir
                            if (item.extension2 && normalize(p.extension2) !== normalize(item.extension2)) {
                                return false;
                            }

                            return true; // reference coincide + variantes compatibles
                        }

                        return false;
                    });

                    const quantity = item.quantity ?? 1;
                    const cost = item.price ?? 0;

                    return {
                        ...(existingProduct?.id ? { productId: existingProduct.id } : {}), // ✅ CLAVE
                        productName: item.name ?? '',
                        reference: item.reference ?? '',
                        sku: item.reference ?? item.barcode ?? '',
                        ean: item.barcode ?? '',
                        ext1: item.extension1 ?? '',
                        ext2: item.extension2 ?? '',
                        quantity,
                        cost,
                        taxPercent: 0,
                        total: quantity * cost,
                        categoryId: existingProduct?.categoryId ?? item.categoryId ?? 0,
                        unitMeasureId: existingProduct?.unitMeasureId ?? item.unitMeasureId ?? 0,

                        warehouseId: this.globalWarehouseId || null
                    };
                });

                // ➕ Agregar al detalle de la compra
                this.purchase.details.push(...purchaseDetails);

                this.calculateTotals();

                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Detalle de compra cargado automáticamente'
                });

                console.log('Detalle de compra procesado:', purchaseDetails);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo procesar el documento'
                });
            }
        });
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

    openAddDialog() {
        this.newProduct = { active: true, manageStock: true, price: 0 };
        this.prepareWarehouseUI();
        this.showAddDialog = true;
    }

    openQuickCreate() {
        // Aquí dispararías el modal que diseñamos antes
        this.messageService.add({ severity: 'warn', summary: 'Acción', detail: 'Abriendo Formulario de Producto Nuevo...' });
    }

    onImageSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => (this.newProduct.imageUrl = e.target.result);
            reader.readAsDataURL(file);
        }
    }

    savePurchase() {
        // 1️⃣ Validar que existan productos
        if (!this.purchase.details || this.purchase.details.length === 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No hay productos en la compra'
            });
            return;
        }

        // 2️⃣ Validar proveedor
        if (this.purchase.providerId === null || this.purchase.providerId === undefined || this.purchase.providerId <= 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Proveedor requerido',
                detail: 'Debe seleccionar un proveedor para registrar la compra'
            });
            return;
        }

        // 2️⃣ Validar proveedor
        if (this.purchase.stateId === null || this.purchase.stateId === undefined || this.purchase.stateId <= 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Estado requerido',
                detail: 'Debe seleccionar un estado para registrar la compra'
            });
            return;
        }

        // 3️⃣ Validar cada detalle
        for (let i = 0; i < this.purchase.details.length; i++) {
            const item = this.purchase.details[i];
            const row = i + 1;

            // Producto válido
            if (!item.productId || item.productId <= 0) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Producto inválido',
                    detail: `El producto en la fila ${row} no es válido`
                });
                return;
            }

            // Cantidad válida
            if (!item.quantity || item.quantity <= 0) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Cantidad inválida',
                    detail: `La cantidad del producto en la fila ${row} debe ser mayor a 0`
                });
                return;
            }

            // Costo válido
            if (!item.cost || item.cost <= 0) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Costo inválido',
                    detail: `El costo del producto en la fila ${row} debe ser mayor a 0`
                });
                return;
            }

            // Bodega requerida (solo que exista)
            if (item.warehouseId === null || item.warehouseId === undefined) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Bodega requerida',
                    detail: `Debe seleccionar una bodega para el producto en la fila ${row}`
                });
                return;
            }
        }

        // 4️⃣ Setear datos de sesión
        this.purchase.companiaId = this.companiaId;
        this.purchase.userId = this.userId;

        // ✅ Todo OK
        console.log('Guardando Compra:', this.purchase);

        // 💾 Guardar compra
        this.inventoryService.savePurchase(this.purchase).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: res.message || 'Compra registrada correctamente'
                    });

                    // 🔄 Opcional: resetear formulario
                    this.resetPurchase();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.message || 'No se pudo registrar la compra'
                    });
                }
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al conectar con el servidor'
                });
            }
        });
    }

    resetPurchase() {
        this.purchase = {
            companiaId: this.companiaId,
            userId: this.userId,
            stateId: null,
            purchaseOrder: null,
            providerId: null,
            invoiceNumber: '',
            date: new Date(),
            details: [],
            subtotal: 0,
            tax: 0,
            total: 0
        };
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

    linkToMasterProduct(item: any) {
        this.selectedItemToLink = item;
        this.displayLinker = true;
    }

    onMasterProductSelect(masterProduct: any) {
        if (this.selectedItemToLink && masterProduct) {
            // Actualizamos la fila con los datos reales del catálogo
            this.selectedItemToLink.productId = masterProduct.id;
            this.selectedItemToLink.productName = masterProduct.name;
            this.selectedItemToLink.reference = masterProduct.reference;
            this.selectedItemToLink.barcode = masterProduct.barcode;
            this.selectedItemToLink.categoryId = masterProduct.categoryId;
            this.selectedItemToLink.unitMeasureId = masterProduct.unitMeasureId;

            // Cerramos el buscador
            this.displayLinker = false;
            this.selectedItemToLink = null;

            this.messageService.add({
                severity: 'success',
                summary: 'Producto Vinculado',
                detail: 'Se ha actualizado la información con el catálogo maestro.'
            });
        }
    }

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

    loadMasterWarehouses() {
        this.masterService.getWarehouses(this.companiaId).subscribe((res) => {
            this.masterWarehouses = res.data || [];
        });
    }

    closeDialog() {
        this.showAddDialog = false;
        this.newProduct = {};
    }

    createAndLinkProduct(item: any) {
        this.selectedItemToLink = item; // Guardamos la referencia de la fila

        // Inicializamos el modelo de nuevo producto con lo que ya tenemos
        this.newProduct = {
            name: item.productName,
            reference: item.reference,
            barcode: item.barcode || '',
            extension1: item.ext1 || '',
            extension2: item.ext2 || '',
            categoryId: item.categoryId,
            unitMeasureId: item.unitMeasureId,
            active: true,
            manageStock: true,
            price: 0
        };

        this.showAddDialog = true;
    }

    confirmLink(event: any) {
        const selectedMaster = event.value; // El producto real del catálogo

        if (this.selectedItemToLink) {
            // Actualizamos la fila con la info real del catálogo
            this.selectedItemToLink.productId = selectedMaster.id;
            this.selectedItemToLink.productName = selectedMaster.name;
            this.selectedItemToLink.reference = selectedMaster.reference;
            this.selectedItemToLink.barcode = selectedMaster.barcode;

            // Mantenemos o actualizamos las extensiones
            this.selectedItemToLink.ext1 = selectedMaster.extension1 || this.selectedItemToLink.ext1;
            this.selectedItemToLink.ext2 = selectedMaster.extension2 || this.selectedItemToLink.ext2;

            // Sincronizamos categorías y unidades
            this.selectedItemToLink.categoryId = selectedMaster.categoryId;
            this.selectedItemToLink.unitMeasureId = selectedMaster.unitMeasureId;

            // Limpiamos y cerramos
            this.linkSearchQuery = '';
            this.displayLinker = false;
            this.selectedItemToLink = null;

            // Notificamos éxito (opcional)
            // this.messageService.add({severity:'success', summary:'Vinculado', detail:'Producto asociado correctamente'});
        }
    }

    applyGlobalWarehouse(event: any) {
        const newId = event.value;
        if (newId && this.purchase.details.length > 0) {
            this.purchase.details.forEach((item) => {
                item.warehouseId = newId;
            });
            // Opcional: Notificación de cambio masivo
        }

        console.log('Bodega global aplicada:', this.purchase.details);
    }

    // 3. Función auxiliar para el diseño (para mostrar el nombre seleccionado)
    getWarehouseName(id: number): string {
        const wh = this.masterWarehouses.find((w) => w.id === id);
        return wh ? wh.name : 'Bodega';
    }

    loadHistory() {
        if (!this.startDate || !this.endDate) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Campos obligatorios',
                detail: 'Seleccione el rango de fechas'
            });
            return;
        }

        const fechaDesde = this.startDate.toISOString();
        const fechaHasta = this.endDate.toISOString();

        this.inventoryService.getPurchases(fechaDesde, fechaHasta, this.companiaId).subscribe({
            next: (response: ApiResponse<GetPurchase[]>) => {
                this.purchasesHistory = response.data;
            },
            error: (err) => console.error('Error al obtener compras', err)
        });
    }

    // Ver detalle
    viewPurchaseDetails(purchase: GetPurchase) {
        this.selectedPurchase = purchase;

        this.inventoryService.getPurchaseDetail(purchase.purchaseId).subscribe({
            next: (response: ApiResponse<GetPurchaseDetail[]>) => {
                this.purchaseDetails = response.data;
                this.displayDetailDialog = true;
            },
            error: (err) => console.error('Error al obtener detalle', err)
        });
    }

    // 4. Exportar (Simulación)
    exportToExcel() {
        this.messageService.add({ severity: 'info', summary: 'Excel', detail: 'Generando reporte...' });
    }

    updatePurchaseStatus(purchase: GetPurchase) {
        this.inventoryService.updateStatePurchase(purchase.stateId, purchase.purchaseId).subscribe({
            next: (res) => {
                let state = this.statusOptions.find((s) => s.value === purchase.stateId)?.label || 'Desconocido';
                purchase.state = state;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Estado Actualizado',
                    detail: `Factura marcada como ${state}`
                });
                this.displayDetailDialog = false;
                this.viewPurchaseDetails(purchase);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado' });
            }
        });
    }

    clearFilters(table: Table) {
        table.clear(); // Limpia filtros
        this.selectedStatusFilter = null; // Reinicia el modelo del dropdown
        // Si tienes un input de búsqueda con ID, podrías limpiar su valor manualmente también
    }
}
