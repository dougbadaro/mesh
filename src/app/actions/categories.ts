'use server'

import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth-check"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { TransactionType } from "@prisma/client"

const createCategorySchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  type: z.nativeEnum(TransactionType)
})

export async function createCategory(formData: FormData) {
  const user = await getAuthenticatedUser()

  const rawData = {
    name: formData.get('name'),
    type: formData.get('type')
  }

  const result = createCategorySchema.safeParse(rawData)

  if (!result.success) {
    throw new Error("Dados inválidos")
  }

  await prisma.category.create({
    data: {
      name: result.data.name,
      type: result.data.type,
      userId: user.id
    }
  })

  revalidatePath('/settings')
  revalidatePath('/transactions') // Atualiza dropdowns
}

export async function deleteCategory(categoryId: string) {
  const user = await getAuthenticatedUser()

  // Verifica se a categoria pertence ao usuário antes de deletar
  const category = await prisma.category.findUnique({
    where: { id: categoryId }
  })

  if (!category || category.userId !== user.id) {
    throw new Error("Você não tem permissão para deletar esta categoria.")
  }

  // Deleta a categoria (Transações ficam com categoryId = null se tiver SetNull no schema, ou deleta se tiver Cascade)
  // O ideal é que transações não sejam apagadas, apenas percam a categoria.
  try {
      await prisma.category.delete({
        where: { id: categoryId }
      })
  } catch (error) {
      throw new Error("Erro ao deletar. Verifique se existem transações vinculadas.")
  }

  revalidatePath('/settings')
  revalidatePath('/transactions')
}