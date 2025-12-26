'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { TransactionType, PaymentMethod, Prisma } from "@prisma/client"
import { auth } from "@/auth"

// --- CONFIGURAÇÕES DO CARTÃO ---
const CARD_CLOSING_DAY = 6 // Dia que fecha a fatura
const CARD_DUE_DAY = 10    // Dia que vence a fatura

// --- SCHEMAS ---
const transactionSchema = z.object({
  amount: z.coerce.number().positive(),
  description: z.string().min(1),
  type: z.nativeEnum(TransactionType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  categoryId: z.string().optional().transform(val => val === "" ? undefined : val),
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
  date: z.string(),
})

// --- CREATE TRANSACTION ---
export async function createTransaction(formData: FormData) {
  const session = await auth()
  
  if (!session?.user?.id) {
     throw new Error("Usuário não autenticado")
  }

  const userId = session.user.id
  const rawData = Object.fromEntries(formData.entries())
  const result = transactionSchema.safeParse(rawData)

  if (!result.success) {
    console.error(result.error.format())
    throw new Error("Dados inválidos")
  }

  const data = result.data
  const purchaseDate = new Date(data.date + "T12:00:00")
  
  const transactionsToCreate: Prisma.TransactionCreateManyInput[] = []

  // ==========================================================
  // PRIORIDADE 1: RECORRÊNCIA (Assinaturas)
  // ==========================================================
  if (data.isRecurring === 'true') {
    
    // 1. Cria o registro Pai (Assinatura)
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
        isFixed: true
      }
    })

    // 2. Define o deslocamento inicial (Pular mês?)
    // Se for Cartão e passou do dia 8, a 1ª ocorrência visual já é no próximo mês
    let startMonthOffset = 0
    if (data.paymentMethod === 'CREDIT_CARD' && purchaseDate.getDate() >= CARD_CLOSING_DAY) {
        startMonthOffset = 1
    }

    // 3. Gera os lançamentos
    const repeatMonths = 12 
    for (let i = 0; i < repeatMonths; i++) {
      const monthIncrement = i + startMonthOffset

      // Data Visual: Data da compra + meses de incremento
      // Ex: Compra dia 20/Jan. Offset 1. i=0.
      // Visual = 20/Jan + 1 mês = 20/Fev.
      const visualDate = new Date(purchaseDate)
      visualDate.setMonth(purchaseDate.getMonth() + monthIncrement)
      
      let dueDate = new Date(visualDate)

      // Se for Cartão, vencimento é dia 10 do mesmo mês visual
      if (data.paymentMethod === 'CREDIT_CARD') {
         dueDate.setDate(CARD_DUE_DAY)
         // O mês do vencimento acompanha o mês visual (que já foi ajustado pelo offset)
      } else {
         // Se não for cartão, vence no dia da ocorrência
         dueDate = visualDate
      }

      transactionsToCreate.push({
        amount: data.amount, 
        description: data.description, 
        type: data.type,
        paymentMethod: data.paymentMethod,
        userId: userId,
        categoryId: data.categoryId ?? null,
        date: visualDate, // Agora aparece no Dashboard do mês correto (Fatura)
        dueDate: dueDate,
        recurringId: recurring.id 
      })
    }
  }

  // ==========================================================
  // PRIORIDADE 2: CARTÃO DE CRÉDITO (Parcelado ou À Vista)
  // ==========================================================
  else if (data.paymentMethod === 'CREDIT_CARD') {
    
    let startMonthOffset = 0
    if (purchaseDate.getDate() >= CARD_CLOSING_DAY) {
       startMonthOffset = 1
    }

    const installmentsCount = (data.installments && data.installments > 1) ? data.installments : 1
    const amountPerInstallment = data.amount 

    for (let i = 0; i < installmentsCount; i++) {
      const monthIncrement = startMonthOffset + i

      const visualDate = new Date(purchaseDate)
      visualDate.setMonth(purchaseDate.getMonth() + monthIncrement)

      const dueDate = new Date(purchaseDate)
      dueDate.setDate(CARD_DUE_DAY) 
      dueDate.setMonth(purchaseDate.getMonth() + monthIncrement)

      let description = data.description
      if (installmentsCount > 1) {
        description = `${data.description} (${i + 1}/${installmentsCount})`
      }

      transactionsToCreate.push({
        amount: amountPerInstallment,
        description: description,
        type: data.type,
        paymentMethod: data.paymentMethod,
        userId: userId,
        categoryId: data.categoryId ?? null,
        date: visualDate, 
        dueDate: dueDate,
        currentInstallment: installmentsCount > 1 ? i + 1 : null,
      })
    }
  } 

  // ==========================================================
  // PRIORIDADE 3: OUTROS (Pix, Débito, etc)
  // ==========================================================
  else {
    transactionsToCreate.push({
      amount: data.amount,
      description: data.description,
      type: data.type,
      paymentMethod: data.paymentMethod,
      userId: userId,
      categoryId: data.categoryId ?? null,
      date: purchaseDate,
      dueDate: purchaseDate,
    })
  }

  if (transactionsToCreate.length > 0) {
    await prisma.transaction.createMany({
      data: transactionsToCreate
    })
  }

  revalidatePath('/')
  revalidatePath('/recurring')
}


// --- UPDATE TRANSACTION ---
export async function updateTransaction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Não autorizado")

  const rawData = {
    id: formData.get('id'),
    description: formData.get('description'),
    amount: formData.get('amount'),
    date: formData.get('date'),
    categoryId: formData.get('categoryId'),
    type: formData.get('type'),
    paymentMethod: formData.get('paymentMethod'),
  }

  const result = updateSchema.safeParse(rawData)
  if (!result.success) throw new Error("Dados inválidos")

  const data = result.data
  const purchaseDate = new Date(data.date + "T12:00:00")
  
  const visualDate = new Date(purchaseDate)
  const dueDate = new Date(purchaseDate)

  // Reaplica regra do cartão na edição
  if (data.paymentMethod === 'CREDIT_CARD') {
     let startMonthOffset = 0
     if (purchaseDate.getDate() >= CARD_CLOSING_DAY) {
        startMonthOffset = 1
     }
     // Ajusta a data visual e o vencimento
     visualDate.setMonth(purchaseDate.getMonth() + startMonthOffset)
     
     dueDate.setDate(CARD_DUE_DAY)
     dueDate.setMonth(purchaseDate.getMonth() + startMonthOffset)
  }

  await prisma.transaction.update({
    where: { id: data.id },
    data: {
      description: data.description,
      amount: data.amount,
      date: visualDate, 
      dueDate: dueDate,
      categoryId: data.categoryId, 
      type: data.type,
      paymentMethod: data.paymentMethod
    }
  })

  revalidatePath('/')
  revalidatePath('/recurring')
}


// --- DELETE TRANSACTION ---
export async function deleteTransaction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return

  const id = formData.get('id') as string
  if (!id) return

  try {
    await prisma.transaction.delete({ where: { id } })
  } catch (error) {
    console.error("Erro ao deletar:", error)
  }

  revalidatePath('/')
  revalidatePath('/recurring')
}