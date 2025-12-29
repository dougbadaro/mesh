import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export async function checkAndGenerateRecurringTransactions(userId: string) {
  const activeRecurrings = await prisma.recurringTransaction.findMany({
    where: {
      userId,
      active: true,
      deletedAt: null,
    },
  })

  if (activeRecurrings.length === 0) return

  const transactionsToCreate: Prisma.TransactionCreateManyInput[] = []
  const today = new Date()

  const horizonDate = new Date()
  horizonDate.setFullYear(today.getFullYear() + 1)

  for (const recurring of activeRecurrings) {
    const lastTransaction = await prisma.transaction.findFirst({
      where: {
        recurringId: recurring.id,
        deletedAt: null,
      },
      orderBy: { date: "desc" },
    })

    const nextDate = lastTransaction
      ? new Date(lastTransaction.date)
      : new Date(recurring.startDate)

    if (lastTransaction) {
      nextDate.setMonth(nextDate.getMonth() + 1)
    }

    const baseDay = new Date(recurring.startDate).getDate()

    while (nextDate < horizonDate) {
      const year = nextDate.getFullYear()
      const month = nextDate.getMonth()

      const targetDate = new Date(year, month, baseDay, 12, 0, 0, 0)

      if (targetDate.getMonth() !== month) {
        targetDate.setDate(0)
      }

      transactionsToCreate.push({
        userId: recurring.userId,
        description: `${recurring.description} (Mensal)`,
        amount: recurring.amount,
        type: recurring.type,
        paymentMethod: recurring.paymentMethod,
        categoryId: recurring.categoryId,
        bankAccountId: recurring.bankAccountId,
        recurringId: recurring.id,
        date: targetDate,
        dueDate: targetDate,
      })

      nextDate.setMonth(nextDate.getMonth() + 1)
      nextDate.setDate(baseDay)
    }
  }

  if (transactionsToCreate.length > 0) {
    await prisma.transaction.createMany({
      data: transactionsToCreate,
    })
  }
}
