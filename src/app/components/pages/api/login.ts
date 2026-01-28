export interface AuthSession {
    token: string;
    companiaId: number;
    userId: number;
    email: string;
    firstName: string;
    middleName: string;
    lastName: string;
    secondLastName: string;
    fullName: string;
    sessionId: string;
}

export interface ICompanySession {
    companiaId: number;
    location: string;
    nit: string;
    compania: string;
    image: string;
    rol: string;
    phone: string;
    dv: number;
}

export const environment = {
    secretKey: 'NEIDSOFT_SUPER_SECRET_KEY'
};
