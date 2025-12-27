"use client"

import { useState } from "react"
import { updateCategoryBudget } from "@/app/actions/budget"
import { Pencil, AlertTriangle, Loader2 } from "lucide-react"
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
  const [isSaving, setIsSaving] = useState(false)

  // -- Lógica de Input Monetário --
  const initialLimit = category.limit || 0
  
  // Valor numérico real para envio (float)
  const [amountValue, setAmountValue] = useState(initialLimit)
  
  // Valor formatado para exibição (string "R$ 1.000,00")
  const [amountDisplay, setAmountDisplay] = useState(
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(initialLimit)
  )

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const value = Number(rawValue) / 100
    setAmountValue(value)
    setAmountDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value))
  }
  // -------------------------------

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
    formData.append('categoryId', category.id)
    
    // Envia o valor numérico puro
    formData.append('limit', amountValue.toString())

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
            className="group relative bg-zinc-900/40 border border-white/5 hover:border-white/10 p-5 rounded-3xl transition-all hover:bg-zinc-900/60 cursor-pointer overflow-hidden shadow-sm"
            role="button"
        >
            {/* Background Glow se estourar */}
            {isOverBudget && (
                <div className="absolute inset-0 bg-rose-500/5 z-0 pointer-events-none transition-opacity" />
            )}

            <div className="relative z-10 space-y-3">
                {/* Header do Card */}
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-200 truncate pr-4">{category.name}</h3>
                        {limit > 0 ? (
                            <p className="text-[10px] text-zinc-500 mt-0.5 font-medium uppercase tracking-wider">
                                Meta: <span className="text-zinc-400">{formatCurrency(limit)}</span>
                            </p>
                        ) : (
                            <p className="text-[10px] text-zinc-600 italic mt-0.5">Sem limite</p>
                        )}
                    </div>
                    
                    {/* Botão de Edição (Aparece no Hover) */}
                    <div className="bg-white/5 p-1.5 rounded-full text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity border border-white/5 hover:bg-white/10 hover:text-white">
                        <Pencil size={12} />
                    </div>
                </div>

                {/* Valores Grandes */}
                <div className="flex items-baseline gap-2">
                    <span className={cn("text-2xl font-bold tabular-nums tracking-tight", limit > 0 ? textColor : "text-zinc-200")}>
                        {formatCurrency(spent)}
                    </span>
                </div>

                {/* Barra de Progresso */}
                {limit > 0 && (
                    <div className="space-y-1.5">
                        <Progress value={Math.min(percentage, 100)} className="h-1.5 bg-zinc-800" indicatorClassName={progressColor} />
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                            <span className={isOverBudget ? "text-rose-400" : "text-zinc-500"}>
                                {percentage.toFixed(0)}%
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

      {/* Modal de Edição - Estilo Clean */}
      <DialogContent className="bg-zinc-950/95 backdrop-blur-xl border-white/10 sm:max-w-xs rounded-3xl">
        <DialogHeader>
            <DialogTitle className="text-center text-base">Definir Limite</DialogTitle>
            <DialogDescription className="text-center text-xs">
                Orçamento para {category.name}
            </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 flex flex-col items-center justify-center">
            <div className="relative w-full text-center">
                <Input 
                    type="text" 
                    inputMode="numeric"
                    className="h-16 text-4xl font-bold bg-transparent border-none text-center focus-visible:ring-0 p-0 tracking-tight placeholder:text-zinc-800 text-white tabular-nums selection:bg-emerald-500/20"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    autoFocus
                />
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest -mt-1">Valor Máximo</p>
            </div>
        </div>

        <DialogFooter>
            <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full bg-white text-black hover:bg-zinc-200 font-bold h-11 rounded-xl shadow-lg shadow-white/5 transition-transform active:scale-95"
            >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Salvar Orçamento"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}