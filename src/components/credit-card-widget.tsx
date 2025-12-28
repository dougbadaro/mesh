"use client"

import { useMemo, useState } from "react"
import { Calendar, CheckCircle2, ChevronDown, CreditCard } from "lucide-react"

import { PayInvoiceDialog } from "@/components/pay-invoice-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { cn } from "@/lib/utils"

// --- INTERFACES ---

interface DecimalLike {
  toNumber: () => number
}

interface TransactionInput {
  id: string
  description: string
  amount: number | string | DecimalLike
  date: Date | string
  dueDate: Date | string
  paymentMethod: string
}

interface InvoiceItem {
  id: string
  description: string
  amount: number
  date: string
}

interface Invoice {
  id: string
  monthLabel: string
  total: number
  items: InvoiceItem[]
  sortKey: number
}

// Interface para as contas (necessário para o modal)
interface Account {
  id: string
  name: string
  currentBalance: number
}

const safeNumber = (val: number | string | DecimalLike | unknown): number => {
  if (typeof val === "number") return val
  if (typeof val === "string") return Number(val)

  if (
    val &&
    typeof val === "object" &&
    "toNumber" in val &&
    typeof (val as DecimalLike).toNumber === "function"
  ) {
    return (val as DecimalLike).toNumber()
  }

  return 0
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

export function CreditCardWidget({
  transactions,
  accounts = [], // Recebe as contas da Dashboard
}: {
  transactions: TransactionInput[]
  accounts?: Account[]
}) {
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)

  const invoices = useMemo(() => {
    const creditTrans = transactions.filter((t) => t.paymentMethod === "CREDIT_CARD")

    const invoicesMap = creditTrans.reduce<Record<string, Invoice>>((acc, t) => {
      const dueDate = new Date(t.dueDate)
      const year = dueDate.getFullYear()
      const month = dueDate.getMonth()
      const key = `${year}-${month}`

      if (!acc[key]) {
        const label = dueDate.toLocaleString("pt-BR", { month: "long", year: "numeric" })
        acc[key] = {
          id: key,
          monthLabel: label,
          total: 0,
          items: [],
          sortKey: year * 100 + month,
        }
      }

      const amountVal = safeNumber(t.amount)
      acc[key].total += amountVal
      acc[key].items.push({
        id: t.id,
        description: t.description,
        amount: amountVal,
        date: new Date(t.date).toISOString(),
      })

      return acc
    }, {})

    return Object.values(invoicesMap)
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(0, 3)
  }, [transactions])

  const toggleExpand = (id: string) => {
    setExpandedInvoice((prev) => (prev === id ? null : id))
  }

  if (invoices.length === 0) {
    return (
      <Card className="h-fit w-full overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-sm backdrop-blur-xl">
        <CardContent className="flex flex-col items-center justify-center gap-2 p-6 text-zinc-500">
          <CheckCircle2 size={24} className="opacity-20" />
          <p className="text-xs">Sem faturas pendentes.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex h-fit w-full flex-col overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-sm backdrop-blur-xl transition-all">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-zinc-950/20 px-6 py-4">
        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
          <CreditCard size={14} />
          Faturas Futuras
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {invoices.map((inv) => {
            const isExpanded = expandedInvoice === inv.id

            return (
              <div
                key={inv.id}
                className="group bg-transparent transition-all duration-200 hover:bg-white/[0.02]"
              >
                <div
                  className="flex cursor-pointer items-center justify-between p-4 px-6"
                  onClick={() => toggleExpand(inv.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-rose-500 transition-colors">
                      <Calendar size={14} />
                    </div>

                    <div>
                      <p className="text-xs font-bold capitalize leading-none text-white">
                        {inv.monthLabel}
                      </p>
                      <p className="mt-1 text-[9px] font-medium uppercase tracking-wide text-zinc-500">
                        {inv.items.length} itens
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="font-mono text-xs font-bold tabular-nums tracking-tight text-zinc-200">
                      {formatCurrency(inv.total)}
                    </p>

                    <ChevronDown
                      size={14}
                      className={cn(
                        "text-zinc-600 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                </div>

                {/* Detalhes Expansíveis */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-black/20 duration-200 animate-in slide-in-from-top-1">
                    <div className="custom-scrollbar max-h-[200px] space-y-1.5 overflow-y-auto px-6 py-3">
                      {inv.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-[10px] text-zinc-400 transition-colors hover:text-zinc-200"
                        >
                          <span className="max-w-[180px] truncate">{item.description}</span>
                          <span className="font-mono text-zinc-300">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end border-t border-white/5 bg-zinc-950/30 p-3 px-6">
                      <PayInvoiceDialog
                        key={inv.monthLabel} // Reseta o modal ao mudar a fatura
                        invoiceTotal={inv.total}
                        monthName={inv.monthLabel}
                        accounts={accounts}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
