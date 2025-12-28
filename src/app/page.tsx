import { TransactionType } from "@prisma/client"
import { Activity, ArrowDownLeft, ArrowUpRight, Receipt, TrendingUp, Wallet } from "lucide-react"

import { BankAccountsWidget } from "@/components/bank-accounts-widget"
import { ChartData, FinancialCharts } from "@/components/charts"
import { CreditCardWidget } from "@/components/credit-card-widget"
import { DashboardTabs } from "@/components/dashboard-tabs"
import { MonthSelector } from "@/components/month-selector"
import { PayInvoiceDialog } from "@/components/pay-invoice-dialog"
import { TransactionList } from "@/components/transactions-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import {
  SafeAccount,
  SafeCategory,
  SafeTransaction,
  toSafeTransaction,
} from "@/lib/transformers"

interface DashboardProps {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function Dashboard(props: DashboardProps) {
  const user = await getAuthenticatedUser()
  const userId = user.id

  const searchParams = await props.searchParams
  const now = new Date()

  const selectedMonth = searchParams.month ? Number(searchParams.month) : now.getMonth()
  const selectedYear = searchParams.year ? Number(searchParams.year) : now.getFullYear()

  const startOfMonth = new Date(selectedYear, selectedMonth, 1)
  const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999)

  const monthName = startOfMonth.toLocaleString("pt-BR", { month: "long" })
  const isPastMonth = endOfMonth < now

  const [
    rawBankAccounts,
    rawCategories,
    balanceAggregations,
    allMonthlyTransactions,
    futureCardTransactions,
  ] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { userId: userId },
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        includeInTotal: true,
        initialBalance: true,
      },
    }),
    prisma.category.findMany({
      where: { OR: [{ userId: userId }, { userId: null }] },
    }),
    prisma.transaction.groupBy({
      by: ["bankAccountId", "type"],
      _sum: { amount: true },
      where: {
        userId: userId,
        date: { lte: endOfMonth },
        paymentMethod: { not: "CREDIT_CARD" },
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId: userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { date: "desc" },
      include: {
        category: true,
        bankAccount: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId: userId,
        date: { gte: startOfMonth },
        paymentMethod: "CREDIT_CARD",
      },
      select: {
        id: true,
        description: true,
        amount: true,
        date: true,
        dueDate: true,
        paymentMethod: true,
      },
      orderBy: { date: "asc" },
    }),
  ])

  const bankAccounts = rawBankAccounts.map((acc) => ({
    ...acc,
    initialBalance: Number(acc.initialBalance),
  }))

  const categories: SafeCategory[] = rawCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    type: cat.type,
    userId: cat.userId,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  }))

  const safeAccounts: SafeAccount[] = bankAccounts.map((acc) => ({
    ...acc,
    initialBalance: Number(acc.initialBalance),
  }))

  const totalsMap: Record<string, number> = {}
  balanceAggregations.forEach((agg) => {
    if (agg.bankAccountId) {
      const key = `${agg.bankAccountId}_${agg.type}`
      totalsMap[key] = Number(agg._sum.amount || 0)
    }
  })

  const accountsWithBalance = bankAccounts.map((acc) => {
    const totalIncome = totalsMap[`${acc.id}_${TransactionType.INCOME}`] || 0
    const totalExpense = totalsMap[`${acc.id}_${TransactionType.EXPENSE}`] || 0
    return {
      ...acc,
      currentBalance: acc.initialBalance + totalIncome - totalExpense,
    }
  })

  const currentBalance = accountsWithBalance
    .filter((acc) => acc.includeInTotal)
    .reduce((sum, acc) => sum + acc.currentBalance, 0)

  const hiddenAccountIds = new Set(
    bankAccounts.filter((acc) => !acc.includeInTotal).map((acc) => acc.id)
  )

  const monthlyTransactions = allMonthlyTransactions.filter(
    (t) => !t.bankAccountId || !hiddenAccountIds.has(t.bankAccountId)
  )

  const monthIncome = monthlyTransactions
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + Number(t.amount), 0)

  const monthExpense = monthlyTransactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + Number(t.amount), 0)

  const startingBalance = currentBalance - monthIncome + monthExpense

  const listItemsNonCredit: SafeTransaction[] = monthlyTransactions
    .filter((t) => t.paymentMethod !== "CREDIT_CARD")
    .map(toSafeTransaction)

  const listItemsCredit = monthlyTransactions.filter((t) => t.paymentMethod === "CREDIT_CARD")
  const monthlyInvoiceTotal = listItemsCredit.reduce((acc, t) => acc + Number(t.amount), 0)

  const chartData: ChartData[] = monthlyTransactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t) => ({
      amount: Number(t.amount),
      date: t.date.toISOString(),
      type: t.type,
      categoryName: t.category?.name,
    }))

  const widgetData = futureCardTransactions.map((t) => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    date: t.date,
    dueDate: t.dueDate!,
    paymentMethod: t.paymentMethod,
  }))

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

  return (
    <div className="animate-in fade-in space-y-6 pb-20 duration-700 md:pb-0">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Visão Geral</h1>
          <p className="mt-0.5 text-xs text-zinc-400">
            Resumo financeiro de{" "}
            {startOfMonth.toLocaleString("pt-BR", { month: "long", year: "numeric" })}.
          </p>
        </div>
        <MonthSelector />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="group relative overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-lg shadow-black/5 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <CardContent className="relative p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {isPastMonth ? "Saldo Final" : "Disponível"}
                    </p>
                    <h2
                      className={`mt-0.5 text-3xl font-bold tracking-tight ${currentBalance < 0 ? "text-rose-400" : "text-white"}`}
                    >
                      {formatCurrency(currentBalance)}
                    </h2>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/10 bg-emerald-500/10 text-emerald-500">
                    <Wallet size={16} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <div className="rounded-full bg-emerald-500/20 p-0.5 text-emerald-400">
                        <ArrowUpRight size={10} />
                      </div>
                      <span className="text-[9px] font-bold uppercase text-zinc-400">Entradas</span>
                    </div>
                    <p className="text-sm font-semibold leading-none text-emerald-400">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        notation: "compact",
                      }).format(monthIncome)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/5 p-2.5">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <div className="rounded-full bg-rose-500/20 p-0.5 text-rose-400">
                        <ArrowDownLeft size={10} />
                      </div>
                      <span className="text-[9px] font-bold uppercase text-zinc-400">Saídas</span>
                    </div>
                    <p className="text-sm font-semibold leading-none text-rose-400">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        notation: "compact",
                      }).format(monthExpense)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-lg shadow-black/5 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <CardContent className="relative flex h-full flex-col justify-between p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Fatura Atual
                    </p>
                    <h3 className="mt-0.5 text-3xl font-bold tracking-tight text-white">
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
                  <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-2.5 text-[10px] text-zinc-500">
                    <Activity size={12} />
                    <span>Acumulado no cartão</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-lg shadow-black/5 backdrop-blur-xl">
            <CardHeader className="border-b border-white/5 px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                <TrendingUp size={14} /> Fluxo de Caixa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-[280px] w-full">
                <FinancialCharts data={chartData} initialBalance={startingBalance} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Últimas Movimentações
            </h3>

            <Card className="flex flex-col overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-lg shadow-black/5 backdrop-blur-xl">
              {monthlyInvoiceTotal > 0 && (
                <div className="flex flex-none items-center justify-between border-b border-white/5 bg-rose-500/5 p-3 px-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                      <Receipt size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Fatura Cartão</p>
                      <p className="text-[10px] text-zinc-400">
                        {listItemsCredit.length} compras agrupadas
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-bold tabular-nums text-rose-400">
                    - {formatCurrency(monthlyInvoiceTotal)}
                  </p>
                </div>
              )}

              <TransactionList
                transactions={listItemsNonCredit}
                categories={categories}
                accounts={safeAccounts}
              />
            </Card>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <BankAccountsWidget accounts={accountsWithBalance} />

          <Card className="overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 p-1 shadow-lg shadow-black/5 backdrop-blur-xl">
            <DashboardTabs categories={categories} accounts={bankAccounts} />
          </Card>

          <CreditCardWidget transactions={widgetData} accounts={accountsWithBalance} />
        </div>
      </div>
    </div>
  )
}