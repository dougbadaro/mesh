'use client'

import { useState, useEffect } from "react"
import { updateTransaction, deleteTransaction } from "@/app/actions/transactions"
import { Trash2, CalendarIcon, Tag, CreditCard, AlignLeft, ArrowUpCircle, ArrowDownCircle, Wallet, Loader2, Check } from "lucide-react"
import { toast } from "sonner" // <--- Import Novo

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

interface TransactionProps {
  id: string
  description: string
  amount: number
  date: Date
  type: string
  paymentMethod: string
  categoryId?: string | null
  bankAccountId?: string | null
  dueDate?: Date | null
  category?: { name: string } | null
}

interface EditSheetProps {
  children: React.ReactNode
  transaction: TransactionProps
  categories: CategoryDTO[]
  accounts: AccountDTO[] 
}

export function EditTransactionSheet({ children, transaction, categories, accounts = [] }: EditSheetProps) {
  const [open, setOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false) 
  const [isPending, setIsPending] = useState(false)
  
  // States
  const [amount, setAmount] = useState(transaction.amount)
  const [amountDisplay, setAmountDisplay] = useState(
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)
  )
  const [description, setDescription] = useState(transaction.description)
  const [date, setDate] = useState(new Date(transaction.date).toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState(transaction.categoryId || "general")
  const [paymentMethod, setPaymentMethod] = useState(transaction.paymentMethod)
  const [type, setType] = useState(transaction.type)
  const [bankAccountId, setBankAccountId] = useState(transaction.bankAccountId || "none")

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

  const handleSave = async (formData: FormData) => {
    setIsPending(true)
    formData.set('id', transaction.id)
    formData.set('amount', amount.toString())
    formData.set('description', description)
    formData.set('date', date)
    formData.set('categoryId', categoryId === "general" ? "" : categoryId)
    formData.set('paymentMethod', paymentMethod)
    formData.set('type', type)
    formData.set('bankAccountId', bankAccountId === "none" ? "" : bankAccountId)

    await updateTransaction(formData)
    
    // Toast Sucesso
    toast.success("Transação atualizada!", {
        description: "As alterações foram salvas com sucesso.",
        icon: <Check className="text-emerald-500" />
    })

    setIsPending(false)
    setOpen(false)
  }

  // Lógica de Exclusão Elegante (Toast com Ação)
  const handleDeleteRequest = () => {
    toast("Excluir transação?", {
        description: "Essa ação não pode ser desfeita.",
        action: {
            label: "Confirmar Exclusão",
            onClick: () => performDelete()
        },
        cancel: {
            label: "Cancelar",
            onClick: () => {}
        },
        duration: 5000, // Dá tempo de pensar
    })
  }

  const performDelete = async () => {
    setIsPending(true)
    const formData = new FormData()
    formData.set('id', transaction.id)
    
    await deleteTransaction(formData)
    
    toast.success("Transação excluída")
    
    setIsPending(false)
    setOpen(false)
  }

  if (!isMounted) {
    return <>{children}</>
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
          {children}
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-md bg-zinc-950/90 backdrop-blur-xl border-l border-white/5 p-0 flex flex-col h-full shadow-2xl">
        <SheetHeader className="p-5 pb-2 border-b border-white/5 bg-transparent">
          <SheetTitle className="text-base font-semibold text-white text-center">Editar Transação</SheetTitle>
        </SheetHeader>

        <form action={handleSave} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-5 space-y-6 pb-32">
            
            {/* SEÇÃO DE VALOR (Compacta) */}
            <div className="flex flex-col items-center gap-4">
               {/* Segmented Control iOS Style */}
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
                    <ArrowUpCircle size={14} /> Entrada
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
                    <ArrowDownCircle size={14} /> Saída
                  </button>
               </div>

               <div className="relative w-full text-center">
                  <Input 
                    type="text"
                    inputMode="numeric"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    className={cn(
                      "h-16 text-4xl font-bold bg-transparent border-none text-center focus-visible:ring-0 p-0 tracking-tight placeholder:text-zinc-800 selection:bg-white/20 tabular-nums",
                      type === 'INCOME' ? "text-emerald-400" : "text-white" 
                    )}
                  />
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest -mt-1">Valor</p>
               </div>
            </div>

            {/* CONTAINER DE CAMPOS (Visual Grouped List) */}
            <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                
                {/* DESCRIÇÃO */}
                <div className="p-3 border-b border-white/5">
                   <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Descrição</Label>
                   <div className="relative mt-1">
                      <div className="absolute left-3 top-2.5 text-zinc-500">
                         <AlignLeft size={16} />
                      </div>
                      <Input 
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="pl-10 bg-transparent border-none h-10 text-sm focus-visible:ring-0 placeholder:text-zinc-700"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-white/5">
                    {/* DATA */}
                    <div className="p-3">
                       <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Data</Label>
                       <div className="relative mt-1">
                          <div className="absolute left-3 top-2.5 text-zinc-500">
                             <CalendarIcon size={16} />
                          </div>
                          <Input 
                             type="date"
                             value={date}
                             onChange={(e) => setDate(e.target.value)}
                             className="pl-10 bg-transparent border-none h-10 text-xs [color-scheme:dark] cursor-pointer focus-visible:ring-0"
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
                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Carteira</Label>
                    <div className="relative mt-1">
                        <div className="absolute left-3 top-2.5 text-zinc-500 z-10">
                            <Wallet size={16} />
                        </div>
                        <Select value={bankAccountId} onValueChange={setBankAccountId}>
                            <SelectTrigger className="pl-10 bg-transparent border-none h-10 text-xs focus:ring-0 shadow-none">
                                <SelectValue placeholder="Selecione uma carteira" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10">
                                <SelectItem value="none">Nenhuma</SelectItem>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* PAGAMENTO */}
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
                          <SelectItem value="PIX">Pix</SelectItem>
                          <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                          <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                          <SelectItem value="CASH">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                </div>
            </div>
          </div>

          <SheetFooter className="absolute bottom-0 left-0 w-full p-5 border-t border-white/5 bg-zinc-950/90 backdrop-blur-xl flex flex-col sm:flex-row gap-3 z-20">
              <Button 
                type="submit" 
                disabled={isPending}
                className="flex-1 bg-white hover:bg-zinc-200 text-black font-bold h-12 rounded-xl text-sm shadow-lg shadow-white/5 transition-transform active:scale-[0.98]"
              >
                {isPending ? <Loader2 className="animate-spin" /> : "Salvar Alterações"}
              </Button>

              <Button 
                type="button" 
                disabled={isPending}
                onClick={handleDeleteRequest}
                variant="outline" 
                className="w-full sm:w-auto h-12 min-w-[3rem] border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 rounded-xl flex items-center justify-center gap-2"
              >
                 <Trash2 size={18} />
                 <span className="sm:hidden font-bold">Excluir</span>
              </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}