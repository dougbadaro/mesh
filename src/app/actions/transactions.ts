'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { TransactionType, PaymentMethod, Prisma } from "@prisma/client"
import { auth } from "@/auth"

// --- SCHEMAS ---
const transactionSchema = z.object({
  amount: z.coerce.number().positive(),
  description: z.string().min(1),
  type: z.nativeEnum(TransactionType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  categoryId: z.string().optional().transform(val => val === "" ? undefined : val),
  bankAccountId: z.string().optional().transform(val => val === "" ? null : val), 
  installments: z.coerce.number().optional().default(0),
  isRecurring: z.string().optional(), 
  date: z.string(), 
})

const updateSchema = z.object({
  id: z.string(),
  amount: z.coerce.number().positive(),
  description: z.string().min(1),
  type: z.nativeEnum(TransactionType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  categoryId: z.string().optional().transform(val => val === "" ? null : val), 
  bankAccountId: z.string().optional().transform(val => val === "" ? null : val), 
  date: z.string(),
})

// --- HELPER PARA SEGURANÇA ---
async function getValidatedUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

// --- CREATE TRANSACTION ---
export async function createTransaction(formData: FormData) {
  const userId = await getValidatedUser()
  
  const userSettings = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditCardClosingDay: true, creditCardDueDay: true }
  })

  const closingDay = userSettings?.creditCardClosingDay ?? 6
  const dueDay = userSettings?.creditCardDueDay ?? 10

  const rawData = Object.fromEntries(formData.entries())
  const result = transactionSchema.safeParse(rawData)

  if (!result.success) throw new Error("Invalid Data")

  const data = result.data
  const purchaseDate = new Date(data.date + "T12:00:00")
  const transactionsToCreate: Prisma.TransactionCreateManyInput[] = []

  // 1. Recorrência
  if (data.isRecurring === 'true') {
    const recurring = await prisma.recurringTransaction.create({
      data: {
        description: data.description,
        amount: data.amount,
        type: data.type,
        paymentMethod: data.paymentMethod,
        categoryId: data.categoryId,
        startDate: purchaseDate,
        userId: userId,
        active: true,
        frequency: 'MONTHLY',
        isFixed: true,
      }
    })

    const startMonthOffset = (data.paymentMethod === 'CREDIT_CARD' && purchaseDate.getDate() >= closingDay) ? 1 : 0

    for (let i = 0; i < 12; i++) {
      const monthIncrement = i + startMonthOffset
      const visualDate = new Date(purchaseDate)
      visualDate.setMonth(purchaseDate.getMonth() + monthIncrement)
      
      const dueDate = new Date(visualDate)
      if (data.paymentMethod === 'CREDIT_CARD') dueDate.setDate(dueDay)

      transactionsToCreate.push({
        amount: data.amount, 
        description: data.description, 
        type: data.type,
        paymentMethod: data.paymentMethod,
        userId: userId,
        categoryId: data.categoryId ?? null,
        bankAccountId: data.bankAccountId ?? null,
        date: visualDate,
        dueDate: dueDate,
        recurringId: recurring.id 
      })
    }
  }

  // 2. Cartão de Crédito
  else if (data.paymentMethod === 'CREDIT_CARD') {
    const startMonthOffset = purchaseDate.getDate() >= closingDay ? 1 : 0
    const installmentsCount = (data.installments && data.installments > 1) ? data.installments : 1

    for (let i = 0; i < installmentsCount; i++) {
      const monthIncrement = startMonthOffset + i
      const visualDate = new Date(purchaseDate)
      visualDate.setMonth(purchaseDate.getMonth() + monthIncrement)

      const dueDate = new Date(purchaseDate)
      dueDate.setDate(dueDay) 
      dueDate.setMonth(purchaseDate.getMonth() + monthIncrement)

      transactionsToCreate.push({
        amount: data.amount,
        description: installmentsCount > 1 ? `${data.description} (${i + 1}/${installmentsCount})` : data.description,
        type: data.type,
        paymentMethod: data.paymentMethod,
        userId: userId,
        categoryId: data.categoryId ?? null,
        bankAccountId: data.bankAccountId ?? null,
        date: visualDate, 
        dueDate: dueDate,
        currentInstallment: installmentsCount > 1 ? i + 1 : null,
      })
    }
  } 

  // 3. Outros (Débito, Pix, Cash)
  else {
    transactionsToCreate.push({
      amount: data.amount,
      description: data.description,
      type: data.type,
      paymentMethod: data.paymentMethod,
      userId: userId,
      categoryId: data.categoryId ?? null,
      bankAccountId: data.bankAccountId ?? null,
      date: purchaseDate,
      dueDate: purchaseDate,
    })
  }

  if (transactionsToCreate.length > 0) {
    await prisma.transaction.createMany({ data: transactionsToCreate })
  }

  // REVALIDAÇÃO COMPLETA
  revalidatePath('/')
  revalidatePath('/transactions') // Novo
  revalidatePath('/credit-card')  // Novo
  revalidatePath('/recurring')
  revalidatePath('/settings') 
}

// --- UPDATE TRANSACTION ---
export async function updateTransaction(formData: FormData) {
  const userId = await getValidatedUser()

  const userSettings = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditCardDueDay: true } // Não precisamos mais do closingDay aqui
  })

  const dueDay = userSettings?.creditCardDueDay ?? 10

  const result = updateSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!result.success) throw new Error("Invalid Data")

  const data = result.data
  const purchaseDate = new Date(data.date + "T12:00:00") // Data que veio do form (Visual)
  
  const visualDate = new Date(purchaseDate)
  const dueDate = new Date(purchaseDate)

  // REMOVIDO: Lógica de offset (fechamento) que causava o bug de pular meses
  // Assumimos que a data escolhida no form já é a data desejada de exibição
  if (data.paymentMethod === 'CREDIT_CARD') {
    // Apenas garantimos que a Data de Vencimento bata com o dia configurado
    // mantendo o mês/ano da data visual
    dueDate.setDate(dueDay)
  }

  await prisma.transaction.update({
    where: { 
      id: data.id,
      userId: userId 
    },
    data: {
      description: data.description,
      amount: data.amount,
      date: visualDate, 
      dueDate: dueDate,
      categoryId: data.categoryId, 
      bankAccountId: data.bankAccountId,
      type: data.type,
      paymentMethod: data.paymentMethod
    }
  })

  // REVALIDAÇÃO COMPLETA
  revalidatePath('/')
  revalidatePath('/transactions') // Novo
  revalidatePath('/credit-card')  // Novo
  revalidatePath('/recurring')
}

// --- DELETE TRANSACTION ---
export async function deleteTransaction(formData: FormData) {
  const userId = await getValidatedUser()
  const id = formData.get('id') as string

  if (!id) return

  try {
    await prisma.transaction.delete({ 
      where: { 
        id: id,
        userId: userId
      } 
    })
  } catch (error) {
    console.error("Delete Error:", error)
    throw new Error("Failed to delete or unauthorized")
  }

  // REVALIDAÇÃO COMPLETA
  revalidatePath('/')
  revalidatePath('/transactions') // Novo
  revalidatePath('/credit-card')  // Novo
  revalidatePath('/recurring')
}