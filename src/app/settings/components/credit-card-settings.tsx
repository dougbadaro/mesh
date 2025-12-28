"use client"

import { useState, useTransition } from "react"
import { AlertTriangle, Calendar, CreditCard, Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { cn } from "@/lib/utils"
import { updateCreditCardSettings } from "@/app/actions/settings"

interface CreditCardSettingsProps {
  initialClosingDay: number
  initialDueDay: number
}

export function CreditCardSettings({ initialClosingDay, initialDueDay }: CreditCardSettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [scope, setScope] = useState("future")

  return (
    <Card className="overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-sm backdrop-blur-xl">
      <CardHeader className="border-b border-white/5 bg-white/[0.02] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/10 bg-emerald-500/10 text-emerald-500">
            <CreditCard size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-200">Configuração do Cartão</h3>
            <p className="text-[10px] text-zinc-500">Defina as datas de corte e vencimento.</p>
          </div>
        </div>
      </CardHeader>

      <form action={(formData) => startTransition(() => updateCreditCardSettings(formData))}>
        <CardContent className="space-y-6 p-5">
          {/* Inputs Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="closingDay"
                className="pl-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500"
              >
                Dia Fechamento
              </Label>
              <div className="group relative">
                <div className="absolute left-3 top-2.5 text-zinc-500 transition-colors group-focus-within:text-white">
                  <Calendar size={14} />
                </div>
                <Input
                  id="closingDay"
                  name="closingDay"
                  type="number"
                  min={1}
                  max={31}
                  defaultValue={initialClosingDay}
                  className="h-9 rounded-xl border-white/10 bg-zinc-950/50 pl-9 text-sm focus-visible:ring-emerald-500/30"
                />
              </div>
              <p className="pl-1 text-[10px] text-zinc-600">Melhor dia de compra.</p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="dueDay"
                className="pl-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500"
              >
                Dia Vencimento
              </Label>
              <div className="group relative">
                <div className="absolute left-3 top-2.5 text-zinc-500 transition-colors group-focus-within:text-white">
                  <Calendar size={14} />
                </div>
                <Input
                  id="dueDay"
                  name="dueDay"
                  type="number"
                  min={1}
                  max={31}
                  defaultValue={initialDueDay}
                  className="h-9 rounded-xl border-white/10 bg-zinc-950/50 pl-9 text-sm focus-visible:ring-emerald-500/30"
                />
              </div>
              <p className="pl-1 text-[10px] text-zinc-600">Pagamento da fatura.</p>
            </div>
          </div>

          {/* Scope Selection - Cards Estilizados */}
          <div className="space-y-2">
            <Label className="pl-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Aplicação das Mudanças
            </Label>

            <RadioGroup
              defaultValue="future"
              name="scope"
              onValueChange={setScope}
              className="grid grid-cols-1 gap-2"
            >
              {/* Opção 1: Futuro (Padrão) */}
              <Label
                htmlFor="scope-future"
                className={cn(
                  "flex cursor-pointer select-none items-start gap-3 rounded-xl border p-3 transition-all",
                  scope === "future"
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : "border-white/5 bg-zinc-900/30 hover:bg-white/5"
                )}
              >
                <RadioGroupItem
                  value="future"
                  id="scope-future"
                  className="mt-0.5 border-white/20 text-emerald-500"
                />
                <div className="space-y-0.5">
                  <span
                    className={cn(
                      "block text-xs font-bold",
                      scope === "future" ? "text-emerald-400" : "text-zinc-300"
                    )}
                  >
                    Apenas novas compras
                  </span>
                  <p className="text-[10px] leading-tight text-zinc-500">
                    Mantém o histórico das faturas anteriores intacto. Recomendado.
                  </p>
                </div>
              </Label>

              {/* Opção 2: Retroativo (Perigo) */}
              <Label
                htmlFor="scope-all"
                className={cn(
                  "flex cursor-pointer select-none items-start gap-3 rounded-xl border p-3 transition-all",
                  scope === "all"
                    ? "border-rose-500/20 bg-rose-500/10"
                    : "border-white/5 bg-zinc-900/30 hover:bg-white/5"
                )}
              >
                <RadioGroupItem
                  value="all"
                  id="scope-all"
                  className="mt-0.5 border-white/20 text-rose-500"
                />
                <div className="space-y-0.5">
                  <span
                    className={cn(
                      "block text-xs font-bold",
                      scope === "all" ? "text-rose-400" : "text-zinc-300"
                    )}
                  >
                    Atualizar tudo (Retroativo)
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <AlertTriangle size={10} className="shrink-0 text-rose-500" />
                    <p className="text-[10px] leading-tight text-zinc-500">
                      Recalcula vencimentos de <strong>todas</strong> as compras já feitas.
                    </p>
                  </div>
                </div>
              </Label>
            </RadioGroup>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t border-white/5 bg-zinc-950/30 p-4">
          <Button
            type="submit"
            disabled={isPending}
            className="h-9 rounded-xl bg-white px-5 text-xs font-bold text-black shadow-lg shadow-white/5 transition-transform hover:bg-zinc-200 active:scale-[0.98]"
          >
            {isPending ? (
              <Loader2 className="mr-2 animate-spin" size={14} />
            ) : (
              <Save className="mr-2" size={14} />
            )}
            Salvar Configurações
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
