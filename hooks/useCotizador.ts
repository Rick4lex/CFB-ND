import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useAppStore } from '../lib/store';
import { parseCurrency, formatCurrency } from '../lib/utils';
import type { CotizacionData } from '../components/features/CotizacionSummaryImage';

const initialProcedureCosts = {
    pensionAffiliation: 15000,
    pensionPortalCreation: 5000,
    healthAffiliation: 15000,
    healthPortalCreation: 5000,
    ccfAffiliation: 15000,
    ccfPortalCreation: 5000,
    arlAffiliation: 15000,
    arlPortalCreation: 5000,
    planillaLiquidation: 15000,
    planillaCorrection: 5000,
};

const contributionRates = {
    health: { independent: 0.125, dependent: 0.04, employer: 0.085 },
    pension: { independent: 0.16, dependent: 0.04, employer: 0.12 },
    arl: [0.00522, 0.01044, 0.02436, 0.0435, 0.0696],
    ccf: { dependent: 0.04 }
};

export interface AdditionalProcedureItem {
  id: number;
  description: string;
  value: number;
}

export interface SavedCalculationState {
  modality: string;
  autoCalculateIbc: boolean;
  monthlyIncome: number;
  ibc: number;
  days: number;
  includePension: boolean;
  includeHealth: boolean;
  includeArl: boolean;
  arlRisk: number;
  ccfRate: number;
  chargePensionAffiliation: boolean;
  chargePensionPortal: boolean;
  chargeHealthAffiliation: boolean;
  chargeHealthPortal: boolean;
  chargeCcfAffiliation: boolean;
  chargeCcfPortal: boolean;
  chargeArlAffiliation: boolean;
  chargeArlPortal: boolean;
  chargePlanillaLiquidation: boolean;
  chargePlanillaCorrection: boolean;
  adminFee: number;
  additionalProcedureItems: AdditionalProcedureItem[];
  procedureCosts: typeof initialProcedureCosts;
}

export interface SavedProfile {
    id: string;
    name: string;
    date: string;
    state: SavedCalculationState;
}

export const useCotizador = () => {
  const { toast } = useToast();
  const { config, setConfig, cotizadorProfiles, setCotizadorProfiles } = useAppStore();
  const SMLV = config.financials.smlv;

  // Form State
  const [modality, setModality] = useState('independent');
  const [autoCalculateIbc, setAutoCalculateIbc] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState(SMLV / 0.4);
  const [ibc, setIbc] = useState(SMLV);
  const [days, setDays] = useState(30);

  // Contributions State
  const [includePension, setIncludePension] = useState(true);
  const [includeHealth, setIncludeHealth] = useState(true);
  const [includeArl, setIncludeArl] = useState(false);
  const [arlRisk, setArlRisk] = useState(1);
  const [ccfRate, setCcfRate] = useState(0);

  // Services State
  const [chargePensionAffiliation, setChargePensionAffiliation] = useState(false);
  const [chargePensionPortal, setChargePensionPortal] = useState(false);
  const [chargeHealthAffiliation, setChargeHealthAffiliation] = useState(false);
  const [chargeHealthPortal, setChargeHealthPortal] = useState(false);
  const [chargeCcfAffiliation, setChargeCcfAffiliation] = useState(false);
  const [chargeCcfPortal, setChargeCcfPortal] = useState(false);
  const [chargeArlAffiliation, setChargeArlAffiliation] = useState(false);
  const [chargeArlPortal, setChargeArlPortal] = useState(false);
  const [chargePlanillaLiquidation, setChargePlanillaLiquidation] = useState(false);
  const [chargePlanillaCorrection, setChargePlanillaCorrection] = useState(false);
  const [adminFee, setAdminFee] = useState(20000);
  
  // Custom Services State
  const [additionalProcedureItems, setAdditionalProcedureItems] = useState<AdditionalProcedureItem[]>([]);
  const [procedureCosts, setProcedureCosts] = useState(initialProcedureCosts);

  // Config Dialog State
  const [tempCosts, setTempCosts] = useState(initialProcedureCosts);
  const [tempFinancials, setTempFinancials] = useState(config.financials);

  // Derived State
  const [ibcError, setIbcError] = useState('');
  const [cotizacionData, setCotizacionData] = useState<CotizacionData>({
    totalNet: '$0', resultsIbc: '$0', resultsIbcDays: 'IBC / 30 días', modality: 'Independiente',
    breakdownItems: [], procedureItems: [], totalSocialSecurity: '$0', totalProcedureCost: '$0',
  });

  // Effects
  useEffect(() => {
    if (ibc < SMLV && autoCalculateIbc) setIbc(SMLV);
  }, [SMLV]);

  useEffect(() => {
    if (autoCalculateIbc && modality === 'independent') {
      const calculatedIbc = Math.max(monthlyIncome * 0.4, SMLV);
      setIbc(calculatedIbc);
    }
  }, [monthlyIncome, autoCalculateIbc, modality, SMLV]);
  
  useEffect(() => {
    if (modality === 'dependent') {
      setAutoCalculateIbc(false);
    } else {
       setAutoCalculateIbc(true);
    }
     setCcfRate(0);
  }, [modality]);

  useEffect(() => {
    const proRatedIbc = (ibc / 30) * days;
    const arlRateValue = contributionRates.arl[arlRisk - 1];

    setIbcError(ibc < SMLV ? `El IBC no puede ser menor al SMLV (${formatCurrency(SMLV)}).` : '');
    
    let totalSocialSecurity = 0;
    const newBreakdownItems: { label: string; value: string }[] = [];

    if (modality === 'independent') {
        const health = includeHealth ? proRatedIbc * contributionRates.health.independent : 0;
        const pension = includePension ? proRatedIbc * contributionRates.pension.independent : 0;
        const arl = includeArl ? proRatedIbc * arlRateValue : 0;
        const ccf = ccfRate > 0 ? proRatedIbc * ccfRate : 0;
        totalSocialSecurity = health + pension + arl + ccf;
        
        if (health > 0) newBreakdownItems.push({ label: 'Salud (12.5%)', value: formatCurrency(health) });
        if (pension > 0) newBreakdownItems.push({ label: 'Pensión (16%)', value: formatCurrency(pension) });
        if (arl > 0) newBreakdownItems.push({ label: `ARL Riesgo ${arlRisk} (${(arlRateValue * 100).toFixed(3)}%)`, value: formatCurrency(arl) });
        if (ccf > 0) newBreakdownItems.push({ label: `Caja Comp. (${(ccfRate * 100).toFixed(1)}%)`, value: formatCurrency(ccf) });
    } else {
        const healthEmployee = includeHealth ? proRatedIbc * contributionRates.health.dependent : 0;
        const healthEmployer = includeHealth ? proRatedIbc * contributionRates.health.employer : 0;
        const pensionTotal = includePension ? proRatedIbc * (contributionRates.pension.dependent + contributionRates.pension.employer) : 0;
        const arl = includeArl ? proRatedIbc * arlRateValue : 0;
        const ccf = ccfRate > 0 ? proRatedIbc * contributionRates.ccf.dependent : 0;
        totalSocialSecurity = healthEmployee + healthEmployer + pensionTotal + arl + ccf;

        if (healthEmployee > 0) newBreakdownItems.push({ label: 'Salud (4% Empleado)', value: formatCurrency(healthEmployee) });
        if (healthEmployer > 0) newBreakdownItems.push({ label: 'Salud (8.5% Empleador)', value: formatCurrency(healthEmployer) });
        if (pensionTotal > 0) newBreakdownItems.push({ label: 'Pensión (16% Total)', value: formatCurrency(pensionTotal) });
        if (arl > 0) newBreakdownItems.push({ label: `ARL Riesgo ${arlRisk} (${(arlRateValue * 100).toFixed(3)}%)`, value: formatCurrency(arl) });
        if (ccf > 0) newBreakdownItems.push({ label: 'Caja Comp. (4%)', value: formatCurrency(ccf) });
    }
    
    let totalProcedureCost = 0;
    const newProcedureItems: { label: string; value: string }[] = [];
    
    const addCost = (condition: boolean, cost: number, label: string) => {
        if(condition) {
            totalProcedureCost += cost;
            newProcedureItems.push({ label, value: formatCurrency(cost) });
        }
    }

    addCost(chargePensionAffiliation, procedureCosts.pensionAffiliation, 'Afiliación Pensión');
    addCost(chargePensionPortal, procedureCosts.pensionPortalCreation, 'Portal Pensión');
    addCost(chargeHealthAffiliation, procedureCosts.healthAffiliation, 'Afiliación Salud');
    addCost(chargeHealthPortal, procedureCosts.healthPortalCreation, 'Portal Salud');
    addCost(chargeCcfAffiliation, procedureCosts.ccfAffiliation, 'Afiliación CCF');
    addCost(chargeCcfPortal, procedureCosts.ccfPortalCreation, 'Portal CCF');
    addCost(chargeArlAffiliation, procedureCosts.arlAffiliation, 'Afiliación ARL');
    addCost(chargeArlPortal, procedureCosts.arlPortalCreation, 'Portal ARL');
    addCost(chargePlanillaLiquidation, procedureCosts.planillaLiquidation, 'Liquidación Planilla');
    addCost(chargePlanillaCorrection, procedureCosts.planillaCorrection, 'Corrección Planilla');
    
    if(modality === 'dependent') addCost(true, adminFee, 'Administración');

    additionalProcedureItems.forEach(item => {
        totalProcedureCost += item.value;
        newProcedureItems.push({ label: item.description, value: formatCurrency(item.value) });
    });

    setCotizacionData({
        totalNet: formatCurrency(totalSocialSecurity + totalProcedureCost),
        resultsIbc: formatCurrency(proRatedIbc),
        resultsIbcDays: `IBC / ${days} días`,
        modality: modality === 'independent' ? 'Independiente' : 'Empresa',
        totalSocialSecurity: formatCurrency(totalSocialSecurity),
        breakdownItems: newBreakdownItems,
        totalProcedureCost: formatCurrency(totalProcedureCost),
        procedureItems: newProcedureItems,
    });
  }, [
    ibc, days, modality, includePension, includeHealth, includeArl, arlRisk, ccfRate,
    chargePensionAffiliation, chargePensionPortal, chargeHealthAffiliation, chargeHealthPortal,
    chargeCcfAffiliation, chargeCcfPortal, chargeArlAffiliation, chargeArlPortal,
    chargePlanillaLiquidation, chargePlanillaCorrection, adminFee, procedureCosts, additionalProcedureItems, SMLV
  ]);

  // Profile Management
  const getCurrentState = (): SavedCalculationState => ({
    modality, autoCalculateIbc, monthlyIncome, ibc, days, includePension, includeHealth,
    includeArl, arlRisk, ccfRate, chargePensionAffiliation, chargePensionPortal, chargeHealthAffiliation,
    chargeHealthPortal, chargeCcfAffiliation, chargeCcfPortal, chargeArlAffiliation, chargeArlPortal,
    chargePlanillaLiquidation, chargePlanillaCorrection, adminFee, additionalProcedureItems, procedureCosts
  });

  const loadState = (state: SavedCalculationState) => {
    setModality(state.modality);
    setAutoCalculateIbc(state.autoCalculateIbc);
    setMonthlyIncome(state.monthlyIncome);
    setIbc(state.ibc);
    setDays(state.days);
    setIncludePension(state.includePension);
    setIncludeHealth(state.includeHealth);
    setIncludeArl(state.includeArl);
    setArlRisk(state.arlRisk);
    setCcfRate(state.ccfRate);
    setChargePensionAffiliation(state.chargePensionAffiliation);
    setChargePensionPortal(state.chargePensionPortal);
    setChargeHealthAffiliation(state.chargeHealthAffiliation);
    setChargeHealthPortal(state.chargeHealthPortal);
    setChargeCcfAffiliation(state.chargeCcfAffiliation);
    setChargeCcfPortal(state.chargeCcfPortal);
    setChargeArlAffiliation(state.chargeArlAffiliation);
    setChargeArlPortal(state.chargeArlPortal);
    setChargePlanillaLiquidation(state.chargePlanillaLiquidation);
    setChargePlanillaCorrection(state.chargePlanillaCorrection);
    setAdminFee(state.adminFee);
    setAdditionalProcedureItems(state.additionalProcedureItems);
    setProcedureCosts(state.procedureCosts);
  };

  const actions = {
      setModality, setAutoCalculateIbc, setMonthlyIncome, setIbc, setDays,
      setIncludePension, setIncludeHealth, setIncludeArl, setArlRisk, setCcfRate,
      setChargePensionAffiliation, setChargePensionPortal, setChargeHealthAffiliation, setChargeHealthPortal,
      setChargeCcfAffiliation, setChargeCcfPortal, setChargeArlAffiliation, setChargeArlPortal,
      setChargePlanillaLiquidation, setChargePlanillaCorrection, setAdminFee,
      setAdditionalProcedureItems, setProcedureCosts, setTempCosts, setTempFinancials,
      
      handleConfigSave: (closeModal: () => void) => {
        setProcedureCosts(tempCosts);
        setConfig(prev => ({ ...prev, financials: tempFinancials }));
        toast({ title: "Configuración Actualizada", description: "Se han guardado los costos y parámetros financieros." });
        closeModal();
      },

      handleSaveProfile: (name: string, id?: string) => {
        if (!name && !id) return toast({ variant: 'destructive', title: 'Error', description: 'Por favor, dale un nombre a tu perfil.' });

        const stateToSave = getCurrentState();
        let updatedProfiles: SavedProfile[];

        if (id) {
            updatedProfiles = cotizadorProfiles.map(p => p.id === id ? { ...p, state: stateToSave, date: new Date().toISOString() } : p);
            toast({ title: 'Perfil Sobrescrito', description: `Perfil actualizado.` });
        } else {
            const newProfile: SavedProfile = { id: crypto.randomUUID(), name, date: new Date().toISOString(), state: stateToSave };
            updatedProfiles = [...cotizadorProfiles, newProfile];
            toast({ title: 'Perfil Guardado', description: `La cotización se guardó como "${name}".` });
        }
        setCotizadorProfiles(updatedProfiles);
        return true;
      },

      handleLoadProfile: (id: string) => {
        const profile = cotizadorProfiles.find(p => p.id === id);
        if(profile) {
            loadState(profile.state);
            toast({ title: 'Perfil Cargado', description: `Se ha cargado "${profile.name}".` });
            return true;
        }
        return false;
      },

      handleDeleteProfile: (id: string) => {
        setCotizadorProfiles(cotizadorProfiles.filter(p => p.id !== id));
        toast({ title: 'Perfil Eliminado', variant: 'destructive' });
      }
  };

  return {
    state: {
        modality, autoCalculateIbc, monthlyIncome, ibc, days, ibcError,
        includePension, includeHealth, includeArl, arlRisk, ccfRate,
        chargePensionAffiliation, chargePensionPortal, chargeHealthAffiliation, chargeHealthPortal,
        chargeCcfAffiliation, chargeCcfPortal, chargeArlAffiliation, chargeArlPortal,
        chargePlanillaLiquidation, chargePlanillaCorrection, adminFee,
        additionalProcedureItems, procedureCosts, tempCosts, tempFinancials,
        cotizacionData, SMLV, cotizadorProfiles, config
    },
    actions
  };
};