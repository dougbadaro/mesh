import Link from "next/link"
import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import { TransactionItemRow } from "@/components/transaction-item-row" 
import { PayInvoiceDialog } from "@/components/pay-invoice-dialog" 
import { TransactionType } from "@prisma/client"
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
  ListFilter
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

  // 1. Configurações
  const userSettings = await prisma.user.findUnique({
    where: { id: user.id },
    select: { creditCardClosingDay: true, creditCardDueDay: true }
  })

  const closingDay = userSettings?.creditCardClosingDay || 1
  const dueDay = userSettings?.creditCardDueDay || 10

  // 2. Data
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
  
  // 3. Buscar Dados
  const startOfInvoice = new Date(selectedYear, selectedMonth, 1)
  const endOfInvoice = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59)

  const [rawTransactions, rawCategories, rawAccounts, historyTransactions] = await Promise.all([
    prisma.transaction.findMany({
        where: {
            userId: user.id,
            paymentMethod: "CREDIT_CARD",
            dueDate: {
                gte: startOfInvoice,
                lte: endOfInvoice
            }
        },
        include: { category: true },
        orderBy: { date: 'desc' }
    }),
    prisma.category.findMany({ where: { OR: [{ userId: user.id }, { userId: null }] } }),
    prisma.bankAccount.findMany({ 
        where: { userId: user.id }, 
        select: { id: true, name: true, initialBalance: true } 
    }),
    prisma.transaction.findMany({
        where: { 
            userId: user.id, 
            paymentMethod: { not: 'CREDIT_CARD' } 
        },
        select: { bankAccountId: true, amount: true, type: true }
    })
  ])

  // --- CÁLCULO DE SALDOS ---
  const accountsWithBalance = rawAccounts.map(acc => {
      const accHistory = historyTransactions.filter(t => t.bankAccountId === acc.id)
      const totalTransacted = accHistory.reduce((sum, t) => {
          const val = Number(t.amount)
          return t.type === TransactionType.INCOME ? sum + val : sum - val
      }, 0)
      
      return {
          ...acc,
          initialBalance: Number(acc.initialBalance), 
          currentBalance: Number(acc.initialBalance) + totalTransacted
      }
  })

  // --- SANITIZAÇÃO ---
  const categories = rawCategories.map(cat => ({
    ...cat,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null
  }))

  const transactions = rawTransactions.map(t => ({
    ...t,
    amount: Number(t.amount),
    category: t.category ? {
        ...t.category,
        name: t.category.name,
        budgetLimit: t.category.budgetLimit ? Number(t.category.budgetLimit) : null
    } : null
  }))

  // 4. Cálculos da Fatura
  const invoiceTotal = transactions.reduce((acc, t) => acc + t.amount, 0)
  const isPast = new Date(selectedYear, selectedMonth, dueDay) < new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const prevDate = new Date(selectedYear, selectedMonth - 1, 1)
  const nextDate = new Date(selectedYear, selectedMonth + 1, 1)

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const monthLabel = invoiceDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

  // Status Visual
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
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 animate-in fade-in duration-700 space-y-6">
      
      {/* HEADER E NAVEGAÇÃO */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-xl hover:bg-white/5 text-zinc-400">
                <Link href="/">
                    <ArrowLeft size={18} />
                </Link>
            </Button>
            <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                    Cartão de Crédito
                </h1>
                <p className="text-xs text-zinc-400">Gerencie suas faturas.</p>
            </div>
        </div>

        {/* CONTROLES DE MÊS */}
        <div className="flex items-center justify-between bg-zinc-900/40 backdrop-blur-xl p-2 rounded-2xl border border-white/5">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg hover:bg-white/10 text-zinc-400">
                <Link href={`/credit-card?month=${prevDate.getMonth()}&year=${prevDate.getFullYear()}`}>
                    <ChevronLeft size={16} />
                </Link>
            </Button>

            <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-white capitalize tracking-wide">{monthLabel}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Vencimento dia {dueDay}</span>
            </div>

            <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg hover:bg-white/10 text-zinc-400">
                <Link href={`/credit-card?month=${nextDate.getMonth()}&year=${nextDate.getFullYear()}`}>
                    <ChevronRight size={16} />
                </Link>
            </Button>
        </div>
      </div>

      {/* CARD DE RESUMO */}
      <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden shadow-sm relative">
          <div className={`absolute top-0 left-0 w-1 h-full ${isPast ? 'bg-rose-500' : 'bg-blue-500'}`} />
          <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-2 border border-white/5 w-fit", statusBg, statusColor)}>
                          {statusIcon}
                          {statusText}
                      </div>
                      <p className="text-sm text-zinc-400">Total da Fatura</p>
                      <h2 className="text-4xl font-bold text-white tracking-tight">{formatCurrency(invoiceTotal)}</h2>
                  </div>

                  <div className="flex items-center gap-3">
                      <div className="text-right hidden md:block">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Itens</p>
                          <p className="text-sm text-zinc-300">{transactions.length} lançamentos</p>
                      </div>
                      <div className="h-10 w-px bg-white/10 hidden md:block" />
                      
                      {/* --- CORREÇÃO AQUI --- */}
                      {/* O 'key' força o componente a resetar quando o mês muda */}
                      <PayInvoiceDialog 
                        key={monthLabel}
                        invoiceTotal={invoiceTotal}
                        monthName={monthLabel}
                        accounts={accountsWithBalance}
                      />
                      {/* --------------------- */}
                  </div>
              </div>
          </CardContent>
      </Card>

      {/* LISTA DE COMPRAS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <ListFilter size={12} />
                Detalhamento
            </h3>
            <span className="text-[10px] text-zinc-600">Exibindo {transactions.length} itens</span>
        </div>
        
        {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-3 border border-dashed border-white/10 rounded-3xl bg-zinc-900/20">
                <CheckCircle2 size={32} className="opacity-20" />
                <p className="text-xs">Fatura zerada.</p>
            </div>
        ) : (
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl flex flex-col">
                {transactions.map((t, index) => (
                    <TransactionItemRow 
                        key={t.id} 
                        transaction={t}
                        categories={categories}
                        accounts={accountsWithBalance} 
                        isLast={index === transactions.length - 1}
                    />
                ))}
            </div>
        )}
      </div>

    </div>
  )
}