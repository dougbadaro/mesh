import { useId, useRef, useState, type ReactNode } from 'react';

const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });
const dayName = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });
const pad = (value: number) => String(value).padStart(2, '0'); // taste-skill-ignore: ISO date parts

function Popover({ label, value, calendar, children }: {
  label: string;
  value: string;
  calendar?: boolean;
  children(close: () => void): ReactNode;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = () => {
    panel.current?.hidePopover();
    trigger.current?.focus();
  };
  return (
    <div className="picker">
      <button ref={trigger} type="button" className="picker-trigger" popoverTarget={id} aria-label={label}
        aria-describedby={id + '-value'}>
        <span id={id + '-value'}>{value}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          {calendar
            ? <path d="M4 9h16M8 3v4m8-4v4M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
            : <path d="m6 9 6 6 6-6" />}
        </svg>
      </button>
      <div id={id} ref={panel} popover="auto" className={calendar ? 'picker-panel calendar' : 'picker-panel'} role="group" aria-label={label}>
        {children(close)}
      </div>
    </div>
  );
}

export function Choice({ label, value, options, onChange, placeholder = 'Selecione' }: {
  label: string;
  value: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  onChange(value: string): void;
  placeholder?: string;
}) {
  return (
    <Popover label={label} value={options.find((option) => option.value === value)?.label ?? placeholder}>
      {(close) => options.map((option) => (
        <button className="picker-option" type="button" key={option.value} aria-pressed={option.value === value}
          onClick={() => { onChange(option.value); close(); }}>
          {option.label}
          {option.value === value && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m5 12 4 4L19 6" />
            </svg>
          )}
        </button>
      ))}
    </Popover>
  );
}

export function DatePicker({ label, value, onChange, monthOnly = false }: {
  label: string;
  value: string;
  onChange(value: string): void;
  monthOnly?: boolean;
}) {
  const [view, setView] = useState({ value, month: value.slice(0, 7) });
  const cursor = view.value === value ? view.month : value.slice(0, 7);
  const first = new Date(cursor + '-01T00:00:00Z');
  const year = first.getUTCFullYear();
  const last = new Date(first);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  const offset = (first.getUTCDay() + 6) % 7;
  const changePeriod = (step: number) => {
    const next = new Date(first);
    next.setUTCMonth(next.getUTCMonth() + step);
    if (next.getUTCFullYear() >= 1 && next.getUTCFullYear() <= 9999) {
      setView({ value, month: next.toISOString().slice(0, 7) });
    }
  };
  const step = monthOnly ? 12 : 1;
  const choose = (selected: string, close: () => void) => {
    onChange(selected);
    setView({ value: selected, month: selected.slice(0, 7) });
    close();
  };

  return (
    <Popover label={label} calendar value={monthOnly ? monthName.format(new Date(value + '-01')) : dayName.format(new Date(value))}>
      {(close) => (
        <>
          <div className="calendar-header">
            <button type="button" aria-label={monthOnly ? 'Ano anterior' : 'Mês anterior'} onClick={() => changePeriod(-step)}>‹</button>
            <strong aria-live="polite">{monthOnly ? year : monthName.format(first)}</strong>
            <button type="button" aria-label={monthOnly ? 'Próximo ano' : 'Próximo mês'} onClick={() => changePeriod(step)}>›</button>
          </div>
          {monthOnly ? (
            <div className="month-grid">
              {Array.from({ length: 12 }, (_, index) => {
                const selected = `${String(year).padStart(4, '0')}-${pad(index + 1)}`;
                return <button type="button" key={selected} aria-pressed={selected === value}
                  onClick={() => choose(selected, close)}>{shortMonth.format(new Date(selected + '-01')).replace('.', '')}</button>;
              })}
            </div>
          ) : (
            <div className="day-grid">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}
              {Array.from({ length: offset }, (_, index) => <span key={index} aria-hidden="true" />)}
              {Array.from({ length: last.getUTCDate() }, (_, index) => {
                const day = index + 1;
                const selected = `${cursor}-${pad(day)}`;
                return <button type="button" key={selected} aria-pressed={selected === value}
                  aria-label={`Selecionar dia ${day} de ${monthName.format(first)}`}
                  onClick={() => choose(selected, close)}>{day}</button>;
              })}
            </div>
          )}
          <button type="button" className="calendar-today" onClick={() => {
            const now = new Date();
            const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
            choose(monthOnly ? local.slice(0, 7) : local, close);
          }}>{monthOnly ? 'Mês atual' : 'Hoje'}</button>
        </>
      )}
    </Popover>
  );
}
