'use client'

import { useState, useRef } from "react"
import * as XLSX from 'xlsx'
import { createTransaction } from "@/app/actions/transactions"
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  X, 
  Loader2, 
  Save,
  Check,
  Calendar,
  CreditCard
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface Category {
  id: string
  name: string
}

// Interface flexível para leitura
interface ExcelRow {
  "Data"?: string;
  "Lançamento"?: string;
  "Detalhes"?: string;
  "Valor"?: string | number;
  "Tipo Lançamento"?: string;
  [key: string]: unknown;
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

function LoadingOverlay({ progress, currentItem }: { progress: number, currentItem: string }) {
  return (
    <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-sm space-y-6 text-center">
            <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-500">{progress}%</div>
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Importando Transações</h3>
                <p className="text-sm text-zinc-400 h-6 truncate max-w-[250px] mx-auto bg-zinc-900/50 rounded px-2 py-0.5 border border-white/5 transition-all">{currentItem}</p>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div className="h-full bg-emerald-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-zinc-600">Por favor, aguarde...</p>
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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as ExcelRow[];
      processExcelData(jsonData);
    } catch (error) {
      console.error("Erro ao ler Excel:", error);
      alert("Erro ao ler o arquivo.");
    } finally {
      setIsProcessing(false);
    }
  }

  // --- LÓGICA RÍGIDA ---
  const processExcelData = (rows: ExcelRow[]) => {
    const items: ParsedTransaction[] = [];

    rows.forEach((row) => {
      const rawDate = row['Data'];            
      const lancamento = (row['Lançamento'] || "").trim();   
      const detalhes = (row['Detalhes'] || "").trim();       
      const rawValue = row['Valor'];          
      const tipoLancamento = (row['Tipo Lançamento'] || "").trim(); // Remove espaços extras

      // 1. FILTRO DE TIPO: Se não for explicitamente Entrada ou Saída, IGNORA.
      // Isso mata Saldo Anterior, Saldo do Dia, Linhas vazias, etc.
      if (tipoLancamento !== "Entrada" && tipoLancamento !== "Saída") {
        return;
      }

      // 2. Filtro de Data
      if (!rawDate || rawDate.includes('00/00/0000')) return;

      // 3. Filtro de Valor
      if (!rawValue) return;

      // Tratamento
      const [day, month, year] = rawDate.split('/');
      const isoDate = `${year}-${month}-${day}`;

      const cleanValueStr = String(rawValue).replace(/['"]/g, '').replace(/\./g, '').replace(',', '.');
      const amount = Math.abs(parseFloat(cleanValueStr)); 

      if (!amount || isNaN(amount)) return;

      const type = tipoLancamento === "Entrada" ? "INCOME" : "EXPENSE";

      let description = (detalhes || lancamento || "Sem descrição")
        .toString()
        .replace(/\d{2}\/\d{2}\s\d{2}:\d{2}/g, "") 
        .replace(/\s+/g, " ")
        .trim();

      description = description.replace(/^\d{10,}\s*/, "").replace(/\s*\d{10,}$/, "").trim();

      let paymentMethod = "PIX"; 
      const upperDesc = ((lancamento || "") + " " + description).toUpperCase();

      if (upperDesc.includes("COMPRA COM CARTÃO") || upperDesc.includes("DEBITO")) {
        paymentMethod = "DEBIT_CARD";
        description = description.replace(/COMPRA COM CARTÃO/i, "").trim();
      } else if (upperDesc.includes("POUPANÇA") || upperDesc.includes("APLICAÇÃO")) {
        paymentMethod = "PIX"; 
        description = "Aplicação Poupança";
      } else if (upperDesc.includes("PIX")) {
        paymentMethod = "PIX";
        description = description.replace(/(Pix - Recebido|Pix - Enviado)/i, "").trim();
      } else if (upperDesc.includes("ORDEM BANCÁRIA")) {
        paymentMethod = "PIX";
        description = description.replace("Ordem Bancária", "").trim();
      }

      if (!description || description.length < 2) description = lancamento || "Transação";

      items.push({
        id: Math.random().toString(36).substr(2, 9),
        date: isoDate,
        description: description,
        amount: amount,
        type: type,
        paymentMethod: paymentMethod,
        categoryId: "general",
        originalLine: JSON.stringify(row),
        selected: true
      });
    });

    setParsedItems(items);
    setStep("PREVIEW");
  }

  const handleSaveSelected = async () => {
    const selectedItems = parsedItems.filter(i => i.selected);
    const total = selectedItems.length;
    if (total === 0) return;
    setIsProcessing(true);
    setProgress(0);
    let successCount = 0;

    for (let i = 0; i < total; i++) {
      const item = selectedItems[i];
      setCurrentProcessingItem(item.description);
      const formData = new FormData();
      formData.append('description', item.description);
      formData.append('amount', item.amount.toString());
      formData.append('type', item.type);
      formData.append('paymentMethod', item.paymentMethod);
      formData.append('date', item.date);
      if (item.categoryId !== 'general') formData.append('categoryId', item.categoryId);

      try {
        await createTransaction(formData);
        successCount++;
      } catch (error) {
        console.error("Erro ao salvar:", item.description);
      }
      setProgress(Math.round(((i + 1) / total) * 100));
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setTimeout(() => {
        setIsProcessing(false);
        setStep("SUCCESS");
        setParsedItems([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, 500);
  }

  const toggleSelect = (id: string) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item))
  }

  if (step === "SUCCESS") {
      return (
        <Card className="bg-zinc-900/80 backdrop-blur-md border-white/5 shadow-2xl h-full flex flex-col items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <Check size={48} strokeWidth={3} />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Importação Concluída!</h2>
                    <p className="text-zinc-400">Transações salvas com sucesso.</p>
                </div>
                <Button onClick={() => setStep("UPLOAD")} className="mt-4 bg-zinc-100 text-zinc-900 hover:bg-white font-bold px-8 h-12 rounded-xl">Importar Novo Arquivo</Button>
            </div>
        </Card>
      )
  }

  if (step === "UPLOAD") {
    return (
      <Card className="bg-zinc-900/80 backdrop-blur-md border-white/5 shadow-2xl h-full relative overflow-hidden">
        {isProcessing && (
           <div className="absolute inset-0 bg-zinc-950/60 z-50 flex flex-col items-center justify-center backdrop-blur-sm gap-3">
             <Loader2 className="animate-spin text-emerald-500" size={40}/>
             <p className="text-sm font-medium text-white">Lendo Arquivo...</p>
           </div>
        )}
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Upload size={20} className="text-emerald-500" />
            Importar Extrato (Excel/XLSX)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-full h-48 border-2 border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-emerald-500/50 transition-all group" onClick={() => fileInputRef.current?.click()}>
            <div className="p-4 bg-zinc-900 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-lg">
               <FileSpreadsheet size={32} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <p className="text-sm font-medium text-zinc-300 group-hover:text-white">Clique para selecionar o arquivo</p>
            <p className="text-xs text-zinc-500 mt-1">Suporta arquivos .xlsx ou .csv</p>
          </div>
          <input type="file" ref={fileInputRef} accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900/80 backdrop-blur-md border-white/5 shadow-2xl w-full relative overflow-hidden">
      {isProcessing && <LoadingOverlay progress={progress} currentItem={currentProcessingItem} />}
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
        <CardTitle className="flex items-center gap-2 text-white">
          <CheckCircle2 size={20} className="text-emerald-500" />
          Conferir Importação ({parsedItems.filter(i => i.selected).length})
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setStep("UPLOAD")} disabled={isProcessing} className="text-zinc-400 hover:text-white"><X size={16} className="mr-2" /> Cancelar</Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-white/[0.02] text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
           <div className="col-span-1 text-center">Imp.</div>
           <div className="col-span-2">Data</div>
           <div className="col-span-5">Descrição</div>
           <div className="col-span-4 text-right">Valor</div>
        </div>
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2 space-y-1">
          {parsedItems.length === 0 ? (
            <div className="text-center py-10 space-y-2"><p className="text-zinc-400 font-medium">Nenhuma transação válida encontrada.</p></div>
          ) : (
            parsedItems.map((item) => (
                <div key={item.id} className={`grid grid-cols-12 gap-4 p-3 rounded-lg border items-center transition-all hover:bg-white/[0.02] ${item.selected ? "bg-zinc-950/60 border-white/5" : "bg-zinc-950/20 border-transparent opacity-40 grayscale"}`}>
                  <div className="col-span-1 flex justify-center">
                      <Checkbox checked={item.selected} onCheckedChange={() => toggleSelect(item.id)} className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-xs">
                         <Calendar size={10} className="text-zinc-600" />
                         {new Date(item.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                      </div>
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 border-0 w-fit ${item.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{item.type === 'INCOME' ? 'Entrada' : 'Saída'}</Badge>
                  </div>
                  <div className="col-span-5 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate" title={item.description}>{item.description}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                         <CreditCard size={10} className="text-zinc-600" />
                         <span className="text-[10px] text-zinc-500 uppercase">{item.paymentMethod.replace('_', ' ')}</span>
                      </div>
                  </div>
                  <div className="col-span-4 text-right">
                      <span className={`font-mono text-sm font-bold tabular-nums ${item.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>{item.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}</span>
                  </div>
                </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-white/5 flex justify-between items-center bg-zinc-950/30">
           <div className="text-xs text-zinc-500"><span className="text-white font-bold">{parsedItems.filter(i => i.selected).length}</span> transações selecionadas</div>
           <Button onClick={handleSaveSelected} disabled={isProcessing || parsedItems.filter(i => i.selected).length === 0} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 shadow-lg shadow-emerald-900/20"><Save className="mr-2" size={18} /> Confirmar Importação</Button>
        </div>
      </CardContent>
    </Card>
  )
}