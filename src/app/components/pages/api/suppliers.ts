export interface ISupplier {
    id: number;
    name: string;
    contact: string;
    phone: string;
    email: string;
    address: string;
    taxId: string;
    status: 'active' | 'inactive';
    productsCount: number;
    lastOrder: string;
}
