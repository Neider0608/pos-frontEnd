import { Routes } from '@angular/router';
import { CashComponent } from './cash/cash.component';
import { Empty } from '../empty/empty';
import { CashRegisterComponent } from './cash-register/cash-register.component';
import { InventoryComponent } from './inventory/inventory.component';
import { LowStockComponent } from './low-stock/low-stock.component';
import { PermissionsModuleComponent } from './master/permissions/permissions.component';
import { PromotionsComponent } from './promotions/promotions.component';

import { QuotesComponent } from './quotes/quotes.component';
import { ReportsComponent } from './reports/reports.component';
import { CustomersComponent } from './master/customers/customers.component';
import { SettingsComponent } from './master/settings/settings.component';
import { PosComponent } from './pos-folder/pos/pos.component';
import { CategorysComponent } from './master/categorys/categorys.component';
import { WarehousesComponent } from './master/warehouses/warehouses.component';
import { FinancingComponent } from './financing/financing.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { WhatsappMultiagentComponent } from './whatsapp-multiagent/whatsapp-multiagent.component';
import { AgentsComponent } from './agents/agents.component';
import { SuppliersComponent } from './master/suppliers/suppliers.component';
import { CompanyComponent } from './master/company/company.component';
import { PurchaseComponent } from './purchases/purchases.component';

export default [
    { path: 'settings', component: SettingsComponent },
    { path: 'customers', component: CustomersComponent },
    { path: 'suppliers', component: SuppliersComponent },
    { path: 'reports', component: ReportsComponent },
    { path: 'quotes', component: QuotesComponent },
    { path: 'purchases', component: PurchaseComponent },
    { path: 'promotions', component: PromotionsComponent },
    { path: 'pos', component: PosComponent },
    { path: 'permissions', component: PermissionsModuleComponent },
    { path: 'low-stock', component: LowStockComponent },
    { path: 'inventory', component: InventoryComponent },
    { path: 'cash-register', component: CashRegisterComponent },
    { path: 'empty', component: Empty },
    { path: 'cash-module', component: CashComponent },
    { path: 'category', component: CategorysComponent },
    { path: 'warehouse', component: WarehousesComponent },
    { path: 'financing', component: FinancingComponent },
    { path: 'invoices', component: InvoicesComponent },
    { path: 'whatsapp-chats', component: WhatsappMultiagentComponent },
    { path: 'agents', component: AgentsComponent },
    { path: 'company', component: CompanyComponent }

    /* { path: '**', redirectTo: '/notfound' } */
] as Routes;
