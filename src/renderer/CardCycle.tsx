import { useEffect, useState, type FormEvent } from 'react';
import { cardCycleForDate, validCardCycle, type CardCycleSettings } from '../main/card-cycle';
import type { TransactionsApi } from '../main/transactions';
import { DatePicker } from './controls';
import { dateFormat } from './format';
import { today } from './TransactionForm';

const formatDate = (date: string) => dateFormat.format(new Date(date));

export function CardCycle({ api }: { api: TransactionsApi }) {
  const [settings, setSettings] = useState<CardCycleSettings | null>();
  const [purchase, setPurchase] = useState(today);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const cycle = settings ? cardCycleForDate(purchase, settings) : null;

  useEffect(() => {
    let active = true;
    void api.getCardCycle().then(
      (saved) => { if (active) setSettings(saved); },
      () => { if (active) setError('Não foi possível carregar o ciclo do cartão.'); },
    );
    return () => { active = false; };
  }, [api, attempt]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const draft = { closingDay: Number(data.get('closingDay')), dueDay: Number(data.get('dueDay')) };
    if (!validCardCycle(draft)) return;

    setBusy(true);
    setError('');
    try {
      await api.saveCardCycle(draft);
      setSettings(draft);
      setEditing(false);
    } catch {
      setError('Não foi possível salvar o ciclo do cartão.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="dashboard-panel card-cycle" aria-labelledby="card-cycle-heading">
      <div className="section-heading">
        <h2 id="card-cycle-heading">Melhor dia de compra</h2>
        {settings && !editing && <button type="button" className="quiet" onClick={() => setEditing(true)}>Editar ciclo</button>}
      </div>
      {settings === undefined && !error && <p className="dashboard-empty">Carregando ciclo…</p>}
      {settings === undefined && error && (
        <button type="button" className="secondary" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Tentar novamente</button>
      )}
      {(settings === null || editing) && (
        <form onSubmit={(event) => void save(event)}>
          <p className="cycle-note">Use os dias de fechamento e vencimento que aparecem no app do seu cartão.</p>
          <fieldset disabled={busy} className="form-grid cycle-fields">
            <label>Dia do fechamento
              <input name="closingDay" type="number" min={1} max={31} required defaultValue={settings?.closingDay} />
            </label>
            <label>Dia do vencimento
              <input name="dueDay" type="number" min={1} max={31} required defaultValue={settings?.dueDay} />
            </label>
          </fieldset>
          <div className="dialog-actions">
            {settings && <button type="button" className="secondary" disabled={busy} onClick={() => {
              setError('');
              setEditing(false);
            }}>Cancelar</button>}
            <button type="submit" className="primary" disabled={busy}>Salvar ciclo</button>
          </div>
        </form>
      )}
      {cycle && !editing && (
        <>
          <div className="section-heading cycle-purchase">
            <p>Data da compra</p>
            <DatePicker label="Data da compra" value={purchase} onChange={setPurchase} />
          </div>
          <dl className="metrics">
            <div className="balance"><dt>Vencimento estimado</dt><dd>{formatDate(cycle.due)}</dd></div>
            <div><dt>Fechamento no mês da compra</dt><dd>{formatDate(cycle.closing)}</dd></div>
            <div><dt>Primeiro dia após o fechamento</dt><dd>{formatDate(cycle.bestDay)}</dd></div>
          </dl>
          {cycle.alternativeDue && (
            <p className="cycle-note">Compra no dia do fechamento: pode cair em {formatDate(cycle.due)} ou {formatDate(cycle.alternativeDue)}, conforme o horário do corte.</p>
          )}
          <p className="cycle-note">A estimativa usa o ciclo configurado. Confira a fatura do banco se o fechamento mudar ou a compra levar mais tempo para ser processada.</p>
        </>
      )}
      {error && <p role="alert" className="error">{error}</p>}
    </section>
  );
}
