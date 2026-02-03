import { Component, OnInit } from '@angular/core';
import { ISupplier } from '../../api/suppliers';
import { MessageService } from 'primeng/api';
import { AuthSession } from '../../api/login';
import { AuthService } from '../../core/guards/auth.service';
import { SuppliersService } from '../../../services/suppliers.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss',
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,      // <--- Esto soluciona el error de ngModel
    TableModule,      // <--- Esto soluciona el error de p-table
    DialogModule,     // <--- Esto soluciona el error de p-dialog
    InputTextModule,  // <--- Necesario para el estilo de los inputs de Prime
    ButtonModule,
    ToastModule
  ],
})
export class SuppliersComponent implements OnInit {
  companiaId: number = 0;
  suppliers: ISupplier[] = [];
  loading: boolean = true;
  searchTerm: string = '';
  showAddDialog: boolean = false;

  newSupplier: ISupplier = this.getEmptySupplier();

  constructor(
    private authService: AuthService,
    private suppliersService: SuppliersService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    // Obtenemos la sesión igual que en Low Stock
    const session = this.authService.getSession() as AuthSession;
    if (session) {
      this.companiaId = session.companiaId;
      this.loadData();
    }
  }

  loadData() {
    this.loading = true;
    this.suppliersService.getSuppliers(this.companiaId).subscribe({
      next: (res) => {
        // Validamos con 'code === 0' como en tu componente de referencia
        if (res.code === 0) {
          this.suppliers = res.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error("Error al obtener proveedores", err);
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo conectar con el servidor'
        });
        this.loading = false;
      }
    });
  }

  // Getters para las tarjetas de estadísticas
  get activeSuppliers(): number {
    return this.suppliers.filter(s => s.status === 'active').length;
  }

  get totalProducts(): number {
    return this.suppliers.reduce((sum, s) => sum + (s.productsCount || 0), 0);
  }

  get filteredSuppliers(): ISupplier[] {
  if (!this.suppliers) return [];

  return this.suppliers.filter(s => {
    // Usamos ?. y || '' para que si el dato es null, no rompa el sistema
    const name = s.name?.toLowerCase() || '';
    const taxId = s.taxId || '';
    const contact = s.contact?.toLowerCase() || '';
    const search = this.searchTerm.toLowerCase();

    return name.includes(search) ||
           taxId.includes(search) ||
           contact.includes(search);
  });
}

  private getEmptySupplier(): ISupplier {
    return {
      id: 0, name: '', taxId: '', contact: '',
      phone: '', email: '', address: '',
      status: 'active', productsCount: 0
    };
  }

  saveNewSupplier() {
    // Aquí iría la lógica para enviar al servidor
    this.showAddDialog = false;
    this.newSupplier = this.getEmptySupplier();
  }
}
