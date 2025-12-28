import { BankAccount, Category, Transaction, TransactionType } from "@prisma/client"

export type TransactionWithRelations = Transaction & {
  category: Category | null
  bankAccount: BankAccount | null
}

export interface SafeCategory {
  id: string
  name: string
  type: string
  userId: string | null
  budgetLimit: number | null
  createdAt: string
  updatedAt: string
}

export interface SafeAccount {
  id: string
  name: string
  type: string
  color: string | null
  initialBalance: number
  includeInTotal: boolean
}

export interface SafeTransaction {
  id: string
  description: string
  amount: number
  type: TransactionType
  paymentMethod: string
  date: string
  dueDate: string | null
  categoryId: string | null
  bankAccountId: string | null
  category: SafeCategory | null
  bankAccount: { name: string; color: string | null } | null
}

export function toSafeCategory(category: Category): SafeCategory {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    userId: category.userId,
    budgetLimit: category.budgetLimit ? Number(category.budgetLimit) : null,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  }
}

export function toSafeAccount(account: BankAccount): SafeAccount {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    color: account.color,
    initialBalance: Number(account.initialBalance),
    includeInTotal: account.includeInTotal,
  }
}

export function toSafeTransaction(t: TransactionWithRelations): SafeTransaction {
  return {
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    paymentMethod: t.paymentMethod,
    date: t.date.toISOString(),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    categoryId: t.categoryId,
    bankAccountId: t.bankAccountId,
    category: t.category ? toSafeCategory(t.category) : null,
    bankAccount: t.bankAccount
      ? {
          name: t.bankAccount.name,
          color: t.bankAccount.color,
        }
      : null,
  }
}