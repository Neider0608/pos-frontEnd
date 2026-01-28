// ==============================
// 🔹 ENUMS
// ==============================
export type ConversationStatus = 'open' | 'in_progress' | 'closed' | 'pending';

export type MessageType = 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'TEMPLATE';

export type MessageFrom = 'client' | 'agent' | 'system';

// ==============================
// 🔹 MESSAGE
// ==============================
export interface Message {
    id: number;
    from: MessageFrom;
    type: MessageType;
    timestamp: string;
    templateName?: string;
    // Opcionales según tipo
    text?: string;
    mediaUrl?: string;
    fileName?: string;
    mimeType?: string;
    status?: string;
    agentId?: number;
}

// ==============================
// 🔹 CONVERSATION
// ==============================
export interface Conversation {
    id: number;
    clientPhone: string;
    clientName: string;
    hasUnreadMessages?: boolean;
    status: ConversationStatus;

    assignedAgentId: number | null;
    lockedByAgentId: number | null;

    lastMessage: string;
    updatedAt: string;

    messages: Message[];
}

export interface PhoneNumbers {
    rowId: number;
    phoneNumberId: string;
    displayPhoneNumber: string;
    verifyToken: string;
    accessToken: string;
    name: string;
    state: boolean;
    isBot: boolean;
}

// ==============================
// 🔹 AGENT
// ==============================
export interface Agent {
    id: number;
    name: string;
    avatar?: string;
}
export const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 1,
        clientPhone: '3001234567',
        clientName: 'Juan',

        status: 'open',

        assignedAgentId: 1,
        lockedByAgentId: null,

        lastMessage: 'Hola',
        updatedAt: '2026-01-10',

        messages: [
            {
                id: 1,
                from: 'client',
                type: 'TEXT',
                text: 'Hola, necesito ayuda',
                timestamp: '2026-01-08T14:20:00',
                status: 'READ'
            },
            {
                id: 2,
                from: 'client',
                type: 'IMAGE',
                mediaUrl: 'https://via.placeholder.com/300',
                timestamp: '2026-01-08T14:21:30'
            },
            {
                id: 3,
                from: 'agent',
                type: 'TEXT',
                text: 'Claro, ya reviso la imagen',
                timestamp: '2026-01-08T14:22:00'
            },
            {
                id: 4,
                from: 'client',
                type: 'DOCUMENT',
                fileName: 'orden_compra.pdf',
                mediaUrl: 'https://example.com/orden.pdf',
                mimeType: 'application/pdf',
                timestamp: '2026-01-08T14:23:10'
            }
        ]
    }
];
export const MOCK_AGENTS = [
    { id: 1, name: 'Carlos', status: 'AVAILABLE' },
    { id: 2, name: 'Laura', status: 'BUSY' },
    { id: 3, name: 'Andrés', status: 'OFFLINE' }
];

export interface MessageSend {
    conversationId: number;
    messageText: string | null;
    to: string | null;
    senderUserId: number;
    files: File[];
}
