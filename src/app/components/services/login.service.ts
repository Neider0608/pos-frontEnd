import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../pages/api/shared';

import { AuthSession, ICompanySession } from '../pages/api/login';
import { Permission } from '../pages/api/permissions';

@Injectable({ providedIn: 'root' })
export class LoginService {
    private apiUrl = 'https://localhost:7197/api/'; // Cambia por tu ruta real

    constructor(private http: HttpClient) {}

    login(email: string, password: string): Observable<ApiResponse<AuthSession>> {
        return this.http.post<ApiResponse<AuthSession>>(`${this.apiUrl}auth/login`, { email, password });
    }

    getPermissions(userId: number, companiaId: number): Observable<ApiResponse<Permission[]>> {
        return this.http.get<ApiResponse<Permission[]>>(`${this.apiUrl}auth/GetPermissions/${userId}/${companiaId}`);
    }

    getPermissionsCompanies(userId: number): Observable<ApiResponse<ICompanySession[]>> {
        return this.http.get<ApiResponse<ICompanySession[]>>(`${this.apiUrl}auth/GetPermissionsCompanies/${userId}`);
    }
}
