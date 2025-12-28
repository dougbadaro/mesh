"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Building2, CalendarIcon, CheckCircle2, Loader2, Wallet } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { payInvoice } from "@/app/actions/pay-invoice"

interface PayInvoiceDialogProps {
  invoiceTotal: number
  accounts: { id: string; name: string; currentBalance: number }[]
  monthName: string
}

export function PayInvoiceDialog({ invoiceTotal, accounts, monthName }: PayInvoiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 🟢 CORREÇÃO: isMounted com setTimeout para evitar erro do Linter e Hidratação
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // States do formulário
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [amount, setAmount] = useState(invoiceTotal)
  const [amountDisplay, setAmountDisplay] = useState(
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(invoiceTotal)
  )
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const value = Number(rawValue) / 100
    setAmount(value)
    setAmountDisplay(
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
    )
  }

  const handlePay = async () => {
    if (!selectedAccount) {
      toast.warning("Selecione uma conta", {
        description: "Você precisa informar de onde o dinheiro vai sair.",
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
      toast.success("Pagamento realizado!", {
        description: `Valor de ${amountDisplay} debitado com sucesso.`,
        duration: 4000,
      })
    } else {
      toast.error("Erro ao pagar", {
        description: "Não foi possível registrar o pagamento. Tente novamente.",
      })
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

  const currentAccount = accounts.find((a) => a.id === selectedAccount)
  const hasBalance = currentAccount ? currentAccount.currentBalance >= amount : true

  // Se não estiver montado no cliente, não renderiza nada (evita erro de IDs)
  if (!isMounted) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="h-9 rounded-xl bg-white px-4 text-xs font-bold text-black shadow-lg shadow-white/5 transition-transform hover:bg-zinc-200 active:scale-95"
          disabled={invoiceTotal <= 0}
        >
          <Wallet size={14} className="mr-2" />
          Pagar Fatura
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full gap-0 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-0 shadow-2xl sm:max-w-md">
        {/* HEADER */}
        <div className="border-b border-white/5 bg-transparent p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-center text-base font-semibold text-white">
              <CheckCircle2 size={18} className="text-emerald-500" />
              Pagar Fatura
            </DialogTitle>
            <p className="mt-1 text-center text-[10px] text-zinc-500">
              Referente a <strong className="text-zinc-300">{monthName}</strong>
            </p>
          </DialogHeader>
        </div>

        <div className="space-y-6 p-6">
          {/* SEÇÃO DE VALOR */}
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="relative w-full text-center">
              <Input
                type="text"
                inputMode="numeric"
                value={amountDisplay}
                onChange={handleAmountChange}
                className={cn(
                  "h-16 border-none bg-transparent p-0 text-center text-4xl font-bold tabular-nums tracking-tight text-white selection:bg-white/20 placeholder:text-zinc-800 focus-visible:ring-0"
                )}
              />
              <p className="-mt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Valor Total
              </p>
            </div>
          </div>

          {/* CONTAINER DE CAMPOS */}
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/30 backdrop-blur-md">
            {/* CONTA */}
            <div className="border-b border-white/5 p-3">
              <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Debitar de
              </Label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-2.5 z-10 text-zinc-500">
                  <Building2 size={16} />
                </div>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="h-10 border-none bg-transparent pl-10 text-left text-xs shadow-none focus:ring-0">
                    <SelectValue placeholder="Selecione a conta..." />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-zinc-900">
                    {accounts.length === 0 ? (
                      <div className="p-3 text-center text-xs text-zinc-500">Sem contas</div>
                    ) : (
                      accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          <span className="flex w-full min-w-[180px] items-center justify-between gap-4">
                            <span>{acc.name}</span>
                            <span className="font-mono text-zinc-500">
                              {formatCurrency(acc.currentBalance)}
                            </span>
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* DATA */}
            <div className="p-3">
              <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Data
              </Label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-2.5 text-zinc-500">
                  <CalendarIcon size={16} />
                </div>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 cursor-pointer border-none bg-transparent pl-10 text-xs [color-scheme:dark] focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          {/* AVISO DE SALDO */}
          {!hasBalance && selectedAccount && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="shrink-0 text-rose-500" size={16} />
              <p className="text-[10px] leading-tight text-rose-300">
                Saldo insuficiente na conta selecionada (
                {formatCurrency(currentAccount?.currentBalance ?? 0)}).
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t border-white/5 bg-zinc-900/30 p-6 pt-2">
          <Button
            onClick={handlePay}
            disabled={isLoading || !selectedAccount}
            className="h-12 w-full rounded-xl bg-white text-sm font-bold text-black shadow-lg shadow-white/5 transition-transform hover:bg-zinc-200 active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Confirmar Pagamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
