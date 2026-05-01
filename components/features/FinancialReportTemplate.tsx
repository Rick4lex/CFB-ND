import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../../lib/utils';
import { Badge } from '../ui/Shared';

export const FinancialReportTemplate = React.forwardRef(({
    dateRange,
    totalIncome,
    totalExpense,
    netFlow,
    accountsReceivable,
    filteredTransactions,
    accounts
}: any, ref: any) => {

    const PAGE_1_ROWS = 11;
    const PAGE_N_ROWS = 18;

    const pages = [];
    
    // Page 1
    const page1Tx = filteredTransactions.slice(0, PAGE_1_ROWS);
    pages.push({
        isFirst: true,
        transactions: page1Tx
    });

    let remainingTx = filteredTransactions.slice(PAGE_1_ROWS);
    while (remainingTx.length > 0) {
        pages.push({
            isFirst: false,
            transactions: remainingTx.slice(0, PAGE_N_ROWS)
        });
        remainingTx = remainingTx.slice(PAGE_N_ROWS);
    }

    if (pages.length === 0) {
        pages.push({ isFirst: true, transactions: [] });
    }

    const renderTransactionRow = (t: any) => {
        const sourceAcc = accounts.find((a: any) => a.id === t.sourceAccountId);
        const destAcc = accounts.find((a: any) => a.id === t.destinationAccountId);
        const accountName = t.type === 'TRANSFER' ? `${sourceAcc?.name || 'Origen'} -> ${destAcc?.name || 'Destino'}` : (sourceAcc?.name || 'Desconocida');
        
        return (
            <div key={t.id} className="flex items-center py-4 border-b border-gray-100 text-sm">
                <div className="w-24 font-mono text-gray-500">{format(new Date(t.date), "dd/MM/yyyy")}</div>
                <div className="flex-1 font-medium text-gray-900 truncate pr-4">{t.description}</div>
                <div className="w-48 text-gray-600 truncate pr-4">{accountName}</div>
                <div className="w-24">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase ${t.type === 'INCOME' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : t.type === 'TRANSFER' ? 'text-blue-700 border-blue-200 bg-blue-50' : 'text-red-700 border-red-200 bg-red-50'}`}>
                        {t.type === 'INCOME' ? 'Ingreso' : t.type === 'TRANSFER' ? 'Transf.' : 'Egreso'}
                    </span>
                </div>
                <div className={`w-32 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-700' : t.type === 'TRANSFER' ? 'text-blue-700' : 'text-red-700'}`}>
                    {formatCurrency(t.amount)}
                </div>
            </div>
        );
    };

    return (
        <div className="absolute top-0 left-0 opacity-0 pointer-events-none" style={{ zIndex: -1 }}>
            <div ref={ref}>
                {pages.map((page, index) => (
                    <div key={index} className="pdf-page bg-white text-black shrink-0 relative flex flex-col" style={{ width: '816px', height: '1056px', padding: '48px', boxSizing: 'border-box' }}>
                        
                        {page.isFirst && (
                            <>
                                <div className="border-b-2 border-gray-200 pb-6 mb-8 mt-4">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col gap-2">
                                            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Resumen Financiero</h1>
                                            <p className="text-xl text-gray-500 font-medium">Periodo: {dateRange === 'current_month' ? 'Mes Actual' : dateRange === 'last_month' ? 'Mes Anterior' : dateRange === 'year' ? 'Este Año' : 'Histórico Total'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Generado en</p>
                                            <p className="text-lg text-gray-800 font-medium">{format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4 mb-8">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Ingresos</p>
                                        <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Egresos</p>
                                        <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpense)}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Flujo Neto</p>
                                        <p className={`text-2xl font-bold ${netFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(netFlow)}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center text-center">
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Por Cobrar</p>
                                        <p className="text-2xl font-bold text-amber-700">{formatCurrency(accountsReceivable)}</p>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex-1 flex flex-col">
                            {page.isFirst && (
                                <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-300 pb-3 mb-4">
                                    Últimas Transacciones ({filteredTransactions.length})
                                </h2>
                            )}
                            
                            {!page.isFirst && (
                                <h2 className="text-xl font-bold text-gray-500 border-b border-gray-300 pb-3 mb-4 mt-8">
                                    Transacciones - Página {index + 1}
                                </h2>
                            )}

                            <div className="flex-1">
                                <div className="flex text-[11px] font-bold text-gray-400 uppercase tracking-widest pb-3 mb-1 border-b border-gray-200">
                                    <div className="w-24">Fecha</div>
                                    <div className="flex-1">Descripción</div>
                                    <div className="w-48">Cuenta</div>
                                    <div className="w-24">Tipo</div>
                                    <div className="w-32 text-right">Valor</div>
                                </div>
                                
                                {page.transactions.length === 0 ? (
                                    <div className="text-center text-gray-500 py-12 italic">No hay transacciones en este periodo.</div>
                                ) : (
                                    page.transactions.map((t: any) => renderTransactionRow(t))
                                )}
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-gray-200 flex justify-between items-center text-sm text-gray-400 font-mono">
                            <p>CFBra!nd - Control y Crecimiento</p>
                            <p>Pág. {index + 1} de {pages.length}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
