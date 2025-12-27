'use client'

import { useState, useEffect } from "react"
import { createTransaction } from "@/app/actions/transactions" 
import { 
  Plus, 
  Calendar, 
  Tag, 
  CreditCard, 
  AlignLeft, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Loader2,
  Wallet
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// --- INTERFACES ---
interface CategoryDTO {
  id: string
  name: string
  type: string
  budgetLimit: number | null
  userId: string | null
  createdAt: Date
  updatedAt: Date
}

interface AccountDTO {
  id: string
  name: string
}

interface CreateRecurringSheetProps {
  categories: CategoryDTO[]
  accounts: AccountDTO[] 
  children: React.ReactNode
}

export function CreateRecurringSheet({ categories, accounts = [], children }: CreateRecurringSheetProps) {
  const [open, setOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // --- ESTADOS ---
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [amount, setAmount] = useState(0)
  const [amountDisplay, setAmountDisplay] = useState("") // Começa vazio para mostrar placeholder
  const [description, setDescription] = useState("")
  const [day, setDay] = useState("5") 
  const [categoryId, setCategoryId] = useState("general")
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD")
  const [bankAccountId, setBankAccountId] = useState("none")

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const value = Number(rawValue) / 100
    setAmount(value)
    setAmountDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value))
  }

  const handleSubmit = async () => {
    if (amount <= 0) return
    setIsLoading(true)

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0') 
    const selectedDay = String(day).padStart(2, '0')
    const fullDate = `${year}-${month}-${selectedDay}`

    const formData = new FormData()
    formData.append("description", description || (type === 'INCOME' ? 'Receita Fixa' : 'Despesa Fixa'))
    formData.append("amount", amount.toString())
    formData.append("type", type)
    formData.append("date", fullDate) 
    formData.append("paymentMethod", paymentMethod)
    formData.append("isRecurring", "true") 
    
    if (bankAccountId !== "none") {
        formData.append("bankAccountId", bankAccountId)
    }

    if (categoryId !== "general") {
      formData.append("categoryId", categoryId)
    }

    try {
      await createTransaction(formData) 
      setOpen(false)
      
      // Resetar form
      setAmount(0)
      setAmountDisplay("")
      setDescription("")
      setDay("5")
      setBankAccountId("none")
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted) return <>{children}</>

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md bg-zinc-950/90 backdrop-blur-xl border-l border-white/5 p-0 flex flex-col h-full shadow-2xl">
        <SheetHeader className="p-5 pb-2 border-b border-white/5 bg-transparent">
          <SheetTitle className="text-base font-semibold text-white text-center">Nova Assinatura</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 pb-32">
            
            {/* SEÇÃO DE VALOR E TIPO */}
            <div className="flex flex-col items-center gap-4">
               {/* Segmented Control */}
               <div className="flex p-1 bg-zinc-900/80 rounded-lg border border-white/5 w-full max-w-[220px]">
                  <button
                    type="button"
                    onClick={() => setType('INCOME')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
                      type === 'INCOME' 
                        ? "bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/20" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <ArrowUpCircle size={14} /> Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('EXPENSE')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all",
                      type === 'EXPENSE' 
                        ? "bg-rose-500/20 text-rose-400 shadow-sm border border-rose-500/20" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <ArrowDownCircle size={14} /> Despesa
                  </button>
               </div>

               <div className="relative w-full text-center">
                  <Input 
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    className={cn(
                      "h-16 text-4xl font-bold bg-transparent border-none text-center focus-visible:ring-0 p-0 tracking-tight placeholder:text-zinc-800 selection:bg-white/20 tabular-nums",
                      type === 'INCOME' ? "text-emerald-400" : "text-white" 
                    )}
                  />
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest -mt-1">Valor Mensal</p>
               </div>
            </div>

            {/* CAMPOS (Grouped List) */}
            <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                
                {/* DESCRIÇÃO */}
                <div className="p-3 border-b border-white/5">
                   <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Descrição</Label>
                   <div className="relative mt-1">
                      <div className="absolute left-3 top-2.5 text-zinc-500">
                         <AlignLeft size={16} />
                      </div>
                      <Input 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Netflix"
                        className="pl-10 bg-transparent border-none h-10 text-sm focus-visible:ring-0 placeholder:text-zinc-700"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-white/5">
                    {/* DIA VENCIMENTO */}
                    <div className="p-3">
                       <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Dia Venc.</Label>
                       <div className="relative mt-1">
                          <div className="absolute left-3 top-2.5 text-zinc-500">
                             <Calendar size={16} />
                          </div>
                          <Input 
                             type="number"
                             min={1}
                             max={31}
                             value={day}
                             onChange={(e) => setDay(e.target.value)}
                             className="pl-10 bg-transparent border-none h-10 text-sm focus-visible:ring-0"
                          />
                       </div>
                    </div>

                    {/* CATEGORIA */}
                    <div className="p-3">
                       <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Categoria</Label>
                       <div className="relative mt-1">
                          <div className="absolute left-3 top-2.5 text-zinc-500 z-10">
                             <Tag size={16} />
                          </div>
                          <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="pl-10 bg-transparent border-none h-10 text-xs focus:ring-0 shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10">
                              <SelectItem value="general">Geral</SelectItem>
                              {categories.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                       </div>
                    </div>
                </div>

                {/* CARTEIRA */}
                <div className="p-3 border-b border-white/5">
                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Carteira / Banco</Label>
                    <div className="relative mt-1">
                        <div className="absolute left-3 top-2.5 text-zinc-500 z-10">
                            <Wallet size={16} />
                        </div>
                        <Select value={bankAccountId} onValueChange={setBankAccountId}>
                            <SelectTrigger className="pl-10 bg-transparent border-none h-10 text-xs focus:ring-0 shadow-none">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10">
                                <SelectItem value="none">Nenhuma (Sem vínculo)</SelectItem>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* FORMA DE PAGAMENTO */}
                <div className="p-3">
                   <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Pagamento</Label>
                   <div className="relative mt-1">
                      <div className="absolute left-3 top-2.5 text-zinc-500 z-10">
                         <CreditCard size={16} />
                      </div>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="pl-10 bg-transparent border-none h-10 text-xs focus:ring-0 shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10">
                          <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                          <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                          <SelectItem value="PIX">Pix</SelectItem>
                          <SelectItem value="CASH">Dinheiro</SelectItem>
                          <SelectItem value="BOLETO">Boleto</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                </div>
            </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 w-full p-5 border-t border-white/5 bg-zinc-950/90 backdrop-blur-xl z-20">
            <Button 
                onClick={handleSubmit} 
                disabled={isLoading || amount <= 0}
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold h-12 rounded-xl text-sm shadow-lg shadow-white/5 transition-transform active:scale-[0.98]"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <Plus size={16} className="mr-2" />}
                Confirmar Assinatura
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}