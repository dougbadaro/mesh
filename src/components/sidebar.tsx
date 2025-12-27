'use client'

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Wallet, 
  Settings, 
  LogOut,
  User,
  Repeat
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  className?: string 
  onLinkClick?: () => void
}

export function Sidebar({ user, className, onLinkClick }: SidebarProps) {
  const pathname = usePathname()

  const links = [
    { href: "/", label: "Visão Geral", icon: LayoutDashboard },
    { href: "/transactions", label: "Transações", icon: ArrowRightLeft },
    { href: "/recurring", label: "Gastos Fixos", icon: Repeat }, 
    { href: "/budget", label: "Orçamento", icon: Wallet }, 
    { href: "/settings", label: "Configurações", icon: Settings },
  ]

  // Ajustado para w-[260px] para combinar com o layout
  return (
    <aside className={cn("w-[260px] border-r border-white/5 bg-zinc-950/50 backdrop-blur-2xl flex flex-col h-full transition-all duration-300", className)}>
      
      {/* HEADER: Mais baixo (h-20) e logo menor */}
      <div className="flex h-20 items-center px-6 shrink-0 border-b border-white/5 bg-white/[0.01]">
        <div className="relative w-28 h-10 transition-opacity hover:opacity-80">
            <Image 
                src="/mesh.png" 
                alt="Mesh Logo" 
                fill 
                className="object-contain object-left"
                priority
                unoptimized 
            />
        </div>
      </div>

      {/* NAVEGAÇÃO: Padding lateral menor (px-3) */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-3 text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Menu</p>
        
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={cn(
                // Altura reduzida (py-2.5) e fonte menor (text-[13px]) para visual compacto
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 group relative",
                isActive 
                  ? "bg-white text-zinc-950 shadow-sm shadow-white/5 font-semibold" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon 
                size={18} // Ícone levemente menor visualmente
                className={cn(
                    "transition-colors shrink-0",
                    isActive ? "text-zinc-950" : "text-zinc-500 group-hover:text-white"
                )} 
              />
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* FOOTER: Mais compacto */}
      <div className="p-3 border-t border-white/5 bg-black/20 shrink-0">
        <div className="flex items-center gap-3 mb-2 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
          <Avatar className="h-8 w-8 border border-white/10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback className="bg-zinc-800 text-zinc-400 text-[10px]">
                <User size={12} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs font-medium text-white group-hover:text-emerald-400 transition-colors">
              {user.name || "Usuário"}
            </p>
            <p className="truncate text-[10px] text-zinc-500 font-mono">
              {user.email}
            </p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 h-9 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors rounded-lg px-2"
          onClick={() => signOut()}
        >
          <LogOut size={14} />
          <span className="text-[11px] font-medium uppercase tracking-wide">Sair</span>
        </Button>
      </div>
    </aside>
  )
}