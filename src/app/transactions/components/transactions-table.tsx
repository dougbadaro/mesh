"use client"

import { useMemo } from "react"
import { TransactionType } from "@prisma/client"
import { ArrowDownLeft, ArrowUpRight, CreditCard, Pencil } from "lucide-react"

import { EditTransactionSheet } from "@/components/edit-transaction-sheet"

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
  categoryId: string | null
  bankAccountId: string | null
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
    return categories.map((cat) => ({
      ...cat,
      createdAt: new Date(cat.createdAt),
      updatedAt: new Date(cat.updatedAt),
    }))
  }, [categories])

  const richAccounts = useMemo(() => {
    return accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
    }))
  }, [accounts])

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
      new Date(dateString)
    )

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
          category: t.category ? { name: t.category.name } : null,
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
              className="group relative flex w-full cursor-pointer flex-col items-center gap-2 p-4 px-6 outline-none transition-colors hover:bg-white/[0.03] md:grid md:grid-cols-12 md:gap-4"
              role="button"
              tabIndex={0}
            >
              {/* COLUNA DESCRIÇÃO (5 cols) */}
              <div className="col-span-5 flex w-full items-center gap-4 text-left">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    t.type === "INCOME"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {t.type === "INCOME" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="truncate text-sm font-medium text-zinc-200 transition group-hover:text-white">
                    {t.description}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 md:hidden">
                    <span className="text-[10px] text-zinc-500" suppressHydrationWarning>
                      {formatDate(t.date)}
                    </span>
                    {t.category && (
                      <span className="text-[10px] text-zinc-500">• {t.category.name}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* COLUNA DATA (2 cols) */}
              <div className="col-span-2 hidden text-left font-mono text-xs text-zinc-400 md:block">
                <span suppressHydrationWarning>{formatDate(t.date)}</span>
              </div>

              {/* COLUNA CATEGORIA E CONTA (2 cols) */}
              <div className="col-span-2 hidden text-left md:block">
                <div className="flex flex-col items-start gap-1">
                  {t.category ? (
                    <span className="rounded-md border border-white/5 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      {t.category.name}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-600">-</span>
                  )}

                  {t.bankAccount && (
                    <div
                      className="flex items-center gap-1.5 text-[10px] text-zinc-500"
                      title={t.bankAccount.name}
                    >
                      <div
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: t.bankAccount.color || "#10b981" }}
                      />
                      <span className="max-w-[100px] truncate">{t.bankAccount.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUNA VALOR (3 cols) */}
              {/* 🟢 CORREÇÃO: Adicionei 'md:pr-8' (padding-right) para empurrar o texto
                    para a esquerda, criando espaço para o ícone de lápis aparecer sem cobrir o valor. */}
              <div className="col-span-3 flex w-full flex-row items-center justify-between gap-0.5 md:flex-col md:items-end md:pr-8">
                <p
                  className={`text-sm font-bold tabular-nums ${t.type === "INCOME" ? "text-emerald-400" : "text-zinc-200"}`}
                >
                  {t.type === "INCOME" ? "+" : "-"} {formatCurrency(t.amount)}
                </p>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-600">
                  {t.paymentMethod === "CREDIT_CARD" && <CreditCard size={10} />}
                  <span>{t.paymentMethod.toLowerCase().replace("_", " ")}</span>
                </div>
              </div>

              {/* ÍCONE DE EDIÇÃO HOVER (Desktop) */}
              <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 md:block">
                <div className="rounded-full bg-white/10 p-1.5 text-white backdrop-blur-md">
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
