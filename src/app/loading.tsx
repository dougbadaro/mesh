import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  // Alturas fixas para simular um gráfico "bonito" e evitar erro de Math.random()
  const chartHeights = [35, 70, 45, 90, 55, 30, 65, 80, 40, 60, 75, 50];

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-in fade-in duration-500">
      
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-zinc-800/50" />
            <Skeleton className="h-4 w-64 bg-zinc-800/50" />
        </div>
        <Skeleton className="h-10 w-40 rounded-full bg-zinc-800/50" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* COLUNA ESQUERDA (Principal) */}
        <div className="xl:col-span-8 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Saldo Card */}
                <Card className="bg-zinc-900/40 border-white/5 h-[200px] rounded-3xl overflow-hidden shadow-none">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-20 bg-zinc-800/50" />
                            <Skeleton className="h-8 w-8 rounded-xl bg-zinc-800/50" />
                        </div>
                        <Skeleton className="h-10 w-40 bg-zinc-800/50" />
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Skeleton className="h-12 w-full rounded-xl bg-zinc-800/30" />
                            <Skeleton className="h-12 w-full rounded-xl bg-zinc-800/30" />
                        </div>
                    </CardContent>
                </Card>

                {/* Fatura Card */}
                <Card className="bg-zinc-900/40 border-white/5 h-[200px] rounded-3xl overflow-hidden shadow-none">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-20 bg-zinc-800/50" />
                            <Skeleton className="h-8 w-24 rounded-xl bg-zinc-800/50" />
                        </div>
                        <Skeleton className="h-10 w-40 bg-zinc-800/50" />
                        <Skeleton className="h-8 w-32 rounded-xl bg-zinc-800/30 mt-4" />
                    </CardContent>
                </Card>
            </div>

            {/* Chart Skeleton */}
            <Card className="bg-zinc-900/40 border-white/5 h-[350px] rounded-3xl overflow-hidden shadow-none">
                 <CardHeader className="border-b border-white/5 p-6">
                    <Skeleton className="h-4 w-32 bg-zinc-800/50" />
                 </CardHeader>
                 <CardContent className="p-6 flex items-end gap-2 h-[280px]">
                    {/* Barras falsas do gráfico (USANDO VALORES FIXOS) */}
                    {chartHeights.map((height, i) => (
                        <Skeleton 
                            key={i} 
                            className="flex-1 bg-zinc-800/30 rounded-t-sm" 
                            style={{ height: `${height}%` }} 
                        />
                    ))}
                 </CardContent>
            </Card>

            {/* Transactions List Skeleton */}
            <div className="space-y-3">
                 <Skeleton className="h-4 w-40 bg-zinc-800/50 ml-2" />
                 <Card className="bg-zinc-900/40 border-white/5 min-h-[300px] rounded-3xl overflow-hidden shadow-none">
                    <div className="divide-y divide-white/5">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-xl bg-zinc-800/50" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32 bg-zinc-800/50" />
                                        <Skeleton className="h-3 w-20 bg-zinc-800/30" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-24 bg-zinc-800/50" />
                            </div>
                        ))}
                    </div>
                 </Card>
            </div>
        </div>
        
        {/* COLUNA DIREITA (Widgets) */}
        <div className="xl:col-span-4 space-y-6">
            
            {/* Bank Accounts Widget */}
            <Card className="bg-zinc-900/40 border-white/5 rounded-3xl p-5 space-y-4 shadow-none">
                 <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24 bg-zinc-800/50" />
                    <Skeleton className="h-8 w-8 rounded-full bg-zinc-800/50" />
                 </div>
                 {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full bg-zinc-800/50" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-3 w-full bg-zinc-800/50" />
                            <Skeleton className="h-3 w-1/2 bg-zinc-800/30" />
                        </div>
                    </div>
                 ))}
            </Card>

            {/* Tabs/Form Widget */}
            <Card className="bg-zinc-900/40 border-white/5 rounded-3xl h-[400px] p-2 shadow-none">
                 <Skeleton className="h-10 w-full rounded-xl bg-zinc-800/50 mb-4" />
                 <div className="space-y-4 px-4">
                     <Skeleton className="h-20 w-full rounded-xl bg-zinc-800/30" />
                     <Skeleton className="h-10 w-full rounded-xl bg-zinc-800/30" />
                     <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-10 w-full rounded-xl bg-zinc-800/30" />
                        <Skeleton className="h-10 w-full rounded-xl bg-zinc-800/30" />
                     </div>
                 </div>
            </Card>

            {/* Credit Card Widget */}
            <Card className="bg-zinc-900/40 border-white/5 rounded-3xl h-[250px] p-5 shadow-none">
                 <Skeleton className="h-4 w-32 bg-zinc-800/50 mb-4" />
                 <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                            <Skeleton className="h-3 w-32 bg-zinc-800/30" />
                            <Skeleton className="h-3 w-16 bg-zinc-800/30" />
                        </div>
                    ))}
                 </div>
            </Card>
        </div>
      </div>
    </div>
  )
}