import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import { CategoryManager } from "./components/category-manager"
import { CreditCardSettings } from "./components/credit-card-settings"
import { ExportCsvCard } from "./components/export-csv-card"
import { Settings, User, Shield, AlertTriangle, Terminal, Database } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default async function SettingsPage() {
  const authUser = await getAuthenticatedUser()

  const userSettings = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { 
        creditCardClosingDay: true, 
        creditCardDueDay: true 
    }
  })

  const rawCategories = await prisma.category.findMany({
    where: { 
        OR: [
            { userId: authUser.id }, 
            { userId: null }
        ] 
    },
    orderBy: { name: 'asc' }
  })

  // --- SANITIZAÇÃO DE DADOS ---
  const categories = rawCategories.map(cat => ({
    ...cat,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null
  }))

  const isVerified = !!authUser.emailVerified

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 pb-20 animate-in fade-in duration-700 space-y-8">
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
         <div className="p-3 bg-zinc-900 rounded-xl border border-white/10">
            <Settings size={24} className="text-zinc-400" />
         </div>
         <div>
            <h1 className="text-2xl font-bold text-white">Configurações do Sistema</h1>
            <p className="text-sm text-zinc-400">Parâmetros globais e preferências do usuário.</p>
         </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
         
         {/* COLUNA ESQUERDA (PERFIL) */}
         <div className="md:col-span-4 space-y-6">
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center sticky top-24">
                <Avatar className="h-24 w-24 mb-4 border-2 border-zinc-800 shadow-xl">
                    <AvatarImage src={authUser.image || ""} />
                    <AvatarFallback className="text-2xl bg-zinc-800 text-zinc-400"><User /></AvatarFallback>
                </Avatar>
                
                <h2 className="text-lg font-bold text-white tracking-tight">{authUser.name}</h2>
                <p className="text-sm text-zinc-500 font-mono text-[11px]">{authUser.email}</p>
                
                {isVerified ? (
                    <div className="flex items-center gap-2 mt-6 px-3 py-1.5 bg-emerald-500/5 text-emerald-500 text-[10px] uppercase font-bold tracking-widest rounded-md border border-emerald-500/20">
                        <Shield size={12} />
                        Conta Verificada
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mt-6 px-3 py-1.5 bg-amber-500/5 text-amber-500 text-[10px] uppercase font-bold tracking-widest rounded-md border border-amber-500/20">
                        <AlertTriangle size={12} />
                        Não Verificado
                    </div>
                )}
            </div>
         </div>

         {/* COLUNA DIREITA (CONFIGURAÇÕES) */}
         <div className="md:col-span-8 space-y-8">
            
            {/* SEÇÃO 1: CARTÃO */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-200">
                    <Terminal size={16} className="text-emerald-500" />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Parâmetros Financeiros</h3>
                </div>
                <CreditCardSettings 
                    initialClosingDay={userSettings?.creditCardClosingDay ?? 6}
                    initialDueDay={userSettings?.creditCardDueDay ?? 10}
                />
            </section>

            {/* SEÇÃO 2: CATEGORIAS */}
            <section className="space-y-4">
                 <div className="flex items-center gap-2 text-zinc-200">
                    <Terminal size={16} className="text-emerald-500" />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Esquema de Categorias</h3>
                </div>
                <CategoryManager 
                    categories={categories} 
                    currentUserId={authUser.id} 
                />
            </section>

            {/* SEÇÃO 3: DADOS E RELATÓRIOS */}
            <section className="space-y-4">
                 <div className="flex items-center gap-2 text-zinc-200">
                    <Database size={16} className="text-emerald-500" />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Inteligência de Dados</h3>
                </div>
                <ExportCsvCard />
            </section>

            {/* FOOTER */}
            <div className="pt-12 pb-4 flex flex-col items-center justify-center text-zinc-700 gap-2 opacity-60">
               <div className="h-px w-32 bg-zinc-800 mb-2" />
               <p className="text-[10px] font-mono tracking-widest uppercase">
                 Mesh System v1.0.0
               </p>
               <p className="text-[10px] font-mono">
                 Build 2025.12 • Stable Channel
               </p>
            </div>
         </div>

      </div>
    </div>
  )
}