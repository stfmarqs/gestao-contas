import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(2),
  cnpj: z.string().min(14)
});

export const supplierSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  contact: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  active: z.boolean().optional()
});

export const invoiceSchema = z.object({
  supplierId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  category: z.string().min(2),
  amount: z.number().positive(),
  issueDate: z.string().min(10),
  dueDate: z.string().min(10),
  paidAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export const webhookSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
  events: z.array(z.string().min(3)).min(1),
  active: z.boolean().optional(),
  lastTriggerAt: z.string().optional().nullable()
});

export const invoiceEventSchema = z.enum([
  "invoice.created",
  "invoice.updated",
  "invoice.overdue",
  "invoice.paid"
]);


