'use client'

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch" 
import { Plus, Wallet, Trash2, Landmark, Banknote, TrendingUp, Eye, EyeOff, Pencil, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBankAccount, updateBankAccount, deleteBankAccount } from "@/app/actions/bank-accounts"
import { cn } from "@/lib/utils"

// --- MONEY INPUT (MANTIDO) ---
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
      className="bg-zinc-900 border-white/10 font-mono text-emerald-400 font-bold"
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
  transactionCount?: number // <--- NOVO
  color: string | null
  includeInTotal: boolean 
}

interface BankAccountManagerProps {
  initialAccounts: BankAccount[]
}

const COLORS = [
  { value: "#820AD1", label: "Roxo (Nubank)" },
  { value: "#F97316", label: "Laranja (Inter)" },
  { value: "#10B981", label: "Verde (Padrão)" },
  { value: "#3B82F6", label: "Azul" },
  { value: "#EF4444", label: "Vermelho" },
  { value: "#EAB308", label: "Amarelo" },
  { value: "#71717A", label: "Cinza (Dinheiro)" },
]

export function BankAccountManager({ initialAccounts }: BankAccountManagerProps) {
  const [accounts, setAccounts] = useState(initialAccounts)
  
  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  
  // Controle de Edição e Exclusão
  const [editingId, setEditingId] = useState<string | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null)

  // Form State (Criação/Edição)
  const [newName, setNewName] = useState("")
  const [newBalance, setNewBalance] = useState(0) 
  const [newType, setNewType] = useState("CHECKING")
  const [newColor, setNewColor] = useState(COLORS[2].value)
  const [migrateLegacy, setMigrateLegacy] = useState(false)
  const [includeInTotal, setIncludeInTotal] = useState(true)

  // Form State (Exclusão)
  const [deleteTransactions, setDeleteTransactions] = useState(false)

  // --- FUNÇÕES DO MODAL DE FORMULÁRIO ---
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
        if (result.migratedCount && result.migratedCount > 0) {
            alert(`Sucesso! ${result.migratedCount} transações antigas foram vinculadas.`)
        } else if (migrateLegacy) {
            alert("Operação realizada, mas nenhuma transação antiga foi encontrada.")
        }
        setIsFormOpen(false)
        window.location.reload()
    } else {
        alert("Erro ao salvar carteira.")
    }
  }

  // --- FUNÇÕES DE EXCLUSÃO ---
  const openDeleteModal = (acc: BankAccount) => {
    setAccountToDelete(acc)
    setDeleteTransactions(false) // Padrão é NÃO apagar transações (segurança)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return
    setIsLoading(true)
    
    // Passamos o 2º parametro (deleteTransactions)
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
      case "INVESTMENT": return <TrendingUp size={18} />
      case "CASH": return <Banknote size={18} />
      default: return <Landmark size={18} />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
        case "INVESTMENT": return "Investimento"
        case "CASH": return "Dinheiro Físico"
        default: return "Conta Corrente"
    }
  }

  return (
    <div className="space-y-4">
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accounts.map((acc) => (
          <div 
            key={acc.id} 
            className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: acc.color || "#10B981" }} />
            
            <div className="flex items-center gap-4 pl-2">
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-white/5 text-zinc-400">
                {getIcon(acc.type)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-zinc-100 text-sm">{acc.name}</h4>
                    {!acc.includeInTotal && (
                        <div title="Não soma no total geral (Saldo Oculto)">
                            <EyeOff size={12} className="text-zinc-600 cursor-help" />
                        </div>
                    )}
                </div>
                <p className="text-xs text-zinc-500">{getTypeLabel(acc.type)}</p>
                {/* Mostra contagem de transações como info extra */}
                <p className="text-[10px] text-zinc-600 mt-0.5">
                   {acc.transactionCount ? `${acc.transactionCount} transações` : 'Sem movimentações'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-zinc-600 hover:text-white hover:bg-white/10"
                    onClick={() => openEditModal(acc)}
                >
                    <Pencil size={16} />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => openDeleteModal(acc)} // Abre o Modal Personalizado
                >
                    <Trash2 size={16} />
                </Button>
            </div>
          </div>
        ))}

        {/* BOTÃO NOVA CARTEIRA */}
        <button 
            onClick={openCreateModal}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-emerald-500/30 transition-all gap-2 min-h-[88px] text-zinc-500 hover:text-emerald-500 w-full"
        >
            <Plus size={24} />
            <span className="text-xs font-medium uppercase tracking-wider">Nova Carteira</span>
        </button>

        {/* --- MODAL DE FORMULÁRIO (CRIAR/EDITAR) --- */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="bg-zinc-950 border-white/10 text-zinc-100 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="text-emerald-500" size={20} />
                        {editingId ? "Editar Carteira" : "Criar Carteira"}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* (Campos de Nome, Tipo, Saldo e Cor mantidos iguais) */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome da Conta</Label>
                        <Input 
                            id="name" 
                            placeholder="Ex: Nubank, Carteira..." 
                            className="bg-zinc-900 border-white/10"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Tipo</Label>
                            <Select value={newType} onValueChange={setNewType}>
                                <SelectTrigger className="bg-zinc-900 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-zinc-200">
                                    <SelectItem value="CHECKING">Conta Corrente</SelectItem>
                                    <SelectItem value="CASH">Dinheiro Físico</SelectItem>
                                    <SelectItem value="INVESTMENT">Investimento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="balance">
                                {editingId ? "Saldo Atual (Ajustar)" : "Saldo Inicial"}
                            </Label>
                            <MoneyInput value={newBalance} onChange={setNewBalance} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Cor de Identificação</Label>
                        <div className="flex flex-wrap gap-3 p-1">
                            {COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setNewColor(c.value)}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all",
                                        newColor === c.value ? "border-white scale-110" : "border-transparent opacity-70 hover:scale-105"
                                    )}
                                    style={{ backgroundColor: c.value }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between p-3 bg-zinc-900/30 border border-white/5 rounded-lg">
                             <div className="space-y-0.5">
                                <Label className="text-sm font-medium text-zinc-200">Visível no Dashboard</Label>
                                <p className="text-xs text-zinc-500">Somar ao total geral.</p>
                             </div>
                             <Switch checked={includeInTotal} onCheckedChange={setIncludeInTotal} className="data-[state=checked]:bg-emerald-500" />
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-zinc-900/30 border border-white/5 rounded-lg">
                             <Checkbox 
                                id="migrate" 
                                checked={migrateLegacy}
                                onCheckedChange={(checked) => setMigrateLegacy(checked as boolean)}
                                className="data-[state=checked]:bg-emerald-500"
                             />
                             <div className="grid gap-0.5 leading-none">
                                <Label htmlFor="migrate" className="text-sm font-medium text-zinc-200 cursor-pointer">
                                    {editingId ? "Resgatar transações órfãs" : "Definir como Principal"}
                                </Label>
                                <p className="text-[10px] text-zinc-500">
                                    {editingId ? "Vincular transações 'sem carteira' a esta conta." : "Mover transações antigas para cá."}
                                </p>
                             </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSave} disabled={isLoading} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold w-full">
                        {isLoading ? "Salvando..." : (editingId ? "Atualizar Carteira" : "Criar Carteira")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* --- NOVO MODAL DE CONFIRMAÇÃO DE EXCLUSÃO --- */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent className="bg-zinc-950 border-white/10 text-zinc-100 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-500">
                        <AlertTriangle size={20} />
                        Excluir Carteira
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Você está prestes a excluir <strong>{accountToDelete?.name}</strong>. Esta ação não pode ser desfeita.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Alerta sobre transações vinculadas */}
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                        <p className="text-sm text-rose-200 font-medium flex items-center gap-2">
                            <Trash2 size={16} />
                            Status Atual:
                        </p>
                        <p className="text-xs text-rose-300/80 mt-1 pl-6">
                            Esta carteira possui <strong>{accountToDelete?.transactionCount || 0} movimentações</strong> registradas.
                        </p>
                    </div>

                    {/* Checkbox de Decisão */}
                    <div className="flex items-start gap-3 p-3 bg-zinc-900 border border-white/5 rounded-lg">
                        <Checkbox 
                            id="delTrans" 
                            checked={deleteTransactions}
                            onCheckedChange={(c) => setDeleteTransactions(c as boolean)}
                            className="mt-1 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="delTrans" className="text-sm font-medium text-zinc-200 cursor-pointer">
                                Excluir também as transações?
                            </Label>
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                <strong>Se marcado:</strong> Todo o histórico de gastos desta conta será apagado permanentemente.<br/>
                                <strong>Se desmarcado:</strong> As transações serão mantidas, mas ficarão &quot;sem carteira&quot; (dinheiro vivo).
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="hover:bg-zinc-900">
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirmDelete} 
                        disabled={isLoading} 
                        className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                    >
                        {isLoading ? "Processando..." : "Sim, Excluir Carteira"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

       </div>
    </div>
  )
}