import type { Company, Invoice, Supplier } from "@prisma/client";
import { deriveInvoiceStatus } from "@/lib/invoice-status";
import type { ApiInvoice, DashboardStats } from "@/lib/types";

export type InvoiceWithRelations = Invoice & {
  company: Company;
  supplier: Supplier;
};

export function serializeInvoice(invoice: InvoiceWithRelations): ApiInvoice {
  return {
    id: invoice.id,
    supplierId: invoice.supplierId,
    supplierName: invoice.supplier.name,
    companyId: invoice.companyId,
    companyName: invoice.company.name,
    companyCnpj: invoice.company.cnpj,
    category: invoice.category,
    amount: Number(invoice.amount),
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
    status: deriveInvoiceStatus(invoice.dueDate, invoice.paidAt),
    notes: invoice.notes,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString()
  };
}

export function buildDashboardStats(invoices: InvoiceWithRelations[]): DashboardStats {
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  return invoices.reduce<DashboardStats>(
    (acc, item) => {
      const amount = Number(item.amount);
      const status = deriveInvoiceStatus(item.dueDate, item.paidAt);

      if (status === "overdue") {
        acc.overdue += amount;
        acc.countOverdue += 1;
      }

      if (status === "pending" && item.dueDate <= in30Days) {
        acc.pending30d += amount;
      }

      if (status === "paid") {
        const paidAt = item.paidAt;
        if (paidAt && paidAt.getMonth() === now.getMonth() && paidAt.getFullYear() === now.getFullYear()) {
          acc.paidMonth += amount;
        }
      }

      return acc;
    },
    { overdue: 0, pending30d: 0, paidMonth: 0, countOverdue: 0 }
  );
}


