import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MasterService } from '../../../services/master.service';
import { Company } from '../../api/master';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-company',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, DialogModule, ConfirmDialogModule, InputTextModule, ButtonModule, TooltipModule, ToastModule],
    providers: [ConfirmationService, MessageService],
    templateUrl: './company.component.html',
    styleUrl: './company.component.scss'
})
export class CompanyComponent implements OnInit {
    // Listado y Búsqueda
    companies: Company[] = [];
    filteredCompanies: Company[] = [];
    searchTerm: string = '';

    // Estado de Modales
    showDialog: boolean = false;
    dialogTitle: string = 'Nueva Compañía';

    // Manejo de Imagen
    selectedImage: string | null = null;

    // Modelo alineado con el SP (PascalCase para el GET, camel_case para el PAYLOAD)
    activeCompany: any = {
        companyId: 0,
        nit: '',
        verificationDigit: 0,
        businessName: '',
        email: '',
        address: '',
        image: ''
    };

    constructor(
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private masterService: MasterService
    ) {}

    ngOnInit() {
        this.loadCompanies();
    }

    loadCompanies() {
        this.masterService.getCompanies().subscribe({
            next: (res) => {
                console.log('Respuesta de getCompanies:', res);
                if (res.code === 0) {
                    this.companies = res.data || [];
                    this.filteredCompanies = [...this.companies];
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: res.message || 'No se pudieron cargar los clientes.'
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar los clientes desde el servidor.'
                });
            }
        });
    }

    filterCompanies() {
        if (!this.searchTerm) {
            this.filteredCompanies = [...this.companies];
        } else {
            const search = this.searchTerm.toLowerCase();
            this.filteredCompanies = this.companies.filter((c) => c.businessName?.toLowerCase().includes(search) || c.nit?.toLowerCase().includes(search));
        }
    }

    // Cambiado de openCreateModal a openNewDialog para match con el HTML
    openNewDialog() {
        this.dialogTitle = 'Nueva Compañía';
        this.activeCompany = { companyId: 0, nit: '', verificationDigit: 0, businessName: '', email: '', address: '', image: '' };
        this.selectedImage = null;
        this.showDialog = true;
    }

    editCompany(company: any) {
        this.dialogTitle = 'Editar Compañía';
        this.activeCompany = { ...company };
        this.selectedImage = company.image;
        this.showDialog = true;
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.selectedImage = e.target.result;
                this.activeCompany.Image = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    saveCompany() {
        // =========================
        // Validaciones básicas
        // =========================
        if (!this.activeCompany.nit || this.activeCompany.verificationDigit === null || !this.activeCompany.businessName) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Verificación requerida',
                detail: 'NIT, dígito de verificación y razón social son obligatorios.'
            });
            return;
        }

        // =========================
        // Payload para el SP
        // =========================
        const payload = {
            option: 'CREATE',
            companyId: this.activeCompany.companyId ?? 0,
            userId: 1, // luego lo sacas del token
            nit: this.activeCompany.nit,
            verificationDigit: this.activeCompany.verificationDigit,
            businessName: this.activeCompany.businessName,
            email: this.activeCompany.email,
            address: this.activeCompany.address,
            image: this.activeCompany.image
        };

        // =========================
        // Llamada al servicio
        // =========================
        const operation = this.masterService.createCompany(payload);

        operation.subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: payload.companyId > 0 ? 'Compañía actualizada correctamente.' : 'Compañía creada correctamente.'
                    });

                    this.showDialog = false;
                    location.reload();
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al guardar la compañía.'
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Unexpected error while saving the company.'
                });
            }
        });
    }

    deleteCompany(company: any) {
        this.confirmationService.confirm({
            message: `¿Estás seguro de eliminar a ${company.BusinessName}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            /* acceptCellStyleClass: 'p-button-danger', */
            accept: () => {
                console.log('SP Option DELETE para ID:', company.Id);
                // this.service.delete(company.Id)...
            }
        });
    }
}
