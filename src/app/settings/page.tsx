import { TransactionType } from "@prisma/client"
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  Database,
  Shield,
  Terminal,
  User,
  Wallet,
} from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import { checkAndGenerateRecurringTransactions } from "@/lib/recurring-job"
import { SafeAccount, SafeCategory } from "@/lib/transformers"

import { BankAccountManager } from "./components/bank-account-manager"
import { CategoryManager } from "./components/category-manager"
import { CreditCardSettings } from "./components/credit-card-settings"
import { ExportCsvCard } from "./components/export-csv-card"
import { TrashModal } from "./components/trash-modal" // <--- Importe o novo componente

interface AccountWithBalance extends SafeAccount {
  currentBalance: number
}

export default async function SettingsPage() {
  const authUser = await getAuthenticatedUser()

  await checkAndGenerateRecurringTransactions(authUser.id)

  // =================================================================
  // 1. DADOS ATIVOS (Para as listas principais)
  // =================================================================

  const rawBankAccounts = await prisma.bankAccount.findMany({
    where: { userId: authUser.id, deletedAt: null },
    orderBy: { name: "asc" },
  })

  // Cálculo de Saldo (Corrigido e Igual Dashboard)
  const balanceAggregations = await prisma.transaction.groupBy({
    by: ["bankAccountId", "type"],
    _sum: { amount: true },
    where: {
      userId: authUser.id,
      deletedAt: null,
      paymentMethod: { not: "CREDIT_CARD" },
      date: { lte: new Date() },
    },
  })

  const totalsMap: Record<string, number> = {}
  balanceAggregations.forEach((agg) => {
    if (agg.bankAccountId) {
      const key = `${agg.bankAccountId}_${agg.type}`
      totalsMap[key] = Number(agg._sum.amount || 0)
    }
  })

  const bankAccounts: AccountWithBalance[] = rawBankAccounts.map((acc) => {
    const totalIncome = totalsMap[`${acc.id}_${TransactionType.INCOME}`] || 0
    const totalExpense = totalsMap[`${acc.id}_${TransactionType.EXPENSE}`] || 0
    const initial = Number(acc.initialBalance)

    return {
      ...acc,
      initialBalance: initial,
      currentBalance: initial + totalIncome - totalExpense,
    }
  })

  const rawCategories = await prisma.category.findMany({
    where: { OR: [{ userId: authUser.id }, { userId: null }], deletedAt: null },
    orderBy: { name: "asc" },
  })

  const categories: SafeCategory[] = rawCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    type: cat.type,
    userId: cat.userId,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  }))

  const userSettings = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { creditCardClosingDay: true, creditCardDueDay: true },
  })

  // =================================================================
  // 2. DADOS DELETADOS (Para a Lixeira)
  // =================================================================

  const deletedTransactionsRaw = await prisma.transaction.findMany({
    where: { userId: authUser.id, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    take: 50, // Limite de segurança
  })

  const deletedCategoriesRaw = await prisma.category.findMany({
    where: { userId: authUser.id, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
  })

  const deletedAccountsRaw = await prisma.bankAccount.findMany({
    where: { userId: authUser.id, deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
  })

  // Formatando dados para a lixeira
  const trashData = {
    transactions: deletedTransactionsRaw.map((t) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      type: t.type,
      deletedAt: t.deletedAt!.toISOString(),
    })),
    categories: deletedCategoriesRaw.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      deletedAt: c.deletedAt!.toISOString(),
    })),
    bankAccounts: deletedAccountsRaw.map((b) => ({
      id: b.id,
      name: b.name,
      deletedAt: b.deletedAt!.toISOString(),
    })),
  }

  const isVerified = !!authUser.emailVerified

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 pb-24 duration-700 animate-in fade-in md:p-6">
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
            Configurações
          </h1>
          <p className="text-xs text-zinc-400">Preferências e parâmetros do sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="space-y-6 md:col-span-4">
          <div className="sticky top-6 flex flex-col items-center rounded-3xl border border-white/5 bg-zinc-900/40 p-6 text-center backdrop-blur-xl">
            <Avatar className="mb-3 h-20 w-20 border-2 border-zinc-800 shadow-xl">
              <AvatarImage src={authUser.image || ""} />
              <AvatarFallback className="bg-zinc-800 text-xl text-zinc-400">
                <User />
              </AvatarFallback>
            </Avatar>

            <h2 className="text-base font-bold tracking-tight text-white">{authUser.name}</h2>
            <p className="mb-4 font-mono text-[10px] tracking-wide text-zinc-500">
              {authUser.email}
            </p>

            {isVerified ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-500">
                <Shield size={10} />
                Verificado
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-amber-500">
                <AlertTriangle size={10} />
                Não Verificado
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8 md:col-span-8">
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Wallet size={14} className="text-emerald-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Minhas Carteiras
              </h3>
            </div>
            <BankAccountManager initialAccounts={bankAccounts} />
          </section>

          <Separator className="bg-white/5" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <CreditCard size={14} className="text-emerald-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Parâmetros Financeiros
              </h3>
            </div>
            <CreditCardSettings
              initialClosingDay={userSettings?.creditCardClosingDay ?? 6}
              initialDueDay={userSettings?.creditCardDueDay ?? 10}
            />
          </section>

          <Separator className="bg-white/5" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Terminal size={14} className="text-emerald-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Categorias
              </h3>
            </div>
            <CategoryManager categories={categories} currentUserId={authUser.id} />
          </section>

          <Separator className="bg-white/5" />

          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Database size={14} className="text-emerald-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Gestão de Dados
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ExportCsvCard />

              {/* AQUI ESTÁ O NOVO COMPONENTE DE MODAL */}
              <TrashModal 
                transactions={trashData.transactions}
                categories={trashData.categories}
                bankAccounts={trashData.bankAccounts}
              />
            </div>
          </section>

          <div className="flex flex-col items-center justify-center gap-2 pb-2 pt-8 text-zinc-700 opacity-40 transition-opacity hover:opacity-100">
            <p className="font-mono text-[9px] uppercase tracking-widest">Mesh System v1.2</p>
          </div>
        </div>
      </div>
    </div>
  )
}