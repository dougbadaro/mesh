import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Receipt, Plus, CalendarClock, Wallet } from "lucide-react"
import { RecurringItem } from "@/components/recurring-item" 

// Componentes Shadcn
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CreateRecurringSheet } from "@/components/create-recurring-sheet"

export default async function RecurringPage() {
  const recurringsRaw = await prisma.recurringTransaction.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { startDate: 'asc' } 
  })

  const categories = await prisma.category.findMany()

  const recurrings = recurringsRaw.map(rec => ({
    ...rec,
    amount: rec.amount.toNumber()
  }))

  const totalMonthly = recurrings.reduce((acc, curr) => acc + curr.amount, 0)

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 pb-20 animate-in fade-in duration-700 space-y-8">
      
      {/* HEADER E NAVEGAÇÃO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild className="h-10 w-10 rounded-xl border-white/10 bg-zinc-900/50 hover:bg-white/5">
                <Link href="/">
                    <ArrowLeft size={18} className="text-zinc-400" />
                </Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    Gastos Fixos
                </h1>
                <p className="text-sm text-zinc-400">Assinaturas e contas recorrentes</p>
            </div>
        </div>

        {/* Novo Botão com o Formulário Estilo Dashboard */}
        <CreateRecurringSheet categories={categories}>
            <Button className="bg-white text-black hover:bg-zinc-200 font-semibold gap-2 rounded-xl">
                <Plus size={18} /> Novo Gasto Fixo
            </Button>
        </CreateRecurringSheet>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm">
              <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500">
                      <Wallet size={24} />
                  </div>
                  <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Custo Mensal Fixo</p>
                      <h2 className="text-3xl font-bold text-white mt-1">{formatCurrency(totalMonthly)}</h2>
                  </div>
              </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-sm">
              <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                      <CalendarClock size={24} />
                  </div>
                  <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total de Itens</p>
                      <h2 className="text-3xl font-bold text-white mt-1">{recurrings.length} <span className="text-sm font-normal text-zinc-500">assinaturas</span></h2>
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* LISTA */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider ml-1">Suas Assinaturas</h3>
        
        {recurrings.length === 0 ? (
          <Card className="border-dashed border-white/10 bg-white/[0.02]">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                   <Receipt size={32} className="text-zinc-600" />
                </div>
                <div className="space-y-1">
                   <h3 className="text-lg font-medium text-white">Nenhum gasto fixo</h3>
                   <p className="text-sm text-zinc-500 max-w-xs">Adicione contas como Aluguel ou Internet para controlar seu orçamento mensal.</p>
                </div>
              </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recurrings.map(rec => (
              <RecurringItem key={rec.id} data={rec} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}