'use client'

import { useState, useTransition, useMemo } from "react"
import { CreditCard, Calendar, Receipt, ChevronRight, CheckCircle2, Loader2 } from "lucide-react"
import { createTransaction } from "@/app/actions/transactions"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// --- INTERFACES TÉCNICAS (TYPE-SAFE) ---

/** Representa a estrutura do Decimal do Prisma sem importar a lib no client */
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
 * Resolve a incompatibilidade entre Decimal (Server) e Number (Client).
 */
const safeNumber = (val: number | string | DecimalLike | unknown): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return Number(val);
  
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

  // 1. FILTRAGEM E AGRUPAMENTO (MEMOIZED PARA PERFORMANCE)
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

  // 2. LOGICA DE LIQUIDAÇÃO (DATA ATUAL)
  const handlePayInvoice = (inv: Invoice) => {
    if(!confirm(`Confirmar liquidação da fatura: ${inv.monthLabel}?`)) return;

    startTransition(async () => {
        const formData = new FormData();
        // Nomeclatura técnica para o extrato
        formData.append('description', `SETTLEMENT: ${inv.monthLabel.toUpperCase()}`);
        formData.append('amount', inv.total.toFixed(2));
        formData.append('type', 'EXPENSE');
        formData.append('paymentMethod', 'PIX'); 
        formData.append('date', new Date().toISOString().split('T')[0]); // Data atual mantida

        try {
            await createTransaction(formData);
            setPaidInvoices(prev => [...prev, inv.id]);
        } catch (error) {
            console.error("[MESH_ERROR] Failed to settle invoice:", error);
        }
    });
  }

  return (
    <Card className="bg-zinc-900/60 backdrop-blur-md border-white/5 shadow-2xl relative overflow-hidden h-fit w-full font-sans animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Mesh Glow Background */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />

      <CardHeader className="relative z-10 pb-2 pt-6 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-3 tracking-tight">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-950 text-zinc-400 border border-white/10 shadow-inner">
              <CreditCard size={18} />
            </div>
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Node / Credit</span>
              Invoices Overview
            </div>
          </CardTitle>
          
          <Badge variant="outline" className="text-[9px] font-mono border-white/5 bg-zinc-900/50 text-zinc-500 uppercase tracking-tighter">
            Q1/Q2 Queue
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pt-4 px-6 pb-6 space-y-4">
        {invoices.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed border-white/5 rounded-2xl bg-zinc-950/20">
             <Receipt size={24} className="opacity-10 mb-2" />
             <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Buffer Empty</p>
           </div>
        ) : (
          invoices.map((inv) => {
            const isPaid = paidInvoices.includes(inv.id);

            return (
            <div key={inv.id} className={`group bg-zinc-950/40 border transition-all rounded-xl overflow-hidden ${isPaid ? 'border-emerald-500/20 opacity-40' : 'border-white/5 hover:border-white/10 shadow-lg'}`}>
              
              <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${isPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-900 text-zinc-600 group-hover:text-zinc-400'}`}>
                    {isPaid ? <CheckCircle2 size={16} /> : <Calendar size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200 capitalize">
                        {inv.monthLabel}
                    </p>
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                        {isPaid ? 'Status: Resolved' : 'Status: Pending'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`block font-mono font-bold tabular-nums text-base ${isPaid ? 'text-emerald-500 line-through' : 'text-zinc-100'}`}>
                        {formatCurrency(inv.total)}
                      </span>
                    </div>

                    {!isPaid && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={isPending}
                            onClick={() => handlePayInvoice(inv)}
                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest bg-zinc-100 text-black hover:bg-zinc-300 border-none transition-all active:scale-95 rounded-lg shadow-sm"
                        >
                            {isPending ? <Loader2 size={12} className="animate-spin" /> : "Settle"}
                        </Button>
                    )}
                </div>
              </div>

              {!isPaid && (
                <div className="divide-y divide-white/5 max-h-32 overflow-y-auto custom-scrollbar bg-black/10">
                    {inv.items.map(item => (
                    <div key={item.id} className="p-3 pl-5 flex justify-between items-center text-[11px] hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-zinc-800" />
                            <span className="text-zinc-500 font-medium truncate max-w-[140px]">{item.description}</span>
                        </div>
                        <span className="text-zinc-600 font-mono tracking-tighter">
                            {formatCurrency(item.amount)}
                        </span>
                    </div>
                    ))}
                </div>
              )}
            </div>
          )})
        )}
      </CardContent>
    </Card>
  )
}