import { prisma } from "@/lib/prisma"
import { ArrowLeft, Receipt, PlusCircle } from "lucide-react"
import Link from "next/link"
import { RecurringItem } from "@/app/components/recurring-item" 

// Componentes Shadcn
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default async function RecurringPage() {
  // 1. Busca os dados do banco
  // O campo 'startDate' vem automaticamente aqui
  const recurringsRaw = await prisma.recurringTransaction.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { startDate: 'asc' } // Ordenado por data base (dia do vencimento)
  })

  // 2. Serialização de Dados
  // Transformamos o Decimal em Number para o React aceitar
  const recurrings = recurringsRaw.map(rec => ({
    ...rec,
    amount: rec.amount.toNumber()
  }))

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 pb-20 animate-in fade-in duration-700">
      
      {/* Header com Navegação */}
      <div className="flex items-center gap-6 mb-10">
        <Button variant="outline" size="icon" asChild className="h-12 w-12 rounded-xl border-white/10 bg-background/50 backdrop-blur hover:bg-white/5">
           <Link href="/">
             <ArrowLeft size={20} className="text-muted-foreground" />
           </Link>
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
             Assinaturas
             <span className="text-sm font-normal text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/5">
                {recurrings.length} ativas
             </span>
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie suas despesas fixas e altere datas de vencimento.</p>
        </div>
      </div>

      {/* Lista de Assinaturas */}
      <div className="space-y-6">
        {recurrings.length === 0 ? (
          <Card className="border-dashed border-white/10 bg-background/20">
             <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-white/5">
                   <Receipt size={32} className="text-zinc-600" />
                </div>
                <div className="space-y-1">
                   <h3 className="text-xl font-semibold text-foreground">Nenhuma assinatura</h3>
                   <p className="text-muted-foreground max-w-sm">Você ainda não cadastrou nenhuma despesa recorrente.</p>
                </div>
                
                <Button asChild className="mt-4 gap-2">
                   <Link href="/">
                      <PlusCircle size={18} />
                      Novo Lançamento na Dashboard
                   </Link>
                </Button>
             </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {recurrings.map(rec => (
              // O objeto 'rec' já contém 'startDate', que o RecurringItem usará
              <RecurringItem key={rec.id} data={rec} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}