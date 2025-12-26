"use client"

import { useState, useTransition, useEffect, useMemo } from "react"
import { createCategory, deleteCategory } from "@/app/actions/categories"
import { Plus, Trash2, Lock, Tag, Loader2 } from "lucide-react"

// ... (seus imports do Shadcn permanecem iguais)
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface CategoryDTO {
  id: string
  name: string
  type: string
  budgetLimit: number | null
  userId: string | null
  createdAt: Date
  updatedAt: Date
}

interface CategoryManagerProps {
  categories: CategoryDTO[]
  currentUserId: string
}

// --- SUB-COMPONENTE DE LISTAGEM ---
const CategoryList = ({ items, onDelete, isPending }: { items: CategoryDTO[], onDelete: (id: string) => void, isPending: boolean }) => (
  <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar font-sans">
      {items.length === 0 && (
          <p className="text-sm text-zinc-500 italic text-center py-4">Nenhuma categoria encontrada.</p>
      )}
      {items.map(cat => (
          <div key={cat.id} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-white/5 rounded-xl group hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3 text-left">
                  <div className={`p-2 rounded-lg ${cat.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      <Tag size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200">{cat.name}</span>
                    {cat.userId === null && (
                        <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-tighter">System Default</span>
                    )}
                  </div>
              </div>
              <div className="flex items-center gap-2">
                {cat.userId === null ? (
                    <div className="p-2 text-zinc-800"><Lock size={14} /></div>
                ) : (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                        onClick={() => onDelete(cat.id)}
                        disabled={isPending}
                    >
                        <Trash2 size={16} />
                    </Button>
                )}
              </div>
          </div>
      ))}
  </div>
)

export function CategoryManager({ categories, currentUserId }: CategoryManagerProps) {
  const [isPending, startTransition] = useTransition()
  
  // SOLUÇÃO: Em vez de useEffect + setState, usamos um check simples de montagem.
  // Ou melhor: removemos a lógica de isMounted e deixamos o React lidar com a hidratação
  // usando suppressHydrationWarning se necessário, mas o ideal é filtrar os dados no render.
  
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<string>("EXPENSE")

  // Derivando estados para evitar filtros desnecessários a cada render
  const { expenses, incomes } = useMemo(() => ({
    expenses: categories.filter(c => c.type === "EXPENSE"),
    incomes: categories.filter(c => c.type === "INCOME")
  }), [categories])

  const handleCreate = () => {
    if (!newName) return
    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', newName)
      formData.append('type', newType)
      await createCategory(formData)
      setNewName("") 
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Confirm operation: Transactions linked to this category will be reset to 'General'.")) return
    startTransition(async () => {
        await deleteCategory(id)
    })
  }

  return (
    <Card className="bg-zinc-900/20 border-white/5 overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-white/5 bg-white/[0.01]">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Terminal size={18} className="text-emerald-500" />
              Category Schema
            </CardTitle>
            <CardDescription className="text-[10px] font-mono uppercase tracking-widest opacity-50">Classification Layer Management</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-zinc-950/40 rounded-xl border border-white/5 shadow-inner">
                <div className="flex-1">
                    <Input 
                        placeholder="Label name..." 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="bg-zinc-900/50 border-white/5 focus-visible:ring-emerald-500/30 h-10 font-sans"
                    />
                </div>
                <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="w-full sm:w-[140px] bg-zinc-900 border-white/5 h-10 font-mono text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-white/10">
                        <SelectItem value="EXPENSE">EXPENSE</SelectItem>
                        <SelectItem value="INCOME">INCOME</SelectItem>
                    </SelectContent>
                </Select>
                <Button 
                    onClick={handleCreate} 
                    disabled={isPending || !newName}
                    className="bg-white text-black hover:bg-zinc-200 font-bold h-10 px-6 rounded-lg transition-all active:scale-95"
                >
                    {isPending ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                    <span className="ml-2 uppercase text-[11px] tracking-tighter">Add Entry</span>
                </Button>
            </div>

            <Tabs defaultValue="expenses" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-zinc-950 p-1 border border-white/5 rounded-lg h-11">
                    <TabsTrigger value="expenses" className="rounded-md data-[state=active]:bg-zinc-900 data-[state=active]:text-emerald-400 font-mono text-[10px]">DEBITS</TabsTrigger>
                    <TabsTrigger value="incomes" className="rounded-md data-[state=active]:bg-zinc-900 data-[state=active]:text-emerald-400 font-mono text-[10px]">CREDITS</TabsTrigger>
                </TabsList>
                <TabsContent value="expenses">
                    <CategoryList items={expenses} onDelete={handleDelete} isPending={isPending} />
                </TabsContent>
                <TabsContent value="incomes">
                    <CategoryList items={incomes} onDelete={handleDelete} isPending={isPending} />
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  )
}

// Helper local para o ícone que faltou no import anterior
function Terminal({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  )
}