
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

export interface InvoiceRecord {
  id: string;
  clientId: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  status: 'Pendiente' | 'Pagado' | 'Vencido' | 'Anulado';
  notes?: string;
  items?: { description: string; quantity: number; unitPrice: number; total: number }[];
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
  ltv?: number;
  balance?: number;
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

// ==========================================
// Módulo Financiero (Partida Doble)
// ==========================================

export interface Account {
  id: string;
  name: string; // ej. "Banco de Bogotá", "Caja Menor", "Nequi"
  type: 'ASSET' | 'LIABILITY' | 'EQUITY';
  balance: number; 
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  parentId?: string; // Para subcategorías (ej. Gastos > Nómina)
  color?: string;    // Para los gráficos del panel
}

export interface Transaction {
  id: string;
  date: number; // Timestamp
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  description: string;
  categoryId?: string; 
  sourceAccountId: string; // Cuenta de origen
  destinationAccountId?: string; // Cuenta destino (opcional para ingresos/gastos simples)
  clientId?: string; // Puente con CRM
  documentId?: string; // Puente con Generador de Documentos
}

// ==========================================
// Módulo Comercial (Catálogo Dinámico)
// ==========================================

export interface CatalogService {
  id: string;             // Ej: 'pensionAffiliation' (Core) o 'custom-123' (Extra)
  name: string;           
  category: string;       // Crucial para agrupar en gráficos
  basePrice: number;      
  type: 'CORE_SYSTEM' | 'EXTRA_SERVICE'; 
  isTaxable?: boolean;     // Flag para impuestos futuros
  displayInQuoter?: boolean; // Define si se muestra o se oculta globalmente
}
