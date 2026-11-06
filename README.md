# Mesh

App de finanças pessoais para organizar receitas e despesas, analisar gastos e projetar despesas futuras.

Base desktop em Electron, React, TypeScript e Vite. Use Node.js 22.13 ou superior.

```powershell
npm ci
npm start
```

`npm run dev` abre o Mesh no Electron com recarga automática. Alterações na interface React e no CSS aparecem ao salvar. Alterações no processo principal ou no preload reiniciam a janela após a compilação. O servidor local usa a porta 5173. Use `Ctrl+C` para encerrar.

`npm run dev:web` abre somente o servidor da interface para prévia no navegador. `npm start` compila e abre a versão desktop sem recarga automática.

- `src/main` contém a inicialização do Electron e o acesso ao SQLite. Os lançamentos manuais ficam no arquivo `mesh.sqlite` na pasta de dados do Mesh. Os valores são armazenados em centavos inteiros.
- `src/renderer` contém as telas React.
- `npm run lint`, `npm run typecheck` e `npm test` verificam a base. O teste compila e abre a janela real do Electron.

## Design

Use [UI UX Pro Max](https://www.uupm.cc/) para definir o sistema visual, os padrões de UX e a visualização dos dados. Use [Taste Skill](https://www.tasteskill.dev/docs#pages-and-app-screens) no modo `--app` para criar e revisar as telas, incluindo tabelas, gráficos e estados vazios.
