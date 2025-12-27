'use client'

import { useState, useRef } from "react"
import { createTransaction } from "@/app/actions/transactions"
import { 
  Plus, 
  Loader2, 
  CreditCard, 
  Tag,
  AlignLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar as CalendarIconLucide,
  Repeat,
  Wallet 
} from "lucide-react"

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

interface Account {
  id: string
  name: string
}

export function TransactionForm({ categories, accounts }: { categories: Category[], accounts: Account[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, setIsPending] = useState(false)
  
  // Estados de Dados
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [paymentMethod, setPaymentMethod] = useState("PIX")
  const [categoryId, setCategoryId] = useState("general")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
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
    setAmountDisplay(new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value))
  }

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    
    formData.set('type', type)
    formData.set('paymentMethod', paymentMethod)
    formData.set('categoryId', categoryId === "general" ? "" : categoryId)
    formData.set('date', date)
    formData.set('bankAccountId', bankAccountId === "none" ? "" : bankAccountId)
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
      setBankAccountId("none") 
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
    <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 shadow-2xl relative overflow-hidden rounded-3xl h-full flex flex-col">
      {/* Luz de fundo sutil */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      <CardHeader className="relative z-10 pb-2 border-b border-white/5 pt-5 px-6">
        <CardTitle className="text-base font-semibold text-white flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white ring-1 ring-white/5">
            <Plus size={16} strokeWidth={2.5} />
          </div>
          <div>
            <span className="block text-[10px] font-normal text-zinc-400 uppercase tracking-wider">Novo Lançamento</span>
            Adicionar
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10 pt-6 px-6 flex-1 overflow-y-auto custom-scrollbar">
        <form ref={formRef} action={handleSubmit} className="space-y-6 pb-6">
           
           {/* 1. SELETOR DE TIPO + VALOR */}
           <div className="flex flex-col items-center gap-4">
               {/* Segmented Control */}
               <div className="flex p-1 bg-black/20 rounded-lg border border-white/5 w-full max-w-[240px]">
                  <button
                    type="button"
                    onClick={() => setType("INCOME")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
                      type === "INCOME" 
                        ? "bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/20" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <ArrowUpCircle size={14} /> Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("EXPENSE")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
                      type === "EXPENSE" 
                        ? "bg-rose-500/20 text-rose-400 shadow-sm border border-rose-500/20" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <ArrowDownCircle size={14} /> Saída
                  </button>
               </div>

               {/* VALOR (Big Input Compacto) */}
               <div className="relative w-full text-center group">
                  <Input 
                    type="text" 
                    inputMode="numeric"
                    placeholder="R$ 0,00" 
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    required 
                    className={cn(
                        "h-20 text-5xl font-bold bg-transparent border-none text-center focus-visible:ring-0 p-0 tracking-tight placeholder:text-zinc-800 selection:bg-white/20 tabular-nums",
                        type === 'INCOME' ? "text-emerald-400" : "text-white"
                    )}
                  />
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest -mt-1 group-focus-within:text-zinc-300 transition-colors">
                    {isInstallment ? "Valor da Parcela" : "Valor Total"}
                  </p>
               </div>
           </div>
           
           {/* CONTAINER DE CAMPOS (Grouped List Style) */}
           <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
               
               {/* DESCRIÇÃO */}
               <div className="p-3 border-b border-white/5">
                 <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Descrição</Label>
                 <div className="relative mt-1">
                    <div className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors">
                       <AlignLeft size={16} />
                    </div>
                    <Input 
                      name="description" 
                      placeholder="Ex: Netflix" 
                      required 
                      className="pl-10 bg-transparent border-none h-10 text-sm focus-visible:ring-0 placeholder:text-zinc-700"
                    />
                 </div>
               </div>
               
               <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-white/5">
                  {/* DATA */}
                  <div className="p-3">
                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Data</Label>
                    <div className="relative mt-1">
                       <div className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors">
                          <CalendarIconLucide size={16} />
                       </div>
                       <Input 
                         type="date" 
                         required 
                         value={date}
                         onChange={(e) => setDate(e.target.value)}
                         className="pl-10 bg-transparent border-none h-10 text-xs [color-scheme:dark] cursor-pointer focus-visible:ring-0" 
                       />
                    </div>
                  </div>

                  {/* CARTEIRA */}
                  <div className="p-3">
                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Carteira</Label>
                    <div className="relative mt-1">
                        <div className="absolute left-3 top-2.5 text-zinc-500 z-10 group-focus-within:text-white transition-colors">
                            <Wallet size={16} />
                        </div>
                        <Select value={bankAccountId} onValueChange={setBankAccountId}>
                          <SelectTrigger className="pl-10 bg-transparent border-none h-10 text-xs focus:ring-0 shadow-none">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10">
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {accounts.map(acc => (
                              <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-white/5">
                   {/* CATEGORIA */}
                   <div className="p-3">
                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Categoria</Label>
                    <div className="relative mt-1">
                       <div className="absolute left-3 top-2.5 text-zinc-500 z-10 group-focus-within:text-white transition-colors">
                          <Tag size={16} />
                       </div>
                       <Select value={categoryId} onValueChange={setCategoryId}>
                         <SelectTrigger className="pl-10 bg-transparent border-none h-10 text-xs focus:ring-0 shadow-none">
                           <SelectValue placeholder="Selecione" />
                         </SelectTrigger>
                         <SelectContent className="bg-zinc-900 border-white/10">
                           <SelectItem value="general">Geral</SelectItem>
                           {categories.map(cat => (
                             <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>
                   </div>

                   {/* PAGAMENTO */}
                   <div className="p-3">
                       <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Pagamento</Label>
                       <div className="relative mt-1">
                          <div className="absolute left-3 top-2.5 text-zinc-500 z-10 group-focus-within:text-white transition-colors">
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
                            <SelectTrigger className="pl-10 bg-transparent border-none h-10 text-xs focus:ring-0 shadow-none">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10">
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
               {paymentMethod === 'CREDIT_CARD' ? (
                   <div className="p-4 bg-black/10 animate-in slide-in-from-top-2 space-y-4">
                      <div className="flex items-center justify-between">
                         <Label className="text-xs font-medium text-zinc-300">Condição</Label>
                         <div className="flex bg-black/30 rounded-lg p-0.5 border border-white/5">
                           <button
                             type="button"
                             onClick={() => { setIsRecurring(false); setIsInstallment(false) }}
                             className={cn(
                               "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                               !isRecurring && !isInstallment ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                             )}
                           >
                             À Vista
                           </button>
                           <button
                             type="button"
                             onClick={() => { setIsInstallment(true); setIsRecurring(false) }}
                             className={cn(
                               "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                               isInstallment ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                             )}
                           >
                             Parcelado
                           </button>
                           <button
                             type="button"
                             onClick={() => { setIsRecurring(true); setIsInstallment(false) }}
                             className={cn(
                               "px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1",
                               isRecurring ? "bg-zinc-700 text-emerald-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                             )}
                           >
                             {isRecurring && <Repeat size={10} />}
                             Fixa
                           </button>
                         </div>
                      </div>

                      {isInstallment && (
                        <div className="space-y-3 pt-1">
                           <div className="flex justify-between items-end">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Parcelas</span>
                              <span className="text-sm font-bold text-white tabular-nums">{installments}x</span>
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
                   <div className="flex items-center justify-between p-3 bg-black/10">
                     <div className="space-y-0.5">
                       <Label className="text-xs font-medium text-zinc-300 cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>Despesa Fixa</Label>
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
             className="w-full h-12 text-sm font-bold bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5 rounded-xl transition-all active:scale-[0.98]"
           >
             {isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : "Confirmar Lançamento"}
           </Button>
        </form>
      </CardContent>
    </Card>
  )
}