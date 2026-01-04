
import { useEffect, useRef, useState, useMemo } from 'react';
import * as htmlToImage from 'html-to-image';
import { 
    Button, Card, CardHeader, CardTitle, CardContent, CardDescription, 
    Input, Label, Switch, Tabs, TabsList, TabsTrigger, 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
    Checkbox, Separator, ScrollArea
} from '../components/ui/Shared';
import { 
    Wallet, Handshake, Briefcase, FileText, Eye, PlusCircle, Trash2, Bookmark, Settings, Download, Loader2, Save, Check
} from 'lucide-react';
import { CotizacionSummaryImage, type CotizacionData } from '../components/features/CotizacionSummaryImage';
import { useToast } from '../hooks/use-toast';
import { PageLayout } from '../components/layout/Layout';
import { useAppStore } from '../lib/store';
import { formatCurrency, parseCurrency, calculateSocialSecurity } from '../lib/utils';
import type { CotizadorProfile } from '../lib/types';

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
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isProfileManagerOpen, setIsProfileManagerOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  // Form State
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
  const [charges, setCharges] = useState<Record<string, boolean>>({
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

  // Config Local
  const [procedureCosts, setProcedureCosts] = useState(initialProcedureCosts);
  const [tempCosts, setTempCosts] = useState(initialProcedureCosts);
  const [tempFinancials, setTempFinancials] = useState(config.financials);

  // Toggle charge handler
  const toggleCharge = (key: string) => {
      setCharges(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Effects ---
  useEffect(() => {
    if (autoCalculateIbc && modality === 'independent') {
      setIbc(Math.max(monthlyIncome * 0.4, SMLV));
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

  // Main Calculation
  const cotizacionData = useMemo(() => {
      const socialSecResult = calculateSocialSecurity({
          ibc, days, modality, includePension, includeHealth, includeArl, arlRisk, ccfRate, contributionRates
      });

      let totalProcedureCost = 0;
      const newProcedureItems: { label: string; value: string }[] = [];
      
      const addCost = (active: boolean, cost: number, label: string) => {
          if(active) {
              totalProcedureCost += cost;
              newProcedureItems.push({ label, value: formatCurrency(cost) });
          }
      }

      // Add procedure costs based on state
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
  const handleDirectDownload = async () => {
    if (!imageRef.current) return;
    setIsGenerating(true);
    try {
        await new Promise(r => setTimeout(r, 100)); 
        const dataUrl = await htmlToImage.toPng(imageRef.current, { 
            quality: 1, 
            pixelRatio: 2, 
            backgroundColor: '#ffffff' 
        });
        const link = document.createElement('a');
        link.download = `cotizacion_${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
        toast({ title: "Comprobante Descargado", description: "La imagen se ha guardado correctamente." });
    } catch(error) {
        console.error("Error generating image:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo generar la imagen." });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleConfigSave = () => {
    setProcedureCosts(tempCosts);
    setConfig(prev => ({ ...prev, financials: tempFinancials }));
    toast({ title: "Configuración Actualizada", description: "Parámetros globales guardados." });
    setIsConfigModalOpen(false);
  }

  const handleAddAdditionalItem = () => {
    const value = parseCurrency(newAdditionalItem.value);
    if (newAdditionalItem.description && value > 0) {
      setAdditionalProcedureItems(prev => [...prev, { id: Date.now(), description: newAdditionalItem.description, value }]);
      setNewAdditionalItem({ description: '', value: '' });
    }
  };

  const handleSaveProfile = () => {
    if (!newProfileName.trim()) {
        toast({ variant: 'destructive', title: 'Nombre requerido', description: 'Ingresa un nombre para el perfil.' });
        return;
    }

    const newProfile: CotizadorProfile = {
        id: crypto.randomUUID(),
        name: newProfileName,
        data: {
            modality, monthlyIncome, ibc, days, includePension, includeHealth, includeArl, arlRisk, ccfRate, adminFee, charges
        }
    };

    setCotizadorProfiles(prev => [...prev, newProfile]);
    setNewProfileName('');
    toast({ title: 'Perfil Guardado', description: `Se ha creado el perfil "${newProfile.name}".` });
  };

  const handleLoadProfile = (profile: CotizadorProfile) => {
    const d = profile.data;
    setModality(d.modality);
    setMonthlyIncome(d.monthlyIncome);
    setIbc(d.ibc);
    setDays(d.days);
    setIncludePension(d.includePension);
    setIncludeHealth(d.includeHealth);
    setIncludeArl(d.includeArl);
    setArlRisk(d.arlRisk);
    setCcfRate(d.ccfRate);
    setAdminFee(d.adminFee || 20000);
    setCharges(d.charges);
    
    setIsProfileManagerOpen(false);
    toast({ title: 'Perfil Cargado', description: `Configuración aplicada: ${profile.name}` });
  };

  const handleDeleteProfile = (id: string) => {
    setCotizadorProfiles(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Perfil Eliminado', description: 'El perfil ha sido removido.' });
  };

  return (
    <PageLayout title="Cotizador Inteligente" subtitle="Calcula y genera comprobantes de cotización." onBackRoute="/app/dashboard">
        <div className="w-full">
            <div className="absolute -left-[9999px] top-0">
                <div ref={imageRef} style={{ width: '400px' }}>
                    <CotizacionSummaryImage {...cotizacionData} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-28 lg:pb-0">
                <div className="lg:col-span-5 xl:col-span-4 h-fit lg:sticky lg:top-24 space-y-4">
                    <Card className="border-primary/20 shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <div className="space-y-1">
                                <CardTitle className="text-xl">Configuración</CardTitle>
                                <CardDescription className="text-xs">SMLV: {formatCurrency(SMLV)}</CardDescription>
                             </div>
                             <div className="flex gap-1">
                                <Dialog open={isProfileManagerOpen} onOpenChange={setIsProfileManagerOpen}>
                                    <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Bookmark className="h-4 w-4"/></Button></DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Perfiles Guardados</DialogTitle>
                                            <CardDescription>Carga configuraciones frecuentes rápidamente.</CardDescription>
                                        </DialogHeader>
                                        
                                        <div className="space-y-4 py-2">
                                            <div className="flex gap-2">
                                                <Input placeholder="Nombre del nuevo perfil..." value={newProfileName} onChange={e => setNewProfileName(e.target.value)} />
                                                <Button onClick={handleSaveProfile} size="icon" title="Guardar actual como perfil"><Save className="h-4 w-4"/></Button>
                                            </div>

                                            <Separator />

                                            <ScrollArea className="h-64 pr-2">
                                                {cotizadorProfiles.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {cotizadorProfiles.map((profile: CotizadorProfile) => (
                                                            <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group">
                                                                <div className="flex flex-col cursor-pointer flex-1" onClick={() => handleLoadProfile(profile)}>
                                                                    <span className="font-bold text-sm">{profile.name}</span>
                                                                    <span className="text-[10px] text-muted-foreground uppercase">{profile.data.modality === 'independent' ? 'Independiente' : 'Empresa'} • IBC {formatCurrency(profile.data.ibc)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDeleteProfile(profile.id)}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                    <Check className="h-4 w-4 text-primary" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                        <p className="text-sm italic">No tienes perfiles guardados.</p>
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsProfileManagerOpen(false)}>Cerrar</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                                    <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Settings className="h-4 w-4"/></Button></DialogTrigger>
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
                                        <DialogFooter>
                                            <Button variant="ghost" onClick={() => setIsConfigModalOpen(false)}>Cancelar</Button>
                                            <Button onClick={handleConfigSave}>Guardar</Button>
                                        </DialogFooter>
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
                                <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="autoCalculateIbc">Calcular IBC (40%)</Label>
                                        <Switch id="autoCalculateIbc" checked={autoCalculateIbc} onCheckedChange={setAutoCalculateIbc} />
                                    </div>
                                    {autoCalculateIbc && (
                                        <div className="space-y-2">
                                            <Label htmlFor="income">Ingresos Mensuales</Label>
                                            <Input id="income" name="income" autoComplete="off" value={formatCurrency(monthlyIncome)} onChange={(e) => setMonthlyIncome(parseCurrency(e.target.value))} />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="ibc">IBC (Base Cotización)</Label>
                                <Input id="ibc" name="ibc" autoComplete="off" value={formatCurrency(ibc)} onChange={(e) => setIbc(parseCurrency(e.target.value))} disabled={autoCalculateIbc && modality === 'independent'} />
                                {ibc < SMLV && <p className="text-xs text-destructive font-medium">IBC inferior al SMLV</p>}
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label htmlFor="days-range">Días cotizados</Label>
                                    <span className="text-sm font-bold text-primary">{days}</span>
                                </div>
                                <input id="days-range" name="days" type="range" min="1" max="30" value={days} onChange={e => setDays(Number(e.target.value))} className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
                            </div>

                            <Separator />
                            
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Aportes de Ley</h4>
                                <div className="space-y-3">
                                    <div className="bg-card border rounded-lg p-3 space-y-3">
                                        <div className="flex justify-between items-center"><Label className="flex items-center gap-2 font-semibold"><Wallet className="w-4 h-4 text-blue-500"/> Pensión</Label><Switch checked={includePension} onCheckedChange={setIncludePension}/></div>
                                        {includePension && <div className="pl-6 text-xs flex gap-4 animate-in slide-in-from-top-2">
                                            <label className="flex items-center gap-2 cursor-pointer hover:text-primary"><Checkbox checked={charges.pensionAffiliation} onCheckedChange={() => toggleCharge('pensionAffiliation')}/> Afiliación</label>
                                            <label className="flex items-center gap-2 cursor-pointer hover:text-primary"><Checkbox checked={charges.pensionPortal} onCheckedChange={() => toggleCharge('pensionPortal')}/> Portal</label>
                                        </div>}
                                    </div>

                                    <div className="bg-card border rounded-lg p-3 space-y-3">
                                        <div className="flex justify-between items-center"><Label className="flex items-center gap-2 font-semibold"><Handshake className="w-4 h-4 text-green-500"/> Salud</Label><Switch checked={includeHealth} onCheckedChange={setIncludeHealth}/></div>
                                        {includeHealth && <div className="pl-6 text-xs flex gap-4 animate-in slide-in-from-top-2">
                                            <label className="flex items-center gap-2 cursor-pointer hover:text-primary"><Checkbox checked={charges.healthAffiliation} onCheckedChange={() => toggleCharge('healthAffiliation')}/> Afiliación</label>
                                            <label className="flex items-center gap-2 cursor-pointer hover:text-primary"><Checkbox checked={charges.healthPortal} onCheckedChange={() => toggleCharge('healthPortal')}/> Portal</label>
                                        </div>}
                                    </div>

                                    <div className="bg-card border rounded-lg p-3 space-y-3">
                                        <div className="flex justify-between items-center"><Label className="flex items-center gap-2 font-semibold"><Briefcase className="w-4 h-4 text-orange-500"/> ARL</Label><Switch checked={includeArl} onCheckedChange={setIncludeArl}/></div>
                                        {includeArl && (
                                            <div className="pl-6 space-y-3 animate-in slide-in-from-top-2">
                                                <div className="text-xs flex gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer hover:text-primary"><Checkbox checked={charges.arlAffiliation} onCheckedChange={() => toggleCharge('arlAffiliation')}/> Afiliación</label>
                                                    <label className="flex items-center gap-2 cursor-pointer hover:text-primary"><Checkbox checked={charges.arlPortal} onCheckedChange={() => toggleCharge('arlPortal')}/> Portal</label>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs text-muted-foreground"><span>Nivel 1</span><span>Nivel 5</span></div>
                                                    <input type="range" min="1" max="5" value={arlRisk} onChange={e => setArlRisk(Number(e.target.value))} className="w-full h-1 bg-muted rounded-lg accent-orange-500"/>
                                                    <p className="text-xs text-right font-medium text-orange-600">Riesgo {arlRisk}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Extras & Administrativos</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-lg transition-colors"><Label className="font-normal text-sm cursor-pointer">Liquidación Planilla</Label><Switch checked={charges.planillaLiquidation} onCheckedChange={() => toggleCharge('planillaLiquidation')}/></div>
                                    <div className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-lg transition-colors"><Label className="font-normal text-sm cursor-pointer">Corrección Planilla</Label><Switch checked={charges.planillaCorrection} onCheckedChange={() => toggleCharge('planillaCorrection')}/></div>
                                </div>
                                <div className="flex gap-2">
                                    <Input aria-label="Descripción ítem adicional" placeholder="Descripción ítem..." value={newAdditionalItem.description} onChange={e => setNewAdditionalItem({...newAdditionalItem, description: e.target.value})} className="h-9 text-xs"/>
                                    <Input aria-label="Valor ítem adicional" placeholder="$0" value={newAdditionalItem.value} onChange={e => setNewAdditionalItem({...newAdditionalItem, value: formatCurrency(parseCurrency(e.target.value))})} className="h-9 w-24 text-xs"/>
                                    <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAddAdditionalItem}><PlusCircle className="h-4 w-4"/></Button>
                                </div>
                                {additionalProcedureItems.map(i => (
                                    <div key={i.id} className="flex justify-between items-center text-xs bg-muted/50 p-2 rounded-lg border">
                                        <span className="font-medium">{i.description}</span>
                                        <div className="flex items-center gap-3">
                                            <span>{formatCurrency(i.value)}</span>
                                            <Trash2 className="h-3.5 w-3.5 cursor-pointer text-destructive hover:text-red-700" onClick={() => setAdditionalProcedureItems(p => p.filter(x => x.id !== i.id))}/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="hidden lg:flex lg:col-span-7 xl:col-span-8 flex-col items-center justify-start space-y-8 pt-8">
                     <div className="relative group perspective-1000">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                        <Card className="relative bg-transparent border-0 shadow-none ring-0 overflow-visible transform transition-transform duration-500 hover:scale-[1.01]">
                            <CardContent className="flex justify-center p-0">
                                <div className="transform scale-[1.06] origin-top mt-4 p-1">
                                    <CotizacionSummaryImage {...cotizacionData} />
                                </div>
                            </CardContent>
                        </Card>
                     </div>

                     <div className="flex justify-center gap-4 w-full max-w-md">
                        <Button size="lg" onClick={handleDirectDownload} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 h-14 text-lg">
                            {isGenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Download className="mr-2 h-5 w-5"/>}
                            Descargar Comprobante
                        </Button>
                     </div>
                </div>
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4 lg:hidden z-40 flex items-center justify-between shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] pb-safe">
                <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Estimado</p>
                    <p className="text-2xl font-bold text-primary leading-none mt-1">{cotizacionData.totalNet}</p>
                </div>
                <div className="flex gap-3">
                    <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                        <DialogTrigger asChild><Button variant="secondary" size="icon" className="h-12 w-12 rounded-xl"><FileText className="h-5 w-5"/></Button></DialogTrigger>
                        <DialogContent className="w-[95%] sm:max-w-md max-h-[80vh] overflow-y-auto rounded-2xl">
                            <DialogHeader><DialogTitle>Detalle de Costos</DialogTitle></DialogHeader>
                            <div className="space-y-6 pt-2">
                                <div>
                                    <h4 className="font-bold text-sm text-primary mb-2 uppercase tracking-wider">Seguridad Social</h4>
                                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                        {cotizacionData.breakdownItems.map(i => <div key={i.label} className="flex justify-between text-sm border-b border-border/50 last:border-0 pb-1 last:pb-0"><span>{i.label}</span><span className="font-mono">{i.value}</span></div>)}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-primary mb-2 uppercase tracking-wider">Servicios & Trámites</h4>
                                    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                        {cotizacionData.procedureItems.length > 0 ? cotizacionData.procedureItems.map(i => <div key={i.label} className="flex justify-between text-sm border-b border-border/50 last:border-0 pb-1 last:pb-0"><span>{i.label}</span><span className="font-mono">{i.value}</span></div>) : <p className="text-sm text-muted-foreground italic">Ningún servicio adicional seleccionado</p>}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button className="w-full" variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Cerrar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button size="lg" className="h-12 px-6 rounded-xl shadow-lg shadow-primary/20" onClick={handleDirectDownload}>
                        {isGenerating ? <Loader2 className="h-5 w-5 animate-spin"/> : <Download className="h-5 w-5 mr-2"/>}
                        Descargar
                    </Button>
                </div>
            </div>
        </div>
    </PageLayout>
  );
}
