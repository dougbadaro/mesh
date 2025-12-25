import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  TrendingUp,
  CreditCard as CreditCardIcon,
  Pencil // Ícone de Edição
} from "lucide-react";

// Componentes Customizados
import { TransactionForm } from "@/app/components/transaction-form";
import { CreditCardWidget } from "@/app/components/credit-card-widget";
import { MonthSelector } from "@/app/components/month-selector";
import { EditTransactionSheet } from "@/app/components/edit-transaction-sheet"; 
import { ChartData, FinancialCharts } from "./components/charts";

// Componentes Shadcn UI
import { Card, CardContent } from "@/components/ui/card";

// Tipagem para receber Params da URL
interface DashboardProps {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function Dashboard(props: DashboardProps) {
  const searchParams = await props.searchParams; 
  
  const now = new Date();
  
  // 1. Determina o Mês/Ano Selecionado (ou usa o atual)
  const selectedMonth = searchParams.month ? Number(searchParams.month) : now.getMonth();
  const selectedYear = searchParams.year ? Number(searchParams.year) : now.getFullYear();

  // Datas de Início e Fim do Mês Selecionado
  const startOfMonth = new Date(selectedYear, selectedMonth, 1);
  const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

  // --- LÓGICA DE SALDO (CORTE TEMPORAL) ---
  // Se estamos vendo um mês passado, o saldo deve ser "quanto eu tinha no fim daquele mês"
  const isPastMonth = endOfMonth < now;
  const balanceCutoffDate = isPastMonth ? endOfMonth : now;

  // 2. BUSCAS NO BANCO DE DADOS

  // A. Busca Histórica (Para calcular o Saldo Acumulado)
  const historyTransactions = await prisma.transaction.findMany({
    where: { date: { lte: balanceCutoffDate } }
  });

  const totalIncome = historyTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + Number(t.amount), 0);
  
  const totalExpense = historyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + Number(t.amount), 0);
  
  const currentBalance = totalIncome - totalExpense;

  // B. Transações do Mês Selecionado (Para Lista, Gráficos e KPIs Mensais)
  const monthlyTransactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    },
    orderBy: { date: 'desc' }, 
    include: { category: true }
  });

  // C. Widget de Cartão (Faturas Futuras) - Independente da seleção de mês (sempre olha pra frente)
  const allFutureTransactions = await prisma.transaction.findMany({
    where: { date: { gte: startOfMonth } }, 
    include: { category: true }
  });

  const categories = await prisma.category.findMany();

  // --- PREPARAÇÃO DE DADOS PARA VISUALIZAÇÃO ---

  // KPIs Mensais
  const monthIncome = monthlyTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const monthExpense = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  // Dados para o Gráfico (Ordenados Cronologicamente ASC)
  const chartData: ChartData[] = [...monthlyTransactions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(t => ({
      amount: Number(t.amount), 
      date: t.dueDate.toISOString(), 
      type: t.type,
      categoryName: t.category?.name
    }));

  // Dados para o Widget de Cartão
  const widgetData = allFutureTransactions.map(t => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    date: t.date,      
    dueDate: t.dueDate, 
    paymentMethod: t.paymentMethod
  }));

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-6 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER: Título e Seletor de Mês */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Visão Geral</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas finanças de forma inteligente.</p>
        </div>
        
        <MonthSelector />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUNA ESQUERDA (Principal - 8 Colunas) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* BLOCO 1: CARDS KPI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1: SALDO (Com lógica temporal) */}
            <Card className="bg-zinc-900/60 backdrop-blur border-white/5 shadow-sm">
               <CardContent className="p-6">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm font-medium text-zinc-400">
                          {isPastMonth ? "Saldo ao fim do mês" : "Saldo Atual"}
                        </p>
                        <h2 className="text-3xl font-bold text-white tracking-tight mt-1">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentBalance)}
                        </h2>
                    </div>
                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/10">
                        <Wallet size={20} />
                    </div>
                 </div>

                 <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-md" title="Entradas neste mês">
                      <ArrowUpRight size={14} className="text-emerald-500" />
                      <span className="text-emerald-500 text-xs font-semibold">
                        +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(monthIncome)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-md" title="Saídas neste mês">
                      <ArrowDownLeft size={14} className="text-rose-500" />
                      <span className="text-rose-500 text-xs font-semibold">
                        -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(monthExpense)}
                      </span>
                    </div>
                 </div>
               </CardContent>
            </Card>

            {/* CARD 2: GASTOS DO MÊS */}
            <Card className="bg-zinc-900/60 backdrop-blur border-white/5 shadow-sm">
               <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-medium text-zinc-400">Saídas do Mês</p>
                      <h3 className="text-3xl font-bold text-white tracking-tight mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthExpense)}
                      </h3>
                    </div>
                    <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg border border-rose-500/10">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  
                  <p className="text-xs text-zinc-500">
                    Total de saídas em <span className="text-zinc-300 capitalize">{startOfMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>.
                  </p>
               </CardContent>
            </Card>
          </div>

          {/* BLOCO 2: GRÁFICOS */}
          <div className="rounded-xl overflow-hidden border border-white/5 shadow-sm">
             <div className="bg-zinc-900/60 backdrop-blur p-5 border-b border-white/5">
                <h3 className="font-semibold text-sm text-zinc-200 uppercase tracking-wider">Fluxo de Caixa Mensal</h3>
             </div>
             <div className="bg-zinc-900/30 p-5">
                <FinancialCharts data={chartData} />
             </div>
          </div>

          {/* BLOCO 3: LISTA DE TRANSAÇÕES (Extrato Mensal) */}
          <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div>
                   <h3 className="font-semibold text-sm text-zinc-200 uppercase tracking-wider">
                     Extrato de {startOfMonth.toLocaleString('pt-BR', { month: 'long' })}
                   </h3>
                   {/* DICA DE UX: Explica que é clicável */}
                   <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                     Clique em um lançamento para editar ou excluir.
                   </p>
                </div>
              </div>
              
              <Card className="bg-zinc-900/60 backdrop-blur border-white/5 overflow-hidden">
                {monthlyTransactions.length === 0 ? (
                   <div className="p-10 text-center text-sm text-zinc-500">Nenhuma transação neste mês.</div>
                ) : (
                   // Scroll gerenciado pelo CSS Global (globals.css)
                   <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto pr-2">
                     {monthlyTransactions.map((t) => (
                       // Envolve o item com o Sheet de Edição
                       <EditTransactionSheet 
                          key={t.id} 
                          categories={categories}
                          transaction={{
                            id: t.id,
                            description: t.description,
                            amount: Number(t.amount), // Converte Decimal do Prisma para Number
                            date: t.date,
                            type: t.type,
                            paymentMethod: t.paymentMethod,
                            categoryId: t.categoryId
                          }}
                       >
                         {/* CONTEÚDO VISUAL CLICÁVEL */}
                         <div 
                           className="flex items-center justify-between p-4 hover:bg-white/5 transition group cursor-pointer"
                           title="Clique para editar este lançamento"
                         >
                            {/* Lado Esquerdo: Ícone + Infos */}
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
                                  <span>{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                  {t.category && (
                                    <>
                                      <span className="w-0.5 h-0.5 rounded-full bg-zinc-600" />
                                      <span>{t.category.name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Lado Direito: Valor + Botão Lápis */}
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className={`text-sm font-bold tabular-nums ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-zinc-200'}`}>
                                     {t.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(t.amount))}
                                  </p>
                                  <div className="flex items-center justify-end gap-1.5 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                     {t.paymentMethod === 'CREDIT_CARD' && <CreditCardIcon size={10} className="text-zinc-400" />}
                                     <span className="text-[10px] text-zinc-500 capitalize">
                                       {t.paymentMethod === 'CREDIT_CARD' ? 'Crédito' : t.paymentMethod.toLowerCase()}
                                     </span>
                                  </div>
                                </div>
                                
                                {/* Ícone de Lápis (Indica Edição) */}
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

        {/* COLUNA DIREITA (Lateral - 4 Colunas) */}
        <div className="lg:col-span-4 space-y-6">
           <TransactionForm categories={categories} />
           <CreditCardWidget transactions={widgetData} />
        </div>

      </div>
    </div>
  );
}