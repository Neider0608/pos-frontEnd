import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { Customer, Quote, QuoteItem } from '../api/quotes';

@Component({
  selector: 'app-quotes',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    DialogModule,
    DropdownModule,
    TabViewModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './quotes.component.html',
  styleUrl: './quotes.component.scss'
})
export class QuotesComponent implements OnInit {
  searchTerm: string = '';
  showAddDialog: boolean = false;
  showDetailDialog: boolean = false;
  selectedQuote: Quote | null = null;

  currentQuote: Quote = {
    id: '',
    quoteNumber: '',
    customerId: '',
    customerName: '',
    customerEmail: '',
    quoteDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    status: 'draft',
    items: [],
    createdBy: 'María González',
    createdAt: new Date().toISOString(),
  };

  newItem: Partial<QuoteItem> = {
    productName: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    totalPrice: 0,
  };

  quotes: Quote[] = [
    {
      id: '1',
      quoteNumber: 'COT-001',
      customerId: 'cust-1',
      customerName: 'Ana García',
      customerEmail: 'ana.garcia@email.com',
      quoteDate: '2024-01-15',
      validUntil: '2024-02-15',
      subtotal: 450.0,
      tax: 45.0,
      discount: 25.0,
      total: 470.0,
      status: 'sent',
      items: [
        {
          id: '1',
          productName: 'Coca Cola 350ml',
          description: 'Caja de 24 unidades',
          quantity: 5,
          unitPrice: 45.0,
          discount: 5.0,
          totalPrice: 213.75,
        },
        {
          id: '2',
          productName: 'Pan Integral',
          description: 'Paquete de 15 unidades',
          quantity: 10,
          unitPrice: 25.0,
          discount: 0,
          totalPrice: 250.0,
        },
      ],
      notes: 'Precios especiales por volumen',
      terms: 'Válida por 30 días. Precios sujetos a cambio sin previo aviso.',
      createdBy: 'María González',
      createdAt: '2024-01-15T10:00:00',
    },
    {
      id: '2',
      quoteNumber: 'COT-002',
      customerId: 'cust-2',
      customerName: 'Tienda El Buen Precio',
      customerEmail: 'pedidos@elbuenprecio.com',
      quoteDate: '2024-01-14',
      validUntil: '2024-02-14',
      subtotal: 1200.0,
      tax: 120.0,
      discount: 60.0,
      total: 1260.0,
      status: 'accepted',
      items: [
        {
          id: '3',
          productName: 'Arroz Diana 500g',
          description: 'Bulto de 20 unidades',
          quantity: 10,
          unitPrice: 56.0,
          discount: 10.0,
          totalPrice: 504.0,
        },
      ],
      createdBy: 'Carlos Pérez',
      createdAt: '2024-01-14T14:30:00',
    },
  ];

  customers: Customer[] = [
    { id: 'cust-1', name: 'Ana García', email: 'ana.garcia@email.com' },
    { id: 'cust-2', name: 'Tienda El Buen Precio', email: 'pedidos@elbuenprecio.com' },
    { id: 'cust-3', name: 'Carlos Rodríguez', email: 'carlos.rodriguez@email.com' },
  ];

  quoteStatuses: { label: string; value: Quote['status'] }[] = [
    { label: 'Borrador', value: 'draft' },
    { label: 'Enviada', value: 'sent' },
    { label: 'Aceptada', value: 'accepted' },
    { label: 'Rechazada', value: 'rejected' },
  ];

  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.calculateQuoteTotals();
  }

  get totalQuotes(): number {
    return this.quotes.length;
  }

  get sentQuotes(): number {
    return this.quotes.filter((q) => q.status === 'sent').length;
  }

  get acceptedQuotes(): number {
    return this.quotes.filter((q) => q.status === 'accepted').length;
  }

  get totalValue(): number {
    return this.quotes.reduce((sum, q) => sum + q.total, 0);
  }

  get filteredQuotes(): Quote[] {
    return this.quotes.filter(
      (quote) =>
        quote.quoteNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        quote.customerName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  calculateNewItemTotal(): number {
    const quantity = this.newItem.quantity || 1;
    const unitPrice = this.newItem.unitPrice || 0;
    const discount = this.newItem.discount || 0;
    return quantity * unitPrice * (1 - discount / 100);
  }

  addItemToQuote(): void {
    if (!this.newItem.productName || !this.newItem.quantity || !this.newItem.unitPrice) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor completa todos los campos del producto',
      });
      return;
    }

    const subtotalItem = this.newItem.quantity! * this.newItem.unitPrice!;
    const discountAmount = subtotalItem * ((this.newItem.discount || 0) / 100);
    const totalPrice = subtotalItem - discountAmount;

    const item: QuoteItem = {
      id: Date.now().toString(),
      productName: this.newItem.productName!,
      description: this.newItem.description,
      quantity: this.newItem.quantity!,
      unitPrice: this.newItem.unitPrice!,
      discount: this.newItem.discount || 0,
      totalPrice,
    };

    this.currentQuote.items = [...this.currentQuote.items, item];
    this.calculateQuoteTotals();

    this.newItem = {
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      totalPrice: 0,
    };
  }

  removeItemFromQuote(itemId: string): void {
    this.currentQuote.items = this.currentQuote.items.filter((item) => item.id !== itemId);
    this.calculateQuoteTotals();
  }

  calculateQuoteTotals(): void {
    const subtotal = this.currentQuote.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax - (this.currentQuote.discount || 0);

    this.currentQuote = {
      ...this.currentQuote,
      subtotal,
      tax,
      total,
    };
  }

  saveQuote(): void {
    if (!this.currentQuote.quoteNumber || !this.currentQuote.customerId || this.currentQuote.items.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor completa la información de la cotización y agrega al menos un producto',
      });
      return;
    }

    console.log('Guardando cotización:', this.currentQuote);
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Cotización guardada exitosamente',
    });
    this.showAddDialog = false;
    this.resetCurrentQuote();
  }

  resetCurrentQuote(): void {
    this.currentQuote = {
      id: '',
      quoteNumber: '',
      customerId: '',
      customerName: '',
      customerEmail: '',
      quoteDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      status: 'draft',
      items: [],
      createdBy: 'María González',
      createdAt: new Date().toISOString(),
    };
    this.newItem = {
        productName: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        totalPrice: 0,
      };
  }

  getStatusBadgeValue(status: Quote['status']): string {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'sent':
        return 'Enviada';
      case 'accepted':
        return 'Aceptada';
      case 'rejected':
        return 'Rechazada';
      case 'expired':
        return 'Vencida';
      default:
        return status;
    }
  }

  getStatusBadgeSeverity(status: Quote['status']): string {
    switch (status) {
      case 'draft':
        return 'info'; // or 'secondary' if available and fits
      case 'sent':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'expired':
        return 'secondary'; // PrimeNG 'secondary' or 'warning'
      default:
        return 'info';
    }
  }

  // Returns the PrimeIcons class for the status icon
  getStatusIconClass(status: Quote['status']): string {
    switch (status) {
      case 'accepted':
        return 'pi-check-circle';
      case 'rejected':
        return 'pi-times-circle'; // Corresponds to XCircle
      case 'sent':
        return 'pi-send';
      case 'expired':
        return 'pi-clock';
      default:
        return 'pi-file'; // Default icon for draft
    }
  }

  // Returns the Tailwind CSS color class for the status icon
  getStatusIconColorClass(status: Quote['status']): string {
    switch (status) {
      case 'accepted':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'sent':
        return 'text-blue-600';
      case 'expired':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  }

  onCustomerChange(customerId: string): void {
    const customer = this.customers.find((c) => c.id === customerId);
    this.currentQuote = {
      ...this.currentQuote,
      customerId: customerId,
      customerName: customer?.name || '',
      customerEmail: customer?.email || '',
    };
  }

  viewQuoteDetails(quote: Quote): void {
    this.selectedQuote = quote;
    this.showDetailDialog = true;
  }
}