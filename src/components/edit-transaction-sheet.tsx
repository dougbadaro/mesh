"use client"

import { useEffect, useState } from "react"
import {
  AlignLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarIcon,
  Check,
  CreditCard,
  Loader2,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { cn } from "@/lib/utils"
import { deleteTransaction, updateTransaction } from "@/app/actions/transactions"

// --- INTERFACES ---
interface CategoryDTO {
  id: string
  name: string
  type: string
  budgetLimit: number | null
  userId: string | null
  createdAt: Date
  updatedAt: Date
}

interface AccountDTO {
  id: string
  name: string
}

interface TransactionProps {
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

interface EditSheetProps {
  children: React.ReactNode
  transaction: TransactionProps
  categories: CategoryDTO[]
  accounts: AccountDTO[]
}

export function EditTransactionSheet({
  children,
  transaction,
  categories,
  accounts = [],
}: EditSheetProps) {
  const [open, setOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isPending, setIsPending] = useState(false)

  // States
  const [amount, setAmount] = useState(transaction.amount)
  const [amountDisplay, setAmountDisplay] = useState(
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      transaction.amount
    )
  )
  const [description, setDescription] = useState(transaction.description)
  const [date, setDate] = useState(() => {
    try {
      return new Date(transaction.date).toISOString().split("T")[0]
    } catch {
      return new Date().toISOString().split("T")[0]
    }
  })
  const [categoryId, setCategoryId] = useState(transaction.categoryId || "general")
  const [paymentMethod, setPaymentMethod] = useState(transaction.paymentMethod)
  const [type, setType] = useState(transaction.type)
  const [bankAccountId, setBankAccountId] = useState(transaction.bankAccountId || "none")

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const value = Number(rawValue) / 100
    setAmount(value)
    setAmountDisplay(
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
    )
  }

  const handleSave = async (formData: FormData) => {
    setIsPending(true)
    formData.set("id", transaction.id)
    formData.set("amount", amount.toString())
    formData.set("description", description)
    formData.set("date", date)
    formData.set("categoryId", categoryId === "general" ? "" : categoryId)
    formData.set("paymentMethod", paymentMethod)
    formData.set("type", type)
    formData.set("bankAccountId", bankAccountId === "none" ? "" : bankAccountId)

    await updateTransaction(formData)

    toast.success("Transação atualizada!", {
      description: "As alterações foram salvas com sucesso.",
      icon: <Check className="text-emerald-500" />,
    })

    setIsPending(false)
    setOpen(false)
  }

  const handleDeleteRequest = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    toast("Excluir transação?", {
      description: "Essa ação não pode ser desfeita.",
      duration: 5000,
      action: {
        label: "Confirmar Exclusão",
        onClick: (e) => {
          e.stopPropagation()
          e.nativeEvent.stopImmediatePropagation()
          performDelete()
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: (e) => {
          e?.stopPropagation()
          e?.nativeEvent.stopImmediatePropagation()
          // O clique aqui fecha o toast automaticamente,
          // mas graças ao onInteractOutside abaixo, o Sheet não fechará.
        },
      },
    })
  }

  const performDelete = async () => {
    setIsPending(true)
    const formData = new FormData()
    formData.set("id", transaction.id)

    await deleteTransaction(formData)

    toast.success("Transação excluída")

    setIsPending(false)
    setOpen(false)
  }

  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>

      {/* 🟢 CORREÇÃO: onInteractOutside 
         Isso intercepta cliques fora do modal. Se o alvo do clique for
         parte do componente "toaster", impedimos o modal de fechar.
      */}
      <SheetContent
        className="flex h-full w-full flex-col border-l border-white/5 bg-zinc-950/90 p-0 shadow-2xl backdrop-blur-xl sm:max-w-md"
        onInteractOutside={(e) => {
          const target = e.target as Element
          // Se o clique foi no Toast (que tem a classe .toaster), previne o fechamento
          if (target.closest(".toaster")) {
            e.preventDefault()
          }
        }}
      >
        <SheetHeader className="border-b border-white/5 bg-transparent p-5 pb-2">
          <SheetTitle className="text-center text-base font-semibold text-white">
            Editar Transação
          </SheetTitle>
        </SheetHeader>

        <form action={handleSave} className="custom-scrollbar flex-1 overflow-y-auto">
          <div className="space-y-6 p-5 pb-32">
            {/* SEÇÃO DE VALOR */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex w-full max-w-[220px] rounded-lg border border-white/5 bg-zinc-900/80 p-1">
                <button
                  type="button"
                  onClick={() => setType("INCOME")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all",
                    type === "INCOME"
                      ? "border border-emerald-500/20 bg-emerald-500/20 text-emerald-400 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <ArrowUpCircle size={14} /> Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setType("EXPENSE")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all",
                    type === "EXPENSE"
                      ? "border border-rose-500/20 bg-rose-500/20 text-rose-400 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <ArrowDownCircle size={14} /> Saída
                </button>
              </div>

              <div className="relative w-full text-center">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  className={cn(
                    "h-16 border-none bg-transparent p-0 text-center text-4xl font-bold tabular-nums tracking-tight selection:bg-white/20 placeholder:text-zinc-800 focus-visible:ring-0",
                    type === "INCOME" ? "text-emerald-400" : "text-white"
                  )}
                />
                <p className="-mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Valor
                </p>
              </div>
            </div>

            {/* CONTAINER DE CAMPOS */}
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/30 backdrop-blur-md">
              {/* DESCRIÇÃO */}
              <div className="border-b border-white/5 p-3">
                <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Descrição
                </Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-2.5 text-zinc-500">
                    <AlignLeft size={16} />
                  </div>
                  <Input
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-10 border-none bg-transparent pl-10 text-sm placeholder:text-zinc-700 focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-white/5">
                {/* DATA */}
                <div className="p-3">
                  <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Data
                  </Label>
                  <div className="relative mt-1">
                    <div className="absolute left-3 top-2.5 text-zinc-500">
                      <CalendarIcon size={16} />
                    </div>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-10 cursor-pointer border-none bg-transparent pl-10 text-xs [color-scheme:dark] focus-visible:ring-0"
                    />
                  </div>
                </div>

                {/* CATEGORIA */}
                <div className="p-3">
                  <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Categoria
                  </Label>
                  <div className="relative mt-1">
                    <div className="absolute left-3 top-2.5 z-10 text-zinc-500">
                      <Tag size={16} />
                    </div>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="h-10 border-none bg-transparent pl-10 text-xs shadow-none focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-zinc-900">
                        <SelectItem value="general">Geral</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* CARTEIRA */}
              <div className="border-b border-white/5 p-3">
                <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Carteira
                </Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-2.5 z-10 text-zinc-500">
                    <Wallet size={16} />
                  </div>
                  <Select value={bankAccountId} onValueChange={setBankAccountId}>
                    <SelectTrigger className="h-10 border-none bg-transparent pl-10 text-xs shadow-none focus:ring-0">
                      <SelectValue placeholder="Selecione uma carteira" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-zinc-900">
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* PAGAMENTO */}
              <div className="p-3">
                <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Pagamento
                </Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-2.5 z-10 text-zinc-500">
                    <CreditCard size={16} />
                  </div>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-10 border-none bg-transparent pl-10 text-xs shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-zinc-900">
                      <SelectItem value="PIX">Pix</SelectItem>
                      <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                      <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                      <SelectItem value="CASH">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="absolute bottom-0 left-0 z-20 flex w-full flex-col gap-3 border-t border-white/5 bg-zinc-950/90 p-5 backdrop-blur-xl sm:flex-row">
            <Button
              type="submit"
              disabled={isPending}
              className="h-12 flex-1 rounded-xl bg-white text-sm font-bold text-black shadow-lg shadow-white/5 transition-transform hover:bg-zinc-200 active:scale-[0.98]"
            >
              {isPending ? <Loader2 className="animate-spin" /> : "Salvar Alterações"}
            </Button>

            <Button
              type="button"
              disabled={isPending}
              onClick={handleDeleteRequest}
              variant="outline"
              className="flex h-12 w-full min-w-[3rem] items-center justify-center gap-2 rounded-xl border-red-500/20 bg-red-500/5 text-red-500 hover:border-red-500/30 hover:bg-red-500/10 sm:w-auto"
            >
              <Trash2 size={18} />
              <span className="font-bold sm:hidden">Excluir</span>
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
