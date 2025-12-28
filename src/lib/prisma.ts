import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "@prisma/client"
import ws from "ws"

neonConfig.webSocketConstructor = ws

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is missing")
  }

  // A mesma correção aqui: passamos a config, não a instância
  const adapter = new PrismaNeon({
    connectionString,
  })

  return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
