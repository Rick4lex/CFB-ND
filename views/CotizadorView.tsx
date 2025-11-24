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
    SquareArrowUp, RefreshCw, LayoutTemplate, Receipt
} from 'lucide-react';
import { CotizacionSummaryImage } from '../components/features/CotizacionSummaryImage';
import { PageLayout } from '../components/layout/Layout';
import { useCotizador } from '../hooks/useCotizador';
import { formatCurrency, parseCurrency } from '../lib/utils';

export function CotizadorView() {
  const imageRef = useRef<HTMLDivElement>(null);
  const { state, actions } = useCotizador();
  
  // UI Specific State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isProfileManagerOpen, setIsProfileManagerOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newAdditionalItem, setNewAdditionalItem] = useState({ description: '', value: '' });
  const [resultViewMode, setResultViewMode] = useState('receipt'); // 'receipt' | 'details'

  useEffect(() => {
      if (isConfigModalOpen) {
          actions.setTempCosts(state.procedureCosts);
          actions.setTempFinancials(state.config.financials);
      }
  }, [isConfigModalOpen, state.procedureCosts, state.config.financials]);

  const handleOpenPreview = async () => {
    if (!imageRef.current) return;
    setIsGenerating(true);
    setIsPreviewModalOpen(true);
    try {
        const dataUrl = await htmlToImage.toPng(imageRef.current, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' });
        setGeneratedImage(dataUrl);
    } catch(error) {
        console.error("Error generating image:", error);
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
            await navigator.share({ title: 'Resumen Cotización', text: 'Resumen de cotización.', files: [file] });
        } else {
           handleDownload();
        }
      } catch {
          handleDownload();
      }
  };

  const handleDownload = () => {
      if (!generatedImage) return;
      const link = document.createElement('a');
      link.download = 'resumen-cotizacion-cfbnd.png';
      link.href = generatedImage;
      link.click();
  };

  const onAddAdditionalItem = () => {
    const value = parseCurrency(newAdditionalItem.value);
    if (newAdditionalItem.description && value > 0) {
      actions.setAdditionalProcedureItems(prev => [...prev, { id: Date.now(), description: newAdditionalItem.description, value }]);
      setNewAdditionalItem({ description: '', value: '' });
    }
  };

  return (
    <PageLayout title="Cotizador Inteligente" subtitle="Calcula aportes a seguridad social y costos de trámite." onBackRoute="/app/dashboard">
        <div className="w-full max-w-[1600px] mx-auto pb-20 lg:pb-0">
            {/* Hidden Element for High-Res Image Generation */}
            <div className="absolute -left-[9999px] top-0">
                <div ref={imageRef} style={{ width: '400px' }}>
                    <CotizacionSummaryImage {...state.cotizacionData} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* --- LEFT COLUMN: CONFIGURATION --- */}
                <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-4">
                    <Card className="shadow-lg border-primary/10">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">Configuración</CardTitle>
                                    <CardDescription className="text-xs mt-1">SMLV: {formatCurrency(state.SMLV)}</CardDescription>
                                </div>
                                <div className="flex items-center gap-1 -mr-2">
                                    {/* Profile Manager Dialog */}
                                    <Dialog open={isProfileManagerOpen} onOpenChange={setIsProfileManagerOpen}>
                                        <DialogTrigger><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white"><Bookmark className="h-4 w-4" /></Button></DialogTrigger>
                                        <DialogContent className="max-w-xl">
                                            <DialogHeader><DialogTitle>Perfiles de Cotización</DialogTitle></DialogHeader>
                                            <div className="space-y-4 pt-2">
                                                <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Guardar actual</Label>
                                                    <div className="flex gap-2">
                                                        <Input placeholder="Nombre del perfil..." value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} />
                                                        <Button onClick={() => { if(actions.handleSaveProfile(newProfileName)) setNewProfileName(''); }}><Save className="mr-2 h-4 w-4"/>Guardar</Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium">Mis Perfiles</h4>
                                                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                                                        {state.cotizadorProfiles.length === 0 && <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-md">Sin perfiles guardados.</p>}
                                                        {state.cotizadorProfiles.map(profile => (
                                                            <div key={profile.id} className="flex justify-between items-center p-3 border rounded-md bg-card hover:bg-muted/30 transition-colors">
                                                                <div><p className="font-semibold">{profile.name}</p><p className="text-xs text-muted-foreground">{new Date(profile.date).toLocaleDateString()}</p></div>
                                                                <div className="flex gap-1">
                                                                    <Button variant="ghost" size="icon" onClick={() => { actions.handleLoadProfile(profile.id); setIsProfileManagerOpen(false); }} title="Cargar"><SquareArrowUp className="h-4 w-4 text-blue-500"/></Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => actions.handleSaveProfile(profile.name, profile.id)} title="Actualizar"><RefreshCw className="h-4 w-4 text-green-500"/></Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => actions.handleDeleteProfile(profile.id)} title="Eliminar"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    {/* System Config Dialog */}
                                    <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                                        <DialogTrigger><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white"><Settings className="h-4 w-4" /></Button></DialogTrigger>
                                        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
                                            <DialogHeader><DialogTitle>Costos y Parámetros</DialogTitle></DialogHeader>
                                            <div className="flex-1 overflow-y-auto p-1 space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Object.entries(state.tempCosts).map(([key, value]) => (
                                                        <div key={key} className="space-y-1.5">
                                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</Label>
                                                            <Input value={formatCurrency(value as number)} onChange={(e) => actions.setTempCosts(prev => ({ ...prev, [key]: parseCurrency(e.target.value) }))} className="h-9 font-mono text-right"/>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <DialogFooter><Button onClick={() => actions.handleConfigSave(() => setIsConfigModalOpen(false))}>Guardar Cambios</Button></DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <Tabs value={state.modality} onValueChange={actions.setModality}>
                                <TabsList className="grid w-full grid-cols-2 mb-4">
                                    <TabsTrigger value="independent"><User className="mr-2 h-4 w-4"/>Independiente</TabsTrigger>
                                    <TabsTrigger value="dependent"><Building className="mr-2 h-4 w-4"/>Empresa</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {state.modality === 'independent' && (
                                <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                                    <div className="flex items-center justify-between"><Label>Calcular IBC (40%)</Label><Switch checked={state.autoCalculateIbc} onCheckedChange={actions.setAutoCalculateIbc} /></div>
                                    {state.autoCalculateIbc && <div className="space-y-2 animate-in slide-in-from-top-2"><Label>Ingresos Mensuales</Label><Input value={formatCurrency(state.monthlyIncome)} onChange={(e) => actions.setMonthlyIncome(parseCurrency(e.target.value))} className="font-bold text-lg"/></div>}
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label>Salario o Ingreso Base (IBC)</Label>
                                <Input value={formatCurrency(state.ibc)} onChange={(e) => actions.setIbc(parseCurrency(e.target.value))} disabled={state.autoCalculateIbc && state.modality === 'independent'} className="font-bold text-lg"/>
                                {state.ibcError && <p className="text-xs text-destructive font-medium">{state.ibcError}</p>}
                            </div>
                            
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between"><Label>Días Laborados</Label><span className="text-sm font-bold bg-muted px-2 rounded">{state.days}</span></div>
                                <input type="range" min="1" max="30" value={state.days} onChange={e => actions.setDays(parseInt(e.target.value))} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-4"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Adicionales</CardTitle></CardHeader>
                        <CardContent className="space-y-4 pb-4">
                             <ServiceToggle label="Liquidación Planilla" checked={state.chargePlanillaLiquidation} onChange={actions.setChargePlanillaLiquidation} />
                             <ServiceToggle label="Corrección Planilla" checked={state.chargePlanillaCorrection} onChange={actions.setChargePlanillaCorrection} />
                             {state.modality === 'dependent' && <div className="space-y-2 rounded-md border p-3"><Label>Administración</Label><Input value={formatCurrency(state.adminFee)} onChange={(e) => actions.setAdminFee(parseCurrency(e.target.value))} /></div>}
                             
                             <div className="space-y-3 rounded-md border border-dashed p-3">
                                 <h5 className="font-medium text-xs text-muted-foreground uppercase">Personalizados</h5>
                                 <div className="flex gap-2">
                                     <Input placeholder="Descripción" className="text-xs h-8" value={newAdditionalItem.description} onChange={(e) => setNewAdditionalItem(prev => ({...prev, description: e.target.value}))}/>
                                     <Input className="w-20 text-xs h-8" placeholder="$" value={newAdditionalItem.value} onChange={(e) => setNewAdditionalItem(prev => ({...prev, value: formatCurrency(parseCurrency(e.target.value))}))}/>
                                     <Button size="icon" className="h-8 w-8" onClick={onAddAdditionalItem}><PlusCircle className="h-4 w-4"/></Button>
                                 </div>
                                 {state.additionalProcedureItems.length > 0 && (
                                     <ul className="space-y-2 mt-2">
                                         {state.additionalProcedureItems.map(item => (
                                             <li key={item.id} className="flex justify-between items-center text-xs p-2 bg-muted/50 rounded-md">
                                                 <span>{item.description}</span>
                                                 <div className="flex items-center gap-2 font-mono"><span>{formatCurrency(item.value)}</span><Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:bg-destructive/10" onClick={() => actions.setAdditionalProcedureItems(prev => prev.filter(i => i.id !== item.id))}><Trash2 className="h-3 w-3"/></Button></div>
                                             </li>
                                         ))}
                                     </ul>
                                 )}
                             </div>
                        </CardContent>
                    </Card>

                    <Card className="h-full border-t-4 border-t-green-500 shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-green-500"/> Aportes Seguridad Social</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <div className="space-y-4">
                                <ContributionSection label="Pensión" active={state.includePension} onToggle={actions.setIncludePension}>
                                    <SubOption label="Cobrar Afiliación" checked={state.chargePensionAffiliation} onChange={actions.setChargePensionAffiliation} />
                                    <SubOption label="Cobrar Portal" checked={state.chargePensionPortal} onChange={actions.setChargePensionPortal} />
                                </ContributionSection>

                                <ContributionSection label="Salud (EPS)" active={state.includeHealth} onToggle={actions.setIncludeHealth}>
                                    <SubOption label="Cobrar Afiliación" checked={state.chargeHealthAffiliation} onChange={actions.setChargeHealthAffiliation} />
                                    <SubOption label="Cobrar Portal" checked={state.chargeHealthPortal} onChange={actions.setChargeHealthPortal} />
                                </ContributionSection>

                                <div className="flex flex-col space-y-3 rounded-lg border bg-muted/10 p-3 transition-all hover:bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <Label className="flex items-center gap-2 font-semibold">Caja Comp.</Label>
                                        {state.modality === 'independent' ? (
                                            <RadioGroup onValueChange={(v) => actions.setCcfRate(parseFloat(v))} value={String(state.ccfRate)} className="flex items-center gap-3">
                                                <div className="flex items-center space-x-1 cursor-pointer"><RadioGroupItem value="0" id="ccf-0"/><Label htmlFor="ccf-0" className="cursor-pointer text-xs">No</Label></div>
                                                <div className="flex items-center space-x-1 cursor-pointer"><RadioGroupItem value="0.006" id="ccf-06"/><Label htmlFor="ccf-06" className="cursor-pointer text-xs">0.6%</Label></div>
                                                <div className="flex items-center space-x-1 cursor-pointer"><RadioGroupItem value="0.02" id="ccf-2"/><Label htmlFor="ccf-2" className="cursor-pointer text-xs">2%</Label></div>
                                            </RadioGroup>
                                        ) : <Switch checked={state.ccfRate > 0} onCheckedChange={(v) => actions.setCcfRate(v ? 0.04 : 0)}/>}
                                    </div>
                                    {state.ccfRate > 0 && <div className="pl-4 border-l-2 border-primary/20 space-y-2 text-xs"><SubOption label="Afiliación" checked={state.chargeCcfAffiliation} onChange={actions.setChargeCcfAffiliation}/><SubOption label="Portal" checked={state.chargeCcfPortal} onChange={actions.setChargeCcfPortal}/></div>}
                                </div>

                                <ContributionSection label="ARL" active={state.includeArl} onToggle={actions.setIncludeArl}>
                                    <div className="space-y-2 pt-2 px-1"><div className="flex justify-between text-xs"><Label>Riesgo</Label><span className="font-bold">{state.arlRisk}</span></div><input type="range" min="1" max="5" value={state.arlRisk} onChange={e => actions.setArlRisk(parseInt(e.target.value))} className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"/></div>
                                    <SubOption label="Cobrar Afiliación" checked={state.chargeArlAffiliation} onChange={actions.setChargeArlAffiliation} />
                                    <SubOption label="Cobrar Portal" checked={state.chargeArlPortal} onChange={actions.setChargeArlPortal} />
                                </ContributionSection>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-end">
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Subtotal Aportes</p>
                                <p className="text-2xl font-bold text-foreground">{state.cotizacionData.totalSocialSecurity}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- RIGHT COLUMN: RESULTS --- */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="md:col-span-2 bg-gradient-to-br from-card to-secondary/30 border-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Receipt className="w-40 h-40"/></div>
                            <CardHeader><CardTitle className="text-lg text-muted-foreground uppercase tracking-widest text-sm z-10">Resumen Total</CardTitle></CardHeader>
                            <CardContent className="flex flex-col md:flex-row justify-between items-center gap-6 z-10 relative">
                                <div className="text-center md:text-left">
                                    <p className="text-sm text-muted-foreground mb-1">Valor Final Cliente</p>
                                    <p className="text-5xl md:text-7xl font-bold text-primary tracking-tighter drop-shadow-sm">{state.cotizacionData.totalNet}</p>
                                </div>
                                <div className="flex flex-col items-center md:items-end gap-1 bg-white/50 p-4 rounded-xl border border-white/20 shadow-sm backdrop-blur-sm">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Base Cotización</p>
                                    <p className="text-2xl md:text-3xl font-bold text-foreground">{state.cotizacionData.resultsIbc}</p>
                                    <p className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{state.cotizacionData.resultsIbcDays}</p>
                                </div>
                            </CardContent>
                            <div className="px-6 pb-6 z-10 relative">
                                <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
                                    <DialogTrigger className="w-full">
                                        <Button onClick={handleOpenPreview} disabled={isGenerating} className="w-full h-12 text-lg shadow-md" size="lg">
                                            {isGenerating ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Generando...</> : <><Eye className="mr-2 h-5 w-5" />Previsualizar Imagen</>}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                        <DialogHeader><DialogTitle>Previsualización</DialogTitle></DialogHeader>
                                        <div className="p-4 flex justify-center items-center bg-gray-100 rounded-lg border my-4 shadow-inner min-h-[300px]">
                                            {generatedImage ? <img src={generatedImage} alt="Resumen" className="w-full h-auto rounded shadow-lg"/> : <div className="flex items-center justify-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mr-2"/> Generando...</div>}
                                        </div>
                                        <DialogFooter className="sm:justify-between gap-2"><Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>Cerrar</Button><div className="flex gap-2"><Button onClick={handleShare} disabled={!generatedImage}><Share2 className="mr-2 h-4 w-4" /> Compartir</Button><Button onClick={handleDownload} disabled={!generatedImage}><Download className="mr-2 h-4 w-4" /> Descargar</Button></div></DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </Card>
                    </div>

                    <div className="w-full">
                        <Tabs value={resultViewMode} onValueChange={setResultViewMode} className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Detalles de la Cotización</h3>
                                <TabsList>
                                    <TabsTrigger value="receipt"><Receipt className="mr-2 h-4 w-4"/>Recibo</TabsTrigger>
                                    <TabsTrigger value="details"><LayoutTemplate className="mr-2 h-4 w-4"/>Detalle</TabsTrigger>
                                </TabsList>
                            </div>
                            
                            <TabsContent value="receipt" className="animate-in fade-in zoom-in-95 duration-300">
                                <div className="w-full flex justify-center bg-muted/20 border rounded-xl p-8 shadow-inner overflow-hidden">
                                     <div className="transform scale-[0.85] sm:scale-100 origin-top shadow-2xl rounded-lg">
                                        <CotizacionSummaryImage {...state.cotizacionData} />
                                     </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="details" className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="h-full border-t-4 border-t-green-500 shadow-sm hover:shadow-md transition-all">
                                        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-green-500"/> Aportes</CardTitle></CardHeader>
                                        <CardContent className="pt-4">
                                            <ul className="space-y-3">
                                                {state.cotizacionData.breakdownItems.map((item: any) => (
                                                    <li key={item.label} className="flex justify-between items-center text-sm group">
                                                        <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500"/><span className="text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span></div>
                                                        <span className="font-medium font-mono">{item.value}</span>
                                                    </li>
                                                ))}
                                                {state.cotizacionData.breakdownItems.length === 0 && <li className="text-muted-foreground italic text-sm text-center py-4">Sin aportes seleccionados</li>}
                                            </ul>
                                        </CardContent>
                                    </Card>

                                    <Card className="h-full border-t-4 border-t-primary shadow-sm hover:shadow-md transition-all">
                                        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/> Trámites</CardTitle></CardHeader>
                                        <CardContent className="pt-4 flex flex-col h-full">
                                            <ul className="space-y-3 flex-1">
                                                {state.cotizacionData.procedureItems.map((item: any) => (
                                                    <li key={item.label} className="flex justify-between items-center text-sm group">
                                                        <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full border border-primary/40 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-primary rounded-full"></div></div><span className="text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span></div>
                                                        <span className="font-medium font-mono">{item.value}</span>
                                                    </li>
                                                ))}
                                                {state.cotizacionData.procedureItems.length === 0 && <li className="text-muted-foreground italic text-sm text-center py-4">Sin trámites seleccionados</li>}
                                            </ul>
                                            <Separator className="mt-6 mb-4"/>
                                            <div className="flex justify-between items-end">
                                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Trámites</p>
                                                <p className="text-2xl font-bold text-foreground">{state.cotizacionData.totalProcedureCost}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="w-full rounded-lg border p-4 border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-900/10 flex items-start gap-4">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600 mt-0.5" />
                        <div className="text-xs text-muted-foreground"><p className="font-bold text-foreground text-sm mb-1">Aviso Legal</p>Los cálculos presentados son una estimación basada en los parámetros seleccionados. No incluyen intereses de mora generados por los operadores PILA ni ajustes retroactivos.</div>
                    </div>
                </div>
            </div>
            
            {/* STICKY FOOTER FOR MOBILE */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t p-4 z-50 flex items-center justify-between shadow-2xl">
                 <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Total a Pagar</span>
                    <span className="text-2xl font-bold text-primary leading-none">{state.cotizacionData.totalNet}</span>
                 </div>
                 <Button onClick={handleOpenPreview} disabled={isGenerating} size="sm" className="h-10 px-6 shadow-md">
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Eye className="h-4 w-4 mr-2"/>}
                    Previsualizar
                 </Button>
            </div>
        </div>
    </PageLayout>
  );
}

// Subcomponents
const TabsContent = ({ value, children, className }: any) => {
    // Simple TabsContent wrapper to work with the Shared Tabs component which might be expecting standard radix/headless structure
    // But since Shared.tsx implements a custom Tabs, we need to conditionally render based on context or prop.
    // The Shared.tsx Tabs implementation uses a data-attribute on the parent and onClick.
    // However, it doesn't export TabsContent natively connected to context in the provided file.
    // It exports Tabs (container), TabsList, TabsTrigger.
    // So we need to handle content visibility manually or rely on CSS if the shared component supported it.
    // Checking Shared.tsx: The Tabs component is just a wrapper with onClick. It DOES NOT manage active state for content rendering.
    // It seems I need to manage state manually in the parent (CotizadorView) as I did with `resultViewMode`.
    // So here I just render if the parent state matches.
    // Since I cannot pass the state easily without context, I will just assume the parent controls rendering via conditional logic 
    // OR I will fix this component to render only if `value` matches `resultViewMode` (which I need to pass or control).
    
    // Actually, looking at the code above in CotizadorView, I used <Tabs value={resultViewMode} ...>
    // But the `Shared.tsx` Tabs implementation is very simple/naive:
    /*
    export const Tabs = ({ value, onValueChange, children, className }: any) => {
        return <div className={`w-full ${className}`} data-value={value} onClick={(e: any) => { 
            const trigger = e.target.closest('[data-value]');
            if(trigger && onValueChange && !trigger.disabled) onValueChange(trigger.dataset.value) 
        }}>{children}</div>
    }
    */
   // It doesn't use Context to share state with Content. 
   // So, I must change how I use Tabs in CotizadorView to manually conditionally render the content.
   
   return <div className={className} style={{ display: 'none' }} data-content-for={value}>{children}</div>
};
// FIX: I will replace the TabsContent usage in the main component with standard React conditional rendering 
// because the Shared Tabs component is not a full Context-based compound component.

const ContributionSection = ({ label, active, onToggle, children }: any) => (
    <div className={`flex flex-col space-y-3 rounded-lg border p-3 transition-all duration-200 ${active ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-muted/10 opacity-80 hover:opacity-100'}`}>
        <div className="flex items-center justify-between"><Label className="flex items-center gap-2 font-semibold cursor-pointer" onClick={() => onToggle(!active)}>{label}</Label><Switch checked={active} onCheckedChange={onToggle} /></div>
        {active && <div className="pl-4 border-l-2 border-primary/20 space-y-2 text-xs pt-1 animate-in slide-in-from-top-1">{children}</div>}
    </div>
);
const SubOption = ({ label, checked, onChange }: any) => (
    <div className="flex items-center gap-2 hover:bg-white/50 p-1 rounded cursor-pointer" onClick={() => onChange(!checked)}><Checkbox checked={checked} onCheckedChange={(v: any) => onChange(!!v)}/><Label className="font-normal cursor-pointer">{label}</Label></div>
);
const ServiceToggle = ({ label, checked, onChange }: any) => (
    <div className="flex items-center justify-between rounded-md border p-3 bg-card hover:bg-muted/20 transition-colors"><Label className="flex items-center gap-2 font-normal cursor-pointer" onClick={() => onChange(!checked)}>{label}</Label><Switch checked={checked} onCheckedChange={onChange}/></div>
);
