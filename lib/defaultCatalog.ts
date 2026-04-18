import { CatalogService } from './types';

export const DEFAULT_CATALOG: CatalogService[] = [
    { id: 'pensionAffiliation', name: 'Afiliación Pensión', category: 'Trámites de Ley', basePrice: 15000, type: 'CORE_SYSTEM', displayInQuoter: true },
    { id: 'pensionPortalCreation', name: 'Creación Portal Pensión', category: 'Administrativo', basePrice: 5000, type: 'CORE_SYSTEM', displayInQuoter: true },
    { id: 'healthAffiliation', name: 'Afiliación Salud', category: 'Trámites de Ley', basePrice: 15000, type: 'CORE_SYSTEM', displayInQuoter: true },
    { id: 'healthPortalCreation', name: 'Creación Portal Salud', category: 'Administrativo', basePrice: 5000, type: 'CORE_SYSTEM', displayInQuoter: true },
    { id: 'ccfAffiliation', name: 'Afiliación CCF', category: 'Trámites de Ley', basePrice: 15000, type: 'CORE_SYSTEM', displayInQuoter: true },
    { id: 'ccfPortalCreation', name: 'Creación Portal CCF', category: 'Administrativo', basePrice: 5000, type: 'CORE_SYSTEM', displayInQuoter: true },
    { id: 'arlAffiliation', name: 'Afiliación ARL', category: 'Trámites de Ley', basePrice: 15000, type: 'CORE_SYSTEM', displayInQuoter: true },
    { id: 'arlPortalCreation', name: 'Creación Portal ARL', category: 'Administrativo', basePrice: 5000, type: 'CORE_SYSTEM', displayInQuoter: true },
    { id: 'planillaLiquidation', name: 'Liquidación Planilla', category: 'Administrativo', basePrice: 15000, type: 'CORE_SYSTEM', displayInQuoter: true },
    { id: 'planillaCorrection', name: 'Corrección Planilla', category: 'Administrativo', basePrice: 5000, type: 'CORE_SYSTEM', displayInQuoter: true },
    { id: 'incapacityManagement', name: 'Gestión de Incapacidades', category: 'Servicios Extra', basePrice: 25000, type: 'EXTRA_SERVICE', displayInQuoter: true },
    { id: 'legalAdvisory', name: 'Asesoría Jurídica Básica', category: 'Asesoría', basePrice: 50000, type: 'EXTRA_SERVICE', displayInQuoter: true },
];
