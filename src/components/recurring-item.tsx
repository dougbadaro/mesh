'use client'

import { useState } from "react"
import { editRecurring, stopRecurring } from "@/app/actions/recurring"
import { Pencil, Trash2, X, Check, CalendarClock, CreditCard, Wallet, Tag, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
}

interface Account {
  id: string
  name: string
  color: string | null
}

interface RecurringData {
  id: string
  description: string
  amount: number | string | { toNumber: () => number } 
  paymentMethod: string
  startDate: Date
  categoryId?: string | null
  category: { name: string } | null
  bankAccountId?: string | null 
  bankAccount?: { name: string; color: string | null } | null 
}

interface RecurringItemProps {
  data: RecurringData
  accounts: Account[]
  categories: Category[]
}

export function RecurringItem({ data, accounts, categories }: RecurringItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const safeAmount = (val: number | string | { toNumber: () => number }) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return Number(val);
    if (typeof val === 'object' && val !== null && 'toNumber' in val) return val.toNumber();
    return 0;
  }

  const initialAmount = safeAmount(data.amount);

  const [amountValue, setAmountValue] = useState(initialAmount)
  const [description, setDescription] = useState(data.description)
  const [dateValue, setDateValue] = useState(new Date(data.startDate).toISOString().split('T')[0])
  const [bankAccountId, setBankAccountId] = useState(data.bankAccountId || "none")
  const [categoryId, setCategoryId] = useState(data.categoryId || "general")

  const [amountDisplay, setAmountDisplay] = useState(
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(initialAmount)
  )

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const value = Number(rawValue) / 100
    setAmountValue(value)
    setAmountDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value))
  }

  const handleCancel = () => {
    setIsEditing(false)
    setAmountValue(initialAmount)
    setAmountDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(initialAmount))
    setDescription(data.description)
    setDateValue(new Date(data.startDate).toISOString().split('T')[0])
    setBankAccountId(data.bankAccountId || "none")
    setCategoryId(data.categoryId || "general")
  }

  // AÇÃO DE SALVAR (Programática para evitar <form>)
  const onSave = async () => {
    setIsSaving(true)
    const formData = new FormData()
    formData.append('id', data.id)
    formData.append('amount', amountValue.toString())
    formData.append('description', description)
    formData.append('startDate', dateValue)
    formData.append('bankAccountId', bankAccountId === "none" ? "" : bankAccountId)
    formData.append('categoryId', categoryId === "general" ? "" : categoryId)

    try {
      await editRecurring(formData)
      toast.success("Assinatura atualizada")
      setIsEditing(false)
    } catch (error) {
      toast.error("Erro ao salvar alterações")
    } finally {
      setIsSaving(false)
    }
  }

  // AÇÃO DE EXCLUIR (Programática)
  const onDelete = async () => {
    if (!confirm("Deseja encerrar esta assinatura e apagar lançamentos futuros?")) return
    
    setIsDeleting(true)
    const formData = new FormData()
    formData.append('id', data.id)
    
    try {
      await stopRecurring(formData)
      toast.success("Assinatura encerrada")
    } catch (error) {
      toast.error("Erro ao encerrar assinatura")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className={cn(
        "bg-zinc-900/40 border-white/5 transition-all group overflow-visible",
        isEditing ? "ring-1 ring-emerald-500/20 bg-zinc-900/60 shadow-lg shadow-emerald-500/5" : "hover:bg-white/[0.02]"
    )}>
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* LADO ESQUERDO: ÍCONE + INFO */}
        <div className="flex items-center gap-4 flex-1">
          <div className={cn(
              "h-10 w-10 rounded-xl bg-zinc-800/50 border border-white/5 flex items-center justify-center transition-all shrink-0",
              isEditing ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" : "text-zinc-400 group-hover:text-emerald-400"
          )}>
             <CalendarClock size={18} strokeWidth={1.5} />
          </div>
          
          <div className="flex-1 space-y-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex gap-2 w-full">
                  <Input 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-8 bg-black/20 border-white/10 text-sm w-full max-w-[220px] focus-visible:ring-emerald-500/30"
                    placeholder="Descrição"
                  />
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="h-8 bg-black/20 border-white/10 text-[10px] w-[110px] px-2 focus:ring-emerald-500/30">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="general">Geral</SelectItem>
                      {categories.map(cat => (
                         <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input 
                      type="date" 
                      value={dateValue} 
                      onChange={(e) => setDateValue(e.target.value)} 
                      className="h-7 bg-black/20 border-white/10 text-[10px] w-auto px-2 [color-scheme:dark]" 
                  />
                  <Select value={bankAccountId} onValueChange={setBankAccountId}>
                    <SelectTrigger className="h-7 bg-black/20 border-white/10 text-[10px] w-[130px] px-2">
                      <div className="flex items-center gap-1.5 truncate">
                          <Wallet size={10} className="text-zinc-500" />
                          <SelectValue placeholder="Carteira" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="none">Sem Carteira</SelectItem>
                      {accounts.map(acc => (
                         <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-medium text-zinc-200 text-sm truncate pr-4">{data.description}</h3>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                  <span className="bg-white/5 px-1.5 py-0.5 rounded text-zinc-400 border border-white/5">
                      {data.category?.name || 'Geral'}
                  </span>
                  <span className="flex items-center gap-1">
                    {data.paymentMethod === 'CREDIT_CARD' ? <CreditCard size={10} /> : <Wallet size={10} />}
                    {data.paymentMethod === 'CREDIT_CARD' ? 'Cartão' : 'Conta'}
                  </span>
                  {data.bankAccount && (
                    <span className="flex items-center gap-1 border-l border-white/10 pl-2 ml-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.bankAccount.color || '#10b981' }} />
                      {data.bankAccount.name}
                    </span>
                  )}
                  <span className="border-l border-white/10 pl-2 ml-1">Todo dia {new Date(data.startDate).getDate()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* LADO DIREITO: VALOR + AÇÕES */}
        <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
          <div className="text-right">
            <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Mensal</p>
            {isEditing ? (
              <Input 
                  type="text" 
                  inputMode="numeric" 
                  value={amountDisplay} 
                  onChange={handleAmountChange} 
                  className="h-8 bg-black/20 border-white/10 font-bold w-28 text-right text-sm text-emerald-400 focus-visible:ring-emerald-500/30" 
              />
            ) : (
              <p className="text-sm font-bold text-zinc-200 tabular-nums">{amountDisplay}</p>
            )}
          </div>

          <div className="flex gap-1 pl-2 md:border-l border-white/5 items-center">
            {isEditing ? (
              <>
                <Button 
                  onClick={onSave} 
                  disabled={isSaving} 
                  className="h-8 w-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg p-0"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleCancel} 
                  className="h-8 w-8 text-zinc-500 hover:text-white rounded-lg p-0"
                >
                  <X size={14} />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsEditing(true)} 
                  className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg p-0"
                >
                  <Pencil size={14} />
                </Button>
                
                <Button 
                    onClick={onDelete}
                    disabled={isDeleting}
                    variant="ghost" 
                    className="h-8 w-8 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg p-0"
                >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}