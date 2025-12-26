import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";
import { AppLayout } from "@/components/app-layout";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mesh",
  description: "Sistema financeiro pessoal inteligente",
  icons: {
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
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body 
        className={cn(
          inter.className, 
          "min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary overflow-x-hidden"
        )}
      >
        {/* Passamos o user e o children para o wrapper Client-Side */}
        <AppLayout user={user}>
            {children}
        </AppLayout>
      </body>
    </html>
  );
}