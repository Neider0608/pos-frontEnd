
// Interfaces
export interface SalesPeriodData {
    sales: number;
    transactions: number;
    customers: number;
    avgTicket: number;
  }
  
  export interface SalesDataCollection {
    today: SalesPeriodData;
    week: SalesPeriodData;
    month: SalesPeriodData;
  }
  
  export interface TopProduct {
    name: string;
    sales: number;
    revenue: number;
    growth: number;
  }
  
  export interface CategorySales {
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }