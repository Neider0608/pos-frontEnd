import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { InputNumberModule } from 'primeng/inputnumber';

// Services & Interfaces
import { MasterService } from '../../services/master.service';
import { WhatsappService } from '../../services/whatsapp.service';
import { User } from '../api/permissions';
import { PhoneNumbers } from '../api/whatsappagents';

@Component({
    selector: 'app-agents',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, DropdownModule, TagModule, AvatarModule, BadgeModule, TooltipModule, InputNumberModule],
    providers: [MessageService],
    templateUrl: './agents.component.html',
    styleUrl: './agents.component.scss'
})
export class AgentsComponent implements OnInit {
    // UI State
    selectedConfigId: number | null = null;
    isLoading: boolean = false;
    isAssignModalVisible: boolean = false;

    // Data Lists
    channels: PhoneNumbers[] = [];
    assignedAgents: any[] = [];
    systemUsers: User[] = [];
    companiaId: number = 1;

    // Form Object
    assignmentForm = {
        rowidAgent: 0,
        agentId: null as number | null,
        priority: 1,
        maxConversations: 10
    };

    constructor(
        private masterService: MasterService,
        private messageService: MessageService,
        private whatsappService: WhatsappService
    ) {}

    ngOnInit(): void {
        this.fetchInitialData();
    }

    private fetchInitialData(): void {
        this.whatsappService.getByPhoneNumbers().subscribe({
            next: (res) => {
                if (res.code === 0) this.channels = res.data || [];
            }
        });

        this.masterService.getUsers(this.companiaId).subscribe({
            next: (res) => {
                this.systemUsers = res.data || [];
            }
        });
    }

    onSelectChannel(channel: PhoneNumbers): void {
        this.selectedConfigId = channel.rowId;
        this.fetchAssignedAgents();
    }

    fetchAssignedAgents(): void {
        if (!this.selectedConfigId) return;

        this.isLoading = true;
        this.whatsappService.getAgents(this.selectedConfigId).subscribe({
            next: (res: any) => {
                this.assignedAgents = res.data || [];
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
                this.showToast('error', 'Error', 'Could not load assigned agents');
            }
        });
    }

    openAssignModal(): void {
        this.assignmentForm.agentId = null;
        this.isAssignModalVisible = true;
    }

    onAssignAgent(): void {
        if (!this.assignmentForm.agentId || !this.selectedConfigId) return;

        const payload = {
            rowid: this.assignmentForm.rowidAgent,
            rowidUser: this.assignmentForm.agentId,
            rowidConfiguration: this.selectedConfigId,
            priority: this.assignmentForm.priority,
            status: true,
            maxConversation: this.assignmentForm.maxConversations
        };

        console.log('Assigning agent with payload:', payload);

        this.whatsappService.assignAgent(payload).subscribe({
            next: () => {
                this.showToast('success', 'Success', 'Agente asignado correctamente.');
                this.isAssignModalVisible = false;
                this.fetchAssignedAgents();
            }
        });
    }

    editAgent(agent: any): void {
        debugger;
        this.assignmentForm.rowidAgent = agent.rowid;
        this.assignmentForm.agentId = agent.rowidUser;
        this.assignmentForm.priority = agent.priority;
        this.assignmentForm.maxConversations = agent.maxConversation;

        this.assignmentForm.agentId = null;
        this.isAssignModalVisible = true;
    }

    onRemoveAgent(agent: any): void {
        this.whatsappService.deleteAgent(agent.id).subscribe({
            next: () => {
                this.showToast('info', 'Removed', 'Assignment deleted');
                this.fetchAssignedAgents();
            }
        });
    }

    private showToast(severity: string, summary: string, detail: string): void {
        this.messageService.add({ severity, summary, detail });
    }
}
