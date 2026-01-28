export interface Permission {
    moduleId: number;
    module: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
}

export interface Role {
    id: number;
    name: string;
    description: string;
    permissions: Permission[];
    isActive: boolean;
    userCount: number;
    createdAt: string;
}

// models/user.interface.ts
export interface User {
    id: number;
    rolId: number;
    rol: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    secondLastName?: string;
    fullName?: string;
    session: boolean;
    email: string;
    password: string;
    status: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    companiaId: number;
    lastSessionAt?: Date;
}

export interface Module {
    id: number;
    name: string;
    description: string;
}
