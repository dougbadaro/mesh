"use server"

import { PaymentMethod, TransactionType } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

import { auth } from "@/auth"

const createSchema = z.object({
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  type: z.nativeEnum(TransactionType),
  frequency: z.string(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  startDate: z.string().transform((val) => new Date(val + "T12:00:00")),
  categoryId: z
    .string()
    .optional()
    .transform((val) => (val === "" || val === "general" ? undefined : val)),
  bankAccountId: z
    .string()
    .optional()
    .transform((val) => (val === "" || val === "none" ? null : val)),
})

const editSchema = z.object({
  id: z.string(),
  newAmount: z.coerce.number().positive(),
  newDescription: z.string().min(1),
  newStartDate: z.string().transform((val) => new Date(val + "T12:00:00")),
  newBankAccountId: z
    .string()
    .optional()
    .transform((val) => (val === "" || val === "none" ? null : val)),
  newCategoryId: z
    .string()
    .optional()
    .transform((val) => (val === "" || val === "general" ? null : val)),
})

export async function createRecurring(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Não autorizado" }

    const rawData = {
      description: formData.get("description"),
      amount: formData.get("amount"),
      type: formData.get("type"),
      frequency: formData.get("frequency"),
      paymentMethod: formData.get("paymentMethod"),
      startDate: formData.get("startDate"),
      categoryId: formData.get("categoryId"),
      bankAccountId: formData.get("bankAccountId"),
    }

    const data = createSchema.parse(rawData)

    const recurring = await prisma.recurringTransaction.create({
      data: {
        userId: session.user.id,
        description: data.description,
        amount: data.amount,
        type: data.type,
        frequency: data.frequency,
        paymentMethod: data.paymentMethod,
        startDate: data.startDate,
        categoryId: data.categoryId,
        bankAccountId: data.bankAccountId,
        active: true,
      },
    })

    const transactionsToCreate = []
    const baseDay = data.startDate.getDate()

    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(data.startDate)
      targetDate.setMonth(data.startDate.getMonth() + i)
      targetDate.setDate(baseDay)
      targetDate.setHours(12, 0, 0, 0)

      transactionsToCreate.push({
        amount: data.amount,
        description: `${data.description} (Mensal)`,
        type: data.type,
        paymentMethod: data.paymentMethod,
        userId: session.user.id,
        categoryId: data.categoryId,
        bankAccountId: data.bankAccountId,
        date: targetDate,
        dueDate: targetDate,
        recurringId: recurring.id,
      })
    }

    if (transactionsToCreate.length > 0) {
      await prisma.transaction.createMany({ data: transactionsToCreate })
    }

    revalidatePath("/recurring")
    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "Erro ao criar recorrência" }
  }
}

export async function editRecurring(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Não autorizado" }

    const rawData = {
      id: formData.get("id"),
      newAmount: formData.get("amount"),
      newDescription: formData.get("description"),
      newStartDate: formData.get("startDate"),
      newBankAccountId: formData.get("bankAccountId"),
      newCategoryId: formData.get("categoryId"),
    }

    const data = editSchema.parse(rawData)

    const recurring = await prisma.recurringTransaction.findUnique({
      where: { id: data.id },
    })

    if (!recurring) return { error: "Assinatura não encontrada" }

    await prisma.recurringTransaction.update({
      where: { id: data.id },
      data: {
        amount: data.newAmount,
        description: data.newDescription,
        startDate: data.newStartDate,
        bankAccountId: data.newBankAccountId,
        categoryId: data.newCategoryId,
      },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.transaction.deleteMany({
      where: {
        recurringId: data.id,
        date: { gte: today },
      },
    })

    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const hasPreservedTransaction = await prisma.transaction.findFirst({
      where: {
        recurringId: data.id,
        deletedAt: null,
        date: {
          gte: startOfCurrentMonth,
          lt: today,
        },
      },
    })

    const transactionsToCreate = []
    const baseDay = data.newStartDate.getDate()
    let startMonthOffset = 0

    const currentMonthTarget = new Date(today.getFullYear(), today.getMonth(), baseDay)
    currentMonthTarget.setHours(12, 0, 0, 0)

    if (currentMonthTarget < today || hasPreservedTransaction) {
      startMonthOffset = 1
    }

    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(
        today.getFullYear(),
        today.getMonth() + startMonthOffset + i,
        baseDay
      )
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
        recurringId: recurring.id,
      })
    }

    if (transactionsToCreate.length > 0) {
      await prisma.transaction.createMany({ data: transactionsToCreate })
    }

    revalidatePath("/recurring")
    revalidatePath("/")

    return { success: true }
  } catch {
    return { error: "Erro ao editar assinatura" }
  }
}

export async function stopRecurring(formData: FormData) {
  const id = formData.get("id") as string
  if (!id) return { error: "ID inválido" }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.recurringTransaction.update({
      where: { id },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    })

    await prisma.transaction.deleteMany({
      where: {
        recurringId: id,
        date: { gte: today },
      },
    })

    revalidatePath("/recurring")
    revalidatePath("/")

    return { success: true }
  } catch {
    return { error: "Erro ao excluir assinatura" }
  }
}
