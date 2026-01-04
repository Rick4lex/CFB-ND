
import { useState, useRef, type ChangeEvent } from 'react';
import { useAppStore } from '../lib/store';
import { PageLayout } from '../components/layout/Layout';
import { 
    Tabs, TabsList, TabsTrigger, Button, Input, Switch, ScrollArea, 
    Card, CardContent, CardHeader, CardTitle, CardDescription, Separator
} from '../components/ui/Shared';
import { Save, Download, Upload, PlusCircle, Trash2, Database, LifeBuoy, ShieldAlert } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export const ConfigView = () => {
    const { config, setConfig } = useAppStore();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState('services');

    // Local state for edits
    const [tempServices, setTempServices] = useState(config.servicesCatalog);

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
        setTempServices([{ id: newId, name: 'Nuevo Servicio', price: 0, active: true }, ...tempServices]);
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
            }
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

                if (window.confirm("¿Restaurar todos los datos? Se borrará la información actual y se reiniciará la plataforma.")) {
                    const { setClients, setAdvisors, setEntities, setConfig, setCotizadorProfiles, setBrandingElements } = useAppStore.getState();
                    if (incomingData.clients) setClients(incomingData.clients);
                    if (incomingData.advisors) setAdvisors(incomingData.advisors);
                    if (incomingData.entities) setEntities(incomingData.entities);
                    if (incomingData.config) setConfig(incomingData.config);
                    if (incomingData.cotizadorProfiles) setCotizadorProfiles(incomingData.cotizadorProfiles);
                    if (incomingData.brandingElements) setBrandingElements(incomingData.brandingElements);
                    
                    toast({ title: "Datos Restaurados", description: "Reiniciando plataforma..." });
                    setTimeout(() => window.location.reload(), 1000);
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "El archivo no es compatible o está dañado." });
            }
        };
        reader.readAsText(file);
    };

    return (
        <PageLayout 
            title="Configuración Global" 
            subtitle="Gestiona el catálogo de servicios y la integridad de tus datos."
            onBackRoute="/app/dashboard"
        >
            <div className="max-w-4xl mx-auto w-full">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <TabsList className="bg-muted p-1 rounded-2xl h-14 w-full sm:w-auto">
                        <TabsTrigger value="services" className="rounded-xl px-8 h-12">
                            <LifeBuoy className="w-4 h-4 mr-2" /> Servicios
                        </TabsTrigger>
                        <TabsTrigger value="backup" className="rounded-xl px-8 h-12">
                            <Database className="w-4 h-4 mr-2" /> Sistema y Backup
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === 'services' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                            <Card className="border-primary/20 shadow-xl overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 bg-primary/5">
                                    <div>
                                        <CardTitle className="text-2xl">Catálogo de Servicios</CardTitle>
                                        <CardDescription>Define los servicios disponibles y sus precios base.</CardDescription>
                                    </div>
                                    <Button onClick={handleAddService} size="sm" className="rounded-full shadow-lg">
                                        <PlusCircle className="mr-2 h-4 w-4"/> Nuevo Servicio
                                    </Button>
                                </CardHeader>
                                <Separator />
                                <CardContent className="p-0">
                                    <ScrollArea className="h-[500px]">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                                            {tempServices.map((service, index) => (
                                                <div key={service.id} className="group p-5 rounded-3xl border bg-card/50 hover:border-primary/40 hover:shadow-md transition-all relative overflow-hidden">
                                                    <div className="flex items-start justify-between gap-4 mb-4">
                                                        <div className="flex-1">
                                                            <Input 
                                                                value={service.name} 
                                                                onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                                                                className="h-10 border-transparent bg-transparent hover:bg-muted/50 focus:bg-background transition-colors font-bold text-lg p-0 px-2"
                                                            />
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" 
                                                            onClick={() => setTempServices(tempServices.filter((_, i) => i !== index))}
                                                        >
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 bg-muted/40 rounded-2xl px-4 py-2 flex-1">
                                                            <span className="text-sm font-black text-muted-foreground opacity-50">$</span>
                                                            <Input 
                                                                type="number"
                                                                value={service.price} 
                                                                onChange={(e) => handleServiceChange(index, 'price', Number(e.target.value))}
                                                                className="h-8 border-none bg-transparent p-0 text-lg font-mono focus-visible:ring-0"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                                                                {service.active ? 'Activo' : 'Inactivo'}
                                                            </span>
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
                                </CardContent>
                                <div className="p-6 bg-muted/30 border-t flex justify-end">
                                    <Button onClick={handleSaveServices} className="px-10 h-12 rounded-2xl shadow-xl shadow-primary/20 text-lg">
                                        <Save className="mr-2 h-5 w-5"/> Guardar Todo
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-500">
                            <Card className="border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner mb-4">
                                        <Download className="w-10 h-10" />
                                    </div>
                                    <CardTitle>Exportar Datos</CardTitle>
                                    <CardDescription>Crea un punto de restauración con toda la información actual.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <p className="text-sm text-center text-muted-foreground">
                                        Se generará un archivo .JSON compatible con la plataforma CFBND que incluye clientes, trámites y configuraciones.
                                    </p>
                                    <Button onClick={handleBackup} className="w-full h-14 rounded-2xl text-lg" variant="outline">
                                        Descargar JSON de Respaldo
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-blue-500/20 shadow-lg hover:shadow-xl transition-shadow relative">
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner mb-4">
                                        <Upload className="w-10 h-10" />
                                    </div>
                                    <CardTitle>Restaurar Datos</CardTitle>
                                    <CardDescription>Carga una copia de seguridad previa.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="flex items-center gap-2 p-3 bg-destructive/5 rounded-xl border border-destructive/20 text-destructive text-xs mb-2">
                                        <ShieldAlert className="w-5 h-5 shrink-0" />
                                        <p className="font-semibold uppercase tracking-tighter">Precaución: Esta acción es irreversible y sobrescribirá la base de datos actual.</p>
                                    </div>
                                    <Button variant="secondary" className="w-full h-14 rounded-2xl text-lg" onClick={() => fileInputRef.current?.click()}>
                                        Seleccionar Archivo JSON
                                    </Button>
                                    <input type="file" ref={fileInputRef} onChange={handleRestore} accept=".json" className="hidden" />
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </Tabs>
            </div>
        </PageLayout>
    );
};
