// core/signalr/signalr.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class SignalrService implements OnDestroy {
    private hubConnection!: signalR.HubConnection;
    private connectionAttempts = 0;
    private maxConnectionAttempts = 5;

    messageArrived$ = new Subject<{
        phoneNumberId: string;
        conversationId?: number;
    }>();

    async connect(): Promise<boolean> {
        if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
            return true;
        }

        try {
            const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
            this.hubConnection = new signalR.HubConnectionBuilder()
                .withUrl(`${baseUrl}/hubs/whatsapp`, {
                    withCredentials: true,
                    transport: signalR.HttpTransportType.LongPolling
                })
                .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
                .configureLogging(signalR.LogLevel.Warning)
                .build();

            this.registerEvents();

            await this.hubConnection.start();
            this.connectionAttempts = 0;
            return true;
        } catch (error) {
            this.connectionAttempts++;
            console.error('❌ SignalR connection failed:', error);
            const errMessage = error instanceof Error ? error.message : String(error || '');
            if (errMessage.includes('404')) {
                console.error('SignalR endpoint no encontrado. Verifica la ruta /hubs/whatsapp en backend.');
                return false;
            }
            if (this.connectionAttempts < this.maxConnectionAttempts) {
                console.log(`🔄 Retry attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
                await new Promise((resolve) => setTimeout(resolve, 2000));
                return this.connect();
            }
            return false;
        }
    }

    private registerEvents(): void {
        this.hubConnection.on('HasNewMessages', (data) => {
            this.messageArrived$.next(data);
        });

        this.hubConnection.onreconnecting((error) => {
            console.warn('⚠️ SignalR reconnecting:', error);
        });

        this.hubConnection.onreconnected((connectionId) => {
            console.log('🟢 SignalR reconnected:', connectionId);
        });

        this.hubConnection.onclose((error) => {
            console.error('🔴 SignalR disconnected:', error);
        });
    }

    private unregisterEvents(): void {
        if (this.hubConnection) {
            this.hubConnection.off('HasNewMessages');
        }
    }

    async joinPhoneGroup(phoneNumberId: string): Promise<void> {
        await this.connect();
        if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('JoinPhone', phoneNumberId);
        }
    }

    async leavePhoneGroup(phoneNumberId: string): Promise<void> {
        if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('LeavePhone', phoneNumberId);
        }
    }

    disconnect(): void {
        this.unregisterEvents();
        if (this.hubConnection) {
            this.hubConnection.stop().catch((err) => console.error('Error stopping connection:', err));
        }
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}
