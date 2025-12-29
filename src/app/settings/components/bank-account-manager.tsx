"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Banknote,
  EyeOff,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

import { SafeAccount } from "@/lib/transformers"
import { cn } from "@/lib/utils"
import {
  createBankAccount,
  deleteBankAccount,
  updateBankAccount,
} from "@/app/actions/bank-accounts"

// Estende o SafeAccount para incluir o saldo calculado
interface AccountWithBalance extends SafeAccount {
  currentBalance: number
}

interface MoneyInputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

function MoneyInput({ value, onChange, disabled }: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState(() => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  })
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "")
    const numericValue = Number(rawValue) / 100
    onChange(numericValue)
    const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      numericValue
    )
    setDisplayValue(formatted)
  }
  return (
    <Input
      value={displayValue}
      onChange={handleChange}
      disabled={disabled}
      className="h-9 border-white/10 bg-zinc-950/50 font-bold text-emerald-400"
      placeholder="R$ 0,00"
    />
  )
}

interface BankAccountManagerProps {
  initialAccounts: AccountWithBalance[]
}

const COLORS = [
  { value: "#820AD1", label: "Roxo" },
  { value: "#F97316", label: "Laranja" },
  { value: "#10B981", label: "Verde" },
  { value: "#3B82F6", label: "Azul" },
  { value: "#EF4444", label: "Vermelho" },
  { value: "#EAB308", label: "Amarelo" },
  { value: "#71717A", label: "Cinza" },
]

export function BankAccountManager({ initialAccounts }: BankAccountManagerProps) {
  const router = useRouter()
  // Usa o tipo estendido
  const [accounts, setAccounts] = useState<AccountWithBalance[]>(initialAccounts)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<AccountWithBalance | null>(null)

  const [newName, setNewName] = useState("")
  const [newBalance, setNewBalance] = useState(0)
  const [newType, setNewType] = useState("CHECKING")
  const [newColor, setNewColor] = useState(COLORS[2].value)
  const [migrateLegacy, setMigrateLegacy] = useState(false)
  const [includeInTotal, setIncludeInTotal] = useState(true)
  const [deleteTransactions, setDeleteTransactions] = useState(false)

  const openCreateModal = () => {
    setEditingId(null)
    setNewName("")
    setNewBalance(0)
    setNewType("CHECKING")
    setNewColor(COLORS[2].value)
    setMigrateLegacy(false)
    setIncludeInTotal(true)
    setIsFormOpen(true)
  }

  const openEditModal = (acc: AccountWithBalance) => {
    setEditingId(acc.id)
    setNewName(acc.name)
    // IMPORTANTE: Ao editar, usamos o initialBalance (o valor base), não o calculado
    setNewBalance(acc.initialBalance)
    setNewType(acc.type)
    setNewColor(acc.color || COLORS[2].value)
    setIncludeInTotal(acc.includeInTotal)
    setMigrateLegacy(false)
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (!newName) return
    setIsLoading(true)

    const formData = new FormData()
    formData.append("name", newName)
    formData.append("type", newType)
    formData.append("color", newColor)
    formData.append("includeInTotal", String(includeInTotal))
    formData.append("migrateLegacy", String(migrateLegacy))

    let result

    try {
      if (editingId) {
        formData.append("balance", newBalance.toString())
        result = await updateBankAccount(editingId, formData)
      } else {
        formData.append("initialBalance", newBalance.toString())
        result = await createBankAccount(formData)
      }

      if (result.success) {
        toast.success(editingId ? "Carteira atualizada" : "Carteira criada")
        setIsFormOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao salvar carteira.")
      }
    } catch {
      toast.error("Erro inesperado.")
    } finally {
      setIsLoading(false)
    }
  }

  const openDeleteModal = (acc: AccountWithBalance) => {
    setAccountToDelete(acc)
    setDeleteTransactions(false)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return
    setIsLoading(true)

    try {
      const result = await deleteBankAccount(accountToDelete.id)

      if (result.success) {
        setAccounts((prev) => prev.filter((acc) => acc.id !== accountToDelete.id))
        toast.success("Carteira movida para lixeira")
        setIsDeleteOpen(false)
        setAccountToDelete(null)
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao deletar carteira.")
      }
    } catch {
      toast.error("Erro inesperado.")
    } finally {
      setIsLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "INVESTMENT":
        return <TrendingUp size={16} />
      case "CASH":
        return <Banknote size={16} />
      default:
        return <Landmark size={16} />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "INVESTMENT":
        return "Investimento"
      case "CASH":
        return "Dinheiro"
      default:
        return "Conta Corrente"
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-white/5 bg-zinc-900/40 p-3 transition-all hover:bg-zinc-900/60"
          >
            <div
              className="absolute bottom-0 left-0 top-0 w-1"
              style={{ backgroundColor: acc.color || "#10B981" }}
            />

            <div className="flex items-center gap-3 pl-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-zinc-950 text-zinc-400">
                {getIcon(acc.type)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-xs font-semibold text-zinc-200">{acc.name}</h4>
                  {!acc.includeInTotal && <EyeOff size={10} className="shrink-0 text-zinc-600" />}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="rounded border border-white/5 bg-white/5 px-1.5 text-[10px] text-zinc-500">
                    {getTypeLabel(acc.type)}
                  </span>
                  {/* AQUI ESTAVA O ERRO: Agora mostramos acc.currentBalance */}
                  <span className="text-[9px] font-medium text-zinc-400">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(acc.currentBalance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-zinc-500 hover:bg-white/10 hover:text-white"
                onClick={() => openEditModal(acc)}
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                onClick={() => openDeleteModal(acc)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}

        <button
          onClick={openCreateModal}
          className="flex min-h-[70px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-3 text-zinc-500 transition-all hover:border-emerald-500/30 hover:bg-zinc-900/40 hover:text-emerald-500"
        >
          <Plus size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Adicionar</span>
        </button>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="rounded-3xl border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <Wallet className="text-emerald-500" size={16} />
                {editingId ? "Editar Carteira" : "Criar Carteira"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label
                  htmlFor="name"
                  className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500"
                >
                  Nome
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Nubank..."
                  className="h-9 border-white/10 bg-zinc-950/50 text-sm focus-visible:ring-emerald-500/30"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Tipo
                  </Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="h-9 border-white/10 bg-zinc-950/50 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-zinc-900">
                      <SelectItem value="CHECKING">Conta Corrente</SelectItem>
                      <SelectItem value="CASH">Dinheiro</SelectItem>
                      <SelectItem value="INVESTMENT">Investimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {/* Mantém a lógica de edição do saldo inicial */}
                    {editingId ? "Saldo Inicial (Base)" : "Saldo Inicial"}
                  </Label>
                  <MoneyInput value={newBalance} onChange={setNewBalance} />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="pl-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Cor
                </Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setNewColor(c.value)}
                      className={cn(
                        "h-6 w-6 rounded-full border-2 transition-all",
                        newColor === c.value
                          ? "scale-110 border-white shadow-sm"
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/30 p-2 px-3">
                  <Label
                    className="flex-1 cursor-pointer text-xs font-medium text-zinc-300"
                    htmlFor="include"
                  >
                    Visível no Dashboard
                  </Label>
                  <Switch
                    id="include"
                    checked={includeInTotal}
                    onCheckedChange={setIncludeInTotal}
                    className="scale-75 data-[state=checked]:bg-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-zinc-900/30 p-2 px-3">
                  <Checkbox
                    id="migrate"
                    checked={migrateLegacy}
                    onCheckedChange={(checked) => setMigrateLegacy(checked as boolean)}
                    className="h-4 w-4 border-white/20 data-[state=checked]:bg-emerald-500"
                  />
                  <Label
                    htmlFor="migrate"
                    className="cursor-pointer select-none text-xs font-medium text-zinc-300"
                  >
                    {editingId ? "Resgatar transações órfãs" : "Definir como Principal"}
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="h-9 w-full rounded-xl bg-white text-xs font-bold text-black hover:bg-zinc-200"
              >
                {isLoading ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="rounded-3xl border-white/10 bg-zinc-950 text-zinc-100 sm:max-w-xs">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm text-rose-500">
                <AlertTriangle size={16} />
                Excluir Carteira
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Ação irreversível para <strong>{accountToDelete?.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                <p className="text-[10px] text-rose-300">
                  Esta carteira será movida para a <strong>Lixeira</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-white/5 bg-zinc-900 p-2">
                <Checkbox
                  id="delTrans"
                  checked={deleteTransactions}
                  onCheckedChange={(c) => setDeleteTransactions(c as boolean)}
                  className="mt-0.5 h-4 w-4 border-white/20 data-[state=checked]:bg-rose-500"
                />
                <div className="grid gap-0.5">
                  <Label
                    htmlFor="delTrans"
                    className="cursor-pointer text-xs font-medium text-zinc-200"
                  >
                    Apagar transações?
                  </Label>
                  <p className="text-[9px] text-zinc-500">
                    Se desmarcado, elas ficarão &quot;sem carteira&quot;.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteOpen(false)}
                className="h-8 rounded-lg text-xs hover:bg-zinc-900"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isLoading}
                className="h-8 rounded-lg bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
              >
                {isLoading ? "..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}