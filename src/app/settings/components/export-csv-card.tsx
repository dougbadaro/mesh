'use client'

import { useState } from "react"
import { Download, Table, FileSpreadsheet, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ExportCsvCard() {
  const [isLoading, setIsLoading] = useState(false)
  
  // Pega data atual para definir padrões
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

  // Gera lista de anos (Do atual para trás, ex: 2025, 2024, 2023)
  const currentYear = now.getFullYear()
  const years = [currentYear, currentYear - 1, currentYear - 2].map(String)

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      // Constrói a URL com Query Params
      const params = new URLSearchParams()
      params.append("month", selectedMonth)
      params.append("year", selectedYear)

      const response = await fetch(`/api/export/csv?${params.toString()}`)
      
      if (!response.ok) throw new Error("Erro na exportação")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Nome sugerido, mas o backend também manda no header
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
    <Card className="bg-zinc-900/20 border-white/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Table size={18} className="text-emerald-500" />
          Relatórios
        </CardTitle>
        <CardDescription>
          Selecione o período e baixe seus dados formatados para Excel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 p-4 bg-zinc-950/50 rounded-xl border border-white/5">
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-900 rounded-lg border border-white/5 hidden sm:block">
              <FileSpreadsheet className="text-emerald-400" size={24} />
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-2">
                {/* SELECT MÊS */}
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="bg-zinc-900 border-white/10 h-9">
                        <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* SELECT ANO */}
                <Select value={selectedYear} onValueChange={setSelectedYear} disabled={selectedMonth === 'all'}>
                    <SelectTrigger className="bg-zinc-900 border-white/10 h-9">
                         <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(y => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleDownload} 
            disabled={isLoading}
            className="w-full bg-zinc-100 text-black hover:bg-emerald-400 hover:text-black hover:border-emerald-500/50 transition-all font-medium"
          >
            {isLoading ? (
                <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Processando...
                </>
            ) : (
                <>
                    <Download size={16} className="mr-2" />
                    Baixar Relatório {selectedMonth === 'all' ? 'Completo' : 'do Mês'}
                </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}