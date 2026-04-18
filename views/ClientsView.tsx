
import { useState, useMemo, useCallback, useRef, type ChangeEvent, useEffect } from 'react';
import { UserCog, Building, PlusCircle, Search, FileText, Trash2, Filter, Users, Clock, CheckCircle, ChevronLeft, ChevronRight, X, Download, Upload, KeyRound, Wrench, ClipboardList, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { useAppStore } from '../lib/store';
import { useClientOperations } from '../hooks/useClientOperations';
import { PageLayout } from '../components/layout/Layout';
import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/Shared';
import { EntityManagerDialog, AdvisorManagerDialog, ClientFormDialog, ClientCredentialsDialog } from '../components/features/Dialogs';
import { ClientProfileSheet } from '../components/features/ClientProfileSheet';
import { QuickImportDialog } from '../components/features/QuickImportDialog';
import { Client, Advisor, Entity, ClientWithMultiple } from '../lib/types';
import { serviceStatuses } from '../lib/constants';
import { CLIENT_STATUS_META, CLIENT_STATUS, CLIENT_CSV_COLUMNS } from '../lib/crm-states';
import { useToast } from '../hooks/use-toast';
import { debounce, normalizeString, formatCurrency } from '../lib/utils'; 

const ITEMS_PER_PAGE = 10;

const getStatusBadgeVariant = (status: string) => {
    const meta = CLIENT_STATUS_META[status];
    if (meta) {
        // Map the colors from meta to badge variants
        switch (meta.color) {
            case 'green': return 'success';
            case 'teal': return 'success';
            case 'amber': return 'warning';
            case 'red': return 'destructive';
            case 'coral': return 'destructive';
            case 'blue': return 'info';
            case 'purple': return 'default'; // or a custom VIP color if available
            case 'pink': return 'secondary';
            case 'gray': return 'secondary';
            default: return 'secondary';
        }
    }
    
    // Legacy fallback
    switch (status.toLowerCase()) {
        case 'activo': return 'success';
        case 'en trámite': return 'info';
        case 'mora': return 'destructive';
        case 'documentación pendiente': return 'warning';
        case 'retirado': return 'secondary';
        default: return 'secondary';
    }
};

const getStatusLabel = (status: string) => {
    return CLIENT_STATUS_META[status]?.label || status;
};

export const ClientsView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Store Global
  const { clients, advisors, entities, transactions, setAdvisors, setEntities, updateClient } = useAppStore();

  // Hook Controlador
  const { saveClient, deleteClient, repairClient } = useClientOperations();

  
  // Hooks
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Profile Sheet
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [profileClient, setProfileClient] = useState<Client | null>(null);

  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [credentialsClient, setCredentialsClient] = useState<Client | null>(null);
  
  // NEW: Quick Import
  const [isQuickImportOpen, setIsQuickImportOpen] = useState(false);

  // NEW: Repair Mode State
  const [isRepairMode, setIsRepairMode] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [advisorFilter, setAdvisorFilter] = useState<string>('all');
  const [debtFilter, setDebtFilter] = useState<'all' | 'debtors' | 'current'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
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

  const availableServices = useMemo(() => {
    const services = new Set<string>();
    clients.forEach(c => c.contractedServices?.forEach(s => services.add(s)));
    return Array.from(services).sort();
  }, [clients]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = normalizeString(debouncedSearchTerm);
    
    let result = clients.map(c => {
        // Calculate dynamic LTV for each client
        const clientIncome = transactions
            .filter(t => t.clientId === c.id && t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return {
            ...c,
            calculatedLtv: clientIncome || c.ltv || 0
        };
    }).filter(c => {
        const matchesSearch = !normalizedSearch || 
            normalizeString(c.fullName).includes(normalizedSearch) || 
            c.documentId.includes(normalizedSearch);
        const matchesStatus = statusFilter === 'all' || c.serviceStatus === statusFilter;
        const matchesAdvisor = advisorFilter === 'all' || c.assignedAdvisor === advisorFilter;
        
        const matchesDebt = debtFilter === 'all' 
            ? true 
            : (debtFilter === 'debtors' ? (c.balance || 0) > 0 : (c.balance || 0) <= 0);
            
        const matchesService = serviceFilter === 'all' 
            || (c.contractedServices && c.contractedServices.includes(serviceFilter));
            
        return matchesSearch && matchesStatus && matchesAdvisor && matchesDebt && matchesService;
    });

    result.sort((a, b) => {
        if (sortOrder === 'name') return a.fullName.localeCompare(b.fullName);
        const dateA = new Date(a.entryDate).getTime();
        const dateB = new Date(b.entryDate).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [clients, transactions, debouncedSearchTerm, statusFilter, advisorFilter, debtFilter, serviceFilter, sortOrder]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const totalBalance = clients.reduce((sum, c) => sum + (c.balance || 0), 0);
    return {
        total: clients.length,
        active: clients.filter(c => c.serviceStatus === 'Activo').length,
        pending: clients.filter(c => ['En trámite', 'Documentación pendiente'].includes(c.serviceStatus)).length,
        receivable: totalBalance
    };
  }, [clients]);

  // --- Handlers ---
  const handleOpenProfile = (client: Client) => {
      setProfileClient(client);
      setIsProfileSheetOpen(true);
  };

  const handleCreate = () => {
      setEditingClient(null);
      setIsRepairMode(false);
      setIsClientModalOpen(true);
  };

  const handleRepairClick = (client: Client) => {
      setIsProfileSheetOpen(false);
      setEditingClient(client);
      setIsRepairMode(true);
      setIsClientModalOpen(true);
  };

  const handleShowCredentials = (client: Client) => {
      setIsProfileSheetOpen(false);
      setCredentialsClient(client);
      setIsCredentialsModalOpen(true);
  };

  const handleSaveClientWrapper = (saveData: ClientWithMultiple) => {
    let success = false;
    
    if (isRepairMode && editingClient) {
        // En modo reparación, llamamos a la función específica
        success = repairClient(editingClient.id, saveData.client);
    } else {
        // Modo normal (Crear)
        success = saveClient(saveData);
    }

    if (success) {
        setIsClientModalOpen(false); 
        setEditingClient(null);
        setIsRepairMode(false);
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
      
      const csvData = filteredClients.map(c => {
          const row: any = {};
          CLIENT_CSV_COLUMNS.forEach(col => {
              if (col.key === 'serviceStatus') {
                  row[col.label] = getStatusLabel(c.serviceStatus);
              } else if (col.key === 'contractedServices') {
                  row[col.label] = c.contractedServices?.join(';') || '';
              } else if (col.key === 'id') {
                  row[col.label] = (c.id && String(c.id) !== 'undefined') ? c.id : crypto.randomUUID();
              } else if (col.key === 'entryDate') {
                  row[col.label] = c.entryDate;
              } else {
                  row[col.label] = (c as any)[col.key] || '';
              }
          });
          return row;
      });

      const csvContent = Papa.unparse(csvData, { delimiter: ";" });
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `clientes_cfbnd_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
  };

  const getStatusKeyFromLabel = (label: string) => {
      const entry = Object.entries(CLIENT_STATUS_META).find(
          ([key, meta]) => meta.label.toLowerCase() === label.toLowerCase() || key.toLowerCase() === label.toLowerCase()
      );
      if (entry) return entry[0];
      
      const lower = label.toLowerCase();
      if (lower === 'contacto inicial') return CLIENT_STATUS.INITIAL_CONTACT;
      if (lower === 'prospecto') return CLIENT_STATUS.PROSPECT;
      if (lower === 'activo' || lower === 'activo - al día' || lower === 'activo — al día') return CLIENT_STATUS.ACTIVE_CURRENT;
      if (lower === 'mora' || lower === 'con deuda / moroso') return CLIENT_STATUS.DEBTOR;
      if (lower === 'suspendido') return CLIENT_STATUS.SUSPENDED;
      if (lower === 'retirado') return CLIENT_STATUS.CHURNED;
      if (lower.includes('trámite') || lower.includes('pendiente')) return CLIENT_STATUS.INITIAL_CONTACT;
      
      return CLIENT_STATUS.INITIAL_CONTACT;
  };

  const processCSVData = (csvText: string) => {
      Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
              let parsedData = results.data;
              const headers = results.meta.fields || [];
              
              // Phase 3: Robust Header Matching (Insensitive & Normalized)
              const headerMap: Record<string, string> = {}; // actualHeader -> targetKey
              
              headers.forEach(actualHeader => {
                  const normalizedActual = normalizeString(actualHeader);
                  const matchingCol = CLIENT_CSV_COLUMNS.find(col => 
                      normalizeString(col.label) === normalizedActual || 
                      normalizeString(col.key) === normalizedActual
                  );
                  if (matchingCol) {
                      headerMap[actualHeader] = matchingCol.key;
                  }
              });

              try {
                  const importedClients: Client[] = parsedData.map((row: any) => {
                      const client: any = {
                          beneficiaries: [],
                          credentials: []
                      };
                      
                      // Phase 3: Map data using the headerMap and sanitize
                      Object.entries(row).forEach(([actualHeader, val]) => {
                          const key = headerMap[actualHeader];
                          if (!key) return;

                          let value = val !== undefined ? String(val).trim() : '';

                          if (key === 'serviceStatus') {
                              client.serviceStatus = getStatusKeyFromLabel(value);
                          } else if (key === 'contractedServices') {
                              client.contractedServices = value ? value.split(';') : [];
                          } else if (key === 'documentId') {
                              // Phase 3: Document Sanitization (remove dots, commas, spaces)
                              client.documentId = value.replace(/[.,\s]/g, '');
                          } else if (['adminCost', 'referralCommissionAmount', 'discountPercentage', 'advisorCommissionAmount', 'advisorCommissionPercentage', 'ltv', 'balance'].includes(key)) {
                              // Sanitize monetary/numeric values
                              client[key] = value ? Number(value.replace(/[^0-9.-]/g, '')) : 0;
                          } else if (key === 'id') {
                              client.id = (value && value !== 'undefined') ? value : crypto.randomUUID();
                          } else if (key === 'entryDate') {
                              client.entryDate = value || new Date().toISOString().split('T')[0];
                          } else {
                              client[key] = value;
                          }
                      });

                      // Fallback for missing ID or mandatory fields
                      if (!client.id) client.id = crypto.randomUUID();
                      
                      return client as Client;
                  });

                  // Usar el hook para guardar masivamente
                  saveClient({
                      client: importedClients[0], // Dummy
                      addMultiple: (currentClients, currentAdvisors) => {
                          const mergedClients = [...currentClients];
                          const mergedAdvisors = [...currentAdvisors];
                          let added = 0;
                          let updated = 0;
                          let newAdvisorsCount = 0;

                          importedClients.forEach(newClient => {
                              if (!newClient.fullName || !newClient.documentId) return;
                              
                              // Advisor Auto-creation Logic
                              if (newClient.assignedAdvisor) {
                                  const advisorNameNorm = normalizeString(newClient.assignedAdvisor);
                                  const advisorExists = mergedAdvisors.some(a => normalizeString(a.name) === advisorNameNorm);
                                  if (!advisorExists) {
                                      mergedAdvisors.push({
                                          id: crypto.randomUUID(),
                                          name: newClient.assignedAdvisor,
                                          commissionType: 'percentage',
                                          commissionValue: 0,
                                          phone: '',
                                          email: '',
                                          paymentDetails: ''
                                      });
                                      newAdvisorsCount++;
                                  }
                              }

                              // Phase 3: Improved Duplicity Check (sanitized documentId)
                              const cleanDoc = String(newClient.documentId).replace(/[.,\s]/g, '');
                              const existingIndex = mergedClients.findIndex(c => 
                                  String(c.documentId).replace(/[.,\s]/g, '') === cleanDoc
                              );
                              
                              if (existingIndex >= 0) {
                                  // Update existing
                                  const existingId = mergedClients[existingIndex].id;
                                  mergedClients[existingIndex] = {
                                      ...mergedClients[existingIndex],
                                      ...newClient,
                                      id: (existingId && existingId !== 'undefined') ? existingId : newClient.id,
                                      // Preserve arrays if they are empty in CSV but have data in DB
                                      beneficiaries: mergedClients[existingIndex].beneficiaries || newClient.beneficiaries || [],
                                      credentials: mergedClients[existingIndex].credentials || newClient.credentials || []
                                  };
                                  updated++;
                              } else {
                                  // Add new
                                  mergedClients.push(newClient);
                                  added++;
                              }
                          });

                          if (newAdvisorsCount > 0) {
                              toast({ title: "Asesores creados", description: `Se crearon ${newAdvisorsCount} nuevos asesores.` });
                          }
                          
                          toast({ title: "Importación completada", description: `Agregados: ${added}, Actualizados: ${updated}` });

                          return { updatedClients: mergedClients, updatedAdvisors: mergedAdvisors };
                      }
                  });

              } catch (error) {
                  console.error("Error importando datos:", error);
                  toast({ variant: "destructive", title: "Error de importación", description: "Los datos no tienen el formato correcto." });
              }
          },
          error: (error: any) => {
              console.error("PapaParse error:", error);
              toast({ variant: "destructive", title: "Error de lectura", description: "No se pudieron procesar los datos." });
          }
      });
  };

  const handleImportCSV = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const csvText = event.target?.result as string;
          processCSVData(csvText);
      };
      reader.readAsText(file);
      
      e.target.value = ''; // Reset input
  };

  const clearFilters = () => {
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setStatusFilter('all');
      setAdvisorFilter('all');
      setDebtFilter('all');
      setServiceFilter('all');
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
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto" title="Importar/Exportar CSV">
                            <Download className="mr-2 h-4 w-4"/> CSV
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
                            <Download className="mr-2 h-4 w-4" /> Exportar CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" /> Importar CSV (Archivo)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsQuickImportOpen(true)} className="cursor-pointer">
                            <ClipboardList className="mr-2 h-4 w-4" /> Pegar Datos (Texto)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />

                <Button className="w-full sm:w-auto shadow-lg shadow-primary/20" onClick={handleCreate}><PlusCircle className="mr-2 h-4 w-4"/> Nuevo Cliente</Button>
            </div>
        }
    >
        <QuickImportDialog 
            open={isQuickImportOpen} 
            onOpenChange={setIsQuickImportOpen} 
            onImport={processCSVData} 
        />
        {/* STATS DASHBOARD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
            <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/10 border-rose-100 dark:border-rose-900">
                <CardContent className="p-6 flex items-center justify-between">
                    <div><p className="text-sm font-medium text-rose-600 dark:text-rose-400">Cartera por Cobrar</p><h3 className="text-3xl font-bold mt-1">{formatCurrency(stats.receivable)}</h3></div>
                    <div className="h-12 w-12 bg-white/50 dark:bg-rose-900/50 rounded-2xl flex items-center justify-center shadow-sm"><div className="h-6 w-6 flex items-center justify-center font-bold text-rose-600 dark:text-rose-400">$</div></div>
                </CardContent>
            </Card>
        </div>

        {/* FILTER BAR - DYNAMIC & CLEAN */}
        <div className="bg-card p-4 rounded-xl border shadow-sm mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Primary Search */}
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                        id="search-clients"
                        name="search"
                        autoComplete="off"
                        placeholder="Buscar por nombre o documento..." 
                        className="pl-10 bg-background/50 h-11" 
                        value={searchTerm} 
                        onChange={handleSearchChange} 
                    />
                </div>

                {/* Sort Order - Always Visible */}
                <div className="w-full md:w-[180px]">
                    <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                        <SelectTrigger className="h-11 bg-background/50">
                            <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Más recientes</SelectItem>
                            <SelectItem value="oldest">Más antiguos</SelectItem>
                            <SelectItem value="name">Nombre (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Dynamic Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dashed border-muted">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2">Filtros:</span>
                
                {/* Advisor Chip/Selector */}
                {advisorFilter !== 'all' && (
                    <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full px-1 pl-3 h-8 animate-in fade-in zoom-in duration-200">
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300 mr-2 flex items-center gap-1">
                            <UserCog className="w-3 h-3" /> Asesor:
                        </span>
                        <Select value={advisorFilter} onValueChange={(v: string) => { setAdvisorFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger className="h-6 border-none bg-transparent p-0 px-1 text-xs font-bold text-blue-900 dark:text-blue-100 focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Eliminar</SelectItem>
                                {advisors.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full ml-1 hover:bg-blue-200 dark:hover:bg-blue-800" onClick={() => setAdvisorFilter('all')}>
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                {/* Status Chip/Selector */}
                {statusFilter !== 'all' && (
                    <div className="flex items-center bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-full px-1 pl-3 h-8 animate-in fade-in zoom-in duration-200">
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300 mr-2 flex items-center gap-1">
                            <Filter className="w-3 h-3" /> Estado:
                        </span>
                        <Select value={statusFilter} onValueChange={(v: string) => { setStatusFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger className="h-6 border-none bg-transparent p-0 px-1 text-xs font-bold text-purple-900 dark:text-purple-100 focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Eliminar</SelectItem>
                                {serviceStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full ml-1 hover:bg-purple-200 dark:hover:bg-purple-800" onClick={() => setStatusFilter('all')}>
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                {/* Debt Chip/Selector */}
                {debtFilter !== 'all' && (
                    <div className="flex items-center bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-full px-1 pl-3 h-8 animate-in fade-in zoom-in duration-200">
                        <span className="text-xs font-medium text-rose-700 dark:text-rose-300 mr-2 flex items-center gap-1">
                            <ClipboardList className="w-3 h-3" /> Pago:
                        </span>
                        <Select value={debtFilter} onValueChange={(v: any) => { setDebtFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger className="h-6 border-none bg-transparent p-0 px-1 text-xs font-bold text-rose-900 dark:text-rose-100 focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Eliminar</SelectItem>
                                <SelectItem value="debtors">Con Deuda</SelectItem>
                                <SelectItem value="current">Al Día</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full ml-1 hover:bg-rose-200 dark:hover:bg-rose-800" onClick={() => setDebtFilter('all')}>
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                {/* Service Chip/Selector */}
                {serviceFilter !== 'all' && (
                    <div className="flex items-center bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full px-1 pl-3 h-8 animate-in fade-in zoom-in duration-200">
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mr-2 flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Servicio:
                        </span>
                        <Select value={serviceFilter} onValueChange={(v: string) => { setServiceFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger className="h-6 border-none bg-transparent p-0 px-1 text-xs font-bold text-emerald-900 dark:text-emerald-100 focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Eliminar</SelectItem>
                                {availableServices.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full ml-1 hover:bg-emerald-200 dark:hover:bg-emerald-800" onClick={() => setServiceFilter('all')}>
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                {/* Add Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 rounded-full border-dashed gap-1 text-muted-foreground hover:text-primary hover:border-primary transition-all">
                            <Plus className="w-3 h-3" /> Agregar Filtro
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        {statusFilter === 'all' && <DropdownMenuItem onClick={() => setStatusFilter(serviceStatuses[0])}>Estado de Servicio</DropdownMenuItem>}
                        {advisorFilter === 'all' && <DropdownMenuItem onClick={() => { if(advisors.length > 0) setAdvisorFilter(advisors[0].name) }}>Asesor Asignado</DropdownMenuItem>}
                        {debtFilter === 'all' && <DropdownMenuItem onClick={() => setDebtFilter('debtors')}>Estado de Deuda</DropdownMenuItem>}
                        {serviceFilter === 'all' && <DropdownMenuItem onClick={() => { if(availableServices.length > 0) setServiceFilter(availableServices[0]) }}>Servicio Específico</DropdownMenuItem>}
                        {statusFilter !== 'all' && advisorFilter !== 'all' && debtFilter !== 'all' && serviceFilter !== 'all' && (
                            <DropdownMenuItem disabled className="text-xs text-muted-foreground">Todos los filtros activos</DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {(searchTerm || statusFilter !== 'all' || advisorFilter !== 'all' || debtFilter !== 'all' || serviceFilter !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground hover:text-destructive">
                        Limpiar Todo
                    </Button>
                )}
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
                        <TableHead className="hidden md:table-cell">Finanzas</TableHead>
                        <TableHead className="hidden md:table-cell">Asesor</TableHead>
                        <TableHead className="hidden lg:table-cell">Fecha Ingreso</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedClients.length > 0 ? (
                        paginatedClients.map(c => (
                            <TableRow key={c.id} className="group hover:bg-muted/30 transition-colors duration-200 cursor-pointer" onClick={() => handleOpenProfile(c)}>
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
                                    <Badge variant={getStatusBadgeVariant(c.serviceStatus)}>{getStatusLabel(c.serviceStatus)}</Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 block" title="Lifetime Value (Total Ingresado)">
                                            LTV: {formatCurrency(c.calculatedLtv)}
                                        </span>
                                        {(c.balance && c.balance > 0) ? (
                                            <span className="text-xs text-destructive flex items-center gap-1 font-semibold" title="Saldo Pendiente de Pago">
                                                Deuda: {formatCurrency(c.balance)}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground/70" title="Cliente al día con sus pagos">Al día</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{c.assignedAdvisor}</TableCell>
                                <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{c.entryDate}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30" onClick={() => handleShowCredentials(c)} title="Ver Accesos">
                                            <KeyRound className="h-4 w-4"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30" onClick={() => navigate('/app/documentos', { state: { clientId: c.id } })} title="Generar Documentos">
                                            <FileText className="h-4 w-4"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30" onClick={() => handleRepairClick(c)} title="Reparar Registro">
                                            <Wrench className="h-4 w-4"/>
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
        <ClientProfileSheet
            isOpen={isProfileSheetOpen}
            onOpenChange={setIsProfileSheetOpen}
            client={profileClient}
            onEdit={handleRepairClick}
            onDocuments={(client) => {
                setIsProfileSheetOpen(false);
                navigate('/app/documentos', { state: { clientId: client.id } });
            }}
            onCredentials={handleShowCredentials}
        />

        <ClientFormDialog 
            isOpen={isClientModalOpen} 
            onOpenChange={setIsClientModalOpen} 
            onSave={handleSaveClientWrapper} 
            client={editingClient} 
            advisors={advisors} 
            entities={entities} 
            isRepairMode={isRepairMode}
        />
        <AdvisorManagerDialog isOpen={isAdvisorModalOpen} onOpenChange={setIsAdvisorModalOpen} advisors={advisors} onSave={handleSaveAdvisors} />
        <EntityManagerDialog isOpen={isEntityModalOpen} onOpenChange={setIsEntityModalOpen} onSave={handleSaveEntities} allEntities={entities} />
        <ClientCredentialsDialog isOpen={isCredentialsModalOpen} onOpenChange={setIsCredentialsModalOpen} client={credentialsClient} entities={entities} />
    </PageLayout>
  );
};
