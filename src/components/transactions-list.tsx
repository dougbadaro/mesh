"use client"

import { useMemo } from "react"
import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react"

import { EditTransactionSheet } from "@/components/edit-transaction-sheet"

import { SafeAccount, SafeCategory, SafeTransaction } from "@/lib/transformers"

interface TransactionListProps {
  transactions: SafeTransaction[]
  categories: SafeCategory[]
  accounts: SafeAccount[]
}

export function TransactionList({ transactions, categories, accounts }: TransactionListProps) {
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

  return (
    <div className="custom-scrollbar max-h-[600px] divide-y divide-white/5 overflow-y-auto">
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-10 text-center text-zinc-500">
          <Receipt size={24} className="opacity-20" />
          <p className="text-xs">Nenhuma movimentação na conta.</p>
        </div>
      ) : (
        transactions.map((t) => {
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
              <div className="group flex w-full cursor-pointer items-center justify-between p-3 px-5 transition duration-200 hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      t.type === "INCOME"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {t.type === "INCOME" ? (
                      <ArrowUpRight size={16} />
                    ) : (
                      <ArrowDownLeft size={16} />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="max-w-[150px] truncate text-sm font-medium text-zinc-200 transition group-hover:text-white md:max-w-[250px]">
                      {t.description}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-500">
                      <span suppressHydrationWarning>
                        {new Date(t.date).toLocaleDateString("pt-BR")}
                      </span>

                      {t.category && (
                        <span className="rounded border border-white/5 bg-white/5 px-1.5 py-0.5">
                          {t.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xs font-bold tabular-nums ${
                      t.type === "INCOME" ? "text-emerald-400" : "text-zinc-200"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"} {formatCurrency(Number(t.amount))}
                  </p>
                </div>
              </div>
            </EditTransactionSheet>
          )
        })
      )}
    </div>
  )
}