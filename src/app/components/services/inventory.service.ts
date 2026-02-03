import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, Category, Customer, PosProduct, Product, ProductCreateRequest, UnitOfMeasure, Warehouse } from '../pages/api/shared';
import { FinancingRequest, GetFinancing } from '../pages/api/financing';
import { Conversation, Message, MessageSend, PhoneNumbers } from '../pages/api/whatsappagents';
import { AnyCatcher } from 'rxjs/internal/AnyCatcher';
import { GetPurchase, GetPurchaseDetail, Purchase, PurchaseDetail } from '../pages/api/inventory';

@Injectable({ providedIn: 'root' })
export class InventoryService {
    private apiUrl = 'https://localhost:7197/api/'; // Cambia por tu ruta real

    constructor(private http: HttpClient) {}

    getProducts(companiaId: number): Observable<ApiResponse<Product[]>> {
        return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}Inventory/GetProducts/${companiaId}`);
    }

    createProduct(model: ProductCreateRequest): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}Inventory/CreateProduct`, model);
    }

    createProductBulk(model: ProductCreateRequest[]): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}Inventory/CreateProductBulk`, model);
    }

    deleteProduct(model: ProductCreateRequest): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${this.apiUrl}Inventory/DeleteProduct`, { body: model });
    }

    getProductsStore(companiaId: number): Observable<ApiResponse<PosProduct[]>> {
        return this.http.get<ApiResponse<PosProduct[]>>(`${this.apiUrl}Inventory/GetProductsStore/${companiaId}`);
    }

    getDetailPurchases(formData: FormData): Observable<ApiResponse<any[]>> {
        return this.http.post<ApiResponse<any[]>>(`${this.apiUrl}Inventory/GetDetailPurchases`, formData);
    }

    savePurchase(model: any): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}Inventory/SavePurchase`, model);
    }

    getPurchases(startDate: string, endDate: string, companiaId: number): Observable<ApiResponse<GetPurchase[]>> {
        return this.http.get<ApiResponse<GetPurchase[]>>(`${this.apiUrl}Inventory/GetPurchases/${startDate}/${endDate}/${companiaId}`);
    }

    getPurchaseDetail(purchaseId: number): Observable<ApiResponse<GetPurchaseDetail[]>> {
        return this.http.get<ApiResponse<GetPurchaseDetail[]>>(`${this.apiUrl}Inventory/GetPurchaseDetail/${purchaseId}`);
    }

    updateStatePurchase(stateId: number, purchaseId: number): Observable<ApiResponse<GetPurchaseDetail[]>> {
        return this.http.get<ApiResponse<GetPurchaseDetail[]>>(`${this.apiUrl}Inventory/UpdateStatePurchase/${stateId}/${purchaseId}`);
    }
}
