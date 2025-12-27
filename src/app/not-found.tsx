import Link from "next/link"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6 overflow-hidden relative">
      
      {/* Background (Luzes Sutis) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none -z-10">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-zinc-800/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <Card className="max-w-sm w-full bg-zinc-900/40 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-3xl overflow-hidden">
        <CardContent className="flex flex-col items-center text-center p-8 space-y-6">
          
          {/* Ícone Estilo App */}
          <div className="w-16 h-16 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
            <FileQuestion size={28} className="text-zinc-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Página não encontrada</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-[240px] mx-auto">
              O recurso que você procura foi movido, deletado ou nunca existiu.
            </p>
            
            {/* Código 404 Decorativo */}
            <div className="mt-4 inline-flex items-center justify-center px-3 py-1 bg-black/30 rounded-full border border-white/5">
                <span className="text-[10px] text-zinc-500 font-mono font-bold tracking-widest">ERROR 404</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full pt-2">
            <Button 
              asChild
              className="w-full bg-white text-black hover:bg-zinc-200 h-10 rounded-xl font-bold text-xs shadow-lg shadow-white/5 transition-transform active:scale-[0.98]"
            >
              <Link href="/">
                <Home size={14} className="mr-2" />
                Ir para o Início
              </Link>
            </Button>
            
            <Button 
                variant="ghost" 
                className="w-full h-10 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 text-xs font-medium"
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
      <div className="absolute bottom-8 text-center w-full">
         <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-semibold opacity-60">
           Mesh System
         </p>
      </div>
    </div>
  )
}