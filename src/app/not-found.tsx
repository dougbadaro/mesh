import { ArrowLeft, FileQuestion, Home } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-6">
      {/* Background (Luzes Sutis) */}
      <div className="pointer-events-none absolute inset-0 -z-10 h-full w-full">
        <div className="absolute left-1/2 top-[-20%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-zinc-800/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <Card className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 shadow-2xl backdrop-blur-2xl">
        <CardContent className="flex flex-col items-center space-y-6 p-8 text-center">
          {/* Ícone Estilo App */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 shadow-inner">
            <FileQuestion size={28} className="text-zinc-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold tracking-tight text-white">Página não encontrada</h2>
            <p className="mx-auto max-w-[240px] text-xs leading-relaxed text-zinc-400">
              O recurso que você procura foi movido, deletado ou nunca existiu.
            </p>

            {/* Código 404 Decorativo */}
            <div className="mt-4 inline-flex items-center justify-center rounded-full border border-white/5 bg-black/30 px-3 py-1">
              <span className="font-mono text-[10px] font-bold tracking-widest text-zinc-500">
                ERROR 404
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 pt-2">
            <Button
              asChild
              className="h-10 w-full rounded-xl bg-white text-xs font-bold text-black shadow-lg shadow-white/5 transition-transform hover:bg-zinc-200 active:scale-[0.98]"
            >
              <Link href="/">
                <Home size={14} className="mr-2" />
                Ir para o Início
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="h-10 w-full rounded-xl text-xs font-medium text-zinc-500 hover:bg-white/5 hover:text-white"
              asChild
            >
              <Link href="javascript:history.back()">
                <ArrowLeft size={14} className="mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Fixo */}
      <div className="absolute bottom-8 w-full text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-700 opacity-60">
          Mesh System
        </p>
      </div>
    </div>
  )
}
