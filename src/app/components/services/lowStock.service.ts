import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../pages/api/shared';
import { Stock } from '../pages/api/low-tock';

@Injectable({ providedIn: 'root' })
export class LowStockService {
    
    private apiUrl = 'https://localhost:7197/api/'; // Cambia por tu ruta real

    constructor(private http: HttpClient) {}

    getStock(companiaId: number): Observable<ApiResponse<Stock[]>> {
        return this.http.get<ApiResponse<Stock[]>>(`${this.apiUrl}LowStock/GetStock/${companiaId}`);
    }   

}


