import { Component, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AppTopbar } from './app.topbar';
import { AppSidebar } from './app.sidebar';
import { AppFooter } from './app.footer';
import { LayoutService } from '../service/layout.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, AppTopbar, AppSidebar, RouterModule, AppFooter],
    template: `
        <div [class.dark-layout]="layoutService.isDarkTheme()" class="fixed inset-0 w-screen h-screen bg-[#F8FAFC] flex overflow-hidden font-sans antialiased text-slate-900 transition-colors duration-300">
            <aside class="w-80 h-full bg-[#F8FAFC] border-r border-slate-200 flex flex-col flex-none z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] side-container">
                <div class="h-20 flex items-center px-8 bg-white border-b border-slate-100 flex-none header-brand">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 icon-box">
                            <i class="pi pi-bolt text-white text-xl"></i>
                        </div>
                        <span class="text-2xl font-black tracking-tighter uppercase brand-text"> NEIDSOFT <span class="text-blue-600">POS</span> </span>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto py-8 custom-scrollbar">
                    <app-sidebar></app-sidebar>
                </div>
            </aside>

            <div class="flex-1 flex flex-col min-w-0 h-full relative">
                <header class="h-20 flex-none px-8 flex items-center border-b border-slate-100 bg-white z-20 top-header">
                    <app-topbar class="w-full"></app-topbar>
                </header>

                <main class="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar main-content">
                    <div class="p-6 lg:p-12 w-full max-w-[1600px] mx-auto min-h-full">
                        <router-outlet></router-outlet>
                    </div>

                    <footer class="py-10 border-t border-slate-200/50 bg-[#F8FAFC] px-12 main-footer">
                        <app-footer></app-footer>
                    </footer>
                </main>
            </div>
        </div>

        <style>
            /* TU ESTRUCTURA ORIGINAL INTACTA */
            :host ::ng-deep .layout-wrapper,
            :host ::ng-deep .layout-main-container,
            :host ::ng-deep .layout-sidebar,
            :host ::ng-deep .layout-mask {
                all: unset !important;
                display: contents !important;
                background-color: transparent !important;
            }

            :host ::ng-deep body {
                background-color: #f8fafc !important;
            }

            :host ::ng-deep .layout-menuitem-root-text {
                font-size: 0.85rem !important;
                text-transform: uppercase !important;
                letter-spacing: 0.25em !important;
                font-weight: 900 !important;
                color: #1e293b !important;
                margin: 2.5rem 2rem 1rem 2rem !important;
                display: block;
            }

            :host ::ng-deep .layout-menu ul a {
                margin: 0.4rem 1.25rem !important;
                border-radius: 16px !important;
                padding: 1.1rem 1.5rem !important;
                color: #475569 !important;
                font-size: 1.1rem !important;
                font-weight: 700 !important;
                transition: all 0.2s ease !important;
            }

            :host ::ng-deep .active-route {
                background-color: #ffffff !important;
                color: #2563eb !important;
                font-weight: 900 !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
                border: 1px solid #e2e8f0 !important;
            }

            :host ::ng-deep .layout-menuitem-icon {
                font-size: 1.5rem !important;
                margin-right: 1.25rem !important;
            }

            .custom-scrollbar::-webkit-scrollbar {
                width: 5px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #e2e8f0;
                border-radius: 10px;
            }

            /* --- SOPORTE DARK MODE (SIN DAÑAR NADA) --- */

            .dark-layout {
                background-color: #0f172a !important;
                color: #f1f5f9 !important;
            }

            /* Fondos del sidebar y contenido en Dark */
            .dark-layout .side-container,
            .dark-layout .main-content,
            .dark-layout .main-footer {
                background-color: #0f172a !important;
                border-color: #1e293b !important;
            }

            /* Cabeceras blancas que ahora deben ser oscuras */
            .dark-layout .header-brand,
            .dark-layout .top-header {
                background-color: #1e293b !important;
                border-color: #334155 !important;
            }

            /* Texto del menú en Dark */
            .dark-layout ::ng-deep .layout-menuitem-root-text {
                color: #94a3b8 !important;
            }
            .dark-layout ::ng-deep .layout-menu ul a {
                color: #94a3b8 !important;
            }
            .dark-layout .brand-text {
                color: #ffffff !important;
            }

            /* El botón activo en Dark Mode */
            .dark-layout ::ng-deep .active-route {
                background-color: #2563eb !important;
                color: #ffffff !important;
                border-color: #2563eb !important;
                box-shadow: 0 4px 20px rgba(37, 99, 235, 0.2) !important;
            }

            .dark-layout .icon-box {
                shadow: none !important;
            }
        </style>
    `
})
export class AppLayout {
    constructor(
        public layoutService: LayoutService,
        public renderer: Renderer2,
        public router: Router
    ) {}

    get containerClass() {
        return { 'layout-static': true };
    }
}
