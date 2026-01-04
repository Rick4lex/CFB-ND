
import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useAppStore } from '../../lib/store';
import { 
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
    Tabs, TabsList, TabsTrigger, Button, Input, Switch, ScrollArea, 
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Separator
} from '../ui/Shared';
import { Save, Download, Upload, PlusCircle, Trash2, X, Settings2, Database, LifeBuoy } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export function GlobalConfigSidebar({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
    const { config, setConfig } = useAppStore();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState('services');

    // Local state for edits
    const [tempServices, setTempServices] = useState(config.servicesCatalog);

    useEffect(() => {
        if(isOpen) {
            setTempServices(config.servicesCatalog);
        }
    }, [isOpen, config]);

    const handleSaveServices = () => {
        setConfig(prev => ({ ...prev, servicesCatalog: tempServices }));
        toast({ title: "Catálogo de Servicios Actualizado", description: "Los cambios se han guardado exitosamente." });
    };

    const handleServiceChange = (index: number, field: string, value: any) => {
        const updated = [...tempServices];
        updated[index] = { ...updated[index], [field]: value };
        setTempServices(updated);
    };

    const handleAddService = () => {
        const newId = `svc_${Date.now()}`;
        setTempServices([...tempServices, { id: newId, name: 'Nuevo Servicio', price: 0, active: true }]);
    };

    const handleBackup = () => {
        const state = useAppStore.getState();
        const data = {
            metadata: {
                version: "2.1",
                exportedAt: new Date().toISOString(),
                app: "CFBND"
            },
            data: {
                clients: state.clients,
                advisors: state.advisors,
                entities: state.entities,
                config: state.config,
                cotizadorProfiles: state.cotizadorProfiles,
                brandingElements: state.brandingElements
            },
            theme: localStorage.getItem('cfbnd-theme') || 'light'
        };

        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_cfbnd_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: "Copia de Seguridad Generada", description: "Archivo descargado correctamente." });
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Error", description: "No se pudo generar el respaldo." });
        }
    };

    const handleRestore = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);
                const incomingData = parsed.data || parsed;
                
                if (!Array.isArray(incomingData.clients)) throw new Error("Archivo inválido.");

                if (window.confirm("¿Restaurar todos los datos? Se borrará la información actual.")) {
                    const { setClients, setAdvisors, setEntities, setConfig, setCotizadorProfiles, setBrandingElements } = useAppStore.getState();
                    if (incomingData.clients) setClients(incomingData.clients);
                    if (incomingData.advisors) setAdvisors(incomingData.advisors);
                    if (incomingData.entities) setEntities(incomingData.entities);
                    if (incomingData.config) setConfig(incomingData.config);
                    if (incomingData.cotizadorProfiles) setCotizadorProfiles(incomingData.cotizadorProfiles);
                    if (incomingData.brandingElements) setBrandingElements(incomingData.brandingElements);
                    
                    toast({ title: "Datos Restaurados", description: "Reiniciando plataforma..." });
                    setTimeout(() => window.location.reload(), 800);
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "El archivo no es compatible." });
            }
        };
        reader.readAsText(file);
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="flex flex-col h-full p-0 overflow-hidden sm:w-[500px]">
                <div className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-2">
                        <SheetHeader className="space-y-0">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                    <Settings2 className="w-5 h-5" />
                                </div>
                                <SheetTitle>Configuración del Sistema</SheetTitle>
                            </div>
                            <SheetDescription>Gestiona el núcleo de la plataforma CFBND.</SheetDescription>
                        </SheetHeader>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full h-8 w-8">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
                            <TabsTrigger value="services" className="rounded-lg data-[state=active]:shadow-sm">
                                <LifeBuoy className="w-3.5 h-3.5 mr-2" /> Servicios
                            </TabsTrigger>
                            <TabsTrigger value="backup" className="rounded-lg data-[state=active]:shadow-sm">
                                <Database className="w-3.5 h-3.5 mr-2" /> Backup
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <Separator />

                <div className="flex-1 overflow-hidden flex flex-col">
                    {activeTab === 'services' && (
                        <div className="flex flex-col h-full">
                            <div className="p-6 flex justify-between items-center bg-muted/20">
                                <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Precios y Catálogo</div>
                                <Button size="sm" variant="outline" onClick={handleAddService} className="h-8 rounded-full border-primary/20 hover:bg-primary/10">
                                    <PlusCircle className="mr-2 h-3.5 w-3.5"/> Nuevo
                                </Button>
                            </div>
                            <ScrollArea className="flex-1 px-6">
                                <div className="space-y-4 py-2">
                                    {tempServices.map((service, index) => (
                                        <div key={service.id} className="group p-4 rounded-2xl border bg-card/50 hover:border-primary/30 transition-all">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex-1">
                                                    <Input 
                                                        value={service.name} 
                                                        onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                                                        className="h-9 border-transparent bg-transparent hover:bg-muted/50 focus:bg-background transition-colors font-semibold"
                                                    />
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setTempServices(tempServices.filter((_, i) => i !== index))}>
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 flex-1">
                                                    <span className="text-xs font-bold text-muted-foreground">$</span>
                                                    <Input 
                                                        type="number"
                                                        value={service.price} 
                                                        onChange={(e) => handleServiceChange(index, 'price', Number(e.target.value))}
                                                        className="h-6 border-none bg-transparent p-0 text-sm font-mono focus-visible:ring-0"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{service.active ? 'Activo' : 'Inactivo'}</span>
                                                    <Switch 
                                                        checked={service.active} 
                                                        onCheckedChange={(checked) => handleServiceChange(index, 'active', checked)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <div className="p-6 border-t bg-card/80 backdrop-blur-md">
                                <Button onClick={handleSaveServices} className="w-full h-12 rounded-xl shadow-lg shadow-primary/20">
                                    <Save className="mr-2 h-4 w-4"/> Guardar Cambios
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="p-6 space-y-8 flex flex-col items-center justify-center h-full text-center">
                            <div className="space-y-6 max-w-[320px]">
                                <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                    <Download className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold font-belanosima">Exportar Respaldo</h3>
                                    <p className="text-sm text-muted-foreground">Obtén un archivo JSON con toda la información de la plataforma (clientes, asesores, branding).</p>
                                </div>
                                <Button onClick={handleBackup} className="w-full h-12 rounded-xl" variant="outline">
                                    Descargar JSON
                                </Button>
                            </div>
                            
                            <div className="w-full flex items-center gap-4">
                                <div className="h-px bg-border flex-1"></div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">O</span>
                                <div className="h-px bg-border flex-1"></div>
                            </div>

                            <div className="space-y-6 max-w-[320px]">
                                <div className="mx-auto w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner">
                                    <Upload className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold font-belanosima">Restaurar Datos</h3>
                                    <p className="text-sm text-muted-foreground">Carga un archivo de respaldo. <span className="text-destructive font-bold">Esto sobrescribirá los datos actuales permanentemente.</span></p>
                                </div>
                                <div className="w-full">
                                    <Button variant="secondary" className="w-full h-12 rounded-xl" onClick={() => fileInputRef.current?.click()}>
                                        Importar Backup
                                    </Button>
                                    <input type="file" ref={fileInputRef} onChange={handleRestore} accept=".json" className="hidden" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
