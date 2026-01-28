export interface StockStatus {
    status: string;
    severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
    tailwindClass: string;
}
