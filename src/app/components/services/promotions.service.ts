import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../pages/api/shared';
import { Promotion } from '../pages/api/promotions';
import { environment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class PromotionsService {
    constructor(private http: HttpClient) {}

    // =====================================================
    // 🎯 PROMOCIONES
    // =====================================================

    getPromotions(companiaId: number): Observable<ApiResponse<Promotion[]>> {
        return this.http.get<ApiResponse<Promotion[]>>(`${environment.apiUrl}Promotion/GetPromotions/${companiaId}`);
    }

    getPromotionById(id: number, companiaId: number): Observable<ApiResponse<Promotion[]>> {
        return this.http.get<ApiResponse<Promotion[]>>(`${environment.apiUrl}Promotion/GetPromotionById/${id}/${companiaId}`);
    }

    createPromotion(model: Promotion): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${environment.apiUrl}Promotion/CreatePromotion`, model);
    }

    updatePromotion(model: Promotion): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${environment.apiUrl}Promotion/UpdatePromotion`, model);
    }

    deletePromotion(model: Promotion): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${environment.apiUrl}Promotion/DeletePromotion`, { body: model });
    }
}
