'use client'

import { useState, useRef, useEffect } from "react"
import { createTransaction } from "@/app/actions/transactions"
import { 
  Plus, 
  Loader2, 
  DollarSign, 
  CreditCard, 
  Tag,
  AlignLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar as CalendarIconLucide,
  Repeat
} from "lucide-react"

// Componentes Shadcn UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
}

export function TransactionForm({ categories }: { categories: Category[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, setIsPending] = useState(false)
  
  // Estados de Dados
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [paymentMethod, setPaymentMethod] = useState("PIX")
  const [categoryId, setCategoryId] = useState("general")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  
  // Estados de Lógica (Recorrência/Parcelamento)
  const [isRecurring, setIsRecurring] = useState(false)
  const [isInstallment, setIsInstallment] = useState(false)
  const [installments, setInstallments] = useState(2)

  // Estados do Input de Valor (Máscara)
  const [amountDisplay, setAmountDisplay] = useState("") // O que o usuário vê (R$ 0,00)
  const [amountValue, setAmountValue] = useState(0)      // O valor real (float) para enviar

  // Função de Máscara de Moeda (Estilo Nubank/Inter)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Remove tudo que não é número
    const rawValue = e.target.value.replace(/\D/g, "")
    
    // 2. Converte para número e divide por 100 para criar os centavos
    const value = Number(rawValue) / 100
    
    // 3. Atualiza o valor real
    setAmountValue(value)
    
    // 4. Formata para exibição (R$ X.XXX,XX)
    setAmountDisplay(new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value))
  }

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    
    // Injeção manual
    formData.set('type', type)
    formData.set('paymentMethod', paymentMethod)
    formData.set('categoryId', categoryId === "general" ? "" : categoryId)
    formData.set('date', date)
    
    // IMPORTANTE: Enviamos o valor numérico limpo, não a string formatada
    formData.set('amount', amountValue.toString())
    
    if (isInstallment && paymentMethod === 'CREDIT_CARD') {
      formData.set('installments', installments.toString())
    }
    if (isRecurring) {
      formData.set('isRecurring', 'true')
    }
    
    try {
      await createTransaction(formData)
      
      // Reset Total
      setIsRecurring(false)
      setIsInstallment(false)
      setInstallments(2)
      setDate(new Date().toISOString().split('T')[0])
      setType("EXPENSE")
      setPaymentMethod("PIX")
      setCategoryId("general")
      setAmountDisplay("")
      setAmountValue(0)
      formRef.current?.reset()
      
    } catch (error) {
      console.error("Erro ao criar transação", error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="bg-zinc-900/80 backdrop-blur-md border-white/5 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <Plus size={20} strokeWidth={2.5} />
          </div>
          <div>
            <span className="block text-sm font-normal text-muted-foreground">Adicionar</span>
            Novo Lançamento
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10 pt-4">
        <form ref={formRef} action={handleSubmit} className="space-y-6">
           
           {/* 1. SELETOR DE TIPO */}
           <div className="grid grid-cols-2 p-1 bg-zinc-950/50 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setType("INCOME")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                  type === "INCOME" 
                    ? "bg-zinc-800 text-emerald-400 shadow-md ring-1 ring-white/5" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                <ArrowUpCircle size={16} /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setType("EXPENSE")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                  type === "EXPENSE" 
                    ? "bg-zinc-800 text-rose-400 shadow-md ring-1 ring-white/5" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                <ArrowDownCircle size={16} /> Saída
              </button>
           </div>

           {/* 2. VALOR (Com Máscara Bancária) */}
           <div className="space-y-2">
             <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold ml-1">
                {isInstallment ? "Valor da Parcela" : "Valor Total"}
             </Label>
             <div className="relative group">
                {/* Usamos type="text" (ou tel) para remover as setas nativas e permitir formatação.
                  O valor 'amountDisplay' é o que o usuário vê (R$ ...).
                  O valor 'amountValue' é guardado no state para enviar ao banco.
                */}
               <Input 
                 type="text" 
                 inputMode="numeric"
                 placeholder="R$ 0,00" 
                 value={amountDisplay}
                 onChange={handleAmountChange}
                 required 
                 className="h-16 text-3xl font-bold bg-zinc-950/50 border-white/5 text-white placeholder:text-zinc-700 focus-visible:ring-primary/30 focus-visible:border-primary/50 rounded-2xl text-center"
               />
             </div>
           </div>
           
           {/* 3. DESCRIÇÃO E DATA */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold ml-1">
                  <AlignLeft size={12} /> Descrição
                </Label>
                <Input 
                  name="description" 
                  placeholder="Ex: Netflix" 
                  required 
                  className="h-12 bg-zinc-950/50 border-white/5 text-white placeholder:text-zinc-600 focus-visible:ring-primary/30"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold ml-1">
                  <CalendarIconLucide size={12} /> Data
                </Label>
                <div className="relative">
                  <Input 
                    type="date" 
                    required 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-12 bg-zinc-950/50 border-white/5 text-white focus-visible:ring-primary/30 [color-scheme:dark] cursor-pointer" 
                  />
                </div>
              </div>
           </div>

           {/* 4. CATEGORIA E PAGAMENTO */}
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold ml-1">
                   <Tag size={12} /> Categoria
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-12 bg-zinc-950/50 border-white/5 text-white focus:ring-primary/30">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
             
             <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold ml-1">
                   <CreditCard size={12} /> Meio
                </Label>
                <Select 
                  value={paymentMethod} 
                  onValueChange={(val) => {
                    setPaymentMethod(val)
                    // Resetamos os estados secundários ao trocar o método principal
                    setIsInstallment(false)
                    setIsRecurring(false)
                  }}
                >
                  <SelectTrigger className="h-12 bg-zinc-950/50 border-white/5 text-white focus:ring-primary/30">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">Pix</SelectItem>
                    <SelectItem value="CREDIT_CARD">Crédito</SelectItem>
                    <SelectItem value="DEBIT_CARD">Débito</SelectItem>
                    <SelectItem value="CASH">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
             </div>
           </div>

           {/* 5. LÓGICA DE CONDICIONAIS (Avançado) */}
           <div className="pt-2 space-y-4">
              
              {/* CENÁRIO 1: NÃO É CARTÃO (Switch Simples) */}
              {paymentMethod !== 'CREDIT_CARD' && (
                <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-zinc-950/30 hover:bg-zinc-950/50 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-zinc-200 cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>Despesa Fixa</Label>
                    <p className="text-xs text-muted-foreground">Repete todo mês</p>
                  </div>
                  <Switch 
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              )}

              {/* CENÁRIO 2: É CARTÃO (3 Opções: À Vista | Parcelado | Fixa) */}
              {paymentMethod === 'CREDIT_CARD' && (
                <div className="bg-zinc-950/30 rounded-xl p-4 border border-white/5 space-y-5 animate-in fade-in zoom-in-95 duration-300">
                   <div className="flex items-center justify-between">
                      <Label className="text-zinc-300 font-medium">Condição</Label>
                      
                      {/* Segmented Control para Cartão */}
                      <div className="flex bg-zinc-900/80 rounded-lg p-1 border border-white/5">
                        <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={() => { setIsRecurring(false); setIsInstallment(false) }}
                           className={cn(
                             "h-8 text-xs rounded-md transition-all px-3",
                             !isRecurring && !isInstallment ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                           )}
                        >
                          À Vista
                        </Button>
                        <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={() => { setIsInstallment(true); setIsRecurring(false) }}
                           className={cn(
                             "h-8 text-xs rounded-md transition-all px-3",
                             isInstallment ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                           )}
                        >
                          Parcelado
                        </Button>
                        <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           onClick={() => { setIsRecurring(true); setIsInstallment(false) }}
                           className={cn(
                             "h-8 text-xs rounded-md transition-all px-3 gap-1",
                             isRecurring ? "bg-zinc-800 text-emerald-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                           )}
                        >
                           {isRecurring && <Repeat size={10} />}
                           Fixa
                        </Button>
                      </div>
                   </div>

                   {/* Slider de Parcelas (Só aparece se for Parcelado) */}
                   {isInstallment && (
                     <div className="animate-in slide-in-from-top-2 space-y-4 pt-2">
                        <div className="flex justify-between items-end">
                           <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Quantidade</span>
                           <span className="text-xl font-bold text-primary tabular-nums leading-none">{installments}x</span>
                        </div>
                        <Slider 
                          value={[installments]}
                          min={2}
                          max={24}
                          step={1}
                          onValueChange={(vals) => setInstallments(vals[0])}
                          className="py-2 cursor-pointer"
                        />
                     </div>
                   )}
                   
                   {/* Aviso Visual para Assinatura (Só aparece se for Fixa) */}
                   {isRecurring && (
                      <div className="text-xs text-emerald-400/80 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/10 animate-in fade-in">
                        Este valor será lançado na fatura todos os meses automaticamente.
                      </div>
                   )}
                </div>
              )}
           </div>
           
           <Button 
             type="submit" 
             disabled={isPending}
             className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-[0.98]"
           >
             {isPending ? <Loader2 className="animate-spin mr-2" size={20} /> : "Confirmar Lançamento"}
           </Button>
        </form>
      </CardContent>
    </Card>
  )
}