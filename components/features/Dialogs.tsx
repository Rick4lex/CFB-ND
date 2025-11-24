import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
    Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
    Input, ScrollArea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
    Textarea, Tabs, TabsList, TabsTrigger, Separator, Badge,
    Accordion, AccordionContent, AccordionItem, AccordionTrigger,
    Checkbox
} from '@/components/ui/Shared';
import { useToast } from '@/hooks/use-toast';
import { 
    PlusCircle, Trash2, Edit, Save, Phone, Mail, MapPin, 
    MessageSquare, LayoutGrid, List, ExternalLink, Upload, Download
} from 'lucide-react';
import { 
    advisorManagerSchema, managerSchema as entityManagerStateSchema, clientSchema
} from '@/lib/schemas';
import { 
    credentialTypes, entityContactDepartments, entityContactTypes, 
    documentTypes, serviceStatuses 
} from '@/lib/constants';
import { useAppStore } from '@/lib/store';
import { parseCSV, normalizeString } from '@/lib/utils';
import type { Advisor, Client, Entity, EntityContact, ClientWithMultiple } from '@/lib/types';

// --- Shared Components for Form Sections ---
const ContactField = ({ form, index }: { form: any, index: number }) => (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end p-3 border rounded-md bg-muted/20 relative">
        <FormField name={`entities.${index}.contacts.${index}.type`} control={form.control} render={({ field }: any) => (
             <FormItem><FormLabel className="text-xs">Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{entityContactTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></FormItem>
        )} />
        {/* ... fields simplified for brevity, logic structure optimized in implementation below ... */}
    </div>
);

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
  
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "advisors" });

  useEffect(() => {
    if(isOpen) {
        form.reset({ advisors: initialAdvisors });
        setEditingId(null);
    }
  }, [initialAdvisors, isOpen]);

  const onSubmit = (data: { advisors: Advisor[] }) => {
    onSave(data.advisors);
    toast({ title: 'Asesores actualizados', description: 'La lista de asesores ha sido guardada.' });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Gestionar Asesores</DialogTitle><DialogDescription>Añade, edita o elimina asesores.</DialogDescription></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] p-1 pr-4">
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const isEditing = editingId === field.id;
                  const currentCommissionValue = form.getValues(`advisors.${index}.commissionValue`);
                  return (
                    <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-card">
                       {isEditing ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                              <FormField name={`advisors.${index}.name`} control={form.control} render={({ field }: any) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                              <FormField name={`advisors.${index}.email`} control={form.control} render={({ field }: any) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField name={`advisors.${index}.commissionType`} control={form.control} render={({ field }: any) => (
                                <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="percentage">Porcentaje (%)</SelectItem><SelectItem value="fixed">Valor Fijo ($)</SelectItem></SelectContent></Select></FormItem>
                            )} />
                             <FormField name={`advisors.${index}.commissionValue`} control={form.control} render={({ field }: any) => (<FormItem><FormLabel>Valor</FormLabel><FormControl><Input {...field} type="number" /></FormControl></FormItem>)} />
                          </div>
                          <Button type="button" size="icon" className="absolute top-2 right-2" onClick={() => setEditingId(null)}><Save className="w-4 h-4"/></Button>
                        </>
                      ) : (
                        <div className="flex justify-between items-start">
                           <div>
                                <p className="font-semibold">{form.getValues(`advisors.${index}.name`)}</p>
                                <p className="text-sm text-muted-foreground">{form.getValues(`advisors.${index}.email`)}</p>
                                <p className="text-sm text-muted-foreground">Comisión: {form.getValues(`advisors.${index}.commissionType`) === 'percentage' ? `${currentCommissionValue}%` : `$${currentCommissionValue}`}</p>
                           </div>
                           <div className="flex gap-2"><Button type="button" variant="ghost" size="icon" onClick={() => setEditingId(field.id)}><Edit className="w-4 h-4"/></Button><Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}><Trash2 className="w-4 h-4"/></Button></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
             <Button type="button" variant="outline" size="sm" onClick={() => { append({ id: crypto.randomUUID(), name: '', commissionType: 'percentage', commissionValue: 10, phone: '', email: '' }); setEditingId(null); }} className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Nuevo Asesor</Button>
            <DialogFooter className="mt-4 pt-4 border-t"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- Entity Manager ---
const contactIcons = { phone: <Phone className="mr-2 h-4 w-4 text-blue-500" />, whatsapp: <MessageSquare className="mr-2 h-4 w-4 text-green-500" />, email: <Mail className="mr-2 h-4 w-4 text-red-500" />, location: <MapPin className="mr-2 h-4 w-4 text-purple-500" /> };

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

  const form = useForm<{ entities: Entity[] }>({ resolver: zodResolver(entityManagerStateSchema) as any, defaultValues: { entities: [] } });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "entities" });

  useEffect(() => {
    if (isOpen) { form.reset({ entities: allEntities }); setEditingId(null); }
  }, [allEntities, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>Gestionar Entidades</DialogTitle></DialogHeader>
        <div className="flex justify-between items-center">
            <Button type="button" variant="outline" onClick={() => { append({ id: crypto.randomUUID(), name: '', type: '', links: [], contacts: [] }); setEditingId(null); }}><PlusCircle className="mr-2 h-4 w-4" /> Nueva Entidad</Button>
            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}><TabsList><TabsTrigger value="cards"><LayoutGrid className="mr-2 h-4 w-4" /></TabsTrigger><TabsTrigger value="list" disabled><List className="mr-2 h-4 w-4" /></TabsTrigger></TabsList></Tabs>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => { onSave(data.entities); toast({ title: 'Guardado', description: 'Entidades actualizadas.' }); onOpenChange(false); })} className="space-y-4">
            <ScrollArea className="h-[60vh] p-1 pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map((field, index) => {
                    const isEditing = editingId === field.id;
                    return (
                      <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-card h-fit">
                        {isEditing ? <EditEntityForm index={index} control={form.control} setEditingId={setEditingId} /> : 
                        <ViewEntityCard entity={form.getValues(`entities.${index}`)} onEdit={() => setEditingId(field.id)} onRemove={() => remove(index)} />}
                      </div>
                    )
                  })}
                </div>
            </ScrollArea>
            <DialogFooter className="mt-4 pt-4 border-t"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ViewEntityCard({ entity, onEdit, onRemove }: { entity: any, onEdit: () => void, onRemove: () => void }) {
    const grouped = (entity.contacts || []).reduce((acc: any, c: any) => { (acc[c.department] = acc[c.department] || []).push(c); return acc; }, {});
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
               <div><p className="font-semibold">{entity.name || 'Nueva'}</p><Badge variant="secondary" className="mt-1">{entity.type || 'Sin tipo'}</Badge></div>
               <div className="flex gap-2"><Button type="button" variant="ghost" size="icon" onClick={onEdit}><Edit className="w-4 h-4"/></Button><Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={onRemove}><Trash2 className="w-4 h-4"/></Button></div>
            </div>
            <Separator />
            {entity.links?.length > 0 && <div className="flex flex-wrap gap-2">{entity.links.map((link: any) => link.url && <Button key={link.id} size="sm" variant="outline" onClick={() => window.open(link.url, '_blank')}><ExternalLink className="mr-1 h-3 w-3"/>{link.name}</Button>)}</div>}
            {entity.contacts?.length > 0 && Object.entries(grouped).map(([dept, contacts]: any) => (
                <div key={dept}><p className="text-xs font-bold uppercase text-muted-foreground">{dept}</p><div className="space-y-1 mt-1">{contacts.map((c: any) => <div key={c.id} className="flex items-center text-sm">{contactIcons[c.type as keyof typeof contactIcons]}<a href={c.value} className="hover:underline ml-1">{c.value}</a></div>)}</div></div>
            ))}
        </div>
    );
}

function EditEntityForm({ index, control, setEditingId }: { index: number, control: any, setEditingId: (id: string | null) => void }) {
    const { fields: links, append: addLink, remove: rmLink } = useFieldArray({ control, name: `entities.${index}.links` });
    const { fields: contacts, append: addContact, remove: rmContact } = useFieldArray({ control, name: `entities.${index}.contacts` });
    return (
        <>
           <div className="grid grid-cols-2 gap-4">
                <FormField name={`entities.${index}.name`} control={control} render={({ field }: any) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField name={`entities.${index}.type`} control={control} render={({ field }: any) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{credentialTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></FormItem>)} />
            </div>
            <Separator />
            <div className="space-y-2">
                <h4 className="text-sm font-medium">Enlaces</h4>
                {links.map((link, i) => (
                    <div key={link.id} className="flex gap-2"><FormField name={`entities.${index}.links.${i}.name`} control={control} render={({ field }: any) => <Input {...field} placeholder="Nombre" className="h-8"/>} /><FormField name={`entities.${index}.links.${i}.url`} control={control} render={({ field }: any) => <Input {...field} placeholder="URL" className="h-8"/>} /><Button type="button" variant="ghost" size="icon" onClick={() => rmLink(i)}><Trash2 className="w-4 h-4"/></Button></div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addLink({ id: crypto.randomUUID(), name: '', url: '' })}><PlusCircle className="mr-2 h-4 w-4"/> Añadir</Button>
            </div>
            <div className="space-y-2">
                <h4 className="text-sm font-medium">Contactos</h4>
                {contacts.map((contact, i) => (
                    <div key={contact.id} className="p-2 border rounded bg-muted/20 grid grid-cols-2 gap-2 relative">
                         <FormField name={`entities.${index}.contacts.${i}.type`} control={control} render={({ field }: any) => <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="h-8"><SelectValue/></SelectTrigger><SelectContent>{entityContactTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>} />
                         <FormField name={`entities.${index}.contacts.${i}.value`} control={control} render={({ field }: any) => <Input {...field} placeholder="Valor" className="h-8"/>} />
                         <FormField name={`entities.${index}.contacts.${i}.department`} control={control} render={({ field }: any) => <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="h-8"><SelectValue/></SelectTrigger><SelectContent>{entityContactDepartments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>} />
                         <Button type="button" size="icon" variant="ghost" className="absolute -top-2 -right-2 bg-background border rounded-full h-6 w-6" onClick={() => rmContact(i)}><Trash2 className="h-3 w-3"/></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addContact({ id: crypto.randomUUID(), type: 'phone', department: 'General', label: '', value: '' })}><PlusCircle className="mr-2 h-4 w-4"/> Añadir</Button>
            </div>
            <Button type="button" size="icon" className="absolute top-2 right-2" onClick={() => setEditingId(null)}><Save className="w-4 h-4"/></Button>
        </>
    );
}

// --- Client Form ---
export function ClientFormDialog({ isOpen, onOpenChange, onSave, client, advisors }: { isOpen: boolean, onOpenChange: any, onSave: any, client: Client | null, advisors: Advisor[] }) {
  const { toast } = useToast();
  const { config } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({ resolver: zodResolver(clientSchema), defaultValues: { contractedServices: [], beneficiaries: [], credentials: [] } });
  const { fields: beneficiaries, append: addBen, remove: rmBen } = useFieldArray({ control: form.control, name: "beneficiaries" });
  
  // Memoize costly calculations to prevent render lag
  const contractedServices = form.watch('contractedServices', []);
  const assignedAdvisor = form.watch('assignedAdvisor');
  const discount = Number(form.watch('discountPercentage', 0));
  const adminCost = Number(form.watch('adminCost', 0));
  const referral = Number(form.watch('referralCommissionAmount', 0));

  const totalCost = useMemo(() => (contractedServices || []).reduce((acc: number, id: string) => {
      const s = config.servicesCatalog.find(cat => cat.id === id || cat.name === id);
      return acc + (s?.price || 0);
  }, 0), [contractedServices, config.servicesCatalog]);

  const commission = useMemo(() => {
    const adv = advisors.find(a => a.name === assignedAdvisor);
    if (!adv) return 0;
    if (adv.commissionType === 'percentage') return totalCost * (adv.commissionValue / 100);
    const count = (contractedServices || []).filter((s: string) => s.toLowerCase().includes('afiliación') || s.toLowerCase().includes('liquidación')).length;
    return count * adv.commissionValue;
  }, [advisors, assignedAdvisor, totalCost, contractedServices]);

  useEffect(() => {
    if (client) form.reset({ ...client, adminCost: client.adminCost || 0, referralCommissionAmount: client.referralCommissionAmount || 0, discountPercentage: client.discountPercentage || 0 });
    else form.reset({ documentType: 'CC', documentId: '', fullName: '', serviceStatus: 'Contacto inicial', entryDate: new Date().toISOString().split('T')[0], contractedServices: [], beneficiaries: [], credentials: [], adminCost: 0, referralCommissionAmount: 0, discountPercentage: 0 });
  }, [client, isOpen]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const { data } = await parseCSV(file);
        if (data.length === 0) throw new Error("Archivo vacío");
        
        if (data.length === 1) {
            form.reset({ ...form.getValues(), ...data[0] });
            toast({ title: "Datos cargados", description: "Formulario completado." });
        } else {
             const addMultiple = (allClients: Client[], allAdvisors: Advisor[]) => {
                const map = new Map(allAdvisors.map(a => [normalizeString(a.name), a]));
                const newAdvisors: Advisor[] = [];
                const newClients = data.map((c: any) => {
                    if(!c.documentId) return null;
                    if(c.assignedAdvisor && !map.has(normalizeString(c.assignedAdvisor))) {
                         const na = { id: crypto.randomUUID(), name: c.assignedAdvisor, commissionType: 'percentage' as const, commissionValue: 10 };
                         newAdvisors.push(na); map.set(normalizeString(na.name), na);
                    }
                    return { ...c, id: c.documentId, contractedServices: [], beneficiaries: [] } as Client;
                }).filter(Boolean) as Client[];
                return { updatedClients: [...newClients, ...allClients], updatedAdvisors: [...allAdvisors, ...newAdvisors] };
             };
             onSave({ client: {} as Client, addMultiple });
             onOpenChange(false);
        }
    } catch (err: any) { toast({ variant: "destructive", title: "Error", description: err.message }); }
    if(e.target) e.target.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]"><DialogHeader className="flex flex-row justify-between"><DialogTitle>{client ? 'Editar' : 'Nuevo'} Cliente</DialogTitle><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" /></Button><input type="file" ref={fileInputRef} className="hidden" onChange={handleImport} accept=".csv"/></div></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(data => { 
              const adv = advisors.find(a => a.name === data.assignedAdvisor);
              onSave({ client: { ...data, id: client?.id || data.documentId, advisorCommissionPercentage: adv?.commissionType === 'percentage' ? adv.commissionValue : 0, advisorCommissionAmount: commission } }); 
            })}>
            <ScrollArea className="h-[70vh] p-1">
              <div className="p-4 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                    <FormField name="serviceStatus" control={form.control} render={({ field }: any) => <FormItem><FormLabel>Estado</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{serviceStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></FormItem>} />
                    <FormField name="entryDate" control={form.control} render={({ field }: any) => <FormItem><FormLabel>Fecha</FormLabel><FormControl><Input {...field} type="date" /></FormControl></FormItem>} />
                    <FormField name="assignedAdvisor" control={form.control} render={({ field }: any) => <FormItem><FormLabel>Asesor</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sin asignar"/></SelectTrigger></FormControl><SelectContent>{advisors.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}</SelectContent></Select></FormItem>} />
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    <FormField name="documentType" control={form.control} render={({ field }: any) => <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{documentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></FormItem>} />
                    <FormField name="documentId" control={form.control} render={({ field }: any) => <FormItem><FormLabel>Documento</FormLabel><FormControl><Input {...field} disabled={!!client} /></FormControl></FormItem>} />
                    <FormField name="fullName" control={form.control} render={({ field }: any) => <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
                 </div>
                 <Accordion className="w-full" defaultValue="item-1">
                    <AccordionItem value="item-1"><AccordionTrigger>Contacto</AccordionTrigger><AccordionContent>
                        <div className="grid grid-cols-3 gap-4"><FormField name="whatsapp" control={form.control} render={({ field }: any) => <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} /><FormField name="email" control={form.control} render={({ field }: any) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} /></div>
                    </AccordionContent></AccordionItem>
                    <AccordionItem value="item-2"><AccordionTrigger>Servicios</AccordionTrigger><AccordionContent>
                        <FormField name="contractedServices" control={form.control} render={() => <FormItem><div className="grid grid-cols-2 gap-2">{config.servicesCatalog.filter(s => s.active || contractedServices.includes(s.id)).map(s => (
                            <FormField key={s.id} control={form.control} name="contractedServices" render={({ field }: any) => <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value?.includes(s.id)} onCheckedChange={(c: boolean) => field.onChange(c ? [...field.value, s.id] : field.value.filter((v: string) => v !== s.id && v !== s.name))} /></FormControl><FormLabel className="font-normal">{s.name}</FormLabel></FormItem>} />
                        ))}</div></FormItem>} />
                    </AccordionContent></AccordionItem>
                    <AccordionItem value="item-3"><AccordionTrigger>Beneficiarios</AccordionTrigger><AccordionContent>
                        {beneficiaries.map((b, i) => <div key={b.id} className="flex gap-2 mb-2"><FormField name={`beneficiaries.${i}.name`} control={form.control} render={({ field }: any) => <Input {...field} placeholder="Nombre"/>} /><FormField name={`beneficiaries.${i}.documentId`} control={form.control} render={({ field }: any) => <Input {...field} placeholder="Doc" />} /><Button type="button" size="icon" variant="ghost" onClick={() => rmBen(i)}><Trash2 className="h-4 w-4"/></Button></div>)}
                        <Button type="button" variant="outline" size="sm" onClick={() => addBen({ id: crypto.randomUUID(), name: '', documentId: '' })}><PlusCircle className="mr-2 h-4 w-4"/> Añadir</Button>
                    </AccordionContent></AccordionItem>
                 </Accordion>
                 <div className="p-4 bg-muted/50 rounded-lg text-center grid grid-cols-4 gap-2">
                    <div><p className="text-xs">Trámite</p><p className="font-bold">${totalCost.toLocaleString()}</p></div>
                    <div><p className="text-xs">Comisión</p><p className="font-bold">${commission.toLocaleString()}</p></div>
                    <div><p className="text-xs">Neto</p><p className="font-bold text-primary">${(totalCost - adminCost - commission - referral - (totalCost * discount / 100)).toLocaleString()}</p></div>
                 </div>
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4 pt-4 border-t"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit">Guardar</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}