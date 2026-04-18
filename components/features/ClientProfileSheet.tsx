import React, { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, Badge, Button, Separator, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Tabs, TabsList, TabsTrigger, TabsContent, ScrollArea, Card, CardHeader, CardTitle, CardContent } from '../ui/Shared';
import { Plus, Edit, FileText, ArrowUpRight, ArrowDownRight, CreditCard, Calendar, Receipt, Briefcase, FileClock, Phone, Mail, Building, KeyRound } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { Client, Transaction, InvoiceRecord } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import { CLIENT_STATUS_META } from '../../lib/crm-states';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { saveTransactionWithAccountBalance } from '../../lib/db';

interface ClientProfileSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    client: Client | null;
    onEdit: (client: Client) => void;
    onDocuments: (client: Client) => void;
    onCredentials: (client: Client) => void;
}

export const ClientProfileSheet = ({ isOpen, onOpenChange, client, onEdit, onDocuments, onCredentials }: ClientProfileSheetProps) => {
    const { transactions, invoices, accounts, addTransaction, updateInvoice, updateClient, updateAccount } = useAppStore();
    const { toast } = useToast();

    const clientTransactions = useMemo(() => {
        if (!client) return [];
        return transactions
            .filter(t => t.clientId === client.id)
            .sort((a, b) => b.date - a.date);
    }, [transactions, client]);

    const clientInvoices = useMemo(() => {
        if (!client) return [];
        return invoices
            .filter(i => i.clientId === client.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices, client]);

    const pendingInvoices = useMemo(() => {
        return clientInvoices.filter(i => i.status !== 'Pagado' && i.status !== 'Anulado');
    }, [clientInvoices]);

    const ltv = useMemo(() => {
        return clientTransactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);
    }, [clientTransactions]);

    const activeBalance = useMemo(() => {
        return pendingInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    }, [pendingInvoices]);

    const handleMarkAsPaid = async (invoice: InvoiceRecord) => {
        // Auto-create transaction
        const firstAccount = accounts?.[0]; // Default to first available account
        
        let newTx;
        if (firstAccount) {
            newTx = {
                id: crypto.randomUUID(),
                date: Date.now(),
                type: 'INCOME' as const,
                amount: invoice.totalAmount,
                description: `Pago Factura ${invoice.id}`,
                sourceAccountId: firstAccount.id,
                clientId: client?.id,
                documentId: invoice.id
            };
            
            const updatedAccount = { ...firstAccount, balance: firstAccount.balance + invoice.totalAmount };

            try {
                // Guarda en IndexedDB for atomic consistency
                await saveTransactionWithAccountBalance(newTx, updatedAccount);
                // Si funciona, se replica al Zustand LocalStorage
                addTransaction(newTx);
                updateAccount(updatedAccount); // ¡Aquí estaba el bug que no sumaba el saldo a la caja!
            } catch (err) {
                 toast({ variant: 'destructive', title: "Error Atómico", description: "Fallo registrando en el Libro Mayor." });
                 return;
            }
        }

        updateInvoice({
            ...invoice,
            status: 'Pagado'
        });

        if (client) {
            updateClient({
                ...client,
                balance: Math.max(0, (client.balance || 0) - invoice.totalAmount)
            });
        }

        toast({
            title: "Pago registrado y Cajón actualizado",
            description: `Se cobró la factura ${invoice.id} y el saldo ingresó con éxito.`
        });
    };

    if (!client) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-none p-0 flex flex-col h-full bg-background/95 backdrop-blur-xl border-l">
                 <div className="flex-1 overflow-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6 border-b">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold">{client.fullName}</h2>
                                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="font-mono">{client.documentType} {client.documentId}</Badge>
                                    <Badge variant="secondary">{CLIENT_STATUS_META[client.serviceStatus]?.label || client.serviceStatus}</Badge>
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => onEdit(client)}>
                                <Edit className="w-4 h-4 mr-2" /> Editar
                            </Button>
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-none">
                                <CardContent className="p-4">
                                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Life-Time Value</p>
                                    <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{formatCurrency(client.ltv > 0 ? client.ltv : ltv)}</h3>
                                    <p className="text-xs text-emerald-600/80 mt-1">Ingresos históricos</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-amber-500/10 border-amber-500/20 shadow-none">
                                <CardContent className="p-4">
                                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Saldo Pendiente</p>
                                    <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{formatCurrency(activeBalance > 0 ? activeBalance : (client.balance || 0))}</h3>
                                    <p className="text-xs text-amber-600/80 mt-1">Cuentas por cobrar</p>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="secondary" className="flex-1" onClick={() => onDocuments(client)}>
                                <FileText className="w-4 h-4 mr-2" /> Documentos
                            </Button>
                            <Button size="sm" variant="secondary" className="flex-1" onClick={() => onCredentials(client)}>
                                <KeyRound className="w-4 h-4 mr-2" /> Accesos
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                        <div className="px-6 pt-4 border-b">
                            <TabsList className="bg-transparent h-auto p-0 flex gap-6">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 pb-2">Visión General</TabsTrigger>
                                <TabsTrigger value="invoices" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 pb-2 relative">
                                    Facturación
                                    {pendingInvoices.length > 0 && (
                                        <span className="absolute -top-1 -right-4 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                            {pendingInvoices.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-0 pb-2">Historial</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-6">
                                <TabsContent value="overview" className="m-0 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                         <div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3"/> Correo</p>
                                            <p className="font-medium text-sm mt-1">{client.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3"/> Teléfono</p>
                                            <p className="font-medium text-sm mt-1">{client.phone || 'N/A'}</p>
                                        </div>
                                         <div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1"><Briefcase className="w-3 h-3"/> Asesor Asignado</p>
                                            <p className="font-medium text-sm mt-1">{client.assignedAdvisor || 'Sin asignar'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3"/> Fecha de Ingreso</p>
                                            <p className="font-medium text-sm mt-1">{client.entryDate}</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h3 className="text-sm font-semibold mb-3">Servicios Contratados</h3>
                                        {client.contractedServices && client.contractedServices.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {client.contractedServices.map(serviceId => (
                                                    <Badge key={serviceId} variant="secondary">{serviceId}</Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No hay servicios contratados registrados.</p>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="invoices" className="m-0 space-y-4">
                                     {pendingInvoices.length > 0 && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                                            <h4 className="text-red-700 dark:text-red-400 font-semibold text-sm flex items-center gap-2">
                                                <Receipt className="w-4 h-4"/> Alerta de Cartera
                                            </h4>
                                            <p className="text-sm text-red-600/80 mt-1">Este cliente tiene {pendingInvoices.length} factura(s) pendiente(s) de pago.</p>
                                        </div>
                                     )}
                                     
                                     <h3 className="text-sm font-semibold">Documentos y Facturas</h3>
                                     {clientInvoices.length > 0 ? (
                                        <div className="space-y-3">
                                            {clientInvoices.map((inv) => (
                                                <div key={inv.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-sm">{inv.id}</p>
                                                            <Badge variant={inv.status === 'Pagado' ? 'default' : inv.status === 'Pendiente' ? 'destructive' : 'secondary'} className="text-[10px] h-4 cursor-default">
                                                                {inv.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">Emitida: {inv.date} • Vence: {inv.dueDate}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                                         <p className="font-semibold">{formatCurrency(inv.totalAmount)}</p>
                                                         {inv.status === 'Pendiente' && (
                                                             <Button size="sm" variant="outline" className="h-8 text-xs bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800" onClick={() => handleMarkAsPaid(inv)}>
                                                                 Marcar Pagado
                                                             </Button>
                                                         )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                     ) : (
                                        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                                            <FileClock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No hay facturas registradas.</p>
                                        </div>
                                     )}
                                </TabsContent>

                                <TabsContent value="history" className="m-0 space-y-4">
                                    <h3 className="text-sm font-semibold">Movimientos Contables</h3>
                                    {clientTransactions.length > 0 ? (
                                        <div className="relative border-l border-muted ml-3 pl-4 space-y-6">
                                            {clientTransactions.map((tx) => (
                                                <div key={tx.id} className="relative">
                                                    <div className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background ring-2 ${tx.type === 'INCOME' ? 'bg-emerald-500 ring-emerald-500/20' : 'bg-red-500 ring-red-500/20'}`} />
                                                    <div>
                                                        <div className="flex justify-between items-start">
                                                            <p className="text-sm font-medium">{tx.description}</p>
                                                            <p className={`text-sm font-semibold ${tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(tx.date), "d 'de' MMMM, yyyy", { locale: es })}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                                            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">No hay transacciones registradas.</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    );
};
