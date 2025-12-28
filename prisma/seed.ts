import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient, TransactionType } from "@prisma/client"
import ws from "ws"

import "dotenv/config"

// 1. Configuração do WebSocket para o Neon (Essencial para seu ambiente)
neonConfig.webSocketConstructor = ws

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined")
}

// 2. Inicialização do Prisma com Adapter do Neon
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Iniciando Seed Mesh Finance...")

  // 3. Limpeza de Segurança (Apaga tudo para começar limpo)
  console.log("🧹 Limpando dados antigos...")
  // A ordem importa por causa das chaves estrangeiras
  await prisma.transaction.deleteMany()
  await prisma.recurringTransaction.deleteMany()
  await prisma.category.deleteMany()
  // Não apagamos usuários (user.deleteMany) para não excluir sua conta Google se já tiver logado.
  // Se quiser zerar usuários também, descomente a linha abaixo:
  // await prisma.user.deleteMany()

  // 4. Criar Categorias GLOBAIS (userId: null)
  // Assim elas aparecem para você e qualquer outro usuário que logar
  console.log("📂 Criando categorias padrão...")

  const globalCategories = [
    // DESPESAS
    { name: "Alimentação", type: TransactionType.EXPENSE },
    { name: "Moradia", type: TransactionType.EXPENSE },
    { name: "Transporte", type: TransactionType.EXPENSE },
    { name: "Lazer", type: TransactionType.EXPENSE },
    { name: "Saúde", type: TransactionType.EXPENSE },
    { name: "Educação", type: TransactionType.EXPENSE },
    { name: "Compras", type: TransactionType.EXPENSE },
    { name: "Assinaturas", type: TransactionType.EXPENSE },

    // RECEITAS
    { name: "Salário", type: TransactionType.INCOME },
    { name: "Investimentos", type: TransactionType.INCOME },
    { name: "Freelance", type: TransactionType.INCOME },
    { name: "Presente", type: TransactionType.INCOME },
    { name: "Outros", type: TransactionType.INCOME },
  ]

  await prisma.category.createMany({
    data: globalCategories.map((cat) => ({
      ...cat,
      userId: null, // Importante: null define como global
    })),
  })

  console.log("✅ Seed finalizado! Categorias criadas.")
  console.log("🚀 Agora você pode logar e inserir seus dados reais.")
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
