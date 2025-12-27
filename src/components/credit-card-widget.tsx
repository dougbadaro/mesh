'use client'

import { useState, useMemo } from "react"
import { CreditCard, Calendar, CheckCircle2, ChevronDown } from "lucide-react"
import { PayInvoiceDialog } from "@/components/pay-invoice-dialog"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// --- INTERFACES ---

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

// Interface para as contas (necessário para o modal)
interface Account {
    id: string;
    name: string;
    currentBalance: number;
}

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

export function CreditCardWidget({ 
    transactions, 
    accounts = [] // Recebe as contas da Dashboard
}: { 
    transactions: TransactionInput[], 
    accounts?: Account[] 
}) {
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)

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

  const toggleExpand = (id: string) => {
      setExpandedInvoice(prev => prev === id ? null : id);
  }

  if (invoices.length === 0) {
      return (
        <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden shadow-sm w-full h-fit">
            <CardContent className="p-6 flex flex-col items-center justify-center gap-2 text-zinc-500">
                <CheckCircle2 size={24} className="opacity-20" />
                <p className="text-xs">Sem faturas pendentes.</p>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden shadow-sm flex flex-col w-full h-fit transition-all">
      
      <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-white/5 bg-zinc-950/20">
        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
           <CreditCard size={14} />
           Faturas Futuras
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
          <div className="divide-y divide-white/5">
          {invoices.map((inv) => {
            const isExpanded = expandedInvoice === inv.id;

            return (
            <div 
                key={inv.id} 
                className="group transition-all duration-200 bg-transparent hover:bg-white/[0.02]"
            >
              <div 
                className="p-4 px-6 flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(inv.id)}
              >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-zinc-800 text-rose-500">
                      <Calendar size={14} />
                   </div>
                   
                   <div>
                      <p className="text-xs font-bold text-white capitalize leading-none">
                         {inv.monthLabel}
                      </p>
                      <p className="text-[9px] text-zinc-500 font-medium mt-1 uppercase tracking-wide">
                         {inv.items.length} itens
                      </p>
                   </div>
                </div>

                <div className="flex items-center gap-3">
                    <p className="text-xs font-bold font-mono tracking-tight tabular-nums text-zinc-200">
                        {formatCurrency(inv.total)}
                    </p>
                    
                    <ChevronDown 
                        size={14} 
                        className={cn("text-zinc-600 transition-transform duration-200", isExpanded && "rotate-180")} 
                    />
                </div>
              </div>

              {/* Detalhes Expansíveis */}
              {isExpanded && (
                <div className="bg-black/20 border-t border-white/5 animate-in slide-in-from-top-1 duration-200">
                  <div className="px-6 py-3 space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                      {inv.items.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors">
                             <span className="truncate max-w-[180px]">{item.description}</span>
                             <span className="font-mono text-zinc-300">{formatCurrency(item.amount)}</span>
                          </div>
                      ))}
                  </div>

                  <div className="p-3 px-6 bg-zinc-950/30 border-t border-white/5 flex justify-end">
                      <PayInvoiceDialog 
                        key={inv.monthLabel} // Reseta o modal ao mudar a fatura
                        invoiceTotal={inv.total}
                        monthName={inv.monthLabel}
                        accounts={accounts} 
                      />
                  </div>
                </div>
              )}
            </div>
          )})}
          </div>
      </CardContent>
    </Card>
  )
}