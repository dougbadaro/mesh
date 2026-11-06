import { useEffect, useState } from 'react';
import type { Transaction, TransactionInput, TransactionsApi } from '../main/transactions';
import { Modal, today, TransactionForm } from './TransactionForm';
import { Choice, DatePicker } from './controls';
import { Dashboard } from './Dashboard';
import { dateFormat, money } from './format';
import logo from './mesh.svg?no-inline';

declare global {
  interface Window {
    meshTransactions?: TransactionsApi;
  }
}

const api = window.meshTransactions;
const types = [{ value: 'all', label: 'Todos os tipos' }, { value: 'income', label: 'Receitas' }, { value: 'expense', label: 'Despesas' }];

export function App() {
  const [screen, setScreen] = useState<'dashboard' | 'transactions'>('dashboard');
  const [entries, setEntries] = useState<Transaction[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [month, setMonth] = useState(() => today().slice(0, 7));
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [editing, setEditing] = useState<Transaction | null | undefined>();
  const [deleting, setDeleting] = useState<Transaction>();
  const [deleteError, setDeleteError] = useState(false);
  const [deletingBusy, setDeletingBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void api?.list().then(
      (rows) => { if (active) setEntries(rows); },
      () => { if (active) setLoadError(true); },
    );
    return () => { active = false; };
  }, [attempt]);

  const monthEntries = (entries ?? []).filter((entry) => entry.date.slice(0, 7) === month);
  const income = monthEntries.reduce((sum, entry) => sum + (entry.type === 'income' ? entry.cents : 0), 0);
  const expenses = monthEntries.reduce((sum, entry) => sum + (entry.type === 'expense' ? entry.cents : 0), 0);
  const search = query.trim().toLocaleLowerCase('pt-BR');
  const visible = monthEntries.filter((entry) => (kind === 'all' || entry.type === kind)
    && `${entry.description} ${entry.category}`.toLocaleLowerCase('pt-BR').includes(search));

  async function save(input: TransactionInput, id?: number) {
    if (!api) return;
    const saved = await api.save(input, id);
    setEntries((current) => [saved, ...(current ?? []).filter((entry) => entry.id !== saved.id)]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id));
    setMonth(saved.date.slice(0, 7));
    setKind('all');
    setQuery('');
    setEditing(undefined);
  }

  async function remove() {
    if (!api || !deleting || deletingBusy) return;
    setDeletingBusy(true);
    setDeleteError(false);
    try {
      await api.remove(deleting.id);
      setEntries((current) => (current ?? []).filter((entry) => entry.id !== deleting.id));
      setDeleting(undefined);
    } catch {
      setDeleteError(true);
    } finally {
      setDeletingBusy(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand"><img src={logo} alt="" width="28" height="28" /><span>Mesh</span></div>
          <nav aria-label="Principal">
            <button type="button" aria-current={screen === 'dashboard' ? 'page' : undefined} onClick={() => setScreen('dashboard')}>Dashboard</button>
            <button type="button" aria-current={screen === 'transactions' ? 'page' : undefined} onClick={() => setScreen('transactions')}>Lançamentos</button>
          </nav>
          <span className="local"><span aria-hidden="true" />Dados locais</span>
        </div>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <h1>{screen === 'dashboard' ? 'Dashboard' : 'Lançamentos'}</h1>
            <p>{screen === 'dashboard' ? 'Veja quanto entrou, quanto saiu e onde você gastou.' : 'Consulte e organize suas receitas e despesas.'}</p>
          </div>
          <button type="button" className="primary" disabled={!entries} onClick={() => setEditing(null)}>
            <span aria-hidden="true">+</span> Novo lançamento
          </button>
        </div>

        <section className="summary" aria-labelledby="summary-title">
          <div className="section-heading">
            <h2 id="summary-title">Resumo do mês</h2>
            <DatePicker label="Mês de referência" value={month} onChange={setMonth} monthOnly />
          </div>
          <dl className="metrics">
            <div className="balance"><dt>Saldo do mês</dt><dd>{entries ? money(income - expenses) : '—'}</dd></div>
            <div><dt>Receitas</dt><dd>{entries ? money(income) : '—'}</dd></div>
            <div><dt>Despesas</dt><dd>{entries ? money(expenses) : '—'}</dd></div>
          </dl>
        </section>

        {screen === 'dashboard' && entries ? (
          <Dashboard entries={monthEntries} onHistory={() => { setKind('all'); setQuery(''); setScreen('transactions'); }} />
        ) : <section className="ledger" aria-labelledby="ledger-title">
          <div className="section-heading ledger-heading">
            <div>
              <h2 id="ledger-title">Histórico</h2>
              {entries && <p aria-live="polite">{visible.length} {visible.length === 1 ? 'lançamento' : 'lançamentos'}</p>}
            </div>
            {screen === 'transactions' && <div className="filters">
              <input type="search" aria-label="Buscar lançamentos" placeholder="Buscar lançamentos" value={query} onChange={(event) => setQuery(event.target.value)} />
              <Choice label="Tipo de lançamento" value={kind} options={types} onChange={setKind} />
            </div>}
          </div>
          {!api ? <div className="empty"><p>Abra o Mesh no Electron para acessar seus lançamentos.</p></div>
            : loadError ? (
              <div className="empty" role="alert">
                <h3>Não foi possível carregar os lançamentos</h3>
                <button type="button" className="secondary" onClick={() => { setLoadError(false); setAttempt(attempt + 1); }}>Tentar novamente</button>
              </div>
            ) : !entries ? <div className="empty" role="status"><p>Carregando lançamentos…</p></div>
              : visible.length === 0 ? (
                <div className="empty">
                  <h3>{monthEntries.length ? 'Nenhum resultado' : 'Nenhum lançamento neste mês'}</h3>
                  <p>{monthEntries.length ? 'Altere a busca ou o filtro de tipo.' : 'Registre uma receita ou despesa para começar.'}</p>
                </div>
              ) : (
                <div className="table-wrap" role="region" aria-label="Tabela de lançamentos" tabIndex={0}>
                  <table role="table">
                    <thead><tr><th scope="col">Descrição</th><th scope="col">Categoria</th><th scope="col">Data</th><th scope="col" className="number">Valor</th><th scope="col" className="number">Ações</th></tr></thead>
                    <tbody role="rowgroup">
                      {visible.map((entry) => (
                        <tr key={entry.id} role="row">
                          <th scope="row">{entry.description}<span className="row-type">{entry.type === 'income' ? 'Receita' : 'Despesa'}</span></th>
                          <td>{entry.category}</td>
                          <td className="date"><time dateTime={entry.date}>{dateFormat.format(new Date(entry.date))}</time></td>
                          <td className="number amount">{entry.type === 'income' ? '+' : '−'}{money(entry.cents)}</td>
                          <td><div className="row-actions">
                            <button type="button" className="quiet" aria-label={`Editar ${entry.description}`} onClick={() => setEditing(entry)}>Editar</button>
                            <button type="button" className="quiet" aria-label={`Excluir ${entry.description}`} onClick={() => { setDeleteError(false); setDeleting(entry); }}>Excluir</button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
        </section>}
      </main>
      {editing !== undefined && <TransactionForm entry={editing} onSave={save} onClose={() => setEditing(undefined)} />}
      {deleting && (
        <Modal title="Excluir lançamento?" busy={deletingBusy} onClose={() => setDeleting(undefined)}>
          <p className="delete-copy">O lançamento <strong>{deleting.description}</strong> será removido do histórico.</p>
          {deleteError && <p className="error" role="alert">Não foi possível excluir. Tente novamente.</p>}
          <div className="dialog-actions">
            <button type="button" className="secondary" autoFocus disabled={deletingBusy} onClick={() => setDeleting(undefined)}>Cancelar</button>
            <button type="button" className="danger" disabled={deletingBusy} onClick={() => void remove()}>Confirmar exclusão</button>
          </div>
        </Modal>
      )}
    </>
  );
}
