"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"

// --- CORREÇÃO 2: Componente movido para FORA do LoginForm ---
const LoadingOverlay = () => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md duration-300 animate-in fade-in">
    <div className="relative flex flex-col items-center justify-center">
      {/* Glow Fundo */}
      <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-[60px]" />

      {/* Card do Loader */}
      <div className="relative flex min-w-[200px] flex-col items-center gap-6 rounded-3xl border border-white/10 bg-zinc-900 p-8 shadow-2xl duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
        {/* Spinner */}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-r-emerald-500/50 border-t-emerald-500" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold uppercase tracking-widest text-white">
            Autenticando
          </span>
          <span className="animate-pulse text-xs text-zinc-500">Conectando ao Google...</span>
        </div>
      </div>
    </div>
  </div>
)

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // --- CORREÇÃO 1: setTimeout para evitar update síncrono ---
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      await signIn("google", { callbackUrl: "/" })
    } catch (error) {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Portal renderiza o overlay fora da hierarquia DOM atual (no body) */}
      {isLoading && mounted && createPortal(<LoadingOverlay />, document.body)}

      <div className="w-full">
        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="relative flex h-12 w-full items-center gap-3 overflow-hidden rounded-xl border-none bg-white font-bold text-zinc-950 shadow-lg transition-transform hover:bg-zinc-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {!isLoading && (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}

          {isLoading ? "Aguarde..." : "Continuar com Google"}
        </Button>
      </div>
    </>
  )
}
