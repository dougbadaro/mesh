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

// Interface para receber as contas
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
  const defaultBank = searchParams.get('bankId')?.toString() // Novo Filtro
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

  // Novo Handler para Carteira
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
    <div className="flex flex-col gap-4 mb-6">
      
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        {/* Campo de Busca */}
        <div className="relative sm:col-span-6 lg:col-span-5">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <Input
            placeholder="Buscar por descrição..."
            className="pl-9 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500/20"
            defaultValue={defaultSearch}
            onChange={(e) => handleSearch(e.target.value)}
            />
        </div>

        {/* Filtro de Tipo */}
        <div className="sm:col-span-3 lg:col-span-2">
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

        {/* NOVO: Filtro de Carteira */}
        <div className="sm:col-span-3 lg:col-span-3">
            <Select defaultValue={defaultBank || "ALL"} onValueChange={handleBankChange}>
            <SelectTrigger className="bg-zinc-900/50 border-white/10 text-zinc-200">
                <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-zinc-500" />
                    <SelectValue placeholder="Carteira" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">Todas as Carteiras</SelectItem>
                {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
      </div>

      {/* Linha Inferior de Filtros */}
      <div className="flex items-center justify-between bg-zinc-900/30 p-3 rounded-lg border border-white/5">
         
         <div className="flex items-center space-x-3">
            <Switch 
                id="future-mode" 
                checked={showFuture}
                onCheckedChange={handleFutureToggle}
                className="data-[state=checked]:bg-emerald-500"
            />
            <Label htmlFor="future-mode" className="text-sm text-zinc-400 cursor-pointer flex items-center gap-2">
                <CalendarClock size={16} className={showFuture ? "text-emerald-500" : "text-zinc-500"} />
                Exibir lançamentos futuros
            </Label>
         </div>

         {(defaultSearch || defaultType || defaultBank || showFuture) && (
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