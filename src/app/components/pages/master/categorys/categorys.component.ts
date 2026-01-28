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

    constructor(
        private posService: PosService,
        private messageService: MessageService,
        private masterService: MasterService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        const session = this.authService.getSession() as AuthSession;
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
