import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';

import { Router } from '@angular/router';
import { SetupData } from '../../api/initial-setup';
import { Permission } from '../../api/permissions';

@Component({
    selector: 'app-initial-setup',
    imports: [CommonModule, FormsModule, CardModule, ButtonModule, InputTextModule, DropdownModule, ToastModule],
    providers: [MessageService],
    templateUrl: './initial-setup.component.html',
    styleUrl: './initial-setup.component.scss'
})
export class InitialSetupComponent implements OnInit {
    @Output() onComplete = new EventEmitter<void>();

    step: number = 1;
    setupData: SetupData = {
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

    permissions: Permission[] = [];

    canView = false;
    canCreate = false;
    canEdit = false;
    canDelete = false;
    canExport = false;

    constructor(
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit() {
        const savedSetup = localStorage.getItem('pos-setup');
        if (savedSetup) {
            this.setupData = JSON.parse(savedSetup);
            // Ajusta el paso inicial para reanudar la configuración si ya hay datos
            if (this.setupData.ownerName && this.setupData.taxId) {
                this.step = 3;
            } else if (this.setupData.address && this.setupData.phone && this.setupData.email) {
                this.step = 2;
            } else if (this.setupData.companyName && this.setupData.businessType) {
                this.step = 1;
            }
        }
    }

    // Ahora handleInputChange es genérico para actualizar cualquier campo de setupData
    handleInputChange(field: keyof SetupData, value: any): void {
        // Aseguramos que el valor se asigna correctamente al campo correspondiente
        this.setupData = { ...this.setupData, [field]: value };
    }

    handleComplete(): void {
        if (this.isStepValid()) {
            // Validar el último paso antes de completar
            localStorage.setItem('pos-setup', JSON.stringify(this.setupData));
            localStorage.setItem('pos-company', JSON.stringify(this.setupData));

            this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Configuración inicial completada y guardada.'
            });
            this.onComplete.emit();
            this.router.navigate(['/pages']);
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Por favor, complete los campos obligatorios del último paso.'
            });
        }
    }

    isStepValid(): boolean {
        switch (this.step) {
            case 1:
                return !!this.setupData.companyName && !!this.setupData.businessType;
            case 2:
                return !!this.setupData.address && !!this.setupData.phone && !!this.setupData.email && this.isValidEmail(this.setupData.email);
            case 3:
                return !!this.setupData.ownerName && !!this.setupData.taxId;
            default:
                return false;
        }
    }

    isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setStep(newStep: number): void {
        if (newStep > this.step) {
            // Intentando avanzar
            if (this.isStepValid()) {
                this.step = newStep;
            } else {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Advertencia',
                    detail: 'Por favor, complete los campos obligatorios antes de continuar.'
                });
            }
        } else {
            // Intentando retroceder
            this.step = newStep;
        }
    }
}
