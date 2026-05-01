import React, { useState, useMemo } from 'react';
import { PageLayout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Tabs, TabsList, TabsTrigger, Button, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Shared';
import { Plus, Wallet, ArrowUpRight, ArrowDownRight, Activity, CalendarDays, Printer, Loader2 } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { TransactionFormDialog, AccountFormDialog, CategoryFormDialog } from '../components/features/Dialogs';
import { FinancialReportTemplate } from '../components/features/FinancialReportTemplate';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { saveTransactionWithAccountBalance } from '../lib/db';
import { formatCurrency } from '../lib/utils';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '../hooks/use-toast';

export const FinanceView = () => {
    const { 
        clients, accounts, transactions, categories, invoices, catalogServices,
        addTransaction, updateTransaction, updateAccount,
        addAccount, addCategory, updateCategory
    } = useAppStore();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState<'current_month' | 'last_month' | 'year' | 'all'>('current_month');

    // Modals state
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [editingAccount, setEditingAccount] = useState<any>(null);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [initialTransactionType, setInitialTransactionType] = useState<'INCOME' | 'EXPENSE'>('INCOME');

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            if (dateRange === 'current_month') {
                return tDate >= startOfMonth(now) && tDate <= endOfMonth(now);
            }
            if (dateRange === 'last_month') {
                const prev = subMonths(now, 1);
                return tDate >= startOfMonth(prev) && tDate <= endOfMonth(prev);
            }
            if (dateRange === 'year') {
                return tDate >= startOfYear(now) && tDate <= endOfYear(now);
            }
            return true;
        }).sort((a, b) => b.date - a.date);
    }, [transactions, dateRange]);

    const {
        totalIncome,
        totalExpense,
        netFlow,
        accountsReceivable
    } = useMemo(() => {
        let tIncome = 0;
        let tExpense = 0;

        filteredTransactions.forEach(t => {
            if (t.type === 'INCOME') tIncome += t.amount;
            if (t.type === 'EXPENSE') tExpense += t.amount;
        });

        // Cuentas por cobrar: Facturas pendientes
        const pendingInvoicesTotal = invoices
            .filter(i => i.status === 'Pendiente')
            .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

        return {
            totalIncome: tIncome,
            totalExpense: tExpense,
            netFlow: tIncome - tExpense,
            accountsReceivable: pendingInvoicesTotal
        };
    }, [filteredTransactions, invoices]);

    const salesByCategoryData = useMemo(() => {
        const categoryMap: { [key: string]: { name: string, value: number, color: string } } = {};
        
        filteredTransactions.filter(t => t.type === 'INCOME').forEach(t => {
            let catName = 'Otros Ingresos';
            let catColor = '#94a3b8'; // slate-400

            // Si viene de una factura, buscar en catalogServices
            if (t.description.includes('Pago Factura') && t.documentId) {
                const doc = invoices.find(i => i.id === t.documentId);
                if (doc && doc.items) {
                    // Try to match items with catalog
                    doc.items.forEach(item => {
                        const matchedSvc = catalogServices.find(s => s.name === item.description);
                        const cName = matchedSvc ? (matchedSvc.category || matchedSvc.name) : 'Ventas Generales';
                        
                        if (!categoryMap[cName]) {
                            categoryMap[cName] = { name: cName, value: 0, color: `#${Math.floor(Math.random()*16777215).toString(16)}` };
                        }
                        categoryMap[cName].value += item.total;
                    });
                    return; // Skip default addition
                }
            } else if (t.categoryId) {
                const c = categories.find(cat => cat.id === t.categoryId);
                if (c) {
                    catName = c.name;
                    if (c.color) catColor = c.color;
                }
            }

            if (!categoryMap[catName]) {
                const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];
                categoryMap[catName] = { 
                    name: catName, 
                    value: 0, 
                    color: catName === 'Otros Ingresos' ? catColor : COLORS[Object.keys(categoryMap).length % COLORS.length]
                };
            }
            categoryMap[catName].value += t.amount;
        });

        return Object.values(categoryMap).sort((a, b) => b.value - a.value);
    }, [filteredTransactions, categories, invoices, catalogServices]);

    const handleCreateTransaction = (type: 'INCOME' | 'EXPENSE') => {
        setEditingTransaction(null);
        setInitialTransactionType(type);
        setIsTransactionModalOpen(true);
    };

    const handleEditTransaction = (transaction: any) => {
        setEditingTransaction(transaction);
        setIsTransactionModalOpen(true);
    };

    const handleSaveTransaction = async (transaction: any) => {
        try {
            // Validation
            if (transaction.type === 'TRANSFER' && (!transaction.sourceAccountId || !transaction.destinationAccountId)) {
                toast({ variant: 'destructive', title: 'Error', description: 'Cuentas de origen y destino requeridas para transferencia.' });
                return;
            }
            if (transaction.type !== 'TRANSFER' && !transaction.sourceAccountId) {
                toast({ variant: 'destructive', title: 'Error', description: 'Cuenta requerida.' });
                return;
            }

            // Map to track net change per account
            const accountChanges = new Map<string, number>();
            const applyChange = (accountId: string | undefined, change: number) => {
                if (accountId && accountId !== 'accounts-receivable-system-id') {
                    accountChanges.set(accountId, (accountChanges.get(accountId) || 0) + change);
                }
            };

            // Revert editingTransaction changes
            if (editingTransaction) {
                if (editingTransaction.type === 'INCOME') applyChange(editingTransaction.sourceAccountId, -editingTransaction.amount);
                if (editingTransaction.type === 'EXPENSE') applyChange(editingTransaction.sourceAccountId, editingTransaction.amount);
                if (editingTransaction.type === 'TRANSFER') {
                    applyChange(editingTransaction.sourceAccountId, editingTransaction.amount);
                    applyChange(editingTransaction.destinationAccountId, -editingTransaction.amount);
                }
            }

            // Apply new transaction changes
            if (transaction.type === 'INCOME') applyChange(transaction.sourceAccountId, transaction.amount);
            if (transaction.type === 'EXPENSE') applyChange(transaction.sourceAccountId, -transaction.amount);
            if (transaction.type === 'TRANSFER') {
                applyChange(transaction.sourceAccountId, -transaction.amount);
                applyChange(transaction.destinationAccountId, transaction.amount);
            }

            // Update Zustand Store for Transaction
            if (!editingTransaction) {
                addTransaction(transaction);
            } else {
                updateTransaction(transaction);
            }

            // Update Zustand Store for Accounts
            let accountsUpdated = 0;
            for (let [accountId, change] of accountChanges.entries()) {
                if (change !== 0) {
                    const acc = accounts.find(a => a.id === accountId);
                    if (acc) {
                        updateAccount({ ...acc, balance: acc.balance + change });
                        accountsUpdated++;
                    }
                }
            }

            toast({
                title: editingTransaction ? "Transacción Actualizada" : "Transacción Registrada",
                description: `Se actualizó la contabilidad (${accountsUpdated} cuenta(s) modificada(s)).`,
            });
            
        } catch (error) {
           toast({
               variant: 'destructive',
               title: "Error de Integridad",
               description: "No se pudo asegurar la transacción.",
           });
        }
    };

    // Account & Category Logic
    const handleCreateAccount = () => { setEditingAccount(null); setIsAccountModalOpen(true); };
    const handleEditAccount = (account: any) => { setEditingAccount(account); setIsAccountModalOpen(true); };
    const handleSaveAccount = (account: any) => { editingAccount ? updateAccount(account) : addAccount(account); };

    const handleCreateCategory = () => { setEditingCategory(null); setIsCategoryModalOpen(true); };
    const handleEditCategory = (category: any) => { setEditingCategory(category); setIsCategoryModalOpen(true); };
    const handleSaveCategory = (category: any) => { editingCategory ? updateCategory(category) : addCategory(category); };

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const reportRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = async () => {
        try {
            setIsGeneratingPDF(true);
            toast({ title: 'Generando Informe', description: 'Por favor, espere un momento...' });
            
            const element = reportRef.current;
            if (!element) return;

            // Pause for rendering
            await new Promise(resolve => setTimeout(resolve, 500));

            const htmlToImage = await import('html-to-image');
            const jsPDF = (await import('jspdf')).default;

            const pages = element.querySelectorAll('.pdf-page');
            
            if (pages.length > 0) {
                 const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [816, 1056]
                });
                
                for(let i=0; i<pages.length; i++) {
                     if (i > 0) pdf.addPage();
                     const pageEl = pages[i] as HTMLElement;
                     const dataUrl = await htmlToImage.toPng(pageEl, { 
                         quality: 0.95, 
                         backgroundColor: '#ffffff',
                         pixelRatio: 2,
                         filter: (node) => {
                             if (node.tagName === 'LINK' && (node as HTMLLinkElement).href && (node as HTMLLinkElement).href.includes('font-awesome')) {
                                 return false;
                             }
                             return true;
                         }
                     });
                     pdf.addImage(dataUrl, 'PNG', 0, 0, 816, 1056);
                }
                pdf.save(`Resumen-Financiero-${dateRange}-${new Date().toISOString().split('T')[0]}.pdf`);
                
                toast({ title: 'PDF Generado', description: 'El resumen se ha descargado correctamente.' });
            } else {
                 toast({ variant: 'destructive', title: 'Error', description: 'No se encontraron páginas para generar.' });
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el PDF: ' + error.message });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <PageLayout title="Dashboard Financiero" subtitle="Partida Doble: Control y crecimiento" onBackRoute="/app/dashboard">
            <style>{`
                @media print {
                    nav, header, aside, [role="tablist"], button { display: none !important; }
                    .page-content { padding: 0 !important; margin: 0 !important; }
                    .print-only { display: block !important; }
                    .recharts-wrapper { width: 100% !important; height: auto !important; }
                    body { background: white; color: black; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .dashboard-tabs-content { display: block !important; }
                }
            `}</style>

            <div className="hidden print:block print:mb-8 border-b pb-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Resumen Financiero</h1>
                        <p className="text-xl text-gray-500 mt-2">Periodo: {dateRange === 'current_month' ? 'Mes Actual' : dateRange === 'last_month' ? 'Mes Anterior' : dateRange === 'year' ? 'Este Año' : 'Histórico Total'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-gray-400">FECHA DE GENERACIÓN</p>
                        <p className="text-lg text-gray-800">{format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
                 <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => handleCreateTransaction('INCOME')}><Plus className="w-4 h-4 mr-2"/> Registrar Ingreso</Button>
                    <Button variant="outline" onClick={() => handleCreateTransaction('EXPENSE')}><Plus className="w-4 h-4 mr-2"/> Registrar Gasto</Button>
                 </div>
                 
                 <div className="w-full sm:w-auto flex items-center gap-2 flex-wrap">
                    <Button variant="secondary" onClick={handlePrint} disabled={isGeneratingPDF}>
                        {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Printer className="w-4 h-4 mr-2"/>} 
                        Resumen PDF
                    </Button>
                    <CalendarDays className="w-4 h-4 text-muted-foreground ml-2" />
                    <Select value={dateRange} onValueChange={(val: any) => setDateRange(val)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Periodo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="current_month">Mes Actual</SelectItem>
                            <SelectItem value="last_month">Mes Anterior</SelectItem>
                            <SelectItem value="year">Este Año</SelectItem>
                            <SelectItem value="all">Historico Total</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-background border p-1 rounded-lg">
                    <TabsTrigger value="overview">Visión Analítica</TabsTrigger>
                    <TabsTrigger value="ledger">Libro Mayor</TabsTrigger>
                    <TabsTrigger value="accounts">Cuentas</TabsTrigger>
                    <TabsTrigger value="categories">Categorías</TabsTrigger>
                </TabsList>

                {activeTab === 'overview' && (
                    <div id="report-metrics-container" className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 p-4 bg-background">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-br from-emerald-500/10 via-background border-emerald-500/20">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-emerald-700 dark:text-emerald-400 font-medium">Ingresos Totales ({dateRange === 'current_month' ? 'Mes' : dateRange === 'last_month' ? 'Mes Pasado' : dateRange === 'year' ? 'Año' : 'Histórico'})</CardDescription>
                                <CardTitle className="text-4xl font-bold text-emerald-600 flex items-center justify-between">
                                    {formatCurrency(totalIncome)}
                                    <ArrowUpRight className="h-6 w-6 opacity-50" />
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-amber-500/10 via-background border-amber-500/20">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-amber-700 dark:text-amber-400 font-medium">Cuentas por Cobrar (Facturas)</CardDescription>
                                <CardTitle className="text-4xl font-bold text-amber-600 flex items-center justify-between">
                                    {formatCurrency(accountsReceivable)}
                                    <Activity className="h-6 w-6 opacity-50" />
                                </CardTitle>
                            </CardHeader>
                        </Card>

                        <Card className="bg-background relative overflow-hidden">
                            <div className={`absolute right-0 top-0 bottom-0 w-2 ${netFlow >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <CardHeader className="pb-2">
                                <CardDescription>Flujo de Caja Real</CardDescription>
                                <CardTitle className={`text-4xl font-bold flex items-center justify-between ${netFlow >= 0 ? 'text-primary' : 'text-red-600'}`}>
                                    {formatCurrency(netFlow)}
                                    <Wallet className="h-6 w-6 opacity-20" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mt-2">Gastos restados en periodo = {formatCurrency(totalExpense)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border shadow-sm">
                            <CardHeader>
                                <CardTitle>Ingresos por Categoría de Catálogo</CardTitle>
                                <CardDescription>Distribución de ventas del periodo actual</CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center items-center mix-blend-multiply dark:mix-blend-normal">
                                {salesByCategoryData.length > 0 ? (
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={salesByCategoryData}
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {salesByCategoryData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip 
                                                    formatter={(value: number) => formatCurrency(value)}
                                                    contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Legend verticalAlign="bottom" height={36}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-72 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg w-full">
                                        <Activity className="h-8 w-8 mb-2 opacity-20"/>
                                        <p>No hay ingresos registrados en este periodo.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Activity Mini-Feed */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Flujo de Movimientos Recientes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {filteredTransactions.slice(0, 5).map(tx => (
                                         <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-muted/30 rounded-lg transition-colors border-b last:border-0 border-dashed">
                                             <div className="flex items-center gap-3">
                                                 <div className={`p-2 rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50' : tx.type === 'TRANSFER' ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/50' : 'bg-red-100 text-red-600 dark:bg-red-950/50'}`}>
                                                     {tx.type === 'INCOME' ? <ArrowUpRight className="h-4 w-4"/> : tx.type === 'TRANSFER' ? <ArrowDownRight className="h-4 w-4 transform rotate-90"/> : <ArrowDownRight className="h-4 w-4"/>}
                                                 </div>
                                                 <div>
                                                     <p className="font-medium text-sm">{tx.description}</p>
                                                     <p className="text-xs text-muted-foreground">{format(new Date(tx.date), "dd/MM/yyyy", { locale: es })}</p>
                                                 </div>
                                             </div>
                                             <div className={`font-semibold text-sm ${tx.type === 'INCOME' ? 'text-emerald-600' : tx.type === 'TRANSFER' ? 'text-blue-600' : 'text-red-600'}`}>
                                                 {tx.type === 'EXPENSE' ? '-' : (tx.type === 'INCOME' ? '+' : '')}{formatCurrency(tx.amount)}
                                             </div>
                                         </div>
                                    ))}
                                    {filteredTransactions.length === 0 && (
                                        <p className="text-center text-muted-foreground text-sm py-4">Sin actividad reciente.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                )}

                {activeTab === 'ledger' && (
                     <Card className="animate-in fade-in slide-in-from-bottom-4">
                        <CardHeader>
                            <CardTitle>Libro Mayor (Auditoria de Transacciones)</CardTitle>
                            <CardDescription>Registro inmutable de todas las entradas y salidas de las cuentas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md overflow-hidden bg-background">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Cuenta(s)</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No se encontraron movimientos registrales.</TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTransactions.map(t => {
                                            const sourceAcc = accounts.find(a => a.id === t.sourceAccountId);
                                            const destAcc = accounts.find(a => a.id === t.destinationAccountId);
                                            
                                            // Handle implicit custom Badge component since 'transfer' might not be a valid variant. We can use style/class.
                                            let badgeVariant = 'outline';
                                            let badgeClass = '';
                                            if (t.type === 'INCOME') {
                                                badgeVariant = 'success';
                                            } else if (t.type === 'EXPENSE') {
                                                badgeVariant = 'destructive';
                                            } else if (t.type === 'TRANSFER') {
                                                badgeClass = 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300';
                                            }

                                            const getAccountName = (acc: any, id: string) => id === 'accounts-receivable-system-id' ? 'Cuentas por Cobrar (Sistema)' : (acc?.name || 'Desconocida');

                                            return (
                                                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/30" onClick={() => handleEditTransaction(t)}>
                                                    <TableCell className="font-mono text-xs">{format(new Date(t.date), "MMM dd, yyyy", { locale: es })}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {t.description}
                                                        {t.documentId && <Badge variant="outline" className="ml-2 text-[10px] h-4">Fac: {t.documentId}</Badge>}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {t.type === 'TRANSFER' ? `${getAccountName(sourceAcc, t.sourceAccountId)} -> ${getAccountName(destAcc, t.destinationAccountId!)}` : getAccountName(sourceAcc, t.sourceAccountId)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={badgeVariant as any} className={`text-[10px] uppercase ${badgeClass}`}>
                                                            {t.type === 'INCOME' ? 'Ingreso' : t.type === 'TRANSFER' ? 'Transf.' : 'Egreso'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className={`text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : t.type === 'TRANSFER' ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {formatCurrency(t.amount)}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'accounts' && (
                    <Card className="animate-in fade-in slide-in-from-bottom-4">
                        <CardHeader>
                             <div className="flex justify-between items-center">
                                <CardTitle>Cuentas Bancarias y Cajas</CardTitle>
                                <Button size="sm" onClick={handleCreateAccount}><Plus className="w-4 h-4 mr-2"/> Añadir Cuenta</Button>
                             </div>
                        </CardHeader>
                        <CardContent>
                             {accounts.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground w-full">
                                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-20"/>
                                    <p>No hay cuentas registradas en el libro.</p>
                                </div>
                             ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                     {accounts.map(account => (
                                         <div key={account.id} className="p-5 border rounded-xl cursor-pointer hover:border-primary/50 hover:shadow-md transition-all bg-gradient-to-br from-card to-muted/10 group" onClick={() => handleEditAccount(account)}>
                                             <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="font-semibold text-lg group-hover:text-primary transition-colors">{account.name}</p>
                                                    <Badge variant="secondary" className="mt-1 font-mono text-[10px]">{account.type}</Badge>
                                                </div>
                                                <Wallet className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                                             </div>
                                             <div className="font-bold text-2xl tracking-tight">
                                                 {formatCurrency(account.balance)}
                                             </div>
                                         </div>
                                     ))}
                                </div>
                             )}
                        </CardContent>
                    </Card>
                )}

                 {activeTab === 'categories' && (
                     <Card className="animate-in fade-in slide-in-from-bottom-4">
                        <CardHeader>
                             <div className="flex justify-between items-center">
                                <CardTitle>Maestro de Categorías</CardTitle>
                                <Button size="sm" onClick={handleCreateCategory}><Plus className="w-4 h-4 mr-2"/> Crear Categoría</Button>
                             </div>
                        </CardHeader>
                        <CardContent>
                             {categories.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground w-full">
                                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-20"/>
                                    <p>Aún no hay categorías de clasificación.</p>
                                </div>
                             ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                     {categories.map(category => (
                                         <div key={category.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleEditCategory(category)}>
                                             <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: category.color || '#cbd5e1' }}></div>
                                             <div className="flex-1">
                                                 <p className="font-medium text-sm">{category.name}</p>
                                                 <p className="text-xs text-muted-foreground">{category.type}</p>
                                             </div>
                                         </div>
                                     ))}
                                </div>
                             )}
                        </CardContent>
                     </Card>
                 )}
            </Tabs>

            {isTransactionModalOpen && (
                <TransactionFormDialog 
                    isOpen={isTransactionModalOpen} 
                    onOpenChange={setIsTransactionModalOpen} 
                    onSave={handleSaveTransaction} 
                    item={editingTransaction}
                    initialType={initialTransactionType}
                    accounts={[{ id: 'accounts-receivable-system-id', name: 'Cuentas por Cobrar (Sistema)' }, ...accounts]}
                    categories={categories}
                    clients={clients}
                />
            )}

            {isAccountModalOpen && (
                <AccountFormDialog 
                    isOpen={isAccountModalOpen} 
                    onOpenChange={setIsAccountModalOpen} 
                    onSave={handleSaveAccount} 
                    item={editingAccount} 
                />
            )}

            {isCategoryModalOpen && (
                <CategoryFormDialog 
                    isOpen={isCategoryModalOpen} 
                    onOpenChange={setIsCategoryModalOpen} 
                    onSave={handleSaveCategory} 
                    item={editingCategory} 
                />
            )}

            <FinancialReportTemplate 
                ref={reportRef}
                dateRange={dateRange}
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                netFlow={netFlow}
                accountsReceivable={accountsReceivable}
                filteredTransactions={filteredTransactions}
                accounts={accounts}
            />
        </PageLayout>
    );
};
