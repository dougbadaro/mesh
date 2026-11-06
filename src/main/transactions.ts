export const categories = [
  'Academia e esportes',
  'Alimentação',
  'Aluguel e condomínio',
  'Aplicativos de transporte',
  'Assinaturas',
  'Combustível',
  'Compras para casa',
  'Contas da casa',
  'Cuidados pessoais',
  'Educação',
  'Farmácia',
  'Financiamento de veículo',
  'Freelance',
  'Impostos e taxas',
  'Internet e telefone',
  'Lazer',
  'Manutenção de veículo',
  'Mercado',
  'Moradia',
  'Pets',
  'Plano de saúde',
  'Presentes',
  'Reembolso',
  'Restaurantes e delivery',
  'Salário',
  'Saúde',
  'Seguros',
  'Trabalho',
  'Transporte',
  'Vestuário',
  'Viagens',
  'Outros',
] as const;

export type TransactionInput = {
  description: string;
  type: 'expense' | 'income';
  category: typeof categories[number];
  date: string;
  cents: number;
};

export type Transaction = TransactionInput & { id: number };
export type InstallmentPlan = { current: number; total: number };
export type TransactionDraft = TransactionInput & { installments?: InstallmentPlan };
export const maxInstallments = 120;

export function validInstallments({ current, total }: InstallmentPlan) {
  return Number.isInteger(total) && total >= 2 && total <= maxInstallments
    && Number.isInteger(current) && current >= 1 && current <= total;
}

export interface TransactionsApi {
  list(): Promise<Transaction[]>;
  save(input: TransactionDraft, id?: number): Promise<Transaction[]>;
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
