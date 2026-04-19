import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';

import { SendingService } from '../../services/sending.service';
import { MasterService } from '../../services/master.service';
import { AuthService } from '../core/guards/auth.service';
import { AuthSession } from '../api/login';
import { ApiResponse, Product, Warehouse, PosProduct } from '../api/shared';
import { Sending, SendingCreateRequest, SendingDetailItem, SendingDetalleItem, SendingActionRequest, CompanyWithStock } from '../api/sending';
import { Permission } from '../api/permissions';
import { LoginService } from '../../services/login.service';

@Component({
    selector: 'app-sending',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        DropdownModule,
        TableModule,
        ToastModule,
        DialogModule,
        TagModule,
        AutoCompleteModule,
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: './sending.component.html',
    styleUrls: ['./sending.component.scss']
})
export class SendingComponent implements OnInit {
    activeView: 'form' | 'list' = 'form';

    companiaId: number = 0;
    userId: number = 0;
    loading: boolean = false;

    companies: CompanyWithStock[] = [];
    filteredProducts: PosProduct[] = [];
    allProducts: PosProduct[] = [];

    sendings: Sending[] = [];
    selectedSending: Sending | null = null;
    displayDetailDialog: boolean = false;
    sendingDetails: SendingDetalleItem[] = [];

    newSending: SendingCreateRequest = {
        companiaOrigen: 0,
        companiaDestino: 0,
        usuario: 0,
        observacion: '',
        detalle: []
    };

    selectedProduct: any = null;

    permissions: Permission[] = [];
    canView = false;
    canCreate = false;
    canEdit = false;
    canDelete = false;

    statusOptions = [
        { label: 'PENDIENTE', value: 'PENDIENTE', severity: 'warn' },
        { label: 'APROBADO', value: 'APROBADO', severity: 'success' },
        { label: 'RECHAZADO', value: 'RECHAZADO', severity: 'danger' }
    ];

    constructor(
        private sendingService: SendingService,
        private masterService: MasterService,
        private authService: AuthService,
        private loginService: LoginService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        const session = this.authService.getSession() as AuthSession;

        if (!session) {
            this.resetPermissions();
            return;
        }

        this.companiaId = session.companiaId;
        this.userId = session.userId;
        this.newSending.usuario = this.userId;

        this.loginService.getPermissions(this.userId, this.companiaId).subscribe({
            next: (permissions) => {
                this.permissions = permissions.data ?? [];
                this.applyPermissions();
            },
            error: () => this.resetPermissions()
        });

        this.loadCompanies();
        this.loadProducts();
        this.loadSendings();
    }

    private applyPermissions(): void {
        const moduleName = 'Remision';
        const permission = this.permissions.find((p) => p.module === moduleName);

        if (!permission) {
            this.resetPermissions();
            return;
        }

        this.canView = permission.canView;
        this.canCreate = permission.canCreate;
        this.canEdit = permission.canEdit;
        this.canDelete = permission.canDelete;
    }

    private resetPermissions(): void {
        this.canView = false;
        this.canCreate = false;
        this.canEdit = false;
        this.canDelete = false;
    }

    loadCompanies() {
        this.sendingService.getCompanies().subscribe({
            next: (res) => {
                this.companies = res.data?.map((c: any) => ({
                    id: c.id || c.Id,
                    razonSocial: c.razonSocial || c.RazonSocial || c.razon_social,
                    nit: c.nit || c.Nit || c.nit
                })) || [];
            },
            error: (err) => console.error('Error cargando compañías:', err)
        });
    }

    loadProducts() {
        this.sendingService.getProductsWithStock(this.companiaId).subscribe({
            next: (res) => {
                this.allProducts = res.data || [];
                this.filteredProducts = [...this.allProducts];
            },
            error: (err) => console.error('Error cargando productos:', err)
        });
    }

    loadSendings() {
        this.sendingService.getAll(this.companiaId).subscribe({
            next: (res) => {
                this.sendings = res.data || [];
            },
            error: (err) => console.error('Error cargando remisiones:', err)
        });
    }

    filterProducts(event: any) {
        const query = event.query.toLowerCase().trim();
        if (!query) {
            this.filteredProducts = [...this.allProducts];
            return;
        }

        this.filteredProducts = this.allProducts.filter((p) => {
            return p.name?.toLowerCase().includes(query) ||
                   p.reference?.toLowerCase().includes(query) ||
                   p.barcode?.toLowerCase().includes(query);
        });
    }

    onProductSelect(product: any) {
        const selected = product.value;

        if (this.newSending.detalle.some((item) => item.rowidProducto === selected.id)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Producto existente',
                detail: 'El producto ya está en la remisión'
            });
            return;
        }

        this.newSending.detalle.push({
            rowidProducto: selected.id,
            cantidad: 1,
            productName: selected.name,
            productCode: selected.code?.toString(),
            disponible: selected.stock || 0
        });

        this.selectedProduct = null;
    }

    removeItem(index: number) {
        this.newSending.detalle.splice(index, 1);
    }

    updateQuantity(item: SendingDetailItem) {
        if (item.disponible && item.cantidad > item.disponible) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Stock insuficiente',
                detail: `Solo hay ${item.disponible} unidades disponibles`
            });
            item.cantidad = item.disponible;
        }
    }

    saveSending() {
        if (!this.newSending.companiaOrigen || this.newSending.companiaOrigen === 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Compañía origen requerida',
                detail: 'Seleccione la compañía de origen'
            });
            return;
        }

        if (!this.newSending.companiaDestino || this.newSending.companiaDestino === 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Compañía destino requerida',
                detail: 'Seleccione la compañía de destino'
            });
            return;
        }

        if (this.newSending.companiaOrigen === this.newSending.companiaDestino) {
            this.messageService.add({
                severity: 'error',
                summary: 'Compañías iguales',
                detail: 'La compañía origen y destino deben ser diferentes'
            });
            return;
        }

        if (!this.newSending.detalle || this.newSending.detalle.length === 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Detalle requerido',
                detail: 'Agregue productos a la remisión'
            });
            return;
        }

        for (const item of this.newSending.detalle) {
            if (!item.cantidad || item.cantidad <= 0) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Cantidad inválida',
                    detail: 'Todos los productos deben tener cantidad mayor a 0'
                });
                return;
            }
        }

        this.loading = true;

        const request: SendingCreateRequest = {
            companiaOrigen: this.newSending.companiaOrigen,
            companiaDestino: this.newSending.companiaDestino,
            usuario: this.userId,
            observacion: this.newSending.observacion || '',
            detalle: this.newSending.detalle.map((d) => ({
                rowidProducto: d.rowidProducto,
                cantidad: d.cantidad
            }))
        };

        this.sendingService.create(request).subscribe({
            next: (res) => {
                this.loading = false;
                if (res.code === 0) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Remisión creada correctamente'
                    });
                    this.resetForm();
                    this.loadSendings();
                    this.activeView = 'list';
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.message || 'No se pudo crear la remisión'
                    });
                }
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión'
                });
            }
        });
    }

    resetForm() {
        this.newSending = {
            companiaOrigen: 0,
            companiaDestino: 0,
            usuario: this.userId,
            observacion: '',
            detalle: []
        };
    }

    approveSending(sending: Sending) {
        this.loading = true;

        const request: SendingActionRequest = { rowid: sending.rowid, usuario: this.userId };

        this.sendingService.approve(request).subscribe({
            next: (res) => {
                this.loading = false;
                if (res.code === 0) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Remisión aprobada'
                    });
                    this.loadSendings();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.message
                    });
                }
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión'
                });
            }
        });
    }

    rejectSending(sending: Sending) {
        this.loading = true;

        const request: SendingActionRequest = { rowid: sending.rowid, usuario: this.userId };

        this.sendingService.reject(request).subscribe({
            next: (res) => {
                this.loading = false;
                if (res.code === 0) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Remisión rechazada'
                    });
                    this.loadSendings();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: res.message
                    });
                }
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión'
                });
            }
        });
    }

    viewDetails(sending: Sending) {
        this.selectedSending = sending;

        this.sendingService.getById(sending.rowid).subscribe({
            next: (res) => {
                if (res.code === 0 && res.data) {
                    this.sendingDetails = res.data.detalle || [];
                    this.displayDetailDialog = true;
                }
            },
            error: (err) => console.error('Error obteniendo detalles:', err)
        });
    }

    getCompanyName(id: number): string {
        const company = this.companies.find((c) => c.id === id);
        return company ? company.razonSocial : 'N/A';
    }

    getSeverity(status: string): string {
        switch (status) {
            case 'PENDIENTE': return 'warn';
            case 'APROBADO': return 'success';
            case 'RECHAZADO': return 'danger';
            default: return 'info';
        }
    }

    getTotalUnits(): number {
        return this.newSending.detalle.reduce((acc, item) => acc + (item.cantidad || 0), 0);
    }
}
