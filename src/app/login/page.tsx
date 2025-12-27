import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { LoginForm } from "@/components/login-form" 
import Image from "next/image" 
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

// Certifique-se que seu arquivo 'mesh.png' está na pasta 'src/assets/'
import meshLogo from "@/assets/mesh.png" 

export default async function LoginPage() {
  const session = await auth()
  
  if (session) {
    redirect("/")
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-zinc-950 selection:bg-emerald-500/30">
      
      {/* Background (Luzes e Grid) */}
      <div className="absolute inset-0 w-full h-full -z-10">
         <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="w-full max-w-[380px] px-6 animate-in fade-in zoom-in-95 duration-700 slide-in-from-bottom-4 z-10">
        
        {/* === ÁREA DA LOGO === */}
        <div className="flex flex-col items-center text-center mb-10">
           <Image 
              src={meshLogo} 
              alt="Mesh Logo" 
              className="w-28 h-auto object-contain drop-shadow-2xl opacity-90"
              priority 
           />
        </div>

        {/* CARD DE LOGIN */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
           {/* Brilho Sutil no Topo */}
           <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
           
           <div className="relative">
               <div className="mb-6 text-center space-y-1">
                 <h2 className="text-base font-bold text-white tracking-tight">Bem-vindo de volta</h2>
                 <p className="text-xs text-zinc-500">Insira suas credenciais para continuar.</p>
               </div>

               <LoginForm />

               <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-2">
                 <p className="text-[10px] text-zinc-600">
                   Ao entrar, você concorda com nossos
                 </p>
                 
                 {/* MODAIS (Links Lado a Lado) */}
                 <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                   <Dialog>
                     <DialogTrigger className="hover:text-emerald-400 transition-colors text-zinc-400 cursor-pointer">
                       Termos
                     </DialogTrigger>
                     <DialogContent className="bg-zinc-950 border-white/10 text-zinc-200 max-w-md rounded-3xl">
                       <DialogHeader>
                         <DialogTitle>Termos de Uso</DialogTitle>
                         <DialogDescription>Última atualização: Dezembro 2025</DialogDescription>
                       </DialogHeader>
                       <ScrollArea className="h-[300px] pr-4 text-sm text-zinc-400 space-y-4">
                         <p>Bem-vindo ao Mesh.</p>
                         <p className="mt-2">1. <strong>Natureza do Serviço:</strong> O Mesh é um sistema de gestão financeira pessoal.</p>
                         <p className="mt-2">2. <strong>Responsabilidade:</strong> O usuário é o único responsável pela inserção dos dados.</p>
                       </ScrollArea>
                     </DialogContent>
                   </Dialog>

                   <span className="text-zinc-700">•</span>

                   <Dialog>
                     <DialogTrigger className="hover:text-emerald-400 transition-colors text-zinc-400 cursor-pointer">
                       Privacidade
                     </DialogTrigger>
                     <DialogContent className="bg-zinc-950 border-white/10 text-zinc-200 max-w-md rounded-3xl">
                       <DialogHeader>
                         <DialogTitle>Política de Privacidade</DialogTitle>
                       </DialogHeader>
                       <ScrollArea className="h-[300px] pr-4 text-sm text-zinc-400 space-y-4">
                         <p>Seus dados são seus.</p>
                         <p className="mt-2">1. <strong>Segurança:</strong> Utilizamos criptografia e não vendemos dados.</p>
                         <p className="mt-2">2. <strong>Exclusão:</strong> Você pode exportar ou apagar seus dados quando quiser.</p>
                       </ScrollArea>
                     </DialogContent>
                   </Dialog>
                 </div>
               </div>
           </div>
        </div>

      </div>
      
      {/* Footer Fixo */}
      <div className="absolute bottom-8 text-center w-full">
         <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-semibold opacity-60">
           © {new Date().getFullYear()} Mesh Finance
         </p>
      </div>

    </div>
  )
}