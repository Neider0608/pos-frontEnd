// Interfaces
  export interface QuoteItem {
    id: string;
    productName: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    totalPrice: number;
  }
  
  export interface Quote {
    id: string;
    quoteNumber: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    quoteDate: string;
    validUntil: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    items: QuoteItem[];
    notes?: string;
    terms?: string;
    createdBy: string;
    createdAt: string;
  }
  
  export interface Customer {
    id: string;
    name: string;
    email: string;
  }