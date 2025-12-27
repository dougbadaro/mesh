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
  Check,
  Calendar,
  CreditCard,
  ArrowRight,
  AlertCircle // <--- Novo ícone
} from "lucide-react"
import { toast } from "sonner" // <--- Importação do Sonner

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
}

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

// Overlay de Carregamento (Dentro do Card)
function LoadingOverlay({ progress, currentItem }: { progress: number, currentItem: string }) {
  return (
    <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 rounded-3xl">
        <div className="w-full max-w-[280px] space-y-6 text-center">
            {/* Spinner Apple Style */}
            <div className="relative w-14 h-14 mx-auto">
                <div className="absolute inset-0 border-2 border-white/5 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-500">{progress}%</div>
            </div>
            
            <div className="space-y-1">
                <h3 className="text-base font-semibold text-white tracking-tight">Processando...</h3>
                <div className="h-5 flex items-center justify-center">
                    <span className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                        {currentItem}
                    </span>
                </div>
            </div>
            
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false }) as ExcelRow[];
      processExcelData(jsonData);
    } catch (error) {
      console.error("Erro ao ler Excel:", error);
      // TOAST DE ERRO
      toast.error("Erro ao ler arquivo", {
        description: "Certifique-se que é um arquivo .xlsx ou .csv válido.",
        icon: <AlertCircle className="text-rose-500" />
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const processExcelData = (rows: ExcelRow[]) => {
    const items: ParsedTransaction[] = [];

    rows.forEach((row) => {
      const rawDate = row['Data'];            
      const lancamento = (row['Lançamento'] || "").trim();   
      const detalhes = (row['Detalhes'] || "").trim();       
      const rawValue = row['Valor'];          
      const tipoLancamento = (row['Tipo Lançamento'] || "").trim();

      if (tipoLancamento !== "Entrada" && tipoLancamento !== "Saída") return;
      if (!rawDate || rawDate.includes('00/00/0000')) return;
      if (!rawValue) return;

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
    
    // VALIDAÇÃO COM TOAST
    if (total === 0) {
        toast.warning("Nenhum item selecionado", {
            description: "Selecione pelo menos uma transação para importar."
        });
        return;
    }

    setIsProcessing(true);
    setProgress(0);
    
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
      } catch (error) {
        console.error("Erro ao salvar:", item.description);
      }
      setProgress(Math.round(((i + 1) / total) * 100));
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    setTimeout(() => {
        setIsProcessing(false);
        setStep("SUCCESS");
        setParsedItems([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        
        // TOAST DE SUCESSO FINAL
        toast.success("Importação concluída", {
            description: `${total} transações foram salvas com sucesso.`,
            icon: <CheckCircle2 className="text-emerald-500" />
        })

    }, 500);
  }

  const toggleSelect = (id: string) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item))
  }

  // --- TELA DE SUCESSO ---
  if (step === "SUCCESS") {
      return (
        <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 shadow-xl h-full flex flex-col items-center justify-center min-h-[300px] rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] pointer-events-none" />
            
            <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500 z-10">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-lg">
                    <Check size={32} strokeWidth={2.5} />
                </div>
                <div className="text-center space-y-1">
                    <h2 className="text-xl font-bold text-white">Importação Concluída</h2>
                    <p className="text-zinc-400 text-sm">Suas transações foram salvas.</p>
                </div>
                <Button onClick={() => setStep("UPLOAD")} className="mt-2 bg-white text-black hover:bg-zinc-200 font-semibold px-6 h-10 rounded-xl text-sm shadow-md">
                    Importar Novo Arquivo
                </Button>
            </div>
        </Card>
      )
  }

  // --- TELA DE UPLOAD ---
  if (step === "UPLOAD") {
    return (
      <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 shadow-xl h-full relative overflow-hidden rounded-3xl">
        {isProcessing && (
           <div className="absolute inset-0 bg-zinc-950/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm gap-3">
             <Loader2 className="animate-spin text-emerald-500" size={32}/>
             <p className="text-sm font-medium text-white animate-pulse">Processando arquivo...</p>
           </div>
        )}
        <CardHeader className="border-b border-white/5 py-4 px-6">
          <CardTitle className="flex items-center gap-2 text-white text-sm font-medium uppercase tracking-wider">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500">
               <Upload size={16} />
            </div>
            Importar Extrato
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px] p-6">
          
          <div 
            className="w-full h-full border border-dashed border-white/10 rounded-2xl bg-black/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all group relative overflow-hidden" 
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Ícone menor e mais elegante */}
            <div className="p-4 bg-zinc-900/80 rounded-2xl mb-3 group-hover:scale-105 transition-transform shadow-lg border border-white/5">
               <FileSpreadsheet size={24} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
            </div>
            
            <div className="text-center space-y-1">
                <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Selecionar arquivo</p>
                {/* Texto genérico sem citar bancos */}
                <p className="text-[10px] text-zinc-500">Suporta arquivos .xlsx ou .csv</p>
            </div>
          </div>
          
          <input type="file" ref={fileInputRef} accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} />
        </CardContent>
      </Card>
    )
  }

  // --- TELA DE PREVIEW ---
  return (
    <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 shadow-xl w-full relative overflow-hidden rounded-3xl flex flex-col h-full max-h-[600px]">
      
      {isProcessing && <LoadingOverlay progress={progress} currentItem={currentProcessingItem} />}
      
      <CardHeader className="flex flex-row items-center justify-between py-4 px-5 border-b border-white/5 bg-zinc-950/20">
        <div className="flex items-center gap-3">
           <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/10">
              <CheckCircle2 size={16} />
           </div>
           <div>
              <CardTitle className="text-sm font-bold text-white">Conferir Dados</CardTitle>
              <p className="text-[10px] text-zinc-400">
                 {parsedItems.filter(i => i.selected).length} itens
              </p>
           </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setStep("UPLOAD")} disabled={isProcessing} className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg h-8 text-xs">
            <X size={14} className="mr-1.5" /> Cancelar
        </Button>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
        {/* Header da Lista - Compacto */}
        <div className="grid grid-cols-12 gap-3 px-5 py-2 bg-white/[0.02] border-b border-white/5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
           <div className="col-span-1 text-center">#</div>
           <div className="col-span-3">Data</div>
           <div className="col-span-5">Descrição</div>
           <div className="col-span-3 text-right">Valor</div>
        </div>

        {/* Lista Scrollável */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {parsedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                <FileSpreadsheet size={24} className="opacity-20" />
                <p className="text-xs">Nenhum dado encontrado.</p>
            </div>
          ) : (
            parsedItems.map((item) => (
                <div 
                    key={item.id} 
                    className={cn(
                        "grid grid-cols-12 gap-3 p-2.5 rounded-xl items-center transition-all cursor-pointer border border-transparent",
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
                        className="border-white/20 w-4 h-4 rounded data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-black" 
                      />
                  </div>
                  
                  <div className="col-span-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-[11px]">
                          <Calendar size={10} className="text-zinc-600" />
                          {new Date(item.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                      </div>
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 border-0 w-fit rounded ${item.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {item.type === 'INCOME' ? 'Entrada' : 'Saída'}
                      </Badge>
                  </div>
                  
                  <div className="col-span-5 min-w-0 pr-2">
                      <p className="text-xs font-medium text-zinc-300 truncate" title={item.description}>{item.description}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                          <CreditCard size={9} className="text-zinc-600" />
                          <span className="text-[9px] text-zinc-500 uppercase tracking-wide">{item.paymentMethod.replace('_', ' ')}</span>
                      </div>
                  </div>
                  
                  <div className="col-span-3 text-right">
                      <span className={`font-mono text-xs font-bold tracking-tight ${item.type === 'INCOME' ? 'text-emerald-400' : 'text-zinc-300'}`}>
                          {item.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                      </span>
                  </div>
                </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 flex justify-between items-center bg-zinc-950/30 backdrop-blur-md z-10">
           <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">
                <span className="text-white font-bold text-sm mr-1">{parsedItems.filter(i => i.selected).length}</span> selecionados
           </div>
           
           <Button 
                onClick={handleSaveSelected} 
                disabled={isProcessing || parsedItems.filter(i => i.selected).length === 0} 
                className="bg-white text-black hover:bg-zinc-200 font-bold px-5 h-9 rounded-xl shadow-lg shadow-white/5 text-xs transition-transform active:scale-95"
            >
               Confirmar <ArrowRight className="ml-1.5" size={14} />
           </Button>
        </div>
      </CardContent>
    </Card>
  )
}