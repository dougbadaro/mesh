"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      // 🟢 CONFIGURAÇÕES CRITICAS:
      // z-[99999]: Acima de tudo.
      // pointer-events-auto: Garante o clique.
      className="toaster group pointer-events-auto z-[99999]"
      // position="bottom-right" é padrão Apple-like em desktops
      position="bottom-right"
      // gap={10} dá espaço entre toasts empilhados
      gap={10}
      toastOptions={{
        // 🟢 PREVENIR ANIMAÇÃO DE TAMANHO:
        // style: { transition: 'none' } ajuda a evitar o "pulo" no hover.
        style: { transitionProperty: "opacity, transform" },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-zinc-900/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-zinc-50 group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-3 group-[.toaster]:gap-3 group-[.toaster]:items-center group-[.toaster]:w-auto group-[.toaster]:min-w-[320px] pointer-events-auto font-sans transform-gpu",

          description: "group-[.toast]:text-zinc-400 group-[.toast]:text-xs font-medium",

          // 🟢 BOTÃO DE AÇÃO (FIXO):
          // Removi classes flexíveis que causam repaint no hover.
          // Adicionei shadow-none e border fixo.
          actionButton:
            "group-[.toast]:bg-white group-[.toast]:text-zinc-950 group-[.toast]:font-bold group-[.toast]:h-7 group-[.toast]:px-3 group-[.toast]:text-xs group-[.toast]:rounded-lg hover:group-[.toast]:bg-zinc-200 transition-colors cursor-pointer shrink-0 border border-transparent active:scale-95",

          // 🟢 BOTÃO CANCELAR:
          cancelButton:
            "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-400 group-[.toast]:font-medium group-[.toast]:h-7 group-[.toast]:px-3 group-[.toast]:text-xs group-[.toast]:rounded-lg hover:group-[.toast]:bg-zinc-700 hover:group-[.toast]:text-white transition-colors cursor-pointer shrink-0 border border-white/5 active:scale-95",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-500" />,
        info: <InfoIcon className="size-4 text-blue-500" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500" />,
        error: <OctagonXIcon className="size-4 text-rose-500" />,
        loading: <Loader2Icon className="size-4 animate-spin text-zinc-500" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
