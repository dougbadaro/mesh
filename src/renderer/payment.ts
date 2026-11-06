import { paymentMethods, type PaymentMethod, type Transaction } from '../main/transactions';

export const unknownPayment = 'Não informado';
export const paymentOptions = [
  { value: '', label: unknownPayment },
  ...Object.entries(paymentMethods).map(([value, label]) => ({ value, label })),
];

export function paymentLabel(method: PaymentMethod | null) {
  return method ? paymentMethods[method] : unknownPayment;
}

export function paymentMonth(entry: Transaction) {
  const purchaseMonth = entry.date.slice(0, 7);
  return entry.type === 'expense' && entry.paymentMethod === 'credit'
    ? entry.billingMonth ?? purchaseMonth
    : purchaseMonth;
}
