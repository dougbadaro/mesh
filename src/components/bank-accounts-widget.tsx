"use client"

import { Banknote, Landmark, TrendingUp, Wallet } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)

  const getIcon = (type: string) => {
    switch (type) {
      case "INVESTMENT":
        return <TrendingUp size={18} />
      case "CASH":
        return <Banknote size={18} />
      default:
        return <Landmark size={18} />
    }
  }

  // Opcional: Calcular total visível para mostrar no header ou resumo
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.currentBalance, 0)

  return (
    <Card className="mb-6 flex flex-col overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-xl shadow-black/10 backdrop-blur-xl">
      {/* Header Limpo */}
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-zinc-950/20 px-6 py-5">
        <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-zinc-200">
          <Wallet size={16} className="text-zinc-500" />
          Carteiras
        </CardTitle>
        {/* Mostra o total discreto no topo */}
        <span className="rounded-lg bg-white/5 px-2 py-1 font-mono text-xs font-bold text-zinc-500">
          Total: {formatCurrency(totalBalance)}
        </span>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="group relative flex items-center justify-between p-4 px-6 transition-colors hover:bg-white/5"
            >
              <div className="flex items-center gap-4">
                {/* Ícone Estilo iOS (Fundo colorido com opacidade) */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${acc.color || "#10B981"}20`, // 20% de opacidade na cor
                    color: acc.color || "#10B981",
                    boxShadow: `0 0 15px ${acc.color || "#10B981"}10`,
                  }}
                >
                  {getIcon(acc.type)}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-200 transition-colors group-hover:text-white">
                    {acc.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {acc.type === "INVESTMENT"
                      ? "Investimento"
                      : acc.type === "CASH"
                        ? "Dinheiro"
                        : "Conta Corrente"}
                  </span>
                </div>
              </div>

              <span
                className={`font-mono text-sm font-bold tracking-tight ${acc.currentBalance < 0 ? "text-rose-400" : "text-zinc-200"}`}
              >
                {formatCurrency(acc.currentBalance)}
              </span>
            </div>
          ))}

          {accounts.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-8 text-center text-zinc-500">
              <Wallet size={24} className="opacity-20" />
              <p className="text-xs">Nenhuma carteira cadastrada.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
