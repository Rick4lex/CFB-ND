
export const proceduralServices = [
  { id: 'serv-1', name: 'Afiliación EPS', price: 15000 }, { id: 'serv-2', name: 'Afiliación ARL', price: 15000 }, { id: 'serv-3', name: 'Afiliación CCF', price: 15000 }, { id: 'serv-4', name: 'Afiliación Pensión', price: 15000 },
  { id: 'serv-5', name: 'Portal EPS', price: 5000 }, { id: 'serv-6', name: 'Portal ARL', price: 5000 }, { id: 'serv-7', name: 'Portal CCF', price: 5000 }, { id: 'serv-8', name: 'Portal Pensión', price: 5000 },
  { id: 'serv-9', name: 'Liquidación PILA', price: 15000 }, { id: 'serv-10', name: 'Corrección Planilla', price: 5000 }, { id: 'serv-11', name: 'Radicación Incapacidad', price: 25000 }, { id: 'serv-12', name: 'Inscripción Beneficiario', price: 10000 },
];

export const defaultGlobalConfig = {
  financials: {
    smlv: 1423500,
    transportAid: 162000,
    year: 2025
  },
  servicesCatalog: [
    { id: 'serv-1', name: 'Afiliación EPS', price: 15000, active: true },
    { id: 'serv-2', name: 'Afiliación ARL', price: 15000, active: true },
    { id: 'serv-3', name: 'Afiliación CCF', price: 15000, active: true },
    { id: 'serv-4', name: 'Afiliación Pensión', price: 15000, active: true },
    { id: 'serv-5', name: 'Portal EPS', price: 5000, active: true },
    { id: 'serv-6', name: 'Portal ARL', price: 5000, active: true },
    { id: 'serv-7', name: 'Portal CCF', price: 5000, active: true },
    { id: 'serv-8', name: 'Portal Pensión', price: 5000, active: true },
    { id: 'serv-9', name: 'Liquidación PILA', price: 15000, active: true },
    { id: 'serv-10', name: 'Corrección Planilla', price: 5000, active: true },
    { id: 'serv-11', name: 'Radicación Incapacidad', price: 25000, active: true },
    { id: 'serv-12', name: 'Inscripción Beneficiario', price: 10000, active: true },
  ]
};

export const documentTypes = ['CC', 'CE', 'TI', 'NIT', 'PPT', 'PASAPORTE'];
export const serviceStatuses = ['Contacto inicial', 'Documentación pendiente', 'En trámite', 'Activo', 'Mora', 'Suspendido', 'Retirado'];
export const credentialTypes = ['EPS', 'ARL', 'CAJA', 'PENSION', 'CESANTIAS', 'OTRO'];
export const entityContactDepartments = ['General', 'Cartera', 'Aportes', 'Autorizaciones', 'Incapacidades', 'Afiliaciones'];
export const entityContactTypes = [
    { value: 'phone', label: 'Teléfono' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'Correo' },
    { value: 'location', label: 'Dirección' }
];
