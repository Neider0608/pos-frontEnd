import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ISupplier } from '../../api/suppliers';

@Component({
    selector: 'app-suppliers',
    imports: [CommonModule, FormsModule, CardModule, ButtonModule, InputTextModule, TableModule, DialogModule, TagModule, ToastModule],
    providers: [MessageService],
    templateUrl: './suppliers.component.html',
    styleUrl: './suppliers.component.scss'
})
export class SuppliersComponent implements OnInit {
    searchTerm: string = '';
    showAddDialog: boolean = false;

    // Initial state for new supplier form
    newSupplier: ISupplier = {
        id: 0,
        name: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        taxId: '',
        status: 'active', // Default status
        productsCount: 0,
        lastOrder: new Date().toISOString().split('T')[0] // Default to today
    };

    suppliers: ISupplier[] = [
        {
            id: 1,
            name: 'Coca Cola Company',
            contact: 'Juan Pérez',
            phone: '+57 300 123 4567',
            email: 'ventas@cocacola.com',
            address: 'Calle 100 #15-20, Bogotá',
            taxId: '900123456-1',
            status: 'active',
            productsCount: 15,
            lastOrder: '2024-01-10'
        },
        {
            id: 2,
            name: 'Grupo Bimbo',
            contact: 'María González',
            phone: '+57 301 234 5678',
            email: 'pedidos@bimbo.com',
            address: 'Carrera 50 #25-30, Medellín',
            taxId: '900234567-2',
            status: 'active',
            productsCount: 25,
            lastOrder: '2024-01-12'
        },
        {
            id: 3,
            name: 'Alpina S.A.',
            contact: 'Carlos Rodríguez',
            phone: '+57 302 345 6789',
            email: 'comercial@alpina.com',
            address: 'Zona Industrial, Cali',
            taxId: '900345678-3',
            status: 'inactive',
            productsCount: 8,
            lastOrder: '2023-12-15'
        }
    ];

    constructor(private messageService: MessageService) {}

    ngOnInit() {}

    get filteredSuppliers(): ISupplier[] {
        return this.suppliers.filter(
            (supplier) => supplier.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || supplier.contact.toLowerCase().includes(this.searchTerm.toLowerCase()) || supplier.email.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
    }

    get activeSuppliers(): number {
        return this.suppliers.filter((s) => s.status === 'active').length;
    }

    get totalProducts(): number {
        return this.suppliers.reduce((sum, s) => sum + s.productsCount, 0);
    }

    saveNewSupplier(): void {
        if (!this.newSupplier.name || !this.newSupplier.contact || !this.newSupplier.email) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Por favor, complete los campos obligatorios del proveedor (Nombre, Contacto, Email).'
            });
            return;
        }

        const newId = this.suppliers.length + 1; // Simple ID generation
        const supplierToAdd: ISupplier = {
            ...this.newSupplier,
            id: newId,
            productsCount: 0, // Assuming new suppliers start with 0 products
            lastOrder: new Date().toISOString().split('T')[0] // Set current date as last order
        };

        this.suppliers = [...this.suppliers, supplierToAdd];
        this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Proveedor ${supplierToAdd.name} agregado exitosamente.`
        });
        this.showAddDialog = false;
        this.resetNewSupplier();
    }

    resetNewSupplier(): void {
        this.newSupplier = {
            id: 0,
            name: '',
            contact: '',
            phone: '',
            email: '',
            address: '',
            taxId: '',
            status: 'active',
            productsCount: 0,
            lastOrder: new Date().toISOString().split('T')[0]
        };
    }
}
