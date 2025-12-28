import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Lógica de proteção de rotas (Middleware)
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLogin = nextUrl.pathname.startsWith("/login")

      // Se estiver na página de Login e já estiver logado -> Manda pra Home
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl))
        return true
      }

      // Se não estiver logado e tentar acessar qualquer outra página -> Manda pro Login
      if (!isLoggedIn) {
        return false // Redireciona automaticamente para /login
      }

      return true
    },
    // Adiciona o ID do usuário na sessão (vindo do token JWT)
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
} satisfies NextAuthConfig
