"use client"

import { useState } from "react"
import { CalendarClock, Check, CreditCard, Loader2, Pencil, Trash2, Wallet, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { cn } from "@/lib/utils"
import { editRecurring, stopRecurring } from "@/app/actions/recurring"

interface Category {
  id: string
  name: string
}

interface Account {
  id: string
  name: string
  color: string | null
}

interface RecurringData {
  id: string
  description: string
  amount: number | string | { toNumber: () => number }
  paymentMethod: string
  startDate: Date
  categoryId?: string | null
  category: { name: string } | null
  bankAccountId?: string | null
  bankAccount?: { name: string; color: string | null } | null
}

interface RecurringItemProps {
  data: RecurringData
  accounts: Account[]
  categories: Category[]
}

export function RecurringItem({ data, accounts, categories }: RecurringItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const safeAmount = (val: number | string | { toNumber: () => number }) => {
    if (typeof val === "number") return val
    if (typeof val === "string") return Number(val)
    if (typeof val === "object" && val !== null && "toNumber" in val) return val.toNumber()
    return 0
  }

  const initialAmount = safeAmount(data.amount)

  const [amountValue, setAmountValue] = useState(initialAmount)
  const [description, setDescription] = useState(data.description)
  const [dateValue, setDateValue] = useState(new Date(data.startDate).toISOString().split("T")[0])
  const [bankAccountId, setBankAccountId] = useState(data.bankAccountId || "none")
  const [categoryId, setCategoryId] = useState(data.categoryId || "general")

  const [amountDisplay, setAmountDisplay] = useState(
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(initialAmount)
  )

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const value = Number(rawValue) / 100
    setAmountValue(value)
    setAmountDisplay(
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
    )
  }

  const handleCancel = () => {
    setIsEditing(false)
    setAmountValue(initialAmount)
    setAmountDisplay(
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(initialAmount)
    )
    setDescription(data.description)
    setDateValue(new Date(data.startDate).toISOString().split("T")[0])
    setBankAccountId(data.bankAccountId || "none")
    setCategoryId(data.categoryId || "general")
  }

  // AÇÃO DE SALVAR (Programática para evitar <form>)
  const onSave = async () => {
    setIsSaving(true)
    const formData = new FormData()
    formData.append("id", data.id)
    formData.append("amount", amountValue.toString())
    formData.append("description", description)
    formData.append("startDate", dateValue)
    formData.append("bankAccountId", bankAccountId === "none" ? "" : bankAccountId)
    formData.append("categoryId", categoryId === "general" ? "" : categoryId)

    try {
      await editRecurring(formData)
      toast.success("Assinatura atualizada")
      setIsEditing(false)
    } catch (error) {
      toast.error("Erro ao salvar alterações")
    } finally {
      setIsSaving(false)
    }
  }

  // AÇÃO DE EXCLUIR (Programática)
  const onDelete = async () => {
    if (!confirm("Deseja encerrar esta assinatura e apagar lançamentos futuros?")) return

    setIsDeleting(true)
    const formData = new FormData()
    formData.append("id", data.id)

    try {
      await stopRecurring(formData)
      toast.success("Assinatura encerrada")
    } catch (error) {
      toast.error("Erro ao encerrar assinatura")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card
      className={cn(
        "group overflow-visible border-white/5 bg-zinc-900/40 transition-all",
        isEditing
          ? "bg-zinc-900/60 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
          : "hover:bg-white/[0.02]"
      )}
    >
      <CardContent className="flex flex-col justify-between gap-4 p-4 md:flex-row md:items-center">
        {/* LADO ESQUERDO: ÍCONE + INFO */}
        <div className="flex flex-1 items-center gap-4">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-zinc-800/50 transition-all",
              isEditing
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "text-zinc-400 group-hover:text-emerald-400"
            )}
          >
            <CalendarClock size={18} strokeWidth={1.5} />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            {isEditing ? (
              <div className="space-y-2 duration-300 animate-in fade-in slide-in-from-left-2">
                <div className="flex w-full gap-2">
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-8 w-full max-w-[220px] border-white/10 bg-black/20 text-sm focus-visible:ring-emerald-500/30"
                    placeholder="Descrição"
                  />
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="h-8 w-[110px] border-white/10 bg-black/20 px-2 text-[10px] focus:ring-emerald-500/30">
                      <SelectValue placeholder="Categoria" />
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

                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    className="h-7 w-auto border-white/10 bg-black/20 px-2 text-[10px] [color-scheme:dark]"
                  />
                  <Select value={bankAccountId} onValueChange={setBankAccountId}>
                    <SelectTrigger className="h-7 w-[130px] border-white/10 bg-black/20 px-2 text-[10px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <Wallet size={10} className="text-zinc-500" />
                        <SelectValue placeholder="Carteira" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-zinc-900">
                      <SelectItem value="none">Sem Carteira</SelectItem>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <>
                <h3 className="truncate pr-4 text-sm font-medium text-zinc-200">
                  {data.description}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                  <span className="rounded border border-white/5 bg-white/5 px-1.5 py-0.5 text-zinc-400">
                    {data.category?.name || "Geral"}
                  </span>
                  <span className="flex items-center gap-1">
                    {data.paymentMethod === "CREDIT_CARD" ? (
                      <CreditCard size={10} />
                    ) : (
                      <Wallet size={10} />
                    )}
                    {data.paymentMethod === "CREDIT_CARD" ? "Cartão" : "Conta"}
                  </span>
                  {data.bankAccount && (
                    <span className="ml-1 flex items-center gap-1 border-l border-white/10 pl-2">
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: data.bankAccount.color || "#10b981" }}
                      />
                      {data.bankAccount.name}
                    </span>
                  )}
                  <span className="ml-1 border-l border-white/10 pl-2">
                    Todo dia {new Date(data.startDate).getDate()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* LADO DIREITO: VALOR + AÇÕES */}
        <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-3 md:justify-end md:border-t-0 md:pt-0">
          <div className="text-right">
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              Mensal
            </p>
            {isEditing ? (
              <Input
                type="text"
                inputMode="numeric"
                value={amountDisplay}
                onChange={handleAmountChange}
                className="h-8 w-28 border-white/10 bg-black/20 text-right text-sm font-bold text-emerald-400 focus-visible:ring-emerald-500/30"
              />
            ) : (
              <p className="text-sm font-bold tabular-nums text-zinc-200">{amountDisplay}</p>
            )}
          </div>

          <div className="flex items-center gap-1 border-white/5 pl-2 md:border-l">
            {isEditing ? (
              <>
                <Button
                  onClick={onSave}
                  disabled={isSaving}
                  className="h-8 w-8 rounded-lg bg-emerald-600 p-0 text-white hover:bg-emerald-500"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  className="h-8 w-8 rounded-lg p-0 text-zinc-500 hover:text-white"
                >
                  <X size={14} />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-8 w-8 rounded-lg p-0 text-zinc-500 hover:bg-white/5 hover:text-white"
                >
                  <Pencil size={14} />
                </Button>

                <Button
                  onClick={onDelete}
                  disabled={isDeleting}
                  variant="ghost"
                  className="h-8 w-8 rounded-lg p-0 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                >
                  {isDeleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
