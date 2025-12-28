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
  // Mantemos o padrão de hora fixa para evitar problemas de fuso horário
  newStartDate: z.string().transform((val) => new Date(val + "T12:00:00")),
  newBankAccountId: z.string().optional().transform(val => 
    val === "" || val === "none" ? null : val
  ),
  newCategoryId: z.string().optional().transform(val => 
    val === "" || val === "general" ? null : val
  ),
})

export async function editRecurring(formData: FormData) {
  const session = await auth()
  
  if (!session?.user?.email) throw new Error("Usuário não autenticado")

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
    newCategoryId: formData.get('categoryId'),
  }

  const data = editSchema.parse(rawData)

  const recurring = await prisma.recurringTransaction.findUnique({
    where: { id: data.id },
  })

  if (!recurring) throw new Error("Assinatura não encontrada")

  // 1. Atualiza a Tabela Mestre
  await prisma.recurringTransaction.update({
    where: { id: data.id },
    data: {
      amount: data.newAmount,
      description: data.newDescription,
      startDate: data.newStartDate,
      bankAccountId: data.newBankAccountId,
      categoryId: data.newCategoryId,
    }
  })

  // 2. LÓGICA DE APAGAR O FUTURO
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Zera a hora para comparação justa
  
  // Apaga transações futuras ou de hoje
  await prisma.transaction.deleteMany({
    where: {
      recurringId: data.id,
      date: { gte: today } 
    }
  })

  // 3. CHECK ANTI-DUPLICIDADE (A CORREÇÃO)
  // Verifica se sobrou alguma transação no mês atual (que era < today)
  // Se sobrou, não podemos criar outra para este mês.
  const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const hasPreservedTransaction = await prisma.transaction.findFirst({
    where: {
      recurringId: data.id,
      date: {
        gte: startOfCurrentMonth,
        lt: today // Procura estritamente no passado (as que não foram deletadas)
      }
    }
  })

  // 4. REGENERAÇÃO INTELIGENTE
  const transactionsToCreate = []
  const baseDay = data.newStartDate.getDate()
  
  // Definimos um offset inicial. Começamos do mês 0 (atual).
  let startMonthOffset = 0

  // Calculamos a data alvo para o mês atual
  const currentMonthTarget = new Date(today.getFullYear(), today.getMonth(), baseDay)
  currentMonthTarget.setHours(12, 0, 0, 0)

  // SE a data alvo já passou (é menor que hoje), pulamos para o próximo mês.
  // OU SE já existe uma transação preservada neste mês (anti-duplicidade), também pulamos.
  if (currentMonthTarget < today || hasPreservedTransaction) {
     startMonthOffset = 1
  }

  // Gera os próximos 12 lançamentos a partir do offset definido
  for (let i = 0; i < 12; i++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() + startMonthOffset + i, baseDay)
    
    // Força hora fixa para evitar bugs de timezone (UTC vs Local)
    targetDate.setHours(12, 0, 0, 0)

    transactionsToCreate.push({
      amount: data.newAmount,
      description: `${data.newDescription} (Mensal)`,
      type: recurring.type,
      paymentMethod: recurring.paymentMethod,
      userId: recurring.userId,
      categoryId: data.newCategoryId,
      bankAccountId: data.newBankAccountId,
      date: targetDate, 
      dueDate: targetDate, 
      recurringId: recurring.id
    })
  }

  if (transactionsToCreate.length > 0) {
    await prisma.transaction.createMany({ data: transactionsToCreate })
  }

  revalidatePath('/recurring')
  revalidatePath('/budget')
  revalidatePath('/')
}

export async function stopRecurring(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.recurringTransaction.update({
    where: { id },
    data: { active: false }
  })

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