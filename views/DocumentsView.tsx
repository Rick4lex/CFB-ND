import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as htmlToImage from 'html-to-image';
import { useLocation } from 'react-router-dom';
import { Loader2, Eye, Printer, Download, FileText, DollarSign, Share2 } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { PageLayout } from '../components/layout/Layout';
import { InvoicePreview } from '../components/features/InvoicePreview';
import { 
    Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
    Input, Accordion, AccordionItem, AccordionTrigger, AccordionContent,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../components/ui/Shared';
import { proceduralServices } from '../lib/constants';
import { useToast } from '../hooks/use-toast';

interface AdditionalItem {
  id: number;
  description: string;
  value: number;
}

export const DocumentsView = () => {
  const location = useLocation();
  const { toast } = useToast();
  const { clients, advisors } = useAppStore();
  
  // Invoice state
  const [selectedInvoiceClient, setSelectedInvoiceClient] = useState<string>('');
  const [additionalInvoiceItems, setAdditionalInvoiceItems] = useState<AdditionalItem[]>([]);
  const [newAdditionalItem, setNewAdditionalItem] = useState({ description: '', value: '' });

  // Commission report state
  const [reportAdvisor, setReportAdvisor] = useState('');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportStatus, setReportStatus] = useState('Liquidado');

  // Image Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (location.state && location.state.clientId) {
          setSelectedInvoiceClient(location.state.clientId);
      }
  }, [location.state]);
  
  useEffect(() => {
    setAdditionalInvoiceItems([]);
  }, [selectedInvoiceClient]);

  const clientForInvoice = useMemo(() => {
    return clients.find(c => c.id === selectedInvoiceClient);
  }, [selectedInvoiceClient, clients]);

  const totalInvoiceAmount = useMemo(() => {
    const servicesCost = clientForInvoice?.contractedServices?.reduce((acc, serviceName) => {
      const service = proceduralServices.find(s => s.name === serviceName);
      return acc + (service?.price || 0);
    }, 0) || 0;
    const additionalCost = additionalInvoiceItems.reduce((acc, item) => acc + item.value, 0);
    return servicesCost + additionalCost;
  }, [clientForInvoice, additionalInvoiceItems]);

  const commissionReportData = useMemo(() => {
    if (!reportAdvisor) return [];
    return clients.filter(client => {
      const entryDate = new Date(client.entryDate);
      return client.assignedAdvisor === reportAdvisor &&
             entryDate.getMonth() === reportMonth &&
             entryDate.getFullYear() === reportYear;
    });
  }, [clients, reportAdvisor, reportMonth, reportYear]);

  const totalCommission = useMemo(() => {
    return commissionReportData.reduce((total, client) => {
      if (client.advisorCommissionAmount !== undefined && client.advisorCommissionAmount !== null) {
          return total + client.advisorCommissionAmount;
      }
      const advisorDetails = advisors.find(a => a.name === reportAdvisor);
      if (!advisorDetails) return total;

      const servicesCost = client.contractedServices?.reduce((acc, serviceName) => {
        const service = proceduralServices.find(s => s.name === serviceName);
        return acc + (service?.price || 0);
      }, 0) || 0;
      
      if (advisorDetails.commissionType === 'percentage') {
        const commission = servicesCost * (advisorDetails.commissionValue / 100);
        return total + commission;
      }
      
      if (advisorDetails.commissionType === 'fixed') {
        const affiliationServiceCount = client.contractedServices?.filter(s => s.toLowerCase().includes('afiliación') || s.toLowerCase().includes('liquidación')).length || 0;
        const commission = affiliationServiceCount * advisorDetails.commissionValue;
        return total + commission;
      }
      return total;
    }, 0);
  }, [commissionReportData, advisors, reportAdvisor]);


  const handleAddAdditionalItem = () => {
    if (newAdditionalItem.description && newAdditionalItem.value) {
      setAdditionalInvoiceItems(prev => [...prev, {
        id: Date.now(),
        description: newAdditionalItem.description,
        value: parseFloat(newAdditionalItem.value),
      }]);
      setNewAdditionalItem({ description: '', value: '' });
    }
  };

  const handleOpenInvoicePreview = async () => {
    if (!imageRef.current) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo encontrar el componente de la factura.' });
        return;
    }
    setIsGenerating(true);
    setIsPreviewModalOpen(true);
    setGeneratedImage(null);
    try {
        const dataUrl = await htmlToImage.toPng(imageRef.current, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' });
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
            await navigator.share({ title: 'Cuenta de Cobro', text: `Cuenta de cobro para ${clientForInvoice?.fullName}.`, files: [file] });
        } else {
           handleDownload();
        }
      } catch (e) {
          handleDownload();
      }
  };

  const handleDownload = () => {
      if (!generatedImage) return;
      const link = document.createElement('a');
      link.download = `cuenta-de-cobro-${clientForInvoice?.fullName.replace(/\s+/g, '_') || 'cliente'}.png`;
      link.href = generatedImage;
      link.click();
  };
  
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
        </div>
      
        <section className="max-w-6xl mx-auto px-1 md:px-0">
            <Accordion className="w-full space-y-4" defaultValue="invoice-generator">
            <AccordionItem value="invoice-generator">
                <AccordionTrigger className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors"><FileText className="h-6 w-6 text-primary" /></div>
                    <div className="text-left">
                        <span className="font-bold text-lg block">Cuenta de Cobro por Cliente</span>
                        <span className="text-xs text-muted-foreground font-normal">Genera PDFs o imágenes para enviar por WhatsApp</span>
                    </div>
                </div>
                </AccordionTrigger>
                <AccordionContent>
                <div className="p-4 md:p-8 bg-card rounded-xl border mt-2 shadow-sm animate-in slide-in-from-top-4">
                    <div className="max-w-3xl mx-auto space-y-8">
                        <div className='flex flex-col md:flex-row gap-4 items-end bg-muted/30 p-4 rounded-xl border'>
                            <div className='flex-grow w-full'>
                                <label className="text-sm font-bold text-muted-foreground mb-1.5 block uppercase tracking-wide text-xs">Seleccionar Cliente</label>
                                <Select value={selectedInvoiceClient} onValueChange={setSelectedInvoiceClient}>
                                    <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Busca un cliente..." /></SelectTrigger>
                                    <SelectContent>
                                        {clients.map(client => (
                                        <SelectItem key={client.id} value={client.id}>{client.fullName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full md:w-auto h-12 px-6 shadow-lg" onClick={handleOpenInvoicePreview} disabled={!clientForInvoice || isGenerating}>
                                {isGenerating ? <><Loader2 className="mr-2 h-5 w-5 animate-spin"/>Generando...</> : <><Eye className="mr-2 h-5 w-5"/>Previsualizar</>}
                            </Button>
                        </div>

                        {clientForInvoice && (
                        <>
                           <div className="rounded-xl border-4 border-muted overflow-hidden bg-gray-50 shadow-inner">
                              <div className="scale-[0.6] md:scale-[0.75] origin-top transform -mb-[40%] md:-mb-[25%] opacity-90 hover:opacity-100 transition-opacity">
                                 <InvoicePreview
                                    client={clientForInvoice}
                                    additionalItems={additionalInvoiceItems}
                                    totalAmount={totalInvoiceAmount}
                                 />
                              </div>
                           </div>
                           
                            <Card className="border-dashed border-2 bg-muted/10">
                                <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Ítems Adicionales (Opcional)</CardTitle></CardHeader>
                                <CardContent>
                                        <div className="flex gap-2 mb-4">
                                        <Input placeholder="Descripción ítem adicional" value={newAdditionalItem.description} onChange={(e: any) => setNewAdditionalItem(prev => ({...prev, description: e.target.value}))}/>
                                        <Input type="number" className="w-32" placeholder="Valor" value={newAdditionalItem.value} onChange={(e: any) => setNewAdditionalItem(prev => ({...prev, value: e.target.value}))}/>
                                        <Button onClick={handleAddAdditionalItem} variant="secondary">Añadir</Button>
                                    </div>
                                    {additionalInvoiceItems.length > 0 && (
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted text-muted-foreground font-medium">
                                                    <tr><th className="p-3 font-normal">Descripción</th><th className="p-3 text-right font-normal">Valor</th></tr>
                                                </thead>
                                                <tbody>
                                                    {additionalInvoiceItems.map(item => (
                                                        <tr key={item.id} className="border-t bg-card">
                                                            <td className="p-3">{item.description}</td>
                                                            <td className="p-3 text-right font-mono">{item.value.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
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
                </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="commission-generator">
                <AccordionTrigger className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors"><DollarSign className="h-6 w-6 text-green-600" /></div>
                    <div className="text-left">
                        <span className="font-bold text-lg block">Reporte de Comisiones</span>
                        <span className="text-xs text-muted-foreground font-normal">Calcula pagos mensuales para tus asesores</span>
                    </div>
                </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="p-4 md:p-8 bg-card rounded-xl border mt-2 shadow-sm animate-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Select onValueChange={setReportAdvisor}><SelectTrigger><SelectValue placeholder="Selecciona un asesor..." /></SelectTrigger><SelectContent>{advisors.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent></Select>
                            <Select onValueChange={(v: any) => setReportMonth(Number(v))} defaultValue={String(reportMonth)}><SelectTrigger><SelectValue placeholder="Mes..." /></SelectTrigger><SelectContent>{Array.from({length: 12}, (_, i) => <SelectItem key={i} value={String(i)}>{new Date(0, i).toLocaleString('es-CO', { month: 'long' })}</SelectItem>)}</SelectContent></Select>
                            <Input type="number" value={reportYear} onChange={(e: any) => setReportYear(Number(e.target.value))} placeholder="Año"/>
                            <Select onValueChange={setReportStatus} defaultValue={reportStatus}><SelectTrigger><SelectValue placeholder="Estado..." /></SelectTrigger><SelectContent><SelectItem value="Liquidado">Liquidado</SelectItem><SelectItem value="Pendiente">Pendiente</SelectItem></SelectContent></Select>
                        </div>
                        <Button className="w-full h-12 text-lg shadow-sm" variant="outline" onClick={handleGenerateCommissionReport}><Printer className="mr-2 h-5 w-5"/>Imprimir Reporte</Button>

                        {commissionReportData.length > 0 && (
                            <div id="printable-commission" className="mt-8">
                                <Card className="border-2">
                                    <CardHeader className="bg-muted/30 border-b">
                                        <CardTitle>Reporte de Comisión</CardTitle>
                                        <CardDescription className="flex gap-4 mt-2">
                                            <span className="font-bold text-foreground">Asesor: {reportAdvisor}</span>
                                            <span>|</span>
                                            <span>Periodo: {new Date(reportYear, reportMonth).toLocaleString('es-CO', { month: 'long', year: 'numeric' })}</span>
                                            <span>|</span>
                                            <span className="bg-green-100 text-green-800 px-2 rounded-full text-xs py-0.5">{reportStatus}</span>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50"><tr className="text-left border-b"><th className="p-4 font-semibold text-muted-foreground">Cliente</th><th className="p-4 font-semibold text-muted-foreground">Costo Trámite</th><th className="p-4 font-semibold text-muted-foreground">Detalle Comisión</th><th className="p-4 text-right font-semibold text-muted-foreground">Valor Comisión</th></tr></thead>
                                            <tbody>
                                                {commissionReportData.map(client => {
                                                    const servicesCost = client.contractedServices?.reduce((acc, serviceName) => {
                                                    const service = proceduralServices.find(s => s.name === serviceName);
                                                    return acc + (service?.price || 0);
                                                    }, 0) || 0;
                                                    
                                                    let commission = 0;
                                                    let commissionDisplay = "N/A";

                                                    if (client.advisorCommissionAmount !== undefined && client.advisorCommissionAmount !== null) {
                                                        commission = client.advisorCommissionAmount;
                                                        if (client.advisorCommissionPercentage) {
                                                            commissionDisplay = `${client.advisorCommissionPercentage}% (Guardado)`;
                                                        } else {
                                                            commissionDisplay = "Valor Guardado";
                                                        }
                                                    } else {
                                                        const advisorDetails = advisors.find(a => a.name === client.assignedAdvisor);
                                                        if(advisorDetails){
                                                            if(advisorDetails.commissionType === 'percentage'){
                                                                commission = servicesCost * (advisorDetails.commissionValue / 100);
                                                                commissionDisplay = `${advisorDetails.commissionValue}% (Dinámico)`;
                                                            } else {
                                                                const affiliationServiceCount = client.contractedServices?.filter(s => s.toLowerCase().includes('afiliación') || s.toLowerCase().includes('liquidación')).length || 0;
                                                                commission = affiliationServiceCount * advisorDetails.commissionValue;
                                                                commissionDisplay = `${affiliationServiceCount} serv. x ${advisorDetails.commissionValue.toLocaleString('es-CO', {style:'currency', currency: 'COP'})}`;
                                                            }
                                                        }
                                                    }

                                                    return (
                                                        <tr key={client.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                                            <td className="p-4 font-medium">{client.fullName}</td>
                                                            <td className="p-4 text-muted-foreground">{servicesCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                                                            <td className="p-4 text-xs text-muted-foreground"><span className="bg-muted px-2 py-1 rounded">{commissionDisplay}</span></td>
                                                            <td className="p-4 text-right font-bold text-green-600">{commission.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                    <CardFooter className="flex justify-between font-bold text-xl bg-muted/20 p-6 border-t">
                                        <p>Total a Pagar:</p>
                                        <p className="text-primary">{totalCommission.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>
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
                <div className="p-8 flex justify-center items-center bg-gray-100 rounded-xl border my-4 shadow-inner min-h-[400px]">
                    {generatedImage ? (
                        <img src={generatedImage} alt="Cuenta de Cobro" className="w-full h-auto shadow-2xl rounded-sm max-w-[500px]"/>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                            <p className="text-muted-foreground">Generando imagen...</p>
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