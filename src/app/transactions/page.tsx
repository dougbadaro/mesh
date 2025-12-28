import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth-check"
import { TransactionFilters } from "./components/transaction-filters"

// 🟢 IMPORTAÇÕES: Tipos seguros do componente e tipos do Prisma
import { 
  TransactionsTable, 
  SafeTransaction, 
  SafeCategory, 
  SafeAccount 
} from "./components/transactions-table"

import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  SearchX,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { TransactionType, Prisma, Transaction, Category, BankAccount } from "@prisma/client"

interface TransactionsPageProps {
  searchParams: Promise<{
    query?: string
    page?: string
    type?: string
    future?: string 
    bankId?: string 
  }>
}

// 🟢 TIPO INTERMEDIÁRIO (O que vem do Banco de Dados)
// Precisamos disso pois o tipo 'Transaction' padrão não sabe que category e bankAccount foram incluídos.
type TransactionWithRelations = Transaction & {
  category: Category | null;
  bankAccount: BankAccount | null;
}

// 🔧 FUNÇÃO DE LIMPEZA (SERIALIZER)
// Agora tipada corretamente: Recebe dados do Prisma -> Retorna dados Seguros
const toClientTransaction = (t: TransactionWithRelations): SafeTransaction => {
  return {
    id: t.id,
    description: t.description,
    amount: Number(t.amount), // Converte Decimal do Prisma para Number
    type: t.type,
    paymentMethod: t.paymentMethod,
    date: t.date.toISOString(), // Converte Date para String ISO
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    categoryId: t.categoryId,
    bankAccountId: t.bankAccountId,
    category: t.category ? {
      id: t.category.id,
      name: t.category.name,
      type: t.category.type,
      userId: t.category.userId,
      budgetLimit: t.category.budgetLimit ? Number(t.category.budgetLimit) : null,
      createdAt: t.category.createdAt.toISOString(),
      updatedAt: t.category.updatedAt.toISOString(),
    } : null,
    bankAccount: t.bankAccount ? {
      name: t.bankAccount.name,
      color: t.bankAccount.color
    } : null
  };
};

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

  // --- BUSCA PARALELA NO BANCO ---
  const [totalItems, rawTransactions, rawCategories, rawAccounts] = await Promise.all([
    prisma.transaction.count({ where: whereCondition }),
    prisma.transaction.findMany({
        where: whereCondition,
        include: { 
            category: true,
            bankAccount: true 
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
        select: { id: true, name: true, type: true, color: true, initialBalance: true, includeInTotal: true }
    })
  ])

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // --- SANITIZAÇÃO DE DADOS (Server -> Client) ---
  
  // 1. Categorias: Decimal -> Number, Date -> String
  const categories: SafeCategory[] = rawCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    type: cat.type,
    userId: cat.userId,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  }))

  // 2. Contas: Decimal -> Number
  const accounts: SafeAccount[] = rawAccounts.map(acc => ({
    ...acc,
    initialBalance: Number(acc.initialBalance)
  }));

  // 3. Transações: Decimal -> Number, Date -> String 
  // Agora usamos a função helper tipada corretamente
  const transactions: SafeTransaction[] = rawTransactions.map(toClientTransaction);

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 pb-24 animate-in fade-in duration-700">
      
      {/* HEADER */}
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

      {/* ÁREA DA TABELA */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-sm mt-6">
        
        {/* Cabeçalho Visual da Tabela */}
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
           /* 🟢 COMPONENTE DE TABELA (Client Component) */
           <TransactionsTable 
              transactions={transactions}
              categories={categories}
              accounts={accounts}
           />
        )}
      </div>

      {/* PAGINAÇÃO */}
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