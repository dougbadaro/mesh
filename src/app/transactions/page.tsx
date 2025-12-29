import { Prisma, TransactionType } from "@prisma/client"
import { ArrowLeft, ChevronLeft, ChevronRight, SearchX } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import { SafeAccount, SafeCategory, SafeTransaction, toSafeTransaction } from "@/lib/transformers"

import { TransactionFilters } from "./components/transaction-filters"
import { TransactionsTable } from "./components/transactions-table"

interface TransactionsPageProps {
  searchParams: Promise<{
    query?: string
    page?: string
    type?: string
    future?: string
    bankId?: string
  }>
}

export default async function TransactionsPage(props: TransactionsPageProps) {
  const user = await getAuthenticatedUser()
  const searchParams = await props.searchParams

  const query = searchParams?.query || ""
  const rawType = searchParams?.type
  const bankId = searchParams?.bankId

  const typeFilter = Object.values(TransactionType).includes(rawType as TransactionType)
    ? (rawType as TransactionType)
    : undefined

  const showFuture = searchParams?.future === "true"
  const currentPage = Number(searchParams?.page) || 1
  const itemsPerPage = 15

  let dateFilter: Prisma.DateTimeFilter | undefined = undefined
  if (!showFuture) {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    dateFilter = { lte: endOfMonth }
  }

  const whereCondition: Prisma.TransactionWhereInput = {
    userId: user.id,
    deletedAt: null,
    description: {
      contains: query,
      mode: "insensitive",
    },
    ...(typeFilter && { type: typeFilter }),
    ...(dateFilter && { date: dateFilter }),
    ...(bankId && { bankAccountId: bankId }),
  }

  const [totalItems, rawTransactions, rawCategories, rawAccounts] = await Promise.all([
    prisma.transaction.count({ where: whereCondition }),
    prisma.transaction.findMany({
      where: whereCondition,
      include: {
        category: true,
        bankAccount: true,
      },
      orderBy: { date: "desc" },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
    }),
    prisma.category.findMany({
      where: { OR: [{ userId: user.id }, { userId: null }] },
    }),
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
  ])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const categories: SafeCategory[] = rawCategories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    type: cat.type,
    userId: cat.userId,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  }))

  const accounts: SafeAccount[] = rawAccounts.map((acc) => ({
    ...acc,
    initialBalance: Number(acc.initialBalance),
  }))

  const transactions: SafeTransaction[] = rawTransactions.map(toSafeTransaction)

  return (
    <main className="mx-auto max-w-6xl p-4 pb-24 duration-700 animate-in fade-in md:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
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
            <h1 className="text-xl font-bold tracking-tight text-white">Transações</h1>
            <p className="text-xs text-zinc-400">
              {totalItems} registros {!showFuture && "(limite mensal)"}
            </p>
          </div>
        </div>
      </div>

      <TransactionFilters accounts={accounts} />

      <div className="mt-6 overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 shadow-sm backdrop-blur-xl">
        <div className="hidden grid-cols-12 gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 md:grid">
          <div className="col-span-5">Descrição</div>
          <div className="col-span-2">Data</div>
          <div className="col-span-2">Categoria / Conta</div>
          <div className="col-span-3 text-right md:pr-8">Valor</div>
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-zinc-500">
            <SearchX size={32} className="opacity-30" />
            <p className="text-xs">Nenhum resultado.</p>
          </div>
        ) : (
          <TransactionsTable
            transactions={transactions}
            categories={categories}
            accounts={accounts}
          />
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-white/10 bg-zinc-900/50 hover:bg-white/5 disabled:opacity-30"
            asChild={currentPage > 1}
            disabled={currentPage <= 1}
          >
            {currentPage > 1 ? (
              <Link
                href={`/transactions?query=${query}&type=${rawType || ""}&bankId=${bankId || ""}&future=${showFuture}&page=${currentPage - 1}`}
              >
                <ChevronLeft size={14} />
              </Link>
            ) : (
              <ChevronLeft size={14} />
            )}
          </Button>

          <span className="px-3 text-xs font-medium tabular-nums text-zinc-500">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-white/10 bg-zinc-900/50 hover:bg-white/5 disabled:opacity-30"
            asChild={currentPage < totalPages}
            disabled={currentPage >= totalPages}
          >
            {currentPage < totalPages ? (
              <Link
                href={`/transactions?query=${query}&type=${rawType || ""}&bankId=${bankId || ""}&future=${showFuture}&page=${currentPage + 1}`}
              >
                <ChevronRight size={14} />
              </Link>
            ) : (
              <ChevronRight size={14} />
            )}
          </Button>
        </div>
      )}
    </main>
  )
}
