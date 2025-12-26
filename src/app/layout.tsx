import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";
import { MobileNavbar } from "@/components/mobile-navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mesh Finance",
  description: "Sistema financeiro pessoal inteligente",
  icons: {
    // Apontando para o novo arquivo favicon.png
    icon: "/favicon.png?v=2",
    shortcut: "/favicon.png?v=2",
    apple: "/favicon.png?v=2",
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user;

  return (
    <html lang="pt-BR" className="dark">
      <body 
        className={cn(
          inter.className, 
          "min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary overflow-x-hidden"
        )}
      >
        <div className="relative flex min-h-screen flex-col">
          
          {/* Se estiver logado, mostra os menus */}
          {user && (
            <>
              {/* Sidebar Desktop: Só aparece em md+ e é fixa */}
              <Sidebar 
                user={user} 
                className="hidden md:flex fixed left-0 top-0 z-40 h-screen" 
              />
              
              {/* Navbar Mobile: Só aparece em telas pequenas */}
              <MobileNavbar user={user} />
            </>
          )}

          <main className={cn(
            "flex-1 transition-[padding] duration-300 ease-in-out",
            // Adiciona padding esquerdo apenas se estiver logado E em tela desktop
            user ? "md:pl-[280px]" : "" 
          )}>
              
              {/* Fundo Gradiente */}
              <div className="fixed inset-0 w-full h-full pointer-events-none -z-50">
                  <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
                  <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-rose-500/5 blur-[120px]" />
              </div>
            
              {children}
          </main>

        </div>
      </body>
    </html>
  );
}