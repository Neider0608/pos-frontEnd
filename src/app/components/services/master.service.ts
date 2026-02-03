import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, Category, Customer, Product, UnitOfMeasure, Warehouse } from '../pages/api/shared';
import { FinancingRequest, GetFinancing } from '../pages/api/financing';
import { Conversation, Message, MessageSend, PhoneNumbers } from '../pages/api/whatsappagents';
import { Module, Permission, Role, User } from '../pages/api/permissions';
import { Company, ISupplier } from '../pages/api/master';

@Injectable({ providedIn: 'root' })
export class MasterService {
    private apiUrl = 'https://localhost:7197/api/'; // Cambia por tu ruta real

    constructor(private http: HttpClient) {}

    // =====================================================
    // 🧩 CATEGORÍAS
    // =====================================================

    getCategories(companiaId: number): Observable<ApiResponse<Category[]>> {
        return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}Master/GetCategories/${companiaId}`);
    }

    createCategory(model: Category): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}Master/CreateCategory`, model);
    }

    deleteCategory(model: Category): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${this.apiUrl}Master/DeleteCategory`, { body: model });
    }

    // =====================================================
    // 🏢 BODEGAS
    // =====================================================

    getWarehouses(companiaId: number): Observable<ApiResponse<Warehouse[]>> {
        return this.http.get<ApiResponse<Warehouse[]>>(`${this.apiUrl}Master/GetWarehouses/${companiaId}`);
    }

    createWarehouse(model: Warehouse): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}Master/CreateWarehouse`, model);
    }

    deleteWarehouse(model: Warehouse): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${this.apiUrl}Master/DeleteWarehouse`, { body: model });
    }

    // =====================================================
    // 🏢 Unidad de medida
    // =====================================================

    getUnitOfMeasure(): Observable<ApiResponse<UnitOfMeasure[]>> {
        return this.http.get<ApiResponse<UnitOfMeasure[]>>(`${this.apiUrl}Master/GetUnitsOfMeasure`);
    }

    createUnitOfMeasure(model: UnitOfMeasure): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}Master/CreateUnitOfMeasure`, model);
    }

    deleteUnitOfMeasure(model: UnitOfMeasure): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${this.apiUrl}Master/DeleteUnitOfMeasure`, { body: model });
    }

    // =====================================================
    // 🏢 Unidad de medida
    // =====================================================

    getClients(companiaId: number): Observable<ApiResponse<Customer[]>> {
        return this.http.get<ApiResponse<Customer[]>>(`${this.apiUrl}Master/GetClients/${companiaId}`);
    }

    CreateClient(model: Customer): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}Master/CreateClient`, model);
    }

    DeleteClient(model: Customer): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${this.apiUrl}Master/DeleteClient`, { body: model });
    }

    // =====================================================
    // 🧩 Uusario
    // =====================================================

    getUsers(companiaId: number): Observable<ApiResponse<User[]>> {
        return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}Master/GetUsers/${companiaId}`);
    }

    createUser(model: User): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}Master/createUser`, model);
    }

    deleteUser(model: User): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${this.apiUrl}Master/DeleteUser`, { body: model });
    }

    /* Compañias */

    getCompanies(): Observable<ApiResponse<Company[]>> {
        return this.http.get<ApiResponse<Company[]>>(`${this.apiUrl}Master/GetCompanies`);
    }

    createCompany(model: any): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}Master/CreateCompany`, model);
    }

    // =====================================================
    // ROLES
    // =====================================================

    getRoles(companiaId: number): Observable<ApiResponse<Role[]>> {
        return this.http.get<ApiResponse<Role[]>>(`${this.apiUrl}Master/GetRoles/${companiaId}`);
    }

    saveRole(model: any): Observable<ApiResponse<number>> {
        return this.http.post<ApiResponse<number>>(`${this.apiUrl}Master/SaveRole`, model);
    }

    deleteRole(roleId: number): Observable<ApiResponse<boolean>> {
        return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}Master/DeleteRole/${roleId}`);
    }

    // =====================================================
    // MODULES
    // =====================================================

    getModules(): Observable<ApiResponse<Module[]>> {
        return this.http.get<ApiResponse<Module[]>>(`${this.apiUrl}Master/GetModules`);
    }

    // =====================================================
    // PERMISSIONS
    // =====================================================

    getRolePermissions(roleId: number): Observable<ApiResponse<Permission[]>> {
        return this.http.get<ApiResponse<Permission[]>>(`${this.apiUrl}Master/GetRolePermissions/${roleId}`);
    }

    saveRolePermission(model: any): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}Master/SaveRolePermission`, model);
    }

    deleteRolePermissions(roleId: number): Observable<ApiResponse<boolean>> {
        return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}Master/DeleteRolePermissions/${roleId}`);
    }

    // =====================================================
    // 🧩 Proveedor
    // =====================================================

    getSuppliers(companiaId: number): Observable<ApiResponse<ISupplier[]>> {
        return this.http.get<ApiResponse<ISupplier[]>>(`${this.apiUrl}Master/GetSuppliers/${companiaId}`);
    }

    createSupplier(model: ISupplier): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}Master/CreateSupplier`, model);
    }

    deleteSupplier(model: ISupplier): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${this.apiUrl}Master/DeleteSupplier`, { body: model });
    }

    /**
     * Método de ayuda para manejar respuestas API genéricas
     * (por ejemplo, si quieres procesar logs, mostrar toasts, etc.)
     */
    handleResponse<T>(response: ApiResponse<T>): void {
        if (response.code !== 0) {
            console.error('❌ Error:', response.message);
        } else {
            console.log('✅ Éxito:', response.message);
        }
    }
}
