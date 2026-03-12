# Gestao de Contas a Pagar (MVP)

MVP interno para controle de contas a pagar, com foco em evitar vencimentos e juros.

## Stack
- Next.js 13 (App Router) + TypeScript
- Tailwind CSS
- Prisma Client + SQLite
- Upload local em `uploads/`

## Como rodar
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

## Funcionalidades MVP
- Dashboard: vencidas, a pagar 30 dias, pago no mes
- Faturas: listagem, filtros, alteracao de status, export CSV
- Fornecedores: CRUD basico (listar/criar/editar/delete via API)
- Empresas: CRUD basico (listar/criar/editar/delete via API)
- Webhooks: CRUD via API, ativar/desativar, teste com timeout
- Anexos: upload/listagem/download por fatura
- Detalhe de fatura: dados e anexos

## Endpoints principais
- `GET/POST /api/companies`
- `PUT/PATCH/DELETE /api/companies/:id`
- `GET/POST /api/suppliers`
- `PUT/PATCH/DELETE /api/suppliers/:id`
- `GET/POST /api/invoices`
- `GET/PUT/PATCH/DELETE /api/invoices/:id`
- `POST /api/invoices/:id/attachments`
- `GET /api/invoices/:id/attachments`
- `GET /api/invoices/:id/attachments/:attachmentId/download`
- `GET /api/invoices/export.csv`
- `GET/POST /api/webhooks`
- `PUT/PATCH/DELETE /api/webhooks/:id`
- `POST /api/webhooks/:id/test`

## Estrutura
- `app/` telas e APIs (Route Handlers)
- `components/` UI reaproveitando o layout do prototipo
- `lib/` camadas utilitarias e services
- `prisma/` schema, migration SQL e seed de referencia
- `scripts/db-setup.ts` bootstrap do banco SQLite
- `uploads/` arquivos anexados

## Assumptions
- O status da fatura eh derivado por regra: `paid` quando `paidAt` existe; senao `overdue` se `dueDate < hoje`; senao `pending`.
- Datas no backend sao ISO (`Date`/`ISOString`), exibicao no frontend em `pt-BR`.
- Para este ambiente, `prisma migrate`/`db push` apresentou erro de schema engine. Foi adotado `scripts/db-setup.ts` para criar schema e seed no SQLite, mantendo Prisma Client para acesso tipado.
- O arquivo `prisma/migrations/0001_init/migration.sql` documenta a estrutura do banco usada no bootstrap.
