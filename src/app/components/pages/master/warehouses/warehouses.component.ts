import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { PosService } from '../../../services/pos.service';
import { ApiResponse, Warehouse } from '../../api/shared';
import { MasterService } from '../../../services/master.service';
import { AuthService } from '../../core/guards/auth.service';
import { AuthSession } from '../../api/login';
import { Permission } from '../../api/permissions';
import { LoginService } from '../../../services/login.service';

@Component({
    selector: 'app-warehouses',
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TextareaModule, InputSwitchModule, ToastModule],
    providers: [MessageService, PosService, MasterService],
    templateUrl: './warehouses.component.html',
    styleUrl: './warehouses.component.scss'
})
export class WarehousesComponent {
    warehouses: Warehouse[] = [];
    filteredWarehouses: Warehouse[] = [];

    showDialog = false;
    dialogTitle = 'Nueva Bodega';
    editingWarehouse: Warehouse | null = null;

    searchTerm = '';

    newWarehouse: Warehouse = {} as Warehouse;
    companiaId: number = 0;
    userId: number = 0;

    permissions: Permission[] = [];

    canView = false;
    canCreate = false;
    canEdit = false;
    canDelete = false;
    canExport = false;

    constructor(
        private posService: PosService,
        private messageService: MessageService,
        private masterService: MasterService,
        private authService: AuthService,
        private loginService: LoginService
    ) {}

    ngOnInit() {
        const session = this.authService.getSession() as AuthSession;

        if (!session) {
            this.resetPermissions();
            return;
        }

        const { userId, companiaId } = session;

        this.loginService.getPermissions(userId, companiaId).subscribe({
            next: (permissions) => {
                this.permissions = permissions.data ?? [];
                this.applyPermissions();
            },
            error: () => this.resetPermissions()
        });

        this.companiaId = session.companiaId;
        this.userId = session.userId;
        this.newWarehouse = {
            companiaId: this.companiaId,
            warehouseId: '',
            name: '',
            code: '',
            address: '',
            city: '',
            phone: '',
            active: true
        };
        this.loadWarehouses();
    }

    private applyPermissions(): void {
        const moduleName = 'Bodegas';

        const permission = this.permissions.find((p) => p.module === moduleName);

        if (!permission) {
            this.resetPermissions();
            return;
        }

        this.canView = permission.canView;
        this.canCreate = permission.canCreate;
        this.canEdit = permission.canEdit;
        this.canDelete = permission.canDelete;
        this.canExport = permission.canExport;
    }

    private resetPermissions(): void {
        this.canView = false;
        this.canCreate = false;
        this.canEdit = false;
        this.canDelete = false;
        this.canExport = false;
    }

    // 📥 Cargar bodegas
    loadWarehouses() {
        this.masterService.getWarehouses(this.companiaId).subscribe({
            next: (res: ApiResponse<Warehouse[]>) => {
                this.warehouses = res.data || [];
                this.filteredWarehouses = this.warehouses;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar las bodegas.'
                });
            }
        });
    }

    // 🔍 Filtrar bodegas
    filterWarehouses() {
        const term = this.searchTerm.toLowerCase();
        this.filteredWarehouses = this.warehouses.filter((b) => b.name.toLowerCase().includes(term) || b.code.toLowerCase().includes(term) || (b.city?.toLowerCase().includes(term) ?? false));
    }

    // ➕ Nueva bodega
    openNewDialog() {
        this.dialogTitle = 'Nueva Bodega';
        this.newWarehouse = {
            warehouseId: '',
            name: '',
            code: '',
            address: '',
            city: '',
            phone: '',
            active: true
        };
        this.editingWarehouse = null;
        this.showDialog = true;
    }

    // ✏️ Editar bodega
    editWarehouse(warehouse: Warehouse) {
        this.dialogTitle = 'Editar Bodega';
        this.newWarehouse = { ...warehouse };
        this.editingWarehouse = warehouse;
        this.showDialog = true;
    }

    // 💾 Guardar o actualizar
    saveWarehouse() {
        if (!this.newWarehouse.name.trim() || !this.newWarehouse.code.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Campos obligatorios',
                detail: 'El nombre y el código de la bodega son requeridos.'
            });
            return;
        }

        const action = this.editingWarehouse ? 'update' : 'create';

        this.masterService.createWarehouse(this.newWarehouse).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: action === 'update' ? 'Bodega actualizada correctamente.' : 'Bodega creada correctamente.'
                    });
                    this.showDialog = false;
                    this.loadWarehouses();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.message
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Ocurrió un problema al guardar la bodega.'
                });
            }
        });
    }

    // 🚫 Eliminar lógico
    deleteWarehouse(warehouse: Warehouse) {
        const payload = { ...warehouse, active: false };
        this.masterService.deleteWarehouse(payload).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Desactivada',
                        detail: `Bodega "${warehouse.name}" desactivada correctamente.`
                    });
                    this.loadWarehouses();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.message
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo eliminar la bodega.'
                });
            }
        });
    }
}
