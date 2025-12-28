import { Prisma } from "@prisma/client" // <--- Importamos os tipos do Prisma
import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

import { auth } from "@/auth"

// --- TIPO SEGURO ---
type CsvField = string | number | null | undefined

const escapeCsv = (field: CsvField): string => {
  if (field === null || field === undefined) return ""
  const stringField = String(field)
  if (stringField.includes(";") || stringField.includes('"') || stringField.includes("\n")) {
    return `"${stringField.replace(/"/g, '""')}"`
  }
  return stringField
}

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const monthParam = searchParams.get("month")
  const yearParam = searchParams.get("year")

  try {
    // 2. Construir o Filtro de Data (CORRIGIDO: Sem 'any')
    // Usamos o tipo oficial DateTimeFilter do Prisma ou undefined
    let dateFilter: Prisma.DateTimeFilter | undefined = undefined

    if (monthParam && yearParam && monthParam !== "all") {
      const year = parseInt(yearParam)
      const month = parseInt(monthParam)

      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 1)

      dateFilter = {
        gte: startDate,
        lt: endDate,
      }
    }

    // 3. Busca no Banco
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: dateFilter, // Agora o TypeScript valida se isso é um filtro de data válido
      },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    })

    // 4. Gerar CSV
    const header = ["Data", "Descrição", "Valor", "Categoria", "Tipo", "Método", "Parcelas"]

    const rows = transactions.map((t) => {
      const dateStr = new Date(t.date).toLocaleDateString("pt-BR")
      const amountVal = Number(t.amount)
      const amountStr = amountVal.toFixed(2).replace(".", ",")

      const installmentsStr = t.currentInstallment ? `Parcela ${t.currentInstallment}` : "À vista"

      return [
        dateStr,
        escapeCsv(t.description),
        amountStr,
        escapeCsv(t.category?.name || "Sem Categoria"),
        t.type === "EXPENSE" ? "Despesa" : "Receita",
        t.paymentMethod,
        escapeCsv(installmentsStr),
      ].join(";")
    })

    const csvContent = [header.join(";"), ...rows].join("\n")
    const csvWithBom = "\uFEFF" + csvContent

    const periodLabel =
      monthParam !== "all" && monthParam && yearParam
        ? `${Number(monthParam) + 1}-${yearParam}`
        : "completo"

    const filename = `mesh-extrato-${periodLabel}.csv`

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[CSV_EXPORT_ERROR]", error)
    return new NextResponse("Erro interno na exportação", { status: 500 })
  }
}
