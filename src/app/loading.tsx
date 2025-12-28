import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  // Alturas fixas para simular um gráfico "bonito" e evitar erro de Math.random()
  const chartHeights = [35, 70, 45, 90, 55, 30, 65, 80, 40, 60, 75, 50]

  return (
    <div className="space-y-6 pb-20 duration-500 animate-in fade-in md:pb-0">
      {/* Header Skeleton */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-zinc-800/50" />
          <Skeleton className="h-4 w-64 bg-zinc-800/50" />
        </div>
        <Skeleton className="h-10 w-40 rounded-full bg-zinc-800/50" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* COLUNA ESQUERDA (Principal) */}
        <div className="space-y-6 xl:col-span-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Saldo Card */}
            <Card className="h-[200px] overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-none">
              <CardContent className="space-y-4 p-6">
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
            <Card className="h-[200px] overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-none">
              <CardContent className="space-y-4 p-6">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 bg-zinc-800/50" />
                  <Skeleton className="h-8 w-24 rounded-xl bg-zinc-800/50" />
                </div>
                <Skeleton className="h-10 w-40 bg-zinc-800/50" />
                <Skeleton className="mt-4 h-8 w-32 rounded-xl bg-zinc-800/30" />
              </CardContent>
            </Card>
          </div>

          {/* Chart Skeleton */}
          <Card className="h-[350px] overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-none">
            <CardHeader className="border-b border-white/5 p-6">
              <Skeleton className="h-4 w-32 bg-zinc-800/50" />
            </CardHeader>
            <CardContent className="flex h-[280px] items-end gap-2 p-6">
              {/* Barras falsas do gráfico (USANDO VALORES FIXOS) */}
              {chartHeights.map((height, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-t-sm bg-zinc-800/30"
                  style={{ height: `${height}%` }}
                />
              ))}
            </CardContent>
          </Card>

          {/* Transactions List Skeleton */}
          <div className="space-y-3">
            <Skeleton className="ml-2 h-4 w-40 bg-zinc-800/50" />
            <Card className="min-h-[300px] overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-none">
              <div className="divide-y divide-white/5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
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
        <div className="space-y-6 xl:col-span-4">
          {/* Bank Accounts Widget */}
          <Card className="space-y-4 rounded-3xl border-white/5 bg-zinc-900/40 p-5 shadow-none">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 bg-zinc-800/50" />
              <Skeleton className="h-8 w-8 rounded-full bg-zinc-800/50" />
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full bg-zinc-800/50" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-full bg-zinc-800/50" />
                  <Skeleton className="h-3 w-1/2 bg-zinc-800/30" />
                </div>
              </div>
            ))}
          </Card>

          {/* Tabs/Form Widget */}
          <Card className="h-[400px] rounded-3xl border-white/5 bg-zinc-900/40 p-2 shadow-none">
            <Skeleton className="mb-4 h-10 w-full rounded-xl bg-zinc-800/50" />
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
          <Card className="h-[250px] rounded-3xl border-white/5 bg-zinc-900/40 p-5 shadow-none">
            <Skeleton className="mb-4 h-4 w-32 bg-zinc-800/50" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
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
