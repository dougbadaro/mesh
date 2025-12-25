'use client'

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MonthSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Lê os params da URL ou usa a data atual
  const currentMonth = searchParams.get('month') 
    ? Number(searchParams.get('month')) 
    : new Date().getMonth()
    
  const currentYear = searchParams.get('year') 
    ? Number(searchParams.get('year')) 
    : new Date().getFullYear()

  // Data atual baseada na URL
  const date = new Date(currentYear, currentMonth, 1)

  // Função para navegar
  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(date)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }

    // Atualiza a URL sem recarregar a página inteira
    const params = new URLSearchParams(searchParams)
    params.set('month', newDate.getMonth().toString())
    params.set('year', newDate.getFullYear().toString())
    
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => handleNavigate('prev')}
        className="h-8 w-8 bg-zinc-900/50 border-white/10 hover:bg-white/5"
      >
        <ChevronLeft size={16} />
      </Button>
      
      <div className="flex items-center gap-2 min-w-[140px] justify-center bg-zinc-900/50 border border-white/10 px-4 py-1.5 rounded-md text-sm font-medium text-zinc-200">
        <Calendar size={14} className="text-muted-foreground" />
        <span className="capitalize">
          {date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => handleNavigate('next')}
        className="h-8 w-8 bg-zinc-900/50 border-white/10 hover:bg-white/5"
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}