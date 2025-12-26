"use client"

import { useState } from "react"
import { updateCategoryBudget } from "@/app/actions/budget"
import { Pencil, Check, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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
  const [newLimit, setNewLimit] = useState(category.limit?.toString() || "")
  const [isSaving, setIsSaving] = useState(false)

  // Cálculos visuais
  const limit = category.limit || 0
  const percentage = limit > 0 ? (spent / limit) * 100 : 0
  const isOverBudget = percentage > 100
  const isWarning = percentage > 70 && percentage <= 100

  // Cores dinâmicas
  let progressColor = "bg-emerald-500" // Padrão (Verde)
  let textColor = "text-emerald-500"
  
  if (isOverBudget) {
    progressColor = "bg-rose-500" // Estourou (Vermelho)
    textColor = "text-rose-500"
  } else if (isWarning) {
    progressColor = "bg-amber-500" // Alerta (Amarelo)
    textColor = "text-amber-500"
  }

  const handleSave = async () => {
    setIsSaving(true)
    const formData = new FormData()
    formData.append('categoryId', category.id)
    formData.append('limit', newLimit)

    await updateCategoryBudget(formData)
    setIsSaving(false)
    setOpen(false)
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div 
            className="group relative bg-zinc-900/40 border border-white/5 hover:border-white/10 p-5 rounded-2xl transition-all hover:bg-zinc-900/60 cursor-pointer overflow-hidden"
            role="button"
        >
            {/* Background Glow se estourar */}
            {isOverBudget && (
                <div className="absolute inset-0 bg-rose-500/5 z-0 pointer-events-none" />
            )}

            <div className="relative z-10 space-y-4">
                {/* Header do Card */}
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-medium text-zinc-200">{category.name}</h3>
                        {limit > 0 ? (
                            <p className="text-xs text-zinc-500 mt-1">
                                Limite: <span className="text-zinc-400">{formatCurrency(limit)}</span>
                            </p>
                        ) : (
                            <p className="text-xs text-zinc-600 italic mt-1">Sem limite definido</p>
                        )}
                    </div>
                    
                    {/* Botão de Edição (Aparece no Hover) */}
                    <div className="bg-zinc-950/50 p-2 rounded-full text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity border border-white/5">
                        <Pencil size={14} />
                    </div>
                </div>

                {/* Valores Grandes */}
                <div className="flex items-baseline gap-2">
                    <span className={cn("text-2xl font-bold tabular-nums", limit > 0 ? textColor : "text-zinc-200")}>
                        {formatCurrency(spent)}
                    </span>
                    {limit > 0 && (
                        <span className="text-xs font-medium text-zinc-500">
                           de {formatCurrency(limit)}
                        </span>
                    )}
                </div>

                {/* Barra de Progresso */}
                {limit > 0 && (
                    <div className="space-y-1.5">
                        <Progress value={Math.min(percentage, 100)} className="h-2 bg-zinc-800" indicatorClassName={progressColor} />
                        <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider">
                            <span className={isOverBudget ? "text-rose-400" : "text-zinc-500"}>
                                {percentage.toFixed(0)}% Usado
                            </span>
                            {isOverBudget && (
                                <span className="flex items-center gap-1 text-rose-500 animate-pulse">
                                    <AlertTriangle size={10} /> Excedido
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </DialogTrigger>

      {/* Modal de Edição */}
      <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-sm">
        <DialogHeader>
            <DialogTitle>Definir Limite</DialogTitle>
            <DialogDescription>Orçamento mensal para {category.name}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">R$</span>
                <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    className="pl-10 h-14 text-xl bg-zinc-900 border-white/10"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                />
            </div>
        </div>

        <DialogFooter>
            <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full bg-white text-black hover:bg-zinc-200"
            >
                {isSaving ? "Salvando..." : "Salvar Orçamento"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}