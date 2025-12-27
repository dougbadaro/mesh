import { getAuthenticatedUser } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  CreditCard as CreditCardIcon,
  Receipt,
  Pencil,
  TrendingUp,
  Activity
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialCharts, ChartData } from "@/components/charts";
import { MonthSelector } from "@/components/month-selector";
import { EditTransactionSheet } from "@/components/edit-transaction-sheet";
import { TransactionForm } from "@/components/transaction-form";
import { BankStatementImporter } from "@/components/bank-statement-importer";
import { CreditCardWidget } from "@/components/credit-card-widget";
import { BankAccountsWidget } from "@/components/bank-accounts-widget";

interface DashboardProps {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function Dashboard(props: DashboardProps) {
  // 1. SEGURANÇA E PARAMS
  const user = await getAuthenticatedUser();
  const userId = user.id;

  const searchParams = await props.searchParams; 
  const now = new Date();
  
  const selectedMonth = searchParams.month ? Number(searchParams.month) : now.getMonth();
  const selectedYear = searchParams.year ? Number(searchParams.year) : now.getFullYear();

  const startOfMonth = new Date(selectedYear, selectedMonth, 1);
  const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999); 
  
  const isPastMonth = endOfMonth < now;

  // 2. BUSCA DE CARTEIRAS
  const rawBankAccounts = await prisma.bankAccount.findMany({
    where: { userId: userId },
    select: { id: true, name: true, type: true, color: true, includeInTotal: true, initialBalance: true }
  });

  const bankAccounts = rawBankAccounts.map(acc => ({
    ...acc,
    initialBalance: Number(acc.initialBalance)
  }));

  const hiddenAccountIds = bankAccounts
    .filter(acc => !acc.includeInTotal)
    .map(acc => acc.id);

  const initialBalanceSum = bankAccounts
    .filter(acc => acc.includeInTotal)
    .reduce((sum, acc) => sum + Number(acc.initialBalance), 0);

  // 3. BUSCA DE DADOS
  const [cashTransactions, monthlyTransactions, allFutureTransactions, rawCategories] = await Promise.all([
    // A. Histórico (para calcular saldo acumulado)
    prisma.transaction.findMany({
      where: { 
        userId: userId,
        paymentMethod: { not: 'CREDIT_CARD' }, 
      },
      select: { id: true, amount: true, type: true, date: true, bankAccountId: true },
      orderBy: { date: 'asc' }
    }),

    // B. Mês Atual (para exibir na lista e gráficos)
    prisma.transaction.findMany({
      where: {
        userId: userId,
        date: { gte: startOfMonth, lte: endOfMonth },
        bankAccountId: { notIn: hiddenAccountIds }
      },
      orderBy: { date: 'desc' }, 
      include: { 
          category: true,
          bankAccount: { select: { name: true, color: true } }
      }
    }),

    // C. Futuro (para o Widget de Cartão)
    prisma.transaction.findMany({
      where: { 
        userId: userId,
        date: { gte: startOfMonth },
        bankAccountId: { notIn: hiddenAccountIds }
      }, 
      include: { category: true }
    }),

    // D. Categorias (para formulários)
    prisma.category.findMany({
      where: { OR: [{ userId: userId }, { userId: null }] }
    })
  ]);

  // 4. SANITIZAÇÃO
  const categories = rawCategories.map(cat => ({
    ...cat,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null
  }));

  // 5. CÁLCULO DE SALDOS
  let currentBalance = initialBalanceSum;   
  let startingBalance = initialBalanceSum;
  
  const cutoffTime = endOfMonth.getTime();
  const startTime = startOfMonth.getTime();

  const accountsWithBalance = bankAccounts.map(acc => ({
      ...acc,
      currentBalance: Number(acc.initialBalance)
  }));

  cashTransactions.forEach(t => {
      const tDate = new Date(t.date).getTime();
      const val = Number(t.amount);
      const isIncome = t.type === TransactionType.INCOME;

      // Atualiza saldo individual de cada conta
      if (t.bankAccountId) {
          const accIndex = accountsWithBalance.findIndex(a => a.id === t.bankAccountId);
          if (accIndex >= 0) {
              if (tDate <= cutoffTime) {
                  if (isIncome) accountsWithBalance[accIndex].currentBalance += val;
                  else accountsWithBalance[accIndex].currentBalance -= val;
              }
          }
      }

      // Atualiza saldo geral (se não for conta oculta)
      const isVisible = !t.bankAccountId || !hiddenAccountIds.includes(t.bankAccountId);
      if (isVisible) {
          if (tDate < startTime) {
             if (isIncome) startingBalance += val;
             else startingBalance -= val;
          }

          if (tDate <= cutoffTime) {
             if (isIncome) currentBalance += val;
             else currentBalance -= val;
          }
      }
  });

  // 6. PREPARAÇÃO DE DADOS VISUAIS
  const listItemsNonCredit = monthlyTransactions
    .filter(t => t.paymentMethod !== 'CREDIT_CARD')
    .map(t => ({ ...t, amount: Number(t.amount) }));

  const listItemsCredit = monthlyTransactions.filter(t => t.paymentMethod === 'CREDIT_CARD');
  const monthlyInvoiceTotal = listItemsCredit.reduce((acc, t) => acc + Number(t.amount), 0);

  const monthIncome = monthlyTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const monthExpense = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const chartData: ChartData[] = [...monthlyTransactions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(t => ({
      amount: Number(t.amount), 
      date: t.date.toISOString(), 
      type: t.type,
      categoryName: t.category?.name
    }));

  const widgetData = allFutureTransactions.map(t => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    date: t.date,      
    dueDate: t.dueDate, 
    paymentMethod: t.paymentMethod
  }));

  const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(date));
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* HEADER PAGE - Clean e Pequeno */}
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
        
        {/* COLUNA ESQUERDA (Principal) */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* CARDS DE KPI (Compactos) */}
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
               <CardContent className="p-5 relative flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fatura Atual</p>
                      <h3 className="text-3xl font-bold text-white tracking-tight mt-0.5">
                        {formatCurrency(monthlyInvoiceTotal)}
                      </h3>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/10">
                      <CreditCardIcon size={16} />
                    </div>
                  </div>
                  <div className="mt-auto">
                     <div className="flex items-center gap-2 text-zinc-500 text-[10px] bg-white/5 p-2.5 rounded-xl border border-white/5">
                        <Activity size={12} />
                        <span>Acumulado no cartão</span>
                     </div>
                  </div>
               </CardContent>
            </Card>
          </div>

          {/* GRÁFICO (Altura controlada) */}
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

          {/* LISTA DE TRANSAÇÕES */}
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
                      
                      {/* Resumo da Fatura (Se houver) */}
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

                      {/* Lista Individual */}
                      {listItemsNonCredit.map((t) => (
                        <EditTransactionSheet 
                           key={t.id} 
                           categories={categories}
                           accounts={bankAccounts}
                           transaction={{
                             id: t.id,
                             description: t.description,
                             amount: Number(t.amount), 
                             date: t.date,
                             type: t.type,
                             paymentMethod: t.paymentMethod,
                             categoryId: t.categoryId,
                             bankAccountId: t.bankAccountId
                           }}
                        >
                          <div 
                            className="w-full flex items-center justify-between p-3 px-5 hover:bg-white/5 transition duration-200 group cursor-pointer"
                            role="button"
                          >
                             <div className="flex items-center gap-3">
                               <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                 t.type === 'INCOME' 
                                   ? 'bg-emerald-500/10 text-emerald-500' 
                                   : 'bg-zinc-800 text-zinc-400'
                               }`}>
                                  {t.type === 'INCOME' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                               </div>
                               
                               <div className="overflow-hidden">
                                 <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition truncate max-w-[180px] md:max-w-[250px]">{t.description}</p>
                                 <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                                   <span>{formatDate(t.date)}</span>
                                   
                                   {t.category && (
                                     <>
                                       <span className="w-0.5 h-0.5 rounded-full bg-zinc-600" />
                                       <span>{t.category.name}</span>
                                     </>
                                   )}

                                   {t.bankAccount && (
                                     <>
                                       <span className="w-0.5 h-0.5 rounded-full bg-zinc-600" />
                                       <span className="flex items-center gap-1">
                                          <div 
                                            className="w-1.5 h-1.5 rounded-full" 
                                            style={{ backgroundColor: t.bankAccount.color || '#10b981' }} 
                                          />
                                          {t.bankAccount.name}
                                       </span>
                                     </>
                                   )}
                                 </div>
                               </div>
                             </div>

                             <div className="flex items-center gap-4">
                                 <div className="text-right">
                                   <p className={`text-xs font-bold tabular-nums ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-zinc-200'}`}>
                                      {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(Number(t.amount))}
                                   </p>
                                   <p className="text-[9px] text-zinc-500 capitalize mt-0.5">
                                        {t.paymentMethod.toLowerCase().replace('_', ' ')}
                                   </p>
                                 </div>
                                 <div className="opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
                                    <div className="p-1.5 bg-white/10 rounded-full text-white">
                                        <Pencil size={12} />
                                    </div>
                                 </div>
                             </div>
                          </div>
                        </EditTransactionSheet>
                      ))}
                    </div>
                 )}
              </Card>
          </div>
        </div>

        {/* COLUNA DIREITA (Widgets) */}
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

           <CreditCardWidget transactions={widgetData} />
        </div>
      </div>
    </div>
  );
}