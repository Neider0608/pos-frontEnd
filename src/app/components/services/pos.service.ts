import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, Category, Customer, Product, UnitOfMeasure, Warehouse } from '../pages/api/shared';
import { FinancingRequest, GetFinancing } from '../pages/api/financing';
import { Conversation, Message, MessageSend, PhoneNumbers } from '../pages/api/whatsappagents';
import { IInvoiceClients, Promotion, StockReservationRequest, StockReservationResponse } from '../pages/api/pos';
import { environment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class PosService {
    constructor(private http: HttpClient) {}

    // =====================================================
    // 🧠 UTILIDAD GENERAL
    // =====================================================
    createInvoice(invoice: any) {
        return this.http.post<ApiResponse<any>>(`${environment.apiUrl}pos/CreateInvoice`, invoice);
    }
    getInvoices(startDate: Date, endDate: Date, companyId: number): Observable<ApiResponse<IInvoiceClients[]>> {
        return this.http.get<ApiResponse<IInvoiceClients[]>>(`${environment.apiUrl}pos/GetInvoicesAll/${startDate.toISOString()}/${endDate.toISOString()}/${companyId}`);
    }
    getInvoiceDetail(invoiceId: number, companyId: number): Observable<ApiResponse<IInvoiceClients>> {
        return this.http.get<ApiResponse<IInvoiceClients>>(`${environment.apiUrl}pos/GetInvoiceDetail/${invoiceId}/${companyId}`);
    }
    cancelInvoice(invoiceId?: number, companyId?: number): Observable<ApiResponse<IInvoiceClients>> {
        return this.http.get<ApiResponse<IInvoiceClients>>(`${environment.apiUrl}pos/CancelInvoice/${invoiceId}/${companyId}`);
    }

    // =====================================================
    // 🧠 Financiacion
    // =====================================================

    // =====================================================
    // 🏢 Unidad de medida
    // =====================================================

    // =====================================================
    // 💰 Financiaciones
    // =====================================================

    getFinancings(): Observable<ApiResponse<GetFinancing[]>> {
        return this.http.get<ApiResponse<GetFinancing[]>>(`${environment.apiUrl}pos/GetFinancings`);
    }

    // =====================================================
    // 💳 Pagos de una financiación específica
    // =====================================================
    getFinancingPayments(financingId: number): Observable<ApiResponse<GetFinancing[]>> {
        const params = new HttpParams().set('option', 'get_payments').set('id', financingId);
        return this.http.get<ApiResponse<GetFinancing[]>>(`${environment.apiUrl}pos/GetFinancingPayments`, { params });
    }

    // =====================================================
    // 💵 Registrar nuevo abono / pago
    // =====================================================
    addFinancingPayment(model: FinancingRequest): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${environment.apiUrl}pos/AddPayment`, model);
    }

    // =====================================================
    // ✅ Generar Paz y Salvo
    // =====================================================
    generateClearance(model: FinancingRequest): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${environment.apiUrl}pos/GenerateClearance`, model);
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

    validateAndReserveStock(payload: StockReservationRequest) {
        return this.http.post<ApiResponse<StockReservationResponse>>(`${environment.apiUrl}pos/ValidateAndReserve`, payload);
    }

    cancelInvoiceReservations(payload: StockReservationRequest) {
        return this.http.post<ApiResponse<any>>(`${environment.apiUrl}pos/CancelReservation`, payload);
    }

    cancelInvoiceAll(facturaTempId: string | undefined, companiaId: number | undefined): Observable<ApiResponse<any>> | null {
        if (!facturaTempId || companiaId === undefined || companiaId === null) {
            console.error('cancelInvoiceAll: facturaTempId y companiaId son requeridos');
            return null;
        }
        return this.http.get<ApiResponse<any>>(`${environment.apiUrl}pos/CancelInvoiceAll/${facturaTempId}/${companiaId}`);
    }

    getPromotions(companiaId: number) {
        return this.http.get<ApiResponse<Promotion[]>>(`${environment.apiUrl}pos/GetPromotions/${companiaId}`);
    }
}
