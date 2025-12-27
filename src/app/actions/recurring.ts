'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// --- SCHEMA DE VALIDAÇÃO ---
const editSchema = z.object({
  id: z.string(),
  newAmount: z.coerce.number().positive(),
  newDescription: z.string().min(1),
  // Converte a string YYYY-MM-DD para um objeto Date estável
  newStartDate: z.string().transform((val) => new Date(val + "T12:00:00")),
  // Transforma string vazia ou "none" em null para o Prisma
  newBankAccountId: z.string().optional().transform(val => 
    val === "" || val === "none" ? null : val
  ),
  // Transforma string vazia ou "general" em null para categorias
  newCategoryId: z.string().optional().transform(val => 
    val === "" || val === "general" ? null : val
  ),
})

/**
 * Atualiza uma assinatura recorrente e regenera as transações futuras
 */
export async function editRecurring(formData: FormData) {
  const session = await auth()
  
  if (!session?.user?.email) {
    throw new Error("Usuário não autenticado")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) throw new Error("Usuário não encontrado")
    
  // Captura dados do FormData
  const rawData = {
    id: formData.get('id'),
    newAmount: formData.get('amount'),
    newDescription: formData.get('description'),
    newStartDate: formData.get('startDate'),
    newBankAccountId: formData.get('bankAccountId'),
    newCategoryId: formData.get('categoryId'),
  }

  // Valida com Zod
  const data = editSchema.parse(rawData)

  // 1. Busca a Assinatura Original para manter o tipo (INCOME/EXPENSE) e método original
  const recurring = await prisma.recurringTransaction.findUnique({
    where: { id: data.id },
  })

  if (!recurring) throw new Error("Assinatura não encontrada")

  // 2. Atualiza a Tabela MESTRE (RecurringTransaction)
  await prisma.recurringTransaction.update({
    where: { id: data.id },
    data: {
      amount: data.newAmount,
      description: data.newDescription,
      startDate: data.newStartDate,
      bankAccountId: data.newBankAccountId,
      categoryId: data.newCategoryId, // <--- Salva a nova categoria
    }
  })

  // 3. REGENERAÇÃO DO FLUXO CAIXA FUTURO
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normaliza para o início do dia
  
  // Apaga todas as transações vinculadas a essa recorrência que ainda não venceram
  await prisma.transaction.deleteMany({
    where: {
      recurringId: data.id,
      date: { gte: today } 
    }
  })

  // Prepara a criação dos próximos 12 meses baseados nos novos dados
  const transactionsToCreate = []
  const baseDay = data.newStartDate.getDate()

  for (let i = 0; i < 12; i++) {
    // Calcula a data de cada mês
    const targetDate = new Date(today.getFullYear(), today.getMonth() + i, baseDay)
    
    // Se o dia calculado já passou neste mês atual, pula para o próximo mês
    if (i === 0 && targetDate < today) {
       targetDate.setMonth(targetDate.getMonth() + 1)
    }

    transactionsToCreate.push({
      amount: data.newAmount,
      description: `${data.newDescription} (Mensal)`,
      type: recurring.type,
      paymentMethod: recurring.paymentMethod,
      userId: recurring.userId,
      categoryId: data.newCategoryId,     // <--- Categoria atualizada
      bankAccountId: data.newBankAccountId, // <--- Carteira atualizada
      date: targetDate, 
      dueDate: targetDate, 
      recurringId: recurring.id
    })
  }

  // Insere as novas transações em lote
  if (transactionsToCreate.length > 0) {
    await prisma.transaction.createMany({ data: transactionsToCreate })
  }

  // Revalida as rotas para atualizar a UI
  revalidatePath('/recurring')
  revalidatePath('/budget')
  revalidatePath('/')
}

/**
 * Interrompe uma assinatura (desativa e remove lançamentos futuros)
 */
export async function stopRecurring(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Marca a assinatura mestre como inativa
  await prisma.recurringTransaction.update({
    where: { id },
    data: { active: false }
  })

  // 2. Remove apenas os lançamentos que ainda não aconteceram
  await prisma.transaction.deleteMany({
    where: {
      recurringId: id,
      date: { gte: today }
    }
  })

  revalidatePath('/recurring')
  revalidatePath('/')
  revalidatePath('/budget')
}