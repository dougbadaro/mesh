"use client" // Componentes de erro DEVEM ser client side

import { useEffect } from "react"
import { AlertTriangle, Home, RefreshCcw } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-6">
      {/* Background (Luzes de Alerta) */}
      <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full">
        <div className="absolute left-1/2 top-[-20%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-rose-500/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-orange-500/5 blur-[100px]" />
      </div>

      <Card className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 shadow-2xl backdrop-blur-2xl">
        <CardContent className="flex flex-col items-center space-y-6 p-8 text-center">
          {/* Ícone Estilo App */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/10 bg-gradient-to-br from-rose-500/20 to-orange-500/20 shadow-inner">
            <AlertTriangle size={28} className="text-rose-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold tracking-tight text-white">Algo deu errado</h2>
            <p className="mx-auto max-w-[260px] text-xs leading-relaxed text-zinc-400">
              Não foi possível carregar as informações. Verifique sua conexão ou tente novamente.
            </p>

            {/* Código do Erro (Compacto) */}
            <div className="mt-4 overflow-hidden rounded-xl border border-white/5 bg-black/30 p-3 text-left">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                Detalhes do Sistema
              </p>
              <code className="line-clamp-3 break-all font-mono text-[10px] text-rose-300/80">
                {error.message || "Unknown Error"}
              </code>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 pt-2">
            <Button
              onClick={reset}
              className="h-10 w-full rounded-xl bg-white text-xs font-bold text-black shadow-lg shadow-white/5 transition-transform hover:bg-zinc-200 active:scale-[0.98]"
            >
              <RefreshCcw size={14} className="mr-2" />
              Tentar Novamente
            </Button>

            <Button
              variant="ghost"
              className="h-10 w-full rounded-xl text-xs font-medium text-zinc-500 hover:bg-white/5 hover:text-white"
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
      <div className="absolute bottom-8 w-full text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-700 opacity-60">
          Mesh System Error Handler
        </p>
      </div>
    </div>
  )
}
