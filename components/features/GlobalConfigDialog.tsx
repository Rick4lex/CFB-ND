
import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useAppStore } from '../../lib/store';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
    Tabs, TabsList, TabsTrigger, Button, Input, Switch, ScrollArea, 
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '../ui/Shared';
import { Save, Download, Upload, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export function GlobalConfigDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
    const { config, setConfig } = useAppStore();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState('services');

    // Local state for edits before saving
    const [tempServices, setTempServices] = useState(config.servicesCatalog);

    // Sync local state when modal opens or config changes externally
    useEffect(() => {
        if(isOpen) {
            setTempServices(config.servicesCatalog);
        }
    }, [isOpen, config]);

    const handleSaveServices = () => {
        setConfig(prev => ({ ...prev, servicesCatalog: tempServices }));
        toast({ title: "Catálogo de Servicios Actualizado", description: "Los cambios en precios y nombres se han guardado." });
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
        // OPTIMIZACIÓN: Leer directamente del estado de Zustand (Memoria)
        // Esto evita leer datos obsoletos o corruptos del localStorage si la persistencia asíncrona no ha terminado.
        const state = useAppStore.getState();
        
        const data = {
            metadata: {
                version: "2.0",
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
            toast({ title: "Copia de Seguridad Generada", description: "El archivo JSON se ha descargado correctamente." });
        } catch (e) {
            console.error("Error generando backup:", e);
            toast({ variant: "destructive", title: "Error", description: "No se pudo generar el archivo de respaldo." });
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
                
                // Soporte para estructura antigua (flat) y nueva (nested under 'data')
                const incomingData = parsed.data || parsed;
                
                // Validación básica de integridad
                if (!Array.isArray(incomingData.clients) || !Array.isArray(incomingData.advisors)) {
                    throw new Error("Formato de archivo inválido o corrupto.");
                }

                if (window.confirm("ADVERTENCIA CRÍTICA:\n\nEsta acción eliminará TODOS los datos actuales y los reemplazará con los del archivo de respaldo.\n\n¿Estás seguro de continuar?")) {
                    const { setClients, setAdvisors, setEntities, setConfig, setCotizadorProfiles, setBrandingElements } = useAppStore.getState();

                    // Actualización Atómica del Estado
                    if (incomingData.clients) setClients(incomingData.clients);
                    if (incomingData.advisors) setAdvisors(incomingData.advisors);
                    if (incomingData.entities) setEntities(incomingData.entities);
                    if (incomingData.config || incomingData.sys_config) setConfig(incomingData.config || incomingData.sys_config);
                    if (incomingData.cotizadorProfiles) setCotizadorProfiles(incomingData.cotizadorProfiles);
                    if (incomingData.brandingElements) setBrandingElements(incomingData.brandingElements);
                    
                    if (parsed.theme) localStorage.setItem('cfbnd-theme', parsed.theme);
                    
                    toast({ title: "Restauración Exitosa", description: "La base de datos ha sido actualizada." });
                    
                    // Pequeño delay para asegurar que Zustand persista antes de recargar
                    setTimeout(() => window.location.reload(), 500);
                }
            } catch (error) {
                console.error(error);
                toast({ variant: "destructive", title: "Error de Restauración", description: "El archivo está corrupto o no es compatible." });
            }
        };
        reader.readAsText(file);
        if (event.target) event.target.value = '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Configuración Global y Soporte</DialogTitle>
                    <DialogDescription>Administra el catálogo de servicios y las copias de seguridad.</DialogDescription>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2 shrink-0">
                        <TabsTrigger value="services">Catálogo de Servicios</TabsTrigger>
                        <TabsTrigger value="backup">Backup y Datos</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex-1 flex flex-col min-h-0 mt-4">
                        {/* Services Tab */}
                        {activeTab === 'services' && (
                            <div className="flex flex-col h-full space-y-4">
                                <div className="flex justify-between items-center shrink-0 px-1">
                                    <p className="text-sm text-muted-foreground">Gestiona los servicios disponibles para facturar.</p>
                                    <Button size="sm" variant="outline" onClick={handleAddService}><PlusCircle className="mr-2 h-4 w-4"/> Nuevo Servicio</Button>
                                </div>
                                <div className="flex-1 overflow-hidden border rounded-md relative">
                                     <div className="absolute inset-0 overflow-auto">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                                                <TableRow>
                                                    <TableHead className="w-[100px]">ID</TableHead>
                                                    <TableHead>Nombre del Servicio</TableHead>
                                                    <TableHead>Precio Base</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {tempServices.map((service, index) => (
                                                    <TableRow key={service.id}>
                                                        <TableCell className="font-mono text-xs text-muted-foreground">{service.id}</TableCell>
                                                        <TableCell>
                                                            <Input 
                                                                value={service.name} 
                                                                onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                                                                className="h-8"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input 
                                                                type="number"
                                                                value={service.price} 
                                                                onChange={(e) => handleServiceChange(index, 'price', Number(e.target.value))}
                                                                className="h-8 w-32"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Switch 
                                                                checked={service.active} 
                                                                onCheckedChange={(checked) => handleServiceChange(index, 'active', checked)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                                                                const updated = tempServices.filter((_, i) => i !== index);
                                                                setTempServices(updated);
                                                            }}>
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                     </div>
                                </div>
                                <div className="shrink-0 pt-2 flex justify-end">
                                    <Button onClick={handleSaveServices} className="w-full md:w-auto"><Save className="mr-2 h-4 w-4"/> Guardar Catálogo</Button>
                                </div>
                            </div>
                        )}

                        {/* Backup Tab */}
                        {activeTab === 'backup' && (
                            <ScrollArea className="h-full">
                                <div className="space-y-8 p-8 border rounded-md bg-card flex flex-col justify-center items-center text-center min-h-full">
                                    <div className="space-y-4 max-w-md">
                                        <div className="p-4 rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto">
                                            <Download className="h-8 w-8 text-primary"/>
                                        </div>
                                        <h3 className="text-xl font-bold">Exportar Copia de Seguridad</h3>
                                        <p className="text-muted-foreground">Descarga un archivo JSON con todos tus clientes, asesores y configuraciones. Guarda este archivo en un lugar seguro.</p>
                                        <Button onClick={handleBackup} className="w-full">Descargar Backup</Button>
                                    </div>
                                    
                                    <div className="w-full max-w-md border-t my-8"></div>

                                    <div className="space-y-4 max-w-md">
                                        <div className="p-4 rounded-full bg-blue-500/10 w-16 h-16 flex items-center justify-center mx-auto">
                                            <Upload className="h-8 w-8 text-blue-600"/>
                                        </div>
                                        <h3 className="text-xl font-bold">Restaurar Datos</h3>
                                        <p className="text-muted-foreground">Importa un archivo de respaldo previamente generado. <span className="text-destructive font-bold">Advertencia: Esto reemplazará tus datos actuales.</span></p>
                                        <div className="relative">
                                            <Button variant="outline" className="w-full cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                Seleccionar Archivo
                                            </Button>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                onChange={handleRestore}
                                                accept=".json"
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </Tabs>
                
                <DialogFooter className="mt-4 shrink-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
