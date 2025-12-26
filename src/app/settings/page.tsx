import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import { CategoryManager } from "./components/category-manager"
import { CreditCardSettings } from "./components/credit-card-settings"
import { Settings, User, Shield } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function SettingsPage() {
  const authUser = await getAuthenticatedUser()

  // 1. Buscamos os dados específicos de configuração do usuário (Datas do Cartão)
  const userSettings = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { 
        creditCardClosingDay: true, 
        creditCardDueDay: true 
    }
  })

  // 2. Buscamos todas as categorias (Do usuário OU do sistema)
  const categories = await prisma.category.findMany({
    where: { 
        OR: [
            { userId: authUser.id }, 
            { userId: null } // Categorias padrão
        ] 
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 pb-20 animate-in fade-in duration-700 space-y-8">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex items-center gap-4">
         <div className="p-3 bg-zinc-900 rounded-xl border border-white/5">
            <Settings size={24} className="text-zinc-400" />
         </div>
         <div>
            <h1 className="text-2xl font-bold text-white">Configurações</h1>
            <p className="text-sm text-zinc-400">Gerencie sua conta, categorias e preferências de cartão.</p>
         </div>
      </div>

      <Separator className="bg-white/5" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
         
         {/* COLUNA ESQUERDA: PERFIL */}
         <div className="md:col-span-4 space-y-6">
            
            {/* Cartão de Perfil */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center sticky top-24">
                <Avatar className="h-24 w-24 mb-4 border-2 border-zinc-800 shadow-xl">
                    <AvatarImage src={authUser.image || ""} />
                    <AvatarFallback className="text-2xl bg-zinc-800 text-zinc-400"><User /></AvatarFallback>
                </Avatar>
                
                <h2 className="text-lg font-bold text-white tracking-tight">{authUser.name}</h2>
                <p className="text-sm text-zinc-500 font-medium">{authUser.email}</p>
                
                <div className="flex items-center gap-2 mt-6 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] uppercase font-bold tracking-wider rounded-full border border-emerald-500/20">
                    <Shield size={12} />
                    Conta Segura
                </div>
            </div>
         </div>

         {/* COLUNA DIREITA: FORMULÁRIOS */}
         <div className="md:col-span-8 space-y-8">
            
            {/* 1. Configuração de Cartão de Crédito */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-200 pl-1">Financeiro</h3>
                <CreditCardSettings 
                    initialClosingDay={userSettings?.creditCardClosingDay || 6}
                    initialDueDay={userSettings?.creditCardDueDay || 10}
                />
            </section>

            {/* 2. Gerenciador de Categorias */}
            <section className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-200 pl-1">Categorias</h3>
                <CategoryManager 
                    categories={categories} 
                    currentUserId={authUser.id} 
                />
            </section>

            {/* Rodapé da Configuração */}
            <div className="pt-8 pb-4 text-center">
               <p className="text-xs text-zinc-600">
                  Mesh v1.0.0 • Feito com ❤️
               </p>
            </div>
         </div>

      </div>
    </div>
  )
}