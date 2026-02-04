import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';

import { Module, Permission, Role, User } from '../../api/permissions';
import { MasterService } from '../../../services/master.service';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../core/guards/auth.service';
import { AuthSession } from '../../api/login';
import { LoginService } from '../../../services/login.service';

@Component({
    selector: 'app-permissions',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, PasswordModule, ToastModule, ButtonModule, InputTextModule, TagModule, TableModule, DialogModule, DropdownModule, InputSwitchModule, TabViewModule, DividerModule],
    providers: [MessageService, MasterService],
    templateUrl: './permissions.component.html',
    styleUrl: './permissions.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class PermissionsModuleComponent implements OnInit {
    // =========================
    // UI STATE
    // =========================
    searchTerm: string = '';
    showRoleDialog: boolean = false;
    showUserDialog: boolean = false;
    activeTab: string = 'roles';
    isEditingUser: boolean = false;

    // =========================
    // DATA
    // =========================
    roles: Role[] = [];
    modules: Module[] = [];
    users: User[] = [];

    currentRole: Role = this.initializeNewRole();
    currentUser: User = {} as User;

    loanding: boolean = false;
    companiaId: number = 1;

    permissions: Permission[] = [];

    canView = false;
    canCreate = false;
    canEdit = false;
    canDelete = false;
    canExport = false;

    // =========================
    // CONSTRUCTOR
    // =========================
    constructor(
        private masterService: MasterService,
        private messageService: MessageService,
        private authService: AuthService,
        private loginService: LoginService
    ) {}

    // =========================
    // INIT
    // =========================
    ngOnInit(): void {
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

        this.loadModules();
        this.loadUsers();
    }

    private applyPermissions(): void {
        const moduleName = 'Permisos';

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

    // =========================
    // LOADERS
    // =========================
    loadRoles() {
        this.masterService.getRoles(this.companiaId).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.roles = res.data || [];
                    this.roles = this.roles.filter((r) => r.name.toLowerCase() !== 'sin rol');
                    this.updateRoleUserCounts();
                } else {
                    this.showWarn(res.message);
                }
            },
            error: () => this.showError('Error al cargar los roles.')
        });
    }

    loadModules() {
        this.masterService.getModules().subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.modules = res.data || [];
                    this.loadRoles();
                } else {
                    this.showWarn(res.message);
                }
            },
            error: () => this.showError('Error al cargar los módulos.')
        });
    }

    loadRolePermissions(roleId: number) {
        this.masterService.getRolePermissions(roleId).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.currentRole.permissions = res.data || [];
                }
            }
        });
    }

    getActiveCount(): number {
        return this.users.filter((u) => u.status).length;
    }

    // =========================
    // ROLE CRUD
    // =========================
    openRoleDialog() {
        this.currentRole = this.initializeNewRole();
        this.showRoleDialog = true;
    }

    editRole(role: Role) {
        this.currentRole = JSON.parse(JSON.stringify(role));
        this.loadRolePermissions(role.id);
        this.showRoleDialog = true;
    }

    saveRole() {
        this.loanding = true;
        if (!this.currentRole.name || !this.currentRole.description) {
            this.showWarn('Debe completar los campos obligatorios.');
            return;
        }

        let body = {
            id: this.currentRole.id,
            companiaId: this.companiaId,
            name: this.currentRole.name,
            description: this.currentRole.description,
            isActive: this.currentRole.isActive
        };

        console.log('Guardando rol:', body);

        this.masterService.saveRole(body).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.saveRolePermissions(res.data);
                } else {
                    this.loanding = false;
                    this.showError(res.message);
                }
            },
            error: () => {
                this.showError('Error al guardar el rol.');
                this.loanding = false;
            }
        });
    }

    deleteRole(role: Role) {
        if (!confirm(`¿Deseas eliminar el rol "${role.name}"?`)) return;

        this.masterService.deleteRole(role.id).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.roles = this.roles.filter((r) => r.id !== role.id);
                    this.showSuccess(res.message);
                } else {
                    this.showWarn(res.message);
                }
            },
            error: () => this.showError('No se pudo eliminar el rol.')
        });
    }

    // =========================
    // PERMISSIONS
    // =========================
    getPermissionForModule(moduleId: number): Permission | undefined {
        return this.currentRole.permissions.find((p) => p.moduleId === moduleId);
    }

    updateRolePermission(moduleId: number, key: keyof Permission, value: boolean) {
        this.currentRole.permissions = this.currentRole.permissions.map((p) => {
            if (p.moduleId === moduleId) {
                const updated = { ...p, [key]: value };

                if (key === 'canView' && !value) {
                    updated.canCreate = false;
                    updated.canEdit = false;
                    updated.canDelete = false;
                    updated.canExport = false;
                }
                return updated;
            }
            return p;
        });
    }

    saveRolePermissions(roleId: number) {
        let body = this.currentRole.permissions.map((perm) => ({
            roleId: roleId,
            moduleId: perm.moduleId,
            canView: perm.canView,
            canCreate: perm.canCreate,
            canEdit: perm.canEdit,
            canDelete: perm.canDelete,
            canExport: perm.canExport
        }));

        console.log('Guardando permisos:', body);

        this.masterService.saveRolePermission(body).subscribe((res) => {
            this.loanding = false;
            if (res.code === 0) {
                this.showSuccess(res.message);
                this.showRoleDialog = false;
                this.resetCurrentRole();
                this.loadRoles();
            } else {
                this.showError(res.message);
            }
        });
    }

    // =========================
    // HELPERS
    // =========================
    private initializeNewRole(): Role {
        return {
            id: 0,
            name: '',
            description: '',
            permissions: this.modules.map((m) => ({
                moduleId: m.id,
                module: m.name,
                canView: false,
                canCreate: false,
                canEdit: false,
                canDelete: false,
                canExport: false
            })),
            isActive: true,
            userCount: 0,
            createdAt: new Date().toISOString()
        };
    }

    private resetCurrentRole() {
        this.currentRole = this.initializeNewRole();
    }

    private updateRoleUserCounts(): void {
        this.roles = this.roles.map((role) => ({
            ...role,
            userCount: this.users.filter((u) => u.rolId === role.id).length
        }));
    }

    // =========================
    // FILTERS & GETTERS
    // =========================
    get filteredRoles(): Role[] {
        return this.roles.filter((r) => r.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || r.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
    }

    get activeRolesForDropdown(): Role[] {
        return this.roles.filter((r) => r.isActive);
    }

    getRolePermissionsSummary(role: Role): string {
        const active = role.permissions.filter((p) => p.canView).length;
        return `${active} de ${this.modules.length}`;
    }
    // =========================
    // usuarios
    // =========================
    loadUsers(): void {
        this.masterService.getUsers(this.companiaId).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.users = res.data;
                }
            }
        });
    }

    // Abrir modal para crear o editar
    openUserDialog(user?: User): void {
        debugger;
        if (user) {
            // Editar
            this.isEditingUser = true;
            this.currentUser = { ...user }; // clon para no mutar la tabla
        } else {
            // Crear
            this.isEditingUser = false;
            this.currentUser = {
                id: 0,
                companiaId: this.companiaId,
                rolId: 0,
                rol: '',
                firstName: '',
                middleName: '',
                lastName: '',
                secondLastName: '',
                email: '',
                password: '',
                session: false,
                status: true
            };
        }

        this.showUserDialog = true;
    }

    // Guardar (crear o editar)
    saveUser(): void {
        if (!this.currentUser) return;
        console.log('Guardando usuario:', this.currentUser);
        this.masterService.createUser(this.currentUser).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.loadUsers();
                    this.showSuccess('Usuario guardado correctamente.');
                    this.showUserDialog = false;
                }
            }
        });
    }

    // Editar usuario
    editUser(user: User): void {
        this.isEditingUser = true;
        this.currentUser = user;
        this.showUserDialog = true;
    }

    // Eliminar usuario
    deleteUser(user: User): void {
        this.masterService.deleteUser(user).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.loadUsers();
                }
            }
        });
    }

    // =========================
    // MESSAGES
    // =========================
    private showSuccess(detail?: string) {
        this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail
        });
    }

    private showWarn(detail?: string) {
        this.messageService.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail
        });
    }

    private showError(detail?: string) {
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail
        });
    }
}
