import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse, Category, Customer, Product, UnitOfMeasure, Warehouse } from '../pages/api/shared';
import { FinancingRequest, GetFinancing } from '../pages/api/financing';
import { Conversation, Message, MessageSend, PhoneNumbers } from '../pages/api/whatsappagents';

@Injectable({ providedIn: 'root' })
export class WhatsappService {
    private apiUrl = 'https://localhost:7197/api/'; // Cambia por tu ruta real

    constructor(private http: HttpClient) {}

    // =====================================================
    // Cargar conversaciones de tods los clientes
    // =====================================================
    getConversations(phoneNumberId?: string): Observable<ApiResponse<Conversation[]>> {
        return this.http.get<ApiResponse<Conversation[]>>(`${this.apiUrl}WhatsApp/GetConversations/${phoneNumberId}`);
    }

    getByPhoneNumbers(): Observable<ApiResponse<PhoneNumbers[]>> {
        return this.http.get<ApiResponse<PhoneNumbers[]>>(`${this.apiUrl}WhatsApp/GetPhoneNumbers`);
    }

    getMessagesByConversationId(conversationId: number): Observable<ApiResponse<Message[]>> {
        return this.http.get<ApiResponse<Message[]>>(`${this.apiUrl}WhatsApp/GetMessagesByConversationId/${conversationId}`);
    }

    sendMessage(payload: FormData): Observable<ApiResponse<number>> {
        return this.http.post<ApiResponse<number>>(`${this.apiUrl}WhatsApp/SendMessage`, payload);
    }

    saveAgent(agenteId: number, configId: number) {
        return this.http.post(`${this.apiUrl}WhatsApp/SaveAgent`, {
            rowidAgente: agenteId,
            rowidConfiguracion: configId
        });
    }

    getAgents(configId: number) {
        return this.http.get<any[]>(`${this.apiUrl}WhatsApp/GetAgents/${configId}`);
    }

    getAgentsByPhoneNumberId(phoneNumberId: string) {
        return this.http.get<any[]>(`${this.apiUrl}WhatsApp/GetAgentsByPhoneNumberId/${phoneNumberId}`);
    }

    deleteAgent(id: number) {
        return this.http.delete(`${this.apiUrl}WhatsApp/DeleteAgent/${id}`);
    }

    assignAgent(payload: any) {
        console.log('Assigning agent with payload:', payload);
        return this.http.post(`${this.apiUrl}WhatsApp/AssignAgent`, payload);
    }
}
