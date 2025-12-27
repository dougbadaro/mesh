'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Repeat,
  User 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MobileNavbarProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export const MobileNavbar = ({ user }: MobileNavbarProps) => {
    const pathname = usePathname()

    const links = [
        { href: "/", icon: LayoutDashboard, label: "Home" },
        { href: "/transactions", icon: ArrowRightLeft, label: "Transações" },
        { href: "/recurring", icon: Repeat, label: "Fixos" },
    ]

    return (
        // Centralizado horizontalmente (left-1/2) e flutuante
        <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            
            {/* Cápsula Flutuante (Glassmorphism High-End) */}
            <nav className="flex items-center gap-1 p-1.5 rounded-full border border-white/10 bg-zinc-950/70 backdrop-blur-2xl shadow-2xl shadow-black/50 ring-1 ring-white/5">
                
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300",
                                isActive 
                                    ? "bg-white/15 text-white shadow-sm" 
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                            )}
                        >
                            <Icon 
                                size={20} // Ícone menor (20px)
                                strokeWidth={isActive ? 2.5 : 2} 
                                className={cn("transition-transform active:scale-90", isActive && "text-emerald-400")} 
                            />
                        </Link>
                    )
                })}

                {/* Separador Sutil */}
                <div className="w-px h-5 bg-white/10 mx-1" />

                {/* Perfil (Link para Settings) */}
                <Link
                    href="/settings"
                    className={cn(
                        "relative w-11 h-11 flex items-center justify-center rounded-full transition-all",
                        pathname === "/settings" ? "opacity-100" : "opacity-80 hover:opacity-100"
                    )}
                >
                    <Avatar className={cn("w-8 h-8 border border-white/10 transition-transform active:scale-95", pathname === "/settings" && "ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-black")}>
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-400">
                            <User size={14} />
                        </AvatarFallback>
                    </Avatar>
                </Link>

            </nav>
        </div>
    )
}