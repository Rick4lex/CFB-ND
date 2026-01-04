
import { z } from 'zod';
import { clientSchema, managerSchema, advisorManagerSchema } from './schemas';

export interface EntityContact {
    id: string;
    type: 'phone' | 'whatsapp' | 'email' | 'location';
    department: string;
    label: string;
    value: string;
}

export interface EntityLink {
    id: string;
    name: string;
    url: string;
}

export interface Beneficiary {
    id: string;
    name: string;
    documentId: string;
    documentImageUrl?: string;
}

export interface Credential {
    id: string;
    entityId: string;    // ID único de la entidad en el directorio
    entityType: string;  // Para caché/referencia rápida
    entityName: string;  // Para caché/referencia rápida
    username?: string;
    password?: string;
    registeredEmail?: string; // Nuevo campo: Correo con el que se registró
    notes?: string;           // Nuevo campo: Notas del acceso
}

export interface Client {
  id: string; 
  fullName: string; 
  documentType: string; 
  documentId: string; 
  serviceStatus: string; 
  assignedAdvisor?: string; 
  entryDate: string; 
  email?: string; 
  whatsapp?: string; 
  address?: string; 
  phone?: string; 
  legalRepName?: string; 
  legalRepId?: string; 
  referredBy?: string; 
  contractedServices?: string[]; 
  adminCost?: number; 
  referralCommissionAmount?: number; 
  discountPercentage?: number; 
  advisorCommissionPercentage?: number; 
  advisorCommissionAmount?: number; // Snapshot of the commission value at sale time
  beneficiaries?: Beneficiary[]; 
  credentials?: Credential[]; 
  notes?: string; 
  proofsLink?: string;
  documentImageUrl?: string;
}

export interface Advisor { 
    id: string; 
    name: string; 
    commissionType: 'percentage' | 'fixed'; 
    commissionValue: number; 
    phone?: string; 
    email?: string; 
    paymentDetails?: string; 
}

export interface Entity { 
    id: string; 
    name: string; 
    type: 'EPS' | 'ARL' | 'CAJA' | 'PENSION' | 'CESANTIAS' | 'OTRO'; 
    code?: string; // Código oficial (ej: EPS001)
    links?: EntityLink[]; 
    contacts?: EntityContact[]; 
}

export interface CotizadorProfile {
    id: string;
    name: string;
    data: {
        modality: string;
        monthlyIncome: number;
        ibc: number;
        days: number;
        includePension: boolean;
        includeHealth: boolean;
        includeArl: boolean;
        arlRisk: number;
        ccfRate: number;
        adminFee: number;
        charges: Record<string, boolean>;
    }
}

export type ClientFormData = z.infer<typeof clientSchema>;
export type ClientWithMultiple = { client: Client; addMultiple?: (allClients: Client[], allAdvisors: Advisor[]) => { updatedClients: Client[], updatedAdvisors: Advisor[] } };
export type ManagerFormData = z.infer<typeof managerSchema>;
export type AdvisorManagerFormData = z.infer<typeof advisorManagerSchema>;
