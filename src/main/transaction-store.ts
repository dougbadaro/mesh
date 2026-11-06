import { DatabaseSync } from 'node:sqlite';
import { cardCycleForDate, shiftBillingMonth, validCardCycle, type CardCycleSettings } from './card-cycle.js';
import { installmentReference, validateTransaction, validInstallments, type Transaction, type TransactionDraft, type TransactionInput } from './transactions.js';

function installmentDate(date: string, offset: number) {
  const month = new Date(date.slice(0, 7) + '-01T00:00:00Z');
  month.setUTCMonth(month.getUTCMonth() + offset);
  if (month.getUTCFullYear() > 9999) throw new Error('Data da parcela fora do intervalo.');
  const lastDay = new Date(month);
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
  month.setUTCDate(Math.min(Number(date.slice(8)), lastDay.getUTCDate()));
  return month.toISOString().slice(0, 10);
}

export function openTransactionStore(filename: string) {
  const db = new DatabaseSync(filename);
  try {
    db.exec(`
      PRAGMA busy_timeout = 5000;
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        cents INTEGER NOT NULL CHECK(cents BETWEEN 1 AND 999999999999),
        paymentMethod TEXT,
        billingMonth TEXT
      ) STRICT
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS card_cycle (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        closingDay INTEGER NOT NULL CHECK(closingDay BETWEEN 1 AND 31),
        dueDay INTEGER NOT NULL CHECK(dueDay BETWEEN 1 AND 31)
      ) STRICT
    `);
    const columns = db.prepare('PRAGMA table_info(transactions)').all();
    if (!columns.some((column) => column.name === 'paymentMethod')) {
      db.exec('ALTER TABLE transactions ADD COLUMN paymentMethod TEXT');
    }
    if (!columns.some((column) => column.name === 'billingMonth')) {
      db.exec('ALTER TABLE transactions ADD COLUMN billingMonth TEXT');
    }
    db.exec('COMMIT');
  } catch (error) {
    db.close();
    throw error;
  }
  const list = db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC');
  const insert = db.prepare('INSERT INTO transactions (description, type, category, date, cents, paymentMethod, billingMonth) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *');
  const update = db.prepare('UPDATE transactions SET description = ?, type = ?, category = ?, date = ?, cents = ?, paymentMethod = ?, billingMonth = ? WHERE id = ? RETURNING *');
  const get = db.prepare('SELECT * FROM transactions WHERE id = ?');
  const updateFuturePayment = db.prepare(`
    UPDATE transactions SET paymentMethod = ?, billingMonth = ?
    WHERE id = ? AND description = ? AND type = 'expense' AND paymentMethod IS NULL
      AND substr(date, 1, 7) = ?
    RETURNING *
  `);
  const remove = db.prepare('DELETE FROM transactions WHERE id = ?');
  const getCardCycle = db.prepare('SELECT closingDay, dueDay FROM card_cycle WHERE id = 1');
  const saveCardCycle = db.prepare(`
    INSERT INTO card_cycle (id, closingDay, dueDay) VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET closingDay = excluded.closingDay, dueDay = excluded.dueDay
  `);

  function validId(id: number) {
    if (!Number.isSafeInteger(id) || id < 1) throw new Error('Lançamento inválido.');
    return id;
  }

  function insertTransaction({ description, type, category, date, cents, paymentMethod, billingMonth }: TransactionInput) {
    return insert.get(description, type, category, date, cents, paymentMethod ?? null, billingMonth ?? null) as Transaction;
  }

  function editTransaction({ description, type, category, date, cents, paymentMethod, billingMonth }: TransactionInput, id: number) {
    const row = update.get(description, type, category, date, cents, paymentMethod ?? null, billingMonth ?? null, id);
    if (!row) throw new Error('Lançamento não encontrado.');
    return row as Transaction;
  }

  function assignBillingMonth(entry: TransactionInput, original?: Transaction) {
    if (entry.type !== 'expense' || entry.paymentMethod !== 'credit') return null;
    if (entry.billingMonth) return entry.billingMonth;
    if (original?.paymentMethod === 'credit' && original.type === 'expense' && original.date === entry.date) {
      return original.billingMonth;
    }
    const settings = getCardCycle.get() as CardCycleSettings | undefined;
    if (!settings) return null;
    const due = cardCycleForDate(entry.date, settings).due;
    if (!/^\d{4}-/.test(due)) throw new Error('Mês da fatura fora do intervalo.');
    return due.slice(0, 7);
  }

  function atomic<T>(operation: () => T): T {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = operation();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  return {
    getCardCycle: () => (getCardCycle.get() as CardCycleSettings | undefined) ?? null,
    saveCardCycle(settings: CardCycleSettings) {
      if (!validCardCycle(settings)) throw new Error('Dias do cartão inválidos.');
      saveCardCycle.run(settings.closingDay, settings.dueDay);
    },
    list: () => list.all() as Transaction[],
    save(input: TransactionDraft, id?: number): Transaction[] {
      const entry = validateTransaction(input);
      const plan = input.installments;
      if (plan === undefined) {
        if (id === undefined) return [insertTransaction({ ...entry, billingMonth: assignBillingMonth(entry) })];
        validId(id);
        const { paymentMethod } = entry;
        return atomic(() => {
          const original = get.get(id) as Transaction | undefined;
          const billingMonth = assignBillingMonth(entry, original);
          const updated = [editTransaction({ ...entry, billingMonth }, id)];
          if (input.applyPaymentToFuture !== true || !paymentMethod || entry.type !== 'expense') return updated;
          const reference = original?.type === 'expense' ? installmentReference(original.description) : null;
          if (!reference || !original) return updated;

          // Legacy installments were inserted together with consecutive IDs.
          for (let offset = 1; offset <= reference.total - reference.current; offset++) {
            const date = installmentDate(original.date, offset);
            const description = `${reference.name} (${reference.current + offset}/${reference.total})`;
            const invoice = billingMonth ? shiftBillingMonth(billingMonth, offset) : null;
            const row = updateFuturePayment.get(paymentMethod, invoice, id + offset, description, date.slice(0, 7));
            if (row) updated.push(row as Transaction);
          }
          return updated;
        });
      }

      if (!plan || id !== undefined || entry.type !== 'expense' || !validInstallments(plan)) {
        throw new Error('Parcelamento inválido.');
      }
      const billingMonth = assignBillingMonth(entry);
      const rows = Array.from({ length: plan.total - plan.current + 1 }, (_, offset) => validateTransaction({
        ...entry,
        description: `${entry.description} (${plan.current + offset}/${plan.total})`,
        date: installmentDate(entry.date, offset),
        billingMonth: billingMonth ? shiftBillingMonth(billingMonth, offset) : null,
      }));
      return atomic(() => rows.map(insertTransaction));
    },
    remove(id: number) {
      if (!remove.run(validId(id)).changes) throw new Error('Lançamento não encontrado.');
    },
    close: () => db.close(),
  };
}
