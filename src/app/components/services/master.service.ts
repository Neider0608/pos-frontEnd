import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, Category, Customer, Product, UnitOfMeasure, Warehouse } from '../pages/api/shared';
import { FinancingRequest, GetFinancing } from '../pages/api/financing';
import { Conversation, Message, MessageSend, PhoneNumbers } from '../pages/api/whatsappagents';
import { Module, Permission, Role, User } from '../pages/api/permissions';
import { Company, ISupplier } from '../pages/api/master';
import { ConfigurationRequest } from '../pages/api/settings';
import { environment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class MasterService {
    constructor(private http: HttpClient) {}

    // =====================================================
    // 🧩 CATEGORÍAS
    // =====================================================

    getCategories(companiaId: number): Observable<ApiResponse<Category[]>> {
        return this.http.get<ApiResponse<Category[]>>(`${environment.apiUrl}Master/GetCategories/${companiaId}`);
    }

    createCategory(model: Category): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${environment.apiUrl}Master/CreateCategory`, model);
    }

    deleteCategory(model: Category): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${environment.apiUrl}Master/DeleteCategory`, { body: model });
    }

    // =====================================================
    // 🏢 BODEGAS
    // =====================================================

    getWarehouses(companiaId: number): Observable<ApiResponse<Warehouse[]>> {
        return this.http.get<ApiResponse<Warehouse[]>>(`${environment.apiUrl}Master/GetWarehouses/${companiaId}`);
    }

    createWarehouse(model: Warehouse): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${environment.apiUrl}Master/CreateWarehouse`, model);
    }

    deleteWarehouse(model: Warehouse): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${environment.apiUrl}Master/DeleteWarehouse`, { body: model });
    }

    // =====================================================
    // 🏢 Unidad de medida
    // =====================================================

    getUnitOfMeasure(): Observable<ApiResponse<UnitOfMeasure[]>> {
        return this.http.get<ApiResponse<UnitOfMeasure[]>>(`${environment.apiUrl}Master/GetUnitsOfMeasure`);
    }

    createUnitOfMeasure(model: UnitOfMeasure): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${environment.apiUrl}Master/CreateUnitOfMeasure`, model);
    }

    deleteUnitOfMeasure(model: UnitOfMeasure): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${environment.apiUrl}Master/DeleteUnitOfMeasure`, { body: model });
    }

    // =====================================================
    // 🏢 Unidad de medida
    // =====================================================

    getClients(companiaId: number): Observable<ApiResponse<Customer[]>> {
        return this.http.get<ApiResponse<Customer[]>>(`${environment.apiUrl}Master/GetClients/${companiaId}`);
    }

    CreateClient(model: Customer): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${environment.apiUrl}Master/CreateClient`, model);
    }

    DeleteClient(model: Customer): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${environment.apiUrl}Master/DeleteClient`, { body: model });
    }

    // =====================================================
    // 🧩 Uusario
    // =====================================================

    getUsers(companiaId: number): Observable<ApiResponse<User[]>> {
        return this.http.get<ApiResponse<User[]>>(`${environment.apiUrl}Master/GetUsers/${companiaId}`);
    }

    createUser(model: User): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${environment.apiUrl}Master/createUser`, model);
    }

    deleteUser(model: User): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${environment.apiUrl}Master/DeleteUser`, { body: model });
    }

    /* Compañias */

    getCompanies(): Observable<ApiResponse<Company[]>> {
        return this.http.get<ApiResponse<Company[]>>(`${environment.apiUrl}Master/GetCompanies`);
    }

    createCompany(model: any): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${environment.apiUrl}Master/CreateCompany`, model);
    }

    // =====================================================
    // ROLES
    // =====================================================

    getRoles(companiaId: number): Observable<ApiResponse<Role[]>> {
        return this.http.get<ApiResponse<Role[]>>(`${environment.apiUrl}Master/GetRoles/${companiaId}`);
    }

    saveRole(model: any): Observable<ApiResponse<number>> {
        return this.http.post<ApiResponse<number>>(`${environment.apiUrl}Master/SaveRole`, model);
    }

    deleteRole(roleId: number): Observable<ApiResponse<boolean>> {
        return this.http.delete<ApiResponse<boolean>>(`${environment.apiUrl}Master/DeleteRole/${roleId}`);
    }

    // =====================================================
    // MODULES
    // =====================================================

    getModules(): Observable<ApiResponse<Module[]>> {
        return this.http.get<ApiResponse<Module[]>>(`${environment.apiUrl}Master/GetModules`);
    }

    // =====================================================
    // PERMISSIONS
    // =====================================================

    getRolePermissions(roleId: number): Observable<ApiResponse<Permission[]>> {
        return this.http.get<ApiResponse<Permission[]>>(`${environment.apiUrl}Master/GetRolePermissions/${roleId}`);
    }

    saveRolePermission(model: any): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${environment.apiUrl}Master/SaveRolePermission`, model);
    }

    deleteRolePermissions(roleId: number): Observable<ApiResponse<boolean>> {
        return this.http.delete<ApiResponse<boolean>>(`${environment.apiUrl}Master/DeleteRolePermissions/${roleId}`);
    }

    // =====================================================
    // 🧩 Proveedor
    // =====================================================

    getSuppliers(companiaId: number): Observable<ApiResponse<ISupplier[]>> {
        return this.http.get<ApiResponse<ISupplier[]>>(`${environment.apiUrl}Master/GetSuppliers/${companiaId}`);
    }

    createSupplier(model: ISupplier): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${environment.apiUrl}Master/CreateSupplier`, model);
    }

    deleteSupplier(model: ISupplier): Observable<ApiResponse<any>> {
        return this.http.request<ApiResponse<any>>('delete', `${environment.apiUrl}Master/DeleteSupplier`, { body: model });
    }

    // =====================================================
    // 🧩 Configuración
    // =====================================================

    getConfiguration(companiaId: number) {
        return this.http.get<ApiResponse<ConfigurationRequest>>(`${environment.apiUrl}Master/GetConfiguration/${companiaId}`);
    }

    saveConfiguration(model: ConfigurationRequest) {
        return this.http.post<ApiResponse<any>>(`${environment.apiUrl}Master/SaveConfiguration`, model);
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
