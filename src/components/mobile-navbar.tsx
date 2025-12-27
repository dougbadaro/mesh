"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  CreditCard, 
  ArrowRightLeft, 
  LogOut, 
  Repeat, 
  Wallet, 
  Settings 
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
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
      active: pathname === "/" 
    },
    { 
      href: "/transactions", 
      label: "Transações", 
      icon: ArrowRightLeft,
      active: pathname === "/transactions" 
    },
    { 
      href: "/credit-card", 
      label: "Cartão", 
      icon: CreditCard,
      active: pathname === "/credit-card" 
    },
    { 
      href: "/recurring", 
      label: "Fixos", 
      icon: Repeat, 
      active: pathname === "/recurring" 
    }, 
    { 
      href: "/budget", 
      label: "Orçamento", 
      icon: Wallet,
      active: pathname === "/budget" 
    }, 
    { 
      href: "/settings", 
      label: "Configurações", 
      icon: Settings,
      active: pathname === "/settings" 
    },
  ]

  // Impede renderização no servidor para evitar conflito de IDs (Hydration Mismatch)
  if (!isMounted) return null

  return (
    <div className="md:hidden pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-5">
      {/* Container Flutuante estilo Apple Dock */}
      <div className="pointer-events-auto flex items-center gap-1 rounded-[2rem] border border-white/10 bg-zinc-900/80 p-2 shadow-2xl backdrop-blur-xl shadow-black/50 mx-2 w-auto max-w-full overflow-x-auto no-scrollbar justify-between">
        
        {/* Links de Navegação */}
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-full p-2.5 min-w-[44px] min-h-[44px] transition-all duration-300",
              route.active
                ? "bg-white text-black shadow-lg shadow-white/10 scale-110"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
          >
            <route.icon size={20} strokeWidth={route.active ? 2.5 : 2} />
          </Link>
        ))}

        {/* Divisória Vertical */}
        <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />

        {/* Botão de Perfil (Abre o Menu) */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 transition-transform active:scale-95 ml-1">
              <Avatar className="h-full w-full">
                <AvatarImage src={user?.image || ""} />
                <AvatarFallback className="bg-zinc-800 text-[10px] font-bold text-zinc-400">
                  {user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </button>
          </SheetTrigger>
          
          <SheetContent side="bottom" className="rounded-t-[32px] border-t border-white/10 bg-zinc-950 p-6 pb-10">
            <SheetHeader className="mb-6 text-left">
              <SheetTitle className="text-lg font-bold text-white">Minha Conta</SheetTitle>
            </SheetHeader>

            <div className="flex items-center gap-4 mb-8 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                <Avatar className="h-12 w-12 border border-white/10">
                    <AvatarImage src={user?.image || ""} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400">
                        {user?.name?.[0] || "U"}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-white text-sm">{user?.name}</p>
                    <p className="text-xs text-zinc-500">{user?.email}</p>
                </div>
            </div>

            <Button 
                variant="destructive" 
                className="w-full h-12 rounded-xl font-bold gap-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20"
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