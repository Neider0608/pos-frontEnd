import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PosService } from '../../../services/pos.service';
import { MessageService } from 'primeng/api';
import { ApiResponse, Category } from '../../api/shared';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { MasterService } from '../../../services/master.service';
import { AuthService } from '../../core/guards/auth.service';
import { AuthSession } from '../../api/login';
import { Permission } from '../../api/permissions';
import { LoginService } from '../../../services/login.service';

@Component({
    selector: 'app-categorys',
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, TextareaModule, InputSwitchModule, ToastModule],
    providers: [PosService, MessageService, MasterService],
    templateUrl: './categorys.component.html',
    styleUrl: './categorys.component.scss'
})
export class CategorysComponent {
    categories: Category[] = [];
    filteredCategories: Category[] = [];

    // 🔹 Control del diálogo
    showDialog = false;
    dialogTitle = 'Nueva Categoría';
    editingCategory: Category | null = null;

    // 🔹 Modelo temporal
    newCategory: Category = {} as Category;
    companiaId: number = 0;
    userId: number = 0;
    // 🔹 Filtros
    searchTerm = '';

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
        this.newCategory = {
            companiaId: this.companiaId,
            name: '',
            description: '',
            active: true
        };
        this.loadCategories();
    }

    private applyPermissions(): void {
        const moduleName = 'Categorías';

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

    // 📦 Cargar categorías
    loadCategories() {
        this.masterService.getCategories(this.companiaId).subscribe({
            next: (res: ApiResponse<Category[]>) => {
                this.categories = res.data || [];
                this.filteredCategories = this.categories;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar las categorías.'
                });
            }
        });
    }

    // 🔍 Filtrar por nombre o descripción
    filterCategories() {
        const term = this.searchTerm.toLowerCase();
        this.filteredCategories = this.categories.filter((cat) => cat.name.toLowerCase().includes(term) || (cat.description?.toLowerCase().includes(term) ?? false));
    }

    // ➕ Nueva categoría
    openNewDialog() {
        this.dialogTitle = 'Nueva Categoría';
        this.newCategory = { name: '', description: '', active: true };
        this.editingCategory = null;
        this.showDialog = true;
    }

    // ✏️ Editar categoría
    editCategory(cat: Category) {
        this.dialogTitle = 'Editar Categoría';
        this.newCategory = { ...cat };
        this.editingCategory = cat;
        this.showDialog = true;
    }

    // 💾 Guardar o actualizar
    saveCategory() {
        if (!this.newCategory.name.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Campo obligatorio',
                detail: 'El nombre de la categoría es requerido.'
            });
            return;
        }

        const isEditing = !!this.editingCategory;

        this.masterService.createCategory(this.newCategory).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: isEditing ? 'Categoría actualizada correctamente.' : 'Categoría creada correctamente.'
                    });
                    this.showDialog = false;
                    this.loadCategories();
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
                    detail: 'Ocurrió un problema al guardar la categoría.'
                });
            }
        });
    }

    // 🚫 Eliminar lógico
    deleteCategory(cat: Category) {
        this.masterService.deleteCategory({ ...cat, active: false }).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Desactivada',
                        detail: `Categoría "${cat.name}" desactivada correctamente.`
                    });
                    this.loadCategories();
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
                    detail: 'No se pudo eliminar la categoría.'
                });
            }
        });
    }
}
