'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Schema atualizado para receber a DATA
const editSchema = z.object({
  id: z.string(),
  newAmount: z.coerce.number().positive(),
  newDescription: z.string().min(1),
  // Recebemos como string YYYY-MM-DD e transformamos em Date ao meio-dia para evitar bugs de fuso
  newStartDate: z.string().transform((val) => new Date(val + "T12:00:00")),
})

export async function editRecurring(formData: FormData) {
  const session = await auth()
  
  if (!session?.user?.email) {
     throw new Error("Usuário não autenticado")
  }

  // Busca o usuário no banco pelo email da sessão
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) throw new Error("Usuário não encontrado")
    
  const rawData = {
    id: formData.get('id'),
    newAmount: formData.get('amount'),
    newDescription: formData.get('description'),
    newStartDate: formData.get('startDate'), // Novo campo vindo do form
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
      startDate: data.newStartDate, // <--- Atualizamos a data base aqui
    }
  })

  // 3. A MÁGICA: Limpa o Futuro e Regenera com a NOVA data
  const today = new Date()
  
  // Apaga transações futuras (preserva histórico)
  await prisma.transaction.deleteMany({
    where: {
      recurringId: data.id,
      dueDate: { gte: today } 
    }
  })

  // Regenera os próximos 12 meses
  const transactionsToCreate = []
  
  // CORREÇÃO CRUCIAL: Usamos o dia da NOVA data escolhida
  const baseDay = data.newStartDate.getDate()

  for (let i = 0; i < 12; i++) {
    // Cria a data baseada no mês atual + i, mas com o NOVO dia
    const targetDate = new Date(today.getFullYear(), today.getMonth() + i, baseDay)
    
    // Lógica de ajuste: Se a data gerada já passou neste mês (ex: hoje é 23, mudou pro dia 10),
    // a próxima cobrança deve ser só no mês que vem.
    if (i === 0 && targetDate < today) {
       targetDate.setMonth(targetDate.getMonth() + 1)
    }

    // Ajuste fino para Cartão de Crédito (Vencimento vs Competência)
    // Se quiser manter a lógica de que cartão vence dia 10, você pode adicionar aqui,
    // mas geralmente em despesa fixa de cartão, a data que o usuário coloca é a data da compra.
    
    transactionsToCreate.push({
      amount: data.newAmount,
      description: `${data.newDescription} (Mensal)`,
      type: recurring.type,
      paymentMethod: recurring.paymentMethod,
      userId: recurring.userId,
      categoryId: recurring.categoryId,
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
}