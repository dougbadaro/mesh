import { paymentMethods, type PaymentMethod } from '../main/transactions';

export const unknownPayment = 'Não informado';
export const paymentOptions = [
  { value: '', label: unknownPayment },
  ...Object.entries(paymentMethods).map(([value, label]) => ({ value, label })),
];

export function paymentLabel(method: PaymentMethod | null) {
  return method ? paymentMethods[method] : unknownPayment;
}
