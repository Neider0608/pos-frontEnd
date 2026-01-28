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
import { LowStockItem, StockAlert } from '../api/low-tock';

@Component({
  selector: 'app-low-stock',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    DialogModule,
    InputSwitchModule,
    ProgressBarModule,
    TableModule,
    BadgeModule,
  ],
  templateUrl: './low-stock.component.html',
  styleUrl: './low-stock.component.scss'
})
export class LowStockComponent  implements OnInit {
  searchTerm: string = '';
  selectedCategory: string = 'all';
  selectedStatus: string = 'all';
  showSettingsDialog: boolean = false;
  alertSettings = {
    enableNotifications: true,
    criticalThreshold: 5,
    lowThreshold: 10,
    emailNotifications: true,
    autoReorder: false,
  };

  lowStockItems: LowStockItem[] = [
    {
      id: "1",
      name: "Pan Integral Bimbo",
      barcode: "7501030415263",
      category: "Panadería",
      currentStock: 3,
      minStock: 15,
      maxStock: 50,
      stockPercentage: 6,
      lastSale: "2024-01-15T14:30:00",
      avgDailySales: 8,
      daysUntilEmpty: 0.4,
      supplier: "Grupo Bimbo",
      cost: 2.2,
      price: 3.75,
      status: "critical",
    },
    {
      id: "2",
      name: "Leche Entera 1L",
      barcode: "7501234567890",
      category: "Lácteos",
      currentStock: 8,
      minStock: 20,
      maxStock: 60,
      stockPercentage: 13,
      lastSale: "2024-01-15T16:15:00",
      avgDailySales: 12,
      daysUntilEmpty: 0.7,
      supplier: "Alpina",
      cost: 3.1,
      price: 4.2,
      status: "critical",
    },
    {
      id: "3",
      name: "Aceite Girasol 1L",
      barcode: "7501234567892",
      category: "Aceites",
      currentStock: 12,
      minStock: 25,
      maxStock: 80,
      stockPercentage: 15,
      lastSale: "2024-01-15T12:00:00",
      avgDailySales: 3,
      daysUntilEmpty: 4,
      supplier: "Aceites del Campo",
      cost: 4.5,
      price: 5.5,
      status: "low",
    },
    {
      id: "4",
      name: "Jabón Dove",
      barcode: "7501234567893",
      category: "Aseo",
      currentStock: 18,
      minStock: 30,
      maxStock: 100,
      stockPercentage: 18,
      lastSale: "2024-01-14T18:30:00",
      avgDailySales: 2,
      daysUntilEmpty: 9,
      supplier: "Unilever",
      cost: 2.8,
      price: 3.2,
      status: "warning",
    },
    {
      id: "5",
      name: "Arroz Diana 500g",
      barcode: "7501234567891",
      category: "Granos",
      currentStock: 22,
      minStock: 40,
      maxStock: 120,
      stockPercentage: 18,
      lastSale: "2024-01-15T11:45:00",
      avgDailySales: 5,
      daysUntilEmpty: 4.4,
      supplier: "Diana",
      cost: 2.1,
      price: 2.8,
      status: "warning",
    },
  ];

  stockAlerts: StockAlert[] = [
    {
      id: "1",
      productId: "1",
      productName: "Pan Integral Bimbo",
      alertType: "critical",
      currentStock: 3,
      minStock: 15,
      createdAt: "2024-01-15T14:30:00",
      isRead: false,
    },
    {
      id: "2",
      productId: "2",
      productName: "Leche Entera 1L",
      alertType: "critical",
      currentStock: 8,
      minStock: 20,
      createdAt: "2024-01-15T16:15:00",
      isRead: false,
    },
    {
      id: "3",
      productId: "3",
      productName: "Aceite Girasol 1L",
      alertType: "low",
      currentStock: 12,
      minStock: 25,
      createdAt: "2024-01-15T12:00:00",
      isRead: true,
    },
  ];

  categories: any[] = [
    { label: 'Todas las categorías', value: 'all' },
    { label: 'Bebidas', value: 'Bebidas' },
    { label: 'Panadería', value: 'Panadería' },
    { label: 'Lácteos', value: 'Lácteos' },
    { label: 'Granos', value: 'Granos' },
    { label: 'Aceites', value: 'Aceites' },
    { label: 'Aseo', value: 'Aseo' },
    { label: 'Snacks', value: 'Snacks' },
  ];

  statuses: any[] = [
    { label: 'Todos los estados', value: 'all' },
    { label: 'Crítico', value: 'critical' },
    { label: 'Bajo', value: 'low' },
    { label: 'Advertencia', value: 'warning' },
  ];

  constructor() {}

  ngOnInit(): void {}

  get criticalItems(): number {
    return this.lowStockItems.filter((item) => item.status === 'critical').length;
  }

  get lowItems(): number {
    return this.lowStockItems.filter((item) => item.status === 'low').length;
  }

  get warningItems(): number {
    return this.lowStockItems.filter((item) => item.status === 'warning').length;
  }

  get unreadAlerts(): number {
    return this.stockAlerts.filter((alert) => !alert.isRead).length;
  }

  get filteredItems(): LowStockItem[] {
    return this.lowStockItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.barcode.includes(this.searchTerm);
      const matchesCategory = this.selectedCategory === 'all' || item.category === this.selectedCategory;
      const matchesStatus = this.selectedStatus === 'all' || item.status === this.selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  getStatusBadge(status: 'critical' | 'low' | 'warning' | string): { label: string, tailwindClass: string } {
    switch (status) {
      case 'critical':
        return { label: 'Crítico', tailwindClass: 'bg-red-500/20 text-red-700' };
      case 'low':
        return { label: 'Bajo', tailwindClass: 'bg-orange-500/20 text-orange-700' };
      case 'warning':
        return { label: 'Advertencia', tailwindClass: 'border-yellow-500 text-yellow-700' };
      default:
        return { label: status, tailwindClass: 'border border-gray-300 text-gray-700' };
    }
  }

  getStatusIconClass(status: 'critical' | 'low' | 'warning' | string): string {
    switch (status) {
      case 'critical':
        return 'pi pi-exclamation-triangle text-red-600';
      case 'low':
        return 'pi pi-chart-line text-orange-600'; // TrendingDown
      case 'warning':
        return 'pi pi-box text-yellow-600'; // Package
      default:
        return 'pi pi-box text-gray-600'; // Package
    }
  }

  getProgressColorClass(percentage: number): string {
    if (percentage <= 10) return 'bg-red-500';
    if (percentage <= 25) return 'bg-orange-500';
    return 'bg-yellow-500';
  }

  saveSettings(): void {
    console.log('Guardando configuración:', this.alertSettings);
    alert('Configuración guardada exitosamente');
    this.showSettingsDialog = false;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}