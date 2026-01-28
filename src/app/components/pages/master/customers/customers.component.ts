import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

// 🔹 Servicios y modelos
import { PosService } from '../../../services/pos.service';

// 🔹 PrimeNG
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { RippleModule } from 'primeng/ripple';
import { Customer } from '../../api/shared';
import { MasterService } from '../../../services/master.service';
import { AuthService } from '../../core/guards/auth.service';
import { AuthSession } from '../../api/login';

@Component({
    selector: 'app-customers',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, DialogModule, DropdownModule, InputTextModule, InputSwitchModule, ButtonModule, ToastModule, ToggleSwitchModule, RippleModule],
    templateUrl: './customers.component.html',
    styleUrls: ['./customers.component.scss'],
    providers: [MessageService, PosService, MasterService]
})
export class CustomersComponent implements OnInit {
    // ============================================================
    // 🔹 LISTAS PRINCIPALES
    // ============================================================
    customers: Customer[] = [];
    filteredCustomers: Customer[] = [];

    // ============================================================
    // 🔹 CONTROLES Y ESTADO
    // ============================================================
    searchTerm: string = '';
    showDialog = false;
    isEditing = false;
    companiaId: number = 0;
    userId: number = 0;

    // ============================================================
    // 🔹 FORMULARIO ACTUAL (CREAR/EDITAR)
    // ============================================================
    currentCustomer: Customer = this.getEmptyCustomer();

    identificationTypes: any[] = [
        { label: 'CC', value: 1 },
        { label: 'TI', value: 2 },
        { label: 'PAS', value: 3 },
        { label: 'NIT', value: 4 }
    ];

    constructor(
        private posService: PosService,
        private messageService: MessageService,
        private masterService: MasterService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        const session = this.authService.getSession() as AuthSession;
        this.companiaId = session.companiaId;
        this.userId = session.userId;
        this.loadCustomers();
    }

    // ============================================================
    // 🔹 CARGA DE DATOS DESDE BACKEND
    // ============================================================

    loadCustomers() {
        this.masterService.getClients(this.companiaId).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.customers = res.data || [];
                    this.filteredCustomers = [...this.customers];
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: res.message || 'No se pudieron cargar los clientes.'
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar los clientes desde el servidor.'
                });
            }
        });
    }

    // ============================================================
    // 🔍 FILTRAR CLIENTES
    // ============================================================
    filterCustomers() {
        const term = this.searchTerm.toLowerCase();
        this.filteredCustomers = this.customers.filter((c) => `${c.firstName} ${c.lastName} ${c.businessName ?? ''} ${c.document}`.toLowerCase().includes(term));
    }

    resetFilters() {
        this.searchTerm = '';
        this.filteredCustomers = [...this.customers];
    }

    // ============================================================
    // ⚙️ CRUD: CREAR / EDITAR / ELIMINAR
    // ============================================================

    openAddDialog() {
        this.currentCustomer = this.getEmptyCustomer();
        this.isEditing = false;
        this.showDialog = true;
    }

    editCustomer(customer: Customer) {
        this.currentCustomer = { ...customer };
        this.isEditing = true;
        this.showDialog = true;
    }

    deleteCustomer(customer: Customer) {
        if (!confirm(`¿Deseas eliminar el cliente "${customer.firstName} ${customer.lastName}"?`)) return;

        this.masterService.DeleteClient(customer).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.customers = this.customers.filter((c) => c.id !== customer.id);
                    this.filteredCustomers = [...this.customers];
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Eliminado',
                        detail: res.message || 'Cliente eliminado correctamente.'
                    });
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: res.message || 'No se pudo eliminar el cliente.'
                    });
                }
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo eliminar el cliente.'
                })
        });
    }

    saveCustomer() {
        if (!this.currentCustomer.firstName || !this.currentCustomer.document || !this.currentCustomer.email) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Campos requeridos',
                detail: 'Debe completar los campos obligatorios.'
            });
            return;
        }

        const operation = this.masterService.CreateClient(this.currentCustomer);

        operation.subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: res.message || 'Operación realizada correctamente.'
                    });
                    this.showDialog = false;
                    this.loadCustomers();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.message || 'Error al guardar el cliente.'
                    });
                }
            },
            error: () =>
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al guardar el cliente.'
                })
        });
    }

    closeDialog() {
        this.showDialog = false;
    }

    // ============================================================
    // 🧱 PLANTILLA VACÍA
    // ============================================================
    private getEmptyCustomer(): Customer {
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
            businessName: '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
}
