/**
 * CRM States v2 — Definiciones centrales completas
 * Fuente única de verdad para todos los estados del sistema.
 *
 * Estructura de cada meta entry:
 *   label   → texto visible en UI
 *   color   → ramp del design system (gray/blue/green/amber/red/purple/teal/coral/pink)
 *   auto    → true si el motor lo calcula; false si es asignación manual
 *   rule    → función pura (solo si auto: true)
 *   group   → agrupa estados en la UI (pipeline / financiero / cierre)
 */

// ─────────────────────────────────────────────────────────
// 👥  ESTADOS DE CLIENTE  (serviceStatus)
// ─────────────────────────────────────────────────────────

export const CLIENT_STATUS = {
  // ── Pipeline de adquisición ──────────────────────────
  INITIAL_CONTACT:   'initial_contact',    // ○  Contacto inicial — el primer toque
  PROSPECT:          'prospect',           // ○  Prospecto — validado pero sin calificar
  LEAD_QUALIFIED:    'lead_qualified',     // ●  Lead calificado (SQL) — interés confirmado
  NEGOTIATION:       'negotiation',        // ◑  En negociación — propuesta enviada
  CONTRACT_PENDING:  'contract_pending',   // ⏳  Contrato pendiente de firma
  TRIAL:             'trial',             // ◌  En período de prueba (acceso temporal)

  // ── Clientes activos ────────────────────────────────
  ACTIVE_CURRENT:    'active_current',    // ✓  Activo al día — servicios vigentes, balance 0
  DEBTOR:            'debtor',            // !  Con deuda / Moroso — balance > 0
  AT_RISK:           'at_risk',           // ⚠  En riesgo de churn — señal preventiva
  VIP:               'vip',              // ★  Cliente VIP / Oro — LTV >= umbral
  REFERRAL:          'referral',          // ↗  Referido — canal de adquisición

  // ── Cierre / salida ────────────────────────────────
  REACTIVATED:       'reactivated',       // ↺  Reactivado — volvió tras pausa
  INACTIVE:          'inactive',          // –  Inactivo — sin servicios, sin deuda
  SUSPENDED:         'suspended',         // ✕  Suspendido — pausa por incumplimiento financiero
  CHURNED:           'churned',           // ✗  Perdido / Churn — baja definitiva voluntaria
};

// Umbral LTV para VIP (COP)
export const VIP_LTV_THRESHOLD = 2000000;

export const CLIENT_STATUS_META: Record<string, any> = {
  [CLIENT_STATUS.INITIAL_CONTACT]: {
    label: 'Contacto inicial', color: 'gray', group: 'pipeline', auto: false,
  },
  [CLIENT_STATUS.PROSPECT]: {
    label: 'Prospecto', color: 'gray', group: 'pipeline', auto: false,
  },
  [CLIENT_STATUS.LEAD_QUALIFIED]: {
    label: 'Lead calificado', color: 'blue', group: 'pipeline', auto: false,
  },
  [CLIENT_STATUS.NEGOTIATION]: {
    label: 'En negociación', color: 'blue', group: 'pipeline', auto: false,
  },
  [CLIENT_STATUS.CONTRACT_PENDING]: {
    label: 'Contrato pendiente', color: 'amber', group: 'pipeline', auto: false,
  },
  [CLIENT_STATUS.TRIAL]: {
    label: 'En período de prueba', color: 'teal', group: 'pipeline', auto: false,
  },
  [CLIENT_STATUS.ACTIVE_CURRENT]: {
    label:  'Activo — al día',
    color:  'green',
    group:  'activo',
    auto:   true,
    rule:   (c: any) => c.contractedServices?.length > 0 && c.balance === 0,
  },
  [CLIENT_STATUS.DEBTOR]: {
    label:  'Con deuda / Moroso',
    color:  'amber',
    group:  'activo',
    auto:   true,
    rule:   (c: any) => c.balance > 0,
  },
  [CLIENT_STATUS.AT_RISK]: {
    label: 'En riesgo de churn', color: 'coral', group: 'activo', auto: false,
    // tip: activar manualmente cuando hay: 0 login en 30 días, soporte escalado, etc.
  },
  [CLIENT_STATUS.VIP]: {
    label:  'Cliente VIP / Oro',
    color:  'purple',
    group:  'activo',
    auto:   true,
    rule:   (c: any) => c.ltv >= VIP_LTV_THRESHOLD,
  },
  [CLIENT_STATUS.REFERRAL]: {
    label: 'Referido', color: 'pink', group: 'activo', auto: false,
  },
  [CLIENT_STATUS.REACTIVATED]: {
    label: 'Reactivado', color: 'teal', group: 'cierre', auto: false,
  },
  [CLIENT_STATUS.INACTIVE]: {
    label:  'Inactivo',
    color:  'gray',
    group:  'cierre',
    auto:   true,
    rule:   (c: any) => (!c.contractedServices || c.contractedServices.length === 0) && c.balance === 0,
  },
  [CLIENT_STATUS.SUSPENDED]: {
    label: 'Servicio suspendido', color: 'red', group: 'cierre', auto: false,
  },
  [CLIENT_STATUS.CHURNED]: {
    label: 'Perdido / Churn', color: 'red', group: 'cierre', auto: false,
  },
};

// ─────────────────────────────────────────────────────────
// 📊  ESTRUCTURA CSV DE CLIENTES
// ─────────────────────────────────────────────────────────

export const CLIENT_CSV_COLUMNS = [
  { key: 'id',                         label: 'ID' },
  { key: 'fullName',                   label: 'Nombre' },
  { key: 'documentId',                 label: 'Documento' },
  { key: 'documentType',               label: 'Tipo_Doc' },
  { key: 'email',                      label: 'Email' },
  { key: 'phone',                      label: 'Telefono' },
  { key: 'whatsapp',                   label: 'Whatsapp' },
  { key: 'serviceStatus',              label: 'Estado' },
  { key: 'assignedAdvisor',            label: 'Asesor' },
  { key: 'entryDate',                  label: 'Fecha_Ingreso' },
  { key: 'address',                    label: 'Direccion' },
  { key: 'legalRepName',               label: 'Representante_Legal' },
  { key: 'legalRepId',                 label: 'ID_Representante' },
  { key: 'referredBy',                 label: 'Referido_Por' },
  { key: 'contractedServices',         label: 'Servicios_Contratados' },
  { key: 'adminCost',                  label: 'Costo_Admin' },
  { key: 'referralCommissionAmount',   label: 'Comision_Referido' },
  { key: 'discountPercentage',         label: 'Porcentaje_Descuento' },
  { key: 'advisorCommissionAmount',     label: 'Monto_Comision_Asesor' },
  { key: 'advisorCommissionPercentage', label: 'Porcentaje_Comision_Asesor' },
  { key: 'ltv',                        label: 'LTV' },
  { key: 'balance',                    label: 'Saldo_Pendiente' },
  { key: 'notes',                      label: 'Notas' },
];

/**
 * Orden de prioridad para el motor de estados automáticos.
 * Se evalúan de arriba hacia abajo; el primero que aplique gana.
 * Los estados manuales (auto: false) nunca entran en esta lista.
 */
export const CLIENT_STATUS_PRIORITY = [
  CLIENT_STATUS.SUSPENDED,       // 1. Override manual absoluto
  CLIENT_STATUS.CHURNED,         // 2. Baja definitiva — idem
  CLIENT_STATUS.VIP,             // 3. VIP puede deber; prioridad alta de visibilidad
  CLIENT_STATUS.DEBTOR,          // 4. Con deuda
  CLIENT_STATUS.ACTIVE_CURRENT,  // 5. Activo sin deuda
  CLIENT_STATUS.INACTIVE,        // 6. Sin servicios ni deuda
];


// ─────────────────────────────────────────────────────────
// 🧾  ESTADOS DE FACTURA  (invoice.status)
// ─────────────────────────────────────────────────────────

export const INVOICE_STATUS = {
  // ── Pre-emisión ─────────────────────────────────────
  DRAFT:       'draft',       // Borrador — editable, no visible al cliente
  SCHEDULED:   'scheduled',   // Programada — factura recurrente futura

  // ── En curso ────────────────────────────────────────
  SENT:        'sent',        // Enviada — notificada, esperando pago
  PENDING:     'pending',     // Pendiente — sin pagos registrados
  PARTIAL:     'partial',     // Abono parcial — pago incompleto
  OVERDUE:     'overdue',     // Vencida — superó dueDate sin pago completo
  IN_DISPUTE:  'in_dispute',  // En disputa — cliente objeta el cobro

  // ── Cerrada ─────────────────────────────────────────
  PAID:        'paid',        // Pagada — saldada en su totalidad
  CREDIT_NOTE: 'credit_note', // Nota de crédito — descuento / ajuste formal
  REFUNDED:    'refunded',    // Reembolsada — devolución al cliente
  WRITE_OFF:   'write_off',   // Incobrable — deuda declarada irrecuperable
  VOID:        'void',        // Anulada — reversión contable, registro permanente
};

export const INVOICE_STATUS_META: Record<string, any> = {
  [INVOICE_STATUS.DRAFT]:      { label: 'Borrador',         color: 'gray',   group: 'pre'    },
  [INVOICE_STATUS.SCHEDULED]:  { label: 'Programada',       color: 'blue',   group: 'pre'    },
  [INVOICE_STATUS.SENT]:       { label: 'Enviada',          color: 'blue',   group: 'curso'  },
  [INVOICE_STATUS.PENDING]:    { label: 'Pendiente',        color: 'gray',   group: 'curso'  },
  [INVOICE_STATUS.PARTIAL]:    { label: 'Abono parcial',    color: 'blue',   group: 'curso'  },
  [INVOICE_STATUS.OVERDUE]:    { label: 'Vencida',          color: 'coral',  group: 'curso'  },
  [INVOICE_STATUS.IN_DISPUTE]: { label: 'En disputa',       color: 'amber',  group: 'curso'  },
  [INVOICE_STATUS.PAID]:       { label: 'Pagada',           color: 'green',  group: 'cerrada' },
  [INVOICE_STATUS.CREDIT_NOTE]:{ label: 'Nota de crédito',  color: 'teal',   group: 'cerrada' },
  [INVOICE_STATUS.REFUNDED]:   { label: 'Reembolsada',      color: 'purple', group: 'cerrada' },
  [INVOICE_STATUS.WRITE_OFF]:  { label: 'Incobrable',       color: 'red',    group: 'cerrada' },
  [INVOICE_STATUS.VOID]:       { label: 'Anulada (void)',   color: 'red',    group: 'cerrada' },
};

/**
 * Estados que bloquean nuevas modificaciones en la factura.
 * Una factura en cualquiera de estos estados es inmutable.
 */
export const INVOICE_IMMUTABLE_STATUSES = new Set([
  INVOICE_STATUS.VOID,
  INVOICE_STATUS.WRITE_OFF,
  INVOICE_STATUS.REFUNDED,
]);

/**
 * Estados que se consideran "cerrados" para reportes de cuentas por cobrar.
 */
export const INVOICE_CLOSED_STATUSES = new Set([
  INVOICE_STATUS.PAID,
  INVOICE_STATUS.VOID,
  INVOICE_STATUS.WRITE_OFF,
  INVOICE_STATUS.REFUNDED,
  INVOICE_STATUS.CREDIT_NOTE,
]);


// ─────────────────────────────────────────────────────────
// 🏦  ETIQUETAS DE TRANSACCIÓN  (transaction.tags)
// ─────────────────────────────────────────────────────────

export const TRANSACTION_TAGS = {
  // ── Conciliación ────────────────────────────────────
  RECONCILED:  'reconciled',  // ✓ Verificado mirando la app del banco real
  ADJUSTMENT:  'adjustment',  // Corrección contable manual

  // ── Tipo de movimiento ──────────────────────────────
  ADVANCE:     'advance',     // Anticipo / depósito previo al servicio
  PARTIAL:     'partial',     // Parte de un abono parcial
  RECURRING:   'recurring',   // Cargo recurrente automático (suscripción)
  DISCOUNT:    'discount',    // Descuento o rebaja aplicada sobre factura
  TAX:         'tax',         // Impuesto: IVA, retención en la fuente, etc.
  COMMISSION:  'commission',  // Comisión a agente o cliente referidor
  REFUND:      'refund',      // Devolución de dinero al cliente
  REVERSAL:    'reversal',    // Contramovimiento por anulación (void)
  WRITE_OFF:   'write_off',   // Castigo contable de deuda incobrable
};

export const TRANSACTION_TAGS_META: Record<string, any> = {
  [TRANSACTION_TAGS.RECONCILED]: { label: 'Conciliado',       color: 'teal'   },
  [TRANSACTION_TAGS.ADJUSTMENT]: { label: 'Ajuste contable',  color: 'gray'   },
  [TRANSACTION_TAGS.ADVANCE]:    { label: 'Anticipo',         color: 'purple' },
  [TRANSACTION_TAGS.PARTIAL]:    { label: 'Abono parcial',    color: 'blue'   },
  [TRANSACTION_TAGS.RECURRING]:  { label: 'Recurrente',       color: 'blue'   },
  [TRANSACTION_TAGS.DISCOUNT]:   { label: 'Descuento',        color: 'green'  },
  [TRANSACTION_TAGS.TAX]:        { label: 'Impuesto / IVA',   color: 'amber'  },
  [TRANSACTION_TAGS.COMMISSION]: { label: 'Comisión',         color: 'pink'   },
  [TRANSACTION_TAGS.REFUND]:     { label: 'Reembolso',        color: 'purple' },
  [TRANSACTION_TAGS.REVERSAL]:   { label: 'Reversión',        color: 'red'    },
  [TRANSACTION_TAGS.WRITE_OFF]:  { label: 'Castigo de deuda', color: 'red'    },
};
