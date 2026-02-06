import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { CompanyData, ConfigurationRequest, NotificationsSettings } from '../../api/settings';
import { MasterService } from '../../../services/master.service';
import { AuthSession } from '../../api/login';
import { AuthService } from '../../core/guards/auth.service';
import { Permission } from '../../api/permissions';
import { LoginService } from '../../../services/login.service';

interface PrinterSettings {
    width: number;
    marginTop: number;
    copies: number;
    port: string;
}

interface AISettings {
    geminiKey: string;
    autoCategorize: boolean;
    salesAnalysis: boolean;
}

interface DigitalOceanSettings {
    accessKey: string;
    secretKey: string;
    serviceUrl: string;
    bucketName: string;
}

@Component({
    selector: 'app-settings',
    imports: [CommonModule, FormsModule, CardModule, ButtonModule, InputTextModule, InputSwitchModule, DropdownModule, TabViewModule, ToastModule],
    providers: [MessageService, MasterService, AuthService],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
    // --- Estados de UI ---
    showApiKey: boolean = false;
    userMariaActive: boolean = true;
    userCarlosActive: boolean = false;
    companiaId: number = 0;
    userId: number = 0;
    showSecretKey: boolean = false;
    // --- Datos de Empresa ---
    companyData = {
        companyName: 'Mi Empresa S.A.S',
        taxId: '900.123.456-7',
        email: 'admin@empresa.com',
        phone: '+57 300 123 4567',
        address: 'Calle 10 #43-21, Medellín'
    };

    // --- Notificaciones ---
    notifications = {
        lowStock: true,
        dailyReports: false
    };

    // --- NUEVO: Configuración de Impresora ---
    printerSettings: PrinterSettings = {
        width: 80,
        marginTop: 0,
        copies: 1,
        port: 'USB001'
    };

    // --- NUEVO: Configuración de Gemini AI ---
    aiSettings: AISettings = {
        geminiKey: '',
        autoCategorize: true,
        salesAnalysis: true
    };

    digitalOcean: DigitalOceanSettings = {
        accessKey: '',
        secretKey: '',
        serviceUrl: '',
        bucketName: ''
    };

    permissions: Permission[] = [];

    canView = false;
    canCreate = false;
    canEdit = false;
    canDelete = false;
    canExport = false;
    constructor(
        private masterService: MasterService,
        private messageService: MessageService,
        private authService: AuthService,
        private loginService: LoginService
    ) {}

    ngOnInit(): void {
        const session = this.authService.getSession() as AuthSession;

        if (!session) {
            this.resetPermissions();
            return;
        }

        const { userId, companiaId } = session;

        this.loginService.getPermissions(userId, companiaId).subscribe({
            next: (permissions) => {
                this.permissions = permissions.data ?? [];
                this.applyPermissions();
            },
            error: () => this.resetPermissions()
        });

        this.companiaId = session.companiaId;
        this.userId = session.userId;
        this.loadSettings();
    }

    private applyPermissions(): void {
        const moduleName = 'Configuración';

        const permission = this.permissions.find((p) => p.module === moduleName);

        if (!permission) {
            this.resetPermissions();
            return;
        }

        this.canView = permission.canView;
        this.canCreate = permission.canCreate;
        this.canEdit = permission.canEdit;
        this.canDelete = permission.canDelete;
        this.canExport = permission.canExport;
    }

    private resetPermissions(): void {
        this.canView = false;
        this.canCreate = false;
        this.canEdit = false;
        this.canDelete = false;
        this.canExport = false;
    }

    private buildRequest(): ConfigurationRequest {
        return {
            companyId: this.companiaId,
            printerWidthMM: this.printerSettings.width,
            printerTopMargin: this.printerSettings.marginTop,
            printerCopies: this.printerSettings.copies,
            printerPort: this.printerSettings.port,
            geminiApiKey: this.aiSettings.geminiKey,
            notifyLowStock: this.notifications.lowStock,
            notifyDailyReports: this.notifications.dailyReports,
            accessKey: this.digitalOcean.accessKey,
            secretKey: this.digitalOcean.secretKey,
            serviceUrl: this.digitalOcean.serviceUrl,
            bucketName: this.digitalOcean.bucketName
        };
    }

    private showSuccess(detail: string) {
        this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail,
            life: 3000
        });
    }

    private showError(detail: string) {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail
        });
    }

    handleSavePrinter() {
        console.log('Guardando configuración de IA:', this.buildRequest());
        this.masterService.saveConfiguration(this.buildRequest()).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.showSuccess('Configuración de impresora guardada.');
                } else {
                    this.showError(res.message);
                }
            },
            error: () => {
                this.showError('Error al guardar configuración de impresora.');
            }
        });
    }

    loadSettings() {
        this.masterService.getConfiguration(this.companiaId).subscribe({
            next: (res) => {
                if (res.code === 0 && res.data) {
                    this.printerSettings = {
                        width: res.data.printerWidthMM,
                        marginTop: res.data.printerTopMargin,
                        copies: res.data.printerCopies,
                        port: res.data.printerPort
                    };

                    this.aiSettings.geminiKey = res.data.geminiApiKey;

                    this.digitalOcean = {
                        accessKey: res.data.accessKey,
                        secretKey: res.data.secretKey,
                        serviceUrl: res.data.serviceUrl,
                        bucketName: res.data.bucketName
                    };

                    this.notifications = {
                        lowStock: res.data.notifyLowStock,
                        dailyReports: res.data.notifyDailyReports
                    };
                }
            },
            error: () => {
                this.showError('No se pudo cargar la configuración.');
            }
        });
    }

    handleSaveAI() {
        if (!this.aiSettings.geminiKey || this.aiSettings.geminiKey.length < 20) {
            this.showError('La API Key de Gemini no es válida.');
            return;
        }

        console.log('Guardando configuración de IA:', this.buildRequest());

        this.masterService.saveConfiguration(this.buildRequest()).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.showSuccess('Configuración de IA guardada correctamente.');
                } else {
                    this.showError(res.message);
                }
            },
            error: () => {
                this.showError('Error al guardar configuración de IA.');
            }
        });
    }
}
