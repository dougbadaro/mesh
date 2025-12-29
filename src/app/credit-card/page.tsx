import { TransactionType } from "@prisma/client"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  ShoppingBag,
} from "lucide-react"
import Link from "next/link"

import { PayInvoiceDialog } from "@/components/pay-invoice-dialog"
import { TransactionItemRow } from "@/components/transaction-item-row"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import {
  SafeAccount,
  SafeCategory,
  SafeTransaction,
  toSafeTransaction,
} from "@/lib/transformers"
import { cn } from "@/lib/utils"

interface CreditCardPageProps {
  searchParams: Promise<{
    month?: string
    year?: string
  }>
}

export default async function CreditCardPage(props: CreditCardPageProps) {
  const user = await getAuthenticatedUser()
  const searchParams = await props.searchParams

  const userSettings = await prisma.user.findUnique({
    where: { id: user.id },
    select: { creditCardClosingDay: true, creditCardDueDay: true },
  })

  const closingDay = userSettings?.creditCardClosingDay || 1
  const dueDay = userSettings?.creditCardDueDay || 10

  const now = new Date()
  let selectedMonth = searchParams.month ? parseInt(searchParams.month) : now.getMonth()
  let selectedYear = searchParams.year ? parseInt(searchParams.year) : now.getFullYear()

  if (!searchParams.month && now.getDate() >= closingDay) {
    selectedMonth = selectedMonth + 1
    if (selectedMonth > 11) {
      selectedMonth = 0
      selectedYear = selectedYear + 1
    }
  }

  const invoiceDate = new Date(selectedYear, selectedMonth, 1)

  const startOfInvoice = new Date(selectedYear, selectedMonth, 1)
  const endOfInvoice = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59)

  const [rawTransactions, rawCategories, rawAccounts, historyTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        paymentMethod: "CREDIT_CARD",
        dueDate: {
          gte: startOfInvoice,
          lte: endOfInvoice,
        },
      },
      include: {
        category: true,
        bankAccount: true,
      },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({ where: { OR: [{ userId: user.id }, { userId: null }] } }),
    prisma.bankAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        initialBalance: true,
        includeInTotal: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        paymentMethod: { not: "CREDIT_CARD" },
      },
      select: { bankAccountId: true, amount: true, type: true },
    }),
  ])

  const accountsWithBalance = rawAccounts.map((acc) => {
    const accHistory = historyTransactions.filter((t) => t.bankAccountId === acc.id)
    const totalTransacted = accHistory.reduce((sum, t) => {
      const val = Number(t.amount)
      return t.type === TransactionType.INCOME ? sum + val : sum - val
    }, 0)

    return {
      ...acc,
      initialBalance: Number(acc.initialBalance),
      currentBalance: Number(acc.initialBalance) + totalTransacted,
    }
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

  const safeAccounts: SafeAccount[] = accountsWithBalance.map((acc) => ({
    ...acc,
    initialBalance: Number(acc.initialBalance),
  }))

  const transactions: SafeTransaction[] = rawTransactions.map(toSafeTransaction)

  const invoiceTotal = transactions.reduce((acc, t) => acc + t.amount, 0)
  const isPast =
    new Date(selectedYear, selectedMonth, dueDay) <
    new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const prevDate = new Date(selectedYear, selectedMonth - 1, 1)
  const nextDate = new Date(selectedYear, selectedMonth + 1, 1)

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

  const monthLabel = invoiceDate.toLocaleString("pt-BR", { month: "long", year: "numeric" })

  let statusColor = "text-zinc-400"
  let statusBg = "bg-zinc-500/10"
  let statusText = "Futura"
  let statusIcon = <Calendar size={14} />

  if (isPast) {
    statusColor = "text-rose-400"
    statusBg = "bg-rose-500/10"
    statusText = "Fechada"
    statusIcon = <AlertCircle size={14} />
  } else if (invoiceDate.getMonth() === now.getMonth() && now.getDate() < dueDay) {
    statusColor = "text-blue-400"
    statusBg = "bg-blue-500/10"
    statusText = "Aberta"
    statusIcon = <ShoppingBag size={14} />
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-24 duration-700 animate-in fade-in md:p-6">
      <div className="flex flex-col gap-6">
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
              Cartão de Crédito
            </h1>
            <p className="text-xs text-zinc-400">Gerencie suas faturas.</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-zinc-900/40 p-2 backdrop-blur-xl">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/10"
          >
            <Link href={`/credit-card?month=${prevDate.getMonth()}&year=${prevDate.getFullYear()}`}>
              <ChevronLeft size={16} />
            </Link>
          </Button>

          <div className="flex flex-col items-center">
            <span className="text-sm font-bold capitalize tracking-wide text-white">
              {monthLabel}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
              Vencimento dia {dueDay}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/10"
          >
            <Link href={`/credit-card?month=${nextDate.getMonth()}&year=${nextDate.getFullYear()}`}>
              <ChevronRight size={16} />
            </Link>
          </Button>
        </div>
      </div>

      <Card className="relative overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-sm backdrop-blur-xl">
        <div
          className={`absolute left-0 top-0 h-full w-1 ${isPast ? "bg-rose-500" : "bg-blue-500"}`}
        />
        <CardContent className="p-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-1">
              <div
                className={cn(
                  "mb-2 inline-flex w-fit items-center gap-1.5 rounded-lg border border-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest",
                  statusBg,
                  statusColor
                )}
              >
                {statusIcon}
                {statusText}
              </div>
              <p className="text-sm text-zinc-400">Total da Fatura</p>
              <h2 className="text-4xl font-bold tracking-tight text-white">
                {formatCurrency(invoiceTotal)}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Itens
                </p>
                <p className="text-sm text-zinc-300">{transactions.length} lançamentos</p>
              </div>
              <div className="hidden h-10 w-px bg-white/10 md:block" />

              <PayInvoiceDialog
                key={monthLabel}
                invoiceTotal={invoiceTotal}
                monthName={monthLabel}
                accounts={accountsWithBalance}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <ListFilter size={12} />
            Detalhamento
          </h3>
          <span className="text-[10px] text-zinc-600">Exibindo {transactions.length} itens</span>
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/10 bg-zinc-900/20 py-16 text-zinc-500">
            <CheckCircle2 size={32} className="opacity-20" />
            <p className="text-xs">Fatura zerada.</p>
          </div>
        ) : (
          <div className="flex flex-col rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl">
            {transactions.map((t, index) => (
              <TransactionItemRow
                key={t.id}
                transaction={t}
                categories={categories}
                accounts={safeAccounts}
                isLast={index === transactions.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}