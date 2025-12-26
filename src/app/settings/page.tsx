import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import { CategoryManager } from "./components/category-manager"
import { Settings, User, Shield } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function SettingsPage() {
  const user = await getAuthenticatedUser()

  // Busca todas as categorias (Do usuário OU do sistema)
  const categories = await prisma.category.findMany({
    where: { 
        OR: [
            { userId: user.id }, 
            { userId: null } // Categorias padrão
        ] 
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 pb-20 animate-in fade-in duration-700 space-y-8">
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
         <div className="p-3 bg-zinc-900 rounded-xl border border-white/5">
            <Settings size={24} className="text-zinc-400" />
         </div>
         <div>
            <h1 className="text-2xl font-bold text-white">Configurações</h1>
            <p className="text-sm text-zinc-400">Gerencie sua conta e preferências.</p>
         </div>
      </div>

      <Separator className="bg-white/5" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
         
         {/* SIDEBAR DE CONFIG (Visual) */}
         <div className="md:col-span-4 space-y-6">
            {/* Cartão de Perfil */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 border-2 border-zinc-800">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback className="text-2xl bg-zinc-800"><User /></AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-semibold text-white">{user.name}</h2>
                <p className="text-sm text-zinc-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-4 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded-full border border-emerald-500/20">
                    <Shield size={12} />
                    Conta Segura
                </div>
            </div>
         </div>

         {/* CONTEÚDO PRINCIPAL */}
         <div className="md:col-span-8 space-y-8">
            
            {/* Gerenciador de Categorias */}
            <CategoryManager 
                categories={categories} 
                currentUserId={user.id} 
            />

            {/* Outras configs futuras podem vir aqui... */}
            <div className="p-6 rounded-2xl border border-dashed border-white/5 text-center text-zinc-600 text-sm">
               Mais configurações em breve (Moeda, Tema, Exportação de Dados).
            </div>
         </div>

      </div>
    </div>
  )
}