
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
    entityType: string;
    entityName: string;
    username?: string;
    password?: string;
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
    type: string; 
    links?: EntityLink[]; 
    contacts?: EntityContact[]; 
}

export type ClientFormData = z.infer<typeof clientSchema>;
export type ClientWithMultiple = { client: Client; addMultiple?: (allClients: Client[], allAdvisors: Advisor[]) => { updatedClients: Client[], updatedAdvisors: Advisor[] } };
export type ManagerFormData = z.infer<typeof managerSchema>;
export type AdvisorManagerFormData = z.infer<typeof advisorManagerSchema>;
