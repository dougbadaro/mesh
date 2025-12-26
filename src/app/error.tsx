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
    // Aqui você poderia enviar o erro para um serviço de log (Sentry, etc)
    console.error("ERRO CRÍTICO CAPTURADO:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
      {/* Fundo Gradiente para manter identidade */}
      <div className="fixed inset-0 w-full h-full pointer-events-none -z-50">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-red-500/5 blur-[120px]" />
      </div>

      <Card className="max-w-md w-full bg-zinc-900/50 backdrop-blur-xl border-red-900/20 shadow-2xl">
        <CardContent className="flex flex-col items-center text-center p-8 space-y-6">
          
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <AlertTriangle size={40} className="text-red-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Ops! Algo deu errado.</h2>
            <p className="text-zinc-400 text-sm">
              Encontramos um problema ao processar sua solicitação. Pode ser uma falha de conexão ou no banco de dados.
            </p>
            {/* Em produção, evite mostrar error.message cru para o usuário, mas em dev ajuda */}
            <div className="bg-black/30 p-3 rounded-lg border border-white/5 mt-4">
               <code className="text-xs text-red-400 font-mono break-all">
                 {error.message || "Erro desconhecido"}
               </code>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
            <Button 
              onClick={reset} 
              className="flex-1 bg-white text-black hover:bg-zinc-200"
            >
              <RefreshCcw size={16} className="mr-2" />
              Tentar Novamente
            </Button>
            
            <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5" asChild>
              <Link href="/">
                 <Home size={16} className="mr-2" />
                 Início
              </Link>
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}