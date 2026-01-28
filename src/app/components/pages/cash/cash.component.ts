import { Component } from '@angular/core';
import { SelectOption, Transaction } from '../api/cash';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { PrimeIcons } from 'primeng/api';
import { TagModule } from 'primeng/tag'

@Component({
  selector: 'app-cash',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    DropdownModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './cash.component.html',
  styleUrl: './cash.component.scss'
})
export class CashComponent {
  selectedPeriod: SelectOption = { label: 'Hoy', value: 'today' };
  periodOptions: SelectOption[] = [
    { label: 'Hoy', value: 'today' },
    { label: 'Esta Semana', value: 'week' },
    { label: 'Este Mes', value: 'month' },
  ];

  transactions: Transaction[] = [
    {
      id: '1',
      type: 'income',
      description: 'Venta #001',
      amount: 45.5,
      paymentMethod: 'efectivo',
      date: '2024-01-15 09:30',
      category: 'ventas',
    },
    {
      id: '2',
      type: 'income',
      description: 'Venta #002',
      amount: 78.25,
      paymentMethod: 'tarjeta',
      date: '2024-01-15 10:15',
      category: 'ventas',
    },
    {
      id: '3',
      type: 'expense',
      description: 'Compra inventario',
      amount: 250.0,
      paymentMethod: 'transferencia',
      date: '2024-01-15 11:00',
      category: 'inventario',
    },
    {
      id: '4',
      type: 'expense',
      description: 'Pago servicios',
      amount: 85.3,
      paymentMethod: 'efectivo',
      date: '2024-01-15 14:20',
      category: 'servicios',
    },
    {
      id: '5',
      type: 'income',
      description: 'Venta #003',
      amount: 156.75,
      paymentMethod: 'efectivo',
      date: '2024-01-15 15:45',
      category: 'ventas',
    },
  ];

  totalIncome: number = 0;
  totalExpenses: number = 0;
  netFlow: number = 0;
  cashBalance: number = 0;
  cardBalance: number = 0;

  ngOnInit() {
    this.calculateFinancialSummaries();
  }

  calculateFinancialSummaries() {
    this.totalIncome = this.transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    this.totalExpenses = this.transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    this.netFlow = this.totalIncome - this.totalExpenses;

    this.cashBalance = this.transactions
      .filter((t) => t.paymentMethod === 'efectivo')
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

    this.cardBalance = this.transactions
      .filter((t) => t.paymentMethod === 'tarjeta')
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  }

  getIcon(iconName: string): string {
    // This is a simple mapping. For more complex icon usage,
    // you might need a service or a more robust solution.
    switch (iconName) {
      case 'ArrowUpRight':
        return PrimeIcons.ARROW_UP_RIGHT;
      case 'ArrowDownRight':
        return PrimeIcons.ARROW_DOWN_RIGHT;
      case 'TrendingUp':
        return PrimeIcons.CHART_LINE; // A good substitute
      case 'TrendingDown':
        return PrimeIcons.CHART_LINE; // You might want a different one, like primeicons-chart-bar
      case 'Calculator':
        return PrimeIcons.CALCULATOR;
      case 'Banknote':
        return PrimeIcons.MONEY_BILL;
      case 'CreditCard':
        return PrimeIcons.CREDIT_CARD;
      case 'DollarSign':
        return PrimeIcons.DOLLAR;
      default:
        return '';
    }
  }

  getSeverity(type: 'income' | 'expense'): string {
    return type === 'income' ? 'success' : 'danger';
  }
}