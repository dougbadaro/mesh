'use client'

import { useState } from "react"
import { editRecurring, stopRecurring } from "@/app/actions/recurring"
import { Pencil, Trash2, X, Check, CalendarClock, CreditCard, Wallet } from "lucide-react"

// Componentes Shadcn UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Interface para as contas
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
  category: { name: string } | null
  bankAccountId?: string | null // NOVO: Campo da carteira
  bankAccount?: { name: string; color: string | null } | null // Para exibir dados da carteira
}

// Recebe as contas como prop
export function RecurringItem({ data, accounts }: { data: RecurringData, accounts: Account[] }) {
  const [isEditing, setIsEditing] = useState(false)
  
  const safeAmount = (val: number | string | { toNumber: () => number }) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return Number(val);
    if (typeof val === 'object' && val !== null && 'toNumber' in val) return val.toNumber();
    return 0;
  }

  const initialAmount = safeAmount(data.amount);

  // States
  const [amountValue, setAmountValue] = useState(initialAmount)
  const [description, setDescription] = useState(data.description)
  const [dateValue, setDateValue] = useState(new Date(data.startDate).toISOString().split('T')[0])
  const [bankAccountId, setBankAccountId] = useState(data.bankAccountId || "none")

  const [amountDisplay, setAmountDisplay] = useState(
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(initialAmount)
  )

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const value = Number(rawValue) / 100
    setAmountValue(value)
    setAmountDisplay(new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value))
  }

  const handleCancel = () => {
    setIsEditing(false)
    setAmountValue(initialAmount)
    setAmountDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(initialAmount))
    setDescription(data.description)
    setDateValue(new Date(data.startDate).toISOString().split('T')[0])
    setBankAccountId(data.bankAccountId || "none")
  }

  return (
    <Card className="bg-zinc-900/40 border-white/5 hover:border-white/10 transition-all group overflow-visible">
      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* LADO ESQUERDO */}
        <div className="flex items-center gap-5 flex-1">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-primary group-hover:border-primary/20 transition-colors">
             <CalendarClock size={22} strokeWidth={1.5} />
          </div>
          
          <div className="flex-1 space-y-1.5">
            {isEditing ? (
              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                {/* Inputs de Edição */}
                <Input 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-9 bg-zinc-950/50 border-white/10 text-sm w-full max-w-[250px] focus-visible:ring-primary/30"
                  placeholder="Nome da despesa"
                  autoFocus
                />
                
                <div className="flex flex-wrap gap-2">
                   <div className="flex items-center gap-2 bg-zinc-950/30 p-1 rounded-md border border-white/5">
                      <span className="text-[10px] text-muted-foreground pl-2 whitespace-nowrap">Início:</span>
                      <Input 
                        type="date"
                        value={dateValue}
                        onChange={(e) => setDateValue(e.target.value)}
                        className="h-7 bg-transparent border-none text-xs w-auto [color-scheme:dark] cursor-pointer focus-visible:ring-0 shadow-none p-0"
                      />
                   </div>

                   {/* SELECT DE CARTEIRA (NOVO) */}
                   <Select value={bankAccountId} onValueChange={setBankAccountId}>
                      <SelectTrigger className="h-9 bg-zinc-950/50 border-white/10 text-xs w-[180px]">
                        <div className="flex items-center gap-2">
                           <Wallet size={12} className="text-muted-foreground" />
                           <SelectValue placeholder="Sem Carteira" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma (Sem vínculo)</SelectItem>
                        {accounts.map(acc => (
                           <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                        ))}
                      </SelectContent>
                   </Select>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-zinc-100 text-base">{data.description}</h3>
                
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 border-white/5 font-normal">
                    {data.category?.name || 'Geral'}
                  </Badge>
                  
                  <div className="flex items-center gap-1.5" title="Forma de Pagamento">
                      {data.paymentMethod === 'CREDIT_CARD' ? <CreditCard size={12} /> : <Wallet size={12} />}
                      <span>{data.paymentMethod === 'CREDIT_CARD' ? 'Cartão' : 'Conta'}</span>
                  </div>

                  {/* Exibe Carteira Vinculada (Se existir) */}
                  {data.bankAccount && (
                     <>
                        <div className="w-1 h-1 rounded-full bg-zinc-700" />
                        <div className="flex items-center gap-1.5" title="Carteira Vinculada">
                           <div 
                             className="w-1.5 h-1.5 rounded-full" 
                             style={{ backgroundColor: data.bankAccount.color || '#10b981' }} 
                           />
                           <span>{data.bankAccount.name}</span>
                        </div>
                     </>
                  )}
                  
                  <div className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span>Dia {new Date(data.startDate).getDate()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* LADO DIREITO */}
        <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Mensal</p>
            {isEditing ? (
               <Input 
                 type="text"
                 inputMode="numeric"
                 value={amountDisplay}
                 onChange={handleAmountChange}
                 className="h-10 bg-zinc-950/50 border-white/10 font-bold w-36 text-right text-lg text-emerald-400 focus-visible:ring-emerald-500/30"
               />
            ) : (
              <p className="text-lg font-bold text-zinc-200 tabular-nums">
                {amountDisplay}
              </p>
            )}
          </div>

          <div className="flex gap-2 pl-2 md:border-l border-white/5">
            {isEditing ? (
              <>
                <form action={editRecurring} className="flex gap-2">
                  <input type="hidden" name="id" value={data.id} />
                  <input type="hidden" name="amount" value={amountValue} />
                  <input type="hidden" name="description" value={description} />
                  <input type="hidden" name="startDate" value={dateValue} />
                  {/* Envia a carteira nova */}
                  <input type="hidden" name="bankAccountId" value={bankAccountId === "none" ? "" : bankAccountId} />
                  
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="h-9 w-9 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all" 
                    onClick={() => setIsEditing(false)}
                    title="Salvar"
                  >
                    <Check size={16} />
                  </Button>
                </form>
                
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-zinc-800" 
                  onClick={handleCancel}
                  title="Cancelar"
                >
                  <X size={16} />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-9 w-9 text-zinc-500 hover:text-white hover:bg-zinc-800" 
                  onClick={() => setIsEditing(true)}
                  title="Editar"
                >
                  <Pencil size={16} />
                </Button>
                
                <form action={stopRecurring}>
                  <input type="hidden" name="id" value={data.id} />
                  <Button 
                    type="submit" 
                    size="icon" 
                    variant="ghost" 
                    className="h-9 w-9 text-zinc-500 hover:text-red-400 hover:bg-red-500/10" 
                    title="Encerrar Assinatura"
                  >
                    <Trash2 size={16} />
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}