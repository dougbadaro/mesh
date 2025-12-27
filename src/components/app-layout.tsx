'use client'

import { cn } from "@/lib/utils"
import { Sidebar } from "./sidebar"
import { MobileNavbar } from "./mobile-navbar"

interface UserProps {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface AppLayoutProps {
  children: React.ReactNode
  user?: UserProps | null 
}

export function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-950 selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* 1. BACKGROUND SUTIL (Atmosfera Apple) */}
      <div className="fixed inset-0 w-full h-full pointer-events-none -z-50 overflow-hidden">
          {/* Noise muito leve para textura "matte" */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
          
          {/* Luzes de fundo reduzidas e mais difusas */}
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[100px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px] mix-blend-screen" />
      </div>
      
      {/* 2. SIDEBAR (Desktop) */}
      {user && (
        <Sidebar 
          user={user} 
          // Reduzi a largura da Sidebar para 260px (precisaremos ajustar no arquivo sidebar.tsx também)
          className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-[260px]" 
        />
      )}

      {/* 3. CONTEÚDO PRINCIPAL */}
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out min-h-screen",
        // Ajustado padding-left para 260px para combinar com a nova sidebar mais fina
        user ? "md:pl-[260px]" : "" 
      )}>
          {/* Container mais contido e paddings menores (p-6 em vez de p-8) */}
          <div className="max-w-[1600px] mx-auto w-full p-4 pb-28 md:p-6 md:pb-8">
             {children}
          </div>
      </main>

      {/* 4. NAVBAR MOBILE */}
      {user && (
         <div className="md:hidden">
            <MobileNavbar user={user} />
         </div>
      )}

    </div>
  )
}