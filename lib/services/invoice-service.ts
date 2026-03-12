import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { deriveInvoiceStatus } from "@/lib/invoice-status";
import { buildDashboardStats, serializeInvoice } from "@/lib/serializers";
import type { ApiInvoice, DashboardStats, InvoiceStatus } from "@/lib/types";

export type InvoiceFilters = {
  companyId?: number;
  supplierId?: number;
  search?: string;
  category?: string;
  status?: InvoiceStatus;
  dueFrom?: Date;
  dueTo?: Date;
};

const includeRelations = {
  company: true,
  supplier: true,
  attachments: true
} satisfies Prisma.InvoiceInclude;

const buildWhere = (filters: InvoiceFilters): Prisma.InvoiceWhereInput => {
  const where: Prisma.InvoiceWhereInput = {};

  if (filters.companyId) {
    where.companyId = filters.companyId;
  }

  if (filters.supplierId) {
    where.supplierId = filters.supplierId;
  }

  if (filters.category) {
    where.category = { contains: filters.category };
  }

  if (filters.search) {
    where.OR = [
      { supplier: { name: { contains: filters.search } } },
      { category: { contains: filters.search } },
      { notes: { contains: filters.search } }
    ];
  }

  if (filters.dueFrom || filters.dueTo) {
    where.dueDate = {};
    if (filters.dueFrom) {
      where.dueDate.gte = filters.dueFrom;
    }
    if (filters.dueTo) {
      where.dueDate.lte = filters.dueTo;
    }
  }

  return where;
};

export async function listInvoices(filters: InvoiceFilters): Promise<ApiInvoice[]> {
  const where = buildWhere(filters);
  const invoices = await prisma.invoice.findMany({
    where,
    include: includeRelations,
    orderBy: { dueDate: "asc" }
  });

  const serialized = invoices.map((item) => serializeInvoice(item));
  if (!filters.status) {
    return serialized;
  }

  return serialized.filter((item) => item.status === filters.status);
}

export async function listInvoicesForDashboard(companyId?: number): Promise<{ invoices: ApiInvoice[]; stats: DashboardStats }> {
  const invoices = await prisma.invoice.findMany({
    where: companyId ? { companyId } : undefined,
    include: { company: true, supplier: true },
    orderBy: { dueDate: "asc" }
  });

  return {
    invoices: invoices.map((item) => serializeInvoice(item)),
    stats: buildDashboardStats(invoices)
  };
}

export async function getInvoiceById(id: number) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: includeRelations
  });

  if (!invoice) {
    return null;
  }

  return {
    ...serializeInvoice(invoice),
    attachments: invoice.attachments.map((item) => ({
      id: item.id,
      invoiceId: item.invoiceId,
      filename: item.filename,
      originalName: item.originalName,
      mimeType: item.mimeType,
      size: item.size,
      createdAt: item.createdAt.toISOString()
    }))
  };
}

export async function createInvoice(input: {
  supplierId: number;
  companyId: number;
  category: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  paidAt?: string | null;
  notes?: string | null;
}): Promise<ApiInvoice> {
  const created = await prisma.invoice.create({
    data: {
      supplierId: input.supplierId,
      companyId: input.companyId,
      category: input.category,
      amount: new Prisma.Decimal(input.amount),
      issueDate: new Date(input.issueDate),
      dueDate: new Date(input.dueDate),
      paidAt: input.paidAt ? new Date(input.paidAt) : null,
      notes: input.notes ?? null
    },
    include: { company: true, supplier: true }
  });

  return serializeInvoice(created);
}

export async function updateInvoice(
  id: number,
  input: Partial<{
    supplierId: number;
    companyId: number;
    category: string;
    amount: number;
    issueDate: string;
    dueDate: string;
    paidAt: string | null;
    notes: string | null;
    status: InvoiceStatus;
  }>
): Promise<ApiInvoice | null> {
  const data: Prisma.InvoiceUpdateInput = {};

  if (typeof input.supplierId === "number") data.supplier = { connect: { id: input.supplierId } };
  if (typeof input.companyId === "number") data.company = { connect: { id: input.companyId } };
  if (typeof input.category === "string") data.category = input.category;
  if (typeof input.amount === "number") data.amount = new Prisma.Decimal(input.amount);
  if (typeof input.issueDate === "string") data.issueDate = new Date(input.issueDate);
  if (typeof input.dueDate === "string") data.dueDate = new Date(input.dueDate);
  if (input.notes !== undefined) data.notes = input.notes;

  if (input.status) {
    if (input.status === "paid") {
      data.paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
    }
    if (input.status === "pending" || input.status === "overdue") {
      data.paidAt = null;
    }
  } else if (input.paidAt !== undefined) {
    data.paidAt = input.paidAt ? new Date(input.paidAt) : null;
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data,
    include: { company: true, supplier: true }
  }).catch(() => null);

  return updated ? serializeInvoice(updated) : null;
}

export async function deleteInvoice(id: number): Promise<boolean> {
  const deleted = await prisma.invoice.delete({ where: { id } }).catch(() => null);
  return Boolean(deleted);
}

export function isInvoiceOverdue(invoice: ApiInvoice): boolean {
  return deriveInvoiceStatus(new Date(invoice.dueDate), invoice.paidAt ? new Date(invoice.paidAt) : null) === "overdue";
}


