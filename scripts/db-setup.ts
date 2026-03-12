import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const dbDir = path.dirname(dbPath);

const args = new Set(process.argv.slice(2));
const migrateOnly = args.has("--migrate-only");
const seedOnly = args.has("--seed-only");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

const migrate = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Company (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cnpj TEXT NOT NULL UNIQUE,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Supplier (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      contact TEXT,
      email TEXT,
      active BOOLEAN NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Invoice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplierId INTEGER NOT NULL,
      companyId INTEGER NOT NULL,
      category TEXT NOT NULL,
      amount DECIMAL NOT NULL,
      issueDate DATETIME NOT NULL,
      dueDate DATETIME NOT NULL,
      paidAt DATETIME,
      notes TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplierId) REFERENCES Supplier(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE RESTRICT ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Attachment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL,
      filename TEXT NOT NULL,
      originalName TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      size INTEGER NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoiceId) REFERENCES Invoice(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Webhook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      events TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT 1,
      lastTriggerAt DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS Invoice_companyId_idx ON Invoice(companyId);
    CREATE INDEX IF NOT EXISTS Invoice_supplierId_idx ON Invoice(supplierId);
    CREATE INDEX IF NOT EXISTS Invoice_dueDate_idx ON Invoice(dueDate);
    CREATE INDEX IF NOT EXISTS Attachment_invoiceId_idx ON Attachment(invoiceId);
  `);
};

const seed = () => {
  db.exec(`
    DELETE FROM Attachment;
    DELETE FROM Invoice;
    DELETE FROM Supplier;
    DELETE FROM Company;
    DELETE FROM Webhook;
    DELETE FROM sqlite_sequence WHERE name IN ('Attachment', 'Invoice', 'Supplier', 'Company', 'Webhook');
  `);

  const companies = [
    ["Matriz", "12.345.678/0001-90"],
    ["Fazenda Guapirama", "98.765.432/0001-11"],
    ["Fazenda Nebraska", "45.123.789/0001-22"],
    ["Fazenda Globo", "76.543.210/0001-33"]
  ];

  const suppliers = [
    ["Vivo Empresas", "Telecom", "0800 15 15 15", "contas@vivo.com.br", 1],
    ["CEMIG Energia", "Energia", "116", "faleconosco@cemig.com.br", 1],
    ["Thomson Reuters", "Software", "(11) 3003-0000", "financeiro@thomson.com", 1],
    ["Posto Ipiranga", "Combustivel", "(65) 3333-4444", "posto.fazenda@ipiranga.com", 1],
    ["AWS Cloud", "Infraestrutura", "Suporte Online", "billing@aws.com", 1],
    ["John Deere Pecas", "Manutencao", "(66) 9999-8888", "pecas@johndeere.com", 1],
    ["Totvs", "Software", "0800 70 70 70", "renovacao@totvs.com.br", 1]
  ];

  const cStmt = db.prepare("INSERT INTO Company (name, cnpj) VALUES (?, ?)");
  const sStmt = db.prepare("INSERT INTO Supplier (name, category, contact, email, active) VALUES (?, ?, ?, ?, ?)");

  for (const c of companies) cStmt.run(c[0], c[1]);
  for (const s of suppliers) sStmt.run(s[0], s[1], s[2], s[3], s[4]);

  const now = new Date();
  const addDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const invoices = [
    [1, 2, "Telecom", 890.5, addDays(-20), addDays(-3), null, "Conta movel matriz operacional"],
    [2, 2, "Energia", 3200, addDays(-25), addDays(-8), null, "Energia galpao"],
    [3, 1, "Software", 1500, addDays(-22), addDays(4), null, "Licencas fiscais"],
    [4, 3, "Combustivel", 450, addDays(-10), addDays(2), null, "Abastecimento caminhao"],
    [5, 1, "Infraestrutura", 120, addDays(-8), addDays(14), null, "Custos AWS mensal"],
    [6, 4, "Manutencao", 12500, addDays(-12), addDays(8), null, "Pecas colheitadeira"],
    [7, 1, "Software", 5600, addDays(-35), addDays(-15), addDays(-14), "Renovacao ERP"]
  ];
  const iStmt = db.prepare(
    "INSERT INTO Invoice (supplierId, companyId, category, amount, issueDate, dueDate, paidAt, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  for (const inv of invoices) iStmt.run(...inv);

  const hooks = [
    ["N8N - Alerta WhatsApp", "https://example.com/webhook/n8n", JSON.stringify(["invoice.overdue"]), 1],
    ["Slack Financeiro", "https://example.com/webhook/slack", JSON.stringify(["invoice.created", "invoice.updated", "invoice.paid"]), 1],
    ["ERP SAP (Integracao)", "https://example.com/webhook/sap", JSON.stringify(["invoice.paid"]), 0]
  ];
  const wStmt = db.prepare("INSERT INTO Webhook (name, url, events, active) VALUES (?, ?, ?, ?)");
  for (const hook of hooks) wStmt.run(...hook);
};

try {
  migrate();
  if (!migrateOnly && !seedOnly) {
    seed();
  }
  if (seedOnly) {
    seed();
  }
  console.log("Database setup concluido em", dbPath);
} finally {
  db.close();
}
