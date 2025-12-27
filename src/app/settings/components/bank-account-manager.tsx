'use client'

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch" 
import { Plus, Wallet, Trash2, Landmark, Banknote, TrendingUp, EyeOff, Pencil, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBankAccount, updateBankAccount, deleteBankAccount } from "@/app/actions/bank-accounts"
import { cn } from "@/lib/utils"

// --- MONEY INPUT ---
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
    const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numericValue)
    setDisplayValue(formatted)
  }
  return (
    <Input
      value={displayValue}
      onChange={handleChange}
      disabled={disabled}
      className="bg-zinc-950/50 border-white/10 font-bold text-emerald-400 h-9"
      placeholder="R$ 0,00"
    />
  )
}

// --- TIPOS ---
type BankAccount = {
  id: string
  name: string
  type: string
  initialBalance: number
  currentBalance?: number
  transactionCount?: number 
  color: string | null
  includeInTotal: boolean 
}

interface BankAccountManagerProps {
  initialAccounts: BankAccount[]
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
  const [accounts, setAccounts] = useState(initialAccounts)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null)

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

  const openEditModal = (acc: BankAccount) => {
    setEditingId(acc.id)
    setNewName(acc.name)
    setNewBalance(acc.currentBalance ?? acc.initialBalance)
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
    
    let result;

    if (editingId) {
        formData.append("balance", newBalance.toString())
        result = await updateBankAccount(editingId, formData)
    } else {
        formData.append("initialBalance", newBalance.toString())
        result = await createBankAccount(formData)
    }

    setIsLoading(false)

    if (result.success) {
        setIsFormOpen(false)
        window.location.reload()
    } else {
        alert("Erro ao salvar carteira.")
    }
  }

  const openDeleteModal = (acc: BankAccount) => {
    setAccountToDelete(acc)
    setDeleteTransactions(false) 
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return
    setIsLoading(true)
    
    const result = await deleteBankAccount(accountToDelete.id, deleteTransactions)
    
    setIsLoading(false)
    if (result.success) {
      setAccounts(prev => prev.filter(acc => acc.id !== accountToDelete.id))
      setIsDeleteOpen(false)
      setAccountToDelete(null)
    } else {
      alert("Erro ao deletar carteira.")
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "INVESTMENT": return <TrendingUp size={16} />
      case "CASH": return <Banknote size={16} />
      default: return <Landmark size={16} />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
        case "INVESTMENT": return "Investimento"
        case "CASH": return "Dinheiro"
        default: return "Conta Corrente"
    }
  }

  return (
    <div className="space-y-4">
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accounts.map((acc) => (
          <div 
            key={acc.id} 
            className="group flex items-center justify-between p-3 rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: acc.color || "#10B981" }} />
            
            <div className="flex items-center gap-3 pl-2">
              <div className="h-9 w-9 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-400 shrink-0">
                {getIcon(acc.type)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-zinc-200 text-xs truncate">{acc.name}</h4>
                    {!acc.includeInTotal && (
                        <EyeOff size={10} className="text-zinc-600 shrink-0" />
                    )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-500 bg-white/5 px-1.5 rounded border border-white/5">{getTypeLabel(acc.type)}</span>
                    {acc.transactionCount ? (
                        <span className="text-[9px] text-zinc-600">{acc.transactionCount} mov.</span>
                    ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg"
                    onClick={() => openEditModal(acc)}
                >
                    <Pencil size={14} />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                    onClick={() => openDeleteModal(acc)} 
                >
                    <Trash2 size={14} />
                </Button>
            </div>
          </div>
        ))}

        {/* BOTÃO NOVA CARTEIRA */}
        <button 
            onClick={openCreateModal}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-emerald-500/30 transition-all gap-1.5 min-h-[70px] text-zinc-500 hover:text-emerald-500 w-full"
        >
            <Plus size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Adicionar</span>
        </button>

        {/* --- MODAL DE FORMULÁRIO --- */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="bg-zinc-950 border-white/10 text-zinc-100 sm:max-w-sm rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-sm">
                        <Wallet className="text-emerald-500" size={16} />
                        {editingId ? "Editar Carteira" : "Criar Carteira"}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="name" className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider pl-1">Nome</Label>
                        <Input 
                            id="name" 
                            placeholder="Ex: Nubank..." 
                            className="bg-zinc-950/50 border-white/10 h-9 text-sm focus-visible:ring-emerald-500/30"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider pl-1">Tipo</Label>
                            <Select value={newType} onValueChange={setNewType}>
                                <SelectTrigger className="bg-zinc-950/50 border-white/10 h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10">
                                    <SelectItem value="CHECKING">Conta Corrente</SelectItem>
                                    <SelectItem value="CASH">Dinheiro</SelectItem>
                                    <SelectItem value="INVESTMENT">Investimento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider pl-1">
                                {editingId ? "Saldo Atual" : "Saldo Inicial"}
                            </Label>
                            <MoneyInput value={newBalance} onChange={setNewBalance} />
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider pl-1">Cor</Label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setNewColor(c.value)}
                                    className={cn(
                                        "w-6 h-6 rounded-full border-2 transition-all",
                                        newColor === c.value ? "border-white scale-110 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: c.value }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between p-2 px-3 bg-zinc-900/30 border border-white/5 rounded-lg">
                             <Label className="text-xs font-medium text-zinc-300 cursor-pointer flex-1" htmlFor="include">Visível no Dashboard</Label>
                             <Switch id="include" checked={includeInTotal} onCheckedChange={setIncludeInTotal} className="scale-75 data-[state=checked]:bg-emerald-500" />
                        </div>

                        <div className="flex items-center gap-3 p-2 px-3 bg-zinc-900/30 border border-white/5 rounded-lg">
                             <Checkbox 
                                id="migrate" 
                                checked={migrateLegacy}
                                onCheckedChange={(checked) => setMigrateLegacy(checked as boolean)}
                                className="data-[state=checked]:bg-emerald-500 w-4 h-4 border-white/20"
                             />
                             <Label htmlFor="migrate" className="text-xs font-medium text-zinc-300 cursor-pointer select-none">
                                {editingId ? "Resgatar transações órfãs" : "Definir como Principal"}
                             </Label>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSave} disabled={isLoading} className="bg-white text-black hover:bg-zinc-200 font-bold h-9 text-xs w-full rounded-xl">
                        {isLoading ? "Salvando..." : (editingId ? "Atualizar" : "Criar")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* --- MODAL DE EXCLUSÃO --- */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent className="bg-zinc-950 border-white/10 text-zinc-100 sm:max-w-xs rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-500 text-sm">
                        <AlertTriangle size={16} />
                        Excluir Carteira
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-400">
                        Ação irreversível para <strong>{accountToDelete?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-3">
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                        <p className="text-[10px] text-rose-300">
                           Esta carteira possui <strong>{accountToDelete?.transactionCount || 0} movimentações</strong>.
                        </p>
                    </div>

                    <div className="flex items-start gap-2 p-2 bg-zinc-900 border border-white/5 rounded-lg">
                        <Checkbox 
                            id="delTrans" 
                            checked={deleteTransactions}
                            onCheckedChange={(c) => setDeleteTransactions(c as boolean)}
                            className="mt-0.5 data-[state=checked]:bg-rose-500 border-white/20 w-4 h-4"
                        />
                        <div className="grid gap-0.5">
                            <Label htmlFor="delTrans" className="text-xs font-medium text-zinc-200 cursor-pointer">
                                Apagar transações?
                            </Label>
                            <p className="text-[9px] text-zinc-500">
                                Se desmarcado, elas ficarão &quot;sem carteira&quot;.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:gap-0">
                    <Button variant="ghost" size="sm" onClick={() => setIsDeleteOpen(false)} className="h-8 text-xs hover:bg-zinc-900 rounded-lg">
                        Cancelar
                    </Button>
                    <Button 
                        size="sm"
                        onClick={handleConfirmDelete} 
                        disabled={isLoading} 
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-8 text-xs rounded-lg"
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