"use client"

import { useEffect, useState } from "react"
import {
  AlignLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CreditCard,
  Loader2,
  Plus,
  Tag,
  Wallet,
} from "lucide-react"

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
import { createTransaction } from "@/app/actions/transactions"

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

interface CreateRecurringSheetProps {
  categories: CategoryDTO[]
  accounts: AccountDTO[]
  children: React.ReactNode
}

export function CreateRecurringSheet({
  categories,
  accounts = [],
  children,
}: CreateRecurringSheetProps) {
  const [open, setOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // --- ESTADOS ---
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [amount, setAmount] = useState(0)
  const [amountDisplay, setAmountDisplay] = useState("") // Começa vazio para mostrar placeholder
  const [description, setDescription] = useState("")
  const [day, setDay] = useState("5")
  const [categoryId, setCategoryId] = useState("general")
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD")
  const [bankAccountId, setBankAccountId] = useState("none")

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

  const handleSubmit = async () => {
    if (amount <= 0) return
    setIsLoading(true)

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const selectedDay = String(day).padStart(2, "0")
    const fullDate = `${year}-${month}-${selectedDay}`

    const formData = new FormData()
    formData.append(
      "description",
      description || (type === "INCOME" ? "Receita Fixa" : "Despesa Fixa")
    )
    formData.append("amount", amount.toString())
    formData.append("type", type)
    formData.append("date", fullDate)
    formData.append("paymentMethod", paymentMethod)
    formData.append("isRecurring", "true")

    if (bankAccountId !== "none") {
      formData.append("bankAccountId", bankAccountId)
    }

    if (categoryId !== "general") {
      formData.append("categoryId", categoryId)
    }

    try {
      await createTransaction(formData)
      setOpen(false)

      // Resetar form
      setAmount(0)
      setAmountDisplay("")
      setDescription("")
      setDay("5")
      setBankAccountId("none")
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted) return <>{children}</>

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent className="flex h-full w-full flex-col border-l border-white/5 bg-zinc-950/90 p-0 shadow-2xl backdrop-blur-xl sm:max-w-md">
        <SheetHeader className="border-b border-white/5 bg-transparent p-5 pb-2">
          <SheetTitle className="text-center text-base font-semibold text-white">
            Nova Assinatura
          </SheetTitle>
        </SheetHeader>

        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-5 pb-32">
          {/* SEÇÃO DE VALOR E TIPO */}
          <div className="flex flex-col items-center gap-4">
            {/* Segmented Control */}
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
                <ArrowUpCircle size={14} /> Receita
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
                <ArrowDownCircle size={14} /> Despesa
              </button>
            </div>

            <div className="relative w-full text-center">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={amountDisplay}
                onChange={handleAmountChange}
                className={cn(
                  "h-16 border-none bg-transparent p-0 text-center text-4xl font-bold tabular-nums tracking-tight selection:bg-white/20 placeholder:text-zinc-800 focus-visible:ring-0",
                  type === "INCOME" ? "text-emerald-400" : "text-white"
                )}
              />
              <p className="-mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Valor Mensal
              </p>
            </div>
          </div>

          {/* CAMPOS (Grouped List) */}
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Netflix"
                  className="h-10 border-none bg-transparent pl-10 text-sm placeholder:text-zinc-700 focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-white/5">
              {/* DIA VENCIMENTO */}
              <div className="p-3">
                <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Dia Venc.
                </Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-2.5 text-zinc-500">
                    <Calendar size={16} />
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="h-10 border-none bg-transparent pl-10 text-sm focus-visible:ring-0"
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
                Carteira / Banco
              </Label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-2.5 z-10 text-zinc-500">
                  <Wallet size={16} />
                </div>
                <Select value={bankAccountId} onValueChange={setBankAccountId}>
                  <SelectTrigger className="h-10 border-none bg-transparent pl-10 text-xs shadow-none focus:ring-0">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-zinc-900">
                    <SelectItem value="none">Nenhuma (Sem vínculo)</SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* FORMA DE PAGAMENTO */}
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
                    <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                    <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                    <SelectItem value="PIX">Pix</SelectItem>
                    <SelectItem value="CASH">Dinheiro</SelectItem>
                    <SelectItem value="BOLETO">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 z-20 w-full border-t border-white/5 bg-zinc-950/90 p-5 backdrop-blur-xl">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || amount <= 0}
            className="h-12 w-full rounded-xl bg-white text-sm font-bold text-black shadow-lg shadow-white/5 transition-transform hover:bg-zinc-200 active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Plus size={16} className="mr-2" />}
            Confirmar Assinatura
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
