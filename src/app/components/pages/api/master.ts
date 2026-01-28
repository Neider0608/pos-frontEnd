export interface Company {
    companyId: number;

    createdByUserId?: number | null;
    updatedByUserId?: number | null;

    nit: string;
    verificationDigit: number;

    businessName: string;

    email?: string | null;
    address?: string | null;
    image?: string | null;

    createdAt: string; // ISO string desde API
    updatedAt?: string | null;
}
