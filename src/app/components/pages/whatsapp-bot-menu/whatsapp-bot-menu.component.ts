import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { SetWaBotNodeRequest, WaBotNode } from '../api/whatsappagents';
import { WhatsappService } from '../../services/whatsapp.service';

interface WaBotNodeForm {
    rowid: number;
    rowid_padre: number | null;
    numero: number;
    palabra_clave: string;
    mensaje_respuesta: string;
    prioridad: number;
    activo: boolean;
}

interface ParentOption {
    label: string;
    value: number | null;
}

@Component({
    selector: 'app-whatsapp-bot-menu',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, DialogModule, DropdownModule, InputNumberModule, InputSwitchModule, InputTextModule, TableModule, TextareaModule, TagModule, ToastModule],
    providers: [MessageService],
    templateUrl: './whatsapp-bot-menu.component.html',
    styleUrl: './whatsapp-bot-menu.component.scss'
})
export class WhatsappBotMenuComponent implements OnInit {
    nodes: WaBotNode[] = [];
    selectedNodeId: number | null = null;

    showNodeDialog = false;
    isEditing = false;
    loading = false;
    saving = false;

    form: WaBotNodeForm = this.getEmptyForm();

    constructor(
        private whatsappService: WhatsappService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadNodes();
    }

    get parentOptions(): ParentOption[] {
        return [{ label: 'Raiz (menu principal)', value: null }, ...this.nodes.map((node) => ({ label: this.getNodeLabel(node), value: node.rowid }))];
    }

    get sortedNodes(): WaBotNode[] {
        return [...this.nodes].sort((a, b) => {
            const parentA = a.rowid_padre ?? 0;
            const parentB = b.rowid_padre ?? 0;

            if (parentA !== parentB) {
                return parentA - parentB;
            }

            if (a.numero !== b.numero) {
                return a.numero - b.numero;
            }

            return a.rowid - b.rowid;
        });
    }

    openCreateDialog(parentId: number | null = null): void {
        this.isEditing = false;
        this.form = this.getEmptyForm();
        this.form.rowid_padre = parentId;
        this.form.numero = this.getNextOptionNumber(parentId);
        this.showNodeDialog = true;
    }

    openEditDialog(node: WaBotNode): void {
        this.isEditing = true;
        this.form = {
            rowid: node.rowid,
            rowid_padre: node.rowid_padre,
            numero: node.numero,
            palabra_clave: node.palabra_clave,
            mensaje_respuesta: node.mensaje_respuesta,
            prioridad: node.prioridad,
            activo: node.activo
        };
        this.showNodeDialog = true;
    }

    saveNode(): void {
        const optionText = this.form.palabra_clave.trim();
        const messageText = this.form.mensaje_respuesta.trim();

        if (!optionText || !messageText || this.form.numero === null || this.form.numero < 0) {
            this.showWarn('Completa los campos obligatorios para guardar.');
            return;
        }

        const payload: SetWaBotNodeRequest = {
            rowid: this.form.rowid,
            rowid_padre: this.form.rowid_padre,
            numero: this.form.numero,
            palabra_clave: optionText,
            mensaje_respuesta: messageText,
            prioridad: this.form.prioridad,
            activo: this.form.activo
        };

        this.saving = true;
        this.whatsappService.saveBotMenuNode(payload).subscribe({
            next: (res) => {
                this.saving = false;

                if (res.code !== 0) {
                    this.showError(res.message || 'No fue posible guardar el nodo.');
                    return;
                }

                this.showNodeDialog = false;
                this.showSuccess('Nodo guardado correctamente.');
                this.loadNodes(payload.rowid === 0 ? res.data : payload.rowid);
            },
            error: () => {
                this.saving = false;
                this.showError('Error de conexion al guardar el nodo.');
            }
        });
    }

    selectNode(nodeId: number): void {
        this.selectedNodeId = nodeId;
    }

    deleteNode(node: WaBotNode): void {
        this.whatsappService.deleteBotMenuNode(node.rowid).subscribe({
            next: (res) => {
                if (res.code !== 0) {
                    this.showError(res.message || 'No fue posible eliminar el nodo.');
                    return;
                }

                this.showSuccess('Nodo desactivado correctamente.');
                this.loadNodes();
            },
            error: () => this.showError('Error de conexion al eliminar el nodo.')
        });
    }

    getParentLabel(parentId: number | null): string {
        if (parentId === null) {
            return 'Menu principal';
        }

        const parent = this.nodes.find((node) => node.rowid === parentId);
        return parent ? parent.palabra_clave : 'Sin padre';
    }

    private loadNodes(preferredNodeId?: number): void {
        this.loading = true;
        this.whatsappService.getBotMenuNodes().subscribe({
            next: (res) => {
                this.loading = false;

                if (res.code !== 0) {
                    this.showError(res.message || 'No fue posible cargar el flujo del bot.');
                    return;
                }

                this.nodes = res.data || [];
                this.initializeSelection(preferredNodeId);
            },
            error: () => {
                this.loading = false;
                this.showError('Error de conexion al cargar flujo del bot.');
            }
        });
    }

    private initializeSelection(preferredNodeId?: number): void {
        const hasPreferred = preferredNodeId && this.nodes.some((node) => node.rowid === preferredNodeId);

        if (hasPreferred) {
            this.selectNode(preferredNodeId as number);
            return;
        }

        const rootNode = this.nodes.find((node) => node.rowid_padre === null && node.activo);

        if (rootNode) {
            this.selectNode(rootNode.rowid);
            return;
        }

        this.selectedNodeId = null;
    }

    private getEmptyForm(): WaBotNodeForm {
        return {
            rowid: 0,
            rowid_padre: null,
            numero: 1,
            palabra_clave: '',
            mensaje_respuesta: '',
            prioridad: 1,
            activo: true
        };
    }

    private getNodeLabel(node: WaBotNode): string {
        return `${node.numero} - ${node.palabra_clave}`;
    }

    private getNextOptionNumber(parentId: number | null): number {
        const siblings = this.nodes.filter((node) => node.rowid_padre === parentId);
        if (!siblings.length) {
            return 1;
        }

        return Math.max(...siblings.map((node) => node.numero)) + 1;
    }

    private showSuccess(detail: string): void {
        this.messageService.add({ severity: 'success', summary: 'OK', detail });
    }

    private showWarn(detail: string): void {
        this.messageService.add({ severity: 'warn', summary: 'Atencion', detail });
    }

    private showError(detail: string): void {
        this.messageService.add({ severity: 'error', summary: 'Error', detail });
    }
}
