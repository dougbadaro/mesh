"use client"

import { useState, useTransition, useMemo } from "react"
import { createCategory, deleteCategory } from "@/app/actions/categories"
import { Plus, Trash2, Lock, Tag, Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react"

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
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
  <div className="space-y-1.5 mt-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
      {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-500 gap-2 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
             <Tag size={20} className="opacity-20" />
             <p className="text-xs">Nenhuma categoria.</p>
          </div>
      )}
      {items.map(cat => (
          <div key={cat.id} className="group flex items-center justify-between p-2 px-3 bg-zinc-900/30 border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      cat.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                      {cat.type === 'INCOME' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-zinc-200">{cat.name}</span>
                    {cat.userId === null && (
                        <span className="text-[9px] text-zinc-600 font-medium uppercase tracking-wider">Sistema</span>
                    )}
                  </div>
              </div>
              
              <div className="flex items-center">
                {cat.userId === null ? (
                    <Lock size={12} className="text-zinc-700 mr-2" />
                ) : (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onDelete(cat.id)}
                        disabled={isPending}
                    >
                        <Trash2 size={14} />
                    </Button>
                )}
              </div>
          </div>
      ))}
  </div>
)

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [isPending, startTransition] = useTransition()
  
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<string>("EXPENSE")

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
    if (!confirm("Atenção: Transações vinculadas a esta categoria serão movidas para 'Geral'.")) return
    startTransition(async () => {
        await deleteCategory(id)
    })
  }

  return (
    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl rounded-3xl shadow-sm overflow-hidden">
        <CardContent className="p-5">
            
            {/* Input Compacto */}
            <div className="flex gap-2 p-1 bg-zinc-950/50 rounded-xl border border-white/5 mb-6">
                <Input 
                    placeholder="Nova categoria..." 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 h-9 text-sm placeholder:text-zinc-600"
                />
                
                <div className="flex gap-2">
                    <Select value={newType} onValueChange={setNewType}>
                        <SelectTrigger className="w-[110px] bg-zinc-900 border-white/10 h-9 text-[10px] uppercase font-bold tracking-wide rounded-lg focus:ring-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10">
                            <SelectItem value="EXPENSE">Despesa</SelectItem>
                            <SelectItem value="INCOME">Receita</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Button 
                        onClick={handleCreate} 
                        disabled={isPending || !newName}
                        className="bg-white text-black hover:bg-zinc-200 h-9 w-9 rounded-lg p-0 shadow-sm"
                    >
                        {isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="expenses" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-black/20 p-1 border border-white/5 rounded-xl h-9 mb-2">
                    <TabsTrigger 
                        value="expenses" 
                        className="rounded-lg text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-zinc-800 data-[state=active]:text-white h-7"
                    >
                        Despesas <Badge variant="secondary" className="ml-2 h-4 px-1 text-[9px] bg-zinc-950 text-zinc-500">{expenses.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                        value="incomes" 
                        className="rounded-lg text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-zinc-800 data-[state=active]:text-white h-7"
                    >
                        Receitas <Badge variant="secondary" className="ml-2 h-4 px-1 text-[9px] bg-zinc-950 text-zinc-500">{incomes.length}</Badge>
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="expenses" className="mt-0">
                    <CategoryList items={expenses} onDelete={handleDelete} isPending={isPending} />
                </TabsContent>
                <TabsContent value="incomes" className="mt-0">
                    <CategoryList items={incomes} onDelete={handleDelete} isPending={isPending} />
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  )
}