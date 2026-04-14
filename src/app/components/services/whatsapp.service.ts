import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../pages/api/shared';
import { Conversation, Message, MessageSend, PhoneNumbers, WhatsAppAgent, AgentAssignmentPayload } from '../pages/api/whatsappagents';
import { environment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class WhatsappService {
    constructor(private http: HttpClient) {}

    // =====================================================
    // Cargar conversaciones de todos los clientes
    // =====================================================
    getConversations(phoneNumberId: string, startDate: Date, endDate: Date): Observable<ApiResponse<Conversation[]>> {
        const start = this.formatDateParam(startDate);
        const end = this.formatDateParam(endDate);
        return this.http.get<ApiResponse<Conversation[]>>(`${environment.apiUrl}WhatsApp/GetConversations/${phoneNumberId}/${start}/${end}`);
    }

    private formatDateParam(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getByPhoneNumbers(): Observable<ApiResponse<PhoneNumbers[]>> {
        return this.http.get<ApiResponse<PhoneNumbers[]>>(`${environment.apiUrl}WhatsApp/GetPhoneNumbers`);
    }

    getMessagesByConversationId(conversationId: number): Observable<ApiResponse<Message[]>> {
        return this.http.get<ApiResponse<Message[]>>(`${environment.apiUrl}WhatsApp/GetMessagesByConversationId/${conversationId}`);
    }

    sendMessage(payload: FormData): Observable<ApiResponse<number>> {
        return this.http.post<ApiResponse<number>>(`${environment.apiUrl}WhatsApp/SendMessage`, payload);
    }

    saveAgent(agenteId: number, configId: number): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${environment.apiUrl}WhatsApp/SaveAgent`, {
            rowidAgente: agenteId,
            rowidConfiguracion: configId
        });
    }

    getAgents(configId: number): Observable<ApiResponse<WhatsAppAgent[]>> {
        return this.http.get<ApiResponse<WhatsAppAgent[]>>(`${environment.apiUrl}WhatsApp/GetAgents/${configId}`);
    }

    getAgentsByPhoneNumberId(phoneNumberId: string): Observable<ApiResponse<WhatsAppAgent[]>> {
        return this.http.get<ApiResponse<WhatsAppAgent[]>>(`${environment.apiUrl}WhatsApp/GetAgentsByPhoneNumberId/${phoneNumberId}`);
    }

    deleteAgent(id: number): Observable<ApiResponse<boolean>> {
        return this.http.delete<ApiResponse<boolean>>(`${environment.apiUrl}WhatsApp/DeleteAgent/${id}`);
    }

    assignAgent(payload: AgentAssignmentPayload): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${environment.apiUrl}WhatsApp/AssignAgent`, payload);
    }

    updateConversationStatus(conversationId: number, status: string): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${environment.apiUrl}WhatsApp/UpdateConversationStatus/${conversationId}/${status}`, {});
    }

    updateClientName(phoneNumberId: number, clientName: string): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${environment.apiUrl}WhatsApp/UpdateClientName`, {
            phoneNumberId,
            clientName
        });
    }
}
