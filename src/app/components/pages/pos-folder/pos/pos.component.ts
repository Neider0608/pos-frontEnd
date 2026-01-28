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
import { ProductGridComponent } from '../product-grid/product-grid.component';
import { SearchDialogComponent } from '../search-dialog/search-dialog.component';
import { CartItem, Invoice, LastSale, PaymentMethod, ViewMode } from '../../api/pos';
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

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, InputSwitchModule, BadgeModule, CardModule, DialogModule, ToastModule, InputNumberModule, SearchDialogComponent, PaymentDialogComponent, InvoiceDialogComponent],

    providers: [MessageService, PosService, MasterService, InventoryService],
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

    lastSale: LastSale | null = null;

    barcodeSearch = '';
    productCodeSearch = '';
    companiaId: number = 0;
    userId: number = 0;

    private barcodeBuffer = '';
    private barcodeTimer: any;
    currencyCode: string = 'COP';
    ivaRate = 0; //pendiente
    constructor(
        private messageService: MessageService,
        private posService: PosService,
        private masterService: MasterService,
        private inventoryService: InventoryService,
        private authService: AuthService,
        @Inject(LOCALE_ID) public locale: string
    ) {}

    ngOnInit(): void {
        const session = this.authService.getSession() as AuthSession;
        this.companiaId = session.companiaId;
        this.userId = session.userId;

        this.loadInventory();
        this.loadCustomers();
        this.createNewInvoice(0);
        this.focusBarcodeInput();
    }

    loadInventory() {
        this.inventoryService.getProductsStore(this.companiaId).subscribe({
            next: (res) => {
                this.products = res.data || [];
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
                    this.customers = res.data || [];
                    console.log('custmerS: ', this.customers);
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

    /** Crear una nueva venta (carrito) para otro cliente */
    createNewInvoice(index: number) {
        const newInvoice: Invoice = {
            invoiceNumber: `FV-${this.invoiceCounter.toString().padStart(3, '0')}`,
            index: index,
            date: new Date(),
            customer: null,
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

    /** Agregar producto al carrito del cliente activo */
    addProduct(product: PosProduct) {
        if (!this.activeInvoice) return;

        const existingItem = this.activeInvoice.items.find((i) => i.id === product.id);

        if (existingItem) {
            existingItem.quantity++;
            this.onQuantityChange(existingItem, true);
            return;
        }

        const discountPercent = product.hasDiscount ? product.discountPercent || 0 : 0;
        const discountValue = (product.price * discountPercent) / 100;
        const subtotal = product.price;
        const total = product.price - discountValue;

        const newItem: CartItem = {
            ...product,
            quantity: 1,
            prevQuantity: 0,
            discount: discountPercent,
            discountValue,
            subtotal,
            total
        };

        if (newItem.quantity <= 0) return;

        /* this.activeInvoice.items.push(newItem); */
        this.onQuantityChange(newItem, false);

        this.showSearchDialog = false;
        this.focusBarcodeInput();
    }

    onQuantityChange(item: CartItem, existe: boolean) {
        if (!item.manageStock) {
            this.updateTotals(this.activeInvoice!);
            return;
        }

        const delta = item.quantity - item.prevQuantity;

        if (delta === 0) return;

        if (delta > 0) {
            this.reserveStock(item, delta, existe);
        } else {
            this.releaseStock(item, Math.abs(delta));
        }
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

    /** Recalcular totales */
    updateTotals(invoice: Invoice): void {
        let grossSubtotal = 0; // Suma bruta sin descuentos
        let totalDiscountDetail = 0; // Suma de descuentos por producto

        // 🔹 Recalcular valores por producto
        for (const item of invoice.items) {
            const discountPercent = item.discount || 0;
            const discountValue = (item.price * item.quantity * discountPercent) / 100;
            const itemSubtotal = item.price * item.quantity; // Valor sin descuentos ni IVA
            const itemTotal = itemSubtotal - discountValue; // Valor con descuento aplicado

            // 🔹 Actualizar los valores individuales del ítem
            item.discountValue = discountValue;
            item.subtotal = itemSubtotal;
            item.total = itemTotal;

            grossSubtotal += itemSubtotal;
            totalDiscountDetail += discountValue;
        }

        // 🔹 IVA configurable desde la configuración
        const ivaPercentage = this.ivaRate / 100; // por ejemplo, 19 = 19%

        // 🔹 Calcular descuento general e IVA dinámico
        const generalDiscountAmount = (grossSubtotal - totalDiscountDetail) * (invoice.generalDiscount / 100);

        // 🔹 Base imponible (subtotal neto antes de IVA)
        const netSubtotal = grossSubtotal - totalDiscountDetail - generalDiscountAmount;

        // 🔹 IVA (solo sobre la base imponible)
        const totalVat = netSubtotal * ivaPercentage;

        // 🔹 Totales globales finales
        invoice.grossSubtotal = grossSubtotal; // ✅ Agregado: valor bruto sin descuentos
        invoice.subtotal = netSubtotal; // Subtotal ya incluye descuentos, sin IVA
        invoice.detailDiscount = totalDiscountDetail; // Descuentos por producto
        invoice.totalVat = totalVat; // IVA calculado sobre el subtotal neto
        invoice.total = netSubtotal + totalVat; // Total con IVA
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
                    console.log('fsv:', this.lastSale);
                    console.log('res:', res);

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

    /** Mensajes Toast */
    private showToast(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string) {
        this.messageService.add({ severity, summary, detail, life: 2500 });
    }

    focusBarcodeInput() {
        setTimeout(() => {
            this.barcodeInputRef?.nativeElement?.focus();
        }, 0);
    }
}
