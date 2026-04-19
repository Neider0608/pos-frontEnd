import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../pages/api/shared';
import { Sending, SendingCreateRequest, SendingActionRequest, SendingDetail } from '../pages/api/sending';
import { environment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class SendingService {
    constructor(private http: HttpClient) {}

    create(model: SendingCreateRequest): Observable<ApiResponse<number>> {
        return this.http.post<ApiResponse<number>>(`${environment.apiUrl}Sending/Create`, model);
    }

    approve(model: SendingActionRequest): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${environment.apiUrl}Sending/Approve`, model);
    }

    reject(model: SendingActionRequest): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${environment.apiUrl}Sending/Reject`, model);
    }

    getById(rowid: number): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${environment.apiUrl}Sending/Get/${rowid}`);
    }

    getAll(companiaId: number): Observable<ApiResponse<Sending[]>> {
        return this.http.get<ApiResponse<Sending[]>>(`${environment.apiUrl}Sending/GetAll/${companiaId}`);
    }

    getCompanies(): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${environment.apiUrl}Sending/GetCompanies`);
    }

    getProductsWithStock(companiaId: number): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${environment.apiUrl}Sending/GetProductsWithStock/${companiaId}`);
    }
}