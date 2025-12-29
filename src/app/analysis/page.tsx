import { Suspense } from "react"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"

import { AIFinancialAdvisor } from "@/components/ai-financial-advisor"
import { MonthSelector } from "@/components/month-selector"
import { Button } from "@/components/ui/button"

import { getAuthenticatedUser } from "@/lib/auth-check"
import { getMonthlyAnalysis } from "@/app/actions/analysis"

interface AnalysisPageProps {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function AnalysisPage(props: AnalysisPageProps) {
  await getAuthenticatedUser() // Proteção de rota

  const searchParams = await props.searchParams
  const now = new Date()
  const selectedMonth = searchParams.month ? Number(searchParams.month) : now.getMonth()
  const selectedYear = searchParams.year ? Number(searchParams.year) : now.getFullYear()

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-24 duration-700 animate-in fade-in md:p-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-9 w-9 rounded-xl text-zinc-400 hover:bg-white/5"
          >
            <Link href="/">
              <ArrowLeft size={18} />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Análise Inteligente</h1>
            <p className="text-xs text-zinc-400">Insights detalhados via Inteligência Artificial.</p>
          </div>
        </div>
        <MonthSelector />
      </div>

      {/* COMPONENTE IA COM SUSPENSE */}
      <div className="rounded-3xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl">
        <Suspense fallback={<AnalysisSkeleton />}>
          <AnalysisWrapper month={selectedMonth} year={selectedYear} />
        </Suspense>
      </div>
    </div>
  )
}

// Wrapper para fazer o fetch de dados e suspender a UI
async function AnalysisWrapper({ month, year }: { month: number; year: number }) {
  const analysis = await getMonthlyAnalysis(month, year)

  return <AIFinancialAdvisor analysis={analysis} />
}

// Skeleton de carregamento (Efeito de pulso)
function AnalysisSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20"></div>
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
           <Sparkles size={32} />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">Analisando Finanças...</h3>
        <p className="text-sm text-zinc-400">A IA está processando suas transações do mês.</p>
      </div>
      <Loader2 className="animate-spin text-zinc-600" size={24} />
    </div>
  )
}