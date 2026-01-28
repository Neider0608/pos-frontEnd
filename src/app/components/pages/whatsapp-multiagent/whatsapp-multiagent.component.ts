// 🔹 Angular
import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// 🔹 PrimeNG
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';

// 🔹 Mock / Models
import { MOCK_CONVERSATIONS, MOCK_AGENTS, Conversation, Message, ConversationStatus, MessageSend, PhoneNumbers } from '../api/whatsappagents';
import { PosService } from '../../services/pos.service';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { OverlayModule } from 'primeng/overlay';
import { MenuModule } from 'primeng/menu';
import { PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { SignalrService } from '../../services/signalr.service';
import { WhatsappService } from '../../services/whatsapp.service';

@Component({
    selector: 'app-whatsapp-multiagent',
    standalone: true,
    templateUrl: './whatsapp-multiagent.component.html',
    styleUrl: './whatsapp-multiagent.component.scss',
    imports: [
        CommonModule,
        FormsModule,

        // PrimeNG
        CardModule,
        BadgeModule,
        ButtonModule,
        InputTextModule,
        DropdownModule,
        DialogModule,
        OverlayModule,
        MenuModule,
        PopoverModule,
        TooltipModule,
        TableModule
    ],
    providers: [MessageService, PosService, WhatsappService]
})
export class WhatsappMultiagentComponent implements OnInit, AfterViewChecked, OnDestroy {
    @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
    @ViewChild('attachmentMenu') attachmentMenu!: any;
    @ViewChild('fileInput') fileInput!: any;
    @ViewChild('quickReplies') quickReplies!: any;

    private shouldScroll = false;
    conversations: Conversation[] = [];
    phoneNumbers: PhoneNumbers[] = [];
    selectedPhoneNumber?: PhoneNumbers;
    messages: Message[] = [];
    agents: any[] = [];

    activeConversation: Conversation = {} as Conversation;
    messageText = '';
    loadingMessages = false;
    showImageModal = false;
    selectedImage?: string | null = null;
    // En tu archivo .ts
    attachmentItems = [
        {
            label: 'Adjuntar',
            items: [
                {
                    label: 'Imagen',
                    icon: 'pi pi-image',
                    command: () => {
                        // Accedemos al input de imagen por su ViewChild o ID
                        (document.querySelector('input[type="file"][accept="image/*"]') as HTMLElement).click();
                    }
                },
                {
                    label: 'Documento',
                    icon: 'pi pi-file',
                    command: () => {
                        // Accedemos al input de documentos
                        (document.querySelector('input[type="file"][accept*=".pdf"]') as HTMLElement).click();
                    }
                }
            ]
        }
    ];

    // Corregimos la función de respuestas rápidas

    selectedFiles: File[] = [];
    previewImages: { file: File; url: string }[] = [];
    loadingSendMessage: boolean = false;
    MAX_FILES = 5;
    MAX_FILE_SIZE_MB = 10;
    showPreviewModal: boolean = false;
    sendingMessage: boolean = false;
    private acceptedTypes = '';
    showEditName = false;
    editedClientName: string = '';
    showHistory: boolean = false;
    // Simula agente logueado

    currentAgentId = 2;
    statusOptions = [
        { label: 'Abierto', value: 'open' },
        { label: 'En progreso', value: 'in_progress' },
        { label: 'Cerrado', value: 'closed' }
    ];

    templateOptions = [
        {
            label: 'Saludo inicial',
            value: 'WELCOME'
        },
        {
            label: 'Seguimiento pedido',
            value: 'ORDER_FOLLOWUP'
        },
        {
            label: 'Cierre de conversación',
            value: 'CLOSING'
        }
    ];

    quickRepliesList = ['Hola 👋 ¿En qué puedo ayudarte?', 'Ya reviso tu caso, dame un momento por favor', '¿Podrías enviarme un poco más de información?', 'Gracias por comunicarte con nosotros 😊'];

    selectedTemplate: string | null = null;

    constructor(
        private posService: PosService,
        private messageService: MessageService,
        private signalRService: SignalrService,
        private whatsappService: WhatsappService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadPhoneNumbers();

        this.signalRService.connect();

        this.signalRService.messageArrived$.subscribe(({ phoneNumberId }) => {
            this.onNewMessage(phoneNumberId);
        });
    }
    ngAfterViewChecked(): void {
        if (this.shouldScroll) {
            this.scrollToBottom();
        }
    }
    ngOnDestroy(): void {
        if (this.selectedPhoneNumber) {
            this.signalRService.leavePhoneGroup(this.selectedPhoneNumber.phoneNumberId);
        }
        this.signalRService.disconnect();
    }

    onNewMessage(phoneNumberId: string, conversationId?: number) {
        if (this.selectedPhoneNumber?.phoneNumberId !== phoneNumberId) return;

        this.loadMessages(this.activeConversation?.id);
        this.shouldScroll = true;
        return;
    }

    onPhoneNumberChange() {
        if (!this.selectedPhoneNumber) return;

        this.signalRService.joinPhoneGroup(this.selectedPhoneNumber.phoneNumberId);

        this.activeConversation = {} as Conversation;
        this.messages = [];

        this.loadConversations(this.selectedPhoneNumber.phoneNumberId);
    }

    scrollToBottom(): void {
        try {
            const el = this.messagesContainer.nativeElement;
            el.scrollTop = el.scrollHeight;
        } catch {}
    }

    loadAgents(): void {
        if (!this.selectedPhoneNumber) return;
        this.whatsappService.getAgentsByPhoneNumberId(this.selectedPhoneNumber.phoneNumberId).subscribe({
            next: (res: any) => {
                this.agents = res.data || [];
            },
            error: () => {
                /*  this.showToast('error', 'Error', 'Could not load assigned agents'); */
            }
        });
    }

    // ==============================
    // 🔹 CONVERSATION ACTIONS
    // ==============================
    selectConversation(conv: Conversation): void {
        if (!conv.lockedByAgentId) {
            conv.lockedByAgentId = this.currentAgentId;
            conv.status = 'pending';
        }

        this.activeConversation = conv;

        this.loadMessages(conv.id);
        this.shouldScroll = true;
    }

    closeConversation(conv: Conversation): void {
        conv.status = 'closed';
        conv.lockedByAgentId = null;
    }

    // ==============================
    // 🔹 PERMISSIONS
    // ==============================
    canWrite(conv: Conversation): boolean {
        return conv.lockedByAgentId === this.currentAgentId && conv.status !== 'closed';
    }

    // ==============================
    // 🔹 HELPERS
    // ==============================
    getAgentName(id: number | null): string {
        return this.agents.find((agent) => agent.id === id)?.name || 'Sin asignar';
    }

    statusSeverity(status: ConversationStatus): 'success' | 'info' | 'warn' | 'secondary' {
        switch (status) {
            case 'open':
                return 'warn';

            case 'pending':
                return 'secondary';

            case 'in_progress':
                return 'info';

            case 'closed':
                return 'success';

            default:
                return 'secondary';
        }
    }

    // ==============================
    // 🔹 MESSAGES
    // ==============================
    sendMessage() {
        if (!this.messageText && this.selectedFiles.length === 0) return;

        const formData = new FormData();

        formData.append('conversationId', this.activeConversation!.id.toString());
        formData.append('senderUserId', '1'); // agente
        formData.append('to', this.activeConversation!.clientPhone);

        if (this.messageText?.trim()) {
            formData.append('messageText', this.messageText);
        }
        if (this.messageText?.trim()) {
            formData.append('phoneNumberId', this.selectedPhoneNumber!.phoneNumberId);
        }
        if (this.messageText?.trim()) {
            formData.append('accessToken', this.selectedPhoneNumber!.accessToken);
        }

        // 🔥 múltiples archivos
        this.selectedFiles.forEach((file) => {
            formData.append('files', file, file.name);
        });
        console.log('Enviando mensaje con payload:', formData);

        this.sendingMessage = true;

        this.whatsappService.sendMessage(formData).subscribe({
            next: (res) => {
                this.sendingMessage = false;

                if (res.code === 0) {
                    this.messageText = '';
                    this.selectedFiles = [];

                    this.loadMessages(this.activeConversation!.id);
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: res.message
                    });
                }
            },
            error: () => {
                this.sendingMessage = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo enviar el mensaje.'
                });
            }
        });
    }

    private generateTempMessageId(): number {
        return Date.now(); // mientras no venga desde SQL Server
    }

    updateStatus(conv: Conversation): void {
        if (!conv) return;

        // Si se cierra, liberar el lock
        if (conv.status === 'closed') {
            conv.lockedByAgentId = null;
        }

        conv.updatedAt = new Date().toISOString();

        // 🔜 aquí luego va API / SQL Server
    }

    is24hWindowOpen(): boolean {
        const lastClientMessage = [...this.messages].reverse().find((m) => m.from === 'client');

        if (!lastClientMessage) return false;

        const lastTime = new Date(lastClientMessage.timestamp).getTime();
        const now = Date.now();

        const hoursDiff = (now - lastTime) / (1000 * 60 * 60);
        return hoursDiff <= 24;
    }

    sendTemplate(): void {
        if (!this.selectedTemplate || !this.activeConversation) return;

        this.activeConversation.messages.push({
            id: Date.now(),
            from: 'agent',
            type: 'TEMPLATE',
            templateName: this.selectedTemplate,
            timestamp: new Date().toISOString(),
            status: 'SENT'
        });

        this.selectedTemplate = null;
    }

    sendFiles() {
        this.sendMessage();

        this.cancelFiles();
    }

    cancelFiles() {
        this.selectedFiles = [];
        this.previewImages = [];
        this.showPreviewModal = false;
    }

    // ============================================================
    // 🔹 CARGA DE DATOS DESDE BACKEND
    // ============================================================

    loadPhoneNumbers() {
        /*         alert('Cargando conversaciones desde backend...'); */
        this.whatsappService.getByPhoneNumbers().subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.phoneNumbers = res.data || [];
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: res.message || 'No se pudieron cargar los números de telefonos.'
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar las conversaciones desde el servidor.'
                });
            }
        });
    }

    loadConversations(phoneNumberId?: string) {
        /*         alert('Cargando conversaciones desde backend...'); */
        this.whatsappService.getConversations(phoneNumberId).subscribe({
            next: (res) => {
                if (res.code === 0) {
                    this.conversations = res.data || [];
                    this.loadAgents();
                    this.shouldScroll = false;
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: res.message || 'No se pudieron cargar las conversaciones.'
                    });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar las conversaciones desde el servidor.'
                });
            }
        });
    }

    loadMessages(conversationId: number) {
        this.messages = [];
        this.loadingMessages = true;
        this.whatsappService.getMessagesByConversationId(conversationId).subscribe({
            next: (res) => {
                this.loadingMessages = false;
                if (res.code === 0) {
                    this.messages = res.data || [];
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Advertencia',
                        detail: res.message || 'No se pudieron cargar los mensajes.'
                    });
                }
            },
            error: () => {
                this.loadingMessages = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar las mensajes desde el servidor.'
                });
            }
        });
    }

    openImage(url?: string) {
        this.selectedImage = url;
        this.showImageModal = true;
    }

    toggleAttachmentMenu(event: Event) {
        this.attachmentMenu.toggle(event);
    }

    selectFile(accept: string) {
        this.acceptedTypes = accept;
        this.fileInput.nativeElement.accept = accept;
        this.fileInput.nativeElement.click();
    }

    onFilesSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (!input.files) return;

        const files = Array.from(input.files);

        for (const file of files) {
            if (this.selectedFiles.length >= this.MAX_FILES) {
                alert('Máximo 5 archivos por envío');
                break;
            }

            const sizeMB = file.size / 1024 / 1024;
            if (sizeMB > this.MAX_FILE_SIZE_MB) {
                alert(`El archivo ${file.name} supera los ${this.MAX_FILE_SIZE_MB}MB`);
                continue;
            }

            // ✔ Guardar archivo
            this.selectedFiles.push(file);

            // ✔ Si es imagen → preview
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                this.previewImages.push({ file, url });
            }
        }

        input.value = '';
        this.showPreviewModal = true;
    }

    toggleQuickReplies(event: Event) {
        if (this.quickReplies) {
            this.quickReplies.toggle(event);
        }
    }

    selectQuickReply(text: string, popover: any) {
        this.messageText = text;
        popover.hide();
    }

    removeFile(file: File) {
        if (!confirm(`Eliminar ${file.name}?`)) return;
        this.selectedFiles = this.selectedFiles.filter((f) => f !== file);
    }

    getFileIcon(file: File): string {
        const type = file.type;

        if (type.startsWith('image/')) {
            return 'pi pi-image text-blue-500';
        }

        if (type.startsWith('audio/')) {
            return 'pi pi-volume-up text-purple-500';
        }

        if (type === 'application/pdf') {
            return 'pi pi-file-pdf text-red-500';
        }

        if (type === 'application/msword' || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            return 'pi pi-file-word text-blue-600';
        }

        if (type === 'application/vnd.ms-excel' || type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            return 'pi pi-file-excel text-green-600';
        }

        if (type === 'application/vnd.ms-powerpoint' || type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
            return 'pi pi-file-powerpoint text-orange-500';
        }

        if (type === 'application/zip' || type === 'application/x-zip-compressed') {
            return 'pi pi-file-zip text-yellow-600';
        }

        return 'pi pi-file text-gray-500';
    }

    editClientName(conv: Conversation) {
        // abre modal o prompt
        console.log('Editar nombre', conv);
    }

    changeStatus(conv: Conversation) {
        // OPEN → IN_PROGRESS → CLOSED (ejemplo)
        console.log('Cambiar estado', conv);
    }

    assignAgent(conv: Conversation) {
        // abre overlay / modal con lista de agentes
        console.log('Asignar agente', conv);
    }

    openClientHistory(conv: Conversation) {
        // modal lateral o dialog
        console.log('Historia cliente', conv);
        this.showHistory = true;
    }

    openEditName() {
        this.editedClientName = this.activeConversation.clientName;
        this.showEditName = true;
    }

    saveClientName() {
        if (!this.activeConversation) return;

        this.activeConversation.clientName = this.editedClientName;

        this.showEditName = false;
        // aquí luego llamas API
    }
}
