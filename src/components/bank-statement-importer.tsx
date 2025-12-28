"use client"

import { useRef, useState } from "react"
import {
  AlertCircle, // <--- Novo ícone
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner" // <--- Importação do Sonner
import * as XLSX from "xlsx"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

import { cn } from "@/lib/utils"
import { createTransaction } from "@/app/actions/transactions"

interface Category {
  id: string
  name: string
}

interface ExcelRow {
  Data?: string
  Lançamento?: string
  Detalhes?: string
  Valor?: string | number
  "Tipo Lançamento"?: string
  [key: string]: unknown
}

interface ParsedTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: "INCOME" | "EXPENSE"
  paymentMethod: string
  categoryId: string
  originalLine: string
  selected: boolean
}

// Overlay de Carregamento (Dentro do Card)
function LoadingOverlay({ progress, currentItem }: { progress: number; currentItem: string }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-3xl bg-zinc-950/80 p-8 backdrop-blur-md duration-300 animate-in fade-in">
      <div className="w-full max-w-[280px] space-y-6 text-center">
        {/* Spinner Apple Style */}
        <div className="relative mx-auto h-14 w-14">
          <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-b-transparent border-l-transparent border-r-transparent border-t-emerald-500"></div>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-500">
            {progress}%
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight text-white">Processando...</h3>
          <div className="flex h-5 items-center justify-center">
            <span className="max-w-[200px] truncate text-[10px] text-zinc-400">{currentItem}</span>
          </div>
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function BankStatementImporter({ categories }: { categories: Category[] }) {
  const [step, setStep] = useState<"UPLOAD" | "PREVIEW" | "SUCCESS">("UPLOAD")
  const [parsedItems, setParsedItems] = useState<ParsedTransaction[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentProcessingItem, setCurrentProcessingItem] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsProcessing(true)
    setCurrentProcessingItem("Lendo arquivo...")
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const worksheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[worksheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as ExcelRow[]
      processExcelData(jsonData)
    } catch (error) {
      console.error("Erro ao ler Excel:", error)
      // TOAST DE ERRO
      toast.error("Erro ao ler arquivo", {
        description: "Certifique-se que é um arquivo .xlsx ou .csv válido.",
        icon: <AlertCircle className="text-rose-500" />,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const processExcelData = (rows: ExcelRow[]) => {
    const items: ParsedTransaction[] = []

    rows.forEach((row) => {
      const rawDate = row["Data"]
      const lancamento = (row["Lançamento"] || "").trim()
      const detalhes = (row["Detalhes"] || "").trim()
      const rawValue = row["Valor"]
      const tipoLancamento = (row["Tipo Lançamento"] || "").trim()

      if (tipoLancamento !== "Entrada" && tipoLancamento !== "Saída") return
      if (!rawDate || rawDate.includes("00/00/0000")) return
      if (!rawValue) return

      const [day, month, year] = rawDate.split("/")
      const isoDate = `${year}-${month}-${day}`

      const cleanValueStr = String(rawValue)
        .replace(/['"]/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
      const amount = Math.abs(parseFloat(cleanValueStr))

      if (!amount || isNaN(amount)) return

      const type = tipoLancamento === "Entrada" ? "INCOME" : "EXPENSE"

      let description = (detalhes || lancamento || "Sem descrição")
        .toString()
        .replace(/\d{2}\/\d{2}\s\d{2}:\d{2}/g, "")
        .replace(/\s+/g, " ")
        .trim()

      description = description
        .replace(/^\d{10,}\s*/, "")
        .replace(/\s*\d{10,}$/, "")
        .trim()

      let paymentMethod = "PIX"
      const upperDesc = ((lancamento || "") + " " + description).toUpperCase()

      if (upperDesc.includes("COMPRA COM CARTÃO") || upperDesc.includes("DEBITO")) {
        paymentMethod = "DEBIT_CARD"
        description = description.replace(/COMPRA COM CARTÃO/i, "").trim()
      } else if (upperDesc.includes("POUPANÇA") || upperDesc.includes("APLICAÇÃO")) {
        paymentMethod = "PIX"
        description = "Aplicação Poupança"
      } else if (upperDesc.includes("PIX")) {
        paymentMethod = "PIX"
        description = description.replace(/(Pix - Recebido|Pix - Enviado)/i, "").trim()
      } else if (upperDesc.includes("ORDEM BANCÁRIA")) {
        paymentMethod = "PIX"
        description = description.replace("Ordem Bancária", "").trim()
      }

      if (!description || description.length < 2) description = lancamento || "Transação"

      items.push({
        id: Math.random().toString(36).substr(2, 9),
        date: isoDate,
        description: description,
        amount: amount,
        type: type,
        paymentMethod: paymentMethod,
        categoryId: "general",
        originalLine: JSON.stringify(row),
        selected: true,
      })
    })

    setParsedItems(items)
    setStep("PREVIEW")
  }

  const handleSaveSelected = async () => {
    const selectedItems = parsedItems.filter((i) => i.selected)
    const total = selectedItems.length

    // VALIDAÇÃO COM TOAST
    if (total === 0) {
      toast.warning("Nenhum item selecionado", {
        description: "Selecione pelo menos uma transação para importar.",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    for (let i = 0; i < total; i++) {
      const item = selectedItems[i]
      setCurrentProcessingItem(item.description)
      const formData = new FormData()
      formData.append("description", item.description)
      formData.append("amount", item.amount.toString())
      formData.append("type", item.type)
      formData.append("paymentMethod", item.paymentMethod)
      formData.append("date", item.date)
      if (item.categoryId !== "general") formData.append("categoryId", item.categoryId)

      try {
        await createTransaction(formData)
      } catch (error) {
        console.error("Erro ao salvar:", item.description)
      }
      setProgress(Math.round(((i + 1) / total) * 100))
      await new Promise((resolve) => setTimeout(resolve, 20))
    }

    setTimeout(() => {
      setIsProcessing(false)
      setStep("SUCCESS")
      setParsedItems([])
      if (fileInputRef.current) fileInputRef.current.value = ""

      // TOAST DE SUCESSO FINAL
      toast.success("Importação concluída", {
        description: `${total} transações foram salvas com sucesso.`,
        icon: <CheckCircle2 className="text-emerald-500" />,
      })
    }, 500)
  }

  const toggleSelect = (id: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    )
  }

  // --- TELA DE SUCESSO ---
  if (step === "SUCCESS") {
    return (
      <Card className="relative flex h-full min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-xl backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-emerald-500/5 blur-[80px]" />

        <div className="z-10 flex flex-col items-center gap-6 duration-500 animate-in zoom-in-95">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-lg">
            <Check size={32} strokeWidth={2.5} />
          </div>
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-bold text-white">Importação Concluída</h2>
            <p className="text-sm text-zinc-400">Suas transações foram salvas.</p>
          </div>
          <Button
            onClick={() => setStep("UPLOAD")}
            className="mt-2 h-10 rounded-xl bg-white px-6 text-sm font-semibold text-black shadow-md hover:bg-zinc-200"
          >
            Importar Novo Arquivo
          </Button>
        </div>
      </Card>
    )
  }

  // --- TELA DE UPLOAD ---
  if (step === "UPLOAD") {
    return (
      <Card className="relative h-full overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-xl backdrop-blur-xl">
        {isProcessing && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-zinc-950/80 backdrop-blur-sm">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
            <p className="animate-pulse text-sm font-medium text-white">Processando arquivo...</p>
          </div>
        )}
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white">
            <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-500">
              <Upload size={16} />
            </div>
            Importar Extrato
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] flex-col items-center justify-center p-6">
          <div
            className="group relative flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/10 bg-black/20 transition-all hover:border-white/20 hover:bg-white/5"
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Ícone menor e mais elegante */}
            <div className="mb-3 rounded-2xl border border-white/5 bg-zinc-900/80 p-4 shadow-lg transition-transform group-hover:scale-105">
              <FileSpreadsheet
                size={24}
                className="text-zinc-400 transition-colors group-hover:text-emerald-400"
              />
            </div>

            <div className="space-y-1 text-center">
              <p className="text-sm font-medium text-zinc-300 transition-colors group-hover:text-white">
                Selecionar arquivo
              </p>
              {/* Texto genérico sem citar bancos */}
              <p className="text-[10px] text-zinc-500">Suporta arquivos .xlsx ou .csv</p>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={handleFileUpload}
          />
        </CardContent>
      </Card>
    )
  }

  // --- TELA DE PREVIEW ---
  return (
    <Card className="relative flex h-full max-h-[600px] w-full flex-col overflow-hidden rounded-3xl border-white/5 bg-zinc-900/40 shadow-xl backdrop-blur-xl">
      {isProcessing && <LoadingOverlay progress={progress} currentItem={currentProcessingItem} />}

      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-zinc-950/20 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/10 bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-white">Conferir Dados</CardTitle>
            <p className="text-[10px] text-zinc-400">
              {parsedItems.filter((i) => i.selected).length} itens
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep("UPLOAD")}
          disabled={isProcessing}
          className="h-8 rounded-lg text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          <X size={14} className="mr-1.5" /> Cancelar
        </Button>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        {/* Header da Lista - Compacto */}
        <div className="grid grid-cols-12 gap-3 border-b border-white/5 bg-white/[0.02] px-5 py-2 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-3">Data</div>
          <div className="col-span-5">Descrição</div>
          <div className="col-span-3 text-right">Valor</div>
        </div>

        {/* Lista Scrollável */}
        <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
          {parsedItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-500">
              <FileSpreadsheet size={24} className="opacity-20" />
              <p className="text-xs">Nenhum dado encontrado.</p>
            </div>
          ) : (
            parsedItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "grid cursor-pointer grid-cols-12 items-center gap-3 rounded-xl border border-transparent p-2.5 transition-all",
                  item.selected
                    ? "bg-zinc-900/40 hover:bg-white/5"
                    : "opacity-40 grayscale hover:opacity-60"
                )}
                onClick={() => toggleSelect(item.id)}
              >
                <div className="col-span-1 flex justify-center">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={() => toggleSelect(item.id)}
                    className="h-4 w-4 rounded border-white/20 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-black"
                  />
                </div>

                <div className="col-span-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300">
                    <Calendar size={10} className="text-zinc-600" />
                    {new Date(item.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>
                  <Badge
                    variant="outline"
                    className={`h-4 w-fit rounded border-0 px-1 py-0 text-[9px] ${item.type === "INCOME" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}
                  >
                    {item.type === "INCOME" ? "Entrada" : "Saída"}
                  </Badge>
                </div>

                <div className="col-span-5 min-w-0 pr-2">
                  <p
                    className="truncate text-xs font-medium text-zinc-300"
                    title={item.description}
                  >
                    {item.description}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <CreditCard size={9} className="text-zinc-600" />
                    <span className="text-[9px] uppercase tracking-wide text-zinc-500">
                      {item.paymentMethod.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="col-span-3 text-right">
                  <span
                    className={`font-mono text-xs font-bold tracking-tight ${item.type === "INCOME" ? "text-emerald-400" : "text-zinc-300"}`}
                  >
                    {item.type === "INCOME" ? "+" : "-"}{" "}
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      item.amount
                    )}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="z-10 flex items-center justify-between border-t border-white/5 bg-zinc-950/30 p-4 backdrop-blur-md">
          <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            <span className="mr-1 text-sm font-bold text-white">
              {parsedItems.filter((i) => i.selected).length}
            </span>{" "}
            selecionados
          </div>

          <Button
            onClick={handleSaveSelected}
            disabled={isProcessing || parsedItems.filter((i) => i.selected).length === 0}
            className="h-9 rounded-xl bg-white px-5 text-xs font-bold text-black shadow-lg shadow-white/5 transition-transform hover:bg-zinc-200 active:scale-95"
          >
            Confirmar <ArrowRight className="ml-1.5" size={14} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
