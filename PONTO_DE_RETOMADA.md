# Ponto de Retomada MVP - Gestao de Contas a Pagar

## O que ja foi feito (checklist)
- [x] Projeto Next.js (App Router) com TypeScript, Tailwind e ESLint.
- [x] UI principal baseada no `index.html` (sidebar, tabs, dashboard, tabela, modais).
- [x] Prisma schema completo para Company, Supplier, Invoice, Attachment, Webhook.
- [x] Camada de services/utilitarios em `lib/` (status derivado, serializacao, CSV, http helpers).
- [x] APIs CRUD:
  - [x] `/api/companies` + `/api/companies/:id`
  - [x] `/api/suppliers` + `/api/suppliers/:id`
  - [x] `/api/invoices` + `/api/invoices/:id`
  - [x] `/api/webhooks` + `/api/webhooks/:id`
- [x] APIs de anexos e download por fatura.
- [x] API de exportacao CSV com filtros.
- [x] Tela de detalhe da fatura com upload/listagem/download de anexos.
- [x] Teste de webhook com timeout e retorno de erro controlado.
- [x] Banco SQLite inicializado com script idempotente (`scripts/db-setup.ts`) e seed.
- [x] Validacao de qualidade executada: `lint`, `typecheck`, `build`.

## O que falta (proximos 3-5 passos)
1. Completar UX de edicao/exclusao diretamente na UI para empresas/fornecedores/webhooks (API ja pronta).
2. Adicionar testes automatizados de API e regras de status.
3. Adicionar paginacao na lista de faturas para volume maior.
4. Evoluir upload local para storage externo (S3) mantendo metadados.
5. Endurecer seguranca (auth interna simples e validacoes de permissao).

## Como rodar o projeto (comandos)
```bash
npm install
npm run db:setup
npm run dev
```

Validacoes:
```bash
npm run lint
npm run typecheck
npm run build
```

## Decisoes ja tomadas (stack, versoes, pastas importantes)
- Stack: `Next.js 13 + TypeScript + Tailwind + Prisma Client + SQLite`.
- Runtime: compativel com Node 18.16 no ambiente atual.
- Persistencia: SQLite em `prisma/dev.db`.
- Pastas-chave:
  - `app/` paginas e route handlers
  - `components/` UI
  - `lib/` services e utilitarios
  - `prisma/` schema e migration SQL de referencia
  - `scripts/` bootstrap de banco
  - `uploads/` anexos locais

## Proximos passos
1. Subir `npm run dev` e validar fluxo fim a fim na UI.
2. Implementar botoes de editar/deletar na UI para fechar CRUD visual completo.
3. Incluir testes de regressao para status derivado e export CSV.