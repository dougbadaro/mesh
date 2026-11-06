import { useEffect, useRef, useState, type FormEvent } from 'react';
import { categories, maxInstallments, validInstallments, type Transaction, type TransactionDraft, type TransactionInput } from '../main/transactions';
import { Choice, DatePicker } from './controls';
import { parseReais } from './format';

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

export function TransactionForm({ entry, month, onSave, onClose }: {
  entry: Transaction | null;
  month: string;
  onSave(input: TransactionDraft, id?: number): Promise<void>;
  onClose(): void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState<TransactionInput['type']>(entry?.type ?? 'expense');
  const [category, setCategory] = useState<TransactionInput['category'] | ''>(entry?.category ?? '');
  const [date, setDate] = useState(() => {
    const currentDate = today();
    return entry?.date ?? (currentDate.startsWith(month) ? currentDate : month + '-01');
  });
  const [parcelled, setParcelled] = useState(false);
  const canParcel = !entry && type === 'expense';
  const isParcelled = canParcel && parcelled;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const cents = parseReais(String(fields.get('amount')));
    const description = String(fields.get('description')).trim();
    if (!description) return setError('Informe a descrição.');
    if (cents === null) return setError('Informe um valor válido, como R$ 1.234,56.');
    if (!cents) return setError('Informe um valor maior que zero.');
    if (!category) return setError('Selecione uma categoria.');
    const installments = isParcelled
      ? { current: Number(fields.get('current')), total: Number(fields.get('total')) }
      : undefined;
    if (installments && !validInstallments(installments)) {
      return setError('A parcela atual precisa estar entre 1 e o total de parcelas.');
    }
    if (isParcelled && description.length > 110) return setError('Use até 110 caracteres na descrição da compra.');

    setError('');
    setBusy(true);
    try {
      await onSave({
        description, date, cents,
        type, category, installments,
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
            <input name="description" required maxLength={isParcelled ? 110 : 120} autoFocus defaultValue={entry?.description} placeholder="Ex.: Mercado da semana" />
          </label>
          <div className="field"><span>Tipo</span>
            <Choice label="Tipo" value={type} options={types} onChange={(value) => setType(value as TransactionInput['type'])} />
          </div>
          <label>{isParcelled ? 'Valor da parcela (R$)' : 'Valor (R$)'}
            <input name="amount" inputMode="decimal" required maxLength={24} placeholder="0,00"
              defaultValue={entry ? (entry.cents / 100).toFixed(2).replace('.', ',') : ''} />
          </label>
          <div className="field"><span>Categoria</span>
            <Choice label="Categoria" value={category} options={categoryOptions}
              onChange={(value) => setCategory(value as TransactionInput['category'])} />
          </div>
          <div className="field"><span>{isParcelled ? 'Data da parcela atual' : 'Data'}</span>
            <DatePicker label={isParcelled ? 'Data da parcela atual' : 'Data'} value={date} onChange={setDate} />
          </div>
          {canParcel && (
            <label className="full installment-toggle">
              <input type="checkbox" checked={parcelled} onChange={(event) => setParcelled(event.target.checked)} />
              Compra parcelada
            </label>
          )}
          {isParcelled && (
            <>
              <label>Total de parcelas
                <input name="total" type="number" min={2} max={maxInstallments} step={1} required placeholder="Ex.: 24" />
              </label>
              <label>Parcela atual
                <input name="current" type="number" min={1} max={maxInstallments} step={1} required defaultValue={1} />
              </label>
              <p className="full installment-help">O Mesh registra a parcela atual e as seguintes, uma por mês.</p>
            </>
          )}
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
