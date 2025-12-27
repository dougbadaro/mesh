'use client'

import { useState } from "react"
import { Download, FileSpreadsheet, Loader2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export function ExportCsvCard() {
  const [isLoading, setIsLoading] = useState(false)
  
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState<string>(now.getMonth().toString())
  const [selectedYear, setSelectedYear] = useState<string>(now.getFullYear().toString())

  const months = [
    { value: "0", label: "Janeiro" }, { value: "1", label: "Fevereiro" },
    { value: "2", label: "Março" }, { value: "3", label: "Abril" },
    { value: "4", label: "Maio" }, { value: "5", label: "Junho" },
    { value: "6", label: "Julho" }, { value: "7", label: "Agosto" },
    { value: "8", label: "Setembro" }, { value: "9", label: "Outubro" },
    { value: "10", label: "Novembro" }, { value: "11", label: "Dezembro" },
    { value: "all", label: "Todo o Período" }
  ]

  const currentYear = now.getFullYear()
  const years = [currentYear, currentYear - 1, currentYear - 2].map(String)

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("month", selectedMonth)
      params.append("year", selectedYear)

      const response = await fetch(`/api/export/csv?${params.toString()}`)
      
      if (!response.ok) throw new Error("Erro na exportação")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const suffix = selectedMonth === 'all' ? 'completo' : `${Number(selectedMonth) + 1}-${selectedYear}`
      a.download = `mesh-relatorio-${suffix}.csv`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erro:", error)
      alert("Não foi possível gerar a planilha.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/5 rounded-3xl overflow-hidden shadow-sm">
      <CardHeader className="p-5 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10 text-emerald-500">
                <FileSpreadsheet size={18} />
            </div>
            <div>
                <CardTitle className="text-sm font-bold text-zinc-200">Relatórios</CardTitle>
                <CardDescription className="text-[10px] text-zinc-500">Selecione o período e baixe seus dados.</CardDescription>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 space-y-5">
        
        {/* Grid de Seleção */}
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Mês de Referência</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="bg-zinc-950/50 border-white/10 h-9 text-sm rounded-xl focus:ring-emerald-500/30">
                        <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 max-h-[200px]">
                        {months.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Ano Fiscal</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear} disabled={selectedMonth === 'all'}>
                    <SelectTrigger className="bg-zinc-950/50 border-white/10 h-9 text-sm rounded-xl focus:ring-emerald-500/30">
                         <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-zinc-500" />
                            <SelectValue placeholder="Ano" />
                         </div>
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                        {years.map(y => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        
        {/* Botão de Download */}
        <Button 
            onClick={handleDownload} 
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-zinc-200 h-9 text-xs font-bold rounded-xl shadow-lg shadow-white/5 transition-transform active:scale-[0.98]"
        >
            {isLoading ? (
                <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Processando...
                </>
            ) : (
                <>
                    <Download size={14} className="mr-2" />
                    Baixar Relatório {selectedMonth === 'all' ? 'Completo' : 'do Mês'}
                </>
            )}
        </Button>

      </CardContent>
    </Card>
  )
}