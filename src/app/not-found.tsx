import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-white space-y-6">
      <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <FileQuestion size={80} className="relative text-zinc-500" />
      </div>
      <h2 className="text-3xl font-bold">Página não encontrada</h2>
      <p className="text-zinc-400">O recurso que você procura não existe ou foi movido.</p>
      <Button asChild variant="outline" className="border-white/10">
        <Link href="/">Voltar para o Início</Link>
      </Button>
    </div>
  )
}