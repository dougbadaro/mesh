'use client'

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

interface MobileNavbarProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
      }
}

export const MobileNavbar = ({ user }: MobileNavbarProps) => {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {/* Botão Hambúrguer - Só aparece no mobile (md:hidden) */}
            <SheetTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden fixed top-4 left-4 z-50 text-zinc-400 hover:text-white hover:bg-white/10 bg-zinc-950/50 backdrop-blur-md border border-white/5"
                >
                    <Menu size={24} />
                </Button>
            </SheetTrigger>
            
            {/* Conteúdo da Gaveta Lateral */}
            <SheetContent side="left" className="p-0 w-[280px] border-r border-white/10 bg-zinc-950 overflow-hidden">
                {/* Reutilizamos a Sidebar existente. 
                    Passamos uma função para fechar o Sheet quando um link for clicado. */}
                <Sidebar user={user} onLinkClick={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}