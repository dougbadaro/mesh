import { AlertTriangle, CreditCard, Database, Shield, Terminal, User, Wallet } from "lucide-react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import { getUserBankAccounts } from "@/app/actions/bank-accounts"

import { BankAccountManager } from "./components/bank-account-manager"
import { CategoryManager } from "./components/category-manager"
import { CreditCardSettings } from "./components/credit-card-settings"
import { ExportCsvCard } from "./components/export-csv-card"

export default async function SettingsPage() {
  const authUser = await getAuthenticatedUser()

  // Buscar contas bancárias do usuário
  const bankAccounts = await getUserBankAccounts()

  const userSettings = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      creditCardClosingDay: true,
      creditCardDueDay: true,
    },
  })

  const rawCategories = await prisma.category.findMany({
    where: {
      OR: [{ userId: authUser.id }, { userId: null }],
    },
    orderBy: { name: "asc" },
  })
  const categories = rawCategories.map((cat) => ({
    ...cat,
    budgetLimit: cat.budgetLimit ? Number(cat.budgetLimit) : null,
  }))

  const isVerified = !!authUser.emailVerified

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 pb-24 duration-700 animate-in fade-in md:p-6">
      {/* HEADER COMPACTO */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-9 w-9 rounded-xl text-zinc-400 hover:bg-white/5"
        >
          <Link href="/">
            <ArrowLeft size={18} />
          </Link>
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
            Configurações
          </h1>
          <p className="text-xs text-zinc-400">Preferências e parâmetros do sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* COLUNA ESQUERDA (PERFIL) - Sticky */}
        <div className="space-y-6 md:col-span-4">
          <div className="sticky top-6 flex flex-col items-center rounded-3xl border border-white/5 bg-zinc-900/40 p-6 text-center backdrop-blur-xl">
            <Avatar className="mb-3 h-20 w-20 border-2 border-zinc-800 shadow-xl">
              <AvatarImage src={authUser.image || ""} />
              <AvatarFallback className="bg-zinc-800 text-xl text-zinc-400">
                <User />
              </AvatarFallback>
            </Avatar>

            <h2 className="text-base font-bold tracking-tight text-white">{authUser.name}</h2>
            <p className="mb-4 font-mono text-[10px] tracking-wide text-zinc-500">
              {authUser.email}
            </p>

            {isVerified ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-500">
                <Shield size={10} />
                Verificado
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-amber-500">
                <AlertTriangle size={10} />
                Não Verificado
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA (CONFIGURAÇÕES) */}
        <div className="space-y-8 md:col-span-8">
          {/* SEÇÃO 1: CARTEIRAS */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Wallet size={14} className="text-emerald-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Minhas Carteiras
              </h3>
            </div>
            <BankAccountManager initialAccounts={bankAccounts} />
          </section>

          <Separator className="bg-white/5" />

          {/* SEÇÃO 2: CARTÃO */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <CreditCard size={14} className="text-emerald-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Parâmetros Financeiros
              </h3>
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
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Categorias
              </h3>
            </div>
            <CategoryManager categories={categories} currentUserId={authUser.id} />
          </section>

          <Separator className="bg-white/5" />

          {/* SEÇÃO 4: DADOS */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Database size={14} className="text-emerald-500" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Dados
              </h3>
            </div>
            <ExportCsvCard />
          </section>

          {/* FOOTER */}
          <div className="flex flex-col items-center justify-center gap-2 pb-2 pt-8 text-zinc-700 opacity-40 transition-opacity hover:opacity-100">
            <p className="font-mono text-[9px] uppercase tracking-widest">Mesh System v1.2</p>
          </div>
        </div>
      </div>
    </div>
  )
}
