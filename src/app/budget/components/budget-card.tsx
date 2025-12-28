"use client"

import { useState } from "react"
import { AlertTriangle, Check, Loader2, Pencil } from "lucide-react"
import { toast } from "sonner" // <--- IMPORTANTE

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

import { cn } from "@/lib/utils"
import { updateCategoryBudget } from "@/app/actions/budget"

interface BudgetCardProps {
  category: {
    id: string
    name: string
    limit: number | null
  }
  spent: number
}

export function BudgetCard({ category, spent }: BudgetCardProps) {
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // -- Lógica de Input Monetário --
  const initialLimit = category.limit || 0
  const [amountValue, setAmountValue] = useState(initialLimit)
  const [amountDisplay, setAmountDisplay] = useState(
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(initialLimit)
  )

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const value = Number(rawValue) / 100
    setAmountValue(value)
    setAmountDisplay(
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
    )
  }

  // Cálculos visuais
  const limit = category.limit || 0
  const percentage = limit > 0 ? (spent / limit) * 100 : 0
  const isOverBudget = percentage > 100
  const isWarning = percentage > 80 && percentage <= 100

  // Cores dinâmicas
  let progressColor = "bg-emerald-500"
  let textColor = "text-emerald-500"

  if (isOverBudget) {
    progressColor = "bg-rose-500"
    textColor = "text-rose-500"
  } else if (isWarning) {
    progressColor = "bg-amber-500"
    textColor = "text-amber-500"
  }

  const handleSave = async () => {
    setIsSaving(true)
    const formData = new FormData()
    formData.append("categoryId", category.id)
    formData.append("limit", amountValue.toString())

    try {
      await updateCategoryBudget(formData)
      setOpen(false)
      toast.success("Orçamento atualizado!", {
        description: `Novo teto para ${category.name}: ${amountDisplay}`,
        icon: <Check className="text-emerald-500" />,
      })
    } catch (error) {
      toast.error("Erro ao salvar", {
        description: "Não foi possível atualizar o limite.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div
          className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-5 shadow-sm transition-all hover:border-white/10 hover:bg-zinc-900/60"
          role="button"
        >
          {isOverBudget && (
            <div className="pointer-events-none absolute inset-0 z-0 bg-rose-500/5 transition-opacity" />
          )}

          <div className="relative z-10 space-y-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="truncate pr-2 text-sm font-semibold text-zinc-200">
                  {category.name}
                </h3>
                {limit > 0 ? (
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                    Meta: <span className="text-zinc-400">{formatCurrency(limit)}</span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-[10px] italic text-zinc-600">Sem limite definido</p>
                )}
              </div>

              <div className="shrink-0 rounded-full border border-white/5 bg-white/5 p-1.5 text-zinc-400 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100">
                <Pencil size={12} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-2xl font-bold tabular-nums tracking-tight",
                  limit > 0 ? textColor : "text-zinc-200"
                )}
              >
                {formatCurrency(spent)}
              </span>
            </div>

            {limit > 0 && (
              <div className="space-y-1.5">
                <Progress
                  value={Math.min(percentage, 100)}
                  className="h-1.5 bg-white/5"
                  indicatorClassName={progressColor}
                />
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                  <span className={isOverBudget ? "text-rose-400" : "text-zinc-500"}>
                    {percentage.toFixed(0)}%
                  </span>
                  {isOverBudget && (
                    <span className="flex animate-pulse items-center gap-1 text-rose-500">
                      <AlertTriangle size={10} /> Limite Excedido
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="rounded-3xl border-white/10 bg-zinc-950/95 p-6 backdrop-blur-xl sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center text-base">Ajustar Meta</DialogTitle>
          <DialogDescription className="text-center text-xs">
            Defina o teto mensal para{" "}
            <span className="font-medium text-white">{category.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative w-full text-center">
            <Input
              type="text"
              inputMode="numeric"
              className="h-16 border-none bg-transparent p-0 text-center text-4xl font-bold tabular-nums tracking-tight text-white selection:bg-emerald-500/20 placeholder:text-zinc-800 focus-visible:ring-0"
              value={amountDisplay}
              onChange={handleAmountChange}
              autoFocus
            />
            <p className="-mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Valor do Limite
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:flex-col">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-12 w-full rounded-xl bg-white font-bold text-black shadow-lg shadow-white/5 transition-transform hover:bg-zinc-200 active:scale-95"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Confirmar Alteração"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-xs text-zinc-500 hover:text-white"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
