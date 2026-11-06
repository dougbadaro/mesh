export type CardCycleSettings = { closingDay: number; dueDay: number };

export function validCardCycle(settings: CardCycleSettings) {
  return Boolean(settings && [settings.closingDay, settings.dueDay]
    .every((day) => Number.isInteger(day) && day >= 1 && day <= 31));
}

function dayOfMonth(month: Date, offset: number, day: number) {
  const result = new Date(month);
  result.setUTCMonth(result.getUTCMonth() + offset + 1, 0);
  result.setUTCDate(Math.min(day, result.getUTCDate()));
  return result;
}

export function cardCycleForDate(purchase: string, { closingDay, dueDay }: CardCycleSettings) {
  const month = new Date(purchase.slice(0, 7) + '-01T00:00:00Z');
  const closing = dayOfMonth(month, 0, closingDay);
  const bestDay = new Date(closing);
  bestDay.setUTCDate(bestDay.getUTCDate() + 1);
  const currentDueMonth = dueDay <= closingDay ? 1 : 0;
  const day = Number(purchase.slice(8));
  const closingDate = closing.getUTCDate();
  const offset = currentDueMonth + (day > closingDate ? 1 : 0);

  return {
    closing: closing.toISOString().split('T')[0],
    bestDay: bestDay.toISOString().split('T')[0],
    due: dayOfMonth(month, offset, dueDay).toISOString().split('T')[0],
    alternativeDue: day === closingDate ? dayOfMonth(month, offset + 1, dueDay).toISOString().split('T')[0] : null,
  };
}
