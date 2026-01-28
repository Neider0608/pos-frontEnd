import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Notfound } from './app/components/notfound/notfound';

import { Login } from './app/components/auth/login';
import { InitialSetupComponent } from './app/components/pages/master/initial-setup/initial-setup.component';
import { authGuard } from './app/components/pages/core/guards/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [{ path: 'pages', loadChildren: () => import('./app/components/pages/pages.routes') }]
    },
    { path: 'setup', component: InitialSetupComponent },
    { path: 'notfound', component: Notfound },
    { path: 'login', component: Login },
    { path: '**', redirectTo: '/notfound' }
    /*  { path: 'auth', loadChildren: () => import('./app/components/auth/auth.routes') },
     */
];
