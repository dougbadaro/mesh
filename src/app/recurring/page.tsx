import { ArrowLeft, CalendarClock, Plus, Receipt, Wallet } from "lucide-react"
import Link from "next/link"

import { CreateRecurringSheet } from "@/components/create-recurring-sheet"
import { RecurringItem } from "@/components/recurring-item"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import { checkAndGenerateRecurringTransactions } from "@/lib/recurring-job"
import { SafeAccount } from "@/lib/transformers"

export default async function RecurringPage() {
  const user = await getAuthenticatedUser()

  // 🔄 Garante que as recorrências futuras existam (mínimo 1 ano)
  await checkAndGenerateRecurringTransactions(user.id)

  const recurringsRaw = await prisma.recurringTransaction.findMany({
    where: {
      userId: user.id,
      active: true,
      deletedAt: null,
    },
    include: {
      category: true,
      bankAccount: { select: { name: true, color: true } },
    },
    orderBy: { startDate: "asc" },
  })

  const rawCategories = await prisma.category.findMany({
    where: { OR: [{ userId: user.id }, { userId: null }] },
  })

  const rawBankAccounts = await prisma.bankAccount.findMany({
    where: { userId: user.id },
  })

  const bankAccounts: SafeAccount[] = rawBankAccounts.map((acc) => ({
    ...acc,
    initialBalance: Number(acc.initialBalance),
  }))

  const categories = rawCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    type: cat.type,
    userId: cat.userId,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  }))

  const recurrings = recurringsRaw.map((rec) => ({
    ...rec,
    amount: Number(rec.amount),
    startDate: rec.startDate.toISOString(),
    createdAt: rec.createdAt.toISOString(),
    updatedAt: rec.updatedAt.toISOString(),
    deletedAt: rec.deletedAt ? rec.deletedAt.toISOString() : null,
    category: rec.category
      ? {
          ...rec.category,
          budgetLimit: rec.category.budgetLimit ? Number(rec.category.budgetLimit) : null,
          createdAt: rec.category.createdAt.toISOString(),
          updatedAt: rec.category.updatedAt.toISOString(),
        }
      : null,
  }))

  const totalMonthly = recurrings.reduce((acc, curr) => acc + curr.amount, 0)

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 pb-24 duration-700 animate-in fade-in md:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-9 w-9 rounded-xl text-zinc-400 hover:bg-white/5"
          >
            <Link href="/">
              <ArrowLeft size={18} />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
              Gastos Fixos
            </h1>
            <p className="text-xs text-zinc-400">Assinaturas e contas recorrentes</p>
          </div>
        </div>

        <CreateRecurringSheet categories={categories} accounts={bankAccounts}>
          <Button className="h-9 gap-2 rounded-xl bg-white px-4 text-xs font-bold text-black shadow-lg shadow-white/5 transition-transform hover:bg-zinc-200 active:scale-95">
            <Plus size={14} /> Novo Gasto Fixo
          </Button>
        </CreateRecurringSheet>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-sm backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/10 bg-rose-500/10 text-rose-500">
              <Wallet size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Custo Mensal
              </p>
              <h2 className="mt-0.5 text-2xl font-bold tracking-tight text-white">
                {formatCurrency(totalMonthly)}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-sm backdrop-blur-xl">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/10 bg-blue-500/10 text-blue-500">
              <CalendarClock size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Total de Itens
              </p>
              <h2 className="mt-0.5 text-2xl font-bold tracking-tight text-white">
                {recurrings.length}{" "}
                <span className="text-xs font-medium text-zinc-500">assinaturas</span>
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Suas Assinaturas
        </h3>

        {recurrings.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-white/10 bg-white/[0.01]">
            <CardContent className="flex flex-col items-center justify-center space-y-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/50">
                <Receipt size={24} className="text-zinc-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-white">Nenhum gasto fixo</h3>
                <p className="mx-auto max-w-[200px] text-xs text-zinc-500">
                  Adicione contas como Aluguel ou Internet para previsão automática.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {recurrings.map((rec) => (
              <RecurringItem
                key={rec.id}
                data={rec}
                accounts={bankAccounts}
                categories={categories}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
