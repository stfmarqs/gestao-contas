import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.attachment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.company.deleteMany();
  await prisma.webhook.deleteMany();

  const companies = await prisma.$transaction([
    prisma.company.create({ data: { name: "Matriz", cnpj: "12.345.678/0001-90" } }),
    prisma.company.create({ data: { name: "Fazenda Guapirama", cnpj: "98.765.432/0001-11" } }),
    prisma.company.create({ data: { name: "Fazenda Nebraska", cnpj: "45.123.789/0001-22" } }),
    prisma.company.create({ data: { name: "Fazenda Globo", cnpj: "76.543.210/0001-33" } })
  ]);

  const suppliers = await prisma.$transaction([
    prisma.supplier.create({ data: { name: "Vivo Empresas", category: "Telecom", contact: "0800 15 15 15", email: "contas@vivo.com.br", active: true } }),
    prisma.supplier.create({ data: { name: "CEMIG Energia", category: "Energia", contact: "116", email: "faleconosco@cemig.com.br", active: true } }),
    prisma.supplier.create({ data: { name: "Thomson Reuters", category: "Software", contact: "(11) 3003-0000", email: "financeiro@thomson.com", active: true } }),
    prisma.supplier.create({ data: { name: "Posto Ipiranga", category: "Combustível", contact: "(65) 3333-4444", email: "posto.fazenda@ipiranga.com", active: true } }),
    prisma.supplier.create({ data: { name: "AWS Cloud", category: "Infraestrutura", contact: "Suporte Online", email: "billing@aws.com", active: true } }),
    prisma.supplier.create({ data: { name: "John Deere Peças", category: "Manutenção", contact: "(66) 9999-8888", email: "pecas@johndeere.com", active: true } }),
    prisma.supplier.create({ data: { name: "Totvs", category: "Software", contact: "0800 70 70 70", email: "renovacao@totvs.com.br", active: true } })
  ]);

  const now = new Date();
  const addDays = (base: Date, days: number) => {
    const copy = new Date(base);
    copy.setDate(copy.getDate() + days);
    return copy;
  };

  await prisma.invoice.createMany({
    data: [
      {
        supplierId: suppliers[0].id,
        companyId: companies[1].id,
        category: "Telecom",
        amount: 890.5,
        issueDate: addDays(now, -20),
        dueDate: addDays(now, -3),
        paidAt: null,
        notes: "Conta móvel matriz operacional"
      },
      {
        supplierId: suppliers[1].id,
        companyId: companies[1].id,
        category: "Energia",
        amount: 3200,
        issueDate: addDays(now, -25),
        dueDate: addDays(now, -8),
        paidAt: null,
        notes: "Energia galpão"
      },
      {
        supplierId: suppliers[2].id,
        companyId: companies[0].id,
        category: "Software",
        amount: 1500,
        issueDate: addDays(now, -22),
        dueDate: addDays(now, 4),
        paidAt: null,
        notes: "Licenças fiscais"
      },
      {
        supplierId: suppliers[3].id,
        companyId: companies[2].id,
        category: "Combustível",
        amount: 450,
        issueDate: addDays(now, -10),
        dueDate: addDays(now, 2),
        paidAt: null,
        notes: "Abastecimento caminhão"
      },
      {
        supplierId: suppliers[4].id,
        companyId: companies[0].id,
        category: "Infraestrutura",
        amount: 120,
        issueDate: addDays(now, -8),
        dueDate: addDays(now, 14),
        paidAt: null,
        notes: "Custos AWS mensal"
      },
      {
        supplierId: suppliers[5].id,
        companyId: companies[3].id,
        category: "Manutenção",
        amount: 12500,
        issueDate: addDays(now, -12),
        dueDate: addDays(now, 8),
        paidAt: null,
        notes: "Peças colheitadeira"
      },
      {
        supplierId: suppliers[6].id,
        companyId: companies[0].id,
        category: "Software",
        amount: 5600,
        issueDate: addDays(now, -35),
        dueDate: addDays(now, -15),
        paidAt: addDays(now, -14),
        notes: "Renovação ERP"
      }
    ]
  });

  await prisma.webhook.createMany({
    data: [
      {
        name: "N8N - Alerta WhatsApp",
        url: "https://example.com/webhook/n8n",
        events: JSON.stringify(["invoice.overdue"]),
        active: true
      },
      {
        name: "Slack Financeiro",
        url: "https://example.com/webhook/slack",
        events: JSON.stringify(["invoice.created", "invoice.updated", "invoice.paid"]),
        active: true
      },
      {
        name: "ERP SAP (Integração)",
        url: "https://example.com/webhook/sap",
        events: JSON.stringify(["invoice.paid"]),
        active: false
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

