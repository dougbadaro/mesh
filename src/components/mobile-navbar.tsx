"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Repeat, 
  Settings, 
  CreditCard, // <--- Import Novo
  Wallet
} from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNavbar() {
  const pathname = usePathname()

  const links = [
    { href: "/", icon: LayoutDashboard, label: "Início" },
    { href: "/transactions", icon: ArrowRightLeft, label: "Extrato" },
    { href: "/credit-card", icon: CreditCard, label: "Cartão" }, // <--- Item Novo
    { href: "/recurring", icon: Repeat, label: "Fixos" },
    // { href: "/budget", icon: Wallet, label: "Metas" }, // Opcional: Se couber na tela
    { href: "/settings", icon: Settings, label: "Ajustes" },
  ]

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 md:hidden animate-in slide-in-from-bottom-24 duration-700">
      
      {/* Cápsula Flutuante (Glassmorphism) */}
      <nav className="flex items-center justify-between px-2 py-2 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl shadow-black/50">
        
        {links.map((link) => {
          const isActive = pathname === link.href
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-12 rounded-full transition-all duration-300",
                isActive ? "text-black" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {/* Background Ativo (Círculo Branco que se move/aparece) */}
              {isActive && (
                <div className="absolute inset-0 bg-white rounded-full shadow-lg shadow-white/10 -z-10 scale-95 transition-transform" />
              )}

              {/* Ícone */}
              <link.icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={cn("transition-transform", isActive && "-translate-y-0.5")}
              />
              
              {/* Label (Opcional: Pode remover se quiser só ícones para ficar mais limpo) */}
              {!isActive && (
                 <span className="text-[9px] font-medium mt-0.5 opacity-0 scale-0 absolute">
                    {link.label}
                 </span>
              )}
            </Link>
          )
        })}

      </nav>
    </div>
  )
}