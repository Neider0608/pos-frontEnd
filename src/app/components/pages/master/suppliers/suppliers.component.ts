import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputSwitchModule } from 'primeng/inputswitch'; // Añadido para el diseño nuevo

import { MasterService } from '../../../services/master.service';
import { AuthService } from '../../core/guards/auth.service';
import { AuthSession } from '../../api/login';
import { ISupplier } from '../../api/master';

@Component({
    selector: 'app-suppliers',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TableModule, DialogModule, ToastModule, InputSwitchModule],
    providers: [MessageService, MasterService],
    templateUrl: './suppliers.component.html'
})
export class SuppliersComponent implements OnInit {
    // Estado de la UI
    searchTerm: string = '';
    showAddDialog: boolean = false;
    isEditing: boolean = false;
    filteredSuppliers: ISupplier[] = [];

    // Datos
    suppliers: ISupplier[] = [];
    companiaId: number = 0;
    userId: number = 0;

    // Objeto reactivo para el formulario
    newSupplier: ISupplier = this.initializeSupplier();

    constructor(
        private messageService: MessageService,
        private masterService: MasterService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        debugger;
        const session = this.authService.getSession() as AuthSession;
        if (session) {
            this.companiaId = session.companiaId;
            this.userId = session.userId;
        }
        this.loadSuppliers();
    }

    // --- LÓGICA DE DATOS ---

    loadSuppliers() {
        this.masterService.getSuppliers(this.companiaId).subscribe({
            next: (res) => {
                this.suppliers = res.data || [];
                this.filteredSuppliers = [...this.suppliers];
            },

            error: (err) => {
                console.error('Error cargando proveedores:', err);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error de conexión' });
            }
        });
    }

    initializeSupplier(): ISupplier {
        return {
            id: 0,
            companiaId: this.companiaId,
            userId: this.userId,
            taxId: '',
            businessName: '',
            phone: '',
            mobile: '',
            email: '',
            city: '',
            contactName: '',
            paymentTerm: 0,
            status: true
        };
    }

    // --- ACCIONES DE UI ---

    openNew() {
        this.isEditing = false;
        this.newSupplier = this.initializeSupplier();
        this.showAddDialog = true;
    }

    editSupplier(supplier: ISupplier) {
        this.isEditing = true;
        this.newSupplier = { ...supplier }; // Clonamos para no editar la tabla en vivo
        this.showAddDialog = true;
    }

    saveSupplier(): void {
        if (!this.isSupplierValid()) return;

        console.log('Guardar proveedor:', this.newSupplier);

        // Si id > 0 podrías llamar a un update, pero aquí seguimos tu lógica de create
        this.masterService.createSupplier(this.newSupplier).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Completado',
                    detail: this.isEditing ? 'Proveedor actualizado' : 'Proveedor registrado'
                });
                this.showAddDialog = false;
                this.loadSuppliers();
                this.newSupplier = this.initializeSupplier();
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al procesar la solicitud' })
        });
    }

    deleteSupplier(supplier: ISupplier) {
        // Aquí iría tu lógica de borrado (usualmente otro endpoint en masterService)
        console.log('Eliminar:', supplier.id);
    }

    // --- GETTERS PARA FILTROS ---

    isSupplierValid(): boolean {
        const s = this.newSupplier;
        return !!(s.businessName && s.taxId && s.contactName && s.mobile && s.email && s.city && s.paymentTerm >= 0);
    }

    filterSuppliers() {
        if (!this.searchTerm) {
            this.filteredSuppliers = [...this.suppliers];
            return;
        }

        const search = this.searchTerm.toLowerCase().trim();

        this.filteredSuppliers = this.suppliers.filter(
            (s) => s.businessName.toLowerCase().includes(search) || s.taxId.toLowerCase().includes(search) || s.contactName.toLowerCase().includes(search) || s.city.toLowerCase().includes(search) || s.email.toLowerCase().includes(search)
        );
    }
}
