import { DatabaseSync } from 'node:sqlite';
import { validateTransaction, type Transaction, type TransactionInput } from './transactions.js';

export function openTransactionStore(filename: string) {
  const db = new DatabaseSync(filename);
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      cents INTEGER NOT NULL CHECK(cents BETWEEN 1 AND 999999999999)
    ) STRICT
  `);
  const list = db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC');
  const insert = db.prepare('INSERT INTO transactions (description, type, category, date, cents) VALUES (?, ?, ?, ?, ?) RETURNING *');
  const update = db.prepare('UPDATE transactions SET description = ?, type = ?, category = ?, date = ?, cents = ? WHERE id = ? RETURNING *');
  const remove = db.prepare('DELETE FROM transactions WHERE id = ?');

  function validId(id: number) {
    if (!Number.isSafeInteger(id) || id < 1) throw new Error('Lançamento inválido.');
    return id;
  }

  return {
    list: () => list.all() as Transaction[],
    save(input: TransactionInput, id?: number): Transaction {
      const { description, type, category, date, cents } = validateTransaction(input);
      const row = id === undefined
        ? insert.get(description, type, category, date, cents)
        : update.get(description, type, category, date, cents, validId(id));
      if (!row) throw new Error('Lançamento não encontrado.');
      return row as Transaction;
    },
    remove(id: number) {
      if (!remove.run(validId(id)).changes) throw new Error('Lançamento não encontrado.');
    },
    close: () => db.close(),
  };
}
