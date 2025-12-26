'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Schema
const editSchema = z.object({
  id: z.string(),
  newAmount: z.coerce.number().positive(),
  newDescription: z.string().min(1),
  // Recebe YYYY-MM-DD e converte para Date ao meio-dia
  newStartDate: z.string().transform((val) => new Date(val + "T12:00:00")),
  // NOVO: Recebe ID da carteira (transforma string vazia em null)
  newBankAccountId: z.string().optional().transform(val => val === "" ? null : val),
})

export async function editRecurring(formData: FormData) {
  const session = await auth()
  
  if (!session?.user?.email) {
      throw new Error("Usuário não autenticado")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) throw new Error("Usuário não encontrado")
    
  const rawData = {
    id: formData.get('id'),
    newAmount: formData.get('amount'),
    newDescription: formData.get('description'),
    newStartDate: formData.get('startDate'),
    newBankAccountId: formData.get('bankAccountId'),
  }

  const data = editSchema.parse(rawData)

  // 1. Busca a Assinatura Original
  const recurring = await prisma.recurringTransaction.findUnique({
    where: { id: data.id },
  })

  if (!recurring) throw new Error("Assinatura não encontrada")

  // 2. Atualiza a Tabela MESTRE
  await prisma.recurringTransaction.update({
    where: { id: data.id },
    data: {
      amount: data.newAmount,
      description: data.newDescription,
      startDate: data.newStartDate,
      bankAccountId: data.newBankAccountId, // <--- SALVA A CARTEIRA AQUI
    }
  })

  // 3. A MÁGICA: Limpa o Futuro e Regenera com os NOVOS dados
  const today = new Date()
  
  // Apaga transações futuras
  await prisma.transaction.deleteMany({
    where: {
      recurringId: data.id,
      dueDate: { gte: today } 
    }
  })

  // Regenera os próximos 12 meses
  const transactionsToCreate = []
  const baseDay = data.newStartDate.getDate()

  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() + i, baseDay)
    
    if (i === 0 && targetDate < today) {
       targetDate.setMonth(targetDate.getMonth() + 1)
    }

    transactionsToCreate.push({
      amount: data.newAmount,
      description: `${data.newDescription} (Mensal)`,
      type: recurring.type,
      paymentMethod: recurring.paymentMethod,
      userId: recurring.userId,
      categoryId: recurring.categoryId,
      bankAccountId: data.newBankAccountId, // <--- SALVA A CARTEIRA NAS TRANSAÇÕES FILHAS
      date: targetDate, 
      dueDate: targetDate, 
      recurringId: recurring.id
    })
  }

  if (transactionsToCreate.length > 0) {
    await prisma.transaction.createMany({ data: transactionsToCreate })
  }

  revalidatePath('/recurring')
  revalidatePath('/')
  revalidatePath('/settings') // Atualiza saldo das carteiras
}

export async function stopRecurring(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return

  // 1. Marca como inativa
  await prisma.recurringTransaction.update({
    where: { id },
    data: { active: false }
  })

  // 2. Apaga TODOS os lançamentos futuros
  await prisma.transaction.deleteMany({
    where: {
      recurringId: id,
      dueDate: { gte: new Date() }
    }
  })

  revalidatePath('/recurring')
  revalidatePath('/')
  revalidatePath('/settings')
}