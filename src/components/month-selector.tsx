'use client'

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MonthSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentMonth = searchParams.get('month') 
    ? Number(searchParams.get('month')) 
    : new Date().getMonth()
    
  const currentYear = searchParams.get('year') 
    ? Number(searchParams.get('year')) 
    : new Date().getFullYear()

  const date = new Date(currentYear, currentMonth, 1)

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(date)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }

    const params = new URLSearchParams(searchParams)
    params.set('month', newDate.getMonth().toString())
    params.set('year', newDate.getFullYear().toString())
    
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-full border border-white/5 backdrop-blur-md shadow-sm">
      
      {/* Botão Anterior */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleNavigate('prev')}
        className="h-7 w-7 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <ChevronLeft size={14} />
      </Button>
      
      {/* Texto Central (Compacto) */}
      <div className="px-2 min-w-[110px] text-center">
        <span className="text-xs font-semibold text-zinc-200 capitalize select-none tracking-wide">
          {date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Botão Próximo */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => handleNavigate('next')}
        className="h-7 w-7 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <ChevronRight size={14} />
      </Button>
      
    </div>
  )
}