import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { LoginForm } from "@/components/login-form" 
import Image from "next/image" 
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

// Certifique-se que seu arquivo 'mesh.png' (a imagem branca que você enviou)
// está na pasta 'src/assets/'
import meshLogo from "@/assets/mesh.png" 

export default async function LoginPage() {
  const session = await auth()
  
  if (session) {
    redirect("/")
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-zinc-950 selection:bg-emerald-500/30">
      
      {/* Background (Luzes e Grid) - Mantido */}
      <div className="absolute inset-0 w-full h-full -z-10">
         <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="w-full max-w-[400px] px-6 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
        
        {/* === ÁREA DA LOGO === */}
        <div className="flex flex-col items-center text-center mb-8">
           {/* AJUSTE DE TAMANHO:
             Mudei de 'w-48' para 'w-32'. Isso reduz a largura total da imagem,
             deixando o texto visualmente menor e mais proporcional.
           */}
           <Image 
              src={meshLogo} 
              alt="Mesh Logo" 
              className="w-32 h-auto object-contain drop-shadow-2xl"
              priority 
           />
        </div>
        {/* ========================== */}

        {/* CARD DE LOGIN (Sem alterações) */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative group">
           <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
           
           <div className="relative">
               <div className="mb-6 text-center">
                 <h2 className="text-sm font-medium text-zinc-200">Acesse sua conta</h2>
               </div>

               <LoginForm />

               <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-1">
                 <p className="text-xs text-zinc-500 leading-relaxed">
                   Ao entrar, você concorda com nossos
                 </p>
                 
                 {/* MODAIS (Termos e Privacidade) - Sem alterações */}
                 <div className="flex items-center justify-center gap-1 text-xs">
                   <Dialog>
                     <DialogTrigger className="underline hover:text-emerald-400 transition-colors text-zinc-400 cursor-pointer">
                       Termos de Uso
                     </DialogTrigger>
                     <DialogContent className="bg-zinc-950 border-white/10 text-zinc-200 max-w-md">
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

                   <span className="text-zinc-600">e</span>

                   <Dialog>
                     <DialogTrigger className="underline hover:text-emerald-400 transition-colors text-zinc-400 cursor-pointer">
                       Privacidade
                     </DialogTrigger>
                     <DialogContent className="bg-zinc-950 border-white/10 text-zinc-200 max-w-md">
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
      
      {/* Footer */}
      <div className="absolute bottom-6 text-center w-full">
         <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold opacity-50">
            © {new Date().getFullYear()} Mesh Finance
         </p>
      </div>

    </div>
  )
}