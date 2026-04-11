import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../pages/api/shared';
import { ISupplier } from '../pages/api/suppliers';
import { environment } from '../../../enviroments/enviroment';

@Injectable({
    providedIn: 'root'
})
export class SuppliersService {
    constructor(private http: HttpClient) {}

    getSuppliers(companiaId: number): Observable<ApiResponse<ISupplier[]>> {
        return this.http.get<ApiResponse<ISupplier[]>>(`${environment.apiUrl}Supplier/GetSuppliers/${companiaId}`);
    }
}
