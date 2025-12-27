import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";
import { AppLayout } from "@/components/app-layout";
import { Toaster } from "@/components/ui/sonner";

// Inter é a fonte mais próxima da San Francisco (Apple)
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mesh",
  description: "Gestão financeira inteligente",
  icons: {
    icon: "/favicon.png?v=2",
    shortcut: "/favicon.png?v=2",
    apple: "/favicon.png?v=2",
  }
};

// Configuração crucial para Mobile:
// Impede que o navegador dê zoom ao clicar em inputs, mantendo a UI "pequena" e nativa.
export const viewport: Viewport = {
  themeColor: "#09090b", // zinc-950
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user;

  return (
    <html lang="pt-BR" className="dark h-full" suppressHydrationWarning>
      <body 
        // AQUI ESTÁ A CORREÇÃO:
        // Isso impede que o React reclame de atributos injetados por extensões (como ColorZilla/LastPass)
        suppressHydrationWarning={true}
        className={cn(
          inter.className, 
          // 1. bg-zinc-950: Fundo preto "matte" (não preto absoluto #000).
          // 2. text-zinc-50: Texto off-white para menos cansaço visual.
          // 3. antialiased: Renderização de fonte mais fina e nítida.
          "h-full min-h-screen bg-zinc-950 text-zinc-50 antialiased overflow-x-hidden",
          "selection:bg-emerald-500/20 selection:text-emerald-400" // Seleção sutil e elegante
        )}
      >
        <AppLayout user={user}>
            {children}
        </AppLayout>
        
        {/* 2. COMPONENTE DE NOTIFICAÇÃO */}
        {/* Ele fica aqui para flutuar sobre qualquer página */}
        <Toaster theme="dark" /> 
      </body>
    </html>
  );
}