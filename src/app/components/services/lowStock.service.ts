import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../pages/api/shared';
import { Stock } from '../pages/api/low-tock';
import { environment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class LowStockService {
    constructor(private http: HttpClient) {}

    getStock(companiaId: number): Observable<ApiResponse<Stock[]>> {
        return this.http.get<ApiResponse<Stock[]>>(`${environment.apiUrl}LowStock/GetStock/${companiaId}`);
    }
}
