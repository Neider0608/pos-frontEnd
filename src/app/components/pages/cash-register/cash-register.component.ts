import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { CashRegister } from '../api/cash-register';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cash-register',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    DialogModule,
    BadgeModule,
    DividerModule
  ],
  templateUrl: './cash-register.component.html',
  styleUrl: './cash-register.component.scss'
})
export class CashRegisterComponent  implements OnInit {

  showOpenDialog: boolean = false;
  showCloseDialog: boolean = false;
  openingBalance: number | null = null;
  actualCash: number | null = null;
  actualCard: number | null = null;

  cashRegisters: CashRegister[] = [
    {
      id: "1",
      name: "Caja Principal",
      status: "open",
      openedAt: "2024-01-15T08:00:00.000Z",
      openingBalance: 200.0,
      expectedBalance: 1247.5,
      operator: "María González",
    },
    {
      id: "2",
      name: "Caja Secundaria",
      status: "closed",
      openedAt: "2024-01-14T08:00:00.000Z",
      closedAt: "2024-01-14T20:00:00.000Z",
      openingBalance: 150.0,
      expectedBalance: 856.75,
      actualBalance: 850.0,
      difference: -6.75,
      operator: "Carlos Pérez",
    },
  ];

  activeCashRegister: CashRegister | undefined;
  todaySales: number = 1047.5;
  expectedCash: number = 650.25;
  expectedCard: number = 397.25;

  ngOnInit(): void {
    this.updateActiveCashRegister();
  }

  updateActiveCashRegister(): void {
    this.activeCashRegister = this.cashRegisters.find((cr) => cr.status === "open");
  }

  // --- Método actualizado para PrimeIcons ---
  getPrimeIcon(iconName: string): string {
    switch (iconName) {
      case 'DollarSign': return 'pi pi-dollar';
      case 'CheckCircle': return 'pi pi-check-circle';
      case 'Banknote': return 'pi pi-money-bill'; // O 'pi pi-wallet' o 'pi pi-euro' dependiendo de la preferencia
      case 'CreditCard': return 'pi pi-credit-card';
      case 'AlertCircle': return 'pi pi-exclamation-circle';
      default: return '';
    }
  }

  handleOpenCashRegister(): void {
    if (this.openingBalance === null || this.openingBalance <= 0) {
      // Puedes añadir una notificación aquí (ej. PrimeNG Toast)
      return;
    }

    const newCashRegister: CashRegister = {
      id: String(Date.now()),
      name: `Caja ${this.cashRegisters.length + 1}`,
      status: "open",
      openedAt: new Date().toISOString(),
      openingBalance: this.openingBalance,
      expectedBalance: this.openingBalance,
      operator: "Usuario Actual",
    };

    this.cashRegisters = [newCashRegister, ...this.cashRegisters];
    console.log("Abriendo caja con balance inicial:", this.openingBalance);
    this.showOpenDialog = false;
    this.openingBalance = null;
    this.updateActiveCashRegister();
  }

  handleCloseCashRegister(): void {
    if (!this.activeCashRegister || this.actualCash === null || this.actualCard === null) {
      // Puedes añadir una notificación aquí
      return;
    }

    const totalActual = this.actualCash + this.actualCard;
    const difference = totalActual - (this.activeCashRegister.expectedBalance || 0);

    this.cashRegisters = this.cashRegisters.map((cr) =>
      cr.id === this.activeCashRegister?.id
        ? {
            ...cr,
            status: "closed",
            closedAt: new Date().toISOString(),
            actualBalance: totalActual,
            difference: difference,
          }
        : cr
    );
    console.log("Cerrando caja - Diferencia:", difference);
    this.showCloseDialog = false;
    this.actualCash = null;
    this.actualCard = null;
    this.updateActiveCashRegister();
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getOpenTime(openedAt: string): string {
    const openedDate = new Date(openedAt).getTime();
    const now = Date.now();
    const diffHours = Math.floor((now - openedDate) / (1000 * 60 * 60));
    return `${diffHours}h`;
  }
}