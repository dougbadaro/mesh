import Link from "next/link"
import { LayoutDashboard, Receipt, BarChart3, Settings, LogOut } from "lucide-react"
import { signOut } from "@/auth" 

// Componentes do Shadcn
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SidebarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[280px] border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl hidden md:flex flex-col">
      
      {/* Logo */}
      <div className="h-20 flex items-center px-8 border-b border-white/5">
        <div className="flex items-center gap-2.5">
           <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="font-bold text-zinc-950 text-lg">M</span>
           </div>
           <span className="font-bold text-xl tracking-tight text-zinc-100">Mesh Finance</span>
        </div>
      </div>

      {/* Navegação */}
      <div className="flex-1 px-4 py-8 space-y-2">
         <p className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Menu Principal</p>
         
         <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all group">
            <LayoutDashboard size={20} className="group-hover:text-emerald-500 transition-colors" />
            <span className="font-medium">Dashboard</span>
         </Link>

         <Link href="/recurring" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all group">
            <Receipt size={20} className="group-hover:text-emerald-500 transition-colors" />
            <span className="font-medium">Assinaturas</span>
         </Link>

         <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all group">
            <BarChart3 size={20} className="group-hover:text-emerald-500 transition-colors" />
            <span className="font-medium">Relatórios</span>
         </Link>
      </div>

      {/* Footer / Perfil do Usuário */}
      <div className="p-4 border-t border-white/5 space-y-4">
         
         <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
            <Avatar className="h-10 w-10 border border-white/10">
               <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
               <AvatarFallback className="bg-zinc-800 text-zinc-400">
                  {user?.name?.[0] || "U"}
               </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
               <p className="text-sm font-semibold text-zinc-200 truncate">
                  {user?.name?.split(' ')[0]} 
               </p>
               <p className="text-[10px] text-zinc-500 truncate">
                  {user?.email}
               </p>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" className="h-10 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 justify-start px-3">
               <Settings size={18} className="mr-2" />
               <span className="text-xs">Ajustes</span>
            </Button>

            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/login" })
              }}
              className="w-full"
            >
              <Button 
                variant="ghost" 
                className="h-10 w-full rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 justify-start px-3"
                type="submit"
              >
                 <LogOut size={18} className="mr-2" />
                 <span className="text-xs">Sair</span>
              </Button>
            </form>
         </div>

      </div>
    </aside>
  )
}