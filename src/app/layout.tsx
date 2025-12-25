import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";
import { Sidebar } from "./components/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mesh Finance",
  description: "Sistema financeiro pessoal inteligente",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <html lang="pt-BR" className="dark">
      <body 
        className={cn(
          inter.className, 
          "min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary overflow-x-hidden"
        )}
      >
        <div className="relative flex min-h-screen flex-col">
          
          {/* Exibe a Sidebar apenas se estiver logado */}
          {isAuthenticated && <Sidebar user={session.user} />}

          <main className={cn(
            "flex-1 transition-[padding] duration-300 ease-in-out",
            isAuthenticated ? "md:pl-[280px]" : "" 
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