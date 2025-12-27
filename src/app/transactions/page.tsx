import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth-check"
import { TransactionFilters } from "./components/transaction-filters"
import { EditTransactionSheet } from "@/components/edit-transaction-sheet"
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownLeft, 
  SearchX,
  CreditCard,
  Pencil,
  Wallet
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TransactionType, Prisma } from "@prisma/client"

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

  // --- CONFIGURAÇÃO ---
  const query = searchParams?.query || ""
  const rawType = searchParams?.type
  const bankId = searchParams?.bankId

  const typeFilter = Object.values(TransactionType).includes(rawType as TransactionType) 
    ? (rawType as TransactionType) 
    : undefined

  const showFuture = searchParams?.future === 'true' 
  const currentPage = Number(searchParams?.page) || 1
  const itemsPerPage = 15

  // --- LÓGICA DE DATA ---
  let dateFilter: Prisma.DateTimeFilter | undefined = undefined
  if (!showFuture) {
      const now = new Date()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      dateFilter = { lte: endOfMonth }
  }

  // --- WHERE CONDITION ---
  const whereCondition: Prisma.TransactionWhereInput = {
    userId: user.id,
    description: {
      contains: query,
      mode: 'insensitive', 
    },
    ...(typeFilter && { type: typeFilter }),
    ...(dateFilter && { date: dateFilter }),
    ...(bankId && { bankAccountId: bankId }) 
  }

  // --- BUSCA PARALELA ---
  const [totalItems, rawTransactions, rawCategories, rawAccounts] = await Promise.all([
    prisma.transaction.count({ where: whereCondition }),
    prisma.transaction.findMany({
        where: whereCondition,
        include: { 
            category: true,
            bankAccount: { select: { name: true, color: true } } 
        },
        orderBy: { date: 'desc' },
        skip: (currentPage - 1) * itemsPerPage,
        take: itemsPerPage,
    }),
    prisma.category.findMany({
        where: { OR: [{ userId: user.id }, { userId: null }] }
    }),
    prisma.bankAccount.findMany({
        where: { userId: user.id },
        select: { id: true, name: true }
    })
  ])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // --- SANITIZAÇÃO DE DADOS ---
  const categories = rawCategories.map(cat => ({
    ...cat,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null
  }))

  const accounts = rawAccounts;

  const transactions = rawTransactions.map(t => ({
    ...t,
    amount: Number(t.amount),
    category: t.category ? {
        ...t.category,
        budgetLimit: t.category.budgetLimit ? Number(t.category.budgetLimit) : null
    } : null
  }))

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  
  const formatDate = (date: Date) => 
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 pb-24 animate-in fade-in duration-700">
      
      {/* HEADER - Compacto */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-xl hover:bg-white/5 text-zinc-400">
                <Link href="/">
                    <ArrowLeft size={18} />
                </Link>
            </Button>
            <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Transações</h1>
                <p className="text-xs text-zinc-400">
                   {totalItems} registros {!showFuture && "(limite mensal)"}
                </p>
            </div>
        </div>
      </div>

      {/* FILTROS */}
      <TransactionFilters accounts={accounts} />

      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-sm mt-6">
        
        {/* Header Tabela Desktop - Mais sutil */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.02] text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <div className="col-span-5">Descrição</div>
            <div className="col-span-2">Data</div>
            <div className="col-span-2">Categoria / Conta</div>
            <div className="col-span-3 text-right">Valor</div>
        </div>

        {/* Lista de Transações */}
        {transactions.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-24 text-zinc-500 gap-2">
              <SearchX size={32} className="opacity-30" />
              <p className="text-xs">Nenhum resultado.</p>
           </div>
        ) : (
           <div className="divide-y divide-white/5">
              {transactions.map((t) => (
                 <EditTransactionSheet 
                    key={t.id} 
                    transaction={{
                        ...t,
                        categoryId: t.categoryId,
                        bankAccountId: t.bankAccountId 
                    }} 
                    categories={categories}
                    accounts={accounts} 
                 >
                    <div 
                        className="group relative md:grid md:grid-cols-12 md:gap-4 p-4 px-6 items-center hover:bg-white/[0.03] transition-colors cursor-pointer outline-none flex flex-col gap-2"
                        role="button"
                        tabIndex={0}
                    >
                        {/* COLUNA DESCRIÇÃO */}
                        <div className="col-span-5 flex items-center gap-4 w-full text-left">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                                t.type === 'INCOME' 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : 'bg-zinc-800 text-zinc-400'
                            }`}>
                                {t.type === 'INCOME' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                            </div>
                            <div className="overflow-hidden min-w-0">
                                <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition">
                                    {t.description}
                                </p>
                                <div className="flex items-center gap-2 md:hidden mt-0.5">
                                    <span className="text-[10px] text-zinc-500">{formatDate(t.date)}</span>
                                    {t.category && <span className="text-[10px] text-zinc-500">• {t.category.name}</span>}
                                </div>
                            </div>
                        </div>

                        {/* COLUNA DATA */}
                        <div className="col-span-2 hidden md:block text-xs text-zinc-400 text-left font-mono">
                            {formatDate(t.date)}
                        </div>

                        {/* COLUNA CATEGORIA E CONTA */}
                        <div className="col-span-2 hidden md:block text-left">
                            <div className="flex flex-col gap-1 items-start">
                                {t.category ? (
                                    <span className="text-[10px] text-zinc-400 font-medium px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5">
                                        {t.category.name}
                                    </span>
                                ) : (
                                    <span className="text-zinc-600 text-[10px]">-</span>
                                )}

                                {t.bankAccount && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500" title={t.bankAccount.name}>
                                        <div 
                                            className="w-1.5 h-1.5 rounded-full shrink-0" 
                                            style={{ backgroundColor: t.bankAccount.color || "#10b981" }}
                                        />
                                        <span className="truncate max-w-[100px]">{t.bankAccount.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* COLUNA VALOR */}
                        <div className="col-span-3 w-full flex flex-row md:flex-col items-center justify-between md:items-end gap-0.5">
                             <p className={`text-sm font-bold tabular-nums ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-zinc-200'}`}>
                                {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                             </p>
                             <div className="flex items-center gap-1 text-zinc-600 text-[10px] uppercase tracking-wide">
                                {t.paymentMethod === 'CREDIT_CARD' && <CreditCard size={10} />}
                                <span>{t.paymentMethod.toLowerCase().replace('_', ' ')}</span>
                             </div>
                        </div>
                        
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                            <div className="p-1.5 bg-white/10 rounded-full text-white backdrop-blur-md">
                                <Pencil size={12} />
                            </div>
                        </div>
                    </div>
                 </EditTransactionSheet>
              ))}
           </div>
        )}
      </div>

      {/* PAGINAÇÃO - Compacta */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6">
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-white/10 bg-zinc-900/50 hover:bg-white/5 disabled:opacity-30 rounded-lg"
                asChild={currentPage > 1}
                disabled={currentPage <= 1}
            >
                {currentPage > 1 ? (
                    <Link href={`/transactions?query=${query}&type=${rawType || ''}&bankId=${bankId || ''}&future=${showFuture}&page=${currentPage - 1}`}>
                        <ChevronLeft size={14} />
                    </Link>
                ) : (
                    <ChevronLeft size={14} />
                )}
            </Button>
            
            <span className="text-xs text-zinc-500 font-medium px-3 tabular-nums">
                {currentPage} / {totalPages}
            </span>

            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-white/10 bg-zinc-900/50 hover:bg-white/5 disabled:opacity-30 rounded-lg"
                asChild={currentPage < totalPages}
                disabled={currentPage >= totalPages}
            >
                {currentPage < totalPages ? (
                    <Link href={`/transactions?query=${query}&type=${rawType || ''}&bankId=${bankId || ''}&future=${showFuture}&page=${currentPage + 1}`}>
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