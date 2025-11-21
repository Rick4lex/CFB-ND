
import { z } from 'zod';

export const clientSchema = z.object({
  documentType: z.string().min(1, "El tipo de documento es requerido"),
  documentId: z.string().min(1, "El número de documento es requerido"),
  fullName: z.string().min(3, "El nombre es requerido"),
  birthDate: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  address: z.string().optional(),
  documentImageUrl: z.string().url().optional().or(z.literal('')),
  
  legalRepName: z.string().optional(),
  legalRepId: z.string().optional(),
  
  serviceStatus: z.string().min(1, "El estado es requerido"),
  entryDate: z.string().min(1, "La fecha de ingreso es requerida"),
  assignedAdvisor: z.string().optional(),
  referredBy: z.string().optional(),
  contractedServices: z.array(z.string()).optional().default([]),

  adminCost: z.coerce.number().default(0),
  referralCommissionAmount: z.coerce.number().default(0),
  discountPercentage: z.coerce.number().min(0).max(100).default(0),
  
  // Snapshot fields
  advisorCommissionAmount: z.coerce.number().optional(),

  beneficiaries: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, "Nombre requerido"),
    documentId: z.string().min(1, "Documento requerido"),
    documentImageUrl: z.string().url().optional().or(z.literal(''))
  })).max(5).optional().default([]),

  credentials: z.array(z.object({
    id: z.string(),
    entityType: z.string().min(1, "Tipo requerido"),
    entityName: z.string().min(1, "Nombre de entidad requerido"),
    username: z.string().optional(),
    password: z.string().optional()
  })).optional().default([]),

  notes: z.string().optional(),
  proofsLink: z.string().url().optional().or(z.literal('')),
});

export const entityLinkSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "El nombre del enlace es requerido."),
    url: z.string().url("URL inválida.").or(z.literal('')),
});

export const entityContactSchema = z.object({
    id: z.string(),
    type: z.enum(['phone', 'whatsapp', 'email', 'location'], { required_error: "Tipo requerido." }),
    department: z.string().min(1, "Departamento requerido."),
    label: z.string().min(1, "Etiqueta requerida."),
    value: z.string().min(1, "Valor requerido."),
});

export const entitySchema = z.object({
    id: z.string(),
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
    type: z.string({ required_error: "Debe seleccionar un tipo de entidad." }),
    links: z.array(entityLinkSchema).optional().default([]),
    contacts: z.array(entityContactSchema).optional().default([]),
});

export const managerSchema = z.object({
  entities: z.array(entitySchema),
});

export const advisorSchema = z.object({
    id: z.string(),
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
    phone: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal('')),
    commissionType: z.enum(['percentage', 'fixed'], { required_error: "Debe seleccionar un tipo de comisión." }),
    commissionValue: z.coerce.number().min(0, "El valor debe ser positivo."),
    paymentDetails: z.string().optional(),
});

export const advisorManagerSchema = z.object({
  advisors: z.array(advisorSchema),
});
