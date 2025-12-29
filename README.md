# 💎 Mesh Finance

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

> **Controle financeiro pessoal reimaginado.**

O **Mesh Finance** é um sistema de gestão financeira inteligente focado em **performance extrema** e **UX fluida**. Construído sobre as fundações mais modernas do React (Server Components, Server Actions), ele oferece uma interface **Glassmorphism** elegante, inspirada no design system da Apple, para gerenciar receitas, despesas e complexidades de cartões de crédito.

---

## ✨ Funcionalidades Principais

### 📊 Dashboard & Analytics

- Visão unificada de saldo atual e fluxo de caixa mensal.
- Gráficos interativos (Recharts) com design translúcido.
- Filtros inteligentes por período e categorias.

### 💳 Gestão Avançada de Crédito

- **Lógica de Fatura Real:** Cálculo automático baseado em datas de fechamento (Dia 08) e vencimento (Dia 10).
- **Parcelamento Inteligente:** Lançamento automático de compras parceladas nas faturas futuras.
- **Visão Focada:** Projeção de gastos limitada aos próximos 3 meses para foco financeiro.

### 🔄 Recorrência & Organização

- **Assinaturas:** Controle de pagamentos fixos (Netflix, Aluguel, etc.) com projeção futura.
- **Categorização:** Sistema flexível de categorias e contas bancárias.
- **Multi-tenancy:** Isolamento total de dados por usuário (cada conta Google vê apenas seus dados).

---

## 🚀 Stack Tecnológico

O projeto utiliza o que há de mais recente no ecossistema web (2025 Standard):

| Categoria          | Tecnologia                                                                            |
| :----------------- | :------------------------------------------------------------------------------------ |
| **Framework**      | [Next.js 15](https://nextjs.org/) (App Router & Server Actions)                       |
| **Linguagem**      | [TypeScript](https://www.typescriptlang.org/) (Strict Mode)                           |
| **Estilização**    | [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/ui](https://ui.shadcn.com/)        |
| **Banco de Dados** | [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/) (Serverless) |
| **ORM**            | [Prisma](https://www.prisma.io/) (v6+)                                                |
| **Autenticação**   | [Auth.js](https://authjs.dev/) (v5 Beta)                                              |
| **Validação**      | [Zod](https://zod.dev/)                                                               |
| **Formatação**     | ESLint + Prettier + Simple Import Sort                                                |

---

## 🛠️ Pré-requisitos

Certifique-se de ter instalado:

- **Node.js** (v18.17 ou superior)
- **NPM** ou **Yarn** ou **PNPM**
- Uma conta no **Neon DB** (ou um PostgreSQL local)
- Credenciais do **Google Cloud Console** (para OAuth)

---

## 📦 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/SEU-USUARIO/mesh.git
cd mesh
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto e preencha conforme o exemplo:

```env
# Banco de Dados (Neon/Postgres)
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# Autenticação (Auth.js / Google)
AUTH_SECRET="gere_um_segredo_com_openssl_rand_base64_32"
AUTH_GOOGLE_ID="seu-google-client-id"
AUTH_GOOGLE_SECRET="seu-google-client-secret"

# Configurações Gerais
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Configure o Banco de Dados

```bash
npx prisma generate
npx prisma db push
```

### 5. Execute o projeto

```bash
npm run dev
```

Acesse `http://localhost:3000` no seu navegador.

---

## 📂 Estrutura do Projeto

```
src/
├── app/
│   ├── actions/
│   ├── (auth)/
│   ├── dashboard/
│   └── transactions/
├── components/
│   ├── ui/
│   └── ...
├── lib/
│   ├── prisma.ts
│   └── transformers.ts
└── hooks/
```

---

## 🗺️ Roadmap e Próximos Passos

- [x] Refatoração de Tipos e Centralização (Transformers)
- [ ] UI Otimista (Optimistic Updates)
- [ ] Soft Delete
- [ ] Filtro Avançado (Date Range)
- [ ] Exportação CSV / Excel

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

<p align="center">
Feito por <a href="https://github.com/dougbadaro">Douglas Badaró</a>
</p>
