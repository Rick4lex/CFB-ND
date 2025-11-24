
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { UserCog, Building, PlusCircle, Search, FileText, Edit, Trash2, Filter, Users, Clock, CheckCircle, ChevronLeft, ChevronRight, X, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { PageLayout } from '../components/layout/Layout';
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Shared';
import { EntityManagerDialog, AdvisorManagerDialog, ClientFormDialog } from '../components/features/Dialogs';
import { Client, Advisor, Entity, ClientWithMultiple } from '../lib/types';
import { serviceStatuses } from '../lib/constants';
import { useToast } from '../hooks/use-toast';
import { debounce } from '../lib/utils'; // Import debounce from utils

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

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // Separate state for effective search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [advisorFilter, setAdvisorFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input update
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value); // Update input immediately
      // Debounce the actual filter update
      const debouncedUpdate = debounce((val: string) => {
          setDebouncedSearchTerm(val);
          setCurrentPage(1);
      }, 300);
      debouncedUpdate(value);
  }, []);

  const filteredClients = useMemo(() => {
    let result = clients.filter(c => {
        // Use debounced term for filtering
        const matchesSearch = !debouncedSearchTerm || 
            c.fullName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
            c.documentId.includes(debouncedSearchTerm);
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
  }, [clients, debouncedSearchTerm, statusFilter, advisorFilter, sortOrder]);

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

  // Improved Robust Logic from previous step
  const handleSaveClient = (saveData: ClientWithMultiple) => {
    try {
        if (saveData.addMultiple) { 
            const { updatedClients, updatedAdvisors } = saveData.addMultiple(clients, advisors); 
            setClients(updatedClients); 
            setAdvisors(updatedAdvisors);
            toast({ title: "Importación completada", description: `${updatedClients.length} clientes procesados.` });
        } else { 
            setClients(prev => { 
                const existsIndex = prev.findIndex(c => c.id === saveData.client.id); 
                if (existsIndex > -1) {
                    const newClients = [...prev];
                    newClients[existsIndex] = { ...prev[existsIndex], ...saveData.client };
                    return newClients;
                } else {
                    return [saveData.client, ...prev]; 
                }
            });
            const isEdit = clients.some(c => c.id === saveData.client.id);
            toast({ 
                title: isEdit ? "Datos actualizados" : "Cliente registrado", 
                description: isEdit 
                    ? `Se guardaron los cambios para ${saveData.client.fullName}` 
                    : `${saveData.client.fullName} ha sido añadido exitosamente.`
            });
        }
        setIsClientModalOpen(false); 
        setEditingClient(null);
    } catch (error) {
        console.error("Error saving client:", error);
        toast({ variant: "destructive", title: "Error al guardar", description: "Ocurrió un problema guardando los datos." });
    }
  };

  const handleDelete = (clientId: string) => {
      if (window.confirm('¿Estás seguro de eliminar este cliente?\n\nEsta acción es irreversible.')) {
          const clientToDelete = clients.find(c => c.id === clientId);
          setClients(prev => prev.filter(x => x.id !== clientId));
          toast({ 
              title: "Cliente eliminado", 
              description: `Se ha eliminado a ${clientToDelete?.fullName || 'el cliente'} de la base de datos.` 
          });
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
      setDebouncedSearchTerm('');
      setStatusFilter('all');
      setAdvisorFilter('all');
      setCurrentPage(1);
  };

  return (
    <PageLayout 
        title="Gestión de Clientes" 
        subtitle="CRM simplificado para administrar tu base de datos."
        onBackRoute="/app/dashboard"
        actions={
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAdvisorModalOpen(true)}><UserCog className="mr-2 h-4 w-4"/> Asesores</Button>
                <Button variant="outline" onClick={() => setIsEntityModalOpen(true)}><Building className="mr-2 h-4 w-4"/> Entidades</Button>
                <Button variant="outline" onClick={handleExportCSV} title="Descargar lista actual en CSV"><Download className="mr-2 h-4 w-4"/> Exportar CSV</Button>
                <Button onClick={handleCreate}><PlusCircle className="mr-2 h-4 w-4"/> Nuevo Cliente</Button>
            </div>
        }
    >
        {/* STATS DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Clientes</p><h3 className="text-3xl font-bold">{stats.total}</h3></div>
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center"><Users className="h-6 w-6 text-blue-600"/></div>
                </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900">
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-green-600 dark:text-green-400">Servicios Activos</p><h3 className="text-3xl font-bold">{stats.active}</h3></div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center"><CheckCircle className="h-6 w-6 text-green-600"/></div>
                </CardContent>
            </Card>
             <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900">
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-amber-600 dark:text-amber-400">En Trámite / Pendiente</p><h3 className="text-3xl font-bold">{stats.pending}</h3></div>
                    <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center"><Clock className="h-6 w-6 text-amber-600"/></div>
                </CardContent>
            </Card>
        </div>

        {/* FILTER BAR */}
        <div className="bg-card p-4 rounded-lg border shadow-sm mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                        placeholder="Buscar por nombre, documento..." 
                        className="pl-9" 
                        value={searchTerm} 
                        onChange={handleSearchChange} 
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Select value={statusFilter} onValueChange={(v: string) => { setStatusFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[180px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground"/>
                                <SelectValue placeholder="Estado" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            {serviceStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={advisorFilter} onValueChange={(v: string) => { setAdvisorFilter(v); setCurrentPage(1); }}>
                         <SelectTrigger className="w-[180px]">
                             <SelectValue placeholder="Asesor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los asesores</SelectItem>
                            {advisors.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Orden" />
                        </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="newest">Más recientes</SelectItem>
                            <SelectItem value="oldest">Más antiguos</SelectItem>
                            <SelectItem value="name">Nombre (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    {(searchTerm || statusFilter !== 'all' || advisorFilter !== 'all') && (
                        <Button variant="ghost" onClick={clearFilters} size="icon" title="Limpiar filtros">
                            <X className="h-4 w-4"/>
                        </Button>
                    )}
                </div>
            </div>
        </div>

        {/* DATA TABLE */}
        <Card className="overflow-hidden border shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-[300px]">Cliente</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Asesor</TableHead>
                        <TableHead>Fecha Ingreso</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedClients.length > 0 ? (
                        paginatedClients.map(c => (
                            <TableRow key={c.id} className="group hover:bg-muted/80 transition-colors duration-200">
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="text-base group-hover:text-primary transition-colors">{c.fullName}</span>
                                        {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-mono text-xs bg-background">{c.documentType} {c.documentId}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(c.serviceStatus)}>{c.serviceStatus}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{c.assignedAdvisor}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{c.entryDate}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100">
                                        <Button variant="ghost" size="icon" onClick={() => navigate('/app/documentos', { state: { clientId: c.id } })} title="Generar Documentos">
                                            <FileText className="h-4 w-4 text-blue-600"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} title="Editar">
                                            <Edit className="h-4 w-4 text-amber-600"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} title="Eliminar">
                                            <Trash2 className="h-4 w-4 text-red-600"/>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-48 text-center">
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <Search className="h-10 w-10 mb-2 opacity-20"/>
                                    <p>No se encontraron clientes con los filtros actuales.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            
            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)} de {filteredClients.length} clientes
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4 mr-1"/> Anterior
                        </Button>
                        <div className="text-sm font-medium">Página {currentPage} de {totalPages}</div>
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
