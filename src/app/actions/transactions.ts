"use server"

import { PaymentMethod, Prisma, TransactionType } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

import { auth } from "@/auth"

const transactionSchema = z.object({
  amount: z.coerce.number().positive(),
  description: z.string().min(1),
  type: z.nativeEnum(TransactionType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  categoryId: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  bankAccountId: z
    .string()
    .optional()
    .transform((val) => (val === "" ? null : val)),
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
  categoryId: z
    .string()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  bankAccountId: z
    .string()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  date: z.string(),
})

async function getValidatedUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function createTransaction(formData: FormData) {
  try {
    const userId = await getValidatedUser()

    const userSettings = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditCardClosingDay: true, creditCardDueDay: true },
    })

    const closingDay = userSettings?.creditCardClosingDay ?? 6
    const dueDay = userSettings?.creditCardDueDay ?? 10

    const rawData = Object.fromEntries(formData.entries())
    const result = transactionSchema.safeParse(rawData)

    if (!result.success) return { error: "Dados inválidos." }

    const data = result.data
    const purchaseDate = new Date(data.date + "T12:00:00")
    const transactionsToCreate: Prisma.TransactionCreateManyInput[] = []

    if (data.isRecurring === "true") {
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
          frequency: "MONTHLY",
          isFixed: true,
        },
      })

      const startMonthOffset =
        data.paymentMethod === "CREDIT_CARD" && purchaseDate.getDate() >= closingDay ? 1 : 0

      for (let i = 0; i < 12; i++) {
        const monthIncrement = i + startMonthOffset
        const visualDate = new Date(purchaseDate)
        visualDate.setMonth(purchaseDate.getMonth() + monthIncrement)

        const dueDate = new Date(visualDate)
        if (data.paymentMethod === "CREDIT_CARD") dueDate.setDate(dueDay)

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
          recurringId: recurring.id,
        })
      }
    } else if (data.paymentMethod === "CREDIT_CARD") {
      const startMonthOffset = purchaseDate.getDate() >= closingDay ? 1 : 0
      const installmentsCount = data.installments && data.installments > 1 ? data.installments : 1

      for (let i = 0; i < installmentsCount; i++) {
        const monthIncrement = startMonthOffset + i
        const visualDate = new Date(purchaseDate)
        visualDate.setMonth(purchaseDate.getMonth() + monthIncrement)

        const dueDate = new Date(purchaseDate)
        dueDate.setDate(dueDay)
        dueDate.setMonth(purchaseDate.getMonth() + monthIncrement)

        transactionsToCreate.push({
          amount: data.amount,
          description:
            installmentsCount > 1
              ? `${data.description} (${i + 1}/${installmentsCount})`
              : data.description,
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
    } else {
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

    revalidatePath("/")
    revalidatePath("/transactions")
    revalidatePath("/credit-card")
    revalidatePath("/recurring")
    revalidatePath("/settings")

    return { success: true }
  } catch {
    return { error: "Erro ao criar transação." }
  }
}

export async function updateTransaction(formData: FormData) {
  try {
    const userId = await getValidatedUser()

    const userSettings = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditCardDueDay: true },
    })

    const dueDay = userSettings?.creditCardDueDay ?? 10

    const result = updateSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!result.success) return { error: "Dados inválidos." }

    const data = result.data
    const purchaseDate = new Date(data.date + "T12:00:00")

    const visualDate = new Date(purchaseDate)
    const dueDate = new Date(purchaseDate)

    if (data.paymentMethod === "CREDIT_CARD") {
      dueDate.setDate(dueDay)
    }

    await prisma.transaction.update({
      where: {
        id: data.id,
        userId: userId,
      },
      data: {
        description: data.description,
        amount: data.amount,
        date: visualDate,
        dueDate: dueDate,
        categoryId: data.categoryId,
        bankAccountId: data.bankAccountId,
        type: data.type,
        paymentMethod: data.paymentMethod,
      },
    })

    revalidatePath("/")
    revalidatePath("/transactions")
    revalidatePath("/credit-card")
    revalidatePath("/recurring")

    return { success: true }
  } catch {
    return { error: "Erro ao atualizar transação." }
  }
}

export async function deleteTransaction(id: string) {
  if (!id) return { error: "ID inválido" }

  try {
    const userId = await getValidatedUser()

    const transaction = await prisma.transaction.findUnique({
      where: { id },
    })

    if (!transaction || transaction.userId !== userId) {
      return { error: "Transação não encontrada ou não autorizada." }
    }

    await prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })

    revalidatePath("/")
    revalidatePath("/transactions")
    revalidatePath("/credit-card")
    revalidatePath("/recurring")

    return { success: true }
  } catch {
    return { error: "Erro ao deletar transação." }
  }
}
