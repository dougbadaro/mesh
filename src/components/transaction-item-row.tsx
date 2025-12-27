'use client'

import { EditTransactionSheet } from "@/components/edit-transaction-sheet"
import { ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

// --- CORREÇÃO AQUI ---
// Expandimos a interface para incluir os campos que o EditTransactionSheet exige
interface Category {
  id: string
  name: string
  budgetLimit: number | null
  type: string            // Adicionado
  userId: string | null   // Adicionado
  createdAt: Date         // Adicionado
  updatedAt: Date         // Adicionado
}

interface Account {
  id: string
  name: string
}

// A interface da transação já deve vir sanitizada (sem Decimal)
interface TransactionRowProps {
  transaction: {
    id: string
    description: string
    amount: number
    date: Date
    dueDate: Date
    type: string
    paymentMethod: string
    categoryId?: string | null
    bankAccountId?: string | null
    category: { name: string } | null
  }
  categories: Category[]
  accounts: Account[]
  isLast: boolean
}

export function TransactionItemRow({ transaction, categories, accounts, isLast }: TransactionRowProps) {
  // Formatadores
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(d)
  }

  return (
    <EditTransactionSheet 
        transaction={transaction}
        categories={categories}
        accounts={accounts}
    >
        {/* IMPORTANTE: Mantemos a div limpa para o Trigger funcionar */}
        <div 
            className={cn(
                "group flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors cursor-pointer w-full bg-transparent",
                !isLast && "border-b border-white/5"
            )}
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors shrink-0">
                    <ShoppingBag size={18} />
                </div>
                <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                        {transaction.description}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <span className="font-mono">{formatDate(transaction.date)}</span>
                        {transaction.category && (
                            <>
                                <span className="w-0.5 h-0.5 rounded-full bg-zinc-600" />
                                <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5 truncate max-w-[120px]">
                                    {transaction.category.name}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            <span className="text-sm font-bold font-mono text-zinc-200 whitespace-nowrap pl-2">
                {formatCurrency(transaction.amount)}
            </span>
        </div>
    </EditTransactionSheet>
  )
}