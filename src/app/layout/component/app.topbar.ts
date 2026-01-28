import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { MasterService } from '../../components/services/master.service';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../components/pages/core/guards/auth.service';
import { LoginService } from '../../components/services/login.service';
import { AuthSession, ICompanySession } from '../../components/pages/api/login';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule],
    providers: [AppConfigurator, MasterService, MessageService],
    template: `
        <div class="flex items-center justify-between w-full h-20 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[999]">
            <div class="flex items-center gap-6">
                <button class="lg:hidden p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 active:scale-95" (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars text-xl text-slate-600"></i>
                </button>

                <div class="relative">
                    <button
                        class="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200 cursor-pointer group"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                            <i class="pi pi-building font-bold text-sm"></i>
                        </div>
                        <div class="flex flex-col items-start leading-tight">
                            <span class="text-[10px] font-black uppercase tracking-tighter text-slate-400">Organización</span>
                            <span class="text-[14px] font-bold text-slate-900 tracking-tight">{{ selectedCompany.compania || 'Seleccionar...' }}</span>
                        </div>
                        <i class="pi pi-chevron-down text-[10px] text-slate-400 ml-2"></i>
                    </button>

                    <div class="hidden absolute top-full left-0 mt-3 w-80 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 z-[1000] ring-1 ring-black/5">
                        <div class="px-4 py-3 mb-1 border-b border-slate-50">
                            <span class="text-[11px] font-black uppercase tracking-widest text-slate-400">Sucursales Disponibles</span>
                        </div>
                        <div class="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                            @for (company of companies; track company.companiaId) {
                                <button (click)="changeCompany(company)" class="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 rounded-xl transition-all group">
                                    <div class="flex flex-col items-start">
                                        <span class="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                                            {{ company.compania }}
                                        </span>
                                        <span class="text-[10px] text-slate-400">NIT: {{ company.nit }}</span>
                                    </div>
                                    <i *ngIf="selectedCompany.companiaId === company.companiaId" class="pi pi-check-circle text-blue-500 text-sm"></i>
                                </button>
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-4">
                <div class="flex items-center gap-1 border-r border-slate-100 pr-4">
                    <button (click)="toggleDarkMode()" class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all duration-200">
                        <i [ngClass]="{ 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }" class="pi text-lg"></i>
                    </button>
                    <button class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all duration-200 relative">
                        <i class="pi pi-bell text-lg"></i>
                        <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                </div>

                <div class="relative">
                    <div
                        class="flex items-center gap-3 pl-2 cursor-pointer group p-1 rounded-2xl hover:bg-slate-50 transition-all duration-200"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <div class="flex flex-col items-end leading-none">
                            <span class="text-[12px] font-black uppercase tracking-tighter text-slate-900">{{ userSession?.firstName }} {{ userSession?.lastName }}</span>
                            <span class="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{{ selectedCompany.rol }}</span>
                        </div>

                        <div class="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-slate-200 group-hover:bg-blue-600 transition-all duration-300 transform group-hover:rotate-3">
                            {{ getInitials(userSession?.firstName, userSession?.lastName) }}
                        </div>
                    </div>

                    <div class="hidden absolute top-full right-0 mt-3 w-56 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 z-[1000] ring-1 ring-black/5">
                        <div class="px-4 py-3 mb-1 border-b border-slate-50">
                            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Mi Cuenta</span>
                        </div>

                        <button class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-all text-slate-600 hover:text-slate-900">
                            <i class="pi pi-user text-sm"></i>
                            <span class="text-sm font-bold">Ver Perfil</span>
                        </button>

                        <button class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-all text-slate-600 hover:text-slate-900">
                            <i class="pi pi-cog text-sm"></i>
                            <span class="text-sm font-bold">Configuración</span>
                        </button>

                        <div class="h-px bg-slate-100 my-1"></div>

                        <button (click)="logout()" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-xl transition-all text-red-500 group">
                            <i class="pi pi-power-off text-sm group-hover:scale-110 transition-transform"></i>
                            <span class="text-sm font-black">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class AppTopbar implements OnInit {
    selectedCompany: ICompanySession = {} as ICompanySession;
    companies: ICompanySession[] = [];
    userSession: AuthSession | null = null;

    constructor(
        public layoutService: LayoutService,
        private masterService: MasterService,
        private messageService: MessageService,
        private authService: AuthService,
        private loginService: LoginService
    ) {}

    ngOnInit(): void {
        const session = this.authService.getSession();
        const companiaId = session ? session.companiaId : 0;
        const userId = session ? session.userId : 0;
        this.userSession = session;
        this.loadCompanies(userId, companiaId);
    }

    loadCompanies(userId: number, companiaId?: number) {
        this.loginService.getPermissionsCompanies(userId).subscribe({
            next: (res) => {
                if (res.code === 200) {
                    this.selectedCompany = res.data?.find((c) => c.companiaId === companiaId) || (res.data ? res.data[0] : ({} as ICompanySession));
                    this.companies = res.data || [];
                }
            }
        });
    }

    changeCompany(company: ICompanySession) {
        this.selectedCompany = company;

        const session = this.authService.getSession() as AuthSession;

        const updatedSession: AuthSession = {
            ...session,
            companiaId: company.companiaId // 🔥 AQUÍ está el cambio real
        };

        console.log('Cambiando compañía a:', company);
        console.log('Nueva sesión:', updatedSession);

        this.authService.setData(updatedSession);

        location.reload(); // opcional
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    logout() {
        // Implementa aquí tu lógica de borrado de sesión
        this.authService.logout(); // Asegúrate de que este método exista en tu AuthService
        window.location.href = '/login';
    }

    getInitials(firstName?: string, lastName?: string): string {
        const n = firstName?.trim().charAt(0).toUpperCase() || '';
        const a = lastName?.trim().charAt(0).toUpperCase() || '';
        return `${n}${a}`;
    }
}
