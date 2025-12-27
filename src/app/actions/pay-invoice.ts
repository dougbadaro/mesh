"use server"

import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
// Importamos o Enum PaymentMethod para garantir que o tipo bata com o banco
import { TransactionType, PaymentMethod } from "@prisma/client"

export async function payInvoice(formData: FormData) {
  const user = await getAuthenticatedUser()

  const amount = parseFloat(formData.get("amount") as string)
  const bankAccountId = formData.get("bankAccountId") as string
  const date = new Date(formData.get("date") as string)
  const description = formData.get("description") as string

  if (!amount || !bankAccountId) {
    return { success: false, message: "Dados inválidos" }
  }

  try {
    // 1. Tenta achar uma categoria de "Ajustes" ou "Pagamentos"
    const category = await prisma.category.findFirst({
        where: { 
            userId: user.id, 
            name: { contains: "Pagamento", mode: "insensitive" } 
        }
    })

    // 2. Cria a transação de SAÍDA na conta bancária
    await prisma.transaction.create({
      data: {
        description,
        amount,
        date,
        type: TransactionType.EXPENSE, 
        
        // CORREÇÃO AQUI: Usamos o Enum oficial e definimos como PIX
        paymentMethod: PaymentMethod.PIX,        

        userId: user.id,
        bankAccountId,
        categoryId: category?.id || null, 
      }
    })

    revalidatePath("/")
    revalidatePath("/credit-card")
    
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Erro ao processar pagamento" }
  }
}