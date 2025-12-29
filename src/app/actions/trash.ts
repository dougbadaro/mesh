"use server"

import { revalidatePath } from "next/cache"

import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"

export async function restoreTransaction(id: string) {
  const user = await getAuthenticatedUser()

  try {
    await prisma.transaction.update({
      where: { id, userId: user.id },
      data: { deletedAt: null },
    })
    revalidatePath("/settings/trash")
    revalidatePath("/") // Atualiza dashboard
    return { success: true }
  } catch (error) {
    return { error: "Erro ao restaurar transação" }
  }
}

export async function restoreCategory(id: string) {
  const user = await getAuthenticatedUser()

  try {
    await prisma.category.update({
      where: { id, userId: user.id }, // Garante que é do usuário
      data: { deletedAt: null },
    })
    revalidatePath("/settings/trash")
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return { error: "Erro ao restaurar categoria" }
  }
}

export async function restoreBankAccount(id: string) {
  const user = await getAuthenticatedUser()

  try {
    await prisma.bankAccount.update({
      where: { id, userId: user.id },
      data: { deletedAt: null },
    })
    revalidatePath("/settings/trash")
    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    return { error: "Erro ao restaurar carteira" }
  }
}