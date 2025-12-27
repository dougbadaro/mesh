import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import { BudgetCard } from "./components/budget-card"
import { Wallet, PiggyBank, AlertCircle } from "lucide-react"
import { TransactionType } from "@prisma/client"

import { Card, CardContent } from "@/components/ui/card"

export default async function BudgetPage() {
  const user = await getAuthenticatedUser()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

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

  // 1. Processamento de Gastos
  const spendingMap = new Map<string, number>()
  let totalSpent = 0

  transactions.forEach(t => {
     if (t.categoryId) {
        const current = spendingMap.get(t.categoryId) || 0
        spendingMap.set(t.categoryId, current + Number(t.amount))
     }
     totalSpent += Number(t.amount)
  })

  // 2. Criação da Lista de Itens
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

  // 3. Cálculo do Total de Orçamento
  const totalBudget = budgetItems.reduce((acc, item) => {
      return acc + (item.category.limit || 0)
  }, 0)

  // Separação e Ordenação
  const itemsWithBudget = budgetItems.filter(i => i.category.limit !== null)
  const itemsWithoutBudget = budgetItems.filter(i => i.category.limit === null)
  
  itemsWithBudget.sort((a, b) => {
      const pctA = (a.spent / (a.category.limit || 1))
      const pctB = (b.spent / (b.category.limit || 1))
      return pctB - pctA 
  })

  const available = totalBudget - totalSpent
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24 animate-in fade-in duration-700 space-y-8">
      
      {/* HEADER - Compacto */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Planejamento</h1>
        <p className="text-xs text-zinc-400">Controle seus limites mensais por categoria.</p>
      </div>

      {/* KPI CARDS - Compactos e Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
            <CardContent className="p-5 flex flex-col justify-between h-28">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                     <Wallet size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Teto de Gastos</span>
               </div>
               <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(totalBudget)}</p>
            </CardContent>
         </Card>

         <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
            <CardContent className="p-5 flex flex-col justify-between h-28">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                     <AlertCircle size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Já utilizado</span>
               </div>
               <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(totalSpent)}</p>
            </CardContent>
         </Card>

         <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden relative">
            {available < 0 && <div className="absolute inset-0 bg-rose-500/10 animate-pulse pointer-events-none" />}
            <CardContent className="p-5 flex flex-col justify-between h-28 relative z-10">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                     <PiggyBank size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Disponível</span>
               </div>
               <p className={`text-2xl font-bold tracking-tight ${available < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                  {formatCurrency(available)}
               </p>
            </CardContent>
         </Card>
      </div>

      {/* COM ORÇAMENTO */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Meus Orçamentos</h2>
        {itemsWithBudget.length === 0 ? (
            <div className="p-8 border border-dashed border-white/10 rounded-3xl text-center flex flex-col items-center justify-center gap-2 bg-zinc-900/20">
                <AlertCircle size={24} className="text-zinc-600 opacity-50" />
                <p className="text-xs text-zinc-500">Defina limites nas categorias abaixo para começar.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {itemsWithBudget.map(item => (
                    <BudgetCard 
                        key={item.category.id} 
                        category={item.category} 
                        spent={item.spent} 
                    />
                ))}
            </div>
        )}
      </div>

      {/* SEM ORÇAMENTO */}
      {itemsWithoutBudget.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-white/5">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Sem Limite Definido</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {itemsWithoutBudget.map(item => (
                    <BudgetCard 
                        key={item.category.id} 
                        category={item.category} 
                        spent={item.spent} 
                    />
                ))}
            </div>
        </div>
      )}

    </div>
  )
}