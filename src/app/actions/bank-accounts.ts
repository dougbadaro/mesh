'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { TransactionType, PaymentMethod, Prisma } from "@prisma/client" 

// --- SCHEMAS ---
const bankAccountSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  initialBalance: z.number().default(0),
  type: z.enum(["CHECKING", "INVESTMENT", "CASH"]).default("CHECKING"),
  color: z.string().optional(),
  migrateLegacy: z.boolean().optional(),
  includeInTotal: z.boolean().optional(),
  targetBalance: z.number().optional()
})

// --- TIPO ESTRITO PARA A FUNÇÃO DE CÁLCULO ---
type TransactionSubset = {
    amount: Prisma.Decimal | number; 
    type: TransactionType;
    paymentMethod: PaymentMethod;
    date: Date;
}

// --- FUNÇÃO DE CÁLCULO (A que estava faltando) ---
function calculateRealBalance(initial: number, transactions: TransactionSubset[]) {
  // Define o "agora" como o FINAL do dia de hoje para incluir todas as transações de hoje
  const cutoffDate = new Date();
  cutoffDate.setHours(23, 59, 59, 999); 

  return transactions.reduce((acc, t) => {
    // 1. Ignora transações futuras
    if (new Date(t.date) > cutoffDate) return acc;

    // 2. Ignora Cartão de Crédito
    if (t.paymentMethod === 'CREDIT_CARD') return acc;

    const amount = Number(t.amount);

    if (t.type === 'INCOME') {
      return acc + amount;
    } 
    if (t.type === 'EXPENSE') {
      return acc - amount;
    }
    
    return acc;
  }, Number(initial));
}

// --- ACTIONS ---

export async function createBankAccount(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Não autorizado" }

  const rawData = {
    name: formData.get("name"),
    initialBalance: Number(formData.get("initialBalance") || 0),
    type: formData.get("type"),
    color: formData.get("color"),
    migrateLegacy: formData.get("migrateLegacy") === "true",
    includeInTotal: formData.get("includeInTotal") === "true",
  }

  const result = bankAccountSchema.safeParse(rawData)
  if (!result.success) return { error: "Dados inválidos." }

  try {
    const newAccount = await prisma.bankAccount.create({
      data: {
        userId: session.user.id,
        name: result.data.name,
        initialBalance: result.data.initialBalance,
        type: result.data.type,
        color: result.data.color || "#10b981",
        includeInTotal: result.data.includeInTotal
      }
    })

    let migratedCount = 0
    if (result.data.migrateLegacy) {
      const updateResult = await prisma.transaction.updateMany({
        where: { userId: session.user.id, bankAccountId: null },
        data: { bankAccountId: newAccount.id }
      })
      migratedCount = updateResult.count
    }

    revalidatePath("/settings")
    revalidatePath("/") 
    return { success: true, migratedCount }

  } catch (error) {
    console.error("Erro ao criar carteira:", error)
    return { error: "Erro interno ao criar carteira." }
  }
}

export async function updateBankAccount(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Não autorizado" }

  const rawData = {
    name: formData.get("name"),
    type: formData.get("type"),
    color: formData.get("color"),
    includeInTotal: formData.get("includeInTotal") === "true",
    targetBalance: Number(formData.get("balance") || 0),
    migrateLegacy: formData.get("migrateLegacy") === "true",
  }

  try {
    const account = await prisma.bankAccount.findUnique({
      where: { id, userId: session.user.id },
      include: { 
          transactions: { 
              select: { amount: true, type: true, paymentMethod: true, date: true } 
          } 
      }
    })

    if (!account) return { error: "Conta não encontrada." }

    await prisma.bankAccount.update({
      where: { id },
      data: {
        name: String(rawData.name),
        type: String(rawData.type),
        color: String(rawData.color),
        includeInTotal: rawData.includeInTotal
      }
    })

    let migratedCount = 0
    if (rawData.migrateLegacy) {
         const updateResult = await prisma.transaction.updateMany({
            where: { userId: session.user.id, bankAccountId: null },
            data: { bankAccountId: id }
         })
         migratedCount = updateResult.count
    }

    if (!rawData.migrateLegacy) {
        const currentBalance = calculateRealBalance(Number(account.initialBalance), account.transactions);
    
        const difference = rawData.targetBalance - currentBalance

        if (Math.abs(difference) >= 0.01) {
          const isPositive = difference > 0
          
          await prisma.transaction.create({
            data: {
              userId: session.user.id,
              bankAccountId: id,
              amount: Math.abs(difference),
              type: isPositive ? 'INCOME' : 'EXPENSE',
              description: 'Ajuste Manual de Saldo',
              date: new Date(), 
              paymentMethod: 'OTHER', 
            }
          })
        }
    }

    revalidatePath("/settings")
    revalidatePath("/") 
    return { success: true, migratedCount }

  } catch (error) {
    console.error("Erro ao atualizar:", error)
    return { error: "Erro ao atualizar conta." }
  }
}

export async function getUserBankAccounts() {
  const session = await auth()
  if (!session?.user?.id) return []

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    include: {
        transactions: {
            select: { amount: true, type: true, paymentMethod: true, date: true }
        }
    }
  })

  return accounts.map(acc => {
    // Aqui usamos a função calculateRealBalance que agora está definida no topo
    const balance = calculateRealBalance(Number(acc.initialBalance), acc.transactions);

    return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        color: acc.color,
        includeInTotal: acc.includeInTotal,
        initialBalance: Number(acc.initialBalance),
        currentBalance: balance,
        transactionCount: acc.transactions.length // Usado para avisar no delete
    }
  })
}

// DELETE ATUALIZADO (Aceita apagar transações)
export async function deleteBankAccount(accountId: string, deleteTransactions: boolean = false) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Não autorizado" }

    try {
        const account = await prisma.bankAccount.findUnique({
            where: { id: accountId }
        })

        if (!account || account.userId !== session.user.id) {
            return { error: "Conta não encontrada." }
        }

        if (deleteTransactions) {
            // Apaga todas as transações vinculadas
            await prisma.transaction.deleteMany({
                where: { bankAccountId: accountId }
            })
        }
        // Se deleteTransactions for false, as transações ficam com bankAccountId=null automaticamente

        await prisma.bankAccount.delete({
            where: { id: accountId }
        })

        revalidatePath("/settings")
        revalidatePath("/")
        return { success: true }
    } catch (error) {
        console.error("Erro ao deletar:", error)
        return { error: "Erro ao deletar conta." }
    }
}