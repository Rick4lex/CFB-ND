import React, { useState, useMemo } from 'react';
import { UserCog, Building, PlusCircle, Search, FileText, Edit, Trash2, Filter, Users, Clock, CheckCircle, ChevronLeft, ChevronRight, X, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { PageLayout } from '../components/layout/Layout';
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Shared';
import { EntityManagerDialog, AdvisorManagerDialog, ClientFormDialog } from '../components/features/Dialogs';
import { Client, Advisor, Entity, ClientWithMultiple } from '../lib/types';
import { serviceStatuses } from '../lib/constants';
import { useToast } from '../hooks/use-toast';

const ITEMS_PER_PAGE = 10;

const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case 'activo': return 'success';
        case 'en trámite': return 'info';
        case 'mora': return 'destructive';
        case 'documentación pendiente': return 'warning';
        case 'retirado': return 'gray';
        default: return 'secondary';
    }
};

export const ClientsView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Global Store
  const { clients, setClients, advisors, setAdvisors, entities, setEntities } = useAppStore();
  
  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [advisorFilter, setAdvisorFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const filteredClients = useMemo(() => {
    let result = clients.filter(c => {
        const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || c.documentId.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || c.serviceStatus === statusFilter;
        const matchesAdvisor = advisorFilter === 'all' || c.assignedAdvisor === advisorFilter;
        return matchesSearch && matchesStatus && matchesAdvisor;
    });

    result.sort((a, b) => {
        if (sortOrder === 'name') return a.fullName.localeCompare(b.fullName);
        const dateA = new Date(a.entryDate).getTime();
        const dateB = new Date(b.entryDate).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [clients, searchTerm, statusFilter, advisorFilter, sortOrder]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.serviceStatus === 'Activo').length,
    pending: clients.filter(c => ['En trámite', 'Documentación pendiente'].includes(c.serviceStatus)).length
  }), [clients]);

  // --- Handlers ---

  const handleCreate = () => {
      setEditingClient(null);
      setIsClientModalOpen(true);
  };

  const handleEdit = (client: Client) => {
      setEditingClient(client);
      setIsClientModalOpen(true);
  };

  const handleDelete = (clientId: string) => {
      if (window.confirm('¿Estás seguro de que deseas eliminar este cliente permanentemente? Esta acción no se puede deshacer.')) {
          const updatedClients = clients.filter(x => x.id !== clientId);
          setClients(updatedClients);
          toast({ title: "Cliente eliminado", description: "El registro ha sido borrado exitosamente." });
      }
  };

  const handleSaveClient = (saveData: ClientWithMultiple) => {
    try {
        if (saveData.addMultiple) { 
            const { updatedClients, updatedAdvisors } = saveData.addMultiple(clients, advisors); 
            setClients(updatedClients); 
            setAdvisors(updatedAdvisors); 
            toast({ title: "Importación completada", description: "Se han cargado los clientes masivamente." });
        } else { 
            const incomingClient = saveData.client;
            const existsIndex = clients.findIndex(c => c.id === incomingClient.id);
            if (existsIndex > -1) {
                const updatedClients = [...clients];
                updatedClients[existsIndex] = { ...clients[existsIndex], ...incomingClient };
                setClients(updatedClients);
                toast({ title: "Cliente Actualizado", description: `Los datos de ${incomingClient.fullName} se han guardado.` });
            } else {
                const updatedClients = [incomingClient, ...clients];
                setClients(updatedClients);
                toast({ title: "Cliente Creado", description: `${incomingClient.fullName} ha sido añadido al sistema.` });
            }
        }
        setIsClientModalOpen(false); 
        setEditingClient(null);
    } catch (error) {
        console.error("Error al guardar cliente:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los cambios." });
    }
  };

  const handleSaveAdvisors = (newAdvisors: Advisor[]) => {
      setAdvisors(newAdvisors);
      toast({ title: "Asesores actualizados", description: "La lista de asesores ha sido guardada." });
  };

  const handleSaveEntities = (newEntities: Entity[]) => {
      setEntities(newEntities);
      toast({ title: "Entidades actualizadas", description: "La lista de entidades ha sido guardada." });
  };

  const handleExportCSV = () => {
      if (filteredClients.length === 0) {
        toast({ variant: "destructive", title: "Sin datos", description: "No hay datos para exportar con los filtros actuales." });
        return;
      }
      const headers = ["ID", "Nombre", "Documento", "Tipo Doc", "Email", "Telefono", "Estado", "Asesor", "Fecha Ingreso", "Notas"];
      const csvContent = [
          headers.join(','),
          ...filteredClients.map(c => [
              c.id, `"${c.fullName}"`, c.documentId, c.documentType, c.email || '', c.phone || c.whatsapp || '', c.serviceStatus, c.assignedAdvisor || '', c.entryDate, `"${c.notes || ''}"`
          ].join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `clientes_cfbnd_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
  };

  const clearFilters = () => {
      setSearchTerm('');
      setStatusFilter('all');
      setAdvisorFilter('all');
      setCurrentPage(1);
  };

  const handleGenerateDocuments = (clientId: string) => {
      navigate('/app/documentos', { state: { clientId } });
  };

  return (
    <PageLayout 
        title="Gestión de Clientes" 
        subtitle="CRM simplificado para administrar tu base de datos."
        onBackRoute="/app/dashboard"
        actions={
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setIsAdvisorModalOpen(true)} className="flex-1 sm:flex-none"><UserCog className="mr-2 h-4 w-4"/> Asesores</Button>
                <Button variant="outline" onClick={() => setIsEntityModalOpen(true)} className="flex-1 sm:flex-none"><Building className="mr-2 h-4 w-4"/> Entidades</Button>
                <Button variant="outline" onClick={handleExportCSV} title="Exportar CSV" className="px-3"><Download className="h-4 w-4"/></Button>
                <Button onClick={handleCreate} className="w-full sm:w-auto shadow-md"><PlusCircle className="mr-2 h-4 w-4"/> Nuevo Cliente</Button>
            </div>
        }
    >
        {/* STATS DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/50">
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Clientes</p><h3 className="text-3xl font-bold mt-1">{stats.total}</h3></div>
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center shadow-inner"><Users className="h-6 w-6 text-blue-600 dark:text-blue-400"/></div>
                </CardContent>
            </Card>
            <Card className="bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900/50">
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-green-600 dark:text-green-400">Activos</p><h3 className="text-3xl font-bold mt-1">{stats.active}</h3></div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center shadow-inner"><CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400"/></div>
                </CardContent>
            </Card>
             <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/50">
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-amber-600 dark:text-amber-400">Pendientes</p><h3 className="text-3xl font-bold mt-1">{stats.pending}</h3></div>
                    <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center shadow-inner"><Clock className="h-6 w-6 text-amber-600 dark:text-amber-400"/></div>
                </CardContent>
            </Card>
        </div>

        {/* FILTER BAR */}
        <div className="bg-card p-4 rounded-xl border shadow-sm mb-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                        placeholder="Buscar por nombre, documento..." 
                        className="pl-10 h-11" 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                    />
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 lg:gap-3">
                    <div className="w-full sm:w-[160px]">
                        <Select value={statusFilter} onValueChange={(v: string) => { setStatusFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger>
                                <div className="flex items-center gap-2 truncate">
                                    <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
                                    <SelectValue placeholder="Estado" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                {serviceStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full sm:w-[160px]">
                        <Select value={advisorFilter} onValueChange={(v: string) => { setAdvisorFilter(v); setCurrentPage(1); }}>
                             <SelectTrigger>
                                 <SelectValue placeholder="Asesor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los asesores</SelectItem>
                                {advisors.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full sm:w-[150px]">
                        <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Orden" />
                            </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="newest">Más recientes</SelectItem>
                                <SelectItem value="oldest">Más antiguos</SelectItem>
                                <SelectItem value="name">Nombre (A-Z)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {(searchTerm || statusFilter !== 'all' || advisorFilter !== 'all') && (
                        <Button variant="ghost" onClick={clearFilters} size="icon" title="Limpiar filtros" className="col-span-2 sm:col-span-1 w-full sm:w-11">
                            <X className="h-4 w-4"/>
                        </Button>
                    )}
                </div>
            </div>
        </div>

        {/* DATA TABLE */}
        <Card className="overflow-hidden border shadow-sm">
            <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="w-[300px] pl-6">Cliente</TableHead>
                            <TableHead>Documento</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Asesor</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right pr-6">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedClients.length > 0 ? (
                            paginatedClients.map(c => (
                                <TableRow key={c.id} className="group hover:bg-muted/40 transition-colors duration-200">
                                    <TableCell className="font-medium pl-6">
                                        <div className="flex flex-col">
                                            <span className="text-base group-hover:text-primary transition-colors">{c.fullName}</span>
                                            {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs">
                                            <span className="font-mono">{c.documentId}</span>
                                            <span className="text-muted-foreground opacity-70">{c.documentType}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(c.serviceStatus)}>{c.serviceStatus}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {c.assignedAdvisor ? 
                                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>{c.assignedAdvisor}</span> : 
                                            <span className="text-muted-foreground/50 italic">Sin asignar</span>
                                        }
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{c.entryDate}</TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleGenerateDocuments(c.id)} title="Documentos" className="h-8 w-8">
                                                <FileText className="h-4 w-4 text-blue-600/70 hover:text-blue-600"/>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} title="Editar" className="h-8 w-8">
                                                <Edit className="h-4 w-4 text-amber-600/70 hover:text-amber-600"/>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} title="Eliminar" className="h-8 w-8">
                                                <Trash2 className="h-4 w-4 text-red-600/70 hover:text-red-600"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <div className="bg-muted rounded-full p-4 mb-3">
                                            <Search className="h-8 w-8 opacity-20"/>
                                        </div>
                                        <p className="font-medium">No se encontraron clientes.</p>
                                        <p className="text-xs opacity-70 mt-1">Intenta ajustar los filtros de búsqueda.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t gap-4">
                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                        Mostrando <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)}</span> de <span className="font-medium">{filteredClients.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4 mr-1"/> Anterior
                        </Button>
                        <div className="text-sm font-medium px-2">Página {currentPage} de {totalPages}</div>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                            Siguiente <ChevronRight className="h-4 w-4 ml-1"/>
                        </Button>
                    </div>
                </div>
            )}
        </Card>

        <ClientFormDialog isOpen={isClientModalOpen} onOpenChange={setIsClientModalOpen} onSave={handleSaveClient} client={editingClient} advisors={advisors} />
        <AdvisorManagerDialog isOpen={isAdvisorModalOpen} onOpenChange={setIsAdvisorModalOpen} advisors={advisors} onSave={handleSaveAdvisors} />
        <EntityManagerDialog isOpen={isEntityModalOpen} onOpenChange={setIsEntityModalOpen} onSave={handleSaveEntities} allEntities={entities} />
    </PageLayout>
  );
};