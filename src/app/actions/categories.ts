"use server"

import { TransactionType } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"

const createCategorySchema = z.object({
  name: z.string().min(2),
  type: z.nativeEnum(TransactionType),
})

export async function createCategory(formData: FormData) {
  try {
    const user = await getAuthenticatedUser()

    const rawData = {
      name: formData.get("name"),
      type: formData.get("type"),
    }

    const result = createCategorySchema.safeParse(rawData)

    if (!result.success) {
      return { error: "Dados inválidos" }
    }

    await prisma.category.create({
      data: {
        name: result.data.name,
        type: result.data.type,
        userId: user.id,
      },
    })

    revalidatePath("/settings")
    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "Erro ao criar categoria" }
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    const user = await getAuthenticatedUser()

    await prisma.category.update({
      where: {
        id: categoryId,
        userId: user.id,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    revalidatePath("/settings")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { error: "Erro ao remover categoria" }
  }
}