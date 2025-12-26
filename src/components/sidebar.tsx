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
  CalendarClock // Ícone para Gastos Fixos
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
    // Item restaurado:
    { href: "/fixed-expenses", label: "Gastos Fixos", icon: CalendarClock }, 
    { href: "/budget", label: "Orçamento", icon: Wallet },
    { href: "/settings", label: "Configurações", icon: Settings },
  ]

  return (
    <aside className={cn("w-[280px] border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl flex flex-col h-full", className)}>
      
      {/* HEADER DA SIDEBAR COM LOGO */}
      <div className="flex h-20 items-center justify-center px-6 border-b border-white/5 shrink-0">
        <div className="relative w-36 h-20">
            <Image 
                src="/mesh.png" 
                alt="Mesh Logo" 
                fill 
                className="object-contain"
                priority
                unoptimized 
            />
        </div>
      </div>

      {/* NAVEGAÇÃO */}
      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                isActive 
                  ? "text-white bg-primary/10" 
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              )}
            >
              {isActive && (
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
              )}
              <Icon size={20} className={cn(isActive ? "text-primary" : "text-zinc-500 group-hover:text-zinc-300")} />
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* FOOTER / PERFIL */}
      <div className="p-4 border-t border-white/5 bg-zinc-900/20 shrink-0">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-10 w-10 border border-white/10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback className="bg-zinc-800 text-zinc-400">
                <User size={18} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">
              {user.name || "Usuário"}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {user.email}
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 border-white/5 bg-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-zinc-400 transition-all"
          onClick={() => signOut()}
        >
          <LogOut size={16} />
          Sair da Conta
        </Button>
      </div>
    </aside>
  )
}