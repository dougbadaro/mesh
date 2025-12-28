import { getAuthenticatedUser } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";
// Importamos os tipos gerados pelo Prisma
import { Transaction, Category, BankAccount, TransactionType } from "@prisma/client";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  Activity,
  Receipt,
  TrendingUp
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialCharts, ChartData } from "@/components/charts";
import { MonthSelector } from "@/components/month-selector";
import { BankAccountsWidget } from "@/components/bank-accounts-widget";
import { PayInvoiceDialog } from "@/components/pay-invoice-dialog";
import { CreditCardWidget } from "@/components/credit-card-widget";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { TransactionList } from "@/components/transactions-list";

interface DashboardProps {
  searchParams: Promise<{ month?: string; year?: string }>
}

// --- 1. DEFINIÇÃO DE CONTRATOS DE DADOS (SERIALIZADOS) ---

// Tipo auxiliar para o que vem do Prisma (com relacionamentos)
type TransactionWithRelations = Transaction & {
  category: Category | null;
  bankAccount: BankAccount | null;
};

// SafeCategory: O que viaja do Server pro Client (JSON)
export interface SafeCategory {
  id: string;
  name: string;
  type: string;
  userId: string | null;
  budgetLimit: number | null;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

// SafeAccount: O que viaja do Server pro Client (JSON)
export interface SafeAccount {
  id: string;
  name: string;
  type: string;
  color: string | null;
  initialBalance: number;
  includeInTotal: boolean;
}

// SafeTransaction: O que viaja do Server pro Client (JSON)
export interface SafeTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  paymentMethod: string;
  date: string; // ISO String
  dueDate: string | null; // ISO String
  categoryId: string | null;
  bankAccountId: string | null;
  category: SafeCategory | null;
  bankAccount: { name: string; color: string | null } | null;
}

// --- 2. FUNÇÃO DE CONVERSÃO (SERIALIZER) ---
// Converte os tipos complexos do Prisma (Decimal, Date) para primitivos (number, string)
const toClientTransaction = (t: TransactionWithRelations): SafeTransaction => {
  return {
    id: t.id,
    description: t.description,
    amount: Number(t.amount), // Decimal -> Number
    type: t.type,
    paymentMethod: t.paymentMethod,
    date: t.date.toISOString(), // Date -> String
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    categoryId: t.categoryId,
    bankAccountId: t.bankAccountId,
    category: t.category ? {
      id: t.category.id,
      name: t.category.name,
      type: t.category.type,
      userId: t.category.userId,
      budgetLimit: t.category.budgetLimit ? Number(t.category.budgetLimit) : null,
      createdAt: t.category.createdAt.toISOString(),
      updatedAt: t.category.updatedAt.toISOString(),
    } : null,
    bankAccount: t.bankAccount ? {
      name: t.bankAccount.name,
      color: t.bankAccount.color
    } : null
  };
};

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

  const [
    rawBankAccounts, 
    rawCategories, 
    balanceAggregations, 
    allMonthlyTransactions, 
    futureCardTransactions
  ] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { userId: userId },
      select: { id: true, name: true, type: true, color: true, includeInTotal: true, initialBalance: true }
    }),
    prisma.category.findMany({
      where: { OR: [{ userId: userId }, { userId: null }] }
    }),
    prisma.transaction.groupBy({
        by: ['bankAccountId', 'type'],
        _sum: { amount: true },
        where: { 
          userId: userId,
          date: { lte: endOfMonth },
          paymentMethod: { not: 'CREDIT_CARD' }
        }
    }),
    prisma.transaction.findMany({
        where: {
            userId: userId,
            date: { gte: startOfMonth, lte: endOfMonth },
        },
        orderBy: { date: 'desc' }, 
        include: { 
            category: true,
            bankAccount: true // Incluindo tudo para satisfazer TransactionWithRelations
        }
    }),
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

  // --- PROCESSAMENTO DE DADOS ---

  const bankAccounts = rawBankAccounts.map(acc => ({
    ...acc,
    initialBalance: Number(acc.initialBalance)
  }));

  const categories: SafeCategory[] = rawCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    type: cat.type,
    userId: cat.userId,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  }));
  
  // Mapeamos para SafeAccount para passar ao TransactionList
  const safeAccounts: SafeAccount[] = bankAccounts.map(acc => ({
    ...acc,
    initialBalance: Number(acc.initialBalance)
  }));

  const totalsMap: Record<string, number> = {};
  balanceAggregations.forEach(agg => {
     if (agg.bankAccountId) {
        const key = `${agg.bankAccountId}_${agg.type}`;
        totalsMap[key] = Number(agg._sum.amount || 0);
     }
  });

  const accountsWithBalance = bankAccounts.map(acc => {
      const totalIncome = totalsMap[`${acc.id}_${TransactionType.INCOME}`] || 0;
      const totalExpense = totalsMap[`${acc.id}_${TransactionType.EXPENSE}`] || 0;
      return {
          ...acc,
          currentBalance: acc.initialBalance + totalIncome - totalExpense
      };
  });

  const currentBalance = accountsWithBalance
    .filter(acc => acc.includeInTotal)
    .reduce((sum, acc) => sum + acc.currentBalance, 0);

  const hiddenAccountIds = new Set(
    bankAccounts.filter(acc => !acc.includeInTotal).map(acc => acc.id)
  );

  const monthlyTransactions = allMonthlyTransactions.filter(t => 
    !t.bankAccountId || !hiddenAccountIds.has(t.bankAccountId)
  );

  const monthIncome = monthlyTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const monthExpense = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + Number(t.amount), 0);
  
  const startingBalance = currentBalance - monthIncome + monthExpense;

  // --- SEPARAÇÃO E CONVERSÃO FINAL ---

  // 🟢 Lista Segura: Tipagem SafeTransaction[] garantida
  const listItemsNonCredit: SafeTransaction[] = monthlyTransactions
    .filter(t => t.paymentMethod !== 'CREDIT_CARD')
    .map(toClientTransaction); 

  const listItemsCredit = monthlyTransactions.filter(t => t.paymentMethod === 'CREDIT_CARD');
  const monthlyInvoiceTotal = listItemsCredit.reduce((acc, t) => acc + Number(t.amount), 0);

  const chartData: ChartData[] = monthlyTransactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(t => ({
      amount: Number(t.amount), 
      date: t.date.toISOString(), 
      type: t.type,
      categoryName: t.category?.name
    }));

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
            
            {/* SALDO */}
            <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 shadow-lg shadow-black/5 rounded-3xl overflow-hidden relative group shadow-none">
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

            {/* FATURA */}
            <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 shadow-lg shadow-black/5 rounded-3xl overflow-hidden relative group shadow-none">
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

          <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 shadow-lg shadow-black/5 rounded-3xl overflow-hidden shadow-none">
             <CardHeader className="border-b border-white/5 px-6 py-4">
                <CardTitle className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                   <TrendingUp size={14} /> Fluxo de Caixa
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
              
              <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden shadow-lg shadow-black/5 flex flex-col">
                
                {monthlyInvoiceTotal > 0 && (
                    <div className="flex-none flex items-center justify-between p-3 px-5 bg-rose-500/5 border-b border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/10 text-rose-500">
                             <Receipt size={14} />
                           </div>
                           <div>
                             <p className="text-xs font-bold text-white">Fatura Cartão</p>
                             <p className="text-[10px] text-zinc-400">{listItemsCredit.length} compras agrupadas</p>
                           </div>
                        </div>
                        <p className="text-xs font-bold tabular-nums text-rose-400">
                          - {formatCurrency(monthlyInvoiceTotal)}
                        </p>
                    </div>
                )}

                {/* COMPONENTE CLIENTE COM TIPOS SEGUROS */}
                <TransactionList 
                    transactions={listItemsNonCredit} 
                    categories={categories} 
                    accounts={safeAccounts} 
                />

              </Card>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="xl:col-span-4 space-y-6">
           <BankAccountsWidget accounts={accountsWithBalance} />
           
           <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden p-1 shadow-lg shadow-none">
               <DashboardTabs categories={categories} accounts={bankAccounts} />
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