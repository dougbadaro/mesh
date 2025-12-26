import { getAuthenticatedUser } from "@/lib/auth-check"; // <--- Import da segurança
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  CreditCard as CreditCardIcon,
  Receipt,
  Pencil
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartData, FinancialCharts } from "@/components/charts";
import { MonthSelector } from "@/components/month-selector";
import { EditTransactionSheet } from "@/components/edit-transaction-sheet";
import { TransactionForm } from "@/components/transaction-form";
import { BankStatementImporter } from "@/components/bank-statement-importer";
import { CreditCardWidget } from "@/components/credit-card-widget";

interface DashboardProps {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function Dashboard(props: DashboardProps) {
  // 1. SEGURANÇA: Verifica se o usuário existe no banco e força logout se não existir
  const user = await getAuthenticatedUser();
  const userId = user.id;

  const searchParams = await props.searchParams; 
  const now = new Date();
  
  const selectedMonth = searchParams.month ? Number(searchParams.month) : now.getMonth();
  const selectedYear = searchParams.year ? Number(searchParams.year) : now.getFullYear();

  const startOfMonth = new Date(selectedYear, selectedMonth, 1);
  const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999); 
  
  const isPastMonth = endOfMonth < now;

  // BUSCA HISTÓRICO COMPLETO (Para cálculo de saldo acumulado)
  const cashTransactions = await prisma.transaction.findMany({
    where: { 
      userId: userId,
      paymentMethod: { not: 'CREDIT_CARD' }, 
    },
    select: { id: true, amount: true, type: true, date: true, description: true }, 
    orderBy: { date: 'asc' }
  });

  // BUSCA DO MÊS (Para lista e gráficos)
  const monthlyTransactions = await prisma.transaction.findMany({
    where: {
      userId: userId,
      date: { gte: startOfMonth, lte: endOfMonth }
    },
    orderBy: { date: 'desc' }, 
    include: { category: true }
  });

  const allFutureTransactions = await prisma.transaction.findMany({
    where: { 
      userId: userId,
      date: { gte: startOfMonth } 
    }, 
    include: { category: true }
  });

  const categories = await prisma.category.findMany({
    where: { OR: [{ userId: userId }, { userId: null }] }
  });

  // CÁLCULO DE SALDO
  let currentBalance = 0;   
  let startingBalance = 0;  
  
  const cutoffTime = endOfMonth.getTime();
  const startTime = startOfMonth.getTime();

  cashTransactions.forEach(t => {
     const tDate = new Date(t.date).getTime();
     const val = Number(t.amount);

     if (tDate < startTime) {
        if (t.type === TransactionType.INCOME) startingBalance += val;
        else startingBalance -= val;
     }

     if (tDate <= cutoffTime) {
        if (t.type === TransactionType.INCOME) currentBalance += val;
        else currentBalance -= val;
     }
  });

  // PREPARAÇÃO DE DADOS
  const listItemsNonCredit = monthlyTransactions.filter(t => t.paymentMethod !== 'CREDIT_CARD');
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
    <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-6 pb-20 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Visão Geral</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas finanças de forma inteligente.</p>
        </div>
        <MonthSelector />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/60 backdrop-blur border-white/5 shadow-sm">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm font-medium text-zinc-400">
                          {isPastMonth ? "Saldo (Fim do mês)" : "Saldo em Conta"}
                        </p>
                        <h2 className={`text-3xl font-bold tracking-tight mt-1 ${currentBalance < 0 ? 'text-rose-400' : 'text-white'}`}>
                            {formatCurrency(currentBalance)}
                        </h2>
                    </div>
                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/10">
                        <Wallet size={20} />
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-md">
                      <ArrowUpRight size={14} className="text-emerald-500" />
                      <span className="text-emerald-500 text-xs font-semibold">
                        Entradas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(monthIncome)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-md">
                      <ArrowDownLeft size={14} className="text-rose-500" />
                      <span className="text-rose-500 text-xs font-semibold">
                        Saídas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(monthExpense)}
                      </span>
                    </div>
                 </div>
               </CardContent>
            </Card>

            <Card className="bg-zinc-900/60 backdrop-blur border-white/5 shadow-sm">
               <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-medium text-zinc-400">Fatura de {startOfMonth.toLocaleString('pt-BR', { month: 'long' })}</p>
                      <h3 className="text-3xl font-bold text-white tracking-tight mt-1">
                        {formatCurrency(monthlyInvoiceTotal)}
                      </h3>
                    </div>
                    <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/10">
                      <CreditCardIcon size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Acumulado no cartão (Não descontado do saldo).
                  </p>
               </CardContent>
            </Card>
          </div>

          <div className="rounded-xl overflow-hidden border border-white/5 shadow-sm">
             <div className="bg-zinc-900/60 backdrop-blur p-5 border-b border-white/5">
                <h3 className="font-semibold text-sm text-zinc-200 uppercase tracking-wider">Fluxo de Caixa Mensal</h3>
             </div>
             <div className="bg-zinc-900/30 p-5">
                <FinancialCharts data={chartData} initialBalance={startingBalance} />
             </div>
          </div>

          <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                   <h3 className="font-semibold text-sm text-zinc-200 uppercase tracking-wider">
                     Extrato de {startOfMonth.toLocaleString('pt-BR', { month: 'long' })}
                   </h3>
                </div>
              </div>
              
              <Card className="bg-zinc-900/60 backdrop-blur border-white/5 overflow-hidden">
                {monthlyTransactions.length === 0 ? (
                   <div className="p-10 text-center text-sm text-zinc-500">Nenhuma movimentação neste mês.</div>
                ) : (
                   <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto pr-2">
                     
                     {monthlyInvoiceTotal > 0 && (
                        <div className="flex items-center justify-between p-4 bg-rose-500/5 border-l-2 border-rose-500/50">
                           <div className="flex items-center gap-4">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-rose-500/10 text-rose-500">
                                 <Receipt size={16} />
                              </div>
                              <div>
                                 <p className="text-sm font-medium text-white">Fatura de Cartão de Crédito</p>
                                 <p className="text-[10px] text-zinc-400">
                                    {listItemsCredit.length} compras agrupadas
                                 </p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-bold tabular-nums text-rose-400">
                                 - {formatCurrency(monthlyInvoiceTotal)}
                              </p>
                           </div>
                        </div>
                     )}

                     {listItemsNonCredit.map((t) => (
                       <EditTransactionSheet 
                          key={t.id} 
                          categories={categories}
                          transaction={{
                            id: t.id,
                            description: t.description,
                            amount: Number(t.amount), 
                            date: t.date,
                            type: t.type,
                            paymentMethod: t.paymentMethod,
                            categoryId: t.categoryId
                          }}
                       >
                         <div 
                           className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition group cursor-pointer outline-none focus-visible:bg-white/5 text-left"
                           role="button"
                           tabIndex={0}
                         >
                            <div className="flex items-center gap-4">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border border-transparent transition-colors ${
                                t.type === 'INCOME' 
                                  ? 'bg-emerald-500/10 text-emerald-500 group-hover:border-emerald-500/20' 
                                  : 'bg-zinc-800 text-zinc-400 border-white/5 group-hover:text-zinc-200'
                              }`}>
                                 {t.type === 'INCOME' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition">{t.description}</p>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                                  <span>{formatDate(t.date)}</span>
                                  {t.category && (
                                    <>
                                      <span className="w-0.5 h-0.5 rounded-full bg-zinc-600" />
                                      <span>{t.category.name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className={`text-sm font-bold tabular-nums ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-zinc-200'}`}>
                                     {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(Number(t.amount))}
                                  </p>
                                  <div className="flex items-center justify-end gap-1.5 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                     <span className="text-[10px] text-zinc-500 capitalize">
                                       {t.paymentMethod.toLowerCase().replace('_', ' ')}
                                     </span>
                                  </div>
                                </div>
                                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800/50 text-zinc-600 group-hover:bg-zinc-800 group-hover:text-zinc-300 transition-all border border-transparent group-hover:border-white/10">
                                   <Pencil size={14} />
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

        <div className="lg:col-span-4 space-y-6">
           <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50 mb-4">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="import">Importar Extrato</TabsTrigger>
              </TabsList>
              <TabsContent value="manual">
                <TransactionForm categories={categories} />
              </TabsContent>
              <TabsContent value="import">
                <BankStatementImporter categories={categories} />
              </TabsContent>
           </Tabs>
           <CreditCardWidget transactions={widgetData} />
        </div>
      </div>
    </div>
  );
}