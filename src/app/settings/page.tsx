import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import { CategoryManager } from "./components/category-manager"
import { CreditCardSettings } from "./components/credit-card-settings"
import { ExportCsvCard } from "./components/export-csv-card"
import { BankAccountManager } from "./components/bank-account-manager" 
import { getUserBankAccounts } from "@/app/actions/bank-accounts" 
import { Settings, User, Shield, AlertTriangle, Terminal, Database, Wallet, CreditCard } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function SettingsPage() {
  const authUser = await getAuthenticatedUser()

  // Buscar contas bancárias do usuário
  const bankAccounts = await getUserBankAccounts()

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
  const categories = rawCategories.map(cat => ({
    ...cat,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null
  }))

  const isVerified = !!authUser.emailVerified

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24 animate-in fade-in duration-700 space-y-8">
      
      {/* HEADER COMPACTO */}
      <div className="flex items-center gap-3">
         <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-xl hover:bg-white/5 text-zinc-400">
            <Link href="/">
                <ArrowLeft size={18} />
            </Link>
         </Button>
         <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Configurações
            </h1>
            <p className="text-xs text-zinc-400">Preferências e parâmetros do sistema.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
         
         {/* COLUNA ESQUERDA (PERFIL) - Sticky */}
         <div className="md:col-span-4 space-y-6">
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center sticky top-6">
                <Avatar className="h-20 w-20 mb-3 border-2 border-zinc-800 shadow-xl">
                    <AvatarImage src={authUser.image || ""} />
                    <AvatarFallback className="text-xl bg-zinc-800 text-zinc-400"><User /></AvatarFallback>
                </Avatar>
                
                <h2 className="text-base font-bold text-white tracking-tight">{authUser.name}</h2>
                <p className="text-[10px] text-zinc-500 font-mono tracking-wide mb-4">{authUser.email}</p>
                
                {isVerified ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] uppercase font-bold tracking-widest rounded-lg border border-emerald-500/20">
                        <Shield size={10} />
                        Verificado
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 text-[9px] uppercase font-bold tracking-widest rounded-lg border border-amber-500/20">
                        <AlertTriangle size={10} />
                        Não Verificado
                    </div>
                )}
            </div>
         </div>

         {/* COLUNA DIREITA (CONFIGURAÇÕES) */}
         <div className="md:col-span-8 space-y-8">
            
            {/* SEÇÃO 1: CARTEIRAS */}
            <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Wallet size={14} className="text-emerald-500" />
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Minhas Carteiras</h3>
                </div>
                <BankAccountManager initialAccounts={bankAccounts} />
            </section>

            <Separator className="bg-white/5" />

            {/* SEÇÃO 2: CARTÃO */}
            <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <CreditCard size={14} className="text-emerald-500" />
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Parâmetros Financeiros</h3>
                </div>
                <CreditCardSettings 
                    initialClosingDay={userSettings?.creditCardClosingDay ?? 6}
                    initialDueDay={userSettings?.creditCardDueDay ?? 10}
                />
            </section>

            <Separator className="bg-white/5" />

            {/* SEÇÃO 3: CATEGORIAS */}
            <section className="space-y-3">
                 <div className="flex items-center gap-2 px-1">
                    <Terminal size={14} className="text-emerald-500" />
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Categorias</h3>
                </div>
                <CategoryManager 
                    categories={categories} 
                    currentUserId={authUser.id} 
                />
            </section>

            <Separator className="bg-white/5" />

            {/* SEÇÃO 4: DADOS */}
            <section className="space-y-3">
                 <div className="flex items-center gap-2 px-1">
                    <Database size={14} className="text-emerald-500" />
                    <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Dados</h3>
                </div>
                <ExportCsvCard />
            </section>

            {/* FOOTER */}
            <div className="pt-8 pb-2 flex flex-col items-center justify-center text-zinc-700 gap-2 opacity-40 hover:opacity-100 transition-opacity">
               <p className="text-[9px] font-mono tracking-widest uppercase">
                 Mesh System v1.2
               </p>
            </div>
         </div>

      </div>
    </div>
  )
}