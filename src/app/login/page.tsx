import Image from "next/image"
import { redirect } from "next/navigation"

import { LoginForm } from "@/components/login-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

// Certifique-se que seu arquivo 'mesh.png' está na pasta 'src/assets/'
import meshLogo from "@/assets/mesh.png"
import { auth } from "@/auth"

export default async function LoginPage() {
  const session = await auth()

  if (session) {
    redirect("/")
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 selection:bg-emerald-500/30">
      {/* Background (Luzes e Grid) */}
      <div className="absolute inset-0 -z-10 h-full w-full">
        <div className="pointer-events-none absolute left-1/2 top-[-10%] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="z-10 w-full max-w-[380px] px-6 duration-700 animate-in fade-in zoom-in-95 slide-in-from-bottom-4">
        {/* === ÁREA DA LOGO === */}
        <div className="mb-10 flex flex-col items-center text-center">
          <Image
            src={meshLogo}
            alt="Mesh Logo"
            className="h-auto w-28 object-contain opacity-90 drop-shadow-2xl"
            priority
          />
        </div>

        {/* CARD DE LOGIN */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-xl">
          {/* Brilho Sutil no Topo */}
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="relative">
            <div className="mb-6 space-y-1 text-center">
              <h2 className="text-base font-bold tracking-tight text-white">Bem-vindo de volta</h2>
              <p className="text-xs text-zinc-500">Insira suas credenciais para continuar.</p>
            </div>

            <LoginForm />

            <div className="mt-8 flex flex-col gap-2 border-t border-white/5 pt-6 text-center">
              <p className="text-[10px] text-zinc-600">Ao entrar, você concorda com nossos</p>

              {/* MODAIS (Links Lado a Lado) */}
              <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                <Dialog>
                  <DialogTrigger className="cursor-pointer text-zinc-400 transition-colors hover:text-emerald-400">
                    Termos
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-3xl border-white/10 bg-zinc-950 text-zinc-200">
                    <DialogHeader>
                      <DialogTitle>Termos de Uso</DialogTitle>
                      <DialogDescription>Última atualização: Dezembro 2025</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] space-y-4 pr-4 text-sm text-zinc-400">
                      <p>Bem-vindo ao Mesh.</p>
                      <p className="mt-2">
                        1. <strong>Natureza do Serviço:</strong> O Mesh é um sistema de gestão
                        financeira pessoal.
                      </p>
                      <p className="mt-2">
                        2. <strong>Responsabilidade:</strong> O usuário é o único responsável pela
                        inserção dos dados.
                      </p>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                <span className="text-zinc-700">•</span>

                <Dialog>
                  <DialogTrigger className="cursor-pointer text-zinc-400 transition-colors hover:text-emerald-400">
                    Privacidade
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-3xl border-white/10 bg-zinc-950 text-zinc-200">
                    <DialogHeader>
                      <DialogTitle>Política de Privacidade</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] space-y-4 pr-4 text-sm text-zinc-400">
                      <p>Seus dados são seus.</p>
                      <p className="mt-2">
                        1. <strong>Segurança:</strong> Utilizamos criptografia e não vendemos dados.
                      </p>
                      <p className="mt-2">
                        2. <strong>Exclusão:</strong> Você pode exportar ou apagar seus dados quando
                        quiser.
                      </p>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Fixo */}
      <div className="absolute bottom-8 w-full text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-700 opacity-60">
          © {new Date().getFullYear()} Mesh Finance
        </p>
      </div>
    </div>
  )
}
