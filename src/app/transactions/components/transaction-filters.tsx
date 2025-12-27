"use client"

import { Search, Filter, X, CalendarClock, Wallet } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Account {
  id: string
  name: string
}

export function TransactionFilters({ accounts }: { accounts: Account[] }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const defaultSearch = searchParams.get('query')?.toString()
  const defaultType = searchParams.get('type')?.toString()
  const defaultBank = searchParams.get('bankId')?.toString()
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

  const handleBankChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1')
    if (value && value !== 'ALL') params.set('bankId', value)
    else params.delete('bankId')
    replace(`${pathname}?${params.toString()}`)
  }

  const handleFutureToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1') 
    if (checked) params.set('future', 'true')
    else params.delete('future')
    replace(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    replace(pathname)
  }

  return (
    <div className="space-y-4 mb-6">
      
      {/* LINHA SUPERIOR: Busca e Selects */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Campo de Busca */}
        <div className="relative md:col-span-5 lg:col-span-6 group">
            <div className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-white transition-colors">
                <Search size={16} />
            </div>
            <Input
              placeholder="Buscar..."
              className="pl-9 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-white/10 h-9 text-sm rounded-xl"
              defaultValue={defaultSearch}
              onChange={(e) => handleSearch(e.target.value)}
            />
        </div>

        {/* Filtro de Tipo */}
        <div className="md:col-span-3 lg:col-span-3">
            <Select defaultValue={defaultType || "ALL"} onValueChange={handleTypeChange}>
            <SelectTrigger className="bg-zinc-900/50 border-white/10 text-zinc-300 h-9 text-sm rounded-xl focus:ring-white/10">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-zinc-500" />
                    <SelectValue placeholder="Tipo" />
                </div>
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="ALL">Todos os Tipos</SelectItem>
                <SelectItem value="INCOME">Entradas</SelectItem>
                <SelectItem value="EXPENSE">Saídas</SelectItem>
            </SelectContent>
            </Select>
        </div>

        {/* Filtro de Carteira */}
        <div className="md:col-span-4 lg:col-span-3">
            <Select defaultValue={defaultBank || "ALL"} onValueChange={handleBankChange}>
            <SelectTrigger className="bg-zinc-900/50 border-white/10 text-zinc-300 h-9 text-sm rounded-xl focus:ring-white/10">
                <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-zinc-500" />
                    <SelectValue placeholder="Todas as Contas" />
                </div>
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="ALL">Todas as Contas</SelectItem>
                {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
      </div>

      {/* LINHA INFERIOR: Toggles e Limpeza */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] p-2 px-3 rounded-xl border border-white/5">
         
         <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <Switch 
                    id="future-mode" 
                    checked={showFuture}
                    onCheckedChange={handleFutureToggle}
                    className="data-[state=checked]:bg-emerald-500 scale-75 origin-left"
                />
                <Label htmlFor="future-mode" className="text-xs text-zinc-400 cursor-pointer hover:text-white transition-colors flex items-center gap-1.5 select-none">
                    <CalendarClock size={14} className={showFuture ? "text-emerald-500" : "text-zinc-600"} />
                    Exibir futuros
                </Label>
            </div>
         </div>

         {(defaultSearch || defaultType || defaultBank || showFuture) && (
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 px-3 h-7 text-[10px] uppercase font-bold tracking-wide rounded-lg transition-all"
            >
                <X size={12} className="mr-1.5" />
                Limpar Filtros
            </Button>
         )}
      </div>

    </div>
  )
}