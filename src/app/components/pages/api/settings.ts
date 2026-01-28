 export interface CompanyData {
    companyName: string;
    businessType: string;
    address: string;
    phone: string;
    email: string;
    taxId: string;
    ownerName: string;
    currency: string;
    timezone: string;
  }
  
  export interface NotificationsSettings {
    lowStock: boolean;
    dailyReports: boolean;
    salesAlerts: boolean;
    systemUpdates: boolean;
  }
  
  export interface PrinterSettings {
    receiptPrinter: string;
    paperSize: string;
    printLogo: boolean;
    printFooter: boolean;
  }