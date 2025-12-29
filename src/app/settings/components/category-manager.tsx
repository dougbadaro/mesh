"use client"

import { useMemo, useState } from "react"
import { TransactionType } from "@prisma/client"
import { ArrowDownCircle, ArrowUpCircle, Loader2, Lock, Plus, Tag, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { SafeCategory } from "@/lib/transformers"
import { createCategory, deleteCategory } from "@/app/actions/categories"

interface CategoryManagerProps {
  categories: SafeCategory[]
  currentUserId: string
}

const CategoryList = ({
  items,
  onDelete,
  isPending,
  currentUserId,
}: {
  items: SafeCategory[]
  onDelete: (id: string) => void
  isPending: boolean
  currentUserId: string
}) => (
  <div className="custom-scrollbar mt-4 max-h-[300px] space-y-1.5 overflow-y-auto pr-1">
    {items.length === 0 && (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/5 bg-white/[0.01] py-8 text-zinc-500">
        <Tag size={20} className="opacity-20" />
        <p className="text-xs">Nenhuma categoria.</p>
      </div>
    )}
    {items.map((cat) => (
      <div
        key={cat.id}
        className="group flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/30 p-2 px-3 transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
              cat.type === "INCOME"
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-rose-500/10 text-rose-500"
            }`}
          >
            {cat.type === "INCOME" ? (
              <ArrowUpCircle size={14} />
            ) : (
              <ArrowDownCircle size={14} />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-200">{cat.name}</span>
            {cat.userId === null && (
              <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-600">
                Sistema
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center">
          {cat.userId === null || cat.userId !== currentUserId ? (
            <Lock size={12} className="mr-2 text-zinc-700" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-zinc-500 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
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

export function CategoryManager({ categories, currentUserId }: CategoryManagerProps) {
  const [isPending, setIsPending] = useState(false)

  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<TransactionType>("EXPENSE")

  const { expenses, incomes } = useMemo(
    () => ({
      expenses: categories.filter((c) => c.type === "EXPENSE"),
      incomes: categories.filter((c) => c.type === "INCOME"),
    }),
    [categories]
  )

  const handleCreate = async () => {
    if (!newName.trim()) return

    setIsPending(true)
    const formData = new FormData()
    formData.append("name", newName)
    formData.append("type", newType)

    try {
      const result = await createCategory(formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Categoria criada")
        setNewName("")
      }
    } catch {
      toast.error("Erro ao criar categoria")
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirm = window.confirm(
      "Atenção: Transações vinculadas a esta categoria serão movidas para 'Geral'."
    )
    if (!confirm) return

    setIsPending(true)
    try {
      await deleteCategory(id)
      toast.success("Categoria removida")
    } catch {
      toast.error("Erro ao remover")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-sm backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="mb-6 flex gap-2 rounded-xl border border-white/5 bg-zinc-950/50 p-1">
          <Input
            placeholder="Nova categoria..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-9 flex-1 border-none bg-transparent text-sm placeholder:text-zinc-600 focus-visible:ring-0"
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate()
            }}
          />

          <div className="flex gap-2">
            <Select
              value={newType}
              onValueChange={(val) => setNewType(val as TransactionType)}
            >
              <SelectTrigger className="h-9 w-[110px] rounded-lg border-white/10 bg-zinc-900 text-[10px] font-bold uppercase tracking-wide focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900">
                <SelectItem value="EXPENSE">Despesa</SelectItem>
                <SelectItem value="INCOME">Receita</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleCreate}
              disabled={isPending || !newName}
              className="h-9 w-9 rounded-lg bg-white p-0 text-black shadow-sm hover:bg-zinc-200"
            >
              {isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="mb-2 grid h-9 w-full grid-cols-2 rounded-xl border border-white/5 bg-black/20 p-1">
            <TabsTrigger
              value="expenses"
              className="h-7 rounded-lg text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
            >
              Despesas{" "}
              <Badge
                variant="secondary"
                className="ml-2 h-4 bg-zinc-950 px-1 text-[9px] text-zinc-500"
              >
                {expenses.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="incomes"
              className="h-7 rounded-lg text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
            >
              Receitas{" "}
              <Badge
                variant="secondary"
                className="ml-2 h-4 bg-zinc-950 px-1 text-[9px] text-zinc-500"
              >
                {incomes.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="mt-0">
            <CategoryList
              items={expenses}
              onDelete={handleDelete}
              isPending={isPending}
              currentUserId={currentUserId}
            />
          </TabsContent>
          <TabsContent value="incomes" className="mt-0">
            <CategoryList
              items={incomes}
              onDelete={handleDelete}
              isPending={isPending}
              currentUserId={currentUserId}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}