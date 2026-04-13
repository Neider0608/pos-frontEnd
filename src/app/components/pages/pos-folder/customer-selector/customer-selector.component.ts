import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { Customer } from '../../api/shared';
import { CustomerFormModalComponent } from '../../../shared/customer-form-modal/customer-form-modal.component';

@Component({
    selector: 'app-customer-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, DropdownModule, CustomerFormModalComponent],
    templateUrl: './customer-selector.component.html',
    styleUrls: ['./customer-selector.component.scss']
})
export class CustomerSelectorComponent {
    @Input() customers: Customer[] = [];
    @Input() selectedCustomer: Customer | null = null;

    @Output() selectCustomer = new EventEmitter<Customer | null>();
    @Output() customerCreated = new EventEmitter<Customer>();

    showNewCustomerModal = false;

    onCustomerSelect(customer: Customer | null): void {
        this.selectedCustomer = this.customers.find((c) => c.nit === '2222222222') || null;
        /*  if (!customer) {
            this.selectedCustomer = null;
        } else {
            this.selectedCustomer = customer;
        } */
        this.selectCustomer.emit(this.selectedCustomer);
    }

    clearCustomer(): void {
        this.selectedCustomer = null;
        this.selectCustomer.emit(null);
    }

    onCustomerSaved(customer: Customer): void {
        this.customers = [...this.customers, customer];
        this.selectedCustomer = customer;
        this.selectCustomer.emit(customer);
        this.customerCreated.emit(customer);
    }
}
