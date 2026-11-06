import { useEffect, useRef, useState, type FormEvent } from 'react';
import { categories, type Transaction, type TransactionInput } from '../main/transactions';
import { Choice, DatePicker } from './controls';

const types = [{ value: 'expense', label: 'Despesa' }, { value: 'income', label: 'Receita' }];
const categoryOptions = categories.map((category) => ({ value: category, label: category }));

export function today() {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function Modal({ children, title, busy, onClose }: {
  children: React.ReactNode;
  title: string;
  busy: boolean;
  onClose(): void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog ref={dialog} aria-labelledby="modal-title" onCancel={(event) => {
      event.preventDefault();
      if (!busy) onClose();
    }}>
      <h2 id="modal-title">{title}</h2>
      {children}
    </dialog>
  );
}

export function TransactionForm({ entry, onSave, onClose }: {
  entry: Transaction | null;
  onSave(input: TransactionInput, id?: number): Promise<void>;
  onClose(): void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState<TransactionInput['type']>(entry?.type ?? 'expense');
  const [category, setCategory] = useState<TransactionInput['category'] | ''>(entry?.category ?? '');
  const [date, setDate] = useState(entry?.date ?? today());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const amount = String(fields.get('amount')).trim();
    const description = String(fields.get('description')).trim();
    if (!description) return setError('Informe a descrição.');
    if (!/^\d{1,10}(?:[,.]\d{1,2})?$/.test(amount)) {
      return setError('Use até duas casas decimais, como 42,90.');
    }
    const [whole, fraction = ''] = amount.split(/[,.]/);
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    if (!cents) return setError('Informe um valor maior que zero.');
    if (!category) return setError('Selecione uma categoria.');

    setError('');
    setBusy(true);
    try {
      await onSave({
        description, date, cents,
        type, category,
      }, entry?.id);
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
      setBusy(false);
    }
  }

  return (
    <Modal title={entry ? 'Editar lançamento' : 'Novo lançamento'} busy={busy} onClose={onClose}>
      <form onSubmit={(event) => void submit(event)}>
        <fieldset disabled={busy} className="form-grid">
          <label className="full">Descrição
            <input name="description" required maxLength={120} autoFocus defaultValue={entry?.description} placeholder="Ex.: Mercado da semana" />
          </label>
          <div className="field"><span>Tipo</span>
            <Choice label="Tipo" value={type} options={types} onChange={(value) => setType(value as TransactionInput['type'])} />
          </div>
          <label>Valor (R$)
            <input name="amount" inputMode="decimal" required maxLength={13} placeholder="0,00"
              defaultValue={entry ? (entry.cents / 100).toFixed(2).replace('.', ',') : ''} />
          </label>
          <div className="field"><span>Categoria</span>
            <Choice label="Categoria" value={category} options={categoryOptions}
              onChange={(value) => setCategory(value as TransactionInput['category'])} />
          </div>
          <div className="field"><span>Data</span>
            <DatePicker label="Data" value={date} onChange={setDate} />
          </div>
        </fieldset>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar lançamento'}</button>
        </div>
      </form>
    </Modal>
  );
}
