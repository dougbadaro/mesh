"use server"

import Groq from "groq-sdk"
import { unstable_cache } from "next/cache"

import { getAuthenticatedUser } from "@/lib/auth-check"
import { prisma } from "@/lib/prisma"

export interface AnalysisResult {
  summary: string
  insights: string[]
  budget_analysis: {
    status: "CRITICAL" | "WARNING" | "OK"
    ceiling_vs_real: string
    comment: string
  }
  actionable_steps: string[]
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE"
  error?: string
}

interface ProcessedCategory {
  name: string
  spent: number
  limit: number
  isInvestment: boolean
}

interface TopTransaction {
  date: string
  description: string
  amount: number
  category: string
}

interface AnalysisPayload {
  totalIncome: number
  balance: number
  totalSpent: number
  investmentTotal: number
  consumptionTotal: number
  totalBudgetLimit: number
  investmentBudget: number
  consumptionBudget: number
  categories: ProcessedCategory[]
  topTransactions: TopTransaction[]
}

const INVESTMENT_KEYWORDS = [
  "investimento", "investimentos", "aporte", "poupança", "guardar", 
  "corretora", "b3", "cripto", "bitcoin", "ações", "fiis", "cdb", 
  "tesouro", "reserva", "emergência", "nuinvest", "xp", "btg", "rico", "binance"
]

async function callGroq(data: AnalysisPayload, monthName: string, year: number): Promise<AnalysisResult> {
  if (!process.env.GROQ_API_KEY) {
    return {
      summary: "Erro de Configuração",
      insights: [],
      budget_analysis: { status: "OK", ceiling_vs_real: "-", comment: "-" },
      actionable_steps: [],
      sentiment: "NEUTRAL",
      error: "Chave API da Groq não configurada."
    }
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const prompt = `
      Você é um Mentor de Riqueza Pessoal experiente e direto.
      Analise o desempenho financeiro de ${monthName}/${year}.

      --- BALANÇO GERAL ---
      • Receita: R$ ${data.totalIncome.toFixed(2)}
      • Saldo Final: R$ ${data.balance.toFixed(2)}

      --- ANÁLISE DE CONSUMO (O Gasto "Ruim") ---
      • Teto Planejado para Consumo: R$ ${data.consumptionBudget.toFixed(2)}
      • Gasto Realizado: R$ ${data.consumptionTotal.toFixed(2)}
      • Situação: ${data.consumptionTotal > data.consumptionBudget ? "ESTOUROU O ORÇAMENTO" : "DENTRO DA META"}

      --- ANÁLISE DE INVESTIMENTOS (O Gasto "Bom") ---
      • Meta de Aporte: R$ ${data.investmentBudget.toFixed(2)}
      • Aporte Realizado: R$ ${data.investmentTotal.toFixed(2)}
      • Situação: ${data.investmentTotal > data.investmentBudget ? "SUPEROU A META (ÓTIMO)" : "ABAIXO DA META"}

      --- DETALHE POR CATEGORIA ---
      ${data.categories.map((c) => {
        const diff = c.spent - c.limit;
        const type = c.isInvestment ? "[INVESTIMENTO]" : "[CONSUMO]";
        let msg = "";
        
        if (c.limit === 0) msg = "Sem teto definido";
        else if (c.isInvestment && diff > 0) msg = `Aportou R$ ${diff.toFixed(2)} acima da meta (PARABÉNS)`;
        else if (!c.isInvestment && diff > 0) msg = `Estourou R$ ${diff.toFixed(2)} (ATENÇÃO)`;
        else msg = "Dentro do planejado";

        return `- ${c.name} ${type}: Realizado R$ ${c.spent.toFixed(2)} vs Meta R$ ${c.limit.toFixed(2)} -> ${msg}`
      }).join("\n")}

      --- TOP 15 MOVIMENTAÇÕES ---
      ${data.topTransactions.map((t) => 
        `- ${t.date}: ${t.description} (R$ ${t.amount.toFixed(2)}) [${t.category}]`
      ).join("\n")}

      --- REGRAS DO MENTOR ---
      1. **FOCO NO CONSUMO:** Se ele estourou o "Teto de Consumo", seja duro. É dinheiro queimado.
      2. **ELOGIE O INVESTIMENTO:** Se ele estourou o "Teto de Investimento" (aportou mais que a meta), elogie muito. Isso é liberdade financeira sendo construída.
      3. **ANÁLISE DO TETO GLOBAL:** O teto global mostrado na tela é R$ ${data.totalBudgetLimit.toFixed(2)}.
         - Se o realizado total (R$ ${data.totalSpent.toFixed(2)}) for maior que o teto SÓ por causa de investimentos: Sentimento POSITIVE.
         - Se for maior por causa de consumo: Sentimento NEGATIVE.
      4. **SEM DESCULPAS:** Se gastou em supérfluos e não bateu a meta de investimento, aponte a troca ruim que ele fez.

      --- FORMATO JSON ---
      {
        "summary": "Frase de impacto sobre o resultado. Ex: 'Você viveu um degrau acima do padrão' ou 'Mês de construção de patrimônio exemplar'.",
        "insights": [
          "Observação sobre consumo vs investimento.",
          "Destaque de uma categoria ou transação específica.",
          "Análise de tendência."
        ],
        "budget_analysis": {
          "status": "CRITICAL" | "WARNING" | "OK",
          "ceiling_vs_real": "R$ ${data.totalSpent.toFixed(2)} / R$ ${data.totalBudgetLimit.toFixed(2)}",
          "comment": "Comentário sobre o cumprimento das metas (diferenciando consumo de aporte)."
        },
        "actionable_steps": [
          "Missão 1", 
          "Missão 2", 
          "Missão 3"
        ],
        "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE"
      }
    `

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }, 
      temperature: 0.5,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error("Resposta vazia da IA")

    return JSON.parse(content)

  } catch (error) {
    console.error("ERRO GROQ:", error)
    return {
      summary: "Erro na Análise",
      insights: [],
      budget_analysis: { status: "OK", ceiling_vs_real: "-", comment: "IA Indisponível" },
      actionable_steps: [],
      sentiment: "NEUTRAL",
      error: "IA indisponível no momento."
    }
  }
}

export async function getMonthlyAnalysis(month: number, year: number) {
  const user = await getAuthenticatedUser()

  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)

  const [categories, transactions] = await Promise.all([
    prisma.category.findMany({
      where: { OR: [{ userId: user.id }, { userId: null }] },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: startOfMonth, lte: endOfMonth },
        deletedAt: null
      },
      include: { category: true },
      orderBy: { date: 'desc' }
    }),
  ])

  if (transactions.length === 0) {
    return {
      summary: "Sem dados para análise.",
      insights: ["Registre suas movimentações para que eu possa te ajudar."],
      budget_analysis: { status: "OK", ceiling_vs_real: "R$ 0,00 / R$ 0,00", comment: "Sem dados." },
      actionable_steps: [],
      sentiment: "NEUTRAL"
    } as AnalysisResult
  }

  const spendingMap = new Map<string, number>()
  
  let totalSpent = 0
  let totalIncome = 0

  transactions.forEach((t) => {
    const val = Number(t.amount)

    if (t.type === "INCOME") {
      totalIncome += val
    } 
    else if (t.type === "EXPENSE") {
      totalSpent += val
      if (t.categoryId) {
        const current = spendingMap.get(t.categoryId) || 0
        spendingMap.set(t.categoryId, current + val)
      }
    }
  })

  let totalBudgetLimit = 0
  let investmentBudget = 0
  let consumptionBudget = 0
  let investmentTotal = 0
  let consumptionTotal = 0

  const processedCategories: ProcessedCategory[] = categories.map((cat) => {
    const spent = spendingMap.get(cat.id) || 0
    const limit = cat.budgetLimit ? Number(cat.budgetLimit) : 0
    const lowerName = cat.name.toLowerCase()
    const isInvestment = INVESTMENT_KEYWORDS.some(k => lowerName.includes(k))

    if (limit > 0) {
      totalBudgetLimit += limit
      
      if (isInvestment) investmentBudget += limit
      else consumptionBudget += limit
    }

    if (isInvestment) {
      investmentTotal += spent
    } else {
      consumptionTotal += spent
    }

    return {
      name: cat.name,
      spent,
      limit,
      isInvestment
    }
  })

  const uncategorizedSpent = totalSpent - (investmentTotal + consumptionTotal)
  if (uncategorizedSpent > 0) {
    consumptionTotal += uncategorizedSpent
  }

  const topTransactions: TopTransaction[] = transactions
    .filter(t => t.type === "EXPENSE")
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 15)
    .map(t => ({
      date: t.date.toLocaleDateString('pt-BR'),
      description: t.description,
      amount: Number(t.amount),
      category: t.category?.name || "Geral"
    }))

  const payload: AnalysisPayload = {
    totalIncome,
    balance: totalIncome - totalSpent,
    totalSpent,
    investmentTotal,
    consumptionTotal,
    totalBudgetLimit,
    investmentBudget,
    consumptionBudget,
    categories: processedCategories,
    topTransactions
  }

  const cacheKey = `analysis-groq-v18-${user.id}-${month}-${year}-${transactions.length}-${totalSpent}-${totalBudgetLimit}`

  const getCachedAnalysis = unstable_cache(
    async () => {
      const monthName = startOfMonth.toLocaleString("pt-BR", { month: "long" })
      return await callGroq(payload, monthName, year)
    },
    [cacheKey],
    { revalidate: 3600 * 24 }
  )

  return await getCachedAnalysis()
}