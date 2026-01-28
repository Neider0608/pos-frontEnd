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
import { CompanyData, NotificationsSettings, PrinterSettings } from '../../api/settings';

@Component({
    selector: 'app-settings',
    imports: [CommonModule, FormsModule, CardModule, ButtonModule, InputTextModule, InputSwitchModule, DropdownModule, TabViewModule, ToastModule],
    providers: [MessageService],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
    companyData: CompanyData = {
        companyName: '',
        businessType: '',
        address: '',
        phone: '',
        email: '',
        taxId: '',
        ownerName: '',
        currency: 'USD',
        timezone: 'America/Bogota'
    };

    notifications: NotificationsSettings = {
        lowStock: true,
        dailyReports: false,
        salesAlerts: true,
        systemUpdates: true
    };

    printerSettings: PrinterSettings = {
        receiptPrinter: 'default',
        paperSize: '80mm',
        printLogo: true,
        printFooter: true
    };

    // For the 'Users' tab example
    userMariaActive: boolean = true;
    userCarlosActive: boolean = false;

    currencyOptions = [
        { label: 'USD - Dólar', value: 'USD' },
        { label: 'COP - Peso Colombiano', value: 'COP' },
        { label: 'EUR - Euro', value: 'EUR' }
    ];

    timezoneOptions = [
        { label: 'Bogotá (GMT-5)', value: 'America/Bogota' },
        { label: 'México (GMT-6)', value: 'America/Mexico_City' },
        { label: 'Nueva York (GMT-5)', value: 'America/New_York' }
    ];

    receiptPrinterOptions = [
        { label: 'Impresora Predeterminada', value: 'default' },
        { label: 'Impresora Térmica', value: 'thermal' },
        { label: 'Impresora de Red', value: 'network' }
    ];

    paperSizeOptions = [
        { label: '58mm', value: '58mm' },
        { label: '80mm', value: '80mm' },
        { label: 'A4', value: 'A4' }
    ];

    constructor(private messageService: MessageService) {}

    ngOnInit() {
        // Cargar configuración guardada al inicializar el componente
        const savedCompanyConfig = localStorage.getItem('pos-company');
        if (savedCompanyConfig) {
            this.companyData = JSON.parse(savedCompanyConfig);
        }

        const savedNotificationsConfig = localStorage.getItem('pos-notifications');
        if (savedNotificationsConfig) {
            this.notifications = JSON.parse(savedNotificationsConfig);
        }

        const savedPrinterConfig = localStorage.getItem('pos-printer');
        if (savedPrinterConfig) {
            this.printerSettings = JSON.parse(savedPrinterConfig);
        }
    }

    handleSaveCompany(): void {
        localStorage.setItem('pos-company', JSON.stringify(this.companyData));
        this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Configuración de empresa guardada.'
        });
    }

    handleSaveNotifications(): void {
        localStorage.setItem('pos-notifications', JSON.stringify(this.notifications));
        this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Configuración de notificaciones guardada.'
        });
    }

    handleSavePrinter(): void {
        localStorage.setItem('pos-printer', JSON.stringify(this.printerSettings));
        this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Configuración de impresora guardada.'
        });
    }
}
