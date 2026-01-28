import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { LoginService } from '../../components/services/login.service';
import { Permission } from '../../components/pages/api/permissions';
import { AuthService } from '../../components/pages/core/guards/auth.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    providers: [LoginService],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];
    MODULE_MAP: Record<string, string> = {
        POS: 'Punto de Venta',
        PURCHASES: 'Compras',
        INVENTORY: 'Inventario',
        LOW_STOCK: 'Stock Bajo',
        SUPPLIERS: 'Proveedores',
        PROMOTIONS: 'Promociones',
        REPORTS: 'Informes & KPIs',
        CASH: 'Caja & Contabilidad',
        FINANCING: 'Financiaciones',
        INVOICES: 'Facturas',

        COMPANIES: 'Compañias',
        CATEGORIES: 'Categorías',
        WAREHOUSES: 'Bodegas',
        CUSTOMERS: 'Clientes',
        PERMISSIONS: 'Permisos',
        SETTINGS: 'Configuración',

        AGENTS: 'Agentes',
        WHATSAPP_CHATS: 'Chats'
    };

    constructor(
        private loginService: LoginService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        const session = this.authService.getSession();

        const userId = session ? session.userId : 0;
        const companiaId = session ? session.companiaId : 0;
        this.loginService.getPermissions(userId, companiaId).subscribe({
            next: (permissions) => {
                this.buildMenu(permissions.data || []);
            }
        });
        /* 
        this.model = [
            {
                label: 'Menú',
                items: [
                    { label: 'Punto de Venta', icon: 'pi pi-shopping-cart', routerLink: ['/pages/pos'] },
                    { label: 'Compras', icon: 'pi pi-shopping-bag', routerLink: ['/pages/purchases'] },

                    { label: 'Inventario', icon: 'pi pi-box', routerLink: ['/pages/inventory'] },
                    { label: 'Stock Bajo', icon: 'pi pi-exclamation-triangle', routerLink: ['/pages/low-stock'] },
                    { label: 'Proveedores', icon: 'pi pi-truck', routerLink: ['/pages/suppliers'] },

                    { label: 'Promociones', icon: 'pi pi-tag', routerLink: ['/pages/promotions'] },
                    { label: 'Informes & KPIs', icon: 'pi pi-chart-bar', routerLink: ['/pages/reports'] },
                    { label: 'Caja & Contabilidad', icon: 'pi pi-calculator', routerLink: ['/pages/cash-module'] },


                    { label: 'Financiaciones', icon: 'pi pi-wallet', routerLink: ['/pages/financing'] },
                    { label: 'Facturas', icon: 'pi pi-shopping-cart', routerLink: ['/pages/invoices'] }
                ]
            },
            {
                label: 'Maestros',
                items: [
                    { label: 'Compañias', icon: 'pi pi-briefcase', routerLink: ['/pages/company'] },
                    { label: 'Categorías', icon: 'pi pi-tags', routerLink: ['/pages/category'] },
                    { label: 'Bodegas', icon: 'pi pi-building', routerLink: ['/pages/warehouse'] },
                    { label: 'Clientes', icon: 'pi pi-users', routerLink: ['/pages/customers'] },
                    { label: 'Permisos', icon: 'pi pi-shield', routerLink: ['/pages/permissions'] },
                    { label: 'Configuración', icon: 'pi pi-cog', routerLink: ['/pages/settings'] }
                ]
            },
            {
                label: 'Whatsapp Multiagente',
                items: [
                    { label: 'Agentes', icon: 'pi pi-tags', routerLink: ['/pages/agents'] },
                    { label: 'Chats', icon: 'pi pi-whatsapp', routerLink: ['/pages/whatsapp-chats'] }
                ]
            }
        ]; */
    }

    private canView(moduleName: string, permissions: Permission[]): boolean {
        debugger;
        return permissions.some((p) => this.normalize(p.module) === this.normalize(moduleName) && p.canView);
    }

    private buildMenu(permissions: Permission[]) {
        this.model = [
            {
                label: 'Menú',
                items: [
                    this.canView('Punto de Venta', permissions) && {
                        label: 'Punto de Venta',
                        icon: 'pi pi-shopping-cart',
                        routerLink: ['/pages/pos']
                    },
                    this.canView('Compras', permissions) && {
                        label: 'Compras',
                        icon: 'pi pi-shopping-bag',
                        routerLink: ['/pages/purchases']
                    },
                    this.canView('Inventario', permissions) && {
                        label: 'Inventario',
                        icon: 'pi pi-box',
                        routerLink: ['/pages/inventory']
                    },
                    this.canView('Stock Bajo', permissions) && {
                        label: 'Stock Bajo',
                        icon: 'pi pi-exclamation-triangle',
                        routerLink: ['/pages/low-stock']
                    },
                    this.canView('Proveedores', permissions) && {
                        label: 'Proveedores',
                        icon: 'pi pi-truck',
                        routerLink: ['/pages/suppliers']
                    },
                    this.canView('Promociones', permissions) && {
                        label: 'Promociones',
                        icon: 'pi pi-tag',
                        routerLink: ['/pages/promotions']
                    },
                    this.canView('Informes & KPIs', permissions) && {
                        label: 'Informes & KPIs',
                        icon: 'pi pi-chart-bar',
                        routerLink: ['/pages/reports']
                    },
                    this.canView('Caja & Contabilidad', permissions) && {
                        label: 'Caja & Contabilidad',
                        icon: 'pi pi-calculator',
                        routerLink: ['/pages/cash-module']
                    },
                    this.canView('Financiaciones', permissions) && {
                        label: 'Financiaciones',
                        icon: 'pi pi-wallet',
                        routerLink: ['/pages/financing']
                    },
                    this.canView('Facturas', permissions) && {
                        label: 'Facturas',
                        icon: 'pi pi-shopping-cart',
                        routerLink: ['/pages/invoices']
                    }
                ].filter(Boolean) as MenuItem[]
            },
            {
                label: 'Maestros',
                items: [
                    this.canView('Compañías', permissions) && {
                        label: 'Compañias',
                        icon: 'pi pi-briefcase',
                        routerLink: ['/pages/company']
                    },
                    this.canView('Categorías', permissions) && {
                        label: 'Categorías',
                        icon: 'pi pi-tags',
                        routerLink: ['/pages/category']
                    },
                    this.canView('Bodegas', permissions) && {
                        label: 'Bodegas',
                        icon: 'pi pi-building',
                        routerLink: ['/pages/warehouse']
                    },
                    this.canView('Clientes', permissions) && {
                        label: 'Clientes',
                        icon: 'pi pi-users',
                        routerLink: ['/pages/customers']
                    },
                    this.canView('Permisos', permissions) && {
                        label: 'Permisos',
                        icon: 'pi pi-shield',
                        routerLink: ['/pages/permissions']
                    },
                    this.canView('Configuración', permissions) && {
                        label: 'Configuración',
                        icon: 'pi pi-cog',
                        routerLink: ['/pages/settings']
                    }
                ].filter(Boolean) as MenuItem[]
            },
            {
                label: 'Whatsapp Multiagente',
                items: [
                    this.canView('Agentes', permissions) && {
                        label: 'Agentes',
                        icon: 'pi pi-tags',
                        routerLink: ['/pages/agents']
                    },
                    this.canView('Chats', permissions) && {
                        label: 'Chats',
                        icon: 'pi pi-whatsapp',
                        routerLink: ['/pages/whatsapp-chats']
                    }
                ].filter(Boolean) as MenuItem[]
            }
        ].filter((group) => group.items.length > 0);
    }

    private normalize(value: string): string {
        return value.trim().toLowerCase();
    }
}
