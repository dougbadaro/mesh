import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { URL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { _electron } from 'playwright';
import { openTransactionStore } from '../dist/main/transaction-store.js';
import { cardCycleForDate } from '../dist/main/card-cycle.js';

test('calcula os vencimentos antes, no dia e depois do fechamento', () => {
  const settings = { closingDay: 28, dueDay: 5 };
  assert.equal(cardCycleForDate('2026-12-27', settings).due, '2027-01-05');
  assert.equal(cardCycleForDate('2026-12-28', settings).alternativeDue, '2027-02-05');
  assert.equal(cardCycleForDate('2026-12-29', settings).due, '2027-02-05');
  const shortMonth = cardCycleForDate('2027-02-27', { closingDay: 31, dueDay: 5 });
  assert.equal(shortMonth.closing, '2027-02-28');
  assert.equal(shortMonth.bestDay, '2027-03-01');
  assert.equal(cardCycleForDate('2026-11-11', { closingDay: 10, dueDay: 20 }).due, '2026-12-20');
});

test('grava a fatura das compras no crédito e encadeia as parcelas sem mudar a data da compra', () => {
  const store = openTransactionStore(':memory:');
  try {
    const draft = { description: 'Compra', type: 'expense', category: 'Mercado', cents: 5000, date: '2026-11-11', paymentMethod: 'credit' };
    const [legacy] = store.save(draft);
    store.saveCardCycle({ closingDay: 10, dueDay: 20 });
    assert.equal(store.list().find(({ id }) => id === legacy.id).billingMonth, null);
    const saved = store.save({ ...draft, installments: { current: 1, total: 3 } });
    assert.deepEqual(saved.map(({ date, billingMonth }) => [date, billingMonth]), [
      ['2026-11-11', '2026-12'], ['2026-12-11', '2027-01'], ['2027-01-11', '2027-02'],
    ]);
    assert.equal(store.save({ ...draft, billingMonth: '2026-11' }, saved[0].id)[0].billingMonth, '2026-11');
    assert.equal(store.save({ ...draft, paymentMethod: 'pix' })[0].billingMonth, null);
    store.saveCardCycle({ closingDay: 4, dueDay: 16 });
    const existingPlan = store.save({
      ...draft, description: 'Chuteira', date: '2026-10-07',
      installments: { current: 3, total: 4 },
    });
    assert.deepEqual(existingPlan.map(({ billingMonth }) => billingMonth), ['2026-10', '2026-11']);
    const unclassified = store.save({
      ...draft, description: 'Compra antiga', date: '2026-10-07', paymentMethod: null,
      installments: { current: 3, total: 4 },
    });
    assert.deepEqual(store.save({
      ...unclassified[0], paymentMethod: 'credit', applyPaymentToFuture: true,
    }, unclassified[0].id).map(({ billingMonth }) => billingMonth), ['2026-10', '2026-11']);
  } finally {
    store.close();
  }
});

test('abre um banco antigo e permite classificar um lançamento existente', async () => {
  const profile = await mkdtemp(join(tmpdir(), 'mesh-migration-'));
  const filename = join(profile, 'mesh.sqlite');
  try {
    const legacy = new DatabaseSync(filename);
    legacy.exec(`
      CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT NOT NULL, type TEXT NOT NULL,
        category TEXT NOT NULL, date TEXT NOT NULL, cents INTEGER NOT NULL
      ) STRICT;
      INSERT INTO transactions (description, type, category, date, cents)
      VALUES ('Compra antiga', 'expense', 'Mercado', '2026-10-01', 2500);
    `);
    legacy.close();
    const store = openTransactionStore(filename);
    try {
      assert.equal(store.getCardCycle(), null);
      assert.throws(() => store.saveCardCycle({ closingDay: 32, dueDay: 5 }));
      store.saveCardCycle({ closingDay: 25, dueDay: 5 });
      const [entry] = store.list();
      assert.equal(entry.paymentMethod, null);
      assert.throws(() => store.save({ ...entry, paymentMethod: 'inválido' }, entry.id));
      store.save({ ...entry, paymentMethod: 'credit' }, entry.id);
      assert.deepEqual(store.list().map((row) => ({ ...row })), [
        { ...entry, paymentMethod: 'credit', billingMonth: '2026-11' },
      ]);
    } finally {
      store.close();
    }
    const reopened = openTransactionStore(filename);
    try {
      assert.deepEqual({ ...reopened.getCardCycle() }, { closingDay: 25, dueDay: 5 });
      assert.equal(reopened.list()[0].paymentMethod, 'credit');
    } finally {
      reopened.close();
    }
  } finally {
    await rm(profile, { recursive: true, force: true, maxRetries: 3 });
  }
});

test('gera só as parcelas restantes e preserva o dia de vencimento quando possível', () => {
  const store = openTransactionStore(':memory:');
  try {
    const draft = { description: 'Moto', category: 'Transporte', type: 'expense', cents: 72716, date: '2027-01-31' };
    assert.throws(() => store.save({ ...draft, installments: { current: 25, total: 24 } }));
    assert.deepEqual(store.list(), []);
    const saved = store.save({ ...draft, installments: { current: 22, total: 24 } });
    assert.deepEqual(saved.map(({ description, date, cents }) => [description, date, cents]), [
      ['Moto (22/24)', '2027-01-31', 72716],
      ['Moto (23/24)', '2027-02-28', 72716],
      ['Moto (24/24)', '2027-03-31', 72716],
    ]);
    assert.equal(store.list().length, 3);
    const [first, second, third] = saved;
    store.save({ ...second, paymentMethod: 'pix' }, second.id);
    const [other] = store.save({ ...draft, description: 'Moto (24/24)', date: third.date });
    const updated = store.save({ ...first, paymentMethod: 'credit', applyPaymentToFuture: true }, first.id);
    assert.deepEqual(updated.map(({ id, paymentMethod }) => [id, paymentMethod]), [[first.id, 'credit'], [third.id, 'credit']]);
    assert.equal(store.list().find((entry) => entry.id === second.id).paymentMethod, 'pix');
    assert.equal(store.list().find((entry) => entry.id === other.id).paymentMethod, null);
  } finally {
    store.close();
  }
});

test('registra, edita e exclui lançamentos locais sem perder os dados ao reabrir', { timeout: 45_000 }, async () => {
  const profile = await mkdtemp(join(tmpdir(), 'financas-smoke-'));
  try {
    const desktop = await _electron.launch({ args: ['.', `--user-data-dir=${profile}`] });
    try {
      const page = await desktop.firstWindow();
      await page.getByText('Mesh', { exact: true }).waitFor({ timeout: 5000 });
      assert.equal(await page.title(), 'Mesh');
      assert.equal(await page.evaluate(() => globalThis.navigator.windowControlsOverlay?.visible), true);
      assert.equal(new URL(page.url()).protocol, 'financas:');
      assert.equal(await page.evaluate(() => typeof globalThis.require), 'undefined');
      await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor({ timeout: 5000 });
      assert.equal(await desktop.evaluate(({ Menu }) => Menu.getApplicationMenu() === null), true);
      await page.waitForFunction(() => globalThis.document.querySelector('.brand img')?.naturalWidth > 0);
      const period = page.getByRole('button', { name: 'Mês de referência' });
      await period.click();
      await page.getByRole('button', { name: 'Ano anterior' }).click();
      await page.getByRole('button', { name: 'jan', exact: true }).click();
      await page.getByRole('button', { name: 'Novo lançamento' }).click();
      assert.match(await page.getByRole('button', { name: 'Data', exact: true }).innerText(), /^01\/01\/\d{4}$/);
      await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await period.click();
      await page.getByRole('button', { name: 'Mês atual' }).click();
      await page.getByRole('button', { name: 'Lançamentos', exact: true }).click();
      await page.getByRole('heading', { name: 'Lançamentos', exact: true }).waitFor({ timeout: 5000 });
      await page.getByRole('button', { name: 'Novo lançamento' }).click();
      await page.getByLabel('Descrição').fill('Mercado do bairro');
      await page.getByLabel('Valor (R$)').fill('R$ 1.124,90');
      await page.getByRole('button', { name: 'Categoria', exact: true }).click();
      await page.getByRole('button', { name: 'Alimentação', exact: true }).click();
      await page.getByRole('button', { name: 'Forma de pagamento', exact: true }).click({ timeout: 5000 });
      await page.getByRole('group', { name: 'Forma de pagamento', exact: true })
        .getByRole('button', { name: 'Cartão de crédito', exact: true }).click();
      const date = page.getByRole('button', { name: 'Data', exact: true });
      await date.click();
      await page.getByRole('button', { name: /Selecionar dia 1 de / }).click();
      await page.getByRole('button', { name: 'Salvar lançamento' }).click();
      await page.getByRole('row', { name: /Mercado do bairro.*1\.124,90/ }).waitFor({ timeout: 5000 });
      const summary = page.getByRole('region', { name: 'Resumo do mês' });
      await summary.getByText(/^[-−]R\$\s*1\.124,90$/).waitFor();
      await page.evaluate(async () => {
        const api = globalThis.meshTransactions;
        const original = (await api.list()).find((entry) => entry.paymentMethod === 'credit');
        await api.save({ ...original, description: 'Compra via Pix', paymentMethod: 'pix', cents: 1000 });
        const next = new Date(original.date + 'T00:00:00Z');
        next.setUTCMonth(next.getUTCMonth() + 1);
        await api.save({ ...original, description: 'Parcela futura', date: next.toISOString().slice(0, 10), cents: 5000 });
      });
      await page.getByRole('button', { name: 'Novo lançamento' }).click();
      await page.getByLabel('Descrição').fill('Estacionamento');
      await page.getByLabel('Valor (R$)').fill('10,00');
      await page.getByRole('button', { name: 'Categoria', exact: true }).click();
      await page.getByRole('button', { name: 'Transporte', exact: true }).click();
      await page.getByRole('button', { name: 'Data', exact: true }).click();
      await page.getByRole('button', { name: 'Mês anterior', exact: true }).click();
      await page.getByRole('button', { name: /Selecionar dia 1 de / }).click();
      await page.getByRole('button', { name: 'Salvar lançamento' }).click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await page.getByRole('row', { name: /Mercado do bairro.*1\.124,90/ }).waitFor({ timeout: 5000 });
      await page.getByRole('status').filter({ hasText: /Salvo em 01\// }).waitFor();
      assert.equal(await page.evaluate(async () => (await globalThis.meshTransactions.list()).length), 4);
      await page.getByRole('button', { name: 'Tipo de lançamento', exact: true }).click();
      await page.getByRole('button', { name: 'Receitas', exact: true }).click();
      await page.getByText('Nenhum resultado').waitFor();
      await summary.getByText(/^[-−]R\$\s*1\.124,90$/).waitFor();
    } finally {
      await desktop.close();
    }
    const reopened = await _electron.launch({ args: ['.', `--user-data-dir=${profile}`] });
    try {
      const page = await reopened.firstWindow();
      await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();
      await page.getByText('Mercado do bairro', { exact: true }).waitFor();
      const payments = page.getByRole('region', { name: 'Despesas por forma de pagamento' });
      await payments.getByText('Cartão de crédito', { exact: true }).waitFor();
      await payments.getByText(/1\.124,90/).waitFor();
      await page.getByRole('navigation', { name: 'Principal' })
        .getByRole('button', { name: 'Cartão de crédito', exact: true }).click({ timeout: 5000 });
      await page.getByRole('heading', { name: 'Cartão de crédito', exact: true }).waitFor();
      const cycle = page.getByRole('region', { name: 'Melhor dia de compra' });
      await cycle.getByLabel('Dia do fechamento').fill('10');
      await cycle.getByLabel('Dia do vencimento').fill('20');
      await cycle.getByRole('button', { name: 'Salvar ciclo' }).click();
      await cycle.getByText('Vencimento estimado', { exact: true }).waitFor();
      assert.deepEqual(await page.evaluate(() => globalThis.meshTransactions.getCardCycle()), { closingDay: 10, dueDay: 20 });
      await page.getByRole('button', { name: 'Novo lançamento' }).click();
      await page.getByLabel('Descrição').fill('Compra após o fechamento');
      await page.getByLabel('Valor (R$)').fill('17,00');
      await page.getByRole('button', { name: 'Categoria', exact: true }).click();
      await page.getByRole('button', { name: 'Alimentação', exact: true }).click();
      await page.getByRole('button', { name: 'Data', exact: true }).click();
      await page.getByRole('button', { name: /Selecionar dia 11 de / }).click();
      await page.getByRole('button', { name: 'Salvar lançamento' }).click();
      await page.getByRole('status').filter({ hasText: /Fatura de / }).waitFor({ timeout: 5000 });
      assert.equal(await page.getByRole('row', { name: /Compra após o fechamento/ }).count(), 0);
      const credit = page.getByRole('region', { name: 'Resumo do cartão' });
      await credit.getByText('R$ 1.124,90', { exact: true }).first().waitFor();
      await page.getByRole('row', { name: /Mercado do bairro/ }).waitFor();
      assert.equal(await page.getByRole('row', { name: /Compra via Pix/ }).count(), 0);
      const upcoming = page.getByRole('region', { name: 'Crédito já lançado para os próximos meses' });
      await upcoming.getByText(/^R\$\s*67,00$/).waitFor({ timeout: 5000 });
      const posted = await page.evaluate(async () =>
        (await globalThis.meshTransactions.list()).find(({ description }) => description === 'Compra após o fechamento'));
      const invoice = new Date(posted.billingMonth + '-01T00:00:00Z');
      const invoiceMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }).format(invoice).replace('.', '');
      const invoicePicker = page.getByRole('button', { name: 'Mês da fatura', exact: true });
      await invoicePicker.click();
      if (invoice.getUTCMonth() === 0) await page.getByRole('button', { name: 'Próximo ano', exact: true }).click();
      await page.getByRole('button', { name: invoiceMonth, exact: true }).click();
      await page.getByRole('row', { name: /Compra após o fechamento/ }).waitFor();
      await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
      const statement = page.getByRole('region', { name: 'Extrato do mês' });
      await statement.getByText('Compra após o fechamento', { exact: true }).waitFor({ timeout: 5000 });
      await statement.getByText(/Compra em 11\//).waitFor();
      const dashboardSummary = page.getByRole('region', { name: 'Resumo do mês' });
      await dashboardSummary.getByText(/^R\$\s*67,00$/).waitFor();
      await page.getByRole('button', { name: 'Mês de referência', exact: true }).click();
      await page.getByRole('button', { name: 'Mês atual', exact: true }).click();
      assert.equal(await statement.getByText('Compra após o fechamento', { exact: true }).count(), 0);
      await page.getByRole('navigation', { name: 'Principal' }).getByRole('button', { name: 'Cartão de crédito', exact: true }).click();
      await invoicePicker.click();
      await page.getByRole('button', { name: 'Mês atual', exact: true }).click();
      assert.equal(await reopened.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isMaximized()), true);
      await page.getByRole('button', { name: 'Lançamentos', exact: true }).click();
      await page.getByRole('button', { name: 'Filtrar por forma de pagamento', exact: true }).click();
      await page.getByRole('button', { name: 'Pix', exact: true }).click();
      await page.getByRole('row', { name: /Compra via Pix/ }).waitFor();
      await page.getByRole('button', { name: 'Filtrar por forma de pagamento', exact: true }).click();
      await page.getByRole('button', { name: 'Todas as formas', exact: true }).click();
      const row = page.getByRole('row', { name: /Mercado do bairro.*1\.124,90/ });
      await row.waitFor();
      await page.getByLabel('Buscar lançamentos').fill('inexistente');
      await page.getByText('Nenhum resultado').waitFor();
      await page.getByLabel('Buscar lançamentos').clear();
      await row.getByRole('button', { name: /Editar/ }).click();
      await page.getByLabel('Valor (R$)').fill('0');
      await page.getByRole('button', { name: 'Salvar lançamento' }).click();
      await page.getByText('Informe um valor maior que zero.').waitFor();
      await page.getByLabel('Valor (R$)').fill('130,00');
      await page.getByRole('button', { name: 'Salvar lançamento' }).click();
      const edited = page.getByRole('row', { name: /Mercado do bairro.*130,00/ });
      await edited.getByRole('button', { name: /Excluir/ }).click();
      await page.getByRole('button', { name: 'Confirmar exclusão' }).click();
      await edited.waitFor({ state: 'hidden' });
      await page.getByRole('button', { name: 'Novo lançamento' }).click();
      await page.getByLabel('Compra parcelada').check();
      await page.getByLabel('Descrição').fill('Moto');
      await page.getByLabel('Valor da parcela (R$)').fill('R$ 727,16');
      await page.getByLabel('Total de parcelas').fill('24');
      await page.getByRole('spinbutton', { name: 'Parcela atual', exact: true }).fill('10');
      await page.getByRole('button', { name: 'Categoria', exact: true }).click();
      await page.getByRole('button', { name: 'Financiamento de veículo', exact: true }).click({ timeout: 5000 });
      await page.getByRole('button', { name: 'Salvar lançamento' }).click();
      const installment = page.getByRole('row', { name: /Moto \(10\/24\).*Financiamento de veículo.*727,16/ });
      await installment.getByRole('button', { name: /Editar/ }).click();
      await page.getByRole('button', { name: 'Forma de pagamento', exact: true }).click();
      await page.getByRole('group', { name: 'Forma de pagamento', exact: true })
        .getByRole('button', { name: 'Cartão de crédito', exact: true }).click();
      await page.getByLabel('Aplicar às próximas parcelas sem forma de pagamento').check();
      await page.getByRole('button', { name: 'Salvar lançamento' }).click();
      await page.getByRole('status').filter({ hasText: '14 parcelas futuras' }).waitFor();
      const entries = await page.evaluate(() => globalThis.meshTransactions.list());
      assert.equal(entries.length, 19);
      assert.equal(entries.filter((entry) => entry.description.startsWith('Moto ') && entry.paymentMethod === 'credit').length, 15);
    } finally {
      await reopened.close();
    }
  } finally {
    await rm(profile, { recursive: true, force: true, maxRetries: 3 });
  }
});
