import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ProgressBarModule } from 'primeng/progressbar';
import { Stock } from '../api/low-tock'; // Asegúrate que esta es tu interfaz con (available, name, etc)
import { AuthSession } from '../api/login';
import { LowStockService } from '../../services/lowStock.service';
import { AuthService } from '../core/guards/auth.service';

@Component({
  selector: 'app-low-stock',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule, InputTextModule,
    DropdownModule, DialogModule, InputSwitchModule, ProgressBarModule,
    TableModule, BadgeModule
  ],
  templateUrl: './low-stock.component.html',
  styleUrl: './low-stock.component.scss'
})
export class LowStockComponent implements OnInit {
  companiaId: number = 0;
  lowStockItems: Stock[] = []; // Aquí se guardan los datos de la DB
  
  searchTerm: string = '';
  selectedCategory: string = 'all'; // Nota: Tu SP actual no trae categoría, se filtrará por nombre/barcode
  selectedStatus: string = 'all';
  showSettingsDialog: boolean = false;
  
  alertSettings = {
    criticalThreshold: 5,
    lowThreshold: 10,
    emailNotifications: true,
    autoReorder: false,
  };

  // Opciones para los combos
  categories: any[] = [{ label: 'Todas las categorías', value: 'all' }];
  statuses: any[] = [
    { label: 'Todos los estados', value: 'all' },
    { label: 'Crítico', value: 'critical' },
    { label: 'Bajo', value: 'low' },
    { label: 'Advertencia', value: 'warning' },
  ];

  constructor(
    private authService: AuthService,
    private lowStockService: LowStockService
  ) {}

  ngOnInit() {
    const session = this.authService.getSession() as AuthSession;
    if (session) {
      this.companiaId = session.companiaId;
      this.loadData();
    }
  }

  loadData() {
    this.lowStockService.getStock(this.companiaId).subscribe({
      next: (res) => {
        if (res.code === 0) {
          this.lowStockItems = res.data;
        }
      },
      error: (err) => console.error("Error al obtener stock", err)
    });
  }

  // Lógica de cálculo de estados en base a la data real
  calculateStatus(item: Stock): string {
    if (item.available <= this.alertSettings.criticalThreshold) return 'critical';
    if (item.available <= item.minStock) return 'low';
    return 'warning';
  }

  // Getters para las tarjetas de arriba
  get criticalItems(): number {
    return this.lowStockItems.filter(i => this.calculateStatus(i) === 'critical').length;
  }

  get lowItems(): number {
    return this.lowStockItems.filter(i => this.calculateStatus(i) === 'low').length;
  }

  get warningItems(): number {
    return this.lowStockItems.filter(i => this.calculateStatus(i) === 'warning').length;
  }

  get unreadAlerts(): number {
    return this.criticalItems; // Ejemplo: alertas críticas no leídas
  }

  get filteredItems(): Stock[] {
    return this.lowStockItems.filter((item) => {
      const status = this.calculateStatus(item);
      const matchesSearch = item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                            item.barcode.includes(this.searchTerm);
      const matchesStatus = this.selectedStatus === 'all' || status === this.selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }

  getStatusBadge(status: string) {
    switch (status) {
      case 'critical': return { label: 'Crítico', tailwindClass: 'bg-rose-500/20 text-rose-700 border-rose-200' };
      case 'low': return { label: 'Bajo', tailwindClass: 'bg-orange-500/20 text-orange-700 border-orange-200' };
      default: return { label: 'Advertencia', tailwindClass: 'border-yellow-500 text-yellow-700' };
    }
  }

  saveSettings(): void {
    this.showSettingsDialog = false;
    this.loadData(); // Recargar para aplicar nuevos umbrales visuales
  }
}