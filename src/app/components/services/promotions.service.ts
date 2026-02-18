import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../pages/api/shared';
import { Promotion } from '../pages/api/promotions';

@Injectable({ providedIn: 'root' })
export class PromotionsService {
    private apiUrl = 'https://localhost:7197/api/';

    constructor(private http: HttpClient) {}

    // =====================================================
    // 🎯 PROMOCIONES
    // =====================================================

    getPromotions(companiaId: number): Observable<ApiResponse<Promotion[]>> {
        return this.http.get<ApiResponse<Promotion[]>>(`${this.apiUrl}Promotion/GetPromotions/${companiaId}`);
    }

    getPromotionById(id: number, companiaId: number): Observable<ApiResponse<Promotion[]>> {
        return this.http.get<ApiResponse<Promotion[]>>(`${this.apiUrl}Promotion/GetPromotionById/${id}/${companiaId}`);
    }

    createPromotion(model: Promotion): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}Promotion/CreatePromotion`, model);
    }

    updatePromotion(model: Promotion): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}Promotion/UpdatePromotion`, model);
    }

    deletePromotion(model: Promotion): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${this.apiUrl}Promotion/DeletePromotion`, { body: model });
    }
}
