'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, TrendingUp, Landmark, Banknote } from "lucide-react"

interface AccountData {
  id: string
  name: string
  type: string
  color: string | null
  currentBalance: number
}

interface BankAccountsWidgetProps {
  accounts: AccountData[]
}

export function BankAccountsWidget({ accounts }: BankAccountsWidgetProps) {
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getIcon = (type: string) => {
    switch (type) {
      case "INVESTMENT": return <TrendingUp size={18} />;
      case "CASH": return <Banknote size={18} />;
      default: return <Landmark size={18} />;
    }
  }

  // Opcional: Calcular total visível para mostrar no header ou resumo
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.currentBalance, 0);

  return (
    <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden shadow-xl shadow-black/10 flex flex-col mb-6">
      
      {/* Header Limpo */}
      <CardHeader className="flex flex-row items-center justify-between py-5 px-6 border-b border-white/5 bg-zinc-950/20">
        <CardTitle className="text-sm font-medium text-zinc-200 uppercase tracking-wider flex items-center gap-2">
          <Wallet size={16} className="text-zinc-500" />
          Carteiras
        </CardTitle>
        {/* Mostra o total discreto no topo */}
        <span className="text-xs font-mono font-bold text-zinc-500 bg-white/5 px-2 py-1 rounded-lg">
           Total: {formatCurrency(totalBalance)}
        </span>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {accounts.map((acc) => (
            <div 
                key={acc.id} 
                className="flex items-center justify-between p-4 px-6 hover:bg-white/5 transition-colors relative group"
            >
              <div className="flex items-center gap-4">
                
                {/* Ícone Estilo iOS (Fundo colorido com opacidade) */}
                <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
                    style={{ 
                        backgroundColor: `${acc.color || '#10B981'}20`, // 20% de opacidade na cor
                        color: acc.color || '#10B981',
                        boxShadow: `0 0 15px ${acc.color || '#10B981'}10`
                    }}
                >
                    {getIcon(acc.type)}
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                      {acc.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
                        {acc.type === 'INVESTMENT' ? 'Investimento' : acc.type === 'CASH' ? 'Dinheiro' : 'Conta Corrente'}
                    </span>
                </div>
              </div>
              
              <span className={`text-sm font-bold font-mono tracking-tight ${acc.currentBalance < 0 ? 'text-rose-400' : 'text-zinc-200'}`}>
                {formatCurrency(acc.currentBalance)}
              </span>
            </div>
          ))}

          {accounts.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center gap-2 text-zinc-500">
              <Wallet size={24} className="opacity-20" />
              <p className="text-xs">Nenhuma carteira cadastrada.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}