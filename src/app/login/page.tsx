import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { LoginForm } from "@/components/login-form" // Importe o componente novo

export default async function LoginPage() {
  const session = await auth()
  
  if (session) {
    redirect("/")
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-zinc-950 selection:bg-emerald-500/30">
      
      {/* === BACKGROUND (Luzes e Grid) === */}
      <div className="absolute inset-0 w-full h-full -z-10">
         <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="w-full max-w-[400px] px-6 animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
        
        {/* LOGO TEXTUAL */}
        <div className="flex flex-col items-center text-center mb-12">
           <h1 className="text-6xl font-extrabold tracking-tighter text-white drop-shadow-2xl">
             Mesh<span className="text-emerald-500">.</span>
           </h1>
        </div>

        {/* CARD DE LOGIN */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
           <div className="mb-6 text-center">
              <h2 className="text-sm font-medium text-zinc-200">Acesse sua conta</h2>
           </div>

           {/* Aqui entra o Componente Client-Side com a animação */}
           <LoginForm />

           <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Ao entrar, você concorda com nossos <br/>
                <a href="#" className="underline hover:text-zinc-300 transition-colors">Termos de Uso</a> e <a href="#" className="underline hover:text-zinc-300 transition-colors">Privacidade</a>.
              </p>
           </div>
        </div>

      </div>
      
      {/* Footer discreto */}
      <div className="absolute bottom-6 text-center w-full">
         <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold opacity-50">
            © {new Date().getFullYear()} Mesh Finance
         </p>
      </div>

    </div>
  )
}