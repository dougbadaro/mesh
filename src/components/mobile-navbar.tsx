"use client"

import { useEffect, useState } from "react"
import {
  ArrowRightLeft,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Repeat,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

import { cn } from "@/lib/utils"

interface MobileNavbarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function MobileNavbar({ user }: MobileNavbarProps) {
  const [open, setOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()

  // CORREÇÃO: setTimeout para evitar erro síncrono e garantir hidratação correta
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const routes = [
    {
      href: "/",
      label: "Visão Geral",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      href: "/transactions",
      label: "Transações",
      icon: ArrowRightLeft,
      active: pathname === "/transactions",
    },
    {
      href: "/credit-card",
      label: "Cartão",
      icon: CreditCard,
      active: pathname === "/credit-card",
    },
    {
      href: "/recurring",
      label: "Fixos",
      icon: Repeat,
      active: pathname === "/recurring",
    },
    {
      href: "/budget",
      label: "Orçamento",
      icon: Wallet,
      active: pathname === "/budget",
    },
    {
      href: "/analysis",
      label: "Análise",
      icon: Sparkles,
      active: pathname === "/analysis",
    },
    {
      href: "/settings",
      label: "Configurações",
      icon: Settings,
      active: pathname === "/settings",
    },
  ]

  // Impede renderização no servidor para evitar conflito de IDs (Hydration Mismatch)
  if (!isMounted) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-5 md:hidden">
      {/* Container Flutuante estilo Apple Dock */}
      <div className="no-scrollbar pointer-events-auto mx-2 flex w-auto max-w-full items-center justify-between gap-1 overflow-x-auto rounded-[2rem] border border-white/10 bg-zinc-900/80 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {/* Links de Navegação */}
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-full p-2.5 transition-all duration-300",
              route.active
                ? "scale-110 bg-white text-black shadow-lg shadow-white/10"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            )}
          >
            <route.icon size={20} strokeWidth={route.active ? 2.5 : 2} />
          </Link>
        ))}

        {/* Divisória Vertical */}
        <div className="mx-1 h-6 w-px shrink-0 bg-white/10" />

        {/* Botão de Perfil (Abre o Menu) */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="relative ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 transition-transform active:scale-95">
              <Avatar className="h-full w-full">
                <AvatarImage src={user?.image || ""} />
                <AvatarFallback className="bg-zinc-800 text-[10px] font-bold text-zinc-400">
                  {user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="rounded-t-[32px] border-t border-white/10 bg-zinc-950 p-6 pb-10"
          >
            <SheetHeader className="mb-6 text-left">
              <SheetTitle className="text-lg font-bold text-white">Minha Conta</SheetTitle>
            </SheetHeader>

            <div className="mb-8 flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-900/50 p-4">
              <Avatar className="h-12 w-12 border border-white/10">
                <AvatarImage src={user?.image || ""} />
                <AvatarFallback className="bg-zinc-800 text-zinc-400">
                  {user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-bold text-white">{user?.name}</p>
                <p className="text-xs text-zinc-500">{user?.email}</p>
              </div>
            </div>

            <Button
              variant="destructive"
              className="h-12 w-full gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 font-bold text-rose-500 hover:bg-rose-500/20"
              onClick={() => signOut()}
            >
              <LogOut size={18} />
              Sair do App
            </Button>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
