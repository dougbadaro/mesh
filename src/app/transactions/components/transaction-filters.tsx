"use client"

import { Search, Filter, X, CalendarClock } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch" // Certifique-se de ter este componente
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TransactionFilters() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const defaultSearch = searchParams.get('query')?.toString()
  const defaultType = searchParams.get('type')?.toString()
  // Verifica se o filtro de futuro está ativo na URL
  const showFuture = searchParams.get('future') === 'true'

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1')
    if (term) params.set('query', term)
    else params.delete('query')
    replace(`${pathname}?${params.toString()}`)
  }, 300)

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1')
    if (value && value !== 'ALL') params.set('type', value)
    else params.delete('type')
    replace(`${pathname}?${params.toString()}`)
  }

  // Novo Handler para o Toggle de Futuro
  const handleFutureToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1') // Reseta paginação ao mudar filtro
    if (checked) params.set('future', 'true')
    else params.delete('future')
    replace(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    replace(pathname)
  }

  return (
    <div className="flex flex-col gap-4 mb-6">
      
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Campo de Busca */}
        <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <Input
            placeholder="Buscar por descrição..."
            className="pl-9 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500/20"
            defaultValue={defaultSearch}
            onChange={(e) => handleSearch(e.target.value)}
            />
        </div>

        {/* Filtro de Tipo */}
        <div className="w-full sm:w-[180px]">
            <Select defaultValue={defaultType || "ALL"} onValueChange={handleTypeChange}>
            <SelectTrigger className="bg-zinc-900/50 border-white/10 text-zinc-200">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-zinc-500" />
                    <SelectValue placeholder="Tipo" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="INCOME">Receitas</SelectItem>
                <SelectItem value="EXPENSE">Despesas</SelectItem>
            </SelectContent>
            </Select>
        </div>
      </div>

      {/* Linha Inferior de Filtros */}
      <div className="flex items-center justify-between bg-zinc-900/30 p-3 rounded-lg border border-white/5">
         
         {/* Toggle de Lançamentos Futuros */}
         <div className="flex items-center space-x-3">
            <Switch 
                id="future-mode" 
                checked={showFuture}
                onCheckedChange={handleFutureToggle}
            />
            <Label htmlFor="future-mode" className="text-sm text-zinc-400 cursor-pointer flex items-center gap-2">
                <CalendarClock size={16} className={showFuture ? "text-emerald-500" : "text-zinc-500"} />
                Exibir lançamentos futuros
            </Label>
         </div>

         {/* Botão Limpar */}
         {(defaultSearch || defaultType || showFuture) && (
            <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="text-zinc-500 hover:text-white hover:bg-white/5 px-3 h-8 text-xs"
            >
                <X size={14} className="mr-2" />
                Limpar Filtros
            </Button>
         )}
      </div>

    </div>
  )
}