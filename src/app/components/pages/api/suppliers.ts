export interface ISupplier {
    id: number;
    name: string;
    taxId: string;
    contact: string;
    phone: string;
    email: string;
    address: string;
    status: string;
    productsCount: number;
    lastOrder?: string; // <-- El "?" la hace opcional
}
