"use client"

import { useState, useTransition } from "react"
import { createCategory, deleteCategory } from "@/app/actions/categories"
import { Plus, Trash2, Lock, Tag } from "lucide-react"
import { Category, TransactionType } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

// --- CORREÇÃO: Definir interfaces e o sub-componente FORA da função principal ---

interface CategoryListProps {
  items: Category[]
  currentUserId: string
  onDelete: (id: string) => void
  isPending: boolean
}

const CategoryList = ({ items, currentUserId, onDelete, isPending }: CategoryListProps) => (
  <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {items.length === 0 && (
          <p className="text-sm text-zinc-500 italic text-center py-4">Nenhuma categoria encontrada.</p>
      )}
      {items.map(cat => {
          const isSystem = cat.userId === null // Se userId é null, é do sistema
          
          return (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-white/5 rounded-xl group hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${cat.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          <Tag size={16} />
                      </div>
                      <span className="text-sm font-medium text-zinc-200">{cat.name}</span>
                      {isSystem && (
                          <Badge variant="secondary" className="text-[10px] h-5 bg-zinc-800 text-zinc-500 hover:bg-zinc-800">
                              Padrão
                          </Badge>
                      )}
                  </div>

                  {/* Botão de Ação */}
                  {isSystem ? (
                      <Lock size={16} className="text-zinc-700 mr-2" />
                  ) : (
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => onDelete(cat.id)}
                          disabled={isPending}
                      >
                          <Trash2 size={16} />
                      </Button>
                  )}
              </div>
          )
      })}
  </div>
)

// --- COMPONENTE PRINCIPAL ---

interface CategoryManagerProps {
  categories: Category[]
  currentUserId: string
}

export function CategoryManager({ categories, currentUserId }: CategoryManagerProps) {
  const [isPending, startTransition] = useTransition()
  
  // Estado do formulário
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<TransactionType>("EXPENSE")

  const handleCreate = () => {
    if (!newName) return
    
    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', newName)
      formData.append('type', newType)
      
      await createCategory(formData)
      setNewName("") // Limpa input
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza? Transações com esta categoria ficarão 'Sem Categoria'.")) return

    startTransition(async () => {
        await deleteCategory(id)
    })
  }

  // Filtra visualmente
  const expenses = categories.filter(c => c.type === "EXPENSE")
  const incomes = categories.filter(c => c.type === "INCOME")

  return (
    <Card className="bg-zinc-900/20 border-white/5">
        <CardHeader>
            <CardTitle className="text-xl">Gerenciar Categorias</CardTitle>
            <CardDescription>Crie tags personalizadas ou remova as que não usa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            
            {/* FORMULÁRIO DE CRIAÇÃO */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-zinc-950/50 rounded-xl border border-white/5">
                <div className="flex-1">
                    <Input 
                        placeholder="Nova categoria (ex: Uber, Freelance...)" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="bg-transparent border-white/10 focus-visible:ring-emerald-500/50"
                    />
                </div>
                <Select value={newType} onValueChange={(v) => setNewType(v as TransactionType)}>
                    <SelectTrigger className="w-[140px] bg-zinc-900 border-white/10">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="EXPENSE">Despesa</SelectItem>
                        <SelectItem value="INCOME">Receita</SelectItem>
                    </SelectContent>
                </Select>
                <Button 
                    onClick={handleCreate} 
                    disabled={isPending || !newName}
                    className="bg-white text-black hover:bg-zinc-200"
                >
                    <Plus size={18} className="mr-2" />
                    Adicionar
                </Button>
            </div>

            {/* LISTAGEM COM TABS */}
            <Tabs defaultValue="expenses" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-zinc-950">
                    <TabsTrigger value="expenses">Despesas</TabsTrigger>
                    <TabsTrigger value="incomes">Receitas</TabsTrigger>
                </TabsList>
                <TabsContent value="expenses">
                    {/* Passamos as props para o componente externo */}
                    <CategoryList 
                        items={expenses} 
                        currentUserId={currentUserId} 
                        onDelete={handleDelete}
                        isPending={isPending}
                    />
                </TabsContent>
                <TabsContent value="incomes">
                    <CategoryList 
                        items={incomes} 
                        currentUserId={currentUserId} 
                        onDelete={handleDelete}
                        isPending={isPending}
                    />
                </TabsContent>
            </Tabs>

        </CardContent>
    </Card>
  )
}