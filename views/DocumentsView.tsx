import { useState, useEffect, useRef, useMemo } from 'react';
import * as htmlToImage from 'html-to-image';
import { useLocation } from 'react-router-dom';
import { Loader2, Eye, Printer, Download, FileText, DollarSign, Share2, Users, UserPlus, Trash2, Plus } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { PageLayout } from '../components/layout/Layout';
import { InvoicePreview } from '../components/features/InvoicePreview';
import { 
    Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
    Input, Accordion, AccordionItem, AccordionTrigger, AccordionContent,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Separator, Badge
} from '../components/ui/Shared';
import { proceduralServices } from '../lib/constants';
import { useToast } from '../hooks/use-toast';
import { formatCurrency, parseCurrency } from '../lib/utils';

interface AdditionalItem {
  id: number;
  description: string;
  value: number;
}

export const DocumentsView = () => {
  const location = useLocation();
  const { toast } = useToast();
  const { clients, advisors, config } = useAppStore(); // Access config for service names
  
  // Invoice state (Individual)
  const [selectedInvoiceClient, setSelectedInvoiceClient] = useState<string>('');
  const [additionalInvoiceItems, setAdditionalInvoiceItems] = useState<AdditionalItem[]>([]);
  const [newAdditionalItem, setNewAdditionalItem] = useState({ description: '', value: '' });

  // Group Invoice State
  const [groupPayerId, setGroupPayerId] = useState<string>('');
  const [groupBeneficiaryId, setGroupBeneficiaryId] = useState<string>('');
  const [groupInvoiceItems, setGroupInvoiceItems] = useState<AdditionalItem[]>([]);
  const [newGroupItem, setNewGroupItem] = useState({ description: '', value: '' });

  // Commission report state
  const [reportAdvisor, setReportAdvisor] = useState('');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportStatus, setReportStatus] = useState('Liquidado');

  // Image Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  // Refs for capture
  const imageRef = useRef<HTMLDivElement>(null);
  const groupImageRef = useRef<HTMLDivElement>(null);

  // Active Preview logic
  const [activePreviewType, setActivePreviewType] = useState<'individual' | 'group'>('individual');

  useEffect(() => {
      // Check for client ID passed via navigation state
      const state = location.state as { clientId?: string } | null;
      if (state && state.clientId) {
          setSelectedInvoiceClient(state.clientId);
      }
  }, [location.state]);
  
  // Reset additional items when client changes
  useEffect(() => {
    setAdditionalInvoiceItems([]);
  }, [selectedInvoiceClient]);

  // --- Logic for Individual Invoice ---
  const clientForInvoice = useMemo(() => {
    return clients.find(c => c.id === selectedInvoiceClient);
  }, [selectedInvoiceClient, clients]);

  const totalInvoiceAmount = useMemo(() => {
    const servicesCost = clientForInvoice?.contractedServices?.reduce((acc, serviceIdentifier) => {
      const service = config.servicesCatalog.find(s => s.id === serviceIdentifier || s.name === serviceIdentifier);
      return acc + (service?.price || 0);
    }, 0) || 0;
    
    const additionalCost = additionalInvoiceItems.reduce((acc, item) => acc + item.value, 0);
    return servicesCost + additionalCost;
  }, [clientForInvoice, additionalInvoiceItems, config.servicesCatalog]);

  // --- Logic for Group Invoice ---
  const groupPayerClient = useMemo(() => {
      return clients.find(c => c.id === groupPayerId);
  }, [groupPayerId, clients]);

  const groupTotalAmount = useMemo(() => {
      // Payer's own services
      const payerServicesCost = groupPayerClient?.contractedServices?.reduce((acc, serviceIdentifier) => {
          const service = config.servicesCatalog.find(s => s.id === serviceIdentifier || s.name === serviceIdentifier);
          return acc + (service?.price || 0);
      }, 0) || 0;

      // Group items (beneficiaries + extras)
      const itemsCost = groupInvoiceItems.reduce((acc, item) => acc + item.value, 0);
      
      return payerServicesCost + itemsCost;
  }, [groupPayerClient, groupInvoiceItems, config.servicesCatalog]);

  // --- Handlers ---

  const handleAddAdditionalItem = () => {
    const val = parseCurrency(newAdditionalItem.value);
    if (newAdditionalItem.description && val !== 0) {
      setAdditionalInvoiceItems(prev => [...prev, {
        id: Date.now(),
        description: newAdditionalItem.description,
        value: val,
      }]);
      setNewAdditionalItem({ description: '', value: '' });
    }
  };

  // Group Invoice Handlers
  const handleAddBeneficiaryToGroup = () => {
      if (!groupBeneficiaryId) return;
      
      const beneficiary = clients.find(c => c.id === groupBeneficiaryId);
      if (!beneficiary) return;

      const newItems: AdditionalItem[] = [];
      
      // Auto-import services
      if (beneficiary.contractedServices && beneficiary.contractedServices.length > 0) {
          beneficiary.contractedServices.forEach(serviceId => {
              const service = config.servicesCatalog.find(s => s.id === serviceId || s.name === serviceId);
              if (service) {
                  newItems.push({
                      id: Date.now() + Math.random(),
                      description: `${beneficiary.fullName} - ${service.name}`,
                      value: service.price
                  });
              }
          });
          toast({ title: 'Beneficiario Agregado', description: `Se añadieron ${newItems.length} servicios de ${beneficiary.fullName}.` });
      } else {
          // If no services, maybe add just the name as placeholder or warn
           toast({ title: 'Sin Servicios', description: `${beneficiary.fullName} no tiene servicios contratados para importar.` });
      }

      setGroupInvoiceItems(prev => [...prev, ...newItems]);
      setGroupBeneficiaryId(''); // Reset selector
  };

  const handleAddManualGroupItem = () => {
      const val = parseCurrency(newGroupItem.value);
      if (newGroupItem.description && val !== 0) {
          setGroupInvoiceItems(prev => [...prev, {
              id: Date.now(),
              description: newGroupItem.description,
              value: val
          }]);
          setNewGroupItem({ description: '', value: '' });
      }
  };

  const removeGroupItem = (id: number) => {
      setGroupInvoiceItems(prev => prev.filter(item => item.id !== id));
  };

  // Image Gen
  const handleOpenInvoicePreview = async (type: 'individual' | 'group') => {
    const ref = type === 'individual' ? imageRef : groupImageRef;
    
    if (!ref.current) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo encontrar el componente de la factura.' });
        return;
    }
    
    setIsGenerating(true);
    setActivePreviewType(type);
    setIsPreviewModalOpen(true);
    setGeneratedImage(null);
    
    try {
        // Wait for render
        await new Promise(resolve => setTimeout(resolve, 300));
        const dataUrl = await htmlToImage.toPng(ref.current, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' });
        setGeneratedImage(dataUrl);
    } catch(error) {
        console.error("Error generating image:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar la imagen de la factura.' });
        setIsPreviewModalOpen(false);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleShare = async () => {
      if (!generatedImage) return;
      try {
        const blob = await (await fetch(generatedImage)).blob();
        const file = new File([blob], "cuenta-de-cobro-cfbnd.png", { type: "image/png" });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: 'Cuenta de Cobro', text: `Cuenta de cobro generada por CFBND.`, files: [file] });
        } else {
           handleDownload();
        }
      } catch (e) {
          console.error("Share failed", e);
          handleDownload();
      }
  };

  const handleDownload = () => {
      if (!generatedImage) return;
      const link = document.createElement('a');
      link.download = `cuenta-de-cobro-${activePreviewType}_${new Date().getTime()}.png`;
      link.href = generatedImage;
      link.click();
  };
  
  // Reports
  const commissionReportData = useMemo(() => {
    if (!reportAdvisor) return [];
    return clients.filter(client => {
      if (!client.entryDate) return false;
      const entryDate = new Date(client.entryDate);
      return client.assignedAdvisor === reportAdvisor &&
             entryDate.getMonth() === reportMonth &&
             entryDate.getFullYear() === reportYear;
    });
  }, [clients, reportAdvisor, reportMonth, reportYear]);

  const totalCommission = useMemo(() => {
    return commissionReportData.reduce((total, client) => {
      if (typeof client.advisorCommissionAmount === 'number') {
          return total + client.advisorCommissionAmount;
      }
      const advisorDetails = advisors.find(a => a.name === reportAdvisor);
      if (!advisorDetails) return total;

      const servicesCost = client.contractedServices?.reduce((acc, serviceIdentifier) => {
        const service = config.servicesCatalog.find(s => s.id === serviceIdentifier || s.name === serviceIdentifier);
        return acc + (service?.price || 0);
      }, 0) || 0;
      
      if (advisorDetails.commissionType === 'percentage') {
        const commission = servicesCost * ((advisorDetails.commissionValue || 0) / 100);
        return total + commission;
      }
      
      if (advisorDetails.commissionType === 'fixed') {
        const affiliationServiceCount = client.contractedServices?.filter(s => {
             const name = config.servicesCatalog.find(cat => cat.id === s)?.name || s;
             return name.toLowerCase().includes('afiliación') || name.toLowerCase().includes('liquidación');
        }).length || 0;
        const commission = affiliationServiceCount * (advisorDetails.commissionValue || 0);
        return total + commission;
      }
      return total;
    }, 0);
  }, [commissionReportData, advisors, reportAdvisor, config.servicesCatalog]);

  const handleGenerateCommissionReport = () => {
     if (commissionReportData.length === 0) {
      toast({ variant: 'destructive', title: 'Sin Datos', description: 'No se encontraron clientes para este asesor en el periodo seleccionado.' });
      return;
    }
    window.print();
  };

  return (
    <PageLayout 
        title="Generador de Documentos" 
        subtitle="Crea cuentas de cobro y reportes de comisiones."
        onBackRoute="/app/dashboard"
    >
        {/* Hidden Elements for Capture */}
        <div className="absolute -left-[9999px] top-0">
            {clientForInvoice && (
                <div ref={imageRef} style={{ width: '816px' }}>
                    <InvoicePreview
                        client={clientForInvoice}
                        additionalItems={additionalInvoiceItems}
                        totalAmount={totalInvoiceAmount}
                    />
                </div>
            )}
            {groupPayerClient && (
                <div ref={groupImageRef} style={{ width: '816px' }}>
                    <InvoicePreview
                        client={groupPayerClient}
                        additionalItems={groupInvoiceItems}
                        totalAmount={groupTotalAmount}
                    />
                </div>
            )}
        </div>
      
        <section className="max-w-5xl mx-auto">
            <Accordion className="w-full space-y-4" defaultValue="group-invoice">
                
                {/* 1. Factura Individual */}
                <AccordionItem value="invoice-generator">
                    <AccordionTrigger className="bg-card p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-lg">Cuenta de Cobro Individual</span>
                    </div>
                    </AccordionTrigger>
                    <AccordionContent>
                    <div className="p-6 bg-card rounded-lg border space-y-6 mt-2">
                        <div className='flex flex-col md:flex-row gap-4 items-end'>
                            <div className='flex-grow w-full'>
                                <label className="text-sm font-medium mb-1 block">Seleccionar Cliente</label>
                                <Select value={selectedInvoiceClient} onValueChange={setSelectedInvoiceClient}>
                                    <SelectTrigger><SelectValue placeholder="Busca un cliente..." /></SelectTrigger>
                                    <SelectContent>
                                        {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.fullName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full md:w-auto" onClick={() => handleOpenInvoicePreview('individual')} disabled={!clientForInvoice || isGenerating}>
                                {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Generando...</> : <><Eye className="mr-2 h-4 w-4"/>Previsualizar</>}
                            </Button>
                        </div>

                        {clientForInvoice && (
                        <>
                            <Card>
                                <CardHeader><CardTitle className="text-base">Ítems Adicionales y Descuentos</CardTitle></CardHeader>
                                <CardContent>
                                        <div className="flex gap-2 mb-4">
                                        <Input aria-label="Descripción" placeholder="Descripción (ej: Descuento Combo)" value={newAdditionalItem.description} onChange={(e: any) => setNewAdditionalItem(prev => ({...prev, description: e.target.value}))}/>
                                        <Input aria-label="Valor" placeholder="Valor ($ -5000 para descuentos)" value={newAdditionalItem.value} onChange={(e: any) => setNewAdditionalItem(prev => ({...prev, value: formatCurrency(parseCurrency(e.target.value))}))}/>
                                        <Button onClick={handleAddAdditionalItem} variant="secondary">Añadir</Button>
                                    </div>
                                    {additionalInvoiceItems.length > 0 && (
                                        <div className="border rounded-md overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted text-muted-foreground">
                                                    <tr><th className="p-2">Descripción</th><th className="p-2 text-right">Valor</th></tr>
                                                </thead>
                                                <tbody>
                                                    {additionalInvoiceItems.map(item => (
                                                        <tr key={item.id} className="border-t">
                                                            <td className="p-2">{item.description}</td>
                                                            <td className={`p-2 text-right ${item.value < 0 ? 'text-red-500 font-medium' : ''}`}>{item.value.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                        )}
                    </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 2. Factura Grupal */}
                <AccordionItem value="group-invoice">
                    <AccordionTrigger className="bg-card p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-purple-500" />
                        <span className="font-semibold text-lg">Factura Grupal Multi-Cliente</span>
                    </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="p-6 bg-card rounded-lg border space-y-6 mt-2">
                            {/* Payer Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-primary uppercase tracking-wider">1. Seleccionar Pagador (Deudor Principal)</label>
                                <Select value={groupPayerId} onValueChange={setGroupPayerId}>
                                    <SelectTrigger className="h-12 text-lg"><SelectValue placeholder="Quién va a pagar..." /></SelectTrigger>
                                    <SelectContent>
                                        {clients.map(client => (
                                            <SelectItem key={client.id} value={client.id}>{client.fullName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {groupPayerId && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                    <Separator />
                                    
                                    {/* Add Beneficiaries */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-primary uppercase tracking-wider">2. Agregar Beneficiarios a la Cuenta</label>
                                        <div className="flex flex-col md:flex-row gap-3 items-end p-4 bg-muted/30 rounded-xl border border-dashed">
                                            <div className="flex-grow w-full space-y-1">
                                                <span className="text-xs text-muted-foreground">Buscar beneficiario para importar sus servicios</span>
                                                <Select value={groupBeneficiaryId} onValueChange={setGroupBeneficiaryId}>
                                                    <SelectTrigger><SelectValue placeholder="Seleccionar beneficiario..." /></SelectTrigger>
                                                    <SelectContent>
                                                        {clients.filter(c => c.id !== groupPayerId).map(client => (
                                                            <SelectItem key={client.id} value={client.id}>{client.fullName}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button onClick={handleAddBeneficiaryToGroup} disabled={!groupBeneficiaryId} className="w-full md:w-auto">
                                                <UserPlus className="mr-2 h-4 w-4"/> Agregar Servicios
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Cart / Manual Items */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Detalle de la Factura</label>
                                            <Badge variant="outline">{groupInvoiceItems.length} ítems extra</Badge>
                                        </div>
                                        
                                        <div className="border rounded-xl overflow-hidden bg-background">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                                                    <tr>
                                                        <th className="p-3 text-left">Descripción / Beneficiario</th>
                                                        <th className="p-3 text-right">Valor</th>
                                                        <th className="p-3 w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* Payer's own services (readonly preview) */}
                                                    {groupPayerClient?.contractedServices?.map((srvId, idx) => {
                                                        const srv = config.servicesCatalog.find(s => s.id === srvId || s.name === srvId);
                                                        return (
                                                            <tr key={`payer-${idx}`} className="border-b bg-primary/5">
                                                                <td className="p-3">
                                                                    <span className="font-semibold text-primary">{groupPayerClient.fullName}</span>
                                                                    <span className="text-muted-foreground"> - {srv?.name || srvId}</span>
                                                                </td>
                                                                <td className="p-3 text-right font-mono">{formatCurrency(srv?.price || 0)}</td>
                                                                <td className="p-3 text-center"><Badge variant="secondary" className="text-[10px]">Titular</Badge></td>
                                                            </tr>
                                                        );
                                                    })}

                                                    {/* Added Items */}
                                                    {groupInvoiceItems.map((item) => (
                                                        <tr key={item.id} className="border-b hover:bg-muted/20">
                                                            <td className="p-3">{item.description}</td>
                                                            <td className={`p-3 text-right font-mono ${item.value < 0 ? 'text-red-600' : ''}`}>
                                                                {formatCurrency(item.value)}
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <button onClick={() => removeGroupItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    
                                                    {/* Input Row */}
                                                    <tr className="bg-muted/10">
                                                        <td className="p-2">
                                                            <Input 
                                                                placeholder="Ítem manual o descuento..." 
                                                                value={newGroupItem.description} 
                                                                onChange={(e) => setNewGroupItem({...newGroupItem, description: e.target.value})} 
                                                                className="h-8 text-sm"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <Input 
                                                                placeholder="$0" 
                                                                value={newGroupItem.value} 
                                                                onChange={(e) => setNewGroupItem({...newGroupItem, value: formatCurrency(parseCurrency(e.target.value))})} 
                                                                className="h-8 text-sm text-right"
                                                            />
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={handleAddManualGroupItem}>
                                                                <Plus className="h-4 w-4"/>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                                <tfoot className="bg-muted/50 font-bold">
                                                    <tr>
                                                        <td className="p-3 text-right">TOTAL A COBRAR</td>
                                                        <td className="p-3 text-right text-lg">{formatCurrency(groupTotalAmount)}</td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>

                                    <Button className="w-full h-12 text-lg shadow-xl shadow-purple-500/20" onClick={() => handleOpenInvoicePreview('group')} disabled={isGenerating}>
                                        {isGenerating ? <><Loader2 className="mr-2 h-5 w-5 animate-spin"/>Generando...</> : <><Eye className="mr-2 h-5 w-5"/>Previsualizar Factura Grupal</>}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* 3. Reporte de Comisiones */}
                <AccordionItem value="commission-generator">
                    <AccordionTrigger className="bg-card p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-lg">Reporte de Comisiones por Asesor</span>
                    </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="p-6 bg-card rounded-lg border space-y-6 mt-2">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Select onValueChange={setReportAdvisor}><SelectTrigger><SelectValue placeholder="Selecciona un asesor..." /></SelectTrigger><SelectContent>{advisors.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent></Select>
                                <Select onValueChange={(v: any) => setReportMonth(Number(v))} defaultValue={String(reportMonth)}><SelectTrigger><SelectValue placeholder="Mes..." /></SelectTrigger><SelectContent>{Array.from({length: 12}, (_, i) => <SelectItem key={i} value={String(i)}>{new Date(0, i).toLocaleString('es-CO', { month: 'long' })}</SelectItem>)}</SelectContent></Select>
                                <Input aria-label="Año del reporte" type="number" value={reportYear} onChange={(e: any) => setReportYear(Number(e.target.value))} placeholder="Año"/>
                                <Select onValueChange={setReportStatus} defaultValue={reportStatus}><SelectTrigger><SelectValue placeholder="Estado..." /></SelectTrigger><SelectContent><SelectItem value="Liquidado">Liquidado</SelectItem><SelectItem value="Pendiente">Pendiente</SelectItem></SelectContent></Select>
                            </div>
                            <Button className="w-full" onClick={handleGenerateCommissionReport}><Printer className="mr-2 h-4 w-4"/>Imprimir Reporte</Button>

                            {commissionReportData.length > 0 && (
                                <div id="printable-commission">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Reporte de Comisión</CardTitle>
                                            <CardDescription>Asesor: {reportAdvisor} | Periodo: {new Date(reportYear, reportMonth).toLocaleString('es-CO', { month: 'long', year: 'numeric' })} | Estado: {reportStatus}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <table className="w-full text-sm">
                                                <thead><tr className="border-b text-left"><th className="pb-2">Cliente</th><th className="pb-2">Costo Trámite</th><th className="pb-2">Detalle Comisión</th><th className="pb-2 text-right">Valor Comisión</th></tr></thead>
                                                <tbody>
                                                    {commissionReportData.map(client => {
                                                        const servicesCost = client.contractedServices?.reduce((acc, serviceIdentifier) => {
                                                            const service = config.servicesCatalog.find(s => s.id === serviceIdentifier || s.name === serviceIdentifier);
                                                            return acc + (service?.price || 0);
                                                        }, 0) || 0;
                                                        
                                                        let commission = 0;
                                                        let commissionDisplay = "N/A";

                                                        if (typeof client.advisorCommissionAmount === 'number') {
                                                            commission = client.advisorCommissionAmount;
                                                            if (client.advisorCommissionPercentage) {
                                                                commissionDisplay = `${client.advisorCommissionPercentage}% (Histórico)`;
                                                            } else {
                                                                commissionDisplay = "Valor Fijo (Histórico)";
                                                            }
                                                        } 
                                                        else {
                                                            const advisorDetails = advisors.find(a => a.name === client.assignedAdvisor);
                                                            if(advisorDetails){
                                                                if(advisorDetails.commissionType === 'percentage'){
                                                                    commission = servicesCost * ((advisorDetails.commissionValue || 0) / 100);
                                                                    commissionDisplay = `${advisorDetails.commissionValue}% (Estimado)`;
                                                                } else {
                                                                    const affiliationServiceCount = client.contractedServices?.filter(s => {
                                                                        const name = config.servicesCatalog.find(cat => cat.id === s)?.name || s;
                                                                        return name.toLowerCase().includes('afiliación') || name.toLowerCase().includes('liquidación');
                                                                    }).length || 0;
                                                                    commission = affiliationServiceCount * (advisorDetails.commissionValue || 0);
                                                                    commissionDisplay = `${affiliationServiceCount} x ${advisorDetails.commissionValue.toLocaleString('es-CO', {style:'currency', currency: 'COP'})}`;
                                                                }
                                                            }
                                                        }

                                                        return (
                                                            <tr key={client.id} className="border-b last:border-0">
                                                                <td className="py-2">{client.fullName}</td>
                                                                <td className="py-2">{servicesCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                                                                <td className="py-2 text-xs text-muted-foreground">{commissionDisplay}</td>
                                                                <td className="py-2 text-right font-medium">{commission.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </CardContent>
                                        <CardFooter className="flex justify-between font-bold text-lg bg-muted/20">
                                            <p>Total a Pagar:</p>
                                            <p>{totalCommission.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
                                        </CardFooter>
                                    </Card>
                                </div>
                            )}
                            
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
      </section>
       <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-commission, #printable-commission * {
             visibility: visible;
          }
          #printable-commission {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
        <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Previsualización de Cuenta de Cobro</DialogTitle>
                </DialogHeader>
                <div className="p-4 flex justify-center items-center bg-gray-100 rounded-md my-4">
                    {generatedImage ? (
                        <img src={generatedImage} alt="Cuenta de Cobro" className="w-full h-auto shadow-lg"/>
                    ) : (
                        <div className="h-96 flex items-center justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
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
    </PageLayout>
  );
}