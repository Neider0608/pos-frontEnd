export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    document: string;
    type: 'regular' | 'vip' | 'wholesale';
    totalPurchases: number;
    lastPurchase: string;
    points: number;
  }