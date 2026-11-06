import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { URL } from 'node:url';
import { _electron } from 'playwright';

test('registra, edita e exclui lançamentos locais sem perder os dados ao reabrir', { timeout: 45_000 }, async () => {
  const profile = await mkdtemp(join(tmpdir(), 'financas-smoke-'));
  try {
    const desktop = await _electron.launch({ args: ['.', `--user-data-dir=${profile}`] });
    try {
      const page = await desktop.firstWindow();
      await page.getByText('Mesh', { exact: true }).waitFor({ timeout: 5000 });
      assert.equal(await page.title(), 'Mesh');
      assert.equal(new URL(page.url()).protocol, 'financas:');
      assert.equal(await page.evaluate(() => typeof globalThis.require), 'undefined');
      await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor({ timeout: 5000 });
      assert.equal(await desktop.evaluate(({ Menu }) => Menu.getApplicationMenu() === null), true);
      await page.waitForFunction(() => globalThis.document.querySelector('.brand img')?.naturalWidth > 0);
      const period = page.getByRole('button', { name: 'Mês de referência' });
      await period.click();
      await page.getByRole('button', { name: 'Ano anterior' }).click();
      await page.getByRole('button', { name: 'jan', exact: true }).click();
      await period.click();
      await page.getByRole('button', { name: 'Mês atual' }).click();
      await page.getByRole('button', { name: 'Lançamentos', exact: true }).click();
      await page.getByRole('heading', { name: 'Lançamentos', exact: true }).waitFor({ timeout: 5000 });
      await page.getByRole('button', { name: 'Novo lançamento' }).click();
      await page.getByLabel('Descrição').fill('Mercado do bairro');
      await page.getByLabel('Valor (R$)').fill('124,90');
      await page.getByRole('button', { name: 'Categoria', exact: true }).click();
      await page.getByRole('button', { name: 'Alimentação', exact: true }).click();
      const date = page.getByRole('button', { name: 'Data', exact: true });
      await date.click();
      await page.getByRole('button', { name: /Selecionar dia 1 de / }).click();
      await page.getByRole('button', { name: 'Salvar lançamento' }).click();
      await page.getByRole('row', { name: /Mercado do bairro.*124,90/ }).waitFor();
      const summary = page.getByRole('region', { name: 'Resumo do mês' });
      await summary.getByText(/^[-−]R\$\s*124,90$/).waitFor();
      await page.getByRole('button', { name: 'Tipo de lançamento', exact: true }).click();
      await page.getByRole('button', { name: 'Receitas', exact: true }).click();
      await page.getByText('Nenhum resultado').waitFor();
      await summary.getByText(/^[-−]R\$\s*124,90$/).waitFor();
    } finally {
      await desktop.close();
    }
    const reopened = await _electron.launch({ args: ['.', `--user-data-dir=${profile}`] });
    try {
      const page = await reopened.firstWindow();
      await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();
      await page.getByText('Mercado do bairro', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Lançamentos', exact: true }).click();
      const row = page.getByRole('row', { name: /Mercado do bairro.*124,90/ });
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
      await page.getByText('Nenhum lançamento neste mês').waitFor();
    } finally {
      await reopened.close();
    }
  } finally {
    await rm(profile, { recursive: true, force: true, maxRetries: 3 });
  }
});
