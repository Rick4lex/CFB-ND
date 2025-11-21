
import React, { useEffect, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { 
    Button, Card, CardHeader, CardTitle, CardContent, CardDescription, 
    Input, Label, Switch, Tabs, TabsList, TabsTrigger, 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
    Checkbox, RadioGroup, RadioGroupItem, Separator
} from '../components/ui/Shared';
import { 
    User, Building, AlertTriangle, CheckCircle, Wallet, Handshake, Share2, Download, 
    Loader2, Settings, Briefcase, FileText, Eye, PlusCircle, Trash2, Bookmark, Save, 
    SquareArrowUp, RefreshCw 
} from 'lucide-react';
import { CotizacionSummaryImage, type CotizacionData } from '../components/features/CotizacionSummaryImage';
import { useToast } from '../hooks/use-toast';
import { PageLayout } from '../components/layout/Layout';
import { useAppStore } from '../lib/store';

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

interface AdditionalProcedureItem {
  id: number;
  description: string;
  value: number;
}

interface SavedCalculationState {
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

interface SavedProfile {
    id: string;
    name: string;
    date: string;
    state: SavedCalculationState;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
const parseCurrency = (value: string) => parseFloat(value.replace(/[^0-9]/g, '')) || 0;


export function CotizadorView() {
  // --- STATE MANAGEMENT ---
  const imageRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { config, setConfig, cotizadorProfiles, setCotizadorProfiles } = useAppStore();
  const SMLV = config.financials.smlv;

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isProfileManagerOpen, setIsProfileManagerOpen] = useState(false);
  
  const [newProfileName, setNewProfileName] = useState('');


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
  const [ccfRate, setCcfRate] = useState(0); // 0, 0.006, or 0.02 for independent

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
  const [newAdditionalItem, setNewAdditionalItem] = useState({ description: '', value: '' });

  // Configurable Costs
  const [procedureCosts, setProcedureCosts] = useState(initialProcedureCosts);
  // Local temp state for configuration dialog
  const [tempCosts, setTempCosts] = useState(initialProcedureCosts);
  const [tempFinancials, setTempFinancials] = useState(config.financials);

  useEffect(() => {
      if (isConfigModalOpen) {
          setTempCosts(procedureCosts);
          setTempFinancials(config.financials);
      }
  }, [isConfigModalOpen, procedureCosts, config.financials]);


  // Derived State / Calculations
  const [ibcError, setIbcError] = useState('');
  const [cotizacionData, setCotizacionData] = useState<CotizacionData>({
    totalNet: '$0', resultsIbc: '$0', resultsIbcDays: 'IBC / 30 días', modality: 'Independiente',
    breakdownItems: [], procedureItems: [], totalSocialSecurity: '$0', totalProcedureCost: '$0',
  });

  // --- LOGIC & EFFECTS ---
    
    // Re-initialize defaults when SMLV changes from config load
    useEffect(() => {
        if (autoCalculateIbc && modality === 'independent') {
             // Re-calc based on possibly new SMLV if monthlyIncome was default
             // However, to avoid overwriting user input, we only set if it seems like a default state or forced
        }
        // Ensure IBC respects SMLV floor
        if (ibc < SMLV && autoCalculateIbc) {
             setIbc(SMLV);
        }
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
    // Core calculation logic
    const proRatedIbc = (ibc / 30) * days;
    const arlRateValue = contributionRates.arl[arlRisk - 1];

    if (ibc < SMLV) {
        setIbcError(`El IBC no puede ser menor al SMLV (${formatCurrency(SMLV)}).`);
    } else {
        setIbcError('');
    }
    
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
    } else { // Dependent
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
    
    if (chargePensionAffiliation) totalProcedureCost += procedureCosts.pensionAffiliation;
    if (chargePensionPortal) totalProcedureCost += procedureCosts.pensionPortalCreation;
    if (chargeHealthAffiliation) totalProcedureCost += procedureCosts.healthAffiliation;
    if (chargeHealthPortal) totalProcedureCost += procedureCosts.healthPortalCreation;
    if (chargeCcfAffiliation) totalProcedureCost += procedureCosts.ccfAffiliation;
    if (chargeCcfPortal) totalProcedureCost += procedureCosts.ccfPortalCreation;
    if (chargeArlAffiliation) totalProcedureCost += procedureCosts.arlAffiliation;
    if (chargeArlPortal) totalProcedureCost += procedureCosts.arlPortalCreation;
    if (chargePlanillaLiquidation) totalProcedureCost += procedureCosts.planillaLiquidation;
    if (chargePlanillaCorrection) totalProcedureCost += procedureCosts.planillaCorrection;

    if(modality === 'dependent') totalProcedureCost += adminFee;
    
    if(chargePensionAffiliation) newProcedureItems.push({ label: 'Afiliación Pensión', value: formatCurrency(procedureCosts.pensionAffiliation) });
    if(chargePensionPortal) newProcedureItems.push({ label: 'Portal Pensión', value: formatCurrency(procedureCosts.pensionPortalCreation) });
    if(chargeHealthAffiliation) newProcedureItems.push({ label: 'Afiliación Salud', value: formatCurrency(procedureCosts.healthAffiliation) });
    if(chargeHealthPortal) newProcedureItems.push({ label: 'Portal Salud', value: formatCurrency(procedureCosts.healthPortalCreation) });
    if(chargeCcfAffiliation) newProcedureItems.push({ label: 'Afiliación CCF', value: formatCurrency(procedureCosts.ccfAffiliation) });
    if(chargeCcfPortal) newProcedureItems.push({ label: 'Portal CCF', value: formatCurrency(procedureCosts.ccfPortalCreation) });
    if(chargeArlAffiliation) newProcedureItems.push({ label: 'Afiliación ARL', value: formatCurrency(procedureCosts.arlAffiliation) });
    if(chargeArlPortal) newProcedureItems.push({ label: 'Portal ARL', value: formatCurrency(procedureCosts.arlPortalCreation) });
    if(chargePlanillaLiquidation) newProcedureItems.push({ label: 'Liquidación Planilla', value: formatCurrency(procedureCosts.planillaLiquidation) });
    if(chargePlanillaCorrection) newProcedureItems.push({ label: 'Corrección Planilla', value: formatCurrency(procedureCosts.planillaCorrection) });
    if(modality === 'dependent') newProcedureItems.push({ label: 'Administración', value: formatCurrency(adminFee) });

    // Add custom items
    additionalProcedureItems.forEach(item => {
        totalProcedureCost += item.value;
        newProcedureItems.push({ label: item.description, value: formatCurrency(item.value) });
    });


    const totalNet = totalSocialSecurity + totalProcedureCost;

    setCotizacionData({
        totalNet: formatCurrency(totalNet),
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

  // --- HANDLERS ---

  const handleOpenPreview = async () => {
    if (!imageRef.current) return;
    setIsGenerating(true);
    setIsPreviewModalOpen(true);
    try {
        const dataUrl = await htmlToImage.toPng(imageRef.current, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' });
        setGeneratedImage(dataUrl);
    } catch(error) {
        console.error("Error generating image for preview:", error);
        setIsPreviewModalOpen(false);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleShare = async () => {
      if (!generatedImage) return;
      try {
        const blob = await (await fetch(generatedImage)).blob();
        const file = new File([blob], "resumen-cotizacion-cfbnd.png", { type: "image/png" });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: 'Resumen de Cotización', text: 'Resumen de cotización de seguridad social.', files: [file] });
        } else {
           handleDownload(); // Fallback to download on desktop or if sharing is not supported
        }
      } catch (e) {
          console.error("Share failed", e);
          handleDownload(); // Fallback on error
      }
  };

  const handleDownload = () => {
      if (!generatedImage) return;
      const link = document.createElement('a');
      link.download = 'resumen-cotizacion-cfbnd.png';
      link.href = generatedImage;
      link.click();
  };

  const handleConfigSave = () => {
    setProcedureCosts(tempCosts);
    setConfig(prev => ({ ...prev, financials: tempFinancials }));
    toast({ title: "Configuración Actualizada", description: "Se han guardado los costos y parámetros financieros." });
    setIsConfigModalOpen(false);
  }

  const handleTempCostChange = (key: keyof typeof tempCosts, value: string) => {
    setTempCosts(prev => ({ ...prev, [key]: parseCurrency(value) }));
  }

  const handleAddAdditionalItem = () => {
    const value = parseCurrency(newAdditionalItem.value);
    if (newAdditionalItem.description && value > 0) {
      setAdditionalProcedureItems(prev => [...prev, {
        id: Date.now(),
        description: newAdditionalItem.description,
        value: value,
      }]);
      setNewAdditionalItem({ description: '', value: '' });
    }
  };
  
  const handleRemoveAdditionalItem = (id: number) => {
    setAdditionalProcedureItems(prev => prev.filter(item => item.id !== id));
  };
  
  // --- PROFILE MANAGEMENT ---

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

  const handleSaveProfile = (id?: string) => {
    if (!newProfileName && !id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, dale un nombre a tu perfil.' });
        return;
    }

    const stateToSave = getCurrentState();
    let updatedProfiles: SavedProfile[];

    if (id) { // Overwriting existing profile
        updatedProfiles = cotizadorProfiles.map(p => 
            p.id === id ? { ...p, state: stateToSave, date: new Date().toISOString() } : p
        );
        toast({ title: 'Perfil Sobrescrito', description: `El perfil "${cotizadorProfiles.find(p=>p.id === id)?.name}" ha sido actualizado.` });
    } else { // Saving new profile
        const newProfile: SavedProfile = {
            id: crypto.randomUUID(),
            name: newProfileName,
            date: new Date().toISOString(),
            state: stateToSave,
        };
        updatedProfiles = [...cotizadorProfiles, newProfile];
        toast({ title: 'Perfil Guardado', description: `La cotización se guardó como "${newProfileName}".` });
    }

    setCotizadorProfiles(updatedProfiles);
    setNewProfileName('');
  };
  
  const handleLoadProfile = (id: string) => {
    const profileToLoad = cotizadorProfiles.find(p => p.id === id);
    if(profileToLoad) {
        loadState(profileToLoad.state);
        toast({ title: 'Perfil Cargado', description: `Se ha cargado la cotización "${profileToLoad.name}".` });
        setIsProfileManagerOpen(false);
    }
  };

  const handleDeleteProfile = (id: string) => {
    const updatedProfiles = cotizadorProfiles.filter(p => p.id !== id);
    setCotizadorProfiles(updatedProfiles);
    toast({ title: 'Perfil Eliminado', variant: 'destructive' });
  };


  return (
    <PageLayout 
        title="Cotizador Inteligente" 
        subtitle="Calcula aportes a seguridad social y costos de trámite."
        onBackRoute="/app/dashboard"
    >
        <div className="w-full max-w-7xl mx-auto">
            <div className="absolute -left-[9999px] top-0">
                <div ref={imageRef} style={{ width: '400px' }}>
                    <CotizacionSummaryImage {...cotizacionData} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CONFIGURATION PANEL */}
                <div className="lg:col-span-1 h-fit sticky top-24">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-2xl">Configura tu Cotización</CardTitle>
                                    <CardDescription>Ajusta los valores para ver el cálculo.
                                        <br/>
                                        <span className="text-xs text-muted-foreground">SMLV {config.financials.year}: {formatCurrency(SMLV)}</span>
                                    </CardDescription>
                                </div>
                                <div className="flex items-center">
                                <Dialog open={isProfileManagerOpen} onOpenChange={setIsProfileManagerOpen}>
                                        <DialogTrigger>
                                            <Button variant="ghost" size="icon"><Bookmark className="h-5 w-5" /></Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-xl">
                                            <DialogHeader>
                                                <DialogTitle>Gestor de Perfiles de Cotización</DialogTitle>
                                                <CardDescription>Guarda, carga o elimina tus configuraciones de cotización.</CardDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div className="p-4 border rounded-lg bg-card space-y-2">
                                                    <Label htmlFor="new-profile-name">Nombre del Nuevo Perfil</Label>
                                                    <div className="flex gap-2">
                                                        <Input id="new-profile-name" placeholder="Ej: Cliente X con trámites especiales" value={newProfileName} onChange={(e: any) => setNewProfileName(e.target.value)} />
                                                        <Button onClick={() => handleSaveProfile()}><Save className="mr-2"/>Guardar</Button>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium">Perfiles Guardados</h4>
                                                    {cotizadorProfiles.length > 0 ? (
                                                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                                                            {cotizadorProfiles.map(profile => (
                                                                <div key={profile.id} className="flex justify-between items-center p-3 border rounded-md">
                                                                    <div>
                                                                        <p className="font-semibold">{profile.name}</p>
                                                                        <p className="text-xs text-muted-foreground">Guardado el: {new Date(profile.date).toLocaleString()}</p>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <Button variant="outline" size="icon" onClick={() => handleLoadProfile(profile.id)}><SquareArrowUp className="h-4 w-4"/></Button>
                                                                        <Button variant="outline" size="icon" onClick={() => handleSaveProfile(profile.id)}><RefreshCw className="h-4 w-4"/></Button>
                                                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteProfile(profile.id)}><Trash2 className="h-4 w-4"/></Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground text-center py-4">No hay perfiles guardados.</p>
                                                    )}
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="ghost" onClick={() => setIsProfileManagerOpen(false)}>Cerrar</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                                        <DialogTrigger>
                                            <Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md max-h-[85vh] flex flex-col overflow-hidden">
                                            <DialogHeader><DialogTitle>Configuración de Parámetros</DialogTitle></DialogHeader>
                                            <div className="flex-1 overflow-y-auto p-1 space-y-6 min-h-0">
                                                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                                                    <h4 className="text-sm font-bold text-primary">Parámetros Financieros (Anual)</h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1 col-span-2">
                                                            <Label htmlFor="year">Año Fiscal</Label>
                                                            <Input id="year" type="number" value={tempFinancials.year} onChange={(e) => setTempFinancials({...tempFinancials, year: Number(e.target.value)})}/>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label htmlFor="smlv">SMLV</Label>
                                                            <Input id="smlv" type="number" value={tempFinancials.smlv} onChange={(e) => setTempFinancials({...tempFinancials, smlv: Number(e.target.value)})}/>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label htmlFor="transportAid">Aux. Transp.</Label>
                                                            <Input id="transportAid" type="number" value={tempFinancials.transportAid} onChange={(e) => setTempFinancials({...tempFinancials, transportAid: Number(e.target.value)})}/>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-bold">Costos de Trámites</h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {Object.entries(tempCosts).map(([key, value]) => (
                                                            <div key={key} className="space-y-1">
                                                                <Label htmlFor={key} className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</Label>
                                                                <Input id={key} value={formatCurrency(value as number)} onChange={(e: any) => handleTempCostChange(key as keyof typeof tempCosts, e.target.value)} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleConfigSave}>Guardar Configuración</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Tabs value={modality} onValueChange={setModality} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="independent"><User className="mr-2 h-4 w-4"/>Independiente</TabsTrigger>
                                    <TabsTrigger value="dependent"><Building className="mr-2 h-4 w-4"/>Empresa</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {modality === 'independent' && (
                                <div className="space-y-4 rounded-md border bg-background/50 p-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="autoCalculateIbc">Calcular IBC (40%)</Label>
                                        <Switch id="autoCalculateIbc" checked={autoCalculateIbc} onCheckedChange={setAutoCalculateIbc} />
                                    </div>
                                    {autoCalculateIbc && (
                                        <div className="space-y-2">
                                            <Label htmlFor="monthlyIncome">Ingresos Mensuales</Label>
                                            <Input id="monthlyIncome" value={formatCurrency(monthlyIncome)} onChange={(e: any) => setMonthlyIncome(parseCurrency(e.target.value))} onBlur={(e: any) => e.target.value = formatCurrency(monthlyIncome)} />
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label htmlFor="ibc">Salario o Ingreso Base (IBC)</Label>
                                <Input id="ibc" value={formatCurrency(ibc)} onChange={(e: any) => setIbc(parseCurrency(e.target.value))} onBlur={(e: any) => e.target.value = formatCurrency(ibc)} disabled={autoCalculateIbc && modality === 'independent'} />
                                <p className="text-sm text-destructive">{ibcError}</p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="days">Días a Cotizar ({days})</Label>
                                <input type="range" id="days" min="1" max="30" value={days} onChange={e => setDays(parseInt(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                            </div>
                            
                            <hr className="border-border"/>

                            <div className="space-y-4">
                                <h4 className="font-medium text-foreground">Aportes a Seguridad Social</h4>
                                
                                <div className="flex flex-col space-y-3 rounded-md border p-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="includePension" className="flex items-center gap-2"><Wallet className="h-4 w-4" />Pensión</Label>
                                        <Switch id="includePension" checked={includePension} onCheckedChange={setIncludePension} />
                                    </div>
                                    {includePension && (
                                        <div className="pl-6 space-y-2 text-xs">
                                            <div className="flex items-center gap-2"><Checkbox id="chargePensionAffiliation" checked={chargePensionAffiliation} onCheckedChange={(v: any) => setChargePensionAffiliation(!!v)}/><Label htmlFor="chargePensionAffiliation" className="font-normal">Cobrar Afiliación</Label></div>
                                            <div className="flex items-center gap-2"><Checkbox id="chargePensionPortal" checked={chargePensionPortal} onCheckedChange={(v: any) => setChargePensionPortal(!!v)}/><Label htmlFor="chargePensionPortal" className="font-normal">Cobrar Crear Portal</Label></div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col space-y-3 rounded-md border p-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="includeHealth" className="flex items-center gap-2"><Handshake className="h-4 w-4" />Salud (EPS)</Label>
                                        <Switch id="includeHealth" checked={includeHealth} onCheckedChange={setIncludeHealth} />
                                    </div>
                                    {includeHealth && (
                                        <div className="pl-6 space-y-2 text-xs">
                                            <div className="flex items-center gap-2"><Checkbox id="chargeHealthAffiliation" checked={chargeHealthAffiliation} onCheckedChange={(v: any) => setChargeHealthAffiliation(!!v)}/><Label htmlFor="chargeHealthAffiliation" className="font-normal">Cobrar Afiliación</Label></div>
                                            <div className="flex items-center gap-2"><Checkbox id="chargeHealthPortal" checked={chargeHealthPortal} onCheckedChange={(v: any) => setChargeHealthPortal(!!v)}/><Label htmlFor="chargeHealthPortal" className="font-normal">Cobrar Crear Portal</Label></div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col space-y-3 rounded-md border p-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="flex items-center gap-2"><Briefcase className="h-4 w-4" />Caja de Comp.</Label>
                                        {modality === 'independent' ? (
                                            <RadioGroup onValueChange={(v: any) => setCcfRate(parseFloat(v))} value={String(ccfRate)} className="flex items-center gap-2">
                                                <div className="flex items-center space-x-1"><RadioGroupItem value="0" id="ccf-0"/><Label htmlFor="ccf-0" className="text-xs font-normal">No</Label></div>
                                                <div className="flex items-center space-x-1"><RadioGroupItem value="0.006" id="ccf-06"/><Label htmlFor="ccf-06" className="text-xs font-normal">0.6%</Label></div>
                                                <div className="flex items-center space-x-1"><RadioGroupItem value="0.02" id="ccf-2"/><Label htmlFor="ccf-2" className="text-xs font-normal">2%</Label></div>
                                            </RadioGroup>
                                        ) : (
                                            <Switch checked={ccfRate > 0} onCheckedChange={(v: any) => setCcfRate(v ? 0.04 : 0)}/>
                                        )}
                                    </div>
                                    {(ccfRate > 0) && (
                                        <div className="pl-6 space-y-2 text-xs">
                                            <div className="flex items-center gap-2"><Checkbox id="chargeCcfAffiliation" checked={chargeCcfAffiliation} onCheckedChange={(v: any) => setChargeCcfAffiliation(!!v)}/><Label htmlFor="chargeCcfAffiliation" className="font-normal">Cobrar Afiliación</Label></div>
                                            <div className="flex items-center gap-2"><Checkbox id="chargeCcfPortal" checked={chargeCcfPortal} onCheckedChange={(v: any) => setChargeCcfPortal(!!v)}/><Label htmlFor="chargeCcfPortal" className="font-normal">Cobrar Crear Portal</Label></div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col space-y-3 rounded-md border p-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="includeArl" className="flex items-center gap-2"><Briefcase className="h-4 w-4" />ARL</Label>
                                        <Switch id="includeArl" checked={includeArl} onCheckedChange={setIncludeArl} />
                                    </div>
                                    {includeArl && (
                                        <>
                                            <div className="space-y-2 pt-2">
                                                <Label htmlFor="arlRisk">Nivel de Riesgo ARL ({arlRisk})</Label>
                                                <input type="range" id="arlRisk" min="1" max="5" value={arlRisk} onChange={e => setArlRisk(parseInt(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"/>
                                            </div>
                                            <div className="pl-6 space-y-2 text-xs">
                                                <div className="flex items-center gap-2"><Checkbox id="chargeArlAffiliation" checked={chargeArlAffiliation} onCheckedChange={(v: any) => setChargeArlAffiliation(!!v)}/><Label htmlFor="chargeArlAffiliation" className="font-normal">Cobrar Afiliación</Label></div>
                                                <div className="flex items-center gap-2"><Checkbox id="chargeArlPortal" checked={chargeArlPortal} onCheckedChange={(v: any) => setChargeArlPortal(!!v)}/><Label htmlFor="chargeArlPortal" className="font-normal">Cobrar Crear Portal</Label></div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <hr className="border-border"/>

                            <div className="space-y-4">
                                <h4 className="font-medium text-foreground">Servicios Adicionales</h4>
                                <div className="flex items-center justify-between rounded-md border p-3">
                                    <Label htmlFor="chargePlanillaLiquidation" className="flex items-center gap-2 font-normal"><FileText className="h-4 w-4"/>Liquidación Planilla</Label>
                                    <Switch id="chargePlanillaLiquidation" checked={chargePlanillaLiquidation} onCheckedChange={setChargePlanillaLiquidation}/>
                                </div>
                                <div className="flex items-center justify-between rounded-md border p-3">
                                    <Label htmlFor="chargePlanillaCorrection" className="flex items-center gap-2 font-normal"><FileText className="h-4 w-4"/>Corrección Planilla</Label>
                                    <Switch id="chargePlanillaCorrection" checked={chargePlanillaCorrection} onCheckedChange={setChargePlanillaCorrection}/>
                                </div>
                                {modality === 'dependent' && (
                                    <div className="space-y-2 rounded-md border p-3">
                                        <Label htmlFor="adminFee" className="flex items-center gap-2 font-normal"><Briefcase className="h-4 w-4"/>Costo Administración</Label>
                                        <Input id="adminFee" value={formatCurrency(adminFee)} onChange={(e: any) => setAdminFee(parseCurrency(e.target.value))} onBlur={(e: any) => e.target.value = formatCurrency(adminFee)} />
                                    </div>
                                )}
                                <div className="space-y-3 rounded-md border p-3">
                                    <h5 className="font-medium text-sm">Trámites Personalizados</h5>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-grow space-y-1">
                                            <Label htmlFor="custom-desc" className="text-xs">Descripción del trámite</Label>
                                            <Input id="custom-desc" placeholder="Ej: Vuelo internacional" value={newAdditionalItem.description} onChange={(e: any) => setNewAdditionalItem(prev => ({...prev, description: e.target.value}))}/>
                                        </div>
                                        <div className="w-28 space-y-1">
                                            <Label htmlFor="custom-value" className="text-xs">Valor</Label>
                                            <Input id="custom-value" type="text" placeholder="50000" value={newAdditionalItem.value} onChange={(e: any) => setNewAdditionalItem(prev => ({...prev, value: formatCurrency(parseCurrency(e.target.value))}))}/>
                                        </div>
                                        <Button size="icon" onClick={handleAddAdditionalItem}><PlusCircle className="h-4 w-4"/></Button>
                                    </div>
                                    {additionalProcedureItems.length > 0 && (
                                        <>
                                            <Separator className="my-2"/>
                                            <ul className="space-y-2">
                                                {additionalProcedureItems.map(item => (
                                                    <li key={item.id} className="flex justify-between items-center text-sm p-1 bg-muted/50 rounded-md">
                                                        <span>{item.description}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span>{formatCurrency(item.value)}</span>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveAdditionalItem(item.id)}>
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>

                {/* RESULTS PANEL */}
                <div className="lg:col-span-2 space-y-8">
                    
                    <div role="alert" className="w-full rounded-lg border p-4 text-foreground border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10 flex items-start gap-4">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
                        <div className="flex-grow">
                            <h5 className="mb-1 font-medium leading-none tracking-tight">Aviso Importante</h5>
                            <div className="text-sm text-muted-foreground">
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Los cálculos son una aproximación y no reflejan el valor real a pagar.</li>
                                    <li>El valor total no incluye la posible mora que el operador de pago (PILA) pueda generar.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
                            <DialogTrigger>
                                <Button onClick={handleOpenPreview} disabled={isGenerating}>
                                    {isGenerating ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando...</>
                                    ) : (
                                        <><Eye className="mr-2 h-4 w-4" />Previsualizar Resumen</>
                                    )}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Previsualización del Resumen</DialogTitle>
                                </DialogHeader>
                                <div className="p-4 flex justify-center items-center bg-gray-100 rounded-md">
                                    {generatedImage ? (
                                        <img src={generatedImage} alt="Resumen de Cotización" style={{maxWidth: '100%', height: 'auto'}}/>
                                    ) : (
                                        <div className="h-64 flex items-center justify-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="sm:justify-between gap-2">
                                    <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>Cerrar</Button>
                                    <div className="flex gap-2">
                                        <Button onClick={handleShare} disabled={!generatedImage}>
                                            <Share2 className="mr-2 h-4 w-4" /> Compartir
                                        </Button>
                                        <Button onClick={handleDownload} disabled={!generatedImage}>
                                            <Download className="mr-2 h-4 w-4" /> Descargar
                                        </Button>
                                    </div>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Resumen de Cotización</CardTitle>
                            <CardDescription>Cálculos para <span className="font-bold text-primary">{cotizacionData.modality}</span>.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                            <div className="md:col-span-2">
                                <p className="text-muted-foreground">Valor Final Cliente</p>
                                <p className="text-6xl font-bold text-primary">{cotizacionData.totalNet}</p>
                            </div>
                            <div className="md:col-span-1 text-center md:text-right">
                                <p className="text-3xl font-bold">{cotizacionData.resultsIbc}</p>
                                <p className="text-lg font-bold text-blue-600">{cotizacionData.resultsIbcDays}</p>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <Card className="h-full flex flex-col">
                            <CardHeader className="text-center"><CardTitle className="text-lg uppercase">Aportes a Seg. Social</CardTitle></CardHeader>
                            <CardContent className="flex-1 flex flex-col items-center justify-center">
                                <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">Subtotal</p>
                                <p className="text-5xl font-bold text-primary">{cotizacionData.totalSocialSecurity}</p>
                            </CardContent>
                            <CardContent>
                                <hr className="mb-4 border-border" />
                                <ul className="space-y-3 w-full">
                                    {cotizacionData.breakdownItems.length > 0 ? cotizacionData.breakdownItems.map(item => (
                                        <li key={item.label} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /><span className="text-muted-foreground">{item.label}</span></div>
                                            <span className="font-medium">{item.value}</span>
                                        </li>
                                    )) : <p className="text-sm text-muted-foreground text-center py-4">No hay aportes seleccionados.</p>}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="h-full flex flex-col">
                            <CardHeader className="text-center"><CardTitle className="text-lg uppercase">Trámites y Servicios</CardTitle></CardHeader>
                            <CardContent className="flex-1 flex flex-col items-center justify-center">
                                <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">Subtotal</p>
                                <p className="text-5xl font-bold text-primary">{cotizacionData.totalProcedureCost}</p>
                            </CardContent>
                            <CardContent>
                                <hr className="mb-4 border-border" />
                                <ul className="space-y-3 w-full">
                                {cotizacionData.procedureItems.length > 0 ? cotizacionData.procedureItems.map(item => (
                                        <li key={item.label} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2"><span className="text-muted-foreground">{item.label}</span></div>
                                            <span className="font-medium">{item.value}</span>
                                        </li>
                                    )) : <p className="text-sm text-muted-foreground text-center py-4">No hay trámites adicionales.</p>}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    </PageLayout>
  );
}
