export const categories = [
  'Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Trabalho', 'Outros',
] as const;

export type TransactionInput = {
  description: string;
  type: 'expense' | 'income';
  category: typeof categories[number];
  date: string;
  cents: number;
};

export type Transaction = TransactionInput & { id: number };

export interface TransactionsApi {
  list(): Promise<Transaction[]>;
  save(input: TransactionInput, id?: number): Promise<Transaction>;
  remove(id: number): Promise<void>;
}

export function validateTransaction(input: TransactionInput): TransactionInput {
  if (!input || typeof input.description !== 'string') throw new Error('Descrição inválida.');
  const description = input.description.trim();
  if (!description || description.length > 120) throw new Error('Descrição inválida.');
  if (input.type !== 'income' && input.type !== 'expense') throw new Error('Tipo inválido.');
  if (!categories.includes(input.category)) throw new Error('Categoria inválida.');
  if (!Number.isSafeInteger(input.cents) || input.cents < 1 || input.cents > 999_999_999_999) {
    throw new Error('Valor inválido.');
  }
  if (typeof input.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.date) || input.date.startsWith('0000')) {
    throw new Error('Data inválida.');
  }
  const date = new Date(input.date + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || !date.toISOString().startsWith(input.date)) {
    throw new Error('Data inválida.');
  }
  return { description, type: input.type, category: input.category, date: input.date, cents: input.cents };
}
