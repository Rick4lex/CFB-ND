
import { useState, useEffect, useRef, useMemo, type ChangeEvent, type MouseEvent } from 'react';
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
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/components/ui/Shared';
import { useToast } from '@/hooks/use-toast';
import { 
    PlusCircle, Trash2, Edit, Save, X, Phone, Mail, MapPin, 
    MessageSquare, LayoutGrid, List, ExternalLink, Upload, Download, FileText, UserPlus 
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
import type { Advisor, Client, Entity, EntityContact, ClientWithMultiple } from '@/lib/types';

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gestionar Asesores</DialogTitle>
          <DialogDescription>
            Añade, edita o elimina asesores de tu equipo. La información se guardará localmente en tu navegador.
          </DialogDescription>
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
      type: '',
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Gestionar Entidades</DialogTitle>
          <DialogDescription>
            Añade, edita o elimina las entidades. Los enlaces y contactos que configures estarán disponibles para acceso rápido.
          </DialogDescription>
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
                                    <TableCell className="font-medium">{entity.name || 'Sin nombre'}</TableCell>
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

function ViewEntityCard({ entity, onEdit, onRemove, groupedContacts }: { entity: any, onEdit: () => void, onRemove: () => void, groupedContacts: (contacts: EntityContact[]) => Record<string, EntityContact[]>}) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
               <div>
                    <p className="font-semibold">{entity.name || 'Nueva Entidad'}</p>
                    <Badge variant="secondary" className="mt-1">{entity.type || 'Sin tipo'}</Badge>
               </div>
               <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="icon" onClick={onEdit}><Edit className="w-4 h-4"/></Button>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={onRemove}><Trash2 className="w-4 h-4"/></Button>
               </div>
            </div>
            
            <Separator />

            {entity.links && entity.links.length > 0 && (
                <div className="space-y-2">
                     <h4 className="text-sm font-semibold text-muted-foreground">Enlaces Rápidos</h4>
                     <div className="flex flex-wrap gap-2">
                        {entity.links.map((link: any) => (
                            link.url ? (
                            <Button key={link.id} size="sm" variant="outline" onClick={() => window.open(link.url, '_blank')}>
                                <ExternalLink className="mr-1 h-3 w-3"/>{link.name}
                            </Button>
                            ) : null
                        ))}
                    </div>
                </div>
             )}

            {entity.contacts && entity.contacts.length > 0 && (
            <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">Puntos de Contacto</h4>
                    {Object.entries(groupedContacts(entity.contacts)).map(([department, contacts]) => (
                    <div key={department}>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{department}</p>
                        <div className="space-y-1 mt-1">
                        {contacts.map(contact => (
                            <div key={contact.id} className="flex items-center">
                                {contactIcons[contact.type as keyof typeof contactIcons]}
                                <span className="text-sm font-medium mr-2">{contact.label}:</span>
                                <ContactValue contact={contact} />
                            </div>
                        ))}
                        </div>
                    </div>
                    ))}
            </div>
            )}
        </div>
    );
}

function EditEntityForm({ index, control, setEditingId }: { index: number, control: any, setEditingId: (id: string | null) => void }) {
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
                    <FormItem><FormLabel>Nombre Entidad</FormLabel><FormControl><Input {...field} placeholder="Ej: Porvenir" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name={`entities.${index}.type`} control={control} render={({ field }: any) => (
                    <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                            <SelectContent>{credentialTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            <Separator />
            
            {/* Links Section */}
            <div className="space-y-2 pt-2">
                <h4 className="text-sm font-medium">Enlaces de Acceso Rápido</h4>
                {linkFields.map((linkField, linkIndex) => (
                    <div key={linkField.id} className="grid grid-cols-1 md:grid-cols-8 gap-2 items-end">
                        <div className="md:col-span-3">
                             <FormField name={`entities.${index}.links.${linkIndex}.name`} control={control} render={({ field }: any) => (
                                <FormItem><FormLabel className="text-xs">Nombre del Enlace</FormLabel><FormControl><Input {...field} placeholder="Ej: Portal Pagos" /></FormControl><FormMessage /></FormItem>
                             )} />
                        </div>
                        <div className="md:col-span-4">
                            <FormField name={`entities.${index}.links.${linkIndex}.url`} control={control} render={({ field }: any) => (
                                <FormItem><FormLabel className="text-xs">URL Completa</FormLabel><FormControl><Input {...field} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive h-10 w-10 mb-0" onClick={() => removeLink(linkIndex)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => appendLink({ id: crypto.randomUUID(), name: '', url: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Enlace
                </Button>
            </div>
            
            <Separator />

            {/* Contacts Section */}
            <div className="space-y-2 pt-2">
                <h4 className="text-sm font-medium">Puntos de Contacto</h4>
                {contactFields.map((contactField, contactIndex) => (
                     <div key={contactField.id} className="p-3 border rounded-md grid grid-cols-1 md:grid-cols-5 gap-2 items-end relative bg-muted/20">
                        <FormField name={`entities.${index}.contacts.${contactIndex}.type`} control={control} render={({ field }: any) => (
                            <FormItem><FormLabel className="text-xs">Tipo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>{entityContactTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select><FormMessage />
                            </FormItem>
                        )} />
                        <FormField name={`entities.${index}.contacts.${contactIndex}.department`} control={control} render={({ field }: any) => (
                            <FormItem><FormLabel className="text-xs">Departamento</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{entityContactDepartments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select><FormMessage />
                            </FormItem>
                        )} />
                        <FormField name={`entities.${index}.contacts.${contactIndex}.label`} control={control} render={({ field }: any) => (
                            <FormItem><FormLabel className="text-xs">Etiqueta</FormLabel><FormControl><Input {...field} placeholder="Línea Nacional"/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField name={`entities.${index}.contacts.${contactIndex}.value`} control={control} render={({ field }: any) => (
                            <FormItem><FormLabel className="text-xs">Valor</FormLabel><FormControl><Input {...field} placeholder="01 8000 ..."/></FormControl><FormMessage /></FormItem>
                        )} />
                         <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive h-10 w-10 mb-0" onClick={() => removeContact(contactIndex)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => appendContact({ id: crypto.randomUUID(), type: 'phone', department: 'General', label: '', value: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Contacto
                </Button>
            </div>

          <div className="absolute top-2 right-2 flex gap-2">
             <Button type="button" size="icon" onClick={() => setEditingId(null)}><Save className="w-4 h-4"/></Button>
          </div>
        </div>
    );
}

// --- Client Form ---
const CSV_HEADERS = [
  "documentId", "fullName", "documentType", "email", "whatsapp",
  "serviceStatus", "entryDate", "assignedAdvisor", "referredBy",
  "adminCost", "referralCommissionAmount", "discountPercentage",
  "notes"
];

// Helper for fuzzy matching
const normalizeString = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

type ClientFormData = any;

interface ClientFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (clientData: ClientWithMultiple) => void;
  client: Client | null;
  advisors: Advisor[];
}

export function ClientFormDialog({ isOpen, onOpenChange, onSave, client, advisors }: ClientFormDialogProps) {
  const { toast } = useToast();
  const { config } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allServices = useMemo(() => config.servicesCatalog.filter(s => s.active || client?.contractedServices?.includes(s.id)), [config.servicesCatalog, client]);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { contractedServices: [], beneficiaries: [], credentials: [] }
  });

  const { fields: beneficiaryFields, append: appendBeneficiary, remove: removeBeneficiary } = useFieldArray({
    control: form.control,
    name: "beneficiaries"
  });

  const { fields: credentialFields, append: appendCredential, remove: removeCredential } = useFieldArray({
    control: form.control,
    name: "credentials"
  });

  const contractedServices = form.watch('contractedServices', []);
  const assignedAdvisorName = form.watch('assignedAdvisor');
  const adminCost = form.watch('adminCost', 0);
  const referralCommissionAmount = form.watch('referralCommissionAmount', 0);
  const discountPercentage = form.watch('discountPercentage', 0);


  const totalProcedureCost = useMemo(() => {
    return (contractedServices || []).reduce((total: number, serviceIdentifier: string) => {
      const service = config.servicesCatalog.find(s => s.id === serviceIdentifier || s.name === serviceIdentifier);
      return total + (service?.price || 0);
    }, 0);
  }, [contractedServices, config.servicesCatalog]);


  const commissionDetails = useMemo(() => {
    const advisor = advisors.find(a => a.name === assignedAdvisorName);
    if (!advisor) {
      return { value: 0, summary: 'Asesor no asignado' };
    }
    
    if (advisor.commissionType === 'percentage') {
      const commission = totalProcedureCost * (advisor.commissionValue / 100);
      return { 
        value: commission, 
        summary: `${advisor.commissionValue}% de ${totalProcedureCost.toLocaleString('es-CO', {style:'currency', currency: 'COP'})}`
      };
    }
    
    if (advisor.commissionType === 'fixed') {
      const affiliationServiceCount = (contractedServices || []).filter((s: string) => {
           const resolvedName = config.servicesCatalog.find(cat => cat.id === s)?.name || s;
           return resolvedName.toLowerCase().includes('afiliación') || resolvedName.toLowerCase().includes('liquidación');
      }).length;

      const commission = affiliationServiceCount * advisor.commissionValue;
      return {
        value: commission,
        summary: `${affiliationServiceCount} serv. x ${advisor.commissionValue.toLocaleString('es-CO', {style:'currency', currency: 'COP'})}`
      };
    }
    
    return { value: 0, summary: 'Tipo de comisión no válido' };

  }, [advisors, assignedAdvisorName, contractedServices, totalProcedureCost, config.servicesCatalog]);
  
  const advisorCommissionValue = commissionDetails.value;
  const commissionSummary = commissionDetails.summary;


  const discountValue = totalProcedureCost * (discountPercentage / 100);
  const netOperationValue = totalProcedureCost - adminCost - advisorCommissionValue - referralCommissionAmount - discountValue;

  useEffect(() => {
    if (client) {
      form.reset({
        ...client,
        adminCost: client.adminCost || 0,
        referralCommissionAmount: client.referralCommissionAmount || 0,
        discountPercentage: client.discountPercentage || 0,
      });
    } else {
      form.reset({
        documentType: 'CC',
        documentId: '',
        fullName: '',
        serviceStatus: 'Contacto inicial',
        entryDate: new Date().toISOString().split('T')[0],
        contractedServices: [],
        beneficiaries: [],
        credentials: [],
        adminCost: 0,
        referralCommissionAmount: 0,
        discountPercentage: 0,
      });
    }
  }, [client, isOpen, form]);

  const handleDownloadTemplate = () => {
    const csvContent = CSV_HEADERS.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_clientes.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Plantilla descargada", description: "Completa el archivo plantilla_clientes.csv para importar tus clientes."});
  };
  
  const handleFileImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            const clientsData = results.data as any[];
            if (clientsData.length === 0) {
                toast({ variant: "destructive", title: "Archivo vacío", description: "El archivo CSV no contiene datos." });
                return;
            }

            if (clientsData.length === 1) {
                const singleClient = clientsData[0];
                const transformedClient = {
                    ...form.getValues(),
                    documentId: singleClient.documentId || '',
                    fullName: singleClient.fullName || '',
                    documentType: singleClient.documentType || 'CC',
                    email: singleClient.email || '',
                    whatsapp: singleClient.whatsapp || '',
                    serviceStatus: singleClient.serviceStatus || 'Contacto inicial',
                    entryDate: singleClient.entryDate || new Date().toISOString().split('T')[0],
                    assignedAdvisor: singleClient.assignedAdvisor || '',
                    referredBy: singleClient.referredBy || '',
                    adminCost: parseFloat(singleClient.adminCost) || 0,
                    referralCommissionAmount: parseFloat(singleClient.referralCommissionAmount) || 0,
                    discountPercentage: parseFloat(singleClient.discountPercentage) || 0,
                    notes: singleClient.notes || '',
                };
                form.reset(transformedClient);
                toast({ title: "Cliente cargado", description: "Los datos del cliente se han cargado en el formulario." });
            } else {
                const addMultipleFn = (allClients: Client[], allAdvisors: Advisor[]) => {
                    const existingClientIds = new Set(allClients.map(cl => cl.id));
                    const existingAdvisorMap = new Map();
                    allAdvisors.forEach(a => existingAdvisorMap.set(normalizeString(a.name), a));

                    let newAdvisors: Advisor[] = [];

                    const clientsToAdd = clientsData
                        .map(c => {
                            if (!c.documentId || !c.fullName) return null;
                            
                            let advisorName = c.assignedAdvisor;

                            if (advisorName) {
                                const normalizedInput = normalizeString(advisorName);
                                if (existingAdvisorMap.has(normalizedInput)) {
                                    advisorName = existingAdvisorMap.get(normalizedInput).name;
                                } else {
                                    const newAdvisor: Advisor = {
                                        id: crypto.randomUUID(),
                                        name: c.assignedAdvisor,
                                        commissionType: 'percentage',
                                        commissionValue: 10,
                                    };
                                    newAdvisors.push(newAdvisor);
                                    existingAdvisorMap.set(normalizedInput, newAdvisor);
                                }
                            }

                            return {
                                id: c.documentId,
                                documentId: c.documentId,
                                fullName: c.fullName,
                                documentType: c.documentType || 'CC',
                                email: c.email || undefined,
                                whatsapp: c.whatsapp || undefined,
                                serviceStatus: c.serviceStatus || 'Contacto inicial',
                                entryDate: c.entryDate || new Date().toISOString().split('T')[0],
                                assignedAdvisor: advisorName || undefined,
                                referredBy: c.referredBy || undefined,
                                contractedServices: [],
                                beneficiaries: [],
                                credentials: [],
                                adminCost: parseFloat(c.adminCost) || 0,
                                referralCommissionAmount: parseFloat(c.referralCommissionAmount) || 0,
                                discountPercentage: parseFloat(c.discountPercentage) || 0,
                                notes: c.notes || undefined,
                            } as Client;
                        })
                        .filter((c): c is Client => c !== null && !existingClientIds.has(c.id));
                    
                    const updatedClients = [...clientsToAdd, ...allClients];
                    const updatedAdvisors = [...allAdvisors, ...newAdvisors];
                    
                    return { updatedClients, updatedAdvisors };
                };


                onSave({ client: {} as Client, addMultiple: addMultipleFn });

                toast({ title: "Importación Masiva Procesada", description: `${clientsData.length} registros fueron procesados.` });
                onOpenChange(false);
            }
        },
        error: (error: any) => {
            toast({ variant: "destructive", title: "Error al importar", description: error.message });
        }
    });

    if (event.target) event.target.value = '';
  };


  const handleDirectSubmit = (e: MouseEvent) => {
    e.preventDefault(); 
    const data = form.getValues();
    
    if (!data.fullName || !data.documentId) {
        toast({ variant: "destructive", title: "Datos incompletos", description: "Nombre y Documento son requeridos." });
        return;
    }

    const advisor = advisors.find(a => a.name === data.assignedAdvisor);
    
    const recordId = client?.id ? client.id : crypto.randomUUID();
    
    const finalClient: Client = {
      ...data,
      id: recordId,
      documentId: data.documentId || client?.documentId || '', 
      advisorCommissionPercentage: advisor?.commissionType === 'percentage' ? advisor.commissionValue : 0,
      advisorCommissionAmount: advisorCommissionValue
    };
    
    onSave({client: finalClient});
    
    toast({
      title: client ? "Cliente actualizado" : "Cliente creado",
      description: `Se han guardado los datos de ${finalClient.fullName}.`,
    });
    
    onOpenChange(false);
  };
  
  const documentType = form.watch("documentType");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle>{client ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}</DialogTitle>
          <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} title="Descargar Plantilla CSV">
                    <Download className="h-4 w-4"/>
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} title="Importar desde CSV">
                    <Upload className="h-4 w-4" />
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileImport}
                />
            </div>
        </DialogHeader>
        <Form {...form}>
          <div>
            <ScrollArea className="h-[70vh] p-1">
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30 shadow-sm">
                    <FormField name="serviceStatus" control={form.control} render={({ field }: any) => (
                        <FormItem>
                            <FormLabel className="font-bold">Estado</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-background border-primary/50"><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                            <SelectContent>{serviceStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField name="entryDate" control={form.control} render={({ field }: any) => (
                        <FormItem><FormLabel className="font-bold">Fecha Ingreso</FormLabel><FormControl><Input {...field} type="date" className="bg-background"/></FormControl></FormItem>
                    )} />
                    <FormField name="assignedAdvisor" control={form.control} render={({ field }: any) => (
                        <FormItem>
                            <FormLabel className="font-bold">Asesor Asignado</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="Sin asignar..." /></SelectTrigger></FormControl>
                            <SelectContent>{advisors.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField name="documentType" control={form.control} render={({ field }: any) => (
                        <FormItem>
                            <FormLabel>Tipo Documento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                            <SelectContent>{documentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField name="documentId" control={form.control} render={({ field }: any) => (
                        <FormItem>
                        <FormLabel>Número (ID)</FormLabel>
                        <FormControl>
                            <Input 
                                {...field} 
                                readOnly={!!client} 
                                className={!!client ? "bg-muted text-muted-foreground opacity-100 cursor-not-allowed" : ""} 
                                placeholder="Ej: 12345678" 
                            />
                        </FormControl>
                        </FormItem>
                    )} />
                    <FormField name="fullName" control={form.control} render={({ field }: any) => (
                        <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl><Input {...field} placeholder="Nombre del cliente" /></FormControl>
                        </FormItem>
                    )} />
                </div>

                <Accordion className="w-full" defaultValue="item-1">
                  
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="font-bold text-base">Datos de Contacto Adicionales</AccordionTrigger>
                    <AccordionContent>
                      {documentType === 'NIT' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-muted/50 mb-4">
                           <FormField name="legalRepName" control={form.control} render={({ field }: any) => (
                              <FormItem><FormLabel>Nombre Rep. Legal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                           )} />
                           <FormField name="legalRepId" control={form.control} render={({ field }: any) => (
                              <FormItem><FormLabel>C.C. Rep. Legal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                           )} />
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <FormField name="whatsapp" control={form.control} render={({ field }: any) => (
                            <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input {...field} type="tel"/></FormControl></FormItem>
                         )} />
                         <FormField name="email" control={form.control} render={({ field }: any) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} type="email" /></FormControl></FormItem>
                         )} />
                         <FormField name="referredBy" control={form.control} render={({ field }: any) => (
                            <FormItem><FormLabel>Referido por</FormLabel><FormControl><Input {...field} placeholder="Ej: TikTok" /></FormControl></FormItem>
                         )} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger className="font-bold text-base text-amber-600">Servicios Contratados</AccordionTrigger>
                    <AccordionContent>
                       <FormField
                          name="contractedServices"
                          control={form.control}
                          render={() => (
                            <FormItem>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 rounded-md border p-4 bg-background">
                                {allServices.map((service) => (
                                  <FormField
                                    key={service.id}
                                    control={form.control}
                                    name="contractedServices"
                                    render={({ field }: any) => (
                                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(service.id) || field.value?.includes(service.name)}
                                            onCheckedChange={(checked: boolean) => {
                                                let newValue = field.value || [];
                                                if (checked) {
                                                    newValue = [...newValue, service.id];
                                                } else {
                                                    newValue = newValue.filter((val: string) => val !== service.id && val !== service.name);
                                                }
                                                field.onChange(newValue);
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal cursor-pointer">{service.name}</FormLabel>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                            </FormItem>
                          )}
                        />
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="font-medium">Beneficiarios</AccordionTrigger>
                    <AccordionContent>
                      {beneficiaryFields.map((field, index) => (
                        <div key={field.id} className="p-3 border rounded-md space-y-2 relative mb-2">
                            <div className="grid grid-cols-2 gap-2">
                                <FormField name={`beneficiaries.${index}.name`} control={form.control} render={({ field }: any) => (
                                    <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                )}/>
                                 <FormField name={`beneficiaries.${index}.documentId`} control={form.control} render={({ field }: any) => (
                                    <FormItem><FormLabel>Documento</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                )}/>
                            </div>
                           <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeBeneficiary(index)}><Trash2 className="h-4 w-4"/></Button>
                        </div>
                      ))}
                      {beneficiaryFields.length < 5 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => appendBeneficiary({ id: crypto.randomUUID(), name: '', documentId: '' })}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Beneficiario
                        </Button>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger className="font-medium">Costos y Comisiones</AccordionTrigger>
                    <AccordionContent>
                       <div className="p-4 bg-muted/50 rounded-lg space-y-2 mb-4">
                          <h4 className="font-semibold text-center">Resumen Financiero</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                              <div><p className="text-xs text-muted-foreground">Costo Trámite</p><p className="font-bold">{totalProcedureCost.toLocaleString('es-CO', {style:'currency', currency: 'COP'})}</p></div>
                              <div>
                                <p className="text-xs text-muted-foreground">Comisión Asesor</p>
                                <p className="font-bold">{advisorCommissionValue.toLocaleString('es-CO', {style:'currency', currency: 'COP'})}</p>
                                <p className="text-[10px] text-blue-500">({commissionSummary})</p>
                              </div>
                              <div><p className="text-xs text-muted-foreground">Descuento</p><p className="font-bold">{discountValue.toLocaleString('es-CO', {style:'currency', currency: 'COP'})}</p></div>
                              <div><p className="text-xs text-muted-foreground">Valor Neto</p><p className="font-bold text-primary">{netOperationValue.toLocaleString('es-CO', {style:'currency', currency: 'COP'})}</p></div>
                          </div>
                       </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="space-y-2">
                    <FormField name="notes" control={form.control} render={({ field }: any) => (
                        <FormItem><FormLabel>Notas Adicionales</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                    )} />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="button" onClick={handleDirectSubmit}>Guardar Cliente</Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
