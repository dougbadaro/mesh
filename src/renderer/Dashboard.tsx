import type { Transaction } from '../main/transactions';
import { dateFormat, money } from './format';

export function Dashboard({ entries, onHistory }: { entries: Transaction[]; onHistory(): void }) {
  const spending = new Map<string, number>();
  for (const entry of entries) {
    if (entry.type === 'expense') spending.set(entry.category, (spending.get(entry.category) ?? 0) + entry.cents);
  }
  const categories = [...spending].sort((a, b) => b[1] - a[1]);
  const total = categories.reduce((sum, [, cents]) => sum + cents, 0);

  return (
    <div className="dashboard-grid">
      <section className="dashboard-panel" aria-labelledby="spending-heading">
        <h2 id="spending-heading">Despesas por categoria</h2>
        {categories.length ? (
          <ul className="spending">
            {categories.map(([category, cents]) => (
              <li key={category}>
                <div><span>{category}</span><strong>{money(cents)}</strong></div>
                <meter aria-label={category} min={0} max={total} value={cents} />
              </li>
            ))}
          </ul>
        ) : <p className="dashboard-empty">Nenhuma despesa registrada neste mês.</p>}
      </section>
      <section className="dashboard-panel" aria-labelledby="recent-heading">
        <div className="section-heading">
          <h2 id="recent-heading">Lançamentos recentes</h2>
          <button type="button" className="quiet" onClick={onHistory}>Ver todos</button>
        </div>
        {entries.length ? (
          <ul className="recent">
            {entries.slice(0, 5).map((entry) => (
              <li key={entry.id}>
                <div><strong>{entry.description}</strong><span>{dateFormat.format(new Date(entry.date))}</span></div>
                <strong>{entry.type === 'income' ? '+' : '−'}{money(entry.cents)}</strong>
              </li>
            ))}
          </ul>
        ) : <p className="dashboard-empty">Seus lançamentos do mês aparecem aqui.</p>}
      </section>
    </div>
  );
}
