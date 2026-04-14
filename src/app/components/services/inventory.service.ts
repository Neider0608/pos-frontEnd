import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, PosProduct, Product, ProductCreateRequest } from '../pages/api/shared';
import { GetPurchase, GetPurchaseDetail } from '../pages/api/inventory';
import { environment } from '../../../enviroments/enviroment';

export interface PurchaseCreateRequest {
    companiaId: number;
    stateId: number | null;
    purchaseOrder: string | null;
    userId: number;
    providerId: number | null;
    invoiceNumber: string;
    date: Date;
    details: PurchaseDetailRequest[];
    subtotal: number;
    tax: number;
    total: number;
}

export interface PurchaseDetailRequest {
    productId?: number;
    productName: string;
    reference: string;
    sku: number | string;
    ean?: string;
    ext1?: string;
    ext2?: string;
    quantity: number;
    cost: number;
    taxPercent: number;
    total: number;
    categoryId?: number | null | undefined;
    unitMeasureId?: number | null | undefined;
    warehouseId?: number | null | undefined;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
    constructor(private http: HttpClient) {}

    getProducts(companiaId: number): Observable<ApiResponse<Product[]>> {
        return this.http.get<ApiResponse<Product[]>>(`${environment.apiUrl}Inventory/GetProducts/${companiaId}`);
    }

    createProduct(model: ProductCreateRequest): Observable<ApiResponse<number>> {
        return this.http.post<ApiResponse<number>>(`${environment.apiUrl}Inventory/CreateProduct`, model);
    }

    createProductBulk(model: ProductCreateRequest[]): Observable<ApiResponse<number>> {
        return this.http.post<ApiResponse<number>>(`${environment.apiUrl}Inventory/CreateProductBulk`, model);
    }

    deleteProduct(model: ProductCreateRequest): Observable<ApiResponse<boolean>> {
        return this.http.request<ApiResponse<boolean>>('delete', `${environment.apiUrl}Inventory/DeleteProduct`, { body: model });
    }

    getProductsStore(companiaId: number): Observable<ApiResponse<PosProduct[]>> {
        return this.http.get<ApiResponse<PosProduct[]>>(`${environment.apiUrl}Inventory/GetProductsStore/${companiaId}`);
    }

    getDetailPurchases(formData: FormData): Observable<ApiResponse<GetPurchaseDetail[]>> {
        return this.http.post<ApiResponse<GetPurchaseDetail[]>>(`${environment.apiUrl}Inventory/GetDetailPurchases`, formData);
    }

    savePurchase(model: PurchaseCreateRequest): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${environment.apiUrl}Inventory/SavePurchase`, model);
    }

    getPurchases(startDate: string, endDate: string, companiaId: number): Observable<ApiResponse<GetPurchase[]>> {
        return this.http.get<ApiResponse<GetPurchase[]>>(`${environment.apiUrl}Inventory/GetPurchases/${startDate}/${endDate}/${companiaId}`);
    }

    getPurchaseDetail(purchaseId: number): Observable<ApiResponse<GetPurchaseDetail[]>> {
        return this.http.get<ApiResponse<GetPurchaseDetail[]>>(`${environment.apiUrl}Inventory/GetPurchaseDetail/${purchaseId}`);
    }

    updateStatePurchase(stateId: number, purchaseId: number): Observable<ApiResponse<GetPurchaseDetail[]>> {
        return this.http.patch<ApiResponse<GetPurchaseDetail[]>>(`${environment.apiUrl}Inventory/UpdateStatePurchase/${stateId}/${purchaseId}`, {});
    }
}
