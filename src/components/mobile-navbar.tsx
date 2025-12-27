"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LayoutDashboard, CreditCard, ArrowRightLeft, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "next-auth/react"

// Adicionamos a interface para tipar o User
interface MobileNavbarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function MobileNavbar({ user }: MobileNavbarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const routes = [
    {
      href: "/",
      label: "Visão Geral",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      href: "/transactions",
      label: "Lançamentos",
      icon: ArrowRightLeft,
      active: pathname === "/transactions",
    },
    {
      href: "/credit-card",
      label: "Cartão de Crédito",
      icon: CreditCard,
      active: pathname === "/credit-card",
    },
  ]

  return (
    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-zinc-950 md:hidden">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
             <span className="font-bold text-white text-xs">F</span>
        </div>
        <span className="font-bold text-white tracking-tight">Finance.ai</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-zinc-400">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-zinc-950 border-l border-white/10 p-0 flex flex-col w-[300px]">
          
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>

          <div className="p-6 border-b border-white/5 bg-zinc-900/50">
             <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={user?.image || ""} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400">
                        {user?.name?.[0] || "U"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-white truncate max-w-[150px]">
                        {user?.name}
                    </span>
                    <span className="text-xs text-zinc-500 truncate max-w-[150px]">
                        {user?.email}
                    </span>
                </div>
             </div>
          </div>

          <div className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                  route.active
                    ? "bg-white text-black"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <route.icon size={18} />
                {route.label}
              </Link>
            ))}
          </div>

          <div className="p-4 border-t border-white/5 bg-zinc-900/50">
            <Button 
                variant="ghost" 
                className="w-full justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-3"
                onClick={() => signOut()}
            >
                <LogOut size={18} />
                Sair da conta
            </Button>
          </div>

        </SheetContent>
      </Sheet>
    </div>
  )
}