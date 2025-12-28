import { TransactionType } from "@prisma/client"
import { AlertCircle, Calendar, PiggyBank, Wallet } from "lucide-react"

import { MonthSelector } from "@/components/month-selector" // <--- Certifique-se que o import está correto
import { Card, CardContent } from "@/components/ui/card"

import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"

import { BudgetCard } from "./components/budget-card"

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

  const monthLabel = startOfMonth.toLocaleString("pt-BR", { month: "long", year: "numeric" })

  // 2. BUSCA DE DADOS
  const [categories, transactions] = await Promise.all([
    prisma.category.findMany({
      where: { OR: [{ userId: user.id }, { userId: null }] },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: startOfMonth, lte: endOfMonth },
        type: TransactionType.EXPENSE,
      },
      select: {
        amount: true,
        categoryId: true,
      },
    }),
  ])

  // 3. PROCESSAMENTO
  const spendingMap = new Map<string, number>()
  let totalSpent = 0

  transactions.forEach((t) => {
    if (t.categoryId) {
      const current = spendingMap.get(t.categoryId) || 0
      spendingMap.set(t.categoryId, current + Number(t.amount))
    }
    totalSpent += Number(t.amount)
  })

  const budgetItems = categories.map((cat) => {
    const spent = spendingMap.get(cat.id) || 0
    const limit = cat.budgetLimit ? Number(cat.budgetLimit) : 0

    return {
      category: {
        id: cat.id,
        name: cat.name,
        limit: limit > 0 ? limit : null,
      },
      spent,
    }
  })

  const totalBudget = budgetItems.reduce((acc, item) => acc + (item.category.limit || 0), 0)
  const itemsWithBudget = budgetItems.filter((i) => i.category.limit !== null)
  const itemsWithoutBudget = budgetItems.filter((i) => i.category.limit === null)

  itemsWithBudget.sort(
    (a, b) => b.spent / (b.category.limit || 1) - a.spent / (a.category.limit || 1)
  )

  const available = totalBudget - totalSpent
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 pb-24 duration-700 animate-in fade-in md:p-6">
      {/* 🟢 HEADER COM O SELETOR DE MÊS 🟢 */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
            <Calendar size={20} className="text-zinc-500" />
            Planejamento
          </h1>
          <p className="mt-0.5 text-xs text-zinc-400">
            Metas e gastos de <span className="capitalize text-zinc-200">{monthLabel}</span>.
          </p>
        </div>

        {/* Componente de navegação entre meses igual ao da Dashboard */}
        <div className="w-full md:w-auto">
          <MonthSelector />
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="group relative overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 backdrop-blur-xl">
          <CardContent className="flex h-28 flex-col justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                <Wallet size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Teto Total
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-white">
              {formatCurrency(totalBudget)}
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 backdrop-blur-xl">
          <CardContent className="flex h-28 flex-col justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                <AlertCircle size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Gasto no Período
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight text-white">
              {formatCurrency(totalSpent)}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 backdrop-blur-xl">
          {available < 0 && (
            <div className="pointer-events-none absolute inset-0 animate-pulse bg-rose-500/10" />
          )}
          <CardContent className="flex h-28 flex-col justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                <PiggyBank size={16} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Saldo Limite
              </span>
            </div>
            <p
              className={`text-2xl font-bold tracking-tight ${available < 0 ? "text-rose-500" : "text-emerald-500"}`}
            >
              {formatCurrency(available)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* LISTAGEM */}
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="px-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Orçamentos Definidos
          </h2>
          {itemsWithBudget.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-900/20 p-12 text-center">
              <p className="text-xs text-zinc-500">Nenhum orçamento configurado para este mês.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {itemsWithBudget.map((item) => (
                <BudgetCard key={item.category.id} category={item.category} spent={item.spent} />
              ))}
            </div>
          )}
        </section>

        {itemsWithoutBudget.length > 0 && (
          <section className="space-y-4 border-t border-white/5 pt-4">
            <h2 className="px-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Categorias sem Limite
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {itemsWithoutBudget.map((item) => (
                <BudgetCard key={item.category.id} category={item.category} spent={item.spent} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
