"use client"

import {
  ArrowRightLeft,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Repeat,
  Settings,
  User,
  Wallet,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

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
    { href: "/credit-card", label: "Cartão", icon: CreditCard },
    { href: "/recurring", label: "Gastos Fixos", icon: Repeat },
    { href: "/budget", label: "Orçamento", icon: Wallet },
    { href: "/settings", label: "Configurações", icon: Settings },
  ]

  // Ajustado para w-[260px] para combinar com o layout
  return (
    <aside
      className={cn(
        "flex h-full w-[260px] flex-col border-r border-white/5 bg-zinc-950/50 backdrop-blur-2xl transition-all duration-300",
        className
      )}
    >
      {/* HEADER: Mais baixo (h-20) e logo menor */}
      <div className="flex h-20 shrink-0 items-center border-b border-white/5 bg-white/[0.01] px-6">
        <div className="relative h-20 w-28 transition-opacity hover:opacity-80">
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
      <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Menu
        </p>

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
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-white font-semibold text-zinc-950 shadow-sm shadow-white/5"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon
                size={18} // Ícone levemente menor visualmente
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-zinc-950" : "text-zinc-500 group-hover:text-white"
                )}
              />
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* FOOTER: Mais compacto */}
      <div className="shrink-0 border-t border-white/5 bg-black/20 p-3">
        <div className="group mb-2 flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/5">
          <Avatar className="h-8 w-8 border border-white/10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-400">
              <User size={12} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs font-medium text-white transition-colors group-hover:text-emerald-400">
              {user.name || "Usuário"}
            </p>
            <p className="truncate font-mono text-[10px] text-zinc-500">{user.email}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          className="h-9 w-full justify-start gap-2 rounded-lg px-2 text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          onClick={() => signOut()}
        >
          <LogOut size={14} />
          <span className="text-[11px] font-medium uppercase tracking-wide">Sair</span>
        </Button>
      </div>
    </aside>
  )
}
