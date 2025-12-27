"use client"

import { useState } from "react"
import { payInvoice } from "@/app/actions/pay-invoice"
import { Wallet, CalendarIcon, Loader2, CheckCircle2, AlertCircle, Building2 } from "lucide-react"
import { toast } from "sonner" // <--- IMPORTAÇÃO DO SONNER
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface PayInvoiceDialogProps {
  invoiceTotal: number
  accounts: { id: string; name: string; currentBalance: number }[]
  monthName: string
}

export function PayInvoiceDialog({ invoiceTotal, accounts, monthName }: PayInvoiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // States
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [amount, setAmount] = useState(invoiceTotal)
  const [amountDisplay, setAmountDisplay] = useState(
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoiceTotal)
  )
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const value = Number(rawValue) / 100
    setAmount(value)
    setAmountDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value))
  }

  const handlePay = async () => {
    // Validação com Toast
    if (!selectedAccount) {
        toast.warning("Selecione uma conta", {
            description: "Você precisa informar de onde o dinheiro vai sair."
        })
        return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append("amount", amount.toString())
    formData.append("bankAccountId", selectedAccount)
    formData.append("date", date)
    formData.append("description", `Fatura Cartão - ${monthName}`)

    const result = await payInvoice(formData)
    
    setIsLoading(false)

    if (result.success) {
        setOpen(false)
        // Sucesso com Toast
        toast.success("Pagamento realizado!", {
            description: `Valor de ${amountDisplay} debitado com sucesso.`,
            duration: 4000,
        })
    } else {
        // Erro com Toast
        toast.error("Erro ao pagar", {
            description: "Não foi possível registrar o pagamento. Tente novamente."
        })
    }
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const currentAccount = accounts.find(a => a.id === selectedAccount)
  const hasBalance = currentAccount ? currentAccount.currentBalance >= amount : true

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
            className="bg-white text-black hover:bg-zinc-200 font-bold h-9 px-4 rounded-xl shadow-lg shadow-white/5 text-xs transition-transform active:scale-95"
            disabled={invoiceTotal <= 0}
        >
            <Wallet size={14} className="mr-2" />
            Pagar Fatura
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-full sm:max-w-md bg-zinc-950 border border-white/10 p-0 overflow-hidden rounded-3xl shadow-2xl gap-0">
        
        {/* HEADER */}
        <div className="p-6 pb-2 border-b border-white/5 bg-transparent">
            <DialogHeader>
                <DialogTitle className="text-base font-semibold text-white text-center flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    Pagar Fatura
                </DialogTitle>
                <p className="text-[10px] text-zinc-500 text-center mt-1">
                    Referente a <strong className="text-zinc-300">{monthName}</strong>
                </p>
            </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
            
            {/* SEÇÃO DE VALOR */}
            <div className="flex flex-col items-center justify-center gap-1">
                <div className="relative w-full text-center">
                    <Input 
                        type="text"
                        inputMode="numeric"
                        value={amountDisplay} 
                        onChange={handleAmountChange}
                        className={cn(
                          "h-16 text-4xl font-bold bg-transparent border-none text-center focus-visible:ring-0 p-0 tracking-tight placeholder:text-zinc-800 selection:bg-white/20 tabular-nums text-white",
                        )}
                    />
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest -mt-2">Valor Total</p>
                </div>
            </div>

            {/* CONTAINER DE CAMPOS */}
            <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                
                {/* CONTA */}
                <div className="p-3 border-b border-white/5">
                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Debitar de</Label>
                    <div className="relative mt-1">
                        <div className="absolute left-3 top-2.5 text-zinc-500 z-10">
                            <Building2 size={16} />
                        </div>
                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                            <SelectTrigger className="pl-10 bg-transparent border-none h-10 text-xs focus:ring-0 shadow-none text-left">
                                <SelectValue placeholder="Selecione a conta..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10">
                                {accounts.length === 0 ? (
                                    <div className="p-3 text-xs text-center text-zinc-500">Sem contas</div>
                                ) : accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        <span className="flex items-center justify-between w-full min-w-[180px] gap-4">
                                            <span>{acc.name}</span>
                                            <span className="font-mono text-zinc-500">{formatCurrency(acc.currentBalance)}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

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

            </div>

            {/* AVISO DE SALDO */}
            {!hasBalance && selectedAccount && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="text-rose-500 shrink-0" size={16} />
                    <p className="text-[10px] text-rose-300 leading-tight">
                        Saldo insuficiente na conta selecionada ({formatCurrency(currentAccount?.currentBalance ?? 0)}).
                    </p>
                </div>
            )}

        </div>

        {/* FOOTER */}
        <div className="p-6 pt-2 bg-zinc-900/30 border-t border-white/5">
             <Button 
                onClick={handlePay} 
                disabled={isLoading || !selectedAccount} 
                className="w-full bg-white text-black hover:bg-zinc-200 font-bold h-12 rounded-xl text-sm shadow-lg shadow-white/5 transition-transform active:scale-[0.98]"
             >
                {isLoading ? <Loader2 className="animate-spin" /> : "Confirmar Pagamento"}
             </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}