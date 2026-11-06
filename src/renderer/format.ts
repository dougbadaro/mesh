const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });
export const money = (cents: number) => currency.format(cents / 100);
