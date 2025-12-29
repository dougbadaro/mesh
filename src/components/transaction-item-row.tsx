"use client"

import { ShoppingBag } from "lucide-react"

import { EditTransactionSheet } from "@/components/edit-transaction-sheet"

import { SafeAccount, SafeCategory, SafeTransaction } from "@/lib/transformers"
import { cn } from "@/lib/utils"

interface TransactionItemRowProps {
  transaction: SafeTransaction
  categories: SafeCategory[]
  accounts: SafeAccount[]
  isLast: boolean
}

export function TransactionItemRow({
  transaction,
  categories,
  accounts,
  isLast,
}: TransactionItemRowProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(d)
  }

  return (
    <EditTransactionSheet transaction={transaction} categories={categories} accounts={accounts}>
      <div
        className={cn(
          "group flex w-full cursor-pointer items-center justify-between bg-transparent p-4 transition-colors hover:bg-white/[0.02]",
          !isLast && "border-b border-white/5"
        )}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-zinc-950 text-zinc-400 transition-colors group-hover:text-white">
            <ShoppingBag size={18} />
          </div>
          <div className="flex min-w-0 flex-col pr-2">
            <span className="truncate text-sm font-medium text-zinc-200 transition-colors group-hover:text-white">
              {transaction.description}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
              <span className="font-mono">{formatDate(transaction.date)}</span>
              {transaction.category && (
                <>
                  <span className="h-0.5 w-0.5 rounded-full bg-zinc-600" />
                  <span className="max-w-[120px] truncate rounded border border-white/5 bg-white/5 px-1.5 py-0.5">
                    {transaction.category.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <span className="whitespace-nowrap pl-2 font-mono text-sm font-bold text-zinc-200">
          {formatCurrency(transaction.amount)}
        </span>
      </div>
    </EditTransactionSheet>
  )
}