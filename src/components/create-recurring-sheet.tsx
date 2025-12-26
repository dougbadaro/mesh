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
  Loader2 
} from "lucide-react"

// --- INTERFACES CORRIGIDAS ---
interface CategoryDTO {
  id: string
  name: string
  type: string
  budgetLimit: number | null
  userId: string | null
  createdAt: Date
  updatedAt: Date
}

interface CreateRecurringSheetProps {
  categories: CategoryDTO[]
  children: React.ReactNode
}

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

export function CreateRecurringSheet({ categories, children }: CreateRecurringSheetProps) {
  const [open, setOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // --- ESTADOS ---
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [amount, setAmount] = useState(0)
  const [amountDisplay, setAmountDisplay] = useState("R$ 0,00")
  const [description, setDescription] = useState("")
  const [day, setDay] = useState("5") 
  const [categoryId, setCategoryId] = useState("general")
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD")

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

    if (categoryId !== "general") {
      formData.append("categoryId", categoryId)
    }

    try {
      await createTransaction(formData) 
      setOpen(false)
      
      // Resetar form
      setAmount(0)
      setAmountDisplay("R$ 0,00")
      setDescription("")
      setDay("5")
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
      
      <SheetContent className="w-full sm:max-w-md bg-zinc-950 border-l border-white/10 p-0 flex flex-col h-full">
        <SheetHeader className="p-6 pb-2 border-b border-white/5">
          <SheetTitle className="text-lg font-medium text-zinc-400">Nova Assinatura / Gasto Fixo</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            <div className="flex flex-col items-center gap-6">
               <div className="flex p-1 bg-zinc-900 rounded-full border border-white/5 w-full max-w-[240px]">
                  <button
                    type="button"
                    onClick={() => setType('INCOME')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-1.5 px-4 rounded-full text-xs font-bold transition-all",
                      type === 'INCOME' 
                        ? "bg-emerald-500/20 text-emerald-400 shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <ArrowUpCircle size={14} /> Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('EXPENSE')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-1.5 px-4 rounded-full text-xs font-bold transition-all",
                      type === 'EXPENSE' 
                        ? "bg-rose-500/20 text-rose-400 shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <ArrowDownCircle size={14} /> Despesa
                  </button>
               </div>

               <div className="relative w-full">
                  <Input 
                    type="text"
                    inputMode="numeric"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    className={cn(
                      "h-20 text-5xl font-bold bg-transparent border-none text-center focus-visible:ring-0 p-0 tracking-tight placeholder:text-zinc-800",
                      type === 'INCOME' ? "text-emerald-500" : "text-white" 
                    )}
                  />
                  <p className="text-center text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">Valor Mensal</p>
               </div>
            </div>

            <div className="space-y-5 bg-zinc-900/30 p-5 rounded-2xl border border-white/5">
                
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500 ml-1">Descrição</Label>
                   <div className="relative">
                      <div className="absolute left-3 top-3 text-zinc-500">
                         <AlignLeft size={16} />
                      </div>
                      <Input 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Netflix, Aluguel..."
                        className="pl-10 bg-zinc-950/50 border-white/10 h-11 focus-visible:ring-offset-0 focus-visible:ring-zinc-800"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-xs text-zinc-500 ml-1">Dia Vencimento</Label>
                       <div className="relative">
                          <div className="absolute left-3 top-3 text-zinc-500">
                             <Calendar size={16} />
                          </div>
                          <Input 
                             type="number"
                             min={1}
                             max={31}
                             value={day}
                             onChange={(e) => setDay(e.target.value)}
                             className="pl-10 bg-zinc-950/50 border-white/10 h-11"
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-xs text-zinc-500 ml-1">Categoria</Label>
                       <div className="relative">
                          <div className="absolute left-3 top-3 text-zinc-500 z-10">
                             <Tag size={16} />
                          </div>
                          <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="pl-10 bg-zinc-950/50 border-white/10 h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">Geral</SelectItem>
                              {categories.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                       </div>
                    </div>
                </div>

                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500 ml-1">Forma de Pagamento</Label>
                   <div className="relative">
                      <div className="absolute left-3 top-3 text-zinc-500 z-10">
                         <CreditCard size={16} />
                      </div>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="pl-10 bg-zinc-950/50 border-white/10 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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

        <SheetFooter className="p-6 border-t border-white/5 bg-zinc-950">
            <Button 
                onClick={handleSubmit} 
                disabled={isLoading || amount <= 0}
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold h-12 rounded-xl"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : <Plus size={18} className="mr-2" />}
                Criar Assinatura
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}