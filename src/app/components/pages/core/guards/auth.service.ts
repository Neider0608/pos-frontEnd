import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { AuthStorageService } from './auth-storage.service';
import { AuthSession } from '../../api/login';
import { ApiResponse } from '../../api/shared';
import { LoginService } from '../../../services/login.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private apiUrl = 'https://localhost:7197/api/auth';

    constructor(
        private http: HttpClient,
        private storage: AuthStorageService,
        private loginService: LoginService
    ) {}

    setData(data: any) {
        this.storage.setSession(data);
    }

    logout(): void {
        this.storage.clear();
    }

    isAuthenticated(): boolean {
        return !!this.storage.getSession();
    }

    getSession(): AuthSession | null {
        return this.storage.getSession();
    }
}
