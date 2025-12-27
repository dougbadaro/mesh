import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import { BudgetCard } from "./components/budget-card"
import { Wallet, PiggyBank, AlertCircle, Calendar } from "lucide-react"
import { TransactionType } from "@prisma/client"

import { Card, CardContent } from "@/components/ui/card"
import { MonthSelector } from "@/components/month-selector" // <--- Certifique-se que o import está correto

interface BudgetPageProps {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function BudgetPage(props: BudgetPageProps) {
  const user = await getAuthenticatedUser()
  const searchParams = await props.searchParams

  // 1. LÓGICA DE DATA
  const now = new Date()
  const selectedMonth = searchParams.month ? Number(searchParams.month) : now.getMonth()
  const selectedYear = searchParams.year ? Number(searchParams.year) : now.getFullYear()

  const startOfMonth = new Date(selectedYear, selectedMonth, 1)
  const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999)

  const monthLabel = startOfMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  // 2. BUSCA DE DADOS
  const [categories, transactions] = await Promise.all([
    prisma.category.findMany({
        where: { OR: [{ userId: user.id }, { userId: null }] },
        orderBy: { name: 'asc' }
    }),
    prisma.transaction.findMany({
        where: {
            userId: user.id,
            date: { gte: startOfMonth, lte: endOfMonth },
            type: TransactionType.EXPENSE
        },
        select: {
            amount: true,
            categoryId: true
        }
    })
  ])

  // 3. PROCESSAMENTO
  const spendingMap = new Map<string, number>()
  let totalSpent = 0

  transactions.forEach(t => {
     if (t.categoryId) {
        const current = spendingMap.get(t.categoryId) || 0
        spendingMap.set(t.categoryId, current + Number(t.amount))
     }
     totalSpent += Number(t.amount)
  })

  const budgetItems = categories.map(cat => {
     const spent = spendingMap.get(cat.id) || 0
     const limit = cat.budgetLimit ? Number(cat.budgetLimit) : 0
     
     return {
        category: {
            id: cat.id,
            name: cat.name,
            limit: limit > 0 ? limit : null
        },
        spent
     }
  })

  const totalBudget = budgetItems.reduce((acc, item) => acc + (item.category.limit || 0), 0)
  const itemsWithBudget = budgetItems.filter(i => i.category.limit !== null)
  const itemsWithoutBudget = budgetItems.filter(i => i.category.limit === null)
  
  itemsWithBudget.sort((a, b) => (b.spent / (b.category.limit || 1)) - (a.spent / (a.category.limit || 1)))

  const available = totalBudget - totalSpent
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24 animate-in fade-in duration-700 space-y-8">
      
      {/* 🟢 HEADER COM O SELETOR DE MÊS 🟢 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar size={20} className="text-zinc-500" />
            Planejamento
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Metas e gastos de <span className="text-zinc-200 capitalize">{monthLabel}</span>.
          </p>
        </div>
        
        {/* Componente de navegação entre meses igual ao da Dashboard */}
        <div className="w-full md:w-auto">
            <MonthSelector />
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden relative group">
            <CardContent className="p-5 flex flex-col justify-between h-28">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                     <Wallet size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Teto Total</span>
                </div>
                <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(totalBudget)}</p>
            </CardContent>
         </Card>

         <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden relative group">
            <CardContent className="p-5 flex flex-col justify-between h-28">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                     <AlertCircle size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Gasto no Período</span>
                </div>
                <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(totalSpent)}</p>
            </CardContent>
         </Card>

         <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden relative">
            {available < 0 && <div className="absolute inset-0 bg-rose-500/10 animate-pulse pointer-events-none" />}
            <CardContent className="p-5 flex flex-col justify-between h-28">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                     <PiggyBank size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Saldo Limite</span>
                </div>
                <p className={`text-2xl font-bold tracking-tight ${available < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                  {formatCurrency(available)}
                </p>
            </CardContent>
         </Card>
      </div>

      {/* LISTAGEM */}
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Orçamentos Definidos</h2>
          {itemsWithBudget.length === 0 ? (
              <div className="p-12 border border-dashed border-white/10 rounded-3xl text-center bg-zinc-900/20">
                  <p className="text-xs text-zinc-500">Nenhum orçamento configurado para este mês.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {itemsWithBudget.map(item => (
                      <BudgetCard 
                          key={item.category.id} 
                          category={item.category} 
                          spent={item.spent} 
                      />
                  ))}
              </div>
          )}
        </section>

        {itemsWithoutBudget.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-white/5">
              <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Categorias sem Limite</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {itemsWithoutBudget.map(item => (
                      <BudgetCard 
                          key={item.category.id} 
                          category={item.category} 
                          spent={item.spent} 
                      />
                  ))}
              </div>
          </section>
        )}
      </div>
    </div>
  )
}