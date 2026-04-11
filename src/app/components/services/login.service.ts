import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../pages/api/shared';

import { AuthSession, ICompanySession } from '../pages/api/login';
import { Permission } from '../pages/api/permissions';
import { environment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class LoginService {
    constructor(private http: HttpClient) {}

    login(email: string, password: string): Observable<ApiResponse<AuthSession>> {
        return this.http.post<ApiResponse<AuthSession>>(`${environment.apiUrl}auth/login`, { email, password });
    }

    getPermissions(userId: number, companiaId: number): Observable<ApiResponse<Permission[]>> {
        return this.http.get<ApiResponse<Permission[]>>(`${environment.apiUrl}auth/GetPermissions/${userId}/${companiaId}`);
    }

    getPermissionsCompanies(userId: number): Observable<ApiResponse<ICompanySession[]>> {
        return this.http.get<ApiResponse<ICompanySession[]>>(`${environment.apiUrl}auth/GetPermissionsCompanies/${userId}`);
    }
}
