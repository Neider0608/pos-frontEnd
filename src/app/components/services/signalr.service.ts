// core/signalr/signalr.service.ts
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SignalrService {
    private apiUrl = 'https://localhost:7197';
    private hubConnection!: signalR.HubConnection;

    messageArrived$ = new Subject<{
        phoneNumberId: string;
        conversationId?: number;
    }>();

    async connect() {
        if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
            return;
        }

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${this.apiUrl}/hubs/whatsapp`, {
                withCredentials: true,
                transport: signalR.HttpTransportType.LongPolling // 🔥 para local
            })
            .withAutomaticReconnect()
            .build();

        this.hubConnection.on('HasNewMessages', (data) => {
            console.log('📩 Evento recibido:', data);
            this.messageArrived$.next(data);
        });

        await this.hubConnection.start();
        console.log('🟢 SignalR conectado');
    }

    async joinPhoneGroup(phoneNumberId: string) {
        await this.connect();
        await this.hubConnection.invoke('JoinPhone', phoneNumberId);
    }

    async leavePhoneGroup(phoneNumberId: string) {
        if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('LeavePhone', phoneNumberId);
        }
    }

    disconnect() {
        if (this.hubConnection) {
            this.hubConnection.stop();
        }
    }
}
