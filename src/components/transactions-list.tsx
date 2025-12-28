"use client"

import { useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react"

import { EditTransactionSheet } from "@/components/edit-transaction-sheet"

import { SafeTransaction } from "@/app/page"

// --- 1. DEFINIÇÃO DE CONTRATOS DE DADOS ---

// SAFE TYPES: O que chega do Servidor (JSON/Strings)
// Essas interfaces representam exatamente o que o 'page.tsx' envia.
export interface SafeCategory {
  id: string
  name: string
  type: string
  userId: string | null
  budgetLimit: number | null
  createdAt: string // Vem como ISO String do server
  updatedAt: string // Vem como ISO String do server
}

export interface SafeAccount {
  id: string
  name: string
  type: string
  color: string | null
  initialBalance: number
  includeInTotal: boolean
}

// RICH TYPES: O que o EditTransactionSheet EXIGE (Objetos Date)
// Essas interfaces devem bater com o que está definido dentro de 'edit-transaction-sheet.tsx'
interface RichCategory {
  id: string
  name: string
  type: string
  userId: string | null
  budgetLimit: number | null
  createdAt: Date
  updatedAt: Date
}

interface RichAccount {
  id: string
  name: string
}

// Interface auxiliar para a Transação rica (com Dates)
interface RichTransaction {
  id: string
  description: string
  amount: number
  date: Date
  type: string
  paymentMethod: string
  categoryId?: string | null
  bankAccountId?: string | null
  dueDate?: Date | null
  category?: { name: string } | null
}

interface TransactionListProps {
  transactions: SafeTransaction[]
  categories: SafeCategory[]
  accounts: SafeAccount[]
}

export function TransactionList({ transactions, categories, accounts }: TransactionListProps) {
  // Estado tipado com a versão RICA da transação (Dates reais)
  const [selectedTransaction, setSelectedTransaction] = useState<RichTransaction | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // 🟢 2. HIDRATAÇÃO DE DADOS (Converte String -> Date)
  // O TypeScript reclama se passarmos 'categories' (strings) direto para o Sheet (que quer Date).
  // Usamos useMemo para converter apenas quando a lista mudar.
  const hydratedCategories: RichCategory[] = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      createdAt: new Date(cat.createdAt),
      updatedAt: new Date(cat.updatedAt),
    }))
  }, [categories])

  // Mapeamos as contas para o formato esperado pelo Sheet (se necessário)
  const hydratedAccounts: RichAccount[] = useMemo(() => {
    return accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
    }))
  }, [accounts])

  // 🟢 3. HANDLER DE CLIQUE (Converte Transação String -> Date)
  const handleRowClick = (transaction: SafeTransaction) => {
    // Cria o objeto rico que o formulário espera
    const richData: RichTransaction = {
      id: transaction.id,
      description: transaction.description,
      amount: Number(transaction.amount),
      date: new Date(transaction.date), // String ISO -> Objeto Date
      type: transaction.type,
      paymentMethod: transaction.paymentMethod,
      categoryId: transaction.categoryId,
      bankAccountId: transaction.bankAccountId,
      dueDate: transaction.dueDate ? new Date(transaction.dueDate) : null,
      category: transaction.category ? { name: transaction.category.name } : null,
    }

    setSelectedTransaction(richData)
    setIsSheetOpen(true)
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

  return (
    <>
      <div className="custom-scrollbar max-h-[600px] divide-y divide-white/5 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-zinc-500">
            <Receipt size={24} className="opacity-20" />
            <p className="text-xs">Nenhuma movimentação na conta.</p>
          </div>
        ) : (
          transactions.map((t) => (
            <div
              key={t.id}
              onClick={() => handleRowClick(t)}
              className="group flex w-full cursor-pointer items-center justify-between p-3 px-5 transition duration-200 hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${t.type === "INCOME" ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-400"}`}
                >
                  {t.type === "INCOME" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                </div>
                <div className="overflow-hidden">
                  <p className="max-w-[150px] truncate text-sm font-medium text-zinc-200 transition group-hover:text-white md:max-w-[250px]">
                    {t.description}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-zinc-500">
                    {/* 🔴 SOLUÇÃO DO ITEM SUMINDO 🔴 */}
                    {/* suppressHydrationWarning permite que a data do servidor (UTC) difira da data local sem quebrar o React */}
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
                  className={`text-xs font-bold tabular-nums ${t.type === "INCOME" ? "text-emerald-400" : "text-zinc-200"}`}
                >
                  {t.type === "INCOME" ? "+" : "-"} {formatCurrency(Number(t.amount))}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTransaction && (
        <EditTransactionSheet
          key={selectedTransaction.id}
          transaction={selectedTransaction} // Passamos o RichTransaction (Dates)
          categories={hydratedCategories} // Passamos RichCategory[] (Dates)
          accounts={hydratedAccounts} // Passamos RichAccount[]
        >
          {/* Como o controle de 'open' está dentro do Sheet no seu código original,
                passamos children vazio ou usamos o controle externo se você refatorou.
                Baseado no código que você mandou do Sheet, ele controla o estado interno ou via trigger.
                Se você quiser controlar externamente, precisará passar 'open' e 'onOpenChange' se o componente aceitar,
                ou confiar que ao renderizar o componente ele monta aberto (definindo useState(true) no mount). 
            */}
          <></>
        </EditTransactionSheet>
      )}
    </>
  )
}
