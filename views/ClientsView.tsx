
import { useState, useMemo, useCallback, type ChangeEvent } from 'react';
import { UserCog, Building, PlusCircle, Search, FileText, Edit, Trash2, Filter, Users, Clock, CheckCircle, ChevronLeft, ChevronRight, X, Download, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { useClientOperations } from '../hooks/useClientOperations';
import { PageLayout } from '../components/layout/Layout';
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Shared';
import { EntityManagerDialog, AdvisorManagerDialog, ClientFormDialog, ClientCredentialsDialog } from '../components/features/Dialogs';
import { Client, Advisor, Entity, ClientWithMultiple } from '../lib/types';
import { serviceStatuses } from '../lib/constants';
import { useToast } from '../hooks/use-toast';
import { debounce } from '../lib/utils'; 

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
  
  // Store Global
  const { clients, advisors, entities, setAdvisors, setEntities } = useAppStore();

  // Hook Controlador
  const { saveClient, deleteClient } = useClientOperations();
  
  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [credentialsClient, setCredentialsClient] = useState<Client | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [advisorFilter, setAdvisorFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search
  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      const debouncedUpdate = debounce((val: string) => {
          setDebouncedSearchTerm(val);
          setCurrentPage(1);
      }, 300);
      debouncedUpdate(value);
  }, []);

  const filteredClients = useMemo(() => {
    let result = clients.filter(c => {
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

  const handleShowCredentials = (client: Client) => {
      setCredentialsClient(client);
      setIsCredentialsModalOpen(true);
  };

  const handleSaveClientWrapper = (saveData: ClientWithMultiple) => {
    const success = saveClient(saveData);
    if (success) {
        setIsClientModalOpen(false); 
        setEditingClient(null);
    }
  };

  const handleDeleteWrapper = (clientId: string) => {
      if (window.confirm('¿Estás seguro de eliminar este cliente?\n\nEsta acción es irreversible.')) {
          deleteClient(clientId);
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
        subtitle="Administra tu base de datos y relaciones."
        onBackRoute="/app/dashboard"
        actions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsAdvisorModalOpen(true)}><UserCog className="mr-2 h-4 w-4"/> Asesores</Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsEntityModalOpen(true)}><Building className="mr-2 h-4 w-4"/> Entidades</Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportCSV} title="Descargar CSV"><Download className="mr-2 h-4 w-4"/> Exportar</Button>
                <Button className="w-full sm:w-auto shadow-lg shadow-primary/20" onClick={handleCreate}><PlusCircle className="mr-2 h-4 w-4"/> Nuevo Cliente</Button>
            </div>
        }
    >
        {/* STATS DASHBOARD */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/10 border-blue-100 dark:border-blue-900">
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Clientes</p><h3 className="text-3xl font-bold mt-1">{stats.total}</h3></div>
                    <div className="h-12 w-12 bg-white/50 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center shadow-sm"><Users className="h-6 w-6 text-blue-600 dark:text-blue-400"/></div>
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/10 border-green-100 dark:border-green-900">
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-green-600 dark:text-green-400">Servicios Activos</p><h3 className="text-3xl font-bold mt-1">{stats.active}</h3></div>
                    <div className="h-12 w-12 bg-white/50 dark:bg-green-900/50 rounded-2xl flex items-center justify-center shadow-sm"><CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400"/></div>
                </CardContent>
            </Card>
             <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/10 border-amber-100 dark:border-amber-900">
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-amber-600 dark:text-amber-400">En Trámite</p><h3 className="text-3xl font-bold mt-1">{stats.pending}</h3></div>
                    <div className="h-12 w-12 bg-white/50 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center shadow-sm"><Clock className="h-6 w-6 text-amber-600 dark:text-amber-400"/></div>
                </CardContent>
            </Card>
        </div>

        {/* FILTER BAR */}
        <div className="bg-card p-4 rounded-xl border shadow-sm mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                        id="search-clients"
                        name="search"
                        autoComplete="off"
                        placeholder="Buscar por nombre o documento..." 
                        className="pl-10 bg-background/50" 
                        value={searchTerm} 
                        onChange={handleSearchChange} 
                    />
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
                    <Select value={statusFilter} onValueChange={(v: string) => { setStatusFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-full sm:w-[180px]">
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
                         <SelectTrigger className="w-full sm:w-[180px]">
                             <SelectValue placeholder="Asesor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los asesores</SelectItem>
                            {advisors.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                        <SelectTrigger className="w-full sm:w-[160px] col-span-2 sm:col-span-1">
                            <SelectValue placeholder="Orden" />
                        </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="newest">Más recientes</SelectItem>
                            <SelectItem value="oldest">Más antiguos</SelectItem>
                            <SelectItem value="name">Nombre (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    {(searchTerm || statusFilter !== 'all' || advisorFilter !== 'all') && (
                        <Button variant="ghost" onClick={clearFilters} size="icon" title="Limpiar filtros" className="shrink-0 col-span-2 sm:col-span-1 w-full sm:w-10">
                            <X className="h-4 w-4"/>
                        </Button>
                    )}
                </div>
            </div>
        </div>

        {/* DATA TABLE */}
        <Card className="overflow-hidden border shadow-sm">
            <Table className="min-w-[800px] md:min-w-full">
                <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-[250px]">Cliente</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="hidden md:table-cell">Asesor</TableHead>
                        <TableHead className="hidden lg:table-cell">Fecha Ingreso</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedClients.length > 0 ? (
                        paginatedClients.map(c => (
                            <TableRow key={c.id} className="group hover:bg-muted/30 transition-colors duration-200">
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="text-base font-semibold group-hover:text-primary transition-colors">{c.fullName}</span>
                                        {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-mono text-xs bg-background/50 backdrop-blur-sm whitespace-nowrap">{c.documentType} {c.documentId}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(c.serviceStatus)}>{c.serviceStatus}</Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{c.assignedAdvisor}</TableCell>
                                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{c.entryDate}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30" onClick={() => handleShowCredentials(c)} title="Ver Accesos">
                                            <KeyRound className="h-4 w-4"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30" onClick={() => navigate('/app/documentos', { state: { clientId: c.id } })} title="Generar Documentos">
                                            <FileText className="h-4 w-4"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30" onClick={() => handleEdit(c)} title="Editar">
                                            <Edit className="h-4 w-4"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={() => handleDeleteWrapper(c.id)} title="Eliminar">
                                            <Trash2 className="h-4 w-4"/>
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
                                    <Button variant="link" onClick={clearFilters}>Limpiar filtros</Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            
            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t gap-4">
                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                        Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)} de {filteredClients.length} clientes
                    </div>
                    <div className="flex items-center gap-2 justify-center sm:justify-end">
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

        {/* Pass entities to ClientFormDialog */}
        <ClientFormDialog 
            isOpen={isClientModalOpen} 
            onOpenChange={setIsClientModalOpen} 
            onSave={handleSaveClientWrapper} 
            client={editingClient} 
            advisors={advisors} 
            entities={entities} 
        />
        <AdvisorManagerDialog isOpen={isAdvisorModalOpen} onOpenChange={setIsAdvisorModalOpen} advisors={advisors} onSave={handleSaveAdvisors} />
        <EntityManagerDialog isOpen={isEntityModalOpen} onOpenChange={setIsEntityModalOpen} onSave={handleSaveEntities} allEntities={entities} />
        <ClientCredentialsDialog isOpen={isCredentialsModalOpen} onOpenChange={setIsCredentialsModalOpen} client={credentialsClient} entities={entities} />
    </PageLayout>
  );
};
