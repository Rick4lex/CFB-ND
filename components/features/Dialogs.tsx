import { useState, useEffect, useRef, useMemo, useContext, type ChangeEvent, type MouseEvent, type ReactNode } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Papa from 'papaparse';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
    Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
    Input, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
    Textarea, Tabs, TabsList, TabsTrigger, Separator, Badge,
    Accordion, AccordionContent, AccordionItem, AccordionTrigger,
    Checkbox, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
    Label, Card, CardContent, TabsContext
} from '@/components/ui/Shared';
import { useToast } from '@/hooks/use-toast';
import { 
    PlusCircle, Trash2, Edit, Save, X, Phone, Mail, MapPin, 
    MessageSquare, LayoutGrid, List, ExternalLink, Upload, Download, FileText, UserPlus, KeyRound, Link as LinkIcon,
    Copy, Eye, EyeOff, Shield, Check
} from 'lucide-react';
import { 
    advisorSchema, managerSchema as entityManagerStateSchema, clientSchema, 
    entitySchema, advisorManagerSchema
} from '@/lib/schemas';
import { 
    credentialTypes, entityContactDepartments, entityContactTypes, 
    documentTypes, serviceStatuses, defaultGlobalConfig
} from '@/lib/constants';
import { useAppStore } from '@/lib/store';
import { normalizeString } from '@/lib/utils';
import type { Advisor, Client, Entity, EntityContact, ClientWithMultiple } from '@/lib/types';

// --- Helper Components ---

// MODIFICADO: TabsContent ahora usa CSS para ocultar en lugar de no renderizar.
// Esto mantiene vivo el estado de los formularios en pestañas inactivas.
const TabsContent = ({ value, children, className }: { value: string, children?: ReactNode, className?: string }) => {
    const context = useContext(TabsContext);
    if (!context) return null;
    const { activeTab } = context;
    
    return (
        <div className={`${className} ${activeTab === value ? '' : 'hidden'}`}>
            {children}
        </div>
    );
};

// --- Client Credentials Viewer ---
interface ClientCredentialsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  entities: Entity[];
}

export function ClientCredentialsDialog({ isOpen, onOpenChange, client, entities }: ClientCredentialsDialogProps) {
  const { toast } = useToast();
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: `${label} copiado al portapapeles.` });
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Accesos: {client.fullName}
          </DialogTitle>
          <DialogDescription>
            Credenciales y códigos de operación para gestión de pagos.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
                {(!client.credentials || client.credentials.length === 0) && (
                    <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        <KeyRound className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>Este cliente no tiene credenciales registradas.</p>
                    </div>
                )}
                {client.credentials?.map((cred) => {
                    // Sincronización en tiempo real: Buscamos la entidad por ID en el directorio actual
                    const entity = entities.find(e => e.id === cred.entityId);
                    
                    // Usamos datos del directorio si existen, sino fallback a los datos guardados en la credencial
                    const entityName = entity?.name || cred.entityName || 'Entidad no encontrada';
                    const entityType = entity?.type || cred.entityType || 'N/A';
                    const entityCode = entity?.code; // El código siempre viene del directorio
                    const entityUrl = entity?.links?.[0]?.url; // El enlace siempre viene del directorio

                    return (
                        <div key={cred.id} className="border rounded-xl p-4 bg-card shadow-sm hover:border-primary/30 transition-colors">
                            {/* Entity Header */}
                            <div className="flex justify-between items-start mb-4 border-b pb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-lg">{entityName}</h4>
                                        <Badge variant="secondary" className="text-[10px]">{entityType}</Badge>
                                    </div>
                                    {entityCode && (
                                        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded w-fit border border-border/50">
                                            <span className="font-bold">COD:</span> 
                                            <span className="select-all">{entityCode}</span>
                                            <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 hover:text-foreground" onClick={() => copyToClipboard(entityCode, 'Código Operador')}>
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {entityUrl && (
                                    <Button size="sm" variant="outline" className="gap-1 h-8 shadow-sm" onClick={() => window.open(entityUrl, '_blank')}>
                                        <ExternalLink className="h-3.5 w-3.5" /> Portal
                                    </Button>
                                )}
                            </div>

                            {/* Credentials Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usuario</span>
                                    <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md border border-transparent hover:border-border transition-colors">
                                        <span className="truncate flex-1 font-mono font-medium">{cred.username || '---'}</span>
                                        {cred.username && <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(cred.username!, 'Usuario')}><Copy className="h-3 w-3" /></Button>}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contraseña</span>
                                    <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md border border-transparent hover:border-border transition-colors">
                                        <span className="truncate flex-1 font-mono font-medium">
                                            {visiblePasswords[cred.id] ? cred.password : '••••••••'}
                                        </span>
                                        {cred.password && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => togglePassword(cred.id)}>
                                                    {visiblePasswords[cred.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(cred.password!, 'Contraseña')}>
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </>
                                        )}
                                        {!cred.password && <span className="text-muted-foreground text-xs italic">Sin clave</span>}
                                    </div>
                                </div>

                                {cred.registeredEmail && (
                                    <div className="space-y-1 md:col-span-2">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Correo Registrado</span>
                                        <div className="flex items-center gap-2 p-1">
                                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="font-mono text-xs">{cred.registeredEmail}</span>
                                        </div>
                                    </div>
                                )}
                                
                                {cred.notes && (
                                    <div className="space-y-1 md:col-span-2 bg-amber-50 dark:bg-amber-950/20 p-2 rounded text-xs border border-amber-100 dark:border-amber-900/50">
                                        <span className="font-bold text-amber-700 dark:text-amber-500 block mb-0.5 text-[10px] uppercase">Notas de Acceso:</span>
                                        <p className="text-amber-900 dark:text-amber-100/80 leading-relaxed">{cred.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
        <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Advisor Manager ---
interface AdvisorManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  advisors: Advisor[];
  onSave: (advisors: Advisor[]) => void;
}

export function AdvisorManagerDialog({ isOpen, onOpenChange, advisors: initialAdvisors, onSave }: AdvisorManagerDialogProps) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<{ advisors: Advisor[] }>({
    resolver: zodResolver(advisorManagerSchema) as any,
    defaultValues: { advisors: [] },
  });
  
  const { control, reset, getValues } = form;

  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "advisors",
  });

  useEffect(() => {
    if(isOpen) {
        reset({ advisors: initialAdvisors });
        setEditingId(null);
    }
  }, [initialAdvisors, isOpen, reset]);

  const handleDirectSave = () => {
    const data = getValues();
    onSave(data.advisors);
    toast({ title: 'Asesores actualizados', description: 'La lista de asesores ha sido guardada.' });
    onOpenChange(false);
  };
  
  const handleAddNew = () => {
    const newId = crypto.randomUUID();
    append({
        id: newId,
        name: '',
        commissionType: 'percentage',
        commissionValue: 10, 
        phone: '',
        email: '',
        paymentDetails: '',
    });
    setEditingId(newId);
  }

  const handleExport = () => {
      const data = getValues().advisors;
      if (data.length === 0) {
          toast({ variant: "destructive", title: "Sin datos", description: "No hay asesores para exportar." });
          return;
      }
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `asesores_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
              const importedData = results.data as any[];
              if (!importedData || importedData.length === 0) {
                  toast({ variant: "destructive", title: "Error", description: "Archivo vacío o inválido." });
                  return;
              }

              const currentAdvisors = getValues().advisors || [];
              const mergedAdvisors = [...currentAdvisors];

              let addedCount = 0;
              let updatedCount = 0;

              importedData.forEach((row) => {
                  if (!row.name) return; // Validación básica
                  
                  // Normalización de valores numéricos (manejo de comas y símbolos)
                  let commVal = 0;
                  if (row.commissionValue) {
                      // Reemplazar comas por puntos si existen, eliminar símbolos no numéricos
                      const cleanVal = String(row.commissionValue).replace(/[^0-9.,]/g, '').replace(',', '.');
                      commVal = parseFloat(cleanVal) || 0;
                  }

                  // Intentar encontrar por ID o Nombre Normalizado
                  const safeName = row.name ? normalizeString(row.name) : '';
                  const existingIndex = mergedAdvisors.findIndex(
                      a => a.id === row.id || normalizeString(a.name) === safeName
                  );

                  const newAdvisor: Advisor = {
                      id: row.id || crypto.randomUUID(),
                      name: row.name,
                      commissionType: row.commissionType?.toLowerCase() === 'fixed' ? 'fixed' : 'percentage',
                      commissionValue: commVal,
                      phone: row.phone || '',
                      email: row.email || '',
                      paymentDetails: row.paymentDetails || ''
                  };

                  if (existingIndex >= 0) {
                      // Actualizar existente preservando ID original
                      mergedAdvisors[existingIndex] = { 
                          ...mergedAdvisors[existingIndex], 
                          ...newAdvisor, 
                          id: mergedAdvisors[existingIndex].id 
                      }; 
                      updatedCount++;
                  } else {
                      mergedAdvisors.push(newAdvisor);
                      addedCount++;
                  }
              });

              reset({ advisors: mergedAdvisors });
              toast({ 
                  title: "Importación Completada", 
                  description: `Se añadieron ${addedCount} y se actualizaron ${updatedCount} asesores.` 
              });
          },
          error: (error) => {
              toast({ variant: "destructive", title: "Error de lectura", description: error.message });
          }
      });
      e.target.value = ''; // Reset input para permitir re-selección
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex justify-between items-center pr-8">
              <div>
                <DialogTitle>Gestionar Asesores</DialogTitle>
                <DialogDescription>
                    Añade, edita o elimina asesores de tu equipo.
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport} title="Exportar CSV">
                      <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} title="Importar CSV">
                      <Upload className="h-4 w-4" />
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImport} />
              </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <div className="space-y-4">
            <ScrollArea className="h-[60vh] p-1 pr-4">
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const isEditing = editingId === field.id;
                  const currentCommissionValue = form.getValues(`advisors.${index}.commissionValue`);

                  return (
                    <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-card">
                       {isEditing ? (
                        <>
                          <FormField name={`advisors.${index}.name`} control={form.control} render={({ field }: any) => (
                            <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} placeholder="Nombre completo del asesor" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField name={`advisors.${index}.phone`} control={form.control} render={({ field }: any) => (
                                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} placeholder="3001234567" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField name={`advisors.${index}.email`} control={form.control} render={({ field }: any) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" placeholder="asesor@email.com" /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                           <div className="grid grid-cols-2 gap-4">
                            <FormField name={`advisors.${index}.commissionType`} control={form.control} render={({ field }: any) => (
                                <FormItem>
                                    <FormLabel>Tipo Comisión</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                                            <SelectItem value="fixed">Valor Fijo ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                     <FormMessage />
                                </FormItem>
                            )} />
                             <FormField name={`advisors.${index}.commissionValue`} control={form.control} render={({ field }: any) => (
                                <FormItem><FormLabel>Valor Comisión</FormLabel><FormControl><Input {...field} type="number" /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                           <FormField name={`advisors.${index}.paymentDetails`} control={form.control} render={({ field }: any) => (
                                <FormItem><FormLabel>Datos de Pago</FormLabel><FormControl><Textarea {...field} placeholder="Ej: Cuenta de Ahorros Bancolombia #123-456789-00" /></FormControl><FormMessage /></FormItem>
                           )} />

                          <div className="absolute top-2 right-2 flex gap-2">
                             <Button type="button" size="icon" onClick={() => setEditingId(null)}><Save className="w-4 h-4"/></Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-start">
                           <div>
                                <p className="font-semibold">{form.getValues(`advisors.${index}.name`) || 'Nuevo Asesor'}</p>
                                <p className="text-sm text-muted-foreground">{form.getValues(`advisors.${index}.email`)}</p>
                                <p className="text-sm text-muted-foreground">
                                    Comisión: {form.getValues(`advisors.${index}.commissionType`) === 'percentage' 
                                        ? `${currentCommissionValue}%` 
                                        : `${typeof currentCommissionValue === 'number' ? currentCommissionValue.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }) : '$0'} (fijo)`
                                    }
                                </p>
                           </div>
                           <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="icon" onClick={() => setEditingId(field.id)}><Edit className="w-4 h-4"/></Button>
                                <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => remove(index)}><Trash2 className="w-4 h-4"/></Button>
                           </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
             <Button type="button" variant="outline" size="sm" onClick={handleAddNew} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nuevo Asesor
            </Button>

            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="button" onClick={handleDirectSave}>Guardar Cambios</Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Entity Manager ---
const contactIcons = {
    phone: <Phone className="mr-2 h-4 w-4 text-blue-500" />,
    whatsapp: <MessageSquare className="mr-2 h-4 w-4 text-green-500" />,
    email: <Mail className="mr-2 h-4 w-4 text-red-500" />,
    location: <MapPin className="mr-2 h-4 w-4 text-purple-500" />,
};

const ContactValue = ({ contact }: { contact: EntityContact }) => {
    let href = contact.value;
    if (contact.type === 'phone') href = `tel:${contact.value}`;
    if (contact.type === 'email') href = `mailto:${contact.value}`;
    if (contact.type === 'whatsapp') href = `https://wa.me/${contact.value.replace(/\s/g, '')}`;
    if (contact.type === 'location') href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.value)}`;
    
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline text-sm text-foreground">
            {contact.value}
        </a>
    )
};

const EditEntityForm = ({ index, control, setEditingId }: { index: number, control: any, setEditingId: (id: string | null) => void }) => {
    const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
        control,
        name: `entities.${index}.links`
    });
    
    const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
        control,
        name: `entities.${index}.contacts`
    });

    return (
        <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <FormField name={`entities.${index}.name`} control={control} render={({ field }: any) => (
                    <FormItem><FormLabel>Nombre Entidad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name={`entities.${index}.type`} control={control} render={({ field }: any) => (
                    <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                {['EPS', 'ARL', 'CAJA', 'PENSION', 'CESANTIAS', 'OTRO'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
             </div>
             <FormField name={`entities.${index}.code`} control={control} render={({ field }: any) => (
                <FormItem><FormLabel>Código (Opcional)</FormLabel><FormControl><Input {...field} placeholder="EPS001" /></FormControl><FormMessage /></FormItem>
             )} />

             <Separator className="my-2" />
             
             <div>
                <div className="flex justify-between items-center mb-2">
                    <Label className="text-xs font-bold uppercase">Enlaces / Portales</Label>
                    <Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={() => appendLink({ id: crypto.randomUUID(), name: '', url: '' })}><PlusCircle className="mr-1 h-3 w-3"/> Link</Button>
                </div>
                <div className="space-y-2">
                    {linkFields.map((field: any, k) => (
                        <div key={field.id} className="flex gap-2">
                            <FormField name={`entities.${index}.links.${k}.name`} control={control} render={({ field }: any) => <FormControl><Input {...field} placeholder="Nombre" className="h-8 text-xs" /></FormControl>} />
                            <FormField name={`entities.${index}.links.${k}.url`} control={control} render={({ field }: any) => <FormControl><Input {...field} placeholder="URL" className="h-8 text-xs" /></FormControl>} />
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeLink(k)}><Trash2 className="h-3 w-3"/></Button>
                        </div>
                    ))}
                </div>
             </div>

             <div>
                <div className="flex justify-between items-center mb-2">
                    <Label className="text-xs font-bold uppercase">Directorios de Contacto</Label>
                    <Button type="button" variant="outline" size="sm" className="h-6 text-xs" onClick={() => appendContact({ id: crypto.randomUUID(), type: 'phone', department: 'General', label: '', value: '' })}><PlusCircle className="mr-1 h-3 w-3"/> Contacto</Button>
                </div>
                <div className="space-y-2">
                    {contactFields.map((field: any, k) => (
                        <div key={field.id} className="grid grid-cols-12 gap-2 items-start border p-2 rounded-md bg-muted/20">
                            <div className="col-span-3">
                                 <FormField name={`entities.${index}.contacts.${k}.department`} control={control} render={({ field }: any) => (
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Depto" /></SelectTrigger></FormControl>
                                        <SelectContent>{entityContactDepartments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                    </Select>
                                 )} />
                            </div>
                            <div className="col-span-3">
                                 <FormField name={`entities.${index}.contacts.${k}.type`} control={control} render={({ field }: any) => (
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger></FormControl>
                                        <SelectContent>{entityContactTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                 )} />
                            </div>
                            <div className="col-span-5 space-y-1">
                                <FormField name={`entities.${index}.contacts.${k}.label`} control={control} render={({ field }: any) => <FormControl><Input {...field} placeholder="Etiqueta" className="h-7 text-xs" /></FormControl>} />
                                <FormField name={`entities.${index}.contacts.${k}.value`} control={control} render={({ field }: any) => <FormControl><Input {...field} placeholder="Valor" className="h-7 text-xs" /></FormControl>} />
                            </div>
                            <div className="col-span-1">
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeContact(k)}><Trash2 className="h-3 w-3"/></Button>
                            </div>
                        </div>
                    ))}
                </div>
             </div>

             <div className="flex justify-end pt-2">
                 <Button type="button" size="sm" onClick={() => setEditingId(null)}>Terminar Edición</Button>
             </div>
        </div>
    );
};

const ViewEntityCard = ({ entity, onEdit, onRemove, groupedContacts }: any) => {
    const contactsByDept = groupedContacts(entity.contacts);
    return (
        <>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-lg">{entity.name}</h4>
                        <Badge variant="outline">{entity.type}</Badge>
                    </div>
                    {entity.code && <span className="text-xs font-mono text-muted-foreground bg-muted px-1 rounded">CODE: {entity.code}</span>}
                </div>
                <div className="flex gap-1">
                     <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={onEdit}><Edit className="h-3 w-3"/></Button>
                     <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={onRemove}><Trash2 className="h-3 w-3"/></Button>
                </div>
            </div>
            
            {/* Links */}
            {entity.links && entity.links.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {entity.links.map((link: any, i: number) => (
                        <a key={i} href={link.url} target="_blank" rel="noreferrer" className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full flex items-center hover:underline">
                            <ExternalLink className="h-3 w-3 mr-1" /> {link.name}
                        </a>
                    ))}
                </div>
            )}

            {/* Contacts */}
            <div className="space-y-2">
                {Object.entries(contactsByDept).map(([dept, contacts]: any) => (
                     <div key={dept} className="text-xs">
                         <span className="font-semibold text-muted-foreground uppercase text-[10px]">{dept}</span>
                         <div className="grid grid-cols-1 gap-1 pl-1 border-l-2 border-muted">
                             {contacts.map((c: any, i: number) => (
                                 <div key={i} className="flex items-center gap-2">
                                     {contactIcons[c.type as keyof typeof contactIcons]}
                                     <span className="font-medium">{c.label}:</span>
                                     <ContactValue contact={c} />
                                 </div>
                             ))}
                         </div>
                     </div>
                ))}
            </div>
        </>
    )
}

interface EntityManagerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entities: Entity[]) => void;
  allEntities: Entity[];
}

export function EntityManagerDialog({ isOpen, onOpenChange, onSave, allEntities }: EntityManagerDialogProps) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<{ entities: Entity[] }>({
    resolver: zodResolver(entityManagerStateSchema) as any,
    defaultValues: { entities: [] },
  });

  const { control, reset, getValues } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "entities",
  });

  useEffect(() => {
    if (isOpen) {
      reset({ entities: allEntities });
      setEditingId(null);
    }
  }, [allEntities, isOpen, reset]);

  const handleDirectSave = () => {
    const data = getValues();
    onSave(data.entities);
    toast({ title: 'Entidades actualizadas', description: 'La lista de entidades ha sido guardada.' });
    onOpenChange(false);
  };
  
  const handleAddNew = () => {
    const newId = crypto.randomUUID();
    append({
      id: newId,
      name: '',
      type: 'EPS',
      code: '',
      links: [],
      contacts: [],
    });
    setEditingId(newId);
  };

  const groupedContacts = (contacts: EntityContact[] = []) => {
    return contacts.reduce((acc, contact) => {
        (acc[contact.department] = acc[contact.department] || []).push(contact);
        return acc;
    }, {} as Record<string, EntityContact[]>);
  };

  const handleExport = () => {
      const data = getValues().entities;
      if (data.length === 0) {
          toast({ variant: "destructive", title: "Sin datos", description: "No hay entidades para exportar." });
          return;
      }
      
      // Transform nested objects to JSON strings
      const exportData = data.map(e => ({
          ...e,
          links: JSON.stringify(e.links),
          contacts: JSON.stringify(e.contacts)
      }));

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `entidades_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
              const importedData = results.data as any[];
              if (!importedData || importedData.length === 0) {
                  toast({ variant: "destructive", title: "Error", description: "Archivo vacío o inválido." });
                  return;
              }

              const currentEntities = getValues().entities || [];
              const mergedEntities = [...currentEntities];
              
              let addedCount = 0;
              let updatedCount = 0;

              importedData.forEach(row => {
                  if (!row.name) return;

                  let parsedLinks = [];
                  let parsedContacts = [];
                  try {
                      // Attempt to parse if exists, otherwise default to empty
                      parsedLinks = (row.links && row.links !== '[]') ? JSON.parse(row.links) : [];
                      parsedContacts = (row.contacts && row.contacts !== '[]') ? JSON.parse(row.contacts) : [];
                  } catch (err) {
                      console.warn("Aviso: Columnas complejas no válidas para entidad:", row.name);
                      // Fallback: Si no es JSON, asumir vacío
                      parsedLinks = [];
                      parsedContacts = [];
                  }

                  const safeName = row.name ? normalizeString(row.name) : '';
                  const existingIndex = mergedEntities.findIndex(
                      ent => ent.id === row.id || normalizeString(ent.name) === safeName
                  );

                  const newEntity: Entity = {
                      id: row.id || crypto.randomUUID(),
                      name: row.name,
                      type: row.type || 'EPS',
                      code: row.code || '',
                      links: Array.isArray(parsedLinks) ? parsedLinks : [],
                      contacts: Array.isArray(parsedContacts) ? parsedContacts : []
                  };

                  if (existingIndex >= 0) {
                      mergedEntities[existingIndex] = { 
                          ...mergedEntities[existingIndex], 
                          ...newEntity, 
                          id: mergedEntities[existingIndex].id // Preservar ID original
                      };
                      updatedCount++;
                  } else {
                      mergedEntities.push(newEntity);
                      addedCount++;
                  }
              });

              reset({ entities: mergedEntities });
              toast({ 
                  title: "Importación Completada", 
                  description: `Se añadieron ${addedCount} y se actualizaron ${updatedCount} entidades.` 
              });
          },
          error: (error) => {
              toast({ variant: "destructive", title: "Error de lectura", description: error.message });
          }
      });
      e.target.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
           <div className="flex justify-between items-center pr-8">
              <div>
                <DialogTitle>Gestionar Entidades</DialogTitle>
                <DialogDescription>
                    Añade, edita o elimina las entidades del sistema.
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport} title="Exportar CSV">
                      <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} title="Importar CSV">
                      <Upload className="h-4 w-4" />
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImport} />
              </div>
          </div>
        </DialogHeader>
        <div className="flex justify-between items-center gap-4 py-2">
            <Button type="button" variant="outline" onClick={handleAddNew} className="h-9">
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva Entidad
            </Button>
            <div className="flex bg-muted p-1 rounded-lg">
                <Button 
                    variant={viewMode === 'cards' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-8 rounded-md"
                    onClick={() => setViewMode('cards')}
                >
                    <LayoutGrid className="h-4 w-4 mr-2" /> Tarjetas
                </Button>
                <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-8 rounded-md"
                    onClick={() => setViewMode('list')}
                >
                    <List className="h-4 w-4 mr-2" /> Lista
                </Button>
            </div>
        </div>
        <Form {...form}>
          <div className="space-y-4">
            <ScrollArea className="h-[55vh] p-1 pr-4">
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map((field, index) => {
                    const isEditing = editingId === field.id;
                    const currentEntity = getValues(`entities.${index}`);

                    return (
                      <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-card h-fit">
                        {isEditing ? (
                          <EditEntityForm index={index} control={control} setEditingId={setEditingId} />
                        ) : (
                          <ViewEntityCard entity={currentEntity} onEdit={() => setEditingId(field.id)} onRemove={() => remove(index)} groupedContacts={groupedContacts} />
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Entidad</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="hidden md:table-cell">Recursos</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => {
                            const isEditing = editingId === field.id;
                            const entity = getValues(`entities.${index}`);
                            
                            if (isEditing) {
                                return (
                                    <TableRow key={field.id}>
                                        <TableCell colSpan={4}>
                                            <div className="p-4 bg-muted/20 rounded-lg">
                                                <EditEntityForm index={index} control={control} setEditingId={setEditingId} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            }

                            return (
                                <TableRow key={field.id}>
                                    <TableCell className="font-medium">
                                        {entity.name || 'Sin nombre'}
                                        {entity.code && <span className="ml-2 text-xs text-muted-foreground">({entity.code})</span>}
                                    </TableCell>
                                    <TableCell><Badge variant="secondary">{entity.type || 'N/A'}</Badge></TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <div className="flex gap-2 text-muted-foreground text-xs">
                                            <span>{entity.links?.length || 0} enlaces</span>
                                            <span>•</span>
                                            <span>{entity.contacts?.length || 0} contactos</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(field.id)}><Edit className="h-4 w-4"/></Button>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
              )}
            </ScrollArea>
            

            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="button" onClick={handleDirectSave}>Guardar Cambios</Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Client Form Dialog ---
interface ClientFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (saveData: ClientWithMultiple) => void;
  client: Client | null;
  advisors: Advisor[];
  entities?: Entity[]; // Added prop
}

export function ClientFormDialog({ isOpen, onOpenChange, onSave, client, advisors, entities = [] }: ClientFormDialogProps) {
    const { toast } = useToast();
    const { config } = useAppStore();
    const servicesCatalog = config.servicesCatalog;

    const form = useForm({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            id: '', fullName: '', documentType: 'CC', documentId: '', email: '', whatsapp: '',
            address: '', serviceStatus: 'Contacto inicial', entryDate: new Date().toISOString().split('T')[0],
            assignedAdvisor: '', adminCost: 0, referralCommissionAmount: 0, discountPercentage: 0,
            contractedServices: [], beneficiaries: [], credentials: [], notes: ''
        } as any
    });

    const { reset, control, handleSubmit, watch, setValue } = form;

    const { fields: beneficiaryFields, append: appendBen, remove: removeBen } = useFieldArray({ control, name: 'beneficiaries' });
    const { fields: credentialFields, append: appendCred, remove: removeCred } = useFieldArray({ control, name: 'credentials' });

    useEffect(() => {
        if (isOpen) {
            if (client) {
                reset({ ...client });
            } else {
                reset({
                    id: crypto.randomUUID(),
                    fullName: '', documentType: 'CC', documentId: '', email: '', whatsapp: '',
                    address: '', serviceStatus: 'Contacto inicial', entryDate: new Date().toISOString().split('T')[0],
                    assignedAdvisor: '', adminCost: 0, referralCommissionAmount: 0, discountPercentage: 0,
                    contractedServices: [], beneficiaries: [], credentials: [], notes: ''
                });
            }
        }
    }, [isOpen, client, reset]);

    const onSubmit = (data: any) => {
        onSave({ client: data });
        // onOpenChange(false); // Handled in parent
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>{client ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                    <DialogDescription>Completa la información requerida.</DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
                        <Tabs defaultValue="personal" className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 py-2 bg-muted/30 border-b">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="personal">Personal</TabsTrigger>
                                    <TabsTrigger value="services">Servicios</TabsTrigger>
                                    <TabsTrigger value="beneficiaries">Beneficiarios</TabsTrigger>
                                    <TabsTrigger value="credentials">Credenciales</TabsTrigger>
                                </TabsList>
                            </div>
                            
                            <ScrollArea className="flex-1 p-6">
                                <TabsContent value="personal" className="space-y-4 mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField name="fullName" control={control} render={({ field }) => (
                                            <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <FormField name="documentType" control={control} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tipo Doc</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>{documentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField name="documentId" control={control} render={({ field }) => (
                                                <FormItem><FormLabel>Número Doc</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                        <FormField name="email" control={control} render={({ field }) => (
                                            <FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input {...field} type="email" /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField name="whatsapp" control={control} render={({ field }) => (
                                            <FormItem><FormLabel>Celular / WhatsApp</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField name="address" control={control} render={({ field }) => (
                                            <FormItem className="md:col-span-2"><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </TabsContent>

                                <TabsContent value="services" className="space-y-4 mt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField name="serviceStatus" control={control} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estado del Servicio</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>{serviceStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField name="assignedAdvisor" control={control} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Asesor Asignado</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                                                    <SelectContent>{advisors.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField name="entryDate" control={control} render={({ field }) => (
                                            <FormItem><FormLabel>Fecha Ingreso</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                         <FormField name="adminCost" control={control} render={({ field }) => (
                                            <FormItem><FormLabel>Costo Administración</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Servicios Contratados</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border p-3 rounded-lg">
                                            {servicesCatalog.filter(s => s.active).map(service => (
                                                <div key={service.id} className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={`srv-${service.id}`} 
                                                        checked={(watch('contractedServices') || []).includes(service.id)}
                                                        onCheckedChange={(checked) => {
                                                            const current = watch('contractedServices') || [];
                                                            if (checked) setValue('contractedServices', [...current, service.id]);
                                                            else setValue('contractedServices', current.filter((id: string) => id !== service.id));
                                                        }}
                                                    />
                                                    <label htmlFor={`srv-${service.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                                        {service.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <FormField name="notes" control={control} render={({ field }) => (
                                        <FormItem><FormLabel>Notas Internas</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </TabsContent>
                                
                                <TabsContent value="beneficiaries" className="space-y-4 mt-0">
                                    <div className="flex justify-end">
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendBen({ id: crypto.randomUUID(), name: '', documentId: '', documentImageUrl: '' })}>
                                            <PlusCircle className="mr-2 h-4 w-4"/> Añadir Beneficiario
                                        </Button>
                                    </div>
                                    {beneficiaryFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-4 items-end border p-3 rounded-lg relative">
                                            <FormField name={`beneficiaries.${index}.name`} control={control} render={({ field }) => (
                                                <FormItem className="flex-1"><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                            )} />
                                            <FormField name={`beneficiaries.${index}.documentId`} control={control} render={({ field }) => (
                                                <FormItem className="flex-1"><FormLabel>Documento</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                            )} />
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeBen(index)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    ))}
                                    {beneficiaryFields.length === 0 && <p className="text-center text-muted-foreground py-8">No hay beneficiarios registrados.</p>}
                                </TabsContent>

                                <TabsContent value="credentials" className="space-y-4 mt-0">
                                    <div className="flex justify-end">
                                        <Button type="button" variant="outline" size="sm" onClick={() => appendCred({ id: crypto.randomUUID(), entityId: '', entityType: '', entityName: '', username: '', password: '', notes: '' })}>
                                            <PlusCircle className="mr-2 h-4 w-4"/> Añadir Credencial
                                        </Button>
                                    </div>
                                    {credentialFields.map((field, index) => (
                                        <Card key={field.id} className="relative">
                                            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* ENTITY SELECTION - LINKED TO DATABASE */}
                                                <div className="md:col-span-2">
                                                    <FormField name={`credentials.${index}.entityId`} control={control} render={({ field }) => (
                                                        <FormItem>
                                                            <div className="flex justify-between">
                                                                <FormLabel>Entidad</FormLabel>
                                                                {/* Display Badge of Type if selected */}
                                                                {watch(`credentials.${index}.entityType`) && (
                                                                    <Badge variant="outline" className="text-[10px]">{watch(`credentials.${index}.entityType`)}</Badge>
                                                                )}
                                                            </div>
                                                            <Select 
                                                                value={field.value} 
                                                                onValueChange={(val: string) => {
                                                                    field.onChange(val);
                                                                    // Auto-fill related fields based on selection
                                                                    const selectedEntity = entities.find(e => e.id === val);
                                                                    if (selectedEntity) {
                                                                        setValue(`credentials.${index}.entityName`, selectedEntity.name, { shouldValidate: true, shouldDirty: true });
                                                                        setValue(`credentials.${index}.entityType`, selectedEntity.type, { shouldValidate: true, shouldDirty: true });
                                                                    }
                                                                }}
                                                            >
                                                                <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar entidad..." /></SelectTrigger></FormControl>
                                                                <SelectContent>
                                                                    {entities.map(e => (
                                                                        <SelectItem key={e.id} value={e.id}>
                                                                            {e.name} <span className="text-xs text-muted-foreground">({e.type})</span>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                    {/* Hidden fields to store denormalized data for display if entity is deleted later */}
                                                    <input type="hidden" {...form.register(`credentials.${index}.entityName`)} />
                                                    <input type="hidden" {...form.register(`credentials.${index}.entityType`)} />
                                                </div>

                                                <FormField name={`credentials.${index}.username`} control={control} render={({ field }) => (
                                                    <FormItem><FormLabel>Usuario</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                                )} />
                                                <FormField name={`credentials.${index}.password`} control={control} render={({ field }) => (
                                                    <FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                                )} />
                                                <FormField name={`credentials.${index}.notes`} control={control} render={({ field }) => (
                                                    <FormItem className="md:col-span-2"><FormLabel>Notas</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                                )} />
                                                
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    {/* "Save"/Check Visual Button requested */}
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" title="Credencial Lista">
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeCred(index)}>
                                                        <Trash2 className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {credentialFields.length === 0 && <p className="text-center text-muted-foreground py-8">No hay credenciales registradas.</p>}
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                        
                        <div className="p-6 border-t bg-muted/10 flex justify-end gap-2">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit">Guardar Cliente</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}