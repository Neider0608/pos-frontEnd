import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({ providedIn: 'root' })
export class SecurityService {
    private secretKey = 'NEIDSOFT_POS_2026'; // muévela a environment

    encrypt(data: any): string {
        return CryptoJS.AES.encrypt(JSON.stringify(data), this.secretKey).toString();
    }

    decrypt(cipherText: string): any {
        const bytes = CryptoJS.AES.decrypt(cipherText, this.secretKey);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    }
}
