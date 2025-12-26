"use client"

import { useState, useTransition } from "react"
import { CreditCard, Save, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { updateCreditCardSettings } from "@/app/actions/settings"

interface CreditCardSettingsProps {
  initialClosingDay: number
  initialDueDay: number
}

export function CreditCardSettings({ initialClosingDay, initialDueDay }: CreditCardSettingsProps) {
  const [isPending, startTransition] = useTransition()
  
  return (
    <Card className="bg-zinc-900/40 border-white/5">
      <CardHeader>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                <CreditCard size={20} />
            </div>
            <div>
                <CardTitle className="text-lg">Configuração do Cartão</CardTitle>
                <CardDescription>Defina as datas para o cálculo correto das faturas.</CardDescription>
            </div>
        </div>
      </CardHeader>
      
      <form action={(formData) => startTransition(() => updateCreditCardSettings(formData))}>
        <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="closingDay">Dia do Fechamento (Melhor dia)</Label>
                    <div className="relative">
                        <Input 
                            id="closingDay"
                            name="closingDay"
                            type="number"
                            min={1}
                            max={31}
                            defaultValue={initialClosingDay}
                            className="bg-zinc-950/50 border-white/10"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">
                            Dia que a fatura vira. Apenas novas compras serão afetadas.
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="dueDay">Dia do Vencimento</Label>
                    <Input 
                        id="dueDay"
                        name="dueDay"
                        type="number"
                        min={1}
                        max={31}
                        defaultValue={initialDueDay}
                        className="bg-zinc-950/50 border-white/10"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                        Dia final para pagamento da fatura.
                    </p>
                </div>
            </div>

            {/* SELEÇÃO DE ALCANCE DA MUDANÇA */}
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                <Label className="text-sm font-medium text-zinc-300">Como aplicar essas alterações?</Label>
                
                <RadioGroup defaultValue="future" name="scope" className="gap-3">
                    
                    {/* Opção 1: Padrão */}
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors cursor-pointer">
                        <RadioGroupItem value="future" id="scope-future" className="mt-1" />
                        <div className="space-y-1">
                            <Label htmlFor="scope-future" className="font-medium cursor-pointer">Apenas novas transações</Label>
                            <p className="text-xs text-zinc-500">
                                Transações passadas e parcelas já geradas não serão alteradas.
                            </p>
                        </div>
                    </div>

                    {/* Opção 2: Retroativo */}
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer">
                        <RadioGroupItem value="all" id="scope-all" className="mt-1 text-rose-500 border-rose-500/50" />
                        <div className="space-y-1">
                            <Label htmlFor="scope-all" className="font-medium cursor-pointer text-rose-200">Atualizar transações existentes</Label>
                            <p className="text-xs text-zinc-500">
                                <span className="text-rose-400 flex items-center gap-1 mb-1">
                                    <AlertTriangle size={10} /> Atenção:
                                </span>
                                Isso mudará o <strong>Dia de Vencimento</strong> de todas as suas compras no cartão (passadas e futuras) para o novo dia escolhido.
                            </p>
                        </div>
                    </div>
                </RadioGroup>
            </div>

        </CardContent>
        <CardFooter className="border-t border-white/5 pt-4">
            <Button type="submit" disabled={isPending} className="bg-white text-black hover:bg-zinc-200 w-full sm:w-auto">
                {isPending ? <Loader2 className="animate-spin mr-2" size={16}/> : <Save className="mr-2" size={16}/>}
                Salvar Configurações
            </Button>
        </CardFooter>
      </form>
    </Card>
  )
}