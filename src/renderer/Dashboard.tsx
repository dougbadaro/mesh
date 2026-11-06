import type { Transaction } from '../main/transactions';
import { dateFormat, money } from './format';
import { paymentLabel } from './payment';

function SpendingPanel({ id, title, spending }: { id: string; title: string; spending: Map<string, number> }) {
  const groups = [...spending].sort((a, b) => b[1] - a[1]);
  const total = groups.reduce((sum, [, cents]) => sum + cents, 0);
  return (
    <section className="dashboard-panel" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {groups.length ? (
        <ul className="spending">
          {groups.map(([label, cents]) => (
            <li key={label}>
              <div><span>{label}</span><strong>{money(cents)}</strong></div>
              <meter aria-label={label} min={0} max={total} value={cents} />
            </li>
          ))}
        </ul>
      ) : <p className="dashboard-empty">Nenhuma despesa registrada neste mês.</p>}
    </section>
  );
}

export function Dashboard({ entries, onHistory }: { entries: Transaction[]; onHistory(): void }) {
  const categories = new Map<string, number>();
  const payments = new Map<string, number>();
  for (const entry of entries) {
    if (entry.type !== 'expense') continue;
    const label = paymentLabel(entry.paymentMethod);
    categories.set(entry.category, (categories.get(entry.category) ?? 0) + entry.cents);
    payments.set(label, (payments.get(label) ?? 0) + entry.cents);
  }

  return (
    <div className="dashboard-grid">
      <SpendingPanel id="spending-heading" title="Despesas por categoria" spending={categories} />
      <SpendingPanel id="payment-heading" title="Despesas por forma de pagamento" spending={payments} />
      <section className="dashboard-panel dashboard-recent" aria-labelledby="recent-heading">
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
