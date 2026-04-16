import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { ApiResponse } from '../pages/api/shared';
import { CashDashboardSummary, CashFlowPoint, CashMovementRow, ExportFormat, ExportSection, FinancialSummary, FinancingReportRow, PagedResponse, PaymentMixItem, PurchaseReportRow, ReportFilters, SalesReportRow } from '../pages/api/reports';

@Injectable({ providedIn: 'root' })
export class ReportsService {
    constructor(private http: HttpClient) {}

    getFinancialSummary(filters: ReportFilters): Observable<ApiResponse<FinancialSummary>> {
        return this.http.get<ApiResponse<FinancialSummary>>(`${environment.apiUrl}Reports/GetFinancialSummary`, {
            params: this.buildFilterParams(filters)
        });
    }

    getCashFlow(filters: ReportFilters): Observable<ApiResponse<CashFlowPoint[]>> {
        return this.http.get<ApiResponse<CashFlowPoint[]>>(`${environment.apiUrl}Reports/GetCashFlow`, {
            params: this.buildFilterParams(filters)
        });
    }

    getSalesReport(filters: ReportFilters, page = 1, pageSize = 50): Observable<ApiResponse<PagedResponse<SalesReportRow>>> {
        return this.http.get<ApiResponse<PagedResponse<SalesReportRow>>>(`${environment.apiUrl}Reports/GetSales`, {
            params: this.buildFilterParams(filters).set('page', String(page)).set('pageSize', String(pageSize))
        });
    }

    getPurchasesReport(filters: ReportFilters, page = 1, pageSize = 50): Observable<ApiResponse<PagedResponse<PurchaseReportRow>>> {
        return this.http.get<ApiResponse<PagedResponse<PurchaseReportRow>>>(`${environment.apiUrl}Reports/GetPurchases`, {
            params: this.buildFilterParams(filters).set('page', String(page)).set('pageSize', String(pageSize))
        });
    }

    getFinancingReport(filters: ReportFilters): Observable<ApiResponse<FinancingReportRow[]>> {
        return this.http.get<ApiResponse<FinancingReportRow[]>>(`${environment.apiUrl}Reports/GetFinancing`, {
            params: this.buildFilterParams(filters)
        });
    }

    getCashDashboardSummary(filters: ReportFilters): Observable<ApiResponse<CashDashboardSummary>> {
        return this.http.get<ApiResponse<CashDashboardSummary>>(`${environment.apiUrl}Reports/GetCashDashboardSummary`, {
            params: this.buildFilterParams(filters)
        });
    }

    getPaymentMix(filters: ReportFilters): Observable<ApiResponse<PaymentMixItem[]>> {
        return this.http.get<ApiResponse<PaymentMixItem[]>>(`${environment.apiUrl}Reports/GetPaymentMix`, {
            params: this.buildFilterParams(filters)
        });
    }

    getRecentCashMovements(filters: ReportFilters): Observable<ApiResponse<CashMovementRow[]>> {
        return this.http.get<ApiResponse<CashMovementRow[]>>(`${environment.apiUrl}Reports/GetRecentCashMovements`, {
            params: this.buildFilterParams(filters)
        });
    }

    exportReport(filters: ReportFilters, section: ExportSection, format: ExportFormat): Observable<Blob> {
        const params = this.buildFilterParams(filters).set('section', section).set('format', format);

        return this.http.get(`${environment.apiUrl}Reports/Export`, {
            params,
            responseType: 'blob'
        });
    }

    private buildFilterParams(filters: ReportFilters): HttpParams {
        let params = new HttpParams().set('companiaId', filters.companiaId).set('startDate', this.toDateParam(filters.startDate)).set('endDate', this.toDateParam(filters.endDate));

        if (filters.userId !== undefined && filters.userId !== null) {
            params = params.set('userId', filters.userId);
        }

        if (filters.estadoId !== undefined && filters.estadoId !== null) {
            params = params.set('estadoId', filters.estadoId);
        }

        return params;
    }

    private toDateParam(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
