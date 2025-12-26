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
    throw new Error("Dados inválidos.")
  }

  const { closingDay, dueDay, scope } = result.data

  // 1. Atualiza a preferência do usuário (Isso afeta criações futuras em transactions.ts)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      creditCardClosingDay: closingDay,
      creditCardDueDay: dueDay
    }
  })

  // 2. Lógica Retroativa: Atualiza transações existentes se solicitado
  if (scope === 'all') {
    // Busca todas as transações de cartão deste usuário
    const cardTransactions = await prisma.transaction.findMany({
        where: {
            userId: user.id,
            paymentMethod: 'CREDIT_CARD'
        },
        select: { id: true, dueDate: true }
    })

    // Prepara as atualizações em lote
    const updates = cardTransactions.map(t => {
        const currentDueDate = new Date(t.dueDate)
        
        // Mantém o Ano e Mês originais da transação, muda apenas o Dia
        // Ex: Era 10/01/2024 -> Vira 16/01/2024
        const newDueDate = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth(), dueDay)

        return prisma.transaction.update({
            where: { id: t.id },
            data: { dueDate: newDueDate }
        })
    })

    // Executa todas as atualizações de uma vez
    if (updates.length > 0) {
        await prisma.$transaction(updates)
    }
  }

  // Revalida as páginas afetadas
  revalidatePath('/settings')
  revalidatePath('/') 
  revalidatePath('/transactions')
  revalidatePath('/budget')
}