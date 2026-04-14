import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { Customer } from '../../pages/api/shared';
import { MasterService } from '../../services/master.service';
import { AuthService } from '../../pages/core/guards/auth.service';
import { AuthSession } from '../../pages/api/login';

@Component({
    selector: 'app-customer-form-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, InputTextModule, DropdownModule, InputSwitchModule, ButtonModule, InputNumberModule],
    providers: [MessageService],
    templateUrl: './customer-form-modal.component.html',
    styleUrls: ['./customer-form-modal.component.scss']
})
export class CustomerFormModalComponent {
    @Input() visible = false;
    @Input() customer: Partial<Customer> | null = null;
    @Input() isEditing = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() customerSaved = new EventEmitter<Customer>();

    companiaId: number = 0;
    userId: number = 0;

    identificationTypes = [
        { label: 'Cedula de Ciudadania (CC)', value: 1 },
        { label: 'Tarjeta de Identidad (TI)', value: 2 },
        { label: 'Pasaporte (PAS)', value: 3 },
        { label: 'NIT (Empresa)', value: 4 },
        { label: 'Cedula Extranjeria (CE)', value: 5 }
    ];

    formData: Partial<Customer> = this.getEmptyCustomer();

    constructor(
        private masterService: MasterService,
        private authService: AuthService,
        private messageService: MessageService
    ) {
        const session = this.authService.getSession() as AuthSession;
        if (session) {
            this.companiaId = session.companiaId;
            this.userId = session.userId;
        }
    }

    ngOnChanges(): void {
        if (this.visible) {
            if (this.customer && this.isEditing) {
                this.formData = { ...this.customer };
            } else {
                this.formData = this.getEmptyCustomer();
            }
        }
    }

    private getEmptyCustomer(): Partial<Customer> {
        return {
            id: 0,
            companiaId: this.companiaId,
            userId: this.userId,
            identificationTypeId: 1,
            document: '',
            firstName: '',
            middleName: '',
            lastName: '',
            secondLastName: '',
            phone: '',
            email: '',
            city: '',
            department: '',
            country: '',
            address: '',
            isCompany: false,
            nit: '',
            businessName: ''
        };
    }

    isValid(): boolean {
        if (this.formData.isCompany) {
            return !!(this.formData.businessName?.trim() && this.formData.nit?.trim() && this.formData.email?.trim() && this.isValidEmail(this.formData.email || ''));
        } else {
            return !!(this.formData.firstName?.trim() && this.formData.lastName?.trim() && this.formData.document?.trim() && this.formData.email?.trim() && this.isValidEmail(this.formData.email || ''));
        }
    }

    isValidEmail(email: string | undefined): boolean {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    save(): void {
        if (!this.isValid()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Campos requeridos',
                detail: 'Complete los campos obligatorios correctamente.'
            });
            return;
        }

        const customerToSave: Customer = {
            id: this.formData.id || 0,
            companiaId: this.companiaId,
            userId: this.userId,
            identificationTypeId: this.formData.identificationTypeId || 1,
            document: this.formData.document || '',
            firstName: this.formData.firstName || '',
            middleName: this.formData.middleName || '',
            lastName: this.formData.lastName || '',
            secondLastName: this.formData.secondLastName || '',
            phone: this.formData.phone || '',
            email: this.formData.email || '',
            city: this.formData.city || '',
            department: this.formData.department || '',
            country: this.formData.country || '',
            address: this.formData.address || '',
            isCompany: this.formData.isCompany || false,
            nit: this.formData.nit || '',
            businessName: this.formData.businessName || '',
            createdAt: new Date(),
            updatedAt: new Date(),
            displayName: this.buildDisplayName()
        };

        this.masterService.CreateClient(customerToSave).subscribe({
            next: (res: any) => {
                if (res.code === 0 && res.data) {
                    const savedCustomer = res.data as Customer;
                    savedCustomer.displayName = this.buildDisplayNameFor(savedCustomer);

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Exito',
                        detail: `Cliente "${savedCustomer.displayName}" guardado correctamente.`
                    });

                    this.close();
                    this.customerSaved.emit(savedCustomer);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.message || 'No se pudo guardar el cliente.'
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error de conexion',
                    detail: 'No se pudo conectar con el servidor.'
                });
            }
        });
    }

    private buildDisplayName(): string {
        if (this.formData.isCompany && this.formData.businessName) {
            return this.formData.businessName;
        }
        const parts = [this.formData.firstName, this.formData.middleName, this.formData.lastName, this.formData.secondLastName].filter(Boolean);
        return parts.join(' ') || this.formData.email || 'Cliente';
    }

    private buildDisplayNameFor(customer: Customer): string {
        if (customer.isCompany && customer.businessName) {
            return customer.businessName;
        }
        const parts = [customer.firstName, customer.middleName, customer.lastName, customer.secondLastName].filter(Boolean);
        return parts.join(' ') || customer.email || 'Cliente';
    }

    close(): void {
        this.visibleChange.emit(false);
        this.formData = this.getEmptyCustomer();
    }

    onVisibleChange(isVisible: boolean): void {
        if (!isVisible) {
            this.formData = this.getEmptyCustomer();
        }
        this.visibleChange.emit(isVisible);
    }
}
