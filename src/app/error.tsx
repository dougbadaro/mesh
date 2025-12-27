'use client' // Componentes de erro DEVEM ser client side

import { useEffect } from "react"
import { AlertTriangle, RefreshCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log do erro
    console.error("ERRO CRÍTICO CAPTURADO:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6 overflow-hidden relative">
      
      {/* Background (Luzes de Alerta) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none -z-10">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-rose-500/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-orange-500/5 blur-[100px]" />
      </div>

      <Card className="max-w-sm w-full bg-zinc-900/40 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-3xl overflow-hidden">
        <CardContent className="flex flex-col items-center text-center p-8 space-y-6">
          
          {/* Ícone Estilo App */}
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center border border-rose-500/10 shadow-inner">
            <AlertTriangle size={28} className="text-rose-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Algo deu errado</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-[260px] mx-auto">
              Não foi possível carregar as informações. Verifique sua conexão ou tente novamente.
            </p>
            
            {/* Código do Erro (Compacto) */}
            <div className="mt-4 p-3 bg-black/30 rounded-xl border border-white/5 text-left overflow-hidden">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Detalhes do Sistema</p>
                <code className="text-[10px] text-rose-300/80 font-mono break-all line-clamp-3">
                  {error.message || "Unknown Error"}
                </code>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full pt-2">
            <Button 
              onClick={reset} 
              className="w-full bg-white text-black hover:bg-zinc-200 h-10 rounded-xl font-bold text-xs shadow-lg shadow-white/5 transition-transform active:scale-[0.98]"
            >
              <RefreshCcw size={14} className="mr-2" />
              Tentar Novamente
            </Button>
            
            <Button 
                variant="ghost" 
                className="w-full h-10 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 text-xs font-medium" 
                asChild
            >
              <Link href="/">
                 <Home size={14} className="mr-2" />
                 Voltar ao Início
              </Link>
            </Button>
          </div>

        </CardContent>
      </Card>
      
      {/* Footer Fixo */}
      <div className="absolute bottom-8 text-center w-full">
         <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-semibold opacity-60">
           Mesh System Error Handler
         </p>
      </div>
    </div>
  )
}