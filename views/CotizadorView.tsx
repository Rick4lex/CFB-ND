
import React, { useEffect, useRef, useState, useMemo } from 'react';
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
import { formatCurrency, parseCurrency, calculateSocialSecurity } from '../lib/utils'; // Imported Logic

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

export function CotizadorView() {
  const imageRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { config, setConfig, cotizadorProfiles, setCotizadorProfiles } = useAppStore();
  const SMLV = config.financials.smlv;

  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isProfileManagerOpen, setIsProfileManagerOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  // Form State (Grouped if possible, but kept flat for easier binding in this refactor)
  const [modality, setModality] = useState('independent');
  const [autoCalculateIbc, setAutoCalculateIbc] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState(SMLV / 0.4);
  const [ibc, setIbc] = useState(SMLV);
  const [days, setDays] = useState(30);

  // Contributions
  const [includePension, setIncludePension] = useState(true);
  const [includeHealth, setIncludeHealth] = useState(true);
  const [includeArl, setIncludeArl] = useState(false);
  const [arlRisk, setArlRisk] = useState(1);
  const [ccfRate, setCcfRate] = useState(0);

  // Services
  const [charges, setCharges] = useState({
      pensionAffiliation: false, pensionPortal: false,
      healthAffiliation: false, healthPortal: false,
      ccfAffiliation: false, ccfPortal: false,
      arlAffiliation: false, arlPortal: false,
      planillaLiquidation: false, planillaCorrection: false
  });
  const [adminFee, setAdminFee] = useState(20000);
  
  // Custom Items
  const [additionalProcedureItems, setAdditionalProcedureItems] = useState<AdditionalProcedureItem[]>([]);
  const [newAdditionalItem, setNewAdditionalItem] = useState({ description: '', value: '' });

  // Config
  const [procedureCosts, setProcedureCosts] = useState(initialProcedureCosts);
  const [tempCosts, setTempCosts] = useState(initialProcedureCosts);
  const [tempFinancials, setTempFinancials] = useState(config.financials);

  // Toggle charge handler
  const toggleCharge = (key: keyof typeof charges) => {
      setCharges(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Effects ---

  // Auto-calc IBC
  useEffect(() => {
    if (autoCalculateIbc && modality === 'independent') {
      setIbc(Math.max(monthlyIncome * 0.4, SMLV));
    }
  }, [monthlyIncome, autoCalculateIbc, modality, SMLV]);

  // Modality switch reset
  useEffect(() => {
    if (modality === 'dependent') {
      setAutoCalculateIbc(false);
    } else {
       setAutoCalculateIbc(true);
    }
    setCcfRate(0);
  }, [modality]);

  // Main Calculation (Memoized via util)
  const cotizacionData = useMemo(() => {
      const socialSecResult = calculateSocialSecurity({
          ibc, days, modality, includePension, includeHealth, includeArl, arlRisk, ccfRate, contributionRates
      });

      // Calculate Procedures
      let totalProcedureCost = 0;
      const newProcedureItems: { label: string; value: string }[] = [];
      
      const addCost = (active: boolean, cost: number, label: string) => {
          if(active) {
              totalProcedureCost += cost;
              newProcedureItems.push({ label, value: formatCurrency(cost) });
          }
      }

      addCost(charges.pensionAffiliation, procedureCosts.pensionAffiliation, 'Afiliación Pensión');
      addCost(charges.pensionPortal, procedureCosts.pensionPortalCreation, 'Portal Pensión');
      addCost(charges.healthAffiliation, procedureCosts.healthAffiliation, 'Afiliación Salud');
      addCost(charges.healthPortal, procedureCosts.healthPortalCreation, 'Portal Salud');
      addCost(charges.ccfAffiliation, procedureCosts.ccfAffiliation, 'Afiliación CCF');
      addCost(charges.ccfPortal, procedureCosts.ccfPortalCreation, 'Portal CCF');
      addCost(charges.arlAffiliation, procedureCosts.arlAffiliation, 'Afiliación ARL');
      addCost(charges.arlPortal, procedureCosts.arlPortalCreation, 'Portal ARL');
      addCost(charges.planillaLiquidation, procedureCosts.planillaLiquidation, 'Liquidación Planilla');
      addCost(charges.planillaCorrection, procedureCosts.planillaCorrection, 'Corrección Planilla');
      
      if(modality === 'dependent') addCost(true, adminFee, 'Administración');

      additionalProcedureItems.forEach(item => {
        totalProcedureCost += item.value;
        newProcedureItems.push({ label: item.description, value: formatCurrency(item.value) });
      });

      return {
        totalNet: formatCurrency(socialSecResult.total + totalProcedureCost),
        resultsIbc: formatCurrency(socialSecResult.proRatedIbc),
        resultsIbcDays: `IBC / ${days} días`,
        modality: modality === 'independent' ? 'Independiente' : 'Empresa',
        totalSocialSecurity: formatCurrency(socialSecResult.total),
        breakdownItems: socialSecResult.breakdown.map(b => ({ ...b, value: formatCurrency(b.value) })),
        totalProcedureCost: formatCurrency(totalProcedureCost),
        procedureItems: newProcedureItems,
      } as CotizacionData;
  }, [ibc, days, modality, includePension, includeHealth, includeArl, arlRisk, ccfRate, charges, adminFee, procedureCosts, additionalProcedureItems]);

  // --- Handlers ---
  const handleOpenPreview = async () => {
    if (!imageRef.current) return;
    setIsGenerating(true);
    setIsPreviewModalOpen(true);
    try {
        // Delay to allow render
        await new Promise(r => setTimeout(r, 100)); 
        const dataUrl = await htmlToImage.toPng(imageRef.current, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' });
        setGeneratedImage(dataUrl);
    } catch(error) {
        console.error("Error generating image:", error);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleConfigSave = () => {
    setProcedureCosts(tempCosts);
    setConfig(prev => ({ ...prev, financials: tempFinancials }));
    toast({ title: "Configuración Actualizada", description: "Se han guardado los costos y parámetros financieros." });
    setIsConfigModalOpen(false);
  }

  const handleAddAdditionalItem = () => {
    const value = parseCurrency(newAdditionalItem.value);
    if (newAdditionalItem.description && value > 0) {
      setAdditionalProcedureItems(prev => [...prev, { id: Date.now(), description: newAdditionalItem.description, value }]);
      setNewAdditionalItem({ description: '', value: '' });
    }
  };

  // --- Render ---
  return (
    <PageLayout title="Cotizador Inteligente" subtitle="Calcula aportes a seguridad social." onBackRoute="/app/dashboard">
        <div className="w-full max-w-7xl mx-auto">
            {/* Hidden capture area */}
            <div className="absolute -left-[9999px] top-0">
                <div ref={imageRef} style={{ width: '400px' }}>
                    <CotizacionSummaryImage {...cotizacionData} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20 md:pb-0">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 h-fit sticky top-24 z-0">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <div className="space-y-1">
                                <CardTitle className="text-2xl">Configuración</CardTitle>
                                <CardDescription>SMLV: {formatCurrency(SMLV)}</CardDescription>
                             </div>
                             <div className="flex gap-1">
                                <Dialog open={isProfileManagerOpen} onOpenChange={setIsProfileManagerOpen}>
                                    <DialogTrigger asChild><Button variant="ghost" size="icon"><Bookmark className="h-5 w-5"/></Button></DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Perfiles</DialogTitle></DialogHeader>
                                        <div className="p-4 bg-muted rounded-md"><p className="text-sm text-center text-muted-foreground">Funcionalidad simplificada para esta vista.</p></div>
                                    </DialogContent>
                                </Dialog>
                                <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                                    <DialogTrigger asChild><Button variant="ghost" size="icon"><Settings className="h-5 w-5"/></Button></DialogTrigger>
                                    <DialogContent className="max-h-[80vh] overflow-y-auto">
                                        <DialogHeader><DialogTitle>Parámetros Globales</DialogTitle></DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1"><Label>SMLV</Label><Input type="number" value={tempFinancials.smlv} onChange={e => setTempFinancials({...tempFinancials, smlv: Number(e.target.value)})}/></div>
                                                <div className="space-y-1"><Label>Aux. Transp.</Label><Input type="number" value={tempFinancials.transportAid} onChange={e => setTempFinancials({...tempFinancials, transportAid: Number(e.target.value)})}/></div>
                                            </div>
                                            <Separator/>
                                            <div className="grid grid-cols-2 gap-4">
                                                {Object.entries(tempCosts).map(([key, val]) => (
                                                    <div key={key} className="space-y-1">
                                                        <Label className="capitalize text-xs">{key.replace(/([A-Z])/g, ' $1')}</Label>
                                                        <Input value={val} onChange={e => setTempCosts({...tempCosts, [key]: Number(e.target.value)})}/>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <DialogFooter><Button onClick={handleConfigSave}>Guardar</Button></DialogFooter>
                                    </DialogContent>
                                </Dialog>
                             </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Tabs value={modality} onValueChange={setModality} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="independent">Independiente</TabsTrigger>
                                    <TabsTrigger value="dependent">Empresa</TabsTrigger>
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
                                            <Label>Ingresos Mensuales</Label>
                                            <Input value={formatCurrency(monthlyIncome)} onChange={(e) => setMonthlyIncome(parseCurrency(e.target.value))} />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>IBC (Base Cotización)</Label>
                                <Input value={formatCurrency(ibc)} onChange={(e) => setIbc(parseCurrency(e.target.value))} disabled={autoCalculateIbc && modality === 'independent'} />
                                {ibc < SMLV && <p className="text-xs text-destructive">IBC inferior al SMLV</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Días: {days}</Label>
                                <input type="range" min="1" max="30" value={days} onChange={e => setDays(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                            </div>

                            <Separator />
                            
                            {/* Contributions Toggles */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm">Aportes</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center"><Label className="flex items-center gap-2"><Wallet className="w-4 h-4"/> Pensión</Label><Switch checked={includePension} onCheckedChange={setIncludePension}/></div>
                                    {includePension && <div className="pl-6 text-xs flex gap-4">
                                        <label className="flex items-center gap-1"><Checkbox checked={charges.pensionAffiliation} onCheckedChange={() => toggleCharge('pensionAffiliation')}/> Afiliación</label>
                                        <label className="flex items-center gap-1"><Checkbox checked={charges.pensionPortal} onCheckedChange={() => toggleCharge('pensionPortal')}/> Portal</label>
                                    </div>}

                                    <div className="flex justify-between items-center"><Label className="flex items-center gap-2"><Handshake className="w-4 h-4"/> Salud</Label><Switch checked={includeHealth} onCheckedChange={setIncludeHealth}/></div>
                                    {includeHealth && <div className="pl-6 text-xs flex gap-4">
                                        <label className="flex items-center gap-1"><Checkbox checked={charges.healthAffiliation} onCheckedChange={() => toggleCharge('healthAffiliation')}/> Afiliación</label>
                                        <label className="flex items-center gap-1"><Checkbox checked={charges.healthPortal} onCheckedChange={() => toggleCharge('healthPortal')}/> Portal</label>
                                    </div>}

                                    <div className="flex justify-between items-center"><Label className="flex items-center gap-2"><Briefcase className="w-4 h-4"/> ARL</Label><Switch checked={includeArl} onCheckedChange={setIncludeArl}/></div>
                                    {includeArl && (
                                        <div className="pl-6 space-y-2">
                                            <div className="text-xs flex gap-4">
                                                <label className="flex items-center gap-1"><Checkbox checked={charges.arlAffiliation} onCheckedChange={() => toggleCharge('arlAffiliation')}/> Afiliación</label>
                                                <label className="flex items-center gap-1"><Checkbox checked={charges.arlPortal} onCheckedChange={() => toggleCharge('arlPortal')}/> Portal</label>
                                            </div>
                                            <input type="range" min="1" max="5" value={arlRisk} onChange={e => setArlRisk(Number(e.target.value))} className="w-full h-1 bg-muted rounded-lg accent-primary"/>
                                            <p className="text-[10px] text-right">Riesgo {arlRisk}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <Separator />
                            
                            {/* Additional Services */}
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm">Extras</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center"><Label className="font-normal text-sm">Liq. Planilla</Label><Switch checked={charges.planillaLiquidation} onCheckedChange={() => toggleCharge('planillaLiquidation')}/></div>
                                    <div className="flex justify-between items-center"><Label className="font-normal text-sm">Corr. Planilla</Label><Switch checked={charges.planillaCorrection} onCheckedChange={() => toggleCharge('planillaCorrection')}/></div>
                                </div>
                                <div className="flex gap-2">
                                    <Input placeholder="Extra..." value={newAdditionalItem.description} onChange={e => setNewAdditionalItem({...newAdditionalItem, description: e.target.value})} className="h-8 text-xs"/>
                                    <Input placeholder="$" value={newAdditionalItem.value} onChange={e => setNewAdditionalItem({...newAdditionalItem, value: formatCurrency(parseCurrency(e.target.value))})} className="h-8 w-20 text-xs"/>
                                    <Button size="icon" className="h-8 w-8" onClick={handleAddAdditionalItem}><PlusCircle className="h-4 w-4"/></Button>
                                </div>
                                {additionalProcedureItems.map(i => (
                                    <div key={i.id} className="flex justify-between text-xs bg-muted/50 p-1 rounded">
                                        <span>{i.description}</span>
                                        <div className="flex items-center gap-2">
                                            <span>{formatCurrency(i.value)}</span>
                                            <Trash2 className="h-3 w-3 cursor-pointer text-destructive" onClick={() => setAdditionalProcedureItems(p => p.filter(x => x.id !== i.id))}/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Desktop Results (Center/Right) */}
                <div className="hidden lg:block lg:col-span-2 space-y-6">
                     <Card className="bg-[#F8EDD2]/30 border-none shadow-none">
                        <CardContent className="flex justify-center pt-6">
                            {/* Live Preview Component Scaled */}
                            <div className="transform scale-110 origin-top">
                                <CotizacionSummaryImage {...cotizacionData} />
                            </div>
                        </CardContent>
                     </Card>
                     <div className="flex justify-center gap-4">
                        <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
                            <DialogTrigger asChild>
                                <Button size="lg" onClick={handleOpenPreview} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                                    Descargar Imagen
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <div className="flex justify-center p-4 bg-muted rounded-lg">
                                    {generatedImage ? <img src={generatedImage} alt="Resumen"/> : <Loader2 className="animate-spin"/>}
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>Cerrar</Button>
                                    <Button onClick={() => {
                                        if(generatedImage) {
                                            const link = document.createElement('a');
                                            link.download = 'cotizacion.png';
                                            link.href = generatedImage;
                                            link.click();
                                        }
                                    }}>Guardar</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                     </div>
                </div>
            </div>
            
            {/* Mobile Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 lg:hidden z-50 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div>
                    <p className="text-xs text-muted-foreground uppercase">Total Estimado</p>
                    <p className="text-xl font-bold text-primary">{cotizacionData.totalNet}</p>
                </div>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm"><FileText className="h-4 w-4"/></Button></DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-auto">
                            <DialogHeader><DialogTitle>Detalle</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-sm">Seguridad Social</h4>
                                    {cotizacionData.breakdownItems.map(i => <div key={i.label} className="flex justify-between text-sm"><span>{i.label}</span><span>{i.value}</span></div>)}
                                </div>
                                <Separator/>
                                <div>
                                    <h4 className="font-bold text-sm">Servicios</h4>
                                    {cotizacionData.procedureItems.map(i => <div key={i.label} className="flex justify-between text-sm"><span>{i.label}</span><span>{i.value}</span></div>)}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button size="sm" onClick={handleOpenPreview}>
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Eye className="h-4 w-4 mr-2"/>}
                        Ver Recibo
                    </Button>
                </div>
            </div>
        </div>
    </PageLayout>
  );
}
