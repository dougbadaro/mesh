import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Receipt, Plus, CalendarClock, Wallet } from "lucide-react"
import { RecurringItem } from "@/components/recurring-item" 

// Componentes Shadcn
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CreateRecurringSheet } from "@/components/create-recurring-sheet"
import { getAuthenticatedUser } from "@/lib/auth-check"

export default async function RecurringPage() {
  const user = await getAuthenticatedUser()

  // 1. Busca de Recorrências
  const recurringsRaw = await prisma.recurringTransaction.findMany({
    where: { userId: user.id, active: true },
    include: { 
        category: true,
        bankAccount: { select: { name: true, color: true } } 
    },
    orderBy: { startDate: 'asc' } 
  })

  // 2. Busca de Categorias
  const rawCategories = await prisma.category.findMany({
    where: { OR: [{ userId: user.id }, { userId: null }] }
  })

  // 3. Busca de Carteiras
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, color: true }
  })

  // --- SANITIZAÇÃO DE DADOS ---
  const categories = rawCategories.map(cat => ({
    ...cat,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null
  }))

  const recurrings = recurringsRaw.map(rec => ({
    ...rec,
    amount: Number(rec.amount),
    category: rec.category ? {
      ...rec.category,
      budgetLimit: rec.category.budgetLimit ? Number(rec.category.budgetLimit) : null
    } : null
  }))

  const totalMonthly = recurrings.reduce((acc, curr) => acc + curr.amount, 0)

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24 animate-in fade-in duration-700 space-y-6">
      
      {/* HEADER E NAVEGAÇÃO - Compacto */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-xl hover:bg-white/5 text-zinc-400">
                <Link href="/">
                    <ArrowLeft size={18} />
                </Link>
            </Button>
            <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                    Gastos Fixos
                </h1>
                <p className="text-xs text-zinc-400">Assinaturas e contas recorrentes</p>
            </div>
        </div>

        <CreateRecurringSheet categories={categories} accounts={bankAccounts}>
            <Button className="bg-white text-black hover:bg-zinc-200 font-bold h-9 text-xs px-4 gap-2 rounded-xl shadow-lg shadow-white/5 transition-transform active:scale-95">
                <Plus size={14} /> Novo Gasto Fixo
            </Button>
        </CreateRecurringSheet>
      </div>

      {/* KPI - Glassmorphism & Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
              <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/10 text-rose-500">
                      <Wallet size={18} />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Custo Mensal</p>
                      <h2 className="text-2xl font-bold text-white mt-0.5 tracking-tight">{formatCurrency(totalMonthly)}</h2>
                  </div>
              </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
              <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/10 text-blue-500">
                      <CalendarClock size={18} />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total de Itens</p>
                      <h2 className="text-2xl font-bold text-white mt-0.5 tracking-tight">{recurrings.length} <span className="text-xs font-medium text-zinc-500">assinaturas</span></h2>
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* LISTA */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Suas Assinaturas</h3>
        
        {recurrings.length === 0 ? (
          <Card className="border-dashed border-white/10 bg-white/[0.01] rounded-3xl">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-12 h-12 bg-zinc-900/50 rounded-2xl flex items-center justify-center border border-white/5">
                   <Receipt size={24} className="text-zinc-600" />
                </div>
                <div className="space-y-1">
                   <h3 className="text-sm font-medium text-white">Nenhum gasto fixo</h3>
                   <p className="text-xs text-zinc-500 max-w-[200px] mx-auto">Adicione contas como Aluguel ou Internet para previsão automática.</p>
                </div>
              </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {recurrings.map(rec => (
              <RecurringItem 
                key={rec.id} 
                data={rec} 
                accounts={bankAccounts}
                categories={categories} // Passando categorias para permitir edição completa
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}