"use client"

import { useState } from "react"
import { CalendarClock, CreditCard, Loader2, Plus, Repeat, Tag, Wallet } from "lucide-react"
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

import { SafeAccount, SafeCategory } from "@/lib/transformers"
import { cn } from "@/lib/utils"
import { createRecurring } from "@/app/actions/recurring"

interface CreateRecurringSheetProps {
  children: React.ReactNode
  categories: SafeCategory[]
  accounts: SafeAccount[]
}

export function CreateRecurringSheet({
  children,
  categories,
  accounts,
}: CreateRecurringSheetProps) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const [amount, setAmount] = useState(0)
  const [amountDisplay, setAmountDisplay] = useState("R$ 0,00")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [frequency, setFrequency] = useState("MONTHLY")
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD")
  const [type, setType] = useState("EXPENSE")
  const [categoryId, setCategoryId] = useState("general")
  const [bankAccountId, setBankAccountId] = useState("none")

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const value = Number(rawValue) / 100
    setAmount(value)
    setAmountDisplay(
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
    )
  }

  const resetForm = () => {
    setAmount(0)
    setAmountDisplay("R$ 0,00")
    setDescription("")
    setStartDate(new Date().toISOString().split("T")[0])
    setFrequency("MONTHLY")
    setPaymentMethod("CREDIT_CARD")
    setType("EXPENSE")
    setCategoryId("general")
    setBankAccountId("none")
  }

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)

    formData.set("amount", amount.toString())
    formData.set("description", description)
    formData.set("startDate", startDate)
    formData.set("frequency", frequency)
    formData.set("paymentMethod", paymentMethod)
    formData.set("type", type)
    formData.set("categoryId", categoryId === "general" ? "" : categoryId)
    formData.set("bankAccountId", bankAccountId === "none" ? "" : bankAccountId)

    try {
      await createRecurring(formData)
      toast.success("Recorrência criada com sucesso!")
      setOpen(false)
      resetForm()
    } catch {
      toast.error("Erro ao criar recorrência")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex h-full w-full flex-col border-l border-white/5 bg-zinc-950/90 p-0 shadow-2xl backdrop-blur-xl sm:max-w-md">
        <SheetHeader className="border-b border-white/5 bg-transparent p-5 pb-2">
          <SheetTitle className="text-center text-base font-semibold text-white">
            Nova Assinatura / Fixo
          </SheetTitle>
        </SheetHeader>

        <form action={handleSubmit} className="custom-scrollbar flex-1 overflow-y-auto">
          <div className="space-y-6 p-5 pb-32">
            <div className="flex flex-col items-center gap-4">
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
                  Valor Mensal
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/30 backdrop-blur-md">
              <div className="border-b border-white/5 p-3">
                <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Nome do Gasto
                </Label>
                <div className="relative mt-1">
                  <Input
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Netflix, Aluguel..."
                    className="h-10 border-none bg-transparent px-2 text-sm placeholder:text-zinc-700 focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-white/5">
                <div className="p-3">
                  <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Primeira Cobrança
                  </Label>
                  <div className="relative mt-1">
                    <div className="absolute left-2 top-2.5 text-zinc-500">
                      <CalendarClock size={16} />
                    </div>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-10 cursor-pointer border-none bg-transparent pl-8 text-xs [color-scheme:dark] focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="p-3">
                  <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Frequência
                  </Label>
                  <div className="relative mt-1">
                    <div className="absolute left-2 top-2.5 z-10 text-zinc-500">
                      <Repeat size={16} />
                    </div>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger className="h-10 border-none bg-transparent pl-8 text-xs shadow-none focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-zinc-900">
                        <SelectItem value="MONTHLY">Mensal</SelectItem>
                        <SelectItem value="YEARLY">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-b border-white/5 p-3">
                <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Categoria
                </Label>
                <div className="relative mt-1">
                  <div className="absolute left-2 top-2.5 z-10 text-zinc-500">
                    <Tag size={16} />
                  </div>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="h-10 border-none bg-transparent pl-8 text-xs shadow-none focus:ring-0">
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

              <div className="p-3">
                <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Método de Pagamento
                </Label>
                <div className="relative mt-1">
                  <div className="absolute left-2 top-2.5 z-10 text-zinc-500">
                    {paymentMethod === "CREDIT_CARD" ? (
                      <CreditCard size={16} />
                    ) : (
                      <Wallet size={16} />
                    )}
                  </div>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-10 border-none bg-transparent pl-8 text-xs shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-zinc-900">
                      <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                      <SelectItem value="DEBIT_CARD">Débito Automático</SelectItem>
                      <SelectItem value="PIX">Pix Recorrente</SelectItem>
                      <SelectItem value="BOLETO">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {paymentMethod !== "CREDIT_CARD" && (
                <div className="border-t border-white/5 p-3 duration-300 animate-in slide-in-from-top-2">
                  <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Debitar de
                  </Label>
                  <div className="relative mt-1">
                    <div className="absolute left-2 top-2.5 z-10 text-zinc-500">
                      <Wallet size={16} />
                    </div>
                    <Select value={bankAccountId} onValueChange={setBankAccountId}>
                      <SelectTrigger className="h-10 border-none bg-transparent pl-8 text-xs shadow-none focus:ring-0">
                        <SelectValue placeholder="Selecione a conta" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-zinc-900">
                        <SelectItem value="none">Selecione...</SelectItem>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="absolute bottom-0 left-0 z-20 flex w-full flex-col gap-3 border-t border-white/5 bg-zinc-950/90 p-5 backdrop-blur-xl sm:flex-row">
            <Button
              type="submit"
              disabled={isPending}
              className="h-12 flex-1 rounded-xl bg-white text-sm font-bold text-black shadow-lg shadow-white/5 transition-transform hover:bg-zinc-200 active:scale-[0.98]"
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Plus size={16} className="mr-2" /> Criar Assinatura
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
