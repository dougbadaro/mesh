"use client"

import { useRef, useState } from "react"
import {
  AlignLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar as CalendarIconLucide,
  Check, // <--- Import Novo
  CreditCard,
  Loader2,
  Plus,
  Repeat,
  Tag,
  Wallet,
} from "lucide-react"
import { toast } from "sonner" // <--- Import Novo

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

import { cn } from "@/lib/utils"
import { createTransaction } from "@/app/actions/transactions"

interface Category {
  id: string
  name: string
}

interface Account {
  id: string
  name: string
}

export function TransactionForm({
  categories,
  accounts,
}: {
  categories: Category[]
  accounts: Account[]
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, setIsPending] = useState(false)

  // Estados de Dados
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [paymentMethod, setPaymentMethod] = useState("PIX")
  const [categoryId, setCategoryId] = useState("general")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [bankAccountId, setBankAccountId] = useState("none")

  // Estados de Lógica
  const [isRecurring, setIsRecurring] = useState(false)
  const [isInstallment, setIsInstallment] = useState(false)
  const [installments, setInstallments] = useState(2)

  // Estados do Input de Valor
  const [amountDisplay, setAmountDisplay] = useState("")
  const [amountValue, setAmountValue] = useState(0)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const value = Number(rawValue) / 100
    setAmountValue(value)
    setAmountDisplay(
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value)
    )
  }

  async function handleSubmit(formData: FormData) {
    if (amountValue <= 0) {
      toast.warning("Valor inválido", {
        description: "Informe um valor maior que zero.",
      })
      return
    }

    setIsPending(true)

    // Captura da descrição para o Toast
    const description = formData.get("description") as string

    formData.set("type", type)
    formData.set("paymentMethod", paymentMethod)
    formData.set("categoryId", categoryId === "general" ? "" : categoryId)
    formData.set("date", date)
    formData.set("bankAccountId", bankAccountId === "none" ? "" : bankAccountId)
    formData.set("amount", amountValue.toString())

    if (isInstallment && paymentMethod === "CREDIT_CARD") {
      formData.set("installments", installments.toString())
    }
    if (isRecurring) {
      formData.set("isRecurring", "true")
    }

    try {
      await createTransaction(formData)

      // Toast de Sucesso
      toast.success("Transação salva!", {
        description: `${description} - ${amountDisplay}`,
        icon: <Check className="text-emerald-500" />,
      })

      // Reset Total
      setIsRecurring(false)
      setIsInstallment(false)
      setInstallments(2)
      setDate(new Date().toISOString().split("T")[0])
      setType("EXPENSE")
      setPaymentMethod("PIX")
      setCategoryId("general")
      setBankAccountId("none")
      setAmountDisplay("")
      setAmountValue(0)
      formRef.current?.reset()
    } catch (error) {
      console.error("Erro ao criar transação", error)
      toast.error("Erro ao salvar", {
        description: "Tente novamente mais tarde.",
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="relative flex h-full flex-col overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-2xl backdrop-blur-xl">
      {/* Luz de fundo sutil */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-emerald-500/5 blur-[100px]" />

      <CardHeader className="relative z-10 border-b border-white/5 px-6 pb-2 pt-5">
        <CardTitle className="flex items-center gap-3 text-base font-semibold text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/5">
            <Plus size={16} strokeWidth={2.5} />
          </div>
          <div>
            <span className="block text-[10px] font-normal uppercase tracking-wider text-zinc-400">
              Novo Lançamento
            </span>
            Adicionar
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="custom-scrollbar relative z-10 flex-1 overflow-y-auto px-6 pt-6">
        <form ref={formRef} action={handleSubmit} className="space-y-6 pb-6">
          {/* 1. SELETOR DE TIPO + VALOR */}
          <div className="flex flex-col items-center gap-4">
            {/* Segmented Control */}
            <div className="flex w-full max-w-[240px] rounded-lg border border-white/5 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => setType("INCOME")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
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
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
                  type === "EXPENSE"
                    ? "border border-rose-500/20 bg-rose-500/20 text-rose-400 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <ArrowDownCircle size={14} /> Saída
              </button>
            </div>

            {/* VALOR (Big Input Compacto) */}
            <div className="group relative w-full text-center">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={amountDisplay}
                onChange={handleAmountChange}
                required
                className={cn(
                  "h-20 border-none bg-transparent p-0 text-center text-5xl font-bold tabular-nums tracking-tight selection:bg-white/20 placeholder:text-zinc-800 focus-visible:ring-0",
                  type === "INCOME" ? "text-emerald-400" : "text-white"
                )}
              />
              <p className="-mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors group-focus-within:text-zinc-300">
                {isInstallment ? "Valor da Parcela" : "Valor Total"}
              </p>
            </div>
          </div>

          {/* CONTAINER DE CAMPOS (Grouped List Style) */}
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md">
            {/* DESCRIÇÃO */}
            <div className="border-b border-white/5 p-3">
              <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Descrição
              </Label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-2.5 text-zinc-500 transition-colors group-focus-within:text-white">
                  <AlignLeft size={16} />
                </div>
                <Input
                  name="description"
                  placeholder="Ex: Netflix"
                  required
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
                  <div className="absolute left-3 top-2.5 text-zinc-500 transition-colors group-focus-within:text-white">
                    <CalendarIconLucide size={16} />
                  </div>
                  <Input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-10 cursor-pointer border-none bg-transparent pl-10 text-xs [color-scheme:dark] focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* CARTEIRA */}
              <div className="p-3">
                <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Carteira
                </Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-2.5 z-10 text-zinc-500 transition-colors group-focus-within:text-white">
                    <Wallet size={16} />
                  </div>
                  <Select value={bankAccountId} onValueChange={setBankAccountId}>
                    <SelectTrigger className="h-10 border-none bg-transparent pl-10 text-xs shadow-none focus:ring-0">
                      <SelectValue placeholder="Selecione" />
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
            </div>

            <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-white/5">
              {/* CATEGORIA */}
              <div className="p-3">
                <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Categoria
                </Label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-2.5 z-10 text-zinc-500 transition-colors group-focus-within:text-white">
                    <Tag size={16} />
                  </div>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="h-10 border-none bg-transparent pl-10 text-xs shadow-none focus:ring-0">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-zinc-900">
                      <SelectItem value="general">Geral</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
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
                  <div className="absolute left-3 top-2.5 z-10 text-zinc-500 transition-colors group-focus-within:text-white">
                    <CreditCard size={16} />
                  </div>
                  <Select
                    value={paymentMethod}
                    onValueChange={(val) => {
                      setPaymentMethod(val)
                      setIsInstallment(false)
                      setIsRecurring(false)
                    }}
                  >
                    <SelectTrigger className="h-10 border-none bg-transparent pl-10 text-xs shadow-none focus:ring-0">
                      <SelectValue placeholder="Selecione" />
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

            {/* LÓGICA CONDICIONAL (Aparece dentro do card se necessário) */}
            {paymentMethod === "CREDIT_CARD" ? (
              <div className="space-y-4 bg-black/10 p-4 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-zinc-300">Condição</Label>
                  <div className="flex rounded-lg border border-white/5 bg-black/30 p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecurring(false)
                        setIsInstallment(false)
                      }}
                      className={cn(
                        "rounded-md px-3 py-1 text-[10px] font-bold transition-all",
                        !isRecurring && !isInstallment
                          ? "bg-zinc-700 text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      À Vista
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInstallment(true)
                        setIsRecurring(false)
                      }}
                      className={cn(
                        "rounded-md px-3 py-1 text-[10px] font-bold transition-all",
                        isInstallment
                          ? "bg-zinc-700 text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      Parcelado
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecurring(true)
                        setIsInstallment(false)
                      }}
                      className={cn(
                        "flex items-center gap-1 rounded-md px-3 py-1 text-[10px] font-bold transition-all",
                        isRecurring
                          ? "bg-zinc-700 text-emerald-400 shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      {isRecurring && <Repeat size={10} />}
                      Fixa
                    </button>
                  </div>
                </div>

                {isInstallment && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-end justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Parcelas
                      </span>
                      <span className="text-sm font-bold tabular-nums text-white">
                        {installments}x
                      </span>
                    </div>
                    <Slider
                      value={[installments]}
                      min={2}
                      max={24}
                      step={1}
                      onValueChange={(vals) => setInstallments(vals[0])}
                      className="cursor-pointer"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-black/10 p-3">
                <div className="space-y-0.5">
                  <Label
                    className="cursor-pointer text-xs font-medium text-zinc-300"
                    onClick={() => setIsRecurring(!isRecurring)}
                  >
                    Despesa Fixa
                  </Label>
                  <p className="text-[10px] text-zinc-500">Repete todo mês.</p>
                </div>
                <Switch
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                  className="scale-75 data-[state=checked]:bg-emerald-500"
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="h-12 w-full rounded-xl bg-white text-sm font-bold text-black shadow-lg shadow-white/5 transition-all hover:bg-zinc-200 active:scale-[0.98]"
          >
            {isPending ? (
              <Loader2 className="mr-2 animate-spin" size={16} />
            ) : (
              "Confirmar Lançamento"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
