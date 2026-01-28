import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CookieService {
    set(name: string, value: string, days = 1) {
        const expires = new Date();
        expires.setDate(expires.getDate() + days);

        document.cookie = `${name}=${encodeURIComponent(value)};` + `expires=${expires.toUTCString()};` + `path=/;Secure;SameSite=Strict`;
    }

    get(name: string): string | null {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    }

    delete(name: string) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
}
