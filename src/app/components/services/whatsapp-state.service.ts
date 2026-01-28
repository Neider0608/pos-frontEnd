// core/whatsapp/whatsapp-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WhatsappStateService {
    selectedPhoneNumberId$ = new BehaviorSubject<string | null>(null);
    conversations$ = new BehaviorSubject<any[]>([]);
    activeConversationId$ = new BehaviorSubject<string | null>(null);

    setPhoneNumber(id: string) {
        this.selectedPhoneNumberId$.next(id);
    }

    setConversations(data: any[]) {
        this.conversations$.next(data);
    }

    setActiveConversation(id: string | null) {
        this.activeConversationId$.next(id);
    }
}
