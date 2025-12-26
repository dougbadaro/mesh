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
      case "INVESTMENT": return <TrendingUp size={16} />;
      case "CASH": return <Banknote size={16} />;
      default: return <Landmark size={16} />;
    }
  }

  return (
    <Card className="bg-zinc-900/60 backdrop-blur border-white/5 shadow-sm mb-6">
      <CardHeader className="pb-3 border-b border-white/5">
        <CardTitle className="text-sm font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
          <Wallet size={16} className="text-emerald-500" />
          Minhas Carteiras
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
              {/* Barra de cor lateral */}
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: acc.color || "#10B981" }} />

              <div className="flex items-center gap-3 pl-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 transition-colors">
                   {getIcon(acc.type)}
                </div>
                <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                  {acc.name}
                </span>
              </div>
              
              <span className={`text-sm font-bold tabular-nums ${acc.currentBalance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatCurrency(acc.currentBalance)}
              </span>
            </div>
          ))}

          {accounts.length === 0 && (
            <div className="p-6 text-center text-xs text-zinc-500">
              Nenhuma carteira cadastrada.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}