export interface GetFinancing {
    id: number;
    customerName?: string;
    invoiceNumber?: string;
    totalFinanced: number;
    currentBalance: number;
    interestRate?: number;
    totalInstallments?: number;
    startDate?: Date;
    dueDate?: Date;
    status?: string;
    paymentId?: number;
    receiptNumber?: string;
    paymentDate?: Date;
    paymentAmount?: number;
    paymentMethod?: string;
    notes?: string;
    registeredByUser?: number;
    registeredAt?: Date;
    remainingBalance?: number;
}

export interface FinancingRequest {
    id?: number;
    paymentAmount?: number;
    paymentMethod?: string;
    notes?: string;
    registeredByUser?: number;
}
