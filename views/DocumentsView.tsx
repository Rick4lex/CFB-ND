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
    // Logic upgraded to prioritize the snapshot saved in the client record
    return commissionReportData.reduce((total, client) => {
      // 1. Try to use the frozen snapshot first
      if (client.advisorCommissionAmount !== undefined && client.advisorCommissionAmount !== null) {
          return total + client.advisorCommissionAmount;
      }

      // 2. Fallback: Calculate dynamically for legacy clients (before the update)
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
          console.error("Share failed", e);
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
                <div ref={imageRef} style={{ width: '816px' /* US Letter width in pixels at 96 DPI */ }}>
                    <InvoicePreview
                        client={clientForInvoice}
                        additionalItems={additionalInvoiceItems}
                        totalAmount={totalInvoiceAmount}
                    />
                </div>
            )}
        </div>
      
        <section className="max-w-5xl mx-auto">
            <Accordion className="w-full space-y-4">
            <AccordionItem value="invoice-generator">
                <AccordionTrigger className="bg-card p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-lg">Cuenta de Cobro por Cliente</span>
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
                        <Button className="w-full md:w-auto" onClick={handleOpenInvoicePreview} disabled={!clientForInvoice || isGenerating}>
                            {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Generando...</> : <><Eye className="mr-2 h-4 w-4"/>Previsualizar Cuenta</>}
                        </Button>
                    </div>

                    {clientForInvoice && (
                    <>
                       <div className="rounded-lg border overflow-hidden bg-muted/5">
                          <div className="scale-[0.8] origin-top transform -mb-[20%]">
                             <InvoicePreview
                                client={clientForInvoice}
                                additionalItems={additionalInvoiceItems}
                                totalAmount={totalInvoiceAmount}
                             />
                          </div>
                       </div>
                       
                        <Card>
                            <CardHeader><CardTitle className="text-base">Ítems Adicionales</CardTitle></CardHeader>
                            <CardContent>
                                    <div className="flex gap-2 mb-4">
                                    <Input placeholder="Descripción ítem adicional" value={newAdditionalItem.description} onChange={(e: any) => setNewAdditionalItem(prev => ({...prev, description: e.target.value}))}/>
                                    <Input type="number" placeholder="Valor" value={newAdditionalItem.value} onChange={(e: any) => setNewAdditionalItem(prev => ({...prev, value: e.target.value}))}/>
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
                                                        <td className="p-2 text-right">{item.value.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
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
                            <Input type="number" value={reportYear} onChange={(e: any) => setReportYear(Number(e.target.value))} placeholder="Año"/>
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
                                                    const servicesCost = client.contractedServices?.reduce((acc, serviceName) => {
                                                    const service = proceduralServices.find(s => s.name === serviceName);
                                                    return acc + (service?.price || 0);
                                                    }, 0) || 0;
                                                    
                                                    let commission = 0;
                                                    let commissionDisplay = "N/A";

                                                    // 1. Check for Snapshot (Preferred)
                                                    if (client.advisorCommissionAmount !== undefined && client.advisorCommissionAmount !== null) {
                                                        commission = client.advisorCommissionAmount;
                                                        if (client.advisorCommissionPercentage) {
                                                            commissionDisplay = `${client.advisorCommissionPercentage}% (Guardado)`;
                                                        } else {
                                                            commissionDisplay = "Valor Guardado";
                                                        }
                                                    } 
                                                    // 2. Fallback Calculation
                                                    else {
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