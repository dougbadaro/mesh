"use client"

import { useMemo } from "react"
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard,
  Pencil,
} from "lucide-react"
import { EditTransactionSheet } from "@/components/edit-transaction-sheet"
import { TransactionType } from "@prisma/client"

// --- 1. DEFINIÇÃO DO QUE VEM DO SERVIDOR (STRINGS) ---
export interface SafeCategory {
  id: string
  name: string
  type: string
  userId: string | null
  budgetLimit: number | null
  createdAt: string 
  updatedAt: string
}

export interface SafeAccount {
  id: string
  name: string
  type: string
  color: string | null
  initialBalance: number
  includeInTotal: boolean
}

export interface SafeTransaction {
  id: string
  description: string
  amount: number
  type: TransactionType
  paymentMethod: string
  date: string // ISO String
  dueDate: string | null
  categoryId: string | null;
  bankAccountId: string | null;
  category: SafeCategory | null
  bankAccount: { name: string; color: string | null } | null
}

interface TransactionsTableProps {
  transactions: SafeTransaction[]
  categories: SafeCategory[]
  accounts: SafeAccount[]
}

export function TransactionsTable({ transactions, categories, accounts }: TransactionsTableProps) {

  // 🟢 1. CONVERSÃO DE DADOS GLOBAIS (String -> Date)
  const richCategories = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      createdAt: new Date(cat.createdAt),
      updatedAt: new Date(cat.updatedAt)
    }))
  }, [categories])

  const richAccounts = useMemo(() => {
    return accounts.map(acc => ({
      id: acc.id,
      name: acc.name
    }))
  }, [accounts])

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const formatDate = (dateString: string) => 
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString))

  return (
    <div className="divide-y divide-white/5">
      {transactions.map((t) => {
        
        // 🟢 2. CONVERSÃO INDIVIDUAL (String -> Date)
        const richTransaction = {
            id: t.id,
            description: t.description,
            amount: t.amount,
            date: new Date(t.date),
            type: t.type,
            paymentMethod: t.paymentMethod,
            categoryId: t.categoryId,
            bankAccountId: t.bankAccountId,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            category: t.category ? { name: t.category.name } : null
        }

        return (
          <EditTransactionSheet 
            key={t.id} 
            transaction={richTransaction}
            categories={richCategories}
            accounts={richAccounts}
          >
            {/* O CONTEÚDO CLICÁVEL (TRIGGER) */}
            <div 
                className="group relative md:grid md:grid-cols-12 md:gap-4 p-4 px-6 items-center hover:bg-white/[0.03] transition-colors cursor-pointer outline-none flex flex-col gap-2 w-full"
                role="button"
                tabIndex={0}
            >
                {/* COLUNA DESCRIÇÃO (5 cols) */}
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
                            <span className="text-[10px] text-zinc-500" suppressHydrationWarning>
                                {formatDate(t.date)}
                            </span>
                            {t.category && <span className="text-[10px] text-zinc-500">• {t.category.name}</span>}
                        </div>
                    </div>
                </div>

                {/* COLUNA DATA (2 cols) */}
                <div className="col-span-2 hidden md:block text-xs text-zinc-400 text-left font-mono">
                    <span suppressHydrationWarning>
                        {formatDate(t.date)}
                    </span>
                </div>

                {/* COLUNA CATEGORIA E CONTA (2 cols) */}
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

                {/* COLUNA VALOR (3 cols) */}
                {/* 🟢 CORREÇÃO: Adicionei 'md:pr-8' (padding-right) para empurrar o texto
                    para a esquerda, criando espaço para o ícone de lápis aparecer sem cobrir o valor. */}
                <div className="col-span-3 w-full flex flex-row md:flex-col items-center justify-between md:items-end gap-0.5 md:pr-8">
                     <p className={`text-sm font-bold tabular-nums ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-zinc-200'}`}>
                        {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                     </p>
                     <div className="flex items-center gap-1 text-zinc-600 text-[10px] uppercase tracking-wide">
                        {t.paymentMethod === 'CREDIT_CARD' && <CreditCard size={10} />}
                        <span>{t.paymentMethod.toLowerCase().replace('_', ' ')}</span>
                     </div>
                </div>
                
                {/* ÍCONE DE EDIÇÃO HOVER (Desktop) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                    <div className="p-1.5 bg-white/10 rounded-full text-white backdrop-blur-md">
                        <Pencil size={12} />
                    </div>
                </div>
            </div>
          </EditTransactionSheet>
        )
      })}
    </div>
  )
}