export type InvoiceStatus = "paid" | "pending" | "overdue";

export type Company = {
  id: number;
  name: string;
  cnpj: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Supplier = {
  id: number;
  name: string;
  category: string;
  contact: string | null;
  email: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Webhook = {
  id: number;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggerAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Attachment = {
  id: number;
  invoiceId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type ApiInvoice = {
  id: number;
  supplierId: number;
  supplierName: string;
  companyId: number;
  companyName: string;
  companyCnpj: string;
  category: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  status: InvoiceStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceDetail = ApiInvoice & {
  attachments: Attachment[];
};

export type DashboardStats = {
  overdue: number;
  pending30d: number;
  paidMonth: number;
  countOverdue: number;
};


