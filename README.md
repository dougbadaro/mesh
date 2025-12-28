# Mesh Finance

Sistema de controle financeiro pessoal inteligente, desenvolvido com as tecnologias mais modernas do ecossistema React/Next.js. O projeto foca em performance, design moderno (Glassmorphism) e uma experiência de usuário fluida para gestão de receitas, despesas, cartões de crédito e assinaturas recorrentes.

## 🚀 Tecnologias

Este projeto foi construído utilizando uma stack moderna e robusta:

- **[Next.js 15](https://nextjs.org/)** (App Router & Server Actions)
- **[TypeScript](https://www.typescriptlang.org/)**
- **[Tailwind CSS](https://tailwindcss.com/)**
- **[Shadcn/ui](https://ui.shadcn.com/)** (Componentes de UI)
- **[Prisma ORM](https://www.prisma.io/)** (v7)
- **[Neon](https://neon.tech/)** (PostgreSQL Serverless)
- **[Auth.js](https://authjs.dev/)** (v5 - Autenticação com Google)
- **Zod** (Validação de dados)

## ✨ Funcionalidades

- **Dashboard Interativo:** Visão geral de saldo, receitas e despesas.
- **Gestão de Transações:** Adição de receitas e despesas com categorização.
- **Lógica de Cartão de Crédito:**
  - Controle inteligente de faturas (Fechamento dia 08 / Vencimento dia 10).
  - Suporte a parcelamento (lançamento automático das parcelas futuras).
  - Visualização limitada aos próximos 3 meses para foco financeiro.
- **Assinaturas Recorrentes:** Gestão de pagamentos fixos (Netflix, Aluguel, etc.) com projeção futura.
- **Multi-tenancy:** Dados isolados por usuário (cada conta Google vê apenas seus dados).
- **Design Moderno:** Interface com tema escuro e efeitos de vidro (Glassmorphism).

## 🛠️ Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (Versão 18 ou superior)
- Gerenciador de pacotes (NPM ou Yarn)

## 📦 Como rodar o projeto

1. **Clone o repositório**
   ```bash
   git clone [https://github.com/SEU-USUARIO/mesh.git](https://github.com/SEU-USUARIO/mesh.git)
   cd mesh
   ```
