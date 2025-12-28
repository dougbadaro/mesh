"use client"

import { CalendarClock, Filter, Search, Wallet, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface Account {
  id: string
  name: string
}

export function TransactionFilters({ accounts }: { accounts: Account[] }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const defaultSearch = searchParams.get("query")?.toString()
  const defaultType = searchParams.get("type")?.toString()
  const defaultBank = searchParams.get("bankId")?.toString()
  const showFuture = searchParams.get("future") === "true"

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", "1")
    if (term) params.set("query", term)
    else params.delete("query")
    replace(`${pathname}?${params.toString()}`)
  }, 300)

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", "1")
    if (value && value !== "ALL") params.set("type", value)
    else params.delete("type")
    replace(`${pathname}?${params.toString()}`)
  }

  const handleBankChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", "1")
    if (value && value !== "ALL") params.set("bankId", value)
    else params.delete("bankId")
    replace(`${pathname}?${params.toString()}`)
  }

  const handleFutureToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", "1")
    if (checked) params.set("future", "true")
    else params.delete("future")
    replace(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    replace(pathname)
  }

  return (
    <div className="mb-6 space-y-4">
      {/* LINHA SUPERIOR: Busca e Selects */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        {/* Campo de Busca */}
        <div className="group relative md:col-span-5 lg:col-span-6">
          <div className="absolute left-3 top-2.5 text-zinc-500 transition-colors group-focus-within:text-white">
            <Search size={16} />
          </div>
          <Input
            placeholder="Buscar..."
            className="h-9 rounded-xl border-white/10 bg-zinc-900/50 pl-9 text-sm text-white placeholder:text-zinc-600 focus-visible:ring-white/10"
            defaultValue={defaultSearch}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        {/* Filtro de Tipo */}
        <div className="md:col-span-3 lg:col-span-3">
          <Select defaultValue={defaultType || "ALL"} onValueChange={handleTypeChange}>
            <SelectTrigger className="h-9 rounded-xl border-white/10 bg-zinc-900/50 text-sm text-zinc-300 focus:ring-white/10">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-zinc-500" />
                <SelectValue placeholder="Tipo" />
              </div>
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-900">
              <SelectItem value="ALL">Todos os Tipos</SelectItem>
              <SelectItem value="INCOME">Entradas</SelectItem>
              <SelectItem value="EXPENSE">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Carteira */}
        <div className="md:col-span-4 lg:col-span-3">
          <Select defaultValue={defaultBank || "ALL"} onValueChange={handleBankChange}>
            <SelectTrigger className="h-9 rounded-xl border-white/10 bg-zinc-900/50 text-sm text-zinc-300 focus:ring-white/10">
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-zinc-500" />
                <SelectValue placeholder="Todas as Contas" />
              </div>
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-900">
              <SelectItem value="ALL">Todas as Contas</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* LINHA INFERIOR: Toggles e Limpeza */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-2 px-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="future-mode"
              checked={showFuture}
              onCheckedChange={handleFutureToggle}
              className="origin-left scale-75 data-[state=checked]:bg-emerald-500"
            />
            <Label
              htmlFor="future-mode"
              className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-white"
            >
              <CalendarClock
                size={14}
                className={showFuture ? "text-emerald-500" : "text-zinc-600"}
              />
              Exibir futuros
            </Label>
          </div>
        </div>

        {(defaultSearch || defaultType || defaultBank || showFuture) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 rounded-lg px-3 text-[10px] font-bold uppercase tracking-wide text-zinc-500 transition-all hover:bg-rose-500/10 hover:text-rose-400"
          >
            <X size={12} className="mr-1.5" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  )
}
