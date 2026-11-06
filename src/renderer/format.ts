const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });
export const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
export const money = (cents: number) => currency.format(cents / 100);

export function parseReais(value: string) {
  let amount = value.trim().replace(/^R\$\s*/i, '');
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(amount)) amount = amount.replaceAll('.', '');
  if (!/^\d{1,10}(?:[,.]\d{1,2})?$/.test(amount)) return null;
  const [whole, fraction = ''] = amount.split(/[,.]/);
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
