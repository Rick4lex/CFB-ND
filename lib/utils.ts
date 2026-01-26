
// --- Formatting Utils ---
export const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

export const parseCurrency = (value: string) => {
    if (typeof value === 'number') return value;
    return parseFloat(value.toString().replace(/[^0-9]/g, '')) || 0;
};

// --- String Utils ---
export const normalizeString = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// --- Optimization Utils ---
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// --- Logic Domain: Cotizador ---
interface CotizacionParams {
    ibc: number;
    days: number;
    modality: string;
    includePension: boolean;
    includeHealth: boolean;
    includeArl: boolean;
    arlRisk: number;
    ccfRate: number;
    contributionRates: any;
}

export const calculateSocialSecurity = ({
    ibc, days, modality, includePension, includeHealth, includeArl, arlRisk, ccfRate, contributionRates
}: CotizacionParams) => {
    const proRatedIbc = (ibc / 30) * days;
    const arlRateValue = contributionRates.arl[arlRisk - 1];
    
    let health = 0, pension = 0, arl = 0, ccf = 0;
    const breakdown = [];

    if (modality === 'independent') {
        health = includeHealth ? proRatedIbc * contributionRates.health.independent : 0;
        pension = includePension ? proRatedIbc * contributionRates.pension.independent : 0;
        arl = includeArl ? proRatedIbc * arlRateValue : 0;
        ccf = ccfRate > 0 ? proRatedIbc * ccfRate : 0;

        if (health > 0) breakdown.push({ label: 'Salud (12.5%)', value: health });
        if (pension > 0) breakdown.push({ label: 'Pensión (16%)', value: pension });
        if (arl > 0) breakdown.push({ label: `ARL Riesgo ${arlRisk} (${(arlRateValue * 100).toFixed(3)}%)`, value: arl });
        if (ccf > 0) breakdown.push({ label: `Caja Comp. (${(ccfRate * 100).toFixed(1)}%)`, value: ccf });
    } else {
        const healthEmployee = includeHealth ? proRatedIbc * contributionRates.health.dependent : 0;
        const healthEmployer = includeHealth ? proRatedIbc * contributionRates.health.employer : 0;
        const pensionTotal = includePension ? proRatedIbc * (contributionRates.pension.dependent + contributionRates.pension.employer) : 0;
        arl = includeArl ? proRatedIbc * arlRateValue : 0;
        ccf = ccfRate > 0 ? proRatedIbc * contributionRates.ccf.dependent : 0;

        health = healthEmployee + healthEmployer;
        pension = pensionTotal;

        if (healthEmployee > 0) breakdown.push({ label: 'Salud (4% Empleado)', value: healthEmployee });
        if (healthEmployer > 0) breakdown.push({ label: 'Salud (8.5% Empleador)', value: healthEmployer });
        if (pensionTotal > 0) breakdown.push({ label: 'Pensión (16% Total)', value: pensionTotal });
        if (arl > 0) breakdown.push({ label: `ARL Riesgo ${arlRisk} (${(arlRateValue * 100).toFixed(3)}%)`, value: arl });
        if (ccf > 0) breakdown.push({ label: 'Caja Comp. (4%)', value: ccf });
    }

    return {
        total: health + pension + arl + ccf,
        breakdown,
        proRatedIbc
    };
};