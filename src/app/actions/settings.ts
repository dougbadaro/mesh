'use server'

import { prisma } from "@/lib/prisma"
import { getAuthenticatedUser } from "@/lib/auth-check"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const creditCardSettingsSchema = z.object({
  closingDay: z.coerce.number().min(1).max(31),
  dueDay: z.coerce.number().min(1).max(31),
  scope: z.enum(['future', 'all']).optional().default('future')
})

export async function updateCreditCardSettings(formData: FormData) {
  const user = await getAuthenticatedUser()

  const rawData = {
    closingDay: formData.get('closingDay'),
    dueDay: formData.get('dueDay'),
    scope: formData.get('scope')
  }

  const result = creditCardSettingsSchema.safeParse(rawData)

  if (!result.success) {
    throw new Error("Parâmetros de entrada inválidos.")
  }

  const { closingDay, dueDay, scope } = result.data

  // 1. Atualiza as preferências do usuário no banco
  await prisma.user.update({
    where: { id: user.id },
    data: {
      creditCardClosingDay: closingDay,
      creditCardDueDay: dueDay
    }
  })

  // 2. Se o usuário optou por "Atualizar existentes", faz o update em lote
  if (scope === 'all') {
    const cardTransactions = await prisma.transaction.findMany({
        where: {
            userId: user.id,
            paymentMethod: 'CREDIT_CARD'
        },
        select: { id: true, dueDate: true }
    })

    const updates = cardTransactions.map(t => {
        const currentDueDate = new Date(t.dueDate)
        const newDueDate = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth(), dueDay)

        return prisma.transaction.update({
            where: { id: t.id },
            data: { dueDate: newDueDate }
        })
    })

    if (updates.length > 0) {
        await prisma.$transaction(updates)
    }
  }

  revalidatePath('/settings')
  revalidatePath('/') 
  revalidatePath('/transactions')
}