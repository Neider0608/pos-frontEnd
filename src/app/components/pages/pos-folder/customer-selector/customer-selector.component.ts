import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- Módulos de PrimeNG ---
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Customer } from '../../api/shared';

@Component({
    selector: 'app-customer-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, DropdownModule, ButtonModule, DialogModule, InputTextModule, TextareaModule],
    templateUrl: './customer-selector.component.html',
    styleUrls: ['./customer-selector.component.scss']
})
export class CustomerSelectorComponent {
    // --- ENTRADAS (Props) ---
    @Input() customers: Customer[] = [];
    @Input() selectedCustomer: Customer | null = null;

    // --- SALIDAS (Callbacks) ---
    @Output() selectCustomer = new EventEmitter<Customer | null>();

    // --- VARIABLES DE ESTADO ---
    showNewCustomerDialog: boolean = false;

    // --- MÉTODOS ---

    // Se dispara cuando se selecciona un cliente del dropdown
    onCustomerSelect(customer: Customer | null): void {
        this.selectedCustomer = customer;
        this.selectCustomer.emit(customer);
    }
}
