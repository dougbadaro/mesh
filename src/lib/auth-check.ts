import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"

import { auth } from "@/auth"

/**
 * Verifica se o usuário está autenticado E se ele ainda existe no banco de dados.
 * Se não existir, força o logout/redirecionamento.
 */
export async function getAuthenticatedUser() {
  const session = await auth()

  // 1. Verifica se existe sessão (cookie válido)
  if (!session?.user?.email) {
    redirect("/login")
  }

  // 2. Verifica se o usuário REALMENTE existe no banco
  // Isso previne que usuários deletados continuem acessando via cache
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true, // <--- ADICIONADO: Para verificar o selo de segurança
    },
  })

  // 3. Se o usuário foi deletado do banco, mas ainda tem cookie:
  if (!user) {
    // Redireciona para logout forçado
    redirect("/api/auth/signout?callbackUrl=/login")
  }

  return user
}
