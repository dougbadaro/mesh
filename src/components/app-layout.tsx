'use client'

import { cn } from "@/lib/utils"
import { Sidebar } from "./sidebar"
import { MobileNavbar } from "./mobile-navbar"

// 1. Definimos a interface do Usuário
interface UserProps {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface AppLayoutProps {
  children: React.ReactNode
  // 2. O user é opcional ou nulo, pois pode vir do servidor como undefined se não logado
  user?: UserProps | null 
}

export function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      
      {/* Verifica se user existe antes de renderizar menus */}
      {user && (
        <>
          <Sidebar 
            user={user} 
            className="hidden md:flex fixed left-0 top-0 z-40 h-screen" 
          />
          <MobileNavbar user={user} />
        </>
      )}

      <main className={cn(
        "flex-1 transition-[padding] duration-300 ease-in-out",
        user ? "md:pl-[280px]" : "" 
      )}>
          
          {/* Fundo Gradiente */}
          <div className="fixed inset-0 w-full h-full pointer-events-none -z-50">
              <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-rose-500/5 blur-[120px]" />
          </div>
        
          {children}
      </main>

    </div>
  )
}