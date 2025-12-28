"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAuthenticatedUser } from "@/lib/auth-check" // Usando nossa proteção
import { prisma } from "@/lib/prisma"

const budgetSchema = z.object({
  categoryId: z.string(),
  limit: z.coerce.number().min(0),
})

export async function updateCategoryBudget(formData: FormData) {
  const user = await getAuthenticatedUser()

  const rawData = {
    categoryId: formData.get("categoryId"),
    limit: formData.get("limit"),
  }

  const result = budgetSchema.safeParse(rawData)

  if (!result.success) {
    throw new Error("Dados inválidos")
  }

  // Verifica se a categoria pertence ao usuário (ou é global) para segurança
  const category = await prisma.category.findUnique({
    where: { id: result.data.categoryId },
  })

  if (!category || (category.userId && category.userId !== user.id)) {
    throw new Error("Não autorizado")
  }

  await prisma.category.update({
    where: { id: result.data.categoryId },
    data: {
      budgetLimit: result.data.limit,
    },
  })

  revalidatePath("/budget")
}
