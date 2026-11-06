import { installmentReference, type Transaction } from '../main/transactions';
import { dateFormat, money, monthFormat } from './format';
import { paymentLabel, paymentMonth } from './payment';

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

function spendingBy(entries: Transaction[], labelFor: (entry: Transaction) => string) {
  const groups = new Map<string, number>();
  for (const entry of entries) {
    if (entry.type !== 'expense') continue;
    const label = labelFor(entry);
    groups.set(label, (groups.get(label) ?? 0) + entry.cents);
  }
  return groups;
}

export function CreditSpending({ entries, allCreditEntries, month }: {
  entries: Transaction[];
  allCreditEntries: Transaction[];
  month: string;
}) {
  const totalsByMonth = spendingBy(allCreditEntries, paymentMonth);
  const nextMonth = new Date(month + '-01T00:00:00Z');
  const upcoming = [];
  for (let offset = 0; offset < 3; offset++) {
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    if (nextMonth.getUTCFullYear() > 9999) break;
    const key = nextMonth.toISOString().slice(0, 7);
    upcoming.push({ key, label: monthFormat.format(nextMonth), cents: totalsByMonth.get(key) ?? 0 });
  }

  return (
    <div className="dashboard-grid credit-spending">
      <SpendingPanel id="credit-spending" title="Gastos no crédito por categoria"
        spending={spendingBy(entries, (entry) => entry.category)} />
      {upcoming.length > 0 && (
        <section className="dashboard-panel" aria-labelledby="credit-upcoming">
          <h2 id="credit-upcoming">Crédito já lançado para os próximos meses</h2>
          <p className="dashboard-empty">Soma das despesas no crédito por mês de vencimento.</p>
          <ul className="spending">
            {upcoming.map(({ key, label, cents }) => (
              <li key={key}><div><span>{label}</span><strong>{money(cents)}</strong></div></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function Dashboard({ entries }: { entries: Transaction[] }) {
  return (
    <div className="dashboard-grid">
      <SpendingPanel id="spending-heading" title="Despesas por categoria" spending={spendingBy(entries, (entry) => entry.category)} />
      <SpendingPanel id="payment-heading" title="Despesas por forma de pagamento" spending={spendingBy(entries, (entry) => paymentLabel(entry.paymentMethod))} />
      <section className="dashboard-panel dashboard-statement" aria-labelledby="statement-heading">
        <h2 id="statement-heading">Extrato do mês</h2>
        <p className="dashboard-empty">Compras no crédito aparecem no mês da fatura. As demais movimentações entram pela data do lançamento.</p>
        {entries.length ? (
          <ul className="statement">
            {entries.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{entry.description}</strong>
                  <span>{entry.category} · {paymentLabel(entry.paymentMethod)} · {entry.type === 'expense' && entry.paymentMethod === 'credit'
                    ? installmentReference(entry.description) ? 'Data da parcela ' : 'Compra em '
                    : ''}{dateFormat.format(new Date(entry.date))}</span>
                </div>
                <strong>{entry.type === 'income' ? '+' : '−'}{money(entry.cents)}</strong>
              </li>
            ))}
          </ul>
        ) : <p className="dashboard-empty">Seus lançamentos do mês aparecem aqui.</p>}
      </section>
    </div>
  );
}
