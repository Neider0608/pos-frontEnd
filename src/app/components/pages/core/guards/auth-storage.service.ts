import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { AuthSession } from '../../api/login';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
    private readonly KEY = 'pos_session';
    private readonly SECRET_KEY = 'NEIDSOFT_SECRET_2026';

    setSession(session: AuthSession): void {
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(session), this.SECRET_KEY).toString();

        document.cookie = `${this.KEY}=${encrypted}; path=/; max-age=86400; SameSite=Lax`;
    }

    getSession(): AuthSession | null {
        const cookie = document.cookie.split('; ').find((c) => c.startsWith(this.KEY + '='));

        if (!cookie) return null;

        try {
            const encrypted = cookie.split('=')[1];
            const bytes = CryptoJS.AES.decrypt(encrypted, this.SECRET_KEY);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);

            return JSON.parse(decrypted);
        } catch {
            return null;
        }
    }

    clear(): void {
        document.cookie = `${this.KEY}=; path=/; max-age=0`;
    }
}
