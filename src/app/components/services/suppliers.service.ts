import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../pages/api/shared';
import { ISupplier } from '../pages/api/suppliers';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {

    private apiUrl = 'https://localhost:7197/api/'; // Cambia por tu ruta real

    constructor(private http: HttpClient) {}

    getSuppliers(companiaId: number): Observable<ApiResponse<ISupplier[]>> {
        return this.http.get<ApiResponse<ISupplier[]>>(`${this.apiUrl}Supplier/GetSuppliers/${companiaId}`);
    }


}
