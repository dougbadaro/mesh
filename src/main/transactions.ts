import type { CardCycleSettings } from './card-cycle.js';

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

export const paymentMethods = {
  credit: 'Cartão de crédito',
  debit: 'Cartão de débito',
  pix: 'Pix',
  cash: 'Dinheiro',
  transfer: 'Transferência',
  boleto: 'Boleto',
  other: 'Outra forma',
} as const;
export type PaymentMethod = keyof typeof paymentMethods;

export type TransactionInput = {
  description: string;
  type: 'expense' | 'income';
  category: typeof categories[number];
  date: string;
  cents: number;
  paymentMethod?: PaymentMethod | null;
  billingMonth?: string | null;
};

export type Transaction = TransactionInput & { id: number; paymentMethod: PaymentMethod | null; billingMonth: string | null };
export type InstallmentPlan = { current: number; total: number };
export type TransactionDraft = TransactionInput & { installments?: InstallmentPlan; applyPaymentToFuture?: boolean };
export const maxInstallments = 120;

export function validInstallments({ current, total }: InstallmentPlan) {
  return Number.isInteger(total) && total >= 2 && total <= maxInstallments
    && Number.isInteger(current) && current >= 1 && current <= total;
}

export function installmentReference(description: string) {
  const match = /^(.*) \((\d{1,3})\/(\d{1,3})\)$/.exec(description);
  if (!match) return null;
  const plan = { current: Number(match[2]), total: Number(match[3]) };
  return validInstallments(plan) ? { ...plan, name: match[1] } : null;
}

export interface TransactionsApi {
  getCardCycle(): Promise<CardCycleSettings | null>;
  saveCardCycle(settings: CardCycleSettings): Promise<void>;
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
  const paymentMethod = input.paymentMethod ?? null;
  const billingMonth = input.billingMonth ?? null;
  if (billingMonth !== null && (typeof billingMonth !== 'string' || !/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(billingMonth))) {
    throw new Error('Mês da fatura inválido.');
  }
  if (paymentMethod !== null && (typeof paymentMethod !== 'string' || !Object.hasOwn(paymentMethods, paymentMethod))) {
    throw new Error('Forma de pagamento inválida.');
  }
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
  return { description, type: input.type, category: input.category, date: input.date, cents: input.cents, paymentMethod, billingMonth };
}
