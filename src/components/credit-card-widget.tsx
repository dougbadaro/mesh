'use client'

import { useState, useTransition, useMemo } from "react"
import { CreditCard, Calendar, Receipt, ChevronRight, CheckCircle2, Loader2 } from "lucide-react"
import { createTransaction } from "@/app/actions/transactions"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// --- INTERFACES (Blindagem técnica sem 'any') ---

/** * Representa a estrutura de um objeto Decimal do Prisma.
 * Usamos uma interface estrutural para evitar a importação da lib pesada no cliente.
 */
interface DecimalLike {
  toNumber: () => number;
}

interface TransactionInput {
  id: string
  description: string
  amount: number | string | DecimalLike 
  date: Date | string
  dueDate: Date | string
  paymentMethod: string
}

interface InvoiceItem {
  id: string
  description: string
  amount: number
  date: string
}

interface Invoice {
  id: string 
  monthLabel: string
  total: number
  items: InvoiceItem[]
  sortKey: number 
}

/** * Função utilitária para conversão segura de valores monetários.
 * Resolve a incompatibilidade entre o Decimal do servidor e o Number do cliente.
 */
const safeNumber = (val: number | string | DecimalLike | unknown): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return Number(val);
  
  // Verificação de tipo segura para garantir que 'val' é um objeto DecimalLike
  if (
    val && 
    typeof val === 'object' && 
    'toNumber' in val && 
    typeof (val as DecimalLike).toNumber === 'function'
  ) {
    return (val as DecimalLike).toNumber();
  }
  
  return 0;
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export function CreditCardWidget({ transactions }: { transactions: TransactionInput[] }) {
  const [isPending, startTransition] = useTransition()
  const [paidInvoices, setPaidInvoices] = useState<string[]>([])

  // 1. Agrupamento de dados (Memoizado para performance no deploy)
  const invoices = useMemo(() => {
    const creditTrans = transactions.filter(t => t.paymentMethod === 'CREDIT_CARD');

    const invoicesMap = creditTrans.reduce<Record<string, Invoice>>((acc, t) => {
      const dueDate = new Date(t.dueDate);
      const year = dueDate.getFullYear();
      const month = dueDate.getMonth(); 
      const key = `${year}-${month}`; 

      if (!acc[key]) {
        const label = dueDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        acc[key] = { 
          id: key,
          monthLabel: label, 
          total: 0, 
          items: [],
          sortKey: year * 100 + month,
        };
      }

      const amountVal = safeNumber(t.amount);
      acc[key].total += amountVal;
      acc[key].items.push({
        id: t.id,
        description: t.description,
        amount: amountVal,
        date: new Date(t.date).toISOString()
      });

      return acc;
    }, {});

    return Object.values(invoicesMap)
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(0, 3);
  }, [transactions]);

  // 2. Lógica de Pagamento (Data Atual)
  const handlePayInvoice = (inv: Invoice) => {
    if(!confirm(`Deseja realizar o pagamento da fatura de ${inv.monthLabel} no valor de ${formatCurrency(inv.total)}?`)) return;

    startTransition(async () => {
        const formData = new FormData();
        formData.append('description', `Pagamento Fatura ${inv.monthLabel}`);
        formData.append('amount', inv.total.toFixed(2));
        formData.append('type', 'EXPENSE');
        formData.append('paymentMethod', 'PIX'); 
        formData.append('date', new Date().toISOString().split('T')[0]);

        try {
            await createTransaction(formData);
            setPaidInvoices(prev => [...prev, inv.id]);
        } catch (error) {
            console.error("Erro ao processar pagamento:", error);
        }
    });
  }

  return (
    <Card className="bg-zinc-900/60 backdrop-blur-md border-white/5 shadow-xl relative overflow-hidden h-fit w-full">
      
      {/* Decoração Visual */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none" />

      <CardHeader className="relative z-10 pb-2 pt-6 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 ring-1 ring-inset ring-rose-500/20 shadow-lg">
              <CreditCard size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span className="block text-xs font-normal text-muted-foreground">Visão Geral</span>
              Próximas Faturas
            </div>
          </CardTitle>
          
          {invoices.length > 0 && (
            <Badge variant="secondary" className="bg-zinc-800/80 text-zinc-400 border-white/5 font-mono text-[10px]">
              PRÓXIMOS 3 MESES
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pt-4 px-6 pb-6 space-y-4">
        {invoices.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-10 text-muted-foreground space-y-3 border border-dashed border-white/5 rounded-2xl bg-zinc-950/30">
             <div className="w-12 h-12 bg-zinc-900/80 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                <Receipt size={20} className="opacity-30" />
             </div>
             <div className="text-center">
               <p className="text-sm font-medium text-zinc-400">Tudo em dia</p>
               <p className="text-[10px] text-zinc-600 mt-0.5 uppercase tracking-widest font-bold">Sem faturas pendentes</p>
             </div>
           </div>
        ) : (
          invoices.map((inv) => {
            const isPaid = paidInvoices.includes(inv.id);

            return (
            <div key={inv.id} className={`group bg-zinc-950/50 border transition-all rounded-xl overflow-hidden ${isPaid ? 'border-emerald-500/30 opacity-60' : 'border-white/5 hover:border-white/10 shadow-md'}`}>
              
              <div className="p-4 flex items-center justify-between bg-gradient-to-r from-zinc-900/50 to-transparent border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${isPaid ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800/50 text-zinc-400 group-hover:text-zinc-200'}`}>
                    {isPaid ? <CheckCircle2 size={16} /> : <Calendar size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-100 capitalize tracking-wide leading-none">
                        {inv.monthLabel}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">
                        {isPaid ? 'LIQUIDADA' : 'VENCIMENTO'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`block font-bold tabular-nums text-lg leading-none drop-shadow-sm ${isPaid ? 'text-emerald-400 line-through decoration-emerald-500/50' : 'text-rose-400 shadow-rose-500/10'}`}>
                        {formatCurrency(inv.total)}
                      </span>
                    </div>

                    {!isPaid && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={isPending}
                            onClick={() => handlePayInvoice(inv)}
                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 transition-all active:scale-95"
                        >
                            {isPending ? <Loader2 size={12} className="animate-spin" /> : "PAGAR"}
                        </Button>
                    )}
                </div>
              </div>

              {!isPaid && (
                <>
                  <div className="divide-y divide-white/5 max-h-48 overflow-y-auto custom-scrollbar">
                      {inv.items.map(item => (
                      <div key={item.id} className="p-3 pl-4 flex justify-between items-center text-sm hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50 shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                            <div className="flex flex-col">
                                <span className="text-zinc-300 font-medium text-xs md:text-sm">{item.description}</span>
                                <span className="text-[10px] text-zinc-600 font-mono font-bold uppercase tracking-tighter">
                                {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </span>
                            </div>
                          </div>
                          <span className="text-zinc-400 tabular-nums text-xs font-mono tracking-tighter">
                            {formatCurrency(item.amount)}
                          </span>
                      </div>
                      ))}
                  </div>
                  {inv.items.length > 3 && (
                      <div className="bg-zinc-900/30 p-1.5 flex justify-center border-t border-white/5">
                          <ChevronRight size={12} className="text-zinc-600 rotate-90" />
                      </div>
                  )}
                </>
              )}
            </div>
          )})
        )}
      </CardContent>
    </Card>
  )
}