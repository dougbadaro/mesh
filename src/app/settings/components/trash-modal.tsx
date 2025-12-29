"use client"

import { useState } from "react"
import { ArrowDownLeft, ArrowUpRight, RefreshCcw, Tag, Trash2, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { restoreBankAccount, restoreCategory, restoreTransaction } from "@/app/actions/trash"

interface TrashItem {
  id: string
  name?: string
  description?: string
  amount?: number
  type?: string
  deletedAt: string
}

interface TrashModalProps {
  transactions: TrashItem[]
  categories: TrashItem[]
  bankAccounts: TrashItem[]
}

export function TrashModal({ transactions, categories, bankAccounts }: TrashModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleRestore = async (id: string, type: "TRANSACTION" | "CATEGORY" | "ACCOUNT") => {
    setIsPending(true)
    let result

    try {
      if (type === "TRANSACTION") result = await restoreTransaction(id)
      if (type === "CATEGORY") result = await restoreCategory(id)
      if (type === "ACCOUNT") result = await restoreBankAccount(id)

      if (result?.success) {
        toast.success("Item restaurado")
        router.refresh() // Atualiza a lista na hora
      } else {
        toast.error("Erro ao restaurar")
      }
    } catch {
      toast.error("Erro inesperado")
    } finally {
      setIsPending(false)
    }
  }

  const RestoreButton = ({ onClick }: { onClick: () => void }) => (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      disabled={isPending}
      className="h-8 w-8 text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-500"
      title="Restaurar"
    >
      <RefreshCcw size={14} />
    </Button>
  )

  const EmptyState = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
      <Trash2 size={24} className="mb-2 opacity-20" />
      <p className="text-xs">{text}</p>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="group cursor-pointer">
          <div className="flex h-full flex-col justify-between rounded-xl border border-white/5 bg-zinc-900/40 p-4 transition-all hover:border-white/10 hover:bg-zinc-900/60">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 transition-colors group-hover:bg-rose-500/20">
              <Trash2 size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-200">Lixeira</h4>
              <p className="text-xs text-zinc-500">
                {transactions.length + categories.length + bankAccounts.length} itens excluídos.
              </p>
            </div>
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-h-[85vh] max-w-2xl gap-0 border-white/10 bg-zinc-950 p-0 text-zinc-100">
        <DialogHeader className="border-b border-white/10 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Trash2 size={16} className="text-rose-500" />
            Lixeira
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="transactions" className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="w-full bg-zinc-900">
              <TabsTrigger value="transactions" className="flex-1 text-xs">
                Transações ({transactions.length})
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex-1 text-xs">
                Categorias ({categories.length})
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex-1 text-xs">
                Carteiras ({bankAccounts.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[400px] p-6 pt-4">
            {/* TRANSAÇÕES */}
            <TabsContent value="transactions" className="mt-0 space-y-2">
              {transactions.length === 0 ? (
                <EmptyState text="Nenhuma transação na lixeira" />
              ) : (
                transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {t.type === 'INCOME' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{t.description}</p>
                        <p className="text-xs text-zinc-500">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(t.amount || 0)}
                        </p>
                      </div>
                    </div>
                    <RestoreButton onClick={() => handleRestore(t.id, "TRANSACTION")} />
                  </div>
                ))
              )}
            </TabsContent>

            {/* CATEGORIAS */}
            <TabsContent value="categories" className="mt-0 space-y-2">
              {categories.length === 0 ? (
                <EmptyState text="Nenhuma categoria na lixeira" />
              ) : (
                categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
                        <Tag size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{c.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase">{c.type === 'INCOME' ? 'Receita' : 'Despesa'}</p>
                      </div>
                    </div>
                    <RestoreButton onClick={() => handleRestore(c.id, "CATEGORY")} />
                  </div>
                ))
              )}
            </TabsContent>

            {/* CARTEIRAS */}
            <TabsContent value="accounts" className="mt-0 space-y-2">
              {bankAccounts.length === 0 ? (
                <EmptyState text="Nenhuma carteira na lixeira" />
              ) : (
                bankAccounts.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 text-zinc-400">
                        <Wallet size={14} />
                      </div>
                      <p className="text-sm font-medium text-zinc-200">{b.name}</p>
                    </div>
                    <RestoreButton onClick={() => handleRestore(b.id, "ACCOUNT")} />
                  </div>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}