'use client'

import { useState, useTransition } from "react"
import { CreditCard, Calendar, Receipt, ChevronRight, CheckCircle2, Loader2 } from "lucide-react"
import { createTransaction } from "@/app/actions/transactions" // Importamos a Server Action

// Componentes Shadcn UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button" // Importando botão

// --- INTERFACES ---
interface TransactionInput {
  id: string
  description: string
  amount: number | string | { toNumber: () => number }
  date: Date
  dueDate: Date
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
  dueDateRef: Date // Guardamos a data de referência para o pagamento
}

const safeNumber = (val: number | string | { toNumber: () => number }): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return Number(val);
  if (typeof val === 'object' && val !== null && 'toNumber' in val) return val.toNumber();
  return 0;
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export function CreditCardWidget({ transactions }: { transactions: TransactionInput[] }) {
  const [isPending, startTransition] = useTransition()
  const [paidInvoices, setPaidInvoices] = useState<string[]>([]) // Controle visual local

  // 1. Filtra apenas Cartão de Crédito
  const creditTrans = transactions.filter(t => t.paymentMethod === 'CREDIT_CARD');

  // 2. Agrupa por Mês de Vencimento
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
        dueDateRef: dueDate
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

  // 3. Ordena e LIMITA A 3 MESES
  const invoices = Object.values(invoicesMap)
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(0, 3);

  // --- FUNÇÃO DE PAGAR FATURA ---
  const handlePayInvoice = (inv: Invoice) => {
    if(!confirm(`Deseja realizar o pagamento da fatura de ${inv.monthLabel} no valor de ${formatCurrency(inv.total)}?`)) return;

    startTransition(async () => {
        // Cria um FormData para simular o envio do formulário
        const formData = new FormData();
        formData.append('description', `Pagamento Fatura ${inv.monthLabel}`); // Nome automático
        formData.append('amount', inv.total.toFixed(2));
        formData.append('type', 'EXPENSE'); // É uma saída de dinheiro
        formData.append('paymentMethod', 'PIX'); // Sai do saldo (Pix/Débito)
        formData.append('date', new Date().toISOString().split('T')[0]); // Data de hoje
        // formData.append('categoryId', 'financeiro_id'); // Opcional: se tiver ID da categoria

        try {
            await createTransaction(formData);
            // Adiciona ao estado local para feedback visual imediato
            setPaidInvoices(prev => [...prev, inv.id]);
        } catch (error) {
            console.error("Erro ao pagar fatura", error);
            alert("Erro ao processar pagamento.");
        }
    });
  }

  return (
    <Card className="bg-zinc-900/60 backdrop-blur-md border-white/5 shadow-xl relative overflow-hidden h-fit w-full">
      
      {/* Glow Decorativo */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none" />

      <CardHeader className="relative z-10 pb-2 pt-6 px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 ring-1 ring-inset ring-rose-500/20">
              <CreditCard size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span className="block text-xs font-normal text-muted-foreground">Visão Geral</span>
              Próximas Faturas
            </div>
          </CardTitle>
          
          {invoices.length > 0 && (
            <Badge variant="secondary" className="bg-zinc-800/80 text-zinc-400 border-white/5">
              Próximos 3 meses
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pt-4 px-6 pb-6 space-y-4">
        {invoices.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-10 text-muted-foreground space-y-3 border border-dashed border-white/5 rounded-xl bg-zinc-950/30">
             <div className="w-12 h-12 bg-zinc-900/80 rounded-full flex items-center justify-center border border-white/5">
                <Receipt size={20} className="opacity-30" />
             </div>
             <div className="text-center">
               <p className="text-sm font-medium text-zinc-400">Tudo em dia</p>
               <p className="text-[10px] text-zinc-600 mt-0.5">Nenhuma fatura futura encontrada.</p>
             </div>
           </div>
        ) : (
          invoices.map((inv) => {
            const isPaid = paidInvoices.includes(inv.id);

            return (
            <div key={inv.id} className={`group bg-zinc-950/50 border transition-all rounded-xl overflow-hidden ${isPaid ? 'border-emerald-500/30 opacity-60' : 'border-white/5 hover:border-white/10'}`}>
              
              {/* Cabeçalho da Fatura */}
              <div className="p-4 flex items-center justify-between bg-gradient-to-r from-zinc-900/50 to-transparent border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${isPaid ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800/50 text-zinc-400 group-hover:text-zinc-200'}`}>
                    {isPaid ? <CheckCircle2 size={16} /> : <Calendar size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200 capitalize tracking-wide leading-none">
                        {inv.monthLabel}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">
                        {isPaid ? 'PAGA' : 'VENCIMENTO'}
                    </p>
                  </div>
                </div>
                
                {/* Lado Direito: Valor + Botão Pagar */}
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
                            className="h-8 px-3 text-xs bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40 transition-all"
                        >
                            {isPending ? <Loader2 size={14} className="animate-spin" /> : "Pagar"}
                        </Button>
                    )}
                </div>
              </div>

              {/* Lista Interna (Oculta se pago, ou mantém visível com opacidade) */}
              {!isPaid && (
                  <>
                    <div className="divide-y divide-white/5 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {inv.items.map(item => (
                        <div key={item.id} className="p-3 pl-4 flex justify-between items-center text-sm hover:bg-white/[0.02] transition">
                            <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
                            <div className="flex flex-col">
                                <span className="text-zinc-300 font-medium text-xs md:text-sm">{item.description}</span>
                                <span className="text-[10px] text-zinc-600 font-medium">
                                {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </span>
                            </div>
                            </div>
                            <span className="text-zinc-400 tabular-nums text-xs font-mono group-hover/item:text-zinc-200 transition-colors">
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