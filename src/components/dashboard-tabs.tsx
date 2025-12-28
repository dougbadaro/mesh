"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionForm } from "@/components/transaction-form"
import { BankStatementImporter } from "@/components/bank-statement-importer"

// --- DEFINIÇÃO DE TIPOS (Para remover os 'any') ---

interface Category {
  id: string
  name: string
  // Adicione outros campos se seus componentes internos precisarem
  budgetLimit?: number | null
}

interface Account {
  id: string
  name: string
  color: string | null
  initialBalance: number
}

interface DashboardTabsProps {
  categories: Category[]
  accounts: Account[]
}

export function DashboardTabs({ categories, accounts }: DashboardTabsProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // O setTimeout(..., 0) joga a execução para o final da pilha de eventos.
    // Isso evita o erro "synchronous setState" do linter e garante
    // que o componente só renderize o conteúdo pesado após a hidratação inicial.
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  // Enquanto não montou no cliente, não renderiza nada para evitar conflito de IDs
  if (!isMounted) return null

  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-zinc-950/50 p-1 rounded-2xl h-9 mb-1">
        <TabsTrigger 
            value="manual" 
            className="rounded-xl text-[10px] font-bold uppercase tracking-wide data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
        >
            Manual
        </TabsTrigger>
        <TabsTrigger 
            value="import" 
            className="rounded-xl text-[10px] font-bold uppercase tracking-wide data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
        >
            Importar
        </TabsTrigger>
      </TabsList>
      
      <div className="p-1">
        <TabsContent value="manual" className="mt-0">
            <TransactionForm categories={categories} accounts={accounts} />
        </TabsContent>
        <TabsContent value="import" className="mt-0">
            <BankStatementImporter categories={categories} />
        </TabsContent>
      </div>
    </Tabs>
  )
}