import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import { BudgetCard } from "./components/budget-card"
import { Wallet, PiggyBank, AlertCircle } from "lucide-react"
import { TransactionType } from "@prisma/client"

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

  // 1. Processamento de Gastos (Map)
  const spendingMap = new Map<string, number>()
  let totalSpent = 0

  transactions.forEach(t => {
     if (t.categoryId) {
        const current = spendingMap.get(t.categoryId) || 0
        spendingMap.set(t.categoryId, current + Number(t.amount))
     }
     totalSpent += Number(t.amount)
  })

  // 2. Criação da Lista de Itens (Transformação Pura)
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

  // 3. Cálculo do Total de Orçamento (Reduce)
  // Somamos aqui fora para evitar o erro de reassign dentro do map
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
    <div className="max-w-5xl mx-auto p-6 md:p-10 pb-20 animate-in fade-in duration-700 space-y-10">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white">Planejamento Mensal</h1>
        <p className="text-sm text-zinc-400">Controle seus limites de gastos por categoria.</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between h-32">
            <div className="flex items-center gap-3 text-zinc-400">
                <div className="p-2 bg-zinc-800 rounded-lg">
                    <Wallet size={18} />
                </div>
                <span className="text-sm font-medium uppercase tracking-wide">Teto de Gastos</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalBudget)}</p>
         </div>

         <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between h-32">
            <div className="flex items-center gap-3 text-zinc-400">
                <div className="p-2 bg-zinc-800 rounded-lg">
                    <AlertCircle size={18} />
                </div>
                <span className="text-sm font-medium uppercase tracking-wide">Já utilizado</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalSpent)}</p>
         </div>

         <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden">
            {available < 0 && <div className="absolute inset-0 bg-rose-500/10 animate-pulse" />}
            
            <div className="flex items-center gap-3 text-zinc-400 relative z-10">
                <div className="p-2 bg-zinc-800 rounded-lg">
                    <PiggyBank size={18} />
                </div>
                <span className="text-sm font-medium uppercase tracking-wide">Disponível</span>
            </div>
            <p className={`text-3xl font-bold relative z-10 ${available < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                {formatCurrency(available)}
            </p>
         </div>
      </div>

      {/* COM ORÇAMENTO */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-200">Meus Orçamentos</h2>
        {itemsWithBudget.length === 0 ? (
            <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center text-zinc-500 bg-zinc-900/20">
                Você ainda não definiu limites. Clique nas categorias abaixo para começar.
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
      </div>

      {/* SEM ORÇAMENTO */}
      {itemsWithoutBudget.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-white/5">
            <h2 className="text-lg font-semibold text-zinc-500">Outras Categorias</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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