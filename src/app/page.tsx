import { getAuthenticatedUser } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  Activity,
  Receipt,
  TrendingUp
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialCharts, ChartData } from "@/components/charts";
import { MonthSelector } from "@/components/month-selector";
import { EditTransactionSheet } from "@/components/edit-transaction-sheet";
import { TransactionForm } from "@/components/transaction-form";
import { BankStatementImporter } from "@/components/bank-statement-importer";
import { BankAccountsWidget } from "@/components/bank-accounts-widget";
import { PayInvoiceDialog } from "@/components/pay-invoice-dialog";
import { CreditCardWidget } from "@/components/credit-card-widget";

interface DashboardProps {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function Dashboard(props: DashboardProps) {
  const user = await getAuthenticatedUser();
  const userId = user.id;

  const searchParams = await props.searchParams; 
  const now = new Date();
  
  const selectedMonth = searchParams.month ? Number(searchParams.month) : now.getMonth();
  const selectedYear = searchParams.year ? Number(searchParams.year) : now.getFullYear();

  const startOfMonth = new Date(selectedYear, selectedMonth, 1);
  const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999); 
  
  const monthName = startOfMonth.toLocaleString('pt-BR', { month: 'long' });
  const isPastMonth = endOfMonth < now;

  // =================================================================================
  // 🚀 OTIMIZAÇÃO MÁXIMA: UMA ÚNICA CHAMADA AO BANCO (Promise.all)
  // Removemos todas as dependências. Buscamos tudo junto e filtramos na memória.
  // =================================================================================
  
  const [
    rawBankAccounts, 
    rawCategories, 
    balanceAggregations, 
    allMonthlyTransactions, 
    futureCardTransactions
  ] = await Promise.all([
    
    // 1. Contas
    prisma.bankAccount.findMany({
      where: { userId: userId },
      select: { id: true, name: true, type: true, color: true, includeInTotal: true, initialBalance: true }
    }),

    // 2. Categorias
    prisma.category.findMany({
      where: { OR: [{ userId: userId }, { userId: null }] }
    }),

    // 3. Saldo Total (Agregado)
    prisma.transaction.groupBy({
        by: ['bankAccountId', 'type'],
        _sum: { amount: true },
        where: { 
          userId: userId,
          date: { lte: endOfMonth },
          paymentMethod: { not: 'CREDIT_CARD' }
        }
    }),

    // 4. Transações do Mês (Trazemos todas, filtramos ocultas depois)
    prisma.transaction.findMany({
        where: {
            userId: userId,
            date: { gte: startOfMonth, lte: endOfMonth },
        },
        orderBy: { date: 'desc' }, 
        include: { 
            category: true,
            bankAccount: { select: { name: true, color: true } }
        }
    }),

    // 5. Widget Cartão
    prisma.transaction.findMany({
        where: { 
            userId: userId,
            date: { gte: startOfMonth },
            paymentMethod: 'CREDIT_CARD',
        },
        select: {
            id: true, description: true, amount: true, date: true, dueDate: true, paymentMethod: true
        },
        orderBy: { date: 'asc' }
    })
  ]);

  // --- PROCESSAMENTO EM MEMÓRIA (Muito mais rápido que DB) ---

  // Sanitiza Contas
  const bankAccounts = rawBankAccounts.map(acc => ({
    ...acc,
    initialBalance: Number(acc.initialBalance)
  }));

  // Identifica contas ocultas
  const hiddenAccountIds = new Set(
    bankAccounts.filter(acc => !acc.includeInTotal).map(acc => acc.id)
  );

  // Filtra as transações do mês (removendo as de contas ocultas)
  const monthlyTransactions = allMonthlyTransactions.filter(t => 
    !t.bankAccountId || !hiddenAccountIds.has(t.bankAccountId)
  );

  // Sanitiza Categorias
  const categories = rawCategories.map(cat => ({
    ...cat,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null
  }));

  // Mapa de Saldos Agregados
  const totalsMap: Record<string, number> = {};
  balanceAggregations.forEach(agg => {
     if (agg.bankAccountId) {
        const key = `${agg.bankAccountId}_${agg.type}`;
        totalsMap[key] = Number(agg._sum.amount || 0);
     }
  });

  // Monta objeto de contas com saldo
  const accountsWithBalance = bankAccounts.map(acc => {
      const totalIncome = totalsMap[`${acc.id}_${TransactionType.INCOME}`] || 0;
      const totalExpense = totalsMap[`${acc.id}_${TransactionType.EXPENSE}`] || 0;
      return {
          ...acc,
          currentBalance: acc.initialBalance + totalIncome - totalExpense
      };
  });

  // KPI: Saldo Atual
  const currentBalance = accountsWithBalance
    .filter(acc => acc.includeInTotal)
    .reduce((sum, acc) => sum + acc.currentBalance, 0);

  // KPI: Fluxo do Mês
  const monthIncome = monthlyTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const monthExpense = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + Number(t.amount), 0);
  
  const startingBalance = currentBalance - monthIncome + monthExpense;

  // Listas de Visualização
  const listItemsNonCredit = monthlyTransactions
    .filter(t => t.paymentMethod !== 'CREDIT_CARD')
    .map(t => ({ 
        ...t, 
        amount: Number(t.amount),
        category: t.category ? {
            ...t.category,
            budgetLimit: t.category.budgetLimit ? Number(t.category.budgetLimit) : null
        } : null
    }));

  const listItemsCredit = monthlyTransactions.filter(t => t.paymentMethod === 'CREDIT_CARD');
  const monthlyInvoiceTotal = listItemsCredit.reduce((acc, t) => acc + Number(t.amount), 0);

  // Gráficos
  const chartData: ChartData[] = [...monthlyTransactions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(t => ({
      amount: Number(t.amount), 
      date: t.date.toISOString(), 
      type: t.type,
      categoryName: t.category?.name
    }));

  // Widget
  const widgetData = futureCardTransactions.map(t => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    date: t.date,      
    dueDate: t.dueDate!, 
    paymentMethod: t.paymentMethod
  }));

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 md:pb-0">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Visão Geral</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
              Resumo financeiro de {startOfMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}.
          </p>
        </div>
        <MonthSelector />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* COLUNA ESQUERDA */}
        <div className="xl:col-span-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* CARD SALDO */}
            <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 shadow-lg shadow-black/5 rounded-3xl overflow-hidden relative group">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <CardContent className="p-5 relative">
                 <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          {isPastMonth ? "Saldo Final" : "Disponível"}
                        </p>
                        <h2 className={`text-3xl font-bold tracking-tight mt-0.5 ${currentBalance < 0 ? 'text-rose-400' : 'text-white'}`}>
                            {formatCurrency(currentBalance)}
                        </h2>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                        <Wallet size={16} />
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400"><ArrowUpRight size={10} /></div>
                          <span className="text-[9px] text-zinc-400 uppercase font-bold">Entradas</span>
                      </div>
                      <p className="text-sm font-semibold text-emerald-400 leading-none">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(monthIncome)}
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-2.5 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="p-0.5 rounded-full bg-rose-500/20 text-rose-400"><ArrowDownLeft size={10} /></div>
                          <span className="text-[9px] text-zinc-400 uppercase font-bold">Saídas</span>
                      </div>
                      <p className="text-sm font-semibold text-rose-400 leading-none">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(monthExpense)}
                      </p>
                    </div>
                 </div>
               </CardContent>
            </Card>

            {/* CARD FATURA */}
            <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 shadow-lg shadow-black/5 rounded-3xl overflow-hidden relative group">
               <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <CardContent className="p-5 relative flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fatura Atual</p>
                      <h3 className="text-3xl font-bold text-white tracking-tight mt-0.5">
                        {formatCurrency(monthlyInvoiceTotal)}
                      </h3>
                    </div>
                    
                    <PayInvoiceDialog 
                        key={monthName}
                        invoiceTotal={monthlyInvoiceTotal}
                        accounts={accountsWithBalance}
                        monthName={monthName}
                    />
                  </div>
                  
                  <div className="mt-4">
                      <div className="flex items-center gap-2 text-zinc-500 text-[10px] bg-white/5 p-2.5 rounded-xl border border-white/5">
                        <Activity size={12} />
                        <span>Acumulado no cartão</span>
                      </div>
                  </div>
               </CardContent>
            </Card>
          </div>

          {/* GRÁFICO */}
          <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 shadow-lg shadow-black/5 rounded-3xl overflow-hidden">
             <CardHeader className="border-b border-white/5 px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                   <TrendingUp size={14} />
                   Fluxo de Caixa
                </CardTitle>
             </CardHeader>
             <CardContent className="p-5">
                <div className="h-[280px] w-full">
                   <FinancialCharts data={chartData} initialBalance={startingBalance} />
                </div>
             </CardContent>
          </Card>

          {/* LISTA */}
          <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">
                Últimas Movimentações
              </h3>
              
              <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden shadow-lg shadow-black/5">
                {monthlyTransactions.length === 0 ? (
                   <div className="p-10 text-center flex flex-col items-center gap-2 text-zinc-500">
                      <Receipt size={24} className="opacity-20" />
                      <p className="text-xs">Nenhuma movimentação neste período.</p>
                   </div>
                ) : (
                   <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                      
                      {monthlyInvoiceTotal > 0 && (
                          <div className="flex items-center justify-between p-3 px-5 bg-rose-500/5 border-l-2 border-rose-500/50">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/10 text-rose-500">
                                   <Receipt size={14} />
                                </div>
                                <div>
                                   <p className="text-xs font-bold text-white">Fatura Cartão</p>
                                   <p className="text-[10px] text-zinc-400">
                                      {listItemsCredit.length} compras agrupadas
                                   </p>
                                </div>
                             </div>
                             <p className="text-xs font-bold tabular-nums text-rose-400">
                                - {formatCurrency(monthlyInvoiceTotal)}
                             </p>
                          </div>
                       )}

                       {listItemsNonCredit.map((t) => (
                           <EditTransactionSheet 
                              key={t.id} 
                              categories={categories}
                              accounts={bankAccounts}
                              transaction={{
                                id: t.id,
                                description: t.description,
                                amount: t.amount,
                                date: t.date,
                                type: t.type,
                                paymentMethod: t.paymentMethod,
                                categoryId: t.categoryId,
                                bankAccountId: t.bankAccountId,
                                dueDate: t.date,
                                category: t.category
                              }}
                           >
                            <div className="w-full flex items-center justify-between p-3 px-5 hover:bg-white/5 transition duration-200 group cursor-pointer">
                                <div className="flex items-center gap-3">
                                   <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-400'}`}>
                                      {t.type === 'INCOME' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                   </div>
                                   <div className="overflow-hidden">
                                     <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition truncate max-w-[150px] md:max-w-[250px]">{t.description}</p>
                                     <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                                        <span>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(t.date)}</span>
                                        {t.category && <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{t.category.name}</span>}
                                     </div>
                                   </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xs font-bold tabular-nums ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-zinc-200'}`}>
                                       {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                                    </p>
                                </div>
                            </div>
                           </EditTransactionSheet>
                       ))}
                   </div>
                )}
             </Card>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="xl:col-span-4 space-y-6">
           <BankAccountsWidget accounts={accountsWithBalance} />
           
           <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden p-1 shadow-lg">
               <Tabs defaultValue="manual" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-zinc-950/50 p-1 rounded-2xl h-9 mb-1">
                    <TabsTrigger value="manual" className="rounded-xl text-[10px] font-bold uppercase tracking-wide data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Manual</TabsTrigger>
                    <TabsTrigger value="import" className="rounded-xl text-[10px] font-bold uppercase tracking-wide data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Importar</TabsTrigger>
                  </TabsList>
                  
                  <div className="p-1">
                    <TabsContent value="manual" className="mt-0">
                        <TransactionForm categories={categories} accounts={bankAccounts} />
                    </TabsContent>
                    <TabsContent value="import" className="mt-0">
                        <BankStatementImporter categories={categories} />
                    </TabsContent>
                  </div>
               </Tabs>
           </Card>

           <CreditCardWidget 
              transactions={widgetData} 
              accounts={accountsWithBalance} 
           />
        </div>
      </div>
    </div>
  );
}