import { useState, useEffect, useRef, useMemo } from 'react';
import * as htmlToImage from 'html-to-image';
import { useLocation } from 'react-router-dom';
import { Loader2, Eye, Printer, Download, FileText, DollarSign, Share2, Users, UserPlus, Trash2, Plus, DownloadCloud } from 'lucide-react';
import Papa from 'papaparse';
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
import { useInvoiceBuilder, type InvoiceItem } from '../hooks/useInvoiceBuilder';

export const DocumentsView = () => {
  const location = useLocation();
  const { toast } = useToast();
  const { clients, advisors, config } = useAppStore(); // Access config for service names
  
  // Invoice state (Individual)
  const [selectedInvoiceClient, setSelectedInvoiceClient] = useState<string>('');
  const [individualInvoiceDate, setIndividualInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const individualInvoice = useInvoiceBuilder();

  // Group Invoice State
  const [groupPayerId, setGroupPayerId] = useState<string>('');
  const [groupBeneficiaryId, setGroupBeneficiaryId] = useState<string>('');
  const [groupInvoiceDate, setGroupInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const groupInvoice = useInvoiceBuilder();

  // Commission report state
  const [reportAdvisor, setReportAdvisor] = useState('');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportStatus, setReportStatus] = useState('Liquidado');

  // Image Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<'individual' | 'group' | null>(null);
  
  // Refs for capture
  const captureRef = useRef<HTMLDivElement>(null);

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
    individualInvoice.clearItems();
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
    
    const additionalCost = individualInvoice.items.reduce((acc, item) => acc + item.value, 0);
    return servicesCost + additionalCost;
  }, [clientForInvoice, individualInvoice.items, config.servicesCatalog]);

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
      const itemsCost = groupInvoice.items.reduce((acc, item) => acc + item.value, 0);
      
      return payerServicesCost + itemsCost;
  }, [groupPayerClient, groupInvoice.items, config.servicesCatalog]);

  // --- Handlers ---

  // Group Invoice Handlers
  const handleAddBeneficiaryToGroup = () => {
      if (!groupBeneficiaryId) return;
      
      const beneficiary = clients.find(c => c.id === groupBeneficiaryId);
      if (!beneficiary) return;

      const newItems: InvoiceItem[] = [];
      
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

      groupInvoice.addItemsBulk(newItems);
      setGroupBeneficiaryId(''); // Reset selector
  };

  // Image Gen
  const handleOpenInvoicePreview = async (type: 'individual' | 'group') => {
    setActivePreviewType(type);
    setCaptureTarget(type);
    setIsGenerating(true);
    setIsPreviewModalOpen(true);
    setGeneratedImage(null);
  };

  useEffect(() => {
    if (isGenerating && captureTarget && captureRef.current) {
      const generateImage = async () => {
        try {
          // 1. Wait for fonts to be ready
          await document.fonts.ready;
          
          // 2. Wait for all images inside the capture container to load
          const images = Array.from(captureRef.current?.querySelectorAll('img') || []);
          await Promise.all(images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }));

          // 3. Small delay to ensure React has painted the DOM
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

          // 4. Capture the image
          const dataUrl = await htmlToImage.toPng(captureRef.current!, { 
            quality: 1, 
            pixelRatio: 2, 
            backgroundColor: '#ffffff' 
          });
          
          setGeneratedImage(dataUrl);
        } catch(error) {
          console.error("Error generating image:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar la imagen de la factura.' });
          setIsPreviewModalOpen(false);
        } finally {
          setIsGenerating(false);
          setCaptureTarget(null);
        }
      };
      
      generateImage();
    }
  }, [isGenerating, captureTarget, toast]);

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

  const handleExportCSV = () => {
    if (commissionReportData.length === 0) {
      toast({ variant: 'destructive', title: 'Sin Datos', description: 'No hay datos para exportar.' });
      return;
    }

    const csvData = commissionReportData.map(client => {
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
                  commissionDisplay = "Valor Fijo (Estimado)";
              }
          }
      }

      return {
        'Asesor': reportAdvisor,
        'Periodo': `${new Date(reportYear, reportMonth).toLocaleString('es-CO', { month: 'long' })} ${reportYear}`,
        'Cliente': client.fullName,
        'Costo Total Trámites': servicesCost,
        'Tipo de Comisión': commissionDisplay,
        'Valor a Pagar': commission,
        'Estado': reportStatus
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Comisiones_${reportAdvisor}_${reportMonth + 1}_${reportYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: 'Exportación Exitosa', description: 'El archivo CSV se ha descargado correctamente.' });
  };

  return (
    <PageLayout 
        title="Generador de Documentos" 
        subtitle="Crea cuentas de cobro y reportes de comisiones."
        onBackRoute="/app/dashboard"
    >
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
                            <div className='w-full md:w-48'>
                                <label className="text-sm font-medium mb-1 block">Fecha de Facturación</label>
                                <Input 
                                    type="date" 
                                    value={individualInvoiceDate} 
                                    onChange={(e) => setIndividualInvoiceDate(e.target.value)} 
                                />
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
                                        <Input aria-label="Descripción" placeholder="Descripción (ej: Descuento Combo)" value={individualInvoice.newItem.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => individualInvoice.setNewItem(prev => ({...prev, description: e.target.value}))}/>
                                        <Input aria-label="Valor" placeholder="Valor ($ -5000 para descuentos)" value={individualInvoice.newItem.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => individualInvoice.setNewItem(prev => ({...prev, value: formatCurrency(parseCurrency(e.target.value))}))}/>
                                        <Button onClick={individualInvoice.addItem} variant="secondary">Añadir</Button>
                                    </div>
                                    {individualInvoice.items.length > 0 && (
                                        <div className="border rounded-md overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted text-muted-foreground">
                                                    <tr><th className="p-2">Descripción</th><th className="p-2 text-right">Valor</th><th className="p-2 w-10"></th></tr>
                                                </thead>
                                                <tbody>
                                                    {individualInvoice.items.map(item => (
                                                        <tr key={item.id} className="border-t hover:bg-muted/20">
                                                            <td className="p-2">{item.description}</td>
                                                            <td className={`p-2 text-right ${item.value < 0 ? 'text-red-500 font-medium' : ''}`}>{item.value.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                                                            <td className="p-2 text-center">
                                                                <button onClick={() => individualInvoice.removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
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
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="space-y-2 flex-grow w-full">
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
                                <div className='w-full md:w-48 space-y-2'>
                                    <label className="text-sm font-bold text-primary uppercase tracking-wider">Fecha</label>
                                    <Input 
                                        type="date" 
                                        value={groupInvoiceDate} 
                                        onChange={(e) => setGroupInvoiceDate(e.target.value)} 
                                        className="h-12 text-lg"
                                    />
                                </div>
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
                                            <Badge variant="outline">{groupInvoice.items.length} ítems extra</Badge>
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
                                                    {groupInvoice.items.map((item) => (
                                                        <tr key={item.id} className="border-b hover:bg-muted/20">
                                                            <td className="p-3">{item.description}</td>
                                                            <td className={`p-3 text-right font-mono ${item.value < 0 ? 'text-red-600' : ''}`}>
                                                                {formatCurrency(item.value)}
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <button onClick={() => groupInvoice.removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
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
                                                                value={groupInvoice.newItem.description} 
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => groupInvoice.setNewItem(prev => ({...prev, description: e.target.value}))} 
                                                                className="h-8 text-sm"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <Input 
                                                                placeholder="$0" 
                                                                value={groupInvoice.newItem.value} 
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => groupInvoice.setNewItem(prev => ({...prev, value: formatCurrency(parseCurrency(e.target.value))}))} 
                                                                className="h-8 text-sm text-right"
                                                            />
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={groupInvoice.addItem}>
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
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button className="w-full sm:w-1/2" onClick={handleGenerateCommissionReport}><Printer className="mr-2 h-4 w-4"/>Imprimir Reporte</Button>
                                <Button className="w-full sm:w-1/2" variant="secondary" onClick={handleExportCSV}><DownloadCloud className="mr-2 h-4 w-4"/>Exportar a Excel (CSV)</Button>
                            </div>

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
        <Dialog open={isPreviewModalOpen} onOpenChange={(open) => {
            if (!open) {
                setIsPreviewModalOpen(false);
                setCaptureTarget(null);
                setIsGenerating(false);
            }
        }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Previsualización de Cuenta de Cobro</DialogTitle>
                </DialogHeader>
                <div className="p-4 flex justify-center items-center bg-gray-100 rounded-md my-4 relative overflow-hidden">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                            <p className="text-sm text-muted-foreground animate-pulse">Renderizando documento de alta calidad...</p>
                            
                            {/* Hidden container for capture, but in the DOM and visible to html-to-image */}
                            <div className="absolute top-0 left-0 opacity-0 pointer-events-none" style={{ zIndex: -1 }}>
                                <div ref={captureRef} style={{ width: '816px' }}>
                                    {captureTarget === 'individual' && clientForInvoice && (
                                        <InvoicePreview
                                            client={clientForInvoice}
                                            additionalItems={individualInvoice.items}
                                            totalAmount={totalInvoiceAmount}
                                            invoiceDate={new Date(individualInvoiceDate + 'T12:00:00')}
                                        />
                                    )}
                                    {captureTarget === 'group' && groupPayerClient && (
                                        <InvoicePreview
                                            client={groupPayerClient}
                                            additionalItems={groupInvoice.items}
                                            totalAmount={groupTotalAmount}
                                            invoiceDate={new Date(groupInvoiceDate + 'T12:00:00')}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : generatedImage ? (
                        <img src={generatedImage} alt="Cuenta de Cobro" className="w-full h-auto shadow-lg"/>
                    ) : (
                        <div className="h-96 flex items-center justify-center">
                            <p className="text-muted-foreground">No se pudo generar la imagen.</p>
                        </div>
                    )}
                </div>
                <DialogFooter className="sm:justify-between gap-2">
                    <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>Cerrar</Button>
                    <div className="flex gap-2">
                        <Button onClick={handleShare} disabled={!generatedImage || isGenerating}>
                            <Share2 className="mr-2 h-4 w-4" /> Compartir
                        </Button>
                        <Button onClick={handleDownload} disabled={!generatedImage || isGenerating}>
                            <Download className="mr-2 h-4 w-4" /> Descargar
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </PageLayout>
  );
}