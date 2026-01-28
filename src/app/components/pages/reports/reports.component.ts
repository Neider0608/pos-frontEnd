import { CommonModule, NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-reports',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    DropdownModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  selectedPeriod: string = 'today';

  periodOptions = [
    { label: 'Hoy', value: 'today' },
    { label: 'Esta Semana', value: 'week' },
    { label: 'Este Mes', value: 'month' },
  ];

  salesData: SalesDataCollection = {
    today: { sales: 1247.5, transactions: 47, customers: 32, avgTicket: 26.54 },
    week: { sales: 8732.25, transactions: 324, customers: 198, avgTicket: 26.95 },
    month: { sales: 34567.8, transactions: 1256, customers: 743, avgTicket: 27.52 },
  };

  topProducts: TopProduct[] = [
    { name: 'Coca Cola 350ml', sales: 156, revenue: 390.0, growth: 12 },
    { name: 'Pan Integral Bimbo', sales: 89, revenue: 333.75, growth: -5 },
    { name: 'Leche Entera 1L', sales: 67, revenue: 281.4, growth: 8 },
    { name: 'Café Juan Valdez', sales: 34, revenue: 289.0, growth: 15 },
    { name: 'Arroz Diana 500g', sales: 45, revenue: 126.0, growth: 3 },
  ];

  categorySales: CategorySales[] = [
    { category: 'Bebidas', amount: 456.75, percentage: 36.6, color: 'bg-blue-500' },
    { category: 'Lácteos', amount: 324.2, percentage: 26.0, color: 'bg-green-500' },
    { category: 'Panadería', amount: 198.3, percentage: 15.9, color: 'bg-yellow-500' },
    { category: 'Granos', amount: 156.45, percentage: 12.5, color: 'bg-purple-500' },
    { category: 'Otros', amount: 111.8, percentage: 9.0, color: 'bg-gray-500' },
  ];

  constructor() {}

  ngOnInit() {
    // No specific initialization needed beyond default values
  }

  get currentData(): SalesPeriodData {
    return this.salesData[this.selectedPeriod as keyof SalesDataCollection];
  }
}

// Custom pipe to get absolute value, as Math.abs is not directly available in templates
// You would typically define this in a separate file (e.g., abs.pipe.ts)
// and import it into your component's imports array.
import { Pipe, PipeTransform } from '@angular/core';
import { SalesDataCollection, TopProduct, CategorySales, SalesPeriodData } from '../api/reports';

@Pipe({
  name: 'abs',
  standalone: true // Mark as standalone
})
export class AbsPipe implements PipeTransform {
  transform(value: number): number {
    return Math.abs(value);
  }
}

