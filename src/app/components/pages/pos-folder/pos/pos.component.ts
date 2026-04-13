import { Component, ElementRef, HostListener, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ProductGridComponent } from '../product-grid/product-grid.component';
import { SearchDialogComponent } from '../search-dialog/search-dialog.component';
import { CartItem, Invoice, LastSale, PaymentMethod, Promotion, ViewMode } from '../../api/pos';
import { PaymentDialogComponent } from '../payment-dialog/payment-dialog.component';
import { InvoiceDialogComponent } from '../invoice-dialog/invoice-dialog.component';
import { LOCALE_ID, Inject } from '@angular/core';
import { Customer, PosProduct, Product } from '../../api/shared';
import { PosService } from '../../../services/pos.service';
import { MasterService } from '../../../services/master.service';
import { InventoryService } from '../../../services/inventory.service';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../../core/guards/auth.service';
import { AuthSession } from '../../api/login';
import { Permission } from '../../api/permissions';
import { LoginService } from '../../../services/login.service';

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        InputSwitchModule,
        BadgeModule,
        CardModule,
        DialogModule,
        ToastModule,
        InputNumberModule,
        ConfirmDialogModule,
        SearchDialogComponent,
        PaymentDialogComponent,
        InvoiceDialogComponent
    ],

    providers: [MessageService, PosService, MasterService, InventoryService, AuthService, LoginService, ConfirmationService],
    templateUrl: './pos.component.html',
    styleUrls: ['./pos.component.scss']
})
export class PosComponent implements OnInit {
    Math = Math;

    @ViewChild('barcodeInputRef') barcodeInputRef!: ElementRef<HTMLInputElement>;

    products: PosProduct[] = [];
    /* customers: Customer[] = []; */
    customers: Customer[] = [];
    invoices: Invoice[] = [];
    activeInvoice: Invoice | null = null;
    invoiceCounter = 1;

    showSearchDialog = false;
    showPaymentDialog = false;
    showInvoiceDialog = false;

    promotions: Promotion[] = [];

    lastSale: LastSale | null = null;

    barcodeSearch = '';
    productCodeSearch = '';
    companiaId: number = 0;
    userId: number = 0;

    permissions: Permission[] = [];

    canView = false;
    canCreate = false;
    canEdit = false;
    canDelete = false;
    canExport = false;

    private barcodeBuffer = '';
    private barcodeTimer: any;
    currencyCode: string = 'COP';

    constructor(
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private posService: PosService,
        private masterService: MasterService,
        private inventoryService: InventoryService,
        private authService: AuthService,
        private loginService: LoginService,
        @Inject(LOCALE_ID) public locale: string
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
        this.companiaId = session.companiaId;
        this.userId = session.userId;

        this.loadInventory();
        this.loadCustomers();
        this.createNewInvoice(0);
        this.loadPromotions();
        this.focusBarcodeInput();
    }

    private applyPermissions(): void {
        const moduleName = 'Punto de Venta';

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

    loadInventory() {
        this.inventoryService.getProductsStore(this.companiaId).subscribe({
            next: (res) => {
                this.products = res.data || [];
                console.log('Productos cargados para POS:', this.products);
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar el inventario.'
                })
        });
    }

    get totalPagado(): number {
        return this.activeInvoice ? this.activeInvoice.paymentMethods.reduce((s, p) => s + (p.amount || 0), 0) : 0;
    }

    get puedeProcesar(): boolean {
        if (!this.activeInvoice) return false;
        const diff = Math.abs(this.totalPagado - this.activeInvoice.total);
        return this.activeInvoice.items.length > 0 && diff <= 0.01;
    }

    removeProduct(productId: number | string) {
        if (!this.activeInvoice) return;

        let product = this.activeInvoice.items.filter((item) => String(item.id) === String(productId))[0];

        this.releaseStock(product, product.quantity);
        this.activeInvoice.items = this.activeInvoice.items.filter((item) => String(item.id) !== String(productId));

        this.updateTotals(this.activeInvoice);
        this.focusBarcodeInput();
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboardShortcuts(event: KeyboardEvent) {
        switch (event.key) {
            case 'F2':
                event.preventDefault();
                this.showSearchDialog = true; // Buscar producto
                break;

            case 'F3':
                event.preventDefault();
                this.showPaymentDialog = true; // Abrir pago
                break;

            case 'F4':
                event.preventDefault();
                this.handleCheckout(); // Procesar venta
                break;

            case 'F5':
                event.preventDefault();
                this.createNewInvoice(this.invoices.length); // Crear nueva factura
                this.showToast('info', 'Nueva factura', 'Se ha creado una nueva factura.');
                break;

            default:
                break;
        }
    }

    loadCustomers() {
        this.masterService.getClients(this.companiaId).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.customers = (res.data || []).map((c: any) => ({
                        ...c,
                        displayName: this.buildCustomerDisplayName(c)
                    }));
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: res.message || 'No se pudieron cargar los clientes.'
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar los clientes desde el servidor.'
                });
            }
        });
    }

    private buildCustomerDisplayName(customer: Customer): string {
        if (customer.isCompany && customer.businessName) {
            return customer.businessName;
        }
        const name = [customer.firstName, customer.middleName, customer.lastName, customer.secondLastName].filter(Boolean).join(' ').trim();
        return name || customer.email || 'Cliente sin nombre';
    }

    loadPromotions() {
        this.posService.getPromotions(this.companiaId).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.promotions = res.data || [];

                    console.log('Promotions loaded: ', this.promotions);
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: res.message || 'No se pudieron cargar las promociones.'
                    });
                }
            },

            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar las promociones desde el servidor.'
                });
            }
        });
    }

    /** Crear una nueva venta (carrito) para otro cliente */
    createNewInvoice(index: number) {
        let defaultCustomer = this.customers.find((c) => c.document === '222222222' || c.nit === '222222222');

        if (!defaultCustomer) {
            defaultCustomer = {
                id: 0,
                document: '222222222',
                firstName: 'Consumidor',
                lastName: 'Final',
                isCompany: false,
                displayName: 'Consumidor Final',
                email: '',
                phone: '',
                address: '',
                city: ''
            } as Customer;
        }

        const newInvoice: Invoice = {
            invoiceNumber: `FV-${this.invoiceCounter.toString().padStart(3, '0')}`,
            index: index,
            date: new Date(),
            customer: defaultCustomer,
            items: [],
            subtotal: 0,
            grossSubtotal: 0,
            generalDiscount: 0,
            detailDiscount: 0,
            tempId: uuidv4(),
            totalVat: 0,
            total: 0,
            paymentMethods: [{ type: 'cash', amount: 0 }]
        };

        this.invoices.push(newInvoice);
        this.activeInvoice = newInvoice; // ← asegura que sea la factura activa
        this.invoiceCounter++;

        this.showToast('info', 'Nueva factura creada', `Factura ${newInvoice.invoiceNumber}`);
    }

    /** Cambiar de venta activa */
    selectInvoice(invoice: Invoice) {
        this.activeInvoice = invoice;
    }

    searchByBarcode() {
        if (!this.barcodeSearch.trim()) return;

        const product = this.products.find((p) => p.barcode === this.barcodeSearch.trim());

        if (product) {
            this.addProduct(product);
        } else {
            this.showToast('warn', 'No encontrado', `No existe producto con ese código.`);
        }

        this.barcodeSearch = '';
        this.focusBarcodeInput();
    }

    searchByProductCode() {
        if (!this.productCodeSearch.trim()) return;

        const product = this.products.find((p) => p.code.toString() === this.productCodeSearch.toLowerCase() || p.name.toLowerCase().includes(this.productCodeSearch.toLowerCase()));

        if (product) {
            this.addProduct(product);
        } else {
            this.showToast('warn', 'No encontrado', `No existe producto con ese código.`);
        }

        this.productCodeSearch = '';
        this.focusBarcodeInput();
    }

    reserveStock(item: CartItem, cantidad: number, existe: boolean) {
        this.posService
            .validateAndReserveStock({
                action: 'RESERVAR',
                productId: item.id,
                quantity: cantidad,
                companiaId: this.companiaId,
                userId: this.userId,
                facturaTempId: this.activeInvoice!.tempId
            })
            .subscribe({
                next: (res) => {
                    console.log('Respuesta de reserva de stock:', res);
                    if (res.data.success != 1) {
                        // 🔙 rollback visual
                        if (!existe) {
                            if (res.data.stockDisponible > 0 && res.data.stockDisponible >= cantidad) {
                                this.activeInvoice?.items.push(item);
                            }
                        }
                        item.quantity = item.prevQuantity;

                        this.showToast('warn', 'Stock insuficiente', `Solo hay ${res.data.stockDisponible} unidades más disponibles`);
                    } else {
                        // ✅ confirmamos visualmente
                        if (!existe) {
                            this.activeInvoice?.items.push(item);
                        }
                        item.prevQuantity = item.quantity;
                        this.updateTotals(this.activeInvoice!);
                    }
                },
                error: () => {
                    item.quantity = item.prevQuantity;
                    this.showToast('error', 'Error', 'No se pudo validar el stock');
                }
            });
    }

    releaseStock(item: CartItem, cantidad: number) {
        this.posService
            .validateAndReserveStock({
                action: 'RESTAR',
                productId: item.id,
                quantity: cantidad,
                companiaId: this.companiaId,
                userId: this.userId,
                facturaTempId: this.activeInvoice!.tempId
            })
            .subscribe({
                next: () => {
                    item.prevQuantity = item.quantity;

                    // 🗑️ si queda en 0, lo sacamos
                    if (item.quantity === 0) {
                        this.activeInvoice!.items = this.activeInvoice!.items.filter((i) => i !== item);
                    }

                    this.updateTotals(this.activeInvoice!);
                },
                error: () => {
                    item.quantity = item.prevQuantity;
                    this.showToast('error', 'Error', 'No se pudo liberar el stock');
                }
            });
    }

    clearInvoiceAll() {
        this.posService.cancelInvoiceAll(this.activeInvoice!.tempId, 1).subscribe({
            next: () => {
                this.activeInvoice!.tempId = uuidv4();
                this.showToast('success', 'Stock liberado', 'Se ha liberado el stock reservado de la factura.');
            },
            error: () => {
                /*  item.quantity = item.prevQuantity; */
                this.showToast('error', 'Error', 'No se pudo liberar el stock');
            }
        });
    }

    /** Procesar pago del cliente activo */
    handleCheckout() {
        if (!this.activeInvoice) return;
        const invoice = this.activeInvoice;

        // --- Validaciones previas ---
        if (invoice.items.length === 0) {
            this.showToast('warn', 'Sin productos', 'Agrega productos antes de procesar.');
            return;
        }

        const totalPayments = invoice.paymentMethods.reduce((s, p) => s + (p.amount || 0), 0);
        if (Math.abs(totalPayments - invoice.total) > 0.01) {
            this.showToast('error', 'Pago incompleto', 'Verifica los montos.');
            return;
        }

        this.lastSale = {
            invoiceNumber: '',
            date: new Date(),
            customer: invoice.customer,
            items: [...invoice.items],
            subtotal: invoice.subtotal,
            grossSubtotal: invoice.grossSubtotal,
            generalDiscount: invoice.generalDiscount,
            detailDiscount: invoice.detailDiscount,
            totalVat: invoice.totalVat,
            total: invoice.total,
            paymentMethods: [...invoice.paymentMethods],
            deliveryInfo: invoice.deliveryInfo ?? undefined
        };

        this.saveInvoice(invoice);
    }

    saveInvoice(invoice: Invoice) {
        const payload = {
            companiaId: this.companiaId,
            userId: this.userId,
            clientId: invoice.customer?.id || null,
            clientName: invoice.customer?.businessName || `${invoice.customer?.firstName ?? ''} ${invoice.customer?.lastName ?? ''}`.trim() || 'Consumidor Final',
            clientNit: invoice.customer?.nit || invoice.customer?.document || '',
            subtotal: invoice.subtotal || 0,
            grossSubtotal: invoice.grossSubtotal || 0,
            generalDiscount: invoice.generalDiscount || 0,
            detailDiscount: invoice.detailDiscount || 0,
            totalVat: invoice.totalVat || 0,
            totalInvoice: invoice.total || 0,

            // --- Detalle (productos) ---
            items: JSON.stringify(
                invoice.items.map((item: any) => ({
                    id: item.id,
                    warehouseId: item.warehouseId ?? 1,
                    manageStock: item.manageStock ?? true,
                    quantity: item.quantity,
                    price: item.price,
                    vatRate: item.vatRate ?? 0,
                    vatValue: item.vatValue ?? 0,
                    discount: item.discount ?? 0,
                    discountValue: item.discountValue ?? 0,
                    subtotal: item.subtotal,
                    total: item.total
                }))
            ),

            // --- Pagos ---
            payments: JSON.stringify(
                invoice.paymentMethods.map((p: any) => ({
                    type: p.type,
                    amount: p.amount,
                    months: p.months ?? null
                }))
            ),

            // --- Entrega (opcional) ---
            delivery: invoice.deliveryInfo
                ? JSON.stringify({
                      address: invoice.deliveryInfo.address || '',
                      city: invoice.deliveryInfo.city || '',
                      state: invoice.deliveryInfo.state || '',
                      zipCode: invoice.deliveryInfo.zipCode || '',
                      phone: invoice.deliveryInfo.phone || '',
                      notes: invoice.deliveryInfo.notes || ''
                  })
                : null
        };

        console.log('Payload de factura a enviar:', payload);
        // --- 🚀 Enviar al backend ---
        this.posService.createInvoice(payload).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.showToast('success', 'Venta completada', res.message || `Factura ${res.data[0].invoice_Number} registrada.`);

                    if (this.lastSale) {
                        this.lastSale.invoiceNumber = res.data[0].invoice_Number?.toString() || '';
                    }

                    // --- Mostrar resultado ---
                    /*  this.showToast('success', 'Venta completada', `Factura ${finalNumber}`); */
                    this.showPaymentDialog = false;
                    this.showInvoiceDialog = true;

                    // --- Quitar cliente en espera (ya procesado) ---
                    this.invoices = this.invoices.filter((i) => i !== invoice);

                    // --- Seleccionar la siguiente factura activa (si existe) ---
                    if (this.invoices.length > 0) {
                        this.activeInvoice = this.invoices[0];
                    } else {
                        this.createNewInvoice(this.invoices.length);
                        this.focusBarcodeInput();
                    }
                } else {
                    this.showToast('error', 'Error en factura', res.message || 'No se pudo registrar la factura.');
                }
            },
            error: (err) => {
                console.error('Error al guardar factura:', err);
                this.showToast('error', 'Error de conexión', 'No se pudo guardar la factura en el servidor.');
            }
        });
    }

    confirmClearInvoice() {
        this.confirmationService.confirm({
            header: 'Confirmar anulación',
            message: '¿Está seguro de que desea anular esta factura? Se liberará todo el stock reservado.',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, anular',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                if (this.activeInvoice) {
                    this.clearInvoice(this.activeInvoice);
                }
            }
        });
    }

    /** Reiniciar un carrito */
    clearInvoice(invoice: Invoice) {
        this.clearInvoiceAll();
        invoice.items = [];
        invoice.generalDiscount = 0;
        invoice.paymentMethods = [{ type: 'cash', amount: 0 }];

        this.updateTotals(invoice);
        this.invoices = this.invoices.filter((i) => i !== invoice);
        if (this.invoices.length == 0) {
            this.createNewInvoice(0);
        }
    }

    /** Manejar cliente creado desde el selector - Recargar clientes desde BD */
    onCustomerCreated(customer: Customer): void {
        this.loadCustomers();
    }

    /** Mensajes Toast */
    private showToast(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string) {
        this.messageService.add({ severity, summary, detail, life: 2500 });
    }

    focusBarcodeInput() {
        setTimeout(() => {
            this.barcodeInputRef?.nativeElement?.focus();
        }, 0);
    }

    /* Checkout*/
    applyPromotions(invoice: Invoice): void {
        if (!this.promotions?.length) return;

        const now = new Date();

        for (const promo of this.promotions) {
            // 🔹 Validaciones base
            if (!promo.isActive) continue;

            if (promo.startDate && new Date(promo.startDate) > now) continue;
            if (promo.endDate && new Date(promo.endDate) < now) continue;

            if (promo.usageLimit && promo.usageCount && promo.usageCount >= promo.usageLimit) continue;

            switch (promo.type.toUpperCase()) {
                case 'PERCENTAGE':
                    this.processPercentagePromotion(invoice, promo);
                    break;

                case 'BUY_X_GET_Y':
                    this.processBuyXGetYPromotion(invoice, promo);
                    break;
            }
        }
    }

    processPercentagePromotion(invoice: Invoice, promo: Promotion): void {
        for (const item of invoice.items) {
            const appliesByProduct = promo.products?.some((p) => p.id === item.id);

            const appliesByCategory = promo.categories?.some((c) => c.id === item.categoryId);

            if (!appliesByProduct && !appliesByCategory) continue;

            const percent = promo.value || 0;

            let discount = (item.price * item.quantity * percent) / 100;

            // 🔹 Aplicar tope máximo si existe
            if (promo.maxDiscount && discount > promo.maxDiscount) {
                discount = promo.maxDiscount;
            }

            item.discountValue += discount;
            item.discount = percent;
        }
    }

    processBuyXGetYPromotion(invoice: Invoice, promo: Promotion): void {
        for (const item of invoice.items) {
            const applies = promo.products?.some((p) => p.id === item.id);

            if (!applies) continue;

            const minQty = promo.value || 0;
            const giftQty = promo.buyY || 0;

            if (minQty <= 0 || giftQty <= 0) continue;

            const sets = Math.floor(item.quantity / minQty);
            if (sets <= 0) continue;

            const totalGiftUnits = sets * giftQty;

            // 🔥 CASO 1: Promoción con productos regalo definidos
            if (promo.giftProducts?.length) {
                for (const giftPromoProduct of promo.giftProducts) {
                    // 🔎 Buscar producto REAL en catálogo
                    const realProduct = this.products.find((p) => p.id === giftPromoProduct.id);

                    if (!realProduct) continue;

                    const existingGift = invoice.items.find((i) => i.id === realProduct.id);

                    if (existingGift) {
                        ((existingGift.quantity = totalGiftUnits),
                            (existingGift.prevQuantity = totalGiftUnits),
                            (existingGift.discount = 100),
                            (existingGift.discountValue = realProduct.price * totalGiftUnits),
                            (existingGift.subtotal = realProduct.price * totalGiftUnits),
                            (existingGift.total = 0));
                    } else {
                        const giftItem: CartItem = {
                            ...realProduct,
                            quantity: totalGiftUnits,
                            prevQuantity: totalGiftUnits,
                            discount: 100,
                            discountValue: realProduct.price * totalGiftUnits,
                            vatRate: realProduct.vat || 0,
                            vatValue: 0,
                            priceExcludedTax: 0,
                            subtotal: realProduct.price * totalGiftUnits,
                            total: 0,
                            appliesVAT: realProduct.appliesVAT ?? false
                        };

                        invoice.items.push(giftItem);
                    }
                }
            } else {
                // 🔥 CASO 2: No hay regalo físico → descuento directo
                const discount = totalGiftUnits * item.price;
                item.discountValue += discount;
            }
        }
    }

    addProduct(product: PosProduct) {
        if (!this.activeInvoice) return;

        const existingItem = this.activeInvoice.items.find((i) => i.id === product.id);

        if (product.manageStock) {
            const currentQuantity = existingItem ? existingItem.quantity : 0;

            if (product.stock <= currentQuantity) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Stock insuficiente',
                    detail: `Solo hay ${product.stock} unidades disponibles.`
                });
                return;
            }
        }

        // 🔥 SI YA EXISTE → SOLO SUMAR
        if (existingItem) {
            existingItem.quantity++;
            this.onQuantityChange(existingItem);
            return;
        }

        // 🔥 NUEVO ITEM
        const newItem: CartItem = {
            ...product,
            quantity: 1,
            prevQuantity: 0,
            discount: 0,
            discountValue: 0,
            vatRate: product.vat || 0,
            vatValue: 0,
            priceExcludedTax: 0,
            subtotal: product.price,
            total: product.price,
            appliesVAT: product.appliesVAT ?? false
        };

        this.activeInvoice.items.push(newItem); // 🔥 SOLO AQUÍ

        this.onQuantityChange(newItem);

        this.showSearchDialog = false;
        this.focusBarcodeInput();
    }

    onQuantityChange(item: CartItem) {
        if (!this.activeInvoice) return;

        item.prevQuantity = item.quantity;

        this.updateTotals(this.activeInvoice);
    }
    updateTotals(invoice: Invoice): void {
        let grossSubtotal = 0;
        let totalDiscountDetail = 0;
        let totalVat = 0;
        let totalExcludedTax = 0;

        for (const item of invoice.items) {
            item.discountValue = 0;
        }

        this.applyPromotions(invoice);

        for (const item of invoice.items) {
            const itemSubtotal = item.price * item.quantity;

            if (item.discountValue > itemSubtotal) {
                item.discountValue = itemSubtotal;
            }

            const itemAfterDiscount = itemSubtotal - item.discountValue;

            if (item.appliesVAT && item.vatRate > 0) {
                item.priceExcludedTax = itemAfterDiscount / (1 + item.vatRate / 100);
                item.vatValue = itemAfterDiscount - item.priceExcludedTax;
            } else {
                item.priceExcludedTax = itemAfterDiscount;
                item.vatValue = 0;
            }

            item.subtotal = itemSubtotal;
            item.total = itemAfterDiscount + item.vatValue;

            grossSubtotal += itemSubtotal;
            totalDiscountDetail += item.discountValue;
            totalVat += item.vatValue;
            totalExcludedTax += item.priceExcludedTax;
        }
        const netSubtotal = grossSubtotal - totalDiscountDetail;

        const generalDiscountAmount = netSubtotal * (invoice.generalDiscount / 100);

        const subtotalAfterGeneralDiscount = netSubtotal - generalDiscountAmount;
        const vatAfterGeneralDiscount = totalVat;

        invoice.grossSubtotal = grossSubtotal;
        invoice.subtotal = subtotalAfterGeneralDiscount;
        invoice.detailDiscount = totalDiscountDetail;
        invoice.totalVat = vatAfterGeneralDiscount;
        invoice.total = subtotalAfterGeneralDiscount + vatAfterGeneralDiscount;
    }
}
