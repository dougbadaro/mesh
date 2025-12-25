import { signIn } from "@/auth"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"

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
        
        {/* LOGO TEXTUAL (Mesh. com ponto verde) */}
        <div className="flex flex-col items-center text-center mb-12">
           <h1 className="text-6xl font-extrabold tracking-tighter text-white drop-shadow-2xl">
             Mesh<span className="text-emerald-500">.</span>
           </h1>
           <p className="text-lg font-medium text-zinc-400 tracking-widest uppercase mt-2">
             Finance
           </p>
        </div>

        {/* CARD DE LOGIN */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
           <div className="mb-6 text-center">
              <h2 className="text-sm font-medium text-zinc-200">Acesse sua conta</h2>
           </div>

           <form
              action={async () => {
                "use server"
                await signIn("google", { redirectTo: "/" })
              }}
            >
              {/* Botão Google Branco com Texto Preto */}
              <Button 
                className="w-full h-12 bg-white text-zinc-950 hover:bg-zinc-200 border-none font-bold rounded-xl flex items-center gap-3 transition-transform active:scale-95 shadow-lg" 
                type="submit"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continuar com Google
              </Button>
            </form>

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