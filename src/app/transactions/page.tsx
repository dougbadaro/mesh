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
  Pencil
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TransactionType, Prisma } from "@prisma/client"

interface TransactionsPageProps {
  searchParams: Promise<{
    query?: string
    page?: string
    type?: string
    future?: string // <--- Novo parâmetro
  }>
}

export default async function TransactionsPage(props: TransactionsPageProps) {
  const user = await getAuthenticatedUser()
  const searchParams = await props.searchParams

  // --- CONFIGURAÇÃO ---
  const query = searchParams?.query || ""
  
  const rawType = searchParams?.type
  const typeFilter = Object.values(TransactionType).includes(rawType as TransactionType) 
    ? (rawType as TransactionType) 
    : undefined

  const showFuture = searchParams?.future === 'true' // Verifica se deve mostrar futuro
  
  const currentPage = Number(searchParams?.page) || 1
  const itemsPerPage = 15

  // --- LÓGICA DE DATA ---
  // Se 'showFuture' for falso, limitamos a busca até o fim do mês atual
  let dateFilter: Prisma.DateTimeFilter | undefined = undefined
  
  if (!showFuture) {
     const now = new Date()
     // Pega o último milissegundo do mês atual
     const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
     
     dateFilter = {
        lte: endOfMonth
     }
  }

  // --- WHERE CONDITION ---
  const whereCondition: Prisma.TransactionWhereInput = {
    userId: user.id,
    description: {
      contains: query,
      mode: 'insensitive', 
    },
    ...(typeFilter && { type: typeFilter }),
    ...(dateFilter && { date: dateFilter }) // Aplica o filtro de data se existir
  }

  // --- BUSCA ---
  const totalItems = await prisma.transaction.count({ where: whereCondition })
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const transactions = await prisma.transaction.findMany({
    where: whereCondition,
    include: { category: true },
    orderBy: { date: 'desc' }, // As mais recentes (ou futuras se ativado) primeiro
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
  })

  const categories = await prisma.category.findMany({
     where: { OR: [{ userId: user.id }, { userId: null }] }
  })

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  
  const formatDate = (date: Date) => 
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 pb-20 animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild className="h-10 w-10 rounded-xl border-white/10 bg-zinc-900/50 hover:bg-white/5">
                <Link href="/">
                    <ArrowLeft size={18} className="text-zinc-400" />
                </Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold text-white">Transações</h1>
                <p className="text-sm text-zinc-400">
                   {totalItems} registros encontrados {!showFuture && "(até o fim deste mês)"}
                </p>
            </div>
        </div>
      </div>

      <TransactionFilters />

      <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Header Tabela */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-white/[0.02] text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <div className="col-span-5">Descrição</div>
            <div className="col-span-2">Data</div>
            <div className="col-span-2">Categoria</div>
            <div className="col-span-3 text-right">Valor</div>
        </div>

        {/* Lista */}
        {transactions.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
              <SearchX size={40} className="opacity-50" />
              <p>Nenhuma transação encontrada.</p>
              {!showFuture && (
                  <p className="text-xs text-zinc-600">Ative &quot;Exibir lançamentos futuros&quot; para ver meses seguintes.</p>
              )}
           </div>
        ) : (
           <div className="divide-y divide-white/5">
              {transactions.map((t) => (
                 <EditTransactionSheet 
                    key={t.id} 
                    transaction={{
                        ...t, 
                        amount: Number(t.amount),
                        categoryId: t.categoryId 
                    }} 
                    categories={categories}
                 >
                    <div 
                        className="group relative md:grid md:grid-cols-12 md:gap-4 p-4 items-center hover:bg-white/[0.03] transition-colors cursor-pointer outline-none flex flex-col gap-3"
                        role="button"
                        tabIndex={0}
                    >
                        <div className="col-span-5 flex items-center gap-3 w-full">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-transparent shrink-0 ${
                                t.type === 'INCOME' 
                                ? 'bg-emerald-500/10 text-emerald-500 group-hover:border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-500 group-hover:border-rose-500/20'
                            }`}>
                                {t.type === 'INCOME' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-medium text-zinc-200 truncate group-hover:text-white transition">
                                    {t.description}
                                </p>
                                <div className="flex items-center gap-2 md:hidden mt-1">
                                    <span className="text-xs text-zinc-500">{formatDate(t.date)}</span>
                                    {t.category && <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{t.category.name}</Badge>}
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 hidden md:block text-sm text-zinc-400">
                            {formatDate(t.date)}
                        </div>

                        <div className="col-span-2 hidden md:block">
                            {t.category ? (
                                <Badge variant="outline" className="border-white/10 text-zinc-400 hover:text-zinc-200">
                                    {t.category.name}
                                </Badge>
                            ) : (
                                <span className="text-zinc-600 text-sm">-</span>
                            )}
                        </div>

                        <div className="col-span-3 w-full flex flex-row md:flex-col items-center justify-between md:items-end gap-1">
                             <p className={`text-base font-bold tabular-nums ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-zinc-200'}`}>
                                {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(Number(t.amount))}
                             </p>
                             <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                                {t.paymentMethod === 'CREDIT_CARD' && <CreditCard size={12} />}
                                <span className="capitalize">{t.paymentMethod.toLowerCase().replace('_', ' ')}</span>
                             </div>
                        </div>
                        
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                            <div className="p-2 bg-zinc-950 rounded-full border border-white/10 text-zinc-400">
                                <Pencil size={14} />
                            </div>
                        </div>
                    </div>
                 </EditTransactionSheet>
              ))}
           </div>
        )}
      </div>

      {/* Paginação... (código igual ao anterior) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
            <Button
                variant="outline"
                size="icon"
                className="border-white/10 bg-transparent hover:bg-white/5 disabled:opacity-30"
                asChild={currentPage > 1}
                disabled={currentPage <= 1}
            >
                {/* Precisamos manter o parâmetro 'future' na paginação */}
                {currentPage > 1 ? (
                    <Link href={`/transactions?query=${query}&type=${rawType || ''}&future=${showFuture}&page=${currentPage - 1}`}>
                        <ChevronLeft size={16} />
                    </Link>
                ) : (
                    <ChevronLeft size={16} />
                )}
            </Button>
            
            <span className="text-sm text-zinc-500 font-medium px-4">
                Página {currentPage} de {totalPages}
            </span>

            <Button
                variant="outline"
                size="icon"
                className="border-white/10 bg-transparent hover:bg-white/5 disabled:opacity-30"
                asChild={currentPage < totalPages}
                disabled={currentPage >= totalPages}
            >
                {currentPage < totalPages ? (
                    <Link href={`/transactions?query=${query}&type=${rawType || ''}&future=${showFuture}&page=${currentPage + 1}`}>
                        <ChevronRight size={16} />
                    </Link>
                ) : (
                    <ChevronRight size={16} />
                )}
            </Button>
        </div>
      )}

    </div>
  )
}