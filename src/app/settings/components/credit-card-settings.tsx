"use client"

import { useState, useTransition } from "react"
import { CreditCard, Save, Loader2, AlertTriangle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { updateCreditCardSettings } from "@/app/actions/settings"
import { cn } from "@/lib/utils"

interface CreditCardSettingsProps {
  initialClosingDay: number
  initialDueDay: number
}

export function CreditCardSettings({ initialClosingDay, initialDueDay }: CreditCardSettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [scope, setScope] = useState("future")

  return (
    <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden shadow-sm">
      <CardHeader className="p-5 border-b border-white/5 bg-white/[0.02]">
         <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10 text-emerald-500">
                <CreditCard size={18} />
            </div>
            <div>
                <h3 className="text-sm font-bold text-zinc-200">Configuração do Cartão</h3>
                <p className="text-[10px] text-zinc-500">Defina as datas de corte e vencimento.</p>
            </div>
         </div>
      </CardHeader>
      
      <form action={(formData) => startTransition(() => updateCreditCardSettings(formData))}>
        <CardContent className="p-5 space-y-6">
            
            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="closingDay" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Dia Fechamento</Label>
                    <div className="relative group">
                        <div className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors">
                            <Calendar size={14} />
                        </div>
                        <Input 
                            id="closingDay"
                            name="closingDay"
                            type="number"
                            min={1} max={31}
                            defaultValue={initialClosingDay}
                            className="pl-9 h-9 bg-zinc-950/50 border-white/10 text-sm focus-visible:ring-emerald-500/30 rounded-xl"
                        />
                    </div>
                    <p className="text-[10px] text-zinc-600 pl-1">Melhor dia de compra.</p>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="dueDay" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Dia Vencimento</Label>
                    <div className="relative group">
                        <div className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors">
                            <Calendar size={14} />
                        </div>
                        <Input 
                            id="dueDay"
                            name="dueDay"
                            type="number"
                            min={1} max={31}
                            defaultValue={initialDueDay}
                            className="pl-9 h-9 bg-zinc-950/50 border-white/10 text-sm focus-visible:ring-emerald-500/30 rounded-xl"
                        />
                    </div>
                    <p className="text-[10px] text-zinc-600 pl-1">Pagamento da fatura.</p>
                </div>
            </div>

            {/* Scope Selection - Cards Estilizados */}
            <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Aplicação das Mudanças</Label>
                
                <RadioGroup defaultValue="future" name="scope" onValueChange={setScope} className="grid grid-cols-1 gap-2">
                    
                    {/* Opção 1: Futuro (Padrão) */}
                    <Label
                        htmlFor="scope-future"
                        className={cn(
                            "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none",
                            scope === 'future' 
                                ? "bg-emerald-500/10 border-emerald-500/20" 
                                : "bg-zinc-900/30 border-white/5 hover:bg-white/5"
                        )}
                    >
                        <RadioGroupItem value="future" id="scope-future" className="mt-0.5 border-white/20 text-emerald-500" />
                        <div className="space-y-0.5">
                            <span className={cn("text-xs font-bold block", scope === 'future' ? "text-emerald-400" : "text-zinc-300")}>
                                Apenas novas compras
                            </span>
                            <p className="text-[10px] text-zinc-500 leading-tight">
                                Mantém o histórico das faturas anteriores intacto. Recomendado.
                            </p>
                        </div>
                    </Label>

                    {/* Opção 2: Retroativo (Perigo) */}
                    <Label
                        htmlFor="scope-all"
                        className={cn(
                            "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none",
                            scope === 'all' 
                                ? "bg-rose-500/10 border-rose-500/20" 
                                : "bg-zinc-900/30 border-white/5 hover:bg-white/5"
                        )}
                    >
                        <RadioGroupItem value="all" id="scope-all" className="mt-0.5 border-white/20 text-rose-500" />
                        <div className="space-y-0.5">
                            <span className={cn("text-xs font-bold block", scope === 'all' ? "text-rose-400" : "text-zinc-300")}>
                                Atualizar tudo (Retroativo)
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <AlertTriangle size={10} className="text-rose-500 shrink-0" />
                                <p className="text-[10px] text-zinc-500 leading-tight">
                                    Recalcula vencimentos de <strong>todas</strong> as compras já feitas.
                                </p>
                            </div>
                        </div>
                    </Label>

                </RadioGroup>
            </div>

        </CardContent>

        <CardFooter className="p-4 bg-zinc-950/30 border-t border-white/5 flex justify-end">
            <Button 
                type="submit" 
                disabled={isPending} 
                className="bg-white text-black hover:bg-zinc-200 h-9 text-xs font-bold rounded-xl px-5 shadow-lg shadow-white/5 transition-transform active:scale-[0.98]"
            >
                {isPending ? <Loader2 className="animate-spin mr-2" size={14}/> : <Save className="mr-2" size={14}/>}
                Salvar Configurações
            </Button>
        </CardFooter>
      </form>
    </Card>
  )
}