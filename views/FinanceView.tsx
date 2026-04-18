import React, { useState, useMemo } from 'react';
import { PageLayout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Tabs, TabsList, TabsTrigger, Button, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Shared';
import { Plus, Wallet, ArrowUpRight, ArrowDownRight, Activity, CalendarDays } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { TransactionFormDialog, AccountFormDialog, CategoryFormDialog } from '../components/features/Dialogs';
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
            // Manejo de actualización de cuenta bancaria
            const sourceAccount = accounts.find(a => a.id === transaction.sourceAccountId);
            
            if (sourceAccount) {
                // Determine balance change. If editing, we'd need to reverse the old amount, but for simplicity we assume manual transactions are mostly additions or simple edits.
                const isIncome = transaction.type === 'INCOME';
                let amountChange = transaction.amount;
                
                if (editingTransaction) {
                    amountChange = transaction.amount - editingTransaction.amount;
                    if (editingTransaction.type !== transaction.type) {
                        amountChange = isIncome ? (transaction.amount + editingTransaction.amount) : -(transaction.amount + editingTransaction.amount);
                    } else if (!isIncome) {
                        amountChange = -(transaction.amount - editingTransaction.amount);
                    }
                } else if (!isIncome) {
                    amountChange = -transaction.amount;
                }

                const updatedAccount = { ...sourceAccount, balance: sourceAccount.balance + amountChange };

                if (!editingTransaction) {
                    // Integridad Atómica Guardada en IndexedDB // DIRECTRIZ 6
                    await saveTransactionWithAccountBalance(transaction, updatedAccount);
                    addTransaction(transaction);
                } else {
                    updateTransaction(transaction);
                }
                updateAccount(updatedAccount);
                
                toast({
                    title: "Transacción Atómica Registrada",
                    description: `El libro mayor y el balance de la cuenta se actualizaron simultáneamente.`,
                });
            } else {
                if (editingTransaction) updateTransaction(transaction);
                else addTransaction(transaction);
            }
        } catch (error) {
           toast({
               variant: 'destructive',
               title: "Error de Integridad",
               description: "No se pudo asegurar la transacción en la base de datos.",
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

    return (
        <PageLayout title="Dashboard Financiero" subtitle="Partida Doble: Control y crecimiento" onBackRoute="/app/dashboard">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                 <div className="flex gap-2">
                    <Button onClick={() => handleCreateTransaction('INCOME')}><Plus className="w-4 h-4 mr-2"/> Registrar Ingreso</Button>
                    <Button variant="outline" onClick={() => handleCreateTransaction('EXPENSE')}><Plus className="w-4 h-4 mr-2"/> Registrar Gasto</Button>
                 </div>
                 
                 <div className="w-full sm:w-auto flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
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
                    <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4">
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
                                                 <div className={`p-2 rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50' : 'bg-red-100 text-red-600 dark:bg-red-950/50'}`}>
                                                     {tx.type === 'INCOME' ? <ArrowUpRight className="h-4 w-4"/> : <ArrowDownRight className="h-4 w-4"/>}
                                                 </div>
                                                 <div>
                                                     <p className="font-medium text-sm">{tx.description}</p>
                                                     <p className="text-xs text-muted-foreground">{format(new Date(tx.date), "dd/MM/yyyy", { locale: es })}</p>
                                                 </div>
                                             </div>
                                             <div className={`font-semibold text-sm ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                 {tx.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(tx.amount)}
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
                                        <TableHead>Cuenta Origen</TableHead>
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
                                            const acc = accounts.find(a => a.id === t.sourceAccountId);
                                            return (
                                                <TableRow key={t.id} className="cursor-pointer hover:bg-muted/30" onClick={() => handleEditTransaction(t)}>
                                                    <TableCell className="font-mono text-xs">{format(new Date(t.date), "MMM dd, yyyy", { locale: es })}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {t.description}
                                                        {t.documentId && <Badge variant="outline" className="ml-2 text-[10px] h-4">Fac: {t.documentId}</Badge>}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">{acc?.name || 'Desconocida'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={t.type === 'INCOME' ? 'success' : 'destructive'} className="text-[10px] uppercase">
                                                            {t.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className={`text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
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
                    accounts={accounts}
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
        </PageLayout>
    );
};
