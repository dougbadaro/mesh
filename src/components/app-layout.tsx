"use client"

import { cn } from "@/lib/utils"

import { MobileNavbar } from "./mobile-navbar"
import { Sidebar } from "./sidebar"

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
      <div className="pointer-events-none fixed inset-0 -z-50 h-full w-full overflow-hidden">
        {/* Noise muito leve para textura "matte" */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>

        {/* Luzes de fundo reduzidas e mais difusas */}
        <div className="absolute left-[-5%] top-[-10%] h-[500px] w-[500px] rounded-full bg-emerald-500/5 mix-blend-screen blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-500/5 mix-blend-screen blur-[100px]" />
      </div>

      {/* 2. SIDEBAR (Desktop) */}
      {user && (
        <Sidebar
          user={user}
          // Reduzi a largura da Sidebar para 260px (precisaremos ajustar no arquivo sidebar.tsx também)
          className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] md:flex"
        />
      )}

      {/* 3. CONTEÚDO PRINCIPAL */}
      <main
        className={cn(
          "min-h-screen flex-1 transition-all duration-300 ease-in-out",
          // Ajustado padding-left para 260px para combinar com a nova sidebar mais fina
          user ? "md:pl-[260px]" : ""
        )}
      >
        {/* Container mais contido e paddings menores (p-6 em vez de p-8) */}
        <div className="mx-auto w-full max-w-[1600px] p-4 pb-28 md:p-6 md:pb-8">{children}</div>
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
