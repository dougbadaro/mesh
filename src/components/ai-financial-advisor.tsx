"use client"

import { 
  Bot, 
  Crown, 
  Minus,
  Target, 
  TrendingDown, 
  TrendingUp,
  Zap
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { AnalysisResult } from "@/app/actions/analysis"

interface AIFinancialAdvisorProps {
  analysis: AnalysisResult
}

export function AIFinancialAdvisor({ analysis }: AIFinancialAdvisorProps) {
  if (analysis.error) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-center text-rose-400">
        <p>{analysis.error}</p>
      </div>
    )
  }

  const sentimentStyles = {
    POSITIVE: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: TrendingUp },
    NEUTRAL: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: Minus },
    NEGATIVE: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: TrendingDown },
  }[analysis.sentiment] || { color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20", icon: Bot }

  const SentimentIcon = sentimentStyles.icon

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={`rounded-2xl border p-6 ${sentimentStyles.border} ${sentimentStyles.bg}`}>
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/20 ${sentimentStyles.color}`}>
            <SentimentIcon size={24} />
          </div>
          <div className="space-y-1">
            <h2 className={`text-lg font-bold tracking-tight ${sentimentStyles.color}`}>Veredito do Mês</h2>
            <p className="text-base font-medium text-zinc-100 leading-relaxed">
              &quot;{analysis.summary}&quot;
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/10 bg-zinc-900/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-violet-400">
              <Zap size={18} />
              Pontos de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.insights.map((insight, idx) => (
              <div key={idx} className="flex gap-3 text-sm text-zinc-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                <p className="leading-snug">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-900/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2 text-amber-400">
                <Target size={18} />
                Controle de Metas
              </div>
              <Badge variant="outline" className={`
                ${analysis.budget_analysis.status === 'CRITICAL' ? 'border-rose-500 text-rose-500 bg-rose-500/10' : ''}
                ${analysis.budget_analysis.status === 'WARNING' ? 'border-amber-500 text-amber-500 bg-amber-500/10' : ''}
                ${analysis.budget_analysis.status === 'OK' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : ''}
              `}>
                {analysis.budget_analysis.status === 'OK' ? 'Meta Batida' : analysis.budget_analysis.status === 'WARNING' ? 'Alerta' : 'Desvio Crítico'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-black/20 p-3 flex justify-between items-center">
               <span className="text-xs text-zinc-400">Realizado / Teto</span>
               <span className="text-sm font-bold text-zinc-100 font-mono">
                  {analysis.budget_analysis.ceiling_vs_real}
               </span>
            </div>
            
            <div className="flex gap-3 text-sm text-zinc-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <p className="leading-snug">{analysis.budget_analysis.comment}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-zinc-900/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-emerald-400">
            <Crown size={18} />
            Missões para o Próximo Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-1">
            {analysis.actionable_steps.map((step, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 px-4 transition-colors hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-500">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-zinc-200">{step}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center opacity-50 text-[10px]">
        Mentoria Financeira com IA
      </div>
    </div>
  )
}