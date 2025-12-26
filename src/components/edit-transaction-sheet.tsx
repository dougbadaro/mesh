'use client'

import { useState, useEffect } from "react"
import { updateTransaction, deleteTransaction } from "@/app/actions/transactions"
import { Trash2, CalendarIcon, Tag, CreditCard, AlignLeft, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react"

// Componentes Shadcn
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

// Interface para as contas
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
}

interface EditSheetProps {
  children: React.ReactNode
  transaction: TransactionProps
  categories: CategoryDTO[]
  accounts: AccountDTO[] 
}

// AQUI ESTÁ A CORREÇÃO: Adicionamos "accounts = []" para evitar crash se vier undefined
export function EditTransactionSheet({ children, transaction, categories, accounts = [] }: EditSheetProps) {
  const [open, setOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false) 
  
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
  
  // State da Carteira (Se for null, usa "none" para o Select funcionar visualmente)
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
    formData.set('id', transaction.id)
    formData.set('amount', amount.toString())
    formData.set('description', description)
    formData.set('date', date)
    formData.set('categoryId', categoryId === "general" ? "" : categoryId)
    formData.set('paymentMethod', paymentMethod)
    formData.set('type', type)
    // Envia o ID da conta (ou string vazia se for "none" para o backend setar null)
    formData.set('bankAccountId', bankAccountId === "none" ? "" : bankAccountId)

    await updateTransaction(formData)
    setOpen(false)
  }

  const handleDelete = async () => {
    if (!confirm("Deseja realmente excluir esta transação?")) return
    const formData = new FormData()
    formData.set('id', transaction.id)
    await deleteTransaction(formData)
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
      
      <SheetContent className="w-full sm:max-w-md bg-zinc-950 border-l border-white/10 p-0 flex flex-col h-full">
        <SheetHeader className="p-6 pb-2 border-b border-white/5">
          <SheetTitle className="text-lg font-medium text-zinc-400">Detalhes da Transação</SheetTitle>
        </SheetHeader>

        <form action={handleSave} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8 pb-32">
            {/* SEÇÃO DE VALOR */}
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
                    <ArrowUpCircle size={14} /> Entrada
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
                    <ArrowDownCircle size={14} /> Saída
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
                      type === 'INCOME' ? "text-emerald-500" : "text-zinc-100" 
                    )}
                  />
                  <p className="text-center text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">Valor da transação</p>
               </div>
            </div>

            {/* CAMPOS */}
            <div className="space-y-5 bg-zinc-900/30 p-5 rounded-2xl border border-white/5">
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-500 ml-1">Descrição</Label>
                   <div className="relative">
                      <div className="absolute left-3 top-3 text-zinc-500">
                         <AlignLeft size={16} />
                      </div>
                      <Input 
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="pl-10 bg-zinc-950/50 border-white/10 h-11 focus-visible:ring-offset-0 focus-visible:ring-zinc-800"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-xs text-zinc-500 ml-1">Data</Label>
                       <div className="relative">
                          <div className="absolute left-3 top-3 text-zinc-500">
                             <CalendarIcon size={16} />
                          </div>
                          <Input 
                             type="date"
                             value={date}
                             onChange={(e) => setDate(e.target.value)}
                             className="pl-10 bg-zinc-950/50 border-white/10 h-11 [color-scheme:dark]"
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

                {/* CAMPO DE CARTEIRA (Safe map) */}
                <div className="space-y-2">
                    <Label className="text-xs text-zinc-500 ml-1">Carteira / Banco</Label>
                    <div className="relative">
                        <div className="absolute left-3 top-3 text-zinc-500 z-10">
                            <Wallet size={16} />
                        </div>
                        <Select value={bankAccountId} onValueChange={setBankAccountId}>
                            <SelectTrigger className="pl-10 bg-zinc-950/50 border-white/10 h-11">
                                <SelectValue placeholder="Selecione uma carteira" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nenhuma (Sem vínculo)</SelectItem>
                                {/* O erro ocorria aqui quando accounts era undefined */}
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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

          <SheetFooter className="absolute bottom-0 left-0 w-full p-6 border-t border-white/5 bg-zinc-950/80 backdrop-blur-sm flex flex-col sm:flex-row gap-3">
              <Button type="submit" className="flex-1 bg-white hover:bg-zinc-200 text-black font-bold h-12 rounded-xl">
                Salvar Alterações
              </Button>

              <Button 
                type="button" 
                onClick={handleDelete}
                variant="outline" 
                className="w-full sm:w-auto border-red-900/30 text-red-500 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50 h-12 rounded-xl px-4"
              >
                 <Trash2 size={18} />
              </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}