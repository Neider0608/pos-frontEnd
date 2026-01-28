import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStorageService } from './auth-storage.service';

export const authGuard: CanActivateFn = () => {
    const storage = inject(AuthStorageService);
    const router = inject(Router);

    if (!storage.getSession()) {
        router.navigate(['/login']);
        return false;
    }
    return true;
};
