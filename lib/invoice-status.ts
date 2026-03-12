import type { InvoiceStatus } from "./types";

const startOfDay = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export function deriveInvoiceStatus(dueDate: Date, paidAt: Date | null): InvoiceStatus {
  if (paidAt) {
    return "paid";
  }

  return dueDate < startOfDay(new Date()) ? "overdue" : "pending";
}

export function statusLabel(status: InvoiceStatus): string {
  if (status === "paid") return "Pago";
  if (status === "overdue") return "Atrasado";
  return "Pendente";
}


