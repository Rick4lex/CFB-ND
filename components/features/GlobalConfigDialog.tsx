
import React, { useState, useRef } from 'react';
import { useCFBraindStorage } from '../../hooks/useCFBraindStorage';
import { defaultGlobalConfig } from '../../lib/constants';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
    Tabs, TabsList, TabsTrigger, Button, Input, Switch, ScrollArea, 
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '../ui/Shared';
import { Save, Download, Upload, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export function GlobalConfigDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
    const [config, setConfig] = useCFBraindStorage('sys_config', defaultGlobalConfig);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState('services');

    // Local state for edits before saving
    const [tempServices, setTempServices] = useState(config.servicesCatalog);

    // Sync local state when modal opens or config changes externally
    React.useEffect(() => {
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
        const data = {
            clients: localStorage.getItem('clients'),
            advisors: localStorage.getItem('advisors'),
            entities: localStorage.getItem('entities'),
            sys_config: localStorage.getItem('sys_config'),
            cotizadorProfiles: localStorage.getItem('cotizadorProfiles'),
            theme: localStorage.getItem('cfbnd-theme'),
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_cfbnd_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        toast({ title: "Copia de Seguridad Generada", description: "El archivo JSON se ha descargado correctamente." });
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                
                if (window.confirm("¿Estás seguro? Esto sobrescribirá todos los datos actuales con los de la copia de seguridad.")) {
                    if (data.clients) localStorage.setItem('clients', data.clients);
                    if (data.advisors) localStorage.setItem('advisors', data.advisors);
                    if (data.entities) localStorage.setItem('entities', data.entities);
                    if (data.sys_config) localStorage.setItem('sys_config', data.sys_config);
                    if (data.cotizadorProfiles) localStorage.setItem('cotizadorProfiles', data.cotizadorProfiles);
                    if (data.theme) localStorage.setItem('cfbnd-theme', data.theme);
                    
                    toast({ title: "Restauración Exitosa", description: "La aplicación se recargará para aplicar los cambios." });
                    setTimeout(() => window.location.reload(), 1500);
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Error de Restauración", description: "El archivo no tiene un formato válido." });
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
